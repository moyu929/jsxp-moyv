import { readdirSync, unlinkSync, existsSync, statSync } from "fs";
import { join } from "path";

/** 任务管理器 */
const taskMap = new Map<string, number>();

/** 文件复用锁，防止多个任务同时复用同一文件 */
const reusableFileLocks = new Set<string>();

/** 创建新任务 */
export function createTask(name: string): string {
  // 使用更短的时间戳格式
  const timestamp = (Date.now() % 1000000).toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  const taskId = `${name}_${timestamp}_${random}`;
  // 将任务添加到任务管理器
  taskMap.set(taskId, Date.now());
  return taskId;
}

/** 清理已完成任务 */
export function cleanupTask(taskId: string): void {
  const task = taskMap.get(taskId);
  if (task) taskMap.delete(taskId);
}

/**
 * 查找并原子锁定可复用的已完成任务文件
 */
export function findAndLockReusableFile(targetDir: string): string | null {
  try {
    if (!existsSync(targetDir)) return null;
    const files = readdirSync(targetDir).filter((f) => f.endsWith(".html"));

    // 获取文件信息并按修改时间排序（最旧的优先）
    const fileInfos = files
      .map((file) => {
        const filePath = join(targetDir, file);
        const stats = existsSync(filePath) ? statSync(filePath) : null;
        return {
          file,
          filePath,
          taskId: file,
          mtime: stats ? stats.mtime.getTime() : 0,
        };
      })
      .sort((a, b) => a.mtime - b.mtime);

    // 原子锁定：使用同步锁机制防止竞态条件
    const minAge = 5000; // 文件必须至少5秒前创建，确保任务已完成
    const now = Date.now();

    for (const fileInfo of fileInfos) {
      const { file, filePath, taskId, mtime } = fileInfo;
      const fileAge = now - mtime;

      // 原子检查：一次性检查所有条件并立即锁定
      if (
        !taskMap.has(taskId) && // 任务不在活跃任务中
        !reusableFileLocks.has(filePath) && // 文件未被其他任务锁定
        fileAge > minAge // 文件足够旧，确保任务已完成
      ) {
        // 立即尝试锁定文件（原子操作）
        if (!reusableFileLocks.has(filePath)) {
          reusableFileLocks.add(filePath);

          // 双重检查：锁定后再次确认任务状态
          if (!taskMap.has(taskId)) {
            return file;
          } else {
            // 如果任务状态发生变化，释放锁定
            reusableFileLocks.delete(filePath);
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error("[jsxp] 查找可复用文件失败:", error);
    return null;
  }
}

/**
 * 释放文件复用锁
 */
export function releaseReusableLock(filePath: string): void {
  if (reusableFileLocks.has(filePath)) {
    reusableFileLocks.delete(filePath);
  }
}

/**
 * 清理已完成任务的HTML文件
 */
export function cleanupCompletedFiles(
  targetDir: string,
  keepCount: number = 2
): void {
  try {
    if (!existsSync(targetDir)) return;
    const files = readdirSync(targetDir)
      .filter((f) => f.endsWith(".html"))
      .map((file) => {
        const filePath = join(targetDir, file);
        return {
          file,
          filePath,
          isActive: taskMap.has(file),
        };
      });

    // 获取已完成的文件（不在taskMap中且未被锁定的）
    const completedFiles = files.filter(
      (f) => !f.isActive && !reusableFileLocks.has(f.filePath)
    );
    // 如果已完成文件数量超过保留数量，删除多余的
    if (completedFiles.length > keepCount) {
      const filesToDelete = completedFiles.slice(keepCount);
      filesToDelete.forEach(({ filePath, file }) => {
        try {
          // 再次检查文件是否被锁定（防止竞态条件）
          if (!reusableFileLocks.has(filePath)) {
            unlinkSync(filePath);
          }
        } catch (error) {
          console.error(`[jsxp] 删除文件失败 ${file}:`, error);
        }
      });
    }
  } catch (error) {
    console.error("[jsxp] 清理已完成文件失败:", error);
  }
}

/**
 * 启动定时清理器
 */
export function startCleanupTimer(
  targetDir: string,
  intervalMinutes: number = 5,
  keepCount: number = 2
): void {
  const intervalMs = intervalMinutes * 60 * 1000;
  setInterval(() => {
    cleanupCompletedFiles(targetDir, keepCount);
  }, intervalMs);
  console.log(`[jsxp] 定时清理器已启动，每 ${intervalMinutes} 分钟清理一次`);
}

export { taskMap };
