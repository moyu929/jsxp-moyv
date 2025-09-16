/** 任务管理器 */
declare const taskMap: Map<string, number>;
/** 创建新任务 */
export declare function createTask(name: string): string;
/** 清理已完成任务 */
export declare function cleanupTask(taskId: string): void;
/**
 * 查找并原子锁定可复用的已完成任务文件
 */
export declare function findAndLockReusableFile(targetDir: string): string | null;
/**
 * 释放文件复用锁
 */
export declare function releaseReusableLock(filePath: string): void;
/**
 * 清理已完成任务的HTML文件
 */
export declare function cleanupCompletedFiles(targetDir: string, keepCount?: number): void;
/**
 * 启动定时清理器
 */
export declare function startCleanupTimer(targetDir: string, intervalMinutes?: number, keepCount?: number): void;
export { taskMap };
