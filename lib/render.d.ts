import { ComponentCreateOptionType } from './types.js';
/**
 * 浏览器配置选项接口
 * @interface PupOptions
 * @property {any} [goto] - 页面跳转选项
 * @property {string} [selector] - 元素选择器，默认为'body'
 * @property {any} [screenshot] - 截图选项
 */
interface PupOptions {
    /** 页面跳转选项 */
    goto?: any;
    /** 元素选择器，默认为'body' */
    selector?: string;
    /** 截图选项 */
    screenshot?: any;
}
/**
 * 渲染流程配置选项接口
 * @interface RenderConfigOptions
 * @property {number} [maxConcurrent] - 最大并发任务数，默认15
 * @property {number} [taskTimeout] - 任务执行超时时间（毫秒），默认15000
 * @property {number} [pageLoadTimeout] - 页面加载超时时间（毫秒），默认15000
 * @property {number} [networkIdleTimeout] - 网络空闲等待超时（毫秒），默认10000
 * @property {number} [pageIdleTimeout] - 页面空闲超时时间（毫秒），默认600000（10分钟）
 * @property {number} [pageCleanupInterval] - 页面清理间隔（毫秒），默认180000（3分钟）
 * @property {Object} [viewport] - 页面视口配置
 * @property {number} [viewport.width] - 视口宽度，默认800
 * @property {number} [viewport.height] - 视口高度，默认600
 * @property {boolean} [headless] - 是否无头模式，默认true
 * @property {number} [cacheMaxItems] - 资源缓存最大数量，默认50
 * @property {number} [cacheMaxSize] - 资源缓存最大大小（字节），默认314572800（300MB）
 * @property {number} [cacheCleanupRatio] - 缓存清理比例，默认0.67（2/3）
 * @property {number} [fileKeepCount] - 保留的已完成文件数量，默认2
 * @property {number} [fileCleanupInterval] - 文件清理间隔（分钟），默认5
 * @property {boolean} [enableDirectRender] - 是否启用直接渲染模式，默认true
 * @property {boolean} [enableResourceCache] - 是否启用资源缓存，默认true
 * @property {boolean} [enableFileReuse] - 是否启用文件复用，默认true
 * @property {boolean} [enablePagePool] - 是否启用页面池，默认true
 */
interface RenderConfigOptions {
    /** 最大并发任务数，默认15 */
    maxConcurrent?: number;
    /** 任务执行超时时间（毫秒），默认15000 */
    taskTimeout?: number;
    /** 页面加载超时时间（毫秒），默认15000 */
    pageLoadTimeout?: number;
    /** 网络空闲等待超时（毫秒），默认10000 */
    networkIdleTimeout?: number;
    /** 页面空闲超时时间（毫秒），默认600000（10分钟） */
    pageIdleTimeout?: number;
    /** 页面清理间隔（毫秒），默认180000（3分钟） */
    pageCleanupInterval?: number;
    /** 页面视口配置 */
    viewport?: {
        /** 视口宽度，默认800 */
        width?: number;
        /** 视口高度，默认600 */
        height?: number;
    };
    /** 是否无头模式，默认true */
    headless?: boolean;
    /** 资源缓存最大数量，默认50 */
    cacheMaxItems?: number;
    /** 资源缓存最大大小（字节），默认314572800（300MB） */
    cacheMaxSize?: number;
    /** 缓存清理比例，默认0.67（2/3） */
    cacheCleanupRatio?: number;
    /** 保留的已完成文件数量，默认2 */
    fileKeepCount?: number;
    /** 文件清理间隔（分钟），默认5 */
    fileCleanupInterval?: number;
    /** 是否启用直接渲染模式，默认true */
    enableDirectRender?: boolean;
    /** 是否启用资源缓存，默认true */
    enableResourceCache?: boolean;
    /** 是否启用文件复用，默认true */
    enableFileReuse?: boolean;
    /** 是否启用页面池，默认true */
    enablePagePool?: boolean;
}
/**
 * 配置渲染流程参数
 * @function configure
 * @param {RenderConfigOptions} config - 渲染配置选项
 */
export declare function configure(config: RenderConfigOptions): void;
/**
 * 获取当前渲染配置
 * @function getConfig
 * @returns {RenderConfigOptions} 当前渲染配置
 */
export declare function getConfig(): RenderConfigOptions;
/**
 * 重置渲染配置为默认值
 * @function resetConfig
 */
export declare function resetConfig(): void;
/**
 * 渲染函数
 * @function render
 * @param {ComponentCreateOptionType} ComOptions - 组件编译配置
 * @param {PupOptions} [PupOptions] - 浏览器配置参数
 * @param {RenderConfigOptions} [config] - 渲染流程配置（可选，会与全局配置合并）
 * @returns {Promise<any>} 渲染结果
 */
export declare const render: (ComOptions: ComponentCreateOptionType, PupOptions?: PupOptions, config?: RenderConfigOptions) => Promise<any>;
export type { PupOptions, RenderConfigOptions };
