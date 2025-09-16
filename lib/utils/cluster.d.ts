import { Page } from "playwright";
interface TaskData {
    taskId: string;
    type: "direct" | "file";
    htmlContent?: string;
    htmlFilePath?: string;
    virtualUrl?: string;
    PupOptions?: {
        goto?: any;
        selector?: string;
        screenshot?: any;
    };
}
/**
 * 浏览器池管理器 - 使用Playwright + BrowserPool实现高性能截图
 * 支持智能队列管理、资源监控和性能优化
 */
declare class BrowserPoolManager {
    private browserPool;
    private activeTasks;
    private taskQueue;
    private maxConcurrent;
    private pagePool;
    private maxPagesPerBrowser;
    private pageCleanupTimer;
    private pageIdleTimeout;
    private resourceCache;
    private playwrightOptions;
    /** 初始化浏览器池 */
    init(): Promise<void>;
    /** 为单个页面设置路由拦截器 */
    setupPageRouteInterceptor(page: Page): Promise<void>;
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
    /** 直接渲染模式 */
    private _executeDirectRenderWithRetry;
    /** 文件模式 */
    private _executeScreenshotWithRetry;
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
    /** 关闭浏览器池 */
    close(): Promise<void>;
}
/** 获取浏览器池管理器实例 */
declare const getBrowserPoolManager: () => Promise<BrowserPoolManager>;
export { BrowserPoolManager, getBrowserPoolManager };
