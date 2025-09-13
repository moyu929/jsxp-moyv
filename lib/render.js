import { Component } from './utils/component.js'
import { createTask } from './utils/taskmanager.js'
import { addToQueue } from './utils/queue.js'

// 创建Component实例
const component = new Component()

/**
 * 新版渲染函数 - 支持异步流水线
 * @param {import('./types.js').ComponentCreateOpsionType} ComOptions 组件编译配置
 * @param {object} PupOptions 浏览器配置参数
 * @returns {Promise} 渲染结果
 */
const render = async (ComOptions, PupOptions) => {
  return new Promise(async (resolve, reject) => {
    try {
      // 创建新任务
      const taskId = createTask(ComOptions.name)
      // 生成html，并获得url
      const htmlFilePath = await component.compile(ComOptions, taskId)
      // 将任务加入渲染队列
      addToQueue({
        taskId, // 任务id
        htmlFilePath, // HTML文件路径
        PupOptions, // 浏览器配置参数
        resolve // 成功回调
      })
    } catch (error) {
      reject(error)
    }
  })
}

export { render }
