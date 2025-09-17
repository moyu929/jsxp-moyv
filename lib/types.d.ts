import { Page, PageScreenshotOptions } from 'playwright';
import React from 'react';
/**
 * 无头浏览器渲染函数配置参数
 * 用于配置 Playwright 页面渲染和截图选项
 */
export type RenderOptions = {
    /** 页面跳转参数，传递给 page.goto() 方法 */
    goto?: Parameters<Page['goto']>[1];
    /** 选择器，用于定位要截图的元素 */
    selector?: any;
    /** 截图参数，注意不可使用 webp 格式 */
    screenshot?: Readonly<PageScreenshotOptions>;
};
/**
 * 组件创建选项类型
 */
export type ComponentCreateOptionType = {
    /** 组件输出路径扩展 */
    path?: string;
    /** 组件名称，不可包含 ".html" 字样 */
    name?: string;
    /** 是否保存并返回文件地址，默认为 true */
    create?: boolean;
    /** 服务器模式，用于调试目的，默认为 false */
    server?: boolean;
    /** 可被浏览器渲染的完整 React 组件 */
    component: React.ReactNode;
};
/**
 * 渲染流程配置选项接口
 */
export interface RenderConfigOptions {
    /** 最大并发任务数（总并发），默认15 */
    maxConcurrent?: number;
    /** 组件编译并发数，默认10 */
    componentCompileConcurrent?: number;
    /** 渲染并发数，默认10 */
    renderConcurrent?: number;
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
    /** 每个浏览器的最大页面数（页面池上限），默认10 */
    maxPagesPerBrowser?: number;
    /** 页面池最小保持页面数，默认2 */
    pagePoolMinSize?: number;
    /** 页面池最大页面数，默认15 */
    pagePoolMaxSize?: number;
    /** 页面视口配置 */
    viewport?: {
        /** 视口宽度，默认800 */
        width?: number;
        /** 视口高度，默认600 */
        height?: number;
        /** 设备像素比，默认1 */
        deviceScaleFactor?: number;
    };
    /** 是否无头模式，默认true */
    headless?: boolean;
    /** Playwright操作超时时间（毫秒），默认20000 */
    playwrightTimeout?: number;
    /** 资源缓存最大数量，默认50 */
    cacheMaxItems?: number;
    /** 资源缓存最大大小（字节），默认314572800（300MB） */
    cacheMaxSize?: number;
    /** 缓存清理比例，默认0.67（2/3） */
    cacheCleanupRatio?: number;
    /** 缓存最小保留时间（毫秒），默认5000 */
    cacheMinAge?: number;
    /** 保留的已完成文件数量，默认2 */
    fileKeepCount?: number;
    /** 文件清理间隔（分钟），默认5 */
    fileCleanupInterval?: number;
    /** 文件复用最小年龄（毫秒），默认5000 */
    fileReuseMinAge?: number;
    /** 是否启用直接渲染模式，默认true */
    enableDirectRender?: boolean;
    /** 是否启用资源缓存，默认true */
    enableResourceCache?: boolean;
    /** 是否启用文件复用，默认true */
    enableFileReuse?: boolean;
    /** 是否启用页面池，默认true */
    enablePagePool?: boolean;
    /** 是否启用队列处理，默认true */
    enableQueueProcessing?: boolean;
    /** 队列处理延迟（毫秒），默认0 */
    queueProcessDelay?: number;
    /** 截图默认配置 */
    screenshot?: {
        /** 截图格式，默认'jpeg' */
        type?: string;
        /** 截图质量（JPEG），默认90 */
        quality?: number;
        /** 是否全屏截图，默认false */
        fullPage?: boolean;
    };
    /** 页面导航配置 */
    navigation?: {
        /** 导航等待条件，默认'networkidle' */
        waitUntil?: string;
        /** 导航超时时间（毫秒），默认15000 */
        timeout?: number;
    };
    /** 资源拦截配置 */
    resourceInterception?: {
        /** 拦截的资源扩展名，默认['css','js','png','jpg','jpeg','gif','svg','webp','woff','woff2','ttc','ttf'] */
        extensions?: string[];
        /** 是否启用资源拦截，默认true */
        enabled?: boolean;
    };
    /** 性能监控配置 */
    performance?: {
        /** 是否监控内存使用，默认false */
        monitorMemory?: boolean;
        /** 内存检查间隔（毫秒），默认30000 */
        memoryCheckInterval?: number;
        /** 最大内存使用量（MB），默认1024 */
        maxMemoryUsage?: number;
    };
    /** 浏览器重启配置 */
    browserRestart?: {
        /** 最大渲染次数后重启浏览器，默认200 */
        maxRenderCountBeforeRestart?: number;
    };
}
/**
 * JSXP 工程配置选项
 * 用于配置整个截图服务的全局选项
 */
export type JSXPOptions = {
    /** 服务器端口号 */
    port?: number;
    /** 基础路径 */
    path?: string;
    /** 服务器主机地址 */
    host?: string;
    /** URL 前缀 */
    prefix?: string;
    /** 静态文件目录路径 */
    statics?: string | string[];
    /** 路由配置 */
    routes?: {
        [key: string]: {
            component?: React.ReactNode;
        };
    };
};
/**
 * 提取 React 组件 Props 类型
 */
export type ObtainProps<T> = T extends React.FC<infer P> ? P : T extends React.ComponentClass<infer P> ? P : never;
