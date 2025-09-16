/**
 * 任务管理器
 * 用于管理任务ID和任务状态的映射关系
 * @type {Map<string, number>}
 */
declare const taskMap: Map<string, number>;
/**
 * 创建新任务
 * @function createTask
 * @param {string} name - 任务名称
 * @returns {string} 任务唯一标识符
 */
export declare function createTask(name: string): string;
/**
 * 清理已完成任务
 * @function cleanupTask
 * @param {string} task极 - 任务ID
 */
export declare function cleanupTask(taskId: string): void;
/**
 * 查找并原子锁定可复用的已完成任务文件
 * @function findAndLockReusableFile
 * @param {string} targetDir - 目标目录路径
 * @returns {string|null} 可复用的文件名，如果没有则返回null
 */
export declare function findAndLockReusableFile(targetDir: string): string | null;
/**
 * 释放文件复用锁
 * @function releaseReusableLock
 * @param {string} filePath - 文件路径
 */
export declare function releaseReusableLock(filePath: string): void;
/**
 * 清理已完成任务的HTML文件
 * @function cleanupCompletedFiles
 * @param {string} targetDir - 目标目录路径
 * @param {number} [keepCount=2] - 保留的文件数量，默认为2
 */
export declare function cleanupCompletedFiles(targetDir: string, keepCount?: number): void;
/**
 * 启动定时清理器
 * @function startCleanupTimer
 * @param {string} targetDir - 目标目录路径
 * @param {number} [intervalMinutes=5] - 清理间隔分钟数，默认为5
 * @param {number} [keepCount=2] - 保留的文件数量，默认为2
 */
export declare function startCleanupTimer(targetDir: string, intervalMinutes?: number, keepCount?: number): void;
export { taskMap };
