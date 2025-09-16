import { Page } from 'playwright';
/** 任务数据结构定义 */
interface TaskData {
    /** 任务唯一标识符 */
    taskId: string;
    /** 任务类型：direct=直接渲染HTML内容，file=从文件加载 */
    type: 'direct' | 'file';
    /** HTML内容字符串（type为direct时使用） */
    htmlContent?: string;
    /** HTML文件路径（type为file时使用） */
    htmlFilePath?: string;
    /** 虚拟URL，用于资源路径解析 */
    virtualUrl?: string;
    /** Playwright页面选项配置 */
    PupOptions?: {
        /** 页面导航选项（如timeout、waitUntil等） */
        goto?: any;
        /** 目标元素选择器，默认为"body" */
        selector?: string;
        /** 截图选项（如quality、type等） */
        screenshot?: any;
    };
}
/**
 * 浏览器管理器 - 使用Playwright实现高性能截图
 * 支持智能队列管理、资源监控和性能优化
 */
declare class BrowserPoolManager {
    /** 浏览器实例 */
    private browser;
    /** 浏览器上下文 */
    private context;
    /** 当前活跃的任务ID集合 */
    private activeTasks;
    /** 任务等待队列 */
    private taskQueue;
    /** 系统配置参数 */
    private config;
    /** 页面复用池 */
    private pagePool;
    /** 页面清理定时器 */
    private pageCleanupTimer;
    /** 资源缓存系统 */
    private resourceCache;
    /** 缓存总大小（字节） */
    private totalCacheSize;
    /** 初始化浏览器 */
    init(): Promise<void>;
    /** 为浏览器设置全局路由拦截器 */
    setupGlobalRouteInterceptor(): Promise<void>;
    /** 判断是否为静态资源 */
    isStaticResource(url: string): boolean;
    /** 提取文件名 */
    extractFileName(urlOrPath: string): string;
    /** 获取内容类型 */
    getContentType(ext: string): string;
    /** 检查资源是否都在缓存中 */
    checkResourcesInCache(resources: string[]): boolean;
    /** 执行截图任务 */
    executeTask(taskData: TaskData): Promise<Buffer>;
    /** 处理任务队列 */
    private _processQueue;
    /** 内部任务执行方法 */
    private _executeTaskInternal;
    /** 执行直接渲染截图操作 */
    executeDirectRender(page: Page, taskData: TaskData): Promise<Buffer>;
    /** 执行文件渲染截图操作 */
    executeScreenshot(page: Page, taskData: TaskData): Promise<Buffer>;
    /** 预处理HTML内容用于直接渲染 */
    private prepareHtmlForDirectRender;
    /** 从页面池获取可复用页面 */
    private _getPageFromPool;
    /** 释放页面到页面池 */
    private _releasePageToPool;
    /** 清理页面状态 */
    private _cleanPageState;
    /** 清理空闲时间过长的页面 */
    private _cleanupIdlePages;
    /** 关闭浏览器 */
    close(): Promise<void>;
    /** 检查并清理缓存 */
    private _checkAndCleanupCache;
    /** 执行缓存清理 */
    private _cleanupCache;
}
/** 获取浏览器池管理器实例 */
declare const getBrowserPoolManager: () => Promise<BrowserPoolManager>;
export { BrowserPoolManager, getBrowserPoolManager };
