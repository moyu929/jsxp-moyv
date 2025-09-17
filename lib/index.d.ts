import { Page, PageScreenshotOptions } from 'playwright';
import React$1, { FC, ReactNode } from 'react';

/**
 * 无头浏览器渲染函数配置参数
 * 用于配置 Playwright 页面渲染和截图选项
 */
type RenderOptions = {
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
type ComponentCreateOptionType = {
    /** 组件输出路径扩展 */
    path?: string;
    /** 组件名称，不可包含 ".html" 字样 */
    name?: string;
    /** 是否保存并返回文件地址，默认为 true */
    create?: boolean;
    /** 服务器模式，用于调试目的，默认为 false */
    server?: boolean;
    /** 可被浏览器渲染的完整 React 组件 */
    component: React$1.ReactNode;
};
/**
 * 渲染流程配置选项接口
 */
interface RenderConfigOptions {
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
type JSXPOptions = {
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
            component?: React$1.ReactNode;
        };
    };
};

/**
 * 编译结果接口
 * @interface CompileResult
 * @property {'direct' | 'file'} type - 编译类型
 * @property {string} [htmlContent] - HTML内容（direct模式）
 * @property {string} [virtualUrl] - 虚拟URL（direct模式）
 * @property {string[]} resources - 资源文件列表
 * @property {string} [htmlFilePath] - HTML文件路径（file模式）
 */
interface CompileResult {
    /** 编译类型 */
    type: 'direct' | 'file';
    /** HTML内容（direct模式） */
    htmlContent?: string;
    /** 虚拟URL（direct模式） */
    virtualUrl?: string;
    /** 资源文件列表 */
    resources: string[];
    /** HTML文件路径（file模式） */
    htmlFilePath?: string;
}
/**
 * 组件解析类
 */
declare class Component {
    #private;
    constructor();
    /**
     * 编译html（支持缓存检查和直接渲染模式）
     */
    compile(options: ComponentCreateOptionType, taskId?: string): Promise<string | CompileResult>;
    /** 检查资源是否都在缓存中 */
    checkResourcesInCache(resources: string[]): Promise<boolean>;
    /**
     * 处理html路径并提取本地资源文件名
     */
    processHtmlPaths: (html: string, server?: boolean) => {
        html: string;
        resources: string[];
    };
}

/**
 * BackgroundImage组件属性接口
 * @interface BackgroundImageProps
 * @property {string|string[]} [src] - 图片源地址
 * @property {string} [url] - 图片URL（与src互斥）
 * @property {string} [size] - 背景图片尺寸，默认为'100% auto'
 * @property {React.CSSProperties} [style] - 自定义样式
 * @property {any} [key] - 其他任意属性
 */
interface BackgroundImageProps {
    /** 图片源地址 */
    src?: string | string[];
    /** 图片URL（与src互斥） */
    url?: string;
    /** 背景图片尺寸，默认为'100% auto' */
    size?: string;
    /** 自定义样式 */
    style?: React.CSSProperties;
    /** 其他任意属性 */
    [key: string]: any;
}
declare const BackgroundImage: FC<BackgroundImageProps>;

/**
 * LinkStyleSheet组件属性接口
 * @interface LinkStyleSheetProps
 * @property {string} src - 样式表文件路径
 * @property {any} [key] - 其他任意属性
 */
interface LinkStyleSheetProps {
    /** 样式表文件路径 */
    src: string;
    /** 其他任意属性 */
    [key: string]: any;
}
declare const LinkStyleSheet: FC<LinkStyleSheetProps>;

/**
 * LinkESM组件属性接口
 * @interface LinkESMProps
 * @property {string} src - ESM模块源文件路径
 * @property {ReactNode} [children] - 子组件
 * @property {any} [key] - 其他任意属性
 */
