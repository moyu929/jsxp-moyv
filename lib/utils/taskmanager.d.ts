/**
 * 任务管理器类型定义
 * 提供任务创建、清理和文件管理的功能
 */

/** 
 * 任务映射表
 * 存储任务ID和对应的状态或时间戳
 */
declare const taskMap: Map<string, number>

/** 
 * 创建新任务
 * @param name - 任务名称
 * @returns 生成的任务ID
 */
declare function createTask(name: string): string

/** 
 * 清理已完成任务
 * @param taskId - 要清理的任务ID
 */
declare function cleanupTask(taskId: string): void

/** 
 * 查找并原子锁定可复用的已完成任务文件
 * @param targetDir - 目标目录路径
 * @returns 可复用文件的路径，如果没有则返回 null
 */
declare function findAndLockReusableFile(targetDir: string): string | null

/** 
 * 释放文件复用锁
 * @param filePath - 要释放锁的文件路径
 */
declare function releaseReusableLock(filePath: string): void

/** 
 * 清理已完成任务的HTML文件
 * @param targetDir - 目标目录路径
 * @param keepCount - 要保留的文件数量，默认为保留所有文件
 */
declare function cleanupCompletedFiles(targetDir: string, keepCount?: number): void

/** 
 * 启动定时清理器
 * @param targetDir - 目标目录路径
 * @param intervalMinutes - 清理间隔分钟数，默认为30分钟
 * @param keepCount - 每次清理要保留的文件数量，默认为保留所有文件
 */
declare function startCleanupTimer(targetDir: string, intervalMinutes?: number, keepCount?: number): void

export { 
  taskMap, 
  createTask, 
  cleanupTask, 
  findAndLockReusableFile, 
  releaseReusableLock, 
  cleanupCompletedFiles, 
  startCleanupTimer 
}