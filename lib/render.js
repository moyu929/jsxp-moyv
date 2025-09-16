import { Component } from './utils/component.js';
import { createTask } from './utils/taskmanager.js';
import { addToQueue } from './utils/queue.js';

// 创建Component实例
const component = new Component();
// 全局配置存储
let globalConfig = {};
/**
 * 渲染函数
 * @function render
 * @param {ComponentCreateOptionType} ComOptions - 组件编译配置
 * @param {PupOptions} [PupOptions] - 浏览器配置参数
 * @param {RenderConfigOptions} [config] - 渲染流程配置（可选，会与全局配置合并）
 * @returns {Promise<any>} 渲染结果
 */
const render = async (ComOptions, PupOptions, config) => {
    // 合并全局配置和本次调用的配置
    const currentConfig = { ...globalConfig, ...config };
    return new Promise(async (resolve, reject) => {
        try {
            // 创建新任务
            const taskId = createTask(ComOptions.name || 'unknown');
            // 生成html，并获得url或直接渲染数据
            const compileResult = await component.compile(ComOptions, taskId);
            // 添加任务到队列，传递配置信息
            addToQueue({
                taskId,
                PupOptions,
                resolve,
                config: currentConfig,
                ...compileResult,
            });
        }
        catch (error) {
            reject(error);
        }
    });
};

export { render };
