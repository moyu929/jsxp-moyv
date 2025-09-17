import { Component } from './utils/component.js';
import { createTask } from './utils/taskmanager.js';
import { addToQueue } from './utils/queue.js';

// 创建Component实例
const component = new Component();
// 状态锁标志，标记config是否已被处理
let configProcessed = false;
/**
 * 渲染函数
 * @function render
 * @param {ComponentCreateOptionType} ComOptions - 组件编译配置
 * @param {RenderOptions} [PupOptions] - 浏览器配置参数
 * @param {RenderConfigOptions} [config] - 渲染流程配置（可选，会与全局配置合并，仅生效一次）
 * @returns {Promise<any>} 渲染结果
 */
const render = async (ComOptions, PupOptions, config) => {
    return new Promise(async (resolve, reject) => {
        try {
            // 如果config已经被处理过，则设置为null
            const processedConfig = configProcessed ? null : config;
            // 创建新任务
            const taskId = createTask(ComOptions.name || 'unknown');
            // 生成html，并获得url或直接渲染数据
            const compileResult = await component.compile(ComOptions, taskId);
            // 添加任务到队列，传递配置信息
            addToQueue({
                taskId,
                PupOptions,
                resolve,
                config: processedConfig,
                ...compileResult,
            });
            // 标记config已被处理
            if (config && !configProcessed)
                configProcessed = true;
        }
        catch (error) {
            reject(error);
        }
    });
};

export { render };
