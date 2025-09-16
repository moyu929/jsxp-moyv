import { Component } from './utils/component.js';
import { createTask } from './utils/taskmanager.js';
import { addToQueue } from './utils/queue.js';

// 创建Component实例
const component = new Component();
/**
 * 渲染函数
 * @param ComOptions 组件编译配置
 * @param PupOptions 浏览器配置参数
 * @returns 渲染结果
 */
const render = async (ComOptions, PupOptions) => {
    return new Promise(async (resolve, reject) => {
        try {
            // 创建新任务
            const taskId = createTask(ComOptions.name || "unknown");
            // 生成html，并获得url或直接渲染数据
            const compileResult = await component.compile(ComOptions, taskId);
            // 添加任务到队列
            addToQueue({ taskId, PupOptions, resolve, ...compileResult });
        }
        catch (error) {
            reject(error);
        }
    });
};

export { render };
