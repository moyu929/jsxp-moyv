import { RenderOptions } from '../types'

/**
 * 任务队列项数据类型
 */
interface QueueItem {
  taskId: string
  htmlFilePath: string
  PupOptions?: RenderOptions
  resolve: Function
}

/**
 * 添加任务到队列
 * @param taskData - 任务数据
 */
declare const addToQueue: (taskData: QueueItem) => void

/**
 * 处理队列中的任务
 * @returns Promise 在所有队列任务处理完成后解析
 */
declare const processQueue: () => Promise<void>

/**
 * 任务队列数组
 */
declare const queue: QueueItem[]

/**
 * 获取当前队列处理状态
 * @returns 包含处理数量、队列长度和处理状态的统计信息
 */
declare const getProcessing: () => {
  processingCount: number
  queueLength: number
  isProcessing: boolean
}

/**
 * 设置最大并发任务数
 * @param maxConcurrent - 最大并发数
 */
declare const setMaxConcurrent: (maxConcurrent: number) => void

export { addToQueue, processQueue, queue, getProcessing, setMaxConcurrent }

