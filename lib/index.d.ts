import React$1, { FC, ReactNode } from 'react';

/**
 * 组件创建选项类型
 * 用于配置 TSX 组件的编译和渲染选项
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

interface CompileResult {
    type: 'direct' | 'file';
    htmlContent?: string;
    virtualUrl?: string;
    resources: string[];
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

interface BackgroundImageProps {
    src?: string | string[];
    url?: string;
    size?: string;
    style?: React.CSSProperties;
    [key: string]: any;
}
declare const BackgroundImage: FC<BackgroundImageProps>;

interface LinkStyleSheetProps {
    src: string;
    [key: string]: any;
}
declare const LinkStyleSheet: FC<LinkStyleSheetProps>;

interface LinkESMProps {
    src: string;
    children?: ReactNode;
    [key: string]: any;
}
interface LinkESMFileProps {
    src: string;
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
 * 创建服务器
 * @param userConfig 用户自定义配置，会覆盖默认配置
 */
declare function createServer(userConfig?: Partial<JSXPOptions>): Promise<void>;

interface PupOptions {
    goto?: any;
    selector?: string;
    screenshot?: any;
}
/**
 * 渲染函数
 * @param ComOptions 组件编译配置
 * @param PupOptions 浏览器配置参数
 * @returns 渲染结果
 */
declare const render: (ComOptions: ComponentCreateOptionType, PupOptions?: PupOptions) => Promise<any>;

declare const defineConfig: (config: any) => any;

/**
 * 获取队列处理状态
 */
declare const getProcessing: () => {
    processingCount: number;
    queueLength: number;
    isProcessing: boolean;
};

/** 任务管理器 */
declare const taskMap: Map<string, number>;
/** 创建新任务 */
declare function createTask(name: string): string;
/** 清理已完成任务 */
declare function cleanupTask(taskId: string): void;
/**
 * 查找并原子锁定可复用的已完成任务文件
 */
declare function findAndLockReusableFile(targetDir: string): string | null;
/**
 * 释放文件复用锁
 */
declare function releaseReusableLock(filePath: string): void;
/**
 * 清理已完成任务的HTML文件
 */
declare function cleanupCompletedFiles(targetDir: string, keepCount?: number): void;
/**
 * 启动定时清理器
 */
declare function startCleanupTimer(targetDir: string, intervalMinutes?: number, keepCount?: number): void;

export { BackgroundImage, Component, LinkESM, LinkESMFile, LinkStyleSheet, cleanupCompletedFiles, cleanupTask, createServer, createTask, defineConfig, findAndLockReusableFile, getProcessing, releaseReusableLock, render, startCleanupTimer, taskMap };