interface LinkESMProps {
    /** ESM模块源文件路径 */
    src: string;
    /** 子组件 */
    children?: ReactNode;
    /** 其他任意属性 */
    [key: string]: any;
}
/**
 * LinkESMFile组件属性接口
 * @interface LinkESMFileProps
 * @property {string} src - 文件路径
 * @property {any} [key] - 其他任意属性
 */
interface LinkESMFileProps {
    /** 文件路径 */
    src: string;
    /** 其他任意属性 */
    [key: string]: any;
}
/**
 * 引入 ESM 文件
 */
declare const LinkESM: FC<LinkESMProps>;
/**
 * 读取文件内容并作为 ESM 文件引入
 */
declare const LinkESMFile: FC<LinkESMFileProps>;

/**
 * 创建JSXP服务器
 * @function createServer
 * @param {Partial<JSXPOptions>} [userConfig] - 用户自定义配置，会覆盖默认配置
 * @returns {Promise<void>} Promise对象，服务器启动后resolve
 * @description 创建一个Koa服务器，支持热重载、静态文件服务和路由处理
 */
declare function createServer(userConfig?: Partial<JSXPOptions>): Promise<void>;

/**
 * 渲染函数
 * @function render
 * @param {ComponentCreateOptionType} ComOptions - 组件编译配置
 * @param {RenderOptions} [PupOptions] - 浏览器配置参数
 * @param {RenderConfigOptions} [config] - 渲染流程配置（可选，会与全局配置合并，仅生效一次）
 * @returns {Promise<any>} 渲染结果
 */
declare const render: (ComOptions: ComponentCreateOptionType, PupOptions?: RenderOptions, config?: RenderConfigOptions) => Promise<any>;

/**
 * 定义配置函数
 * @function defineConfig
 * @param {any} config - 配置对象
 * @returns {any} 配置对象
 */
declare const defineConfig: (config: any) => any;

/**
 * 获取队列处理状态
 */
declare const getProcessing: () => {
    processingCount: number;
    queueLength: number;
    maxConcurrent: number;
    isProcessing: boolean;
};

/**
 * 任务管理器
 * 用于管理任务ID和任务状态的映射关系
 * @type {Map<string, number>}
 */
declare const taskMap: Map<string, number>;
/**
 * 创建新任务
 * @function createTask
 * @param {string} name - 任务名称
 * @returns {string} 任务唯一标识符
 */
declare function createTask(name: string): string;
/**
 * 清理已完成任务
 * @function cleanupTask
 * @param {string} task极 - 任务ID
 */
declare function cleanupTask(taskId: string): void;
/**
 * 查找并原子锁定可复用的已完成任务文件
 * @function findAndLockReusableFile
 * @param {string} targetDir - 目标目录路径
 * @returns {string|null} 可复用的文件名，如果没有则返回null
 */
declare function findAndLockReusableFile(targetDir: string): string | null;
/**
 * 释放文件复用锁
 * @function releaseReusableLock
 * @param {string} filePath - 文件路径
 */
declare function releaseReusableLock(filePath: string): void;
/**
 * 清理已完成任务的HTML文件
 * @function cleanupCompletedFiles
 * @param {string} targetDir - 目标目录路径
 * @param {number} [keepCount=2] - 保留的文件数量，默认为2
 */
declare function cleanupCompletedFiles(targetDir: string, keepCount?: number): void;
/**
 * 启动定时清理器
 * @function startCleanupTimer
 * @param {string} targetDir - 目标目录路径
 * @param {number} [intervalMinutes=5] - 清理间隔分钟数，默认为5
 * @param {number} [keepCount=2] - 保留的文件数量，默认为2
 */
declare function startCleanupTimer(targetDir: string, intervalMinutes?: number, keepCount?: number): void;

export { BackgroundImage, Component, LinkESM, LinkESMFile, LinkStyleSheet, cleanupCompletedFiles, cleanupTask, createServer, createTask, defineConfig, findAndLockReusableFile, getProcessing, releaseReusableLock, render, startCleanupTimer, taskMap };
