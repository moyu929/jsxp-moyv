import { ComponentCreateOptionType, RenderConfigOptions, RenderOptions } from './types.js';
/**
 * 渲染函数
 * @function render
 * @param {ComponentCreateOptionType} ComOptions - 组件编译配置
 * @param {RenderOptions} [PupOptions] - 浏览器配置参数
 * @param {RenderConfigOptions} [config] - 渲染流程配置（可选，会与全局配置合并，仅生效一次）
 * @returns {Promise<any>} 渲染结果
 */
export declare const render: (ComOptions: ComponentCreateOptionType, PupOptions?: RenderOptions, config?: RenderConfigOptions) => Promise<any>;
export type { RenderConfigOptions };
