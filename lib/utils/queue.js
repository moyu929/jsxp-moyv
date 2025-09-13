import { getBrowserPoolManager } from "./cluster.js";
import { cleanupTask } from "./taskmanager.js";

// 全局任务队列
const queue = [];
// 当前正在处理的任务数量
let processingCount = 0;
// 最大并发数
const MAX_CONCURRENT = 15;

/**
 * 添加任务到队列
 * @param {object} taskData 任务数据
 */
const addToQueue = (taskData) => {
  queue.push(taskData);
  // 立即尝试处理任务（支持并发）
  processQueue();
};

/**
 * 处理队列任务
 */
const processQueue = async () => {
  // 如果没有任务或已达到最大并发数，直接返回
  if (queue.length === 0 || processingCount >= MAX_CONCURRENT) {
    return;
  }
  // 获取任务并增加处理计数
  const taskData = queue.shift();
  if (!taskData) return;
  processingCount++;
  // 异步处理任务（不等待完成）
  processTask(taskData).finally(() => {
    processingCount--;
    // 任务完成后，继续处理队列中的其他任务
    if (queue.length > 0) {
      setImmediate(processQueue);
    }
  });
  // 如果还有任务且未达到并发限制，继续启动更多任务
  if (queue.length > 0 && processingCount < MAX_CONCURRENT) {
    setImmediate(processQueue);
  }
};

/**
 * 处理单个任务
 * @param {object} taskData 任务数据
 */
const processTask = async (taskData) => {
  const {
    taskId, // 任务id
    htmlFilePath, // HTML文件路径
    PupOptions, // 浏览器配置参数
    resolve, // 成功回调
  } = taskData;
  try {
    const manager = await getBrowserPoolManager();
    // 使用集群管理器执行任务
    const result = await manager.executeTask({
      taskId,
      htmlFilePath,
      PupOptions,
    });
    // 返回渲染结果
    resolve(result);
    // 清理任务记录
    cleanupTask(taskId);
  } catch (error) {
    console.error("[jsxp] 任务执行失败:", error);
    resolve(null);
  }
};

/**
 * 获取队列处理状态
 * @returns {object} 队列状态信息
 */
const getProcessing = () => ({
  processingCount,
  queueLength: queue.length,
  isProcessing: processingCount > 0,
});

/**
 * 设置最大并发数
 * @param {number} maxConcurrent 最大并发数
 */
const setMaxConcurrent = (maxConcurrent) => {
  MAX_CONCURRENT = Math.max(1, maxConcurrent);
};

export { addToQueue, processQueue, queue, getProcessing, setMaxConcurrent };
