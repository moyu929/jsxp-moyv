/**
 * 全局任务队列
 * @type {Array<any>}
 */
declare const queue: any[];
/**
 * 最大并发数
 * @constant {number}
 */
declare const MAX_CONCURRENT = 15;
/**
 * 添加任务到队列
 */
export declare const addToQueue: (taskData: any) => void;
/**
 * 处理队列任务
 */
export declare const processQueue: () => Promise<void>;
/**
 * 获取队列处理状态
 */
export declare const getProcessing: () => {
    processingCount: number;
    queueLength: number;
    maxConcurrent: number;
    isProcessing: boolean;
};
export { queue, MAX_CONCURRENT };
