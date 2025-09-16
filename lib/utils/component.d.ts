import type { ComponentCreateOptionType } from "../types.js";
interface CompileResult {
    type: "direct" | "file";
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
export { Component };
