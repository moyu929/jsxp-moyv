declare const queue: any[];
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
    isProcessing: boolean;
};
export { queue };
