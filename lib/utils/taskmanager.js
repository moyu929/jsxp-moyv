import { readdirSync, unlinkSync, existsSync, statSync } from 'fs'
import { join } from 'path'

/** 任务管理器 */
const taskMap = new Map()

/** 文件复用锁，防止多个任务同时复用同一文件 */
const reusableFileLocks = new Set()

/** 创建新任务 */
function createTask(name) {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  const taskId = `${name}_${timestamp}_${random}`
  // 将任务添加到任务管理器
  taskMap.set(taskId, Date.now())
  return taskId
}

/** 清理已完成任务 */
function cleanupTask(taskId) {
  const task = taskMap.get(taskId)
  if (task) taskMap.delete(taskId)
}

/**
 * 查找并原子锁定可复用的已完成任务文件
 * @param {string} targetDir 目标目录
 * @returns {string|null} 可复用的文件名，如果没有则返回null
 */
function findAndLockReusableFile(targetDir) {
  try {
    if (!existsSync(targetDir)) return null
    const files = readdirSync(targetDir).filter(f => f.endsWith('.html'))

    // 获取文件信息并按修改时间排序（最旧的优先）
    const fileInfos = files
      .map(file => {
        const filePath = join(targetDir, file)
        const stats = existsSync(filePath) ? statSync(filePath) : null
        return {
          file,
          filePath,
          taskId: file,
          mtime: stats ? stats.mtime.getTime() : 0
        }
      })
      .sort((a, b) => a.mtime - b.mtime)

    // 原子锁定：使用同步锁机制防止竞态条件
    const minAge = 5000 // 文件必须至少5秒前创建，确保任务已完成
    const now = Date.now()

    for (const fileInfo of fileInfos) {
      const { file, filePath, taskId, mtime } = fileInfo
      const fileAge = now - mtime

      // 原子检查：一次性检查所有条件并立即锁定
      if (
        !taskMap.has(taskId) &&           // 任务不在活跃任务中
        !reusableFileLocks.has(filePath) && // 文件未被其他任务锁定
        fileAge > minAge                   // 文件足够旧，确保任务已完成
      ) {
        // 立即尝试锁定文件（原子操作）
        if (!reusableFileLocks.has(filePath)) {
          reusableFileLocks.add(filePath)
          
          // 双重检查：锁定后再次确认任务状态
          if (!taskMap.has(taskId)) {
            return file
          } else {
            // 如果任务状态发生变化，释放锁定
            reusableFileLocks.delete(filePath)
          }
        }
      }
    }

    return null
  } catch (error) {
    console.error('[jsxp] 查找可复用文件失败:', error)
    return null
  }
}

/**
 * 释放文件复用锁
 * @param {string} filePath 文件路径
 */
function releaseReusableLock(filePath) {
  if (reusableFileLocks.has(filePath)) {
    reusableFileLocks.delete(filePath)
  }
}

/**
 * 清理已完成任务的HTML文件
 * @param {string} targetDir 目标目录
 * @param {number} keepCount 保留文件数量，默认保留2个
 */
function cleanupCompletedFiles(targetDir, keepCount = 2) {
  try {
    if (!existsSync(targetDir)) return
    const files = readdirSync(targetDir)
      .filter(f => f.endsWith('.html'))
      .map(file => {
        const filePath = join(targetDir, file)
        return {
          file,
          filePath,
          isActive: taskMap.has(file)
        }
      })

    // 获取已完成的文件（不在taskMap中且未被锁定的）
    const completedFiles = files.filter(f => !f.isActive && !reusableFileLocks.has(f.filePath))
    // 如果已完成文件数量超过保留数量，删除多余的
    if (completedFiles.length > keepCount) {
      const filesToDelete = completedFiles.slice(keepCount)
      filesToDelete.forEach(({ filePath, file }) => {
        try {
          // 再次检查文件是否被锁定（防止竞态条件）
          if (!reusableFileLocks.has(filePath)) {
            unlinkSync(filePath)
          }
        } catch (error) {
          console.error(`[jsxp] 删除文件失败 ${file}:`, error)
        }
      })
    }
  } catch (error) {
    console.error('[jsxp] 清理已完成文件失败:', error)
  }
}

/**
 * 启动定时清理器
 * @param {string} targetDir 目标目录
 * @param {number} intervalMinutes 清理间隔（分钟），默认5分钟
 * @param {number} keepCount 保留文件数量，默认保留2个
 */
function startCleanupTimer(targetDir, intervalMinutes = 5, keepCount = 2) {
  const intervalMs = intervalMinutes * 60 * 1000
  setInterval(() => {
    cleanupCompletedFiles(targetDir, keepCount)
  }, intervalMs)
  console.log(`[jsxp] 定时清理器已启动，每 ${intervalMinutes} 分钟清理一次`)
}

export {
  taskMap,
  createTask,
  cleanupTask,
  findAndLockReusableFile,
  releaseReusableLock,
  cleanupCompletedFiles,
  startCleanupTimer
}
