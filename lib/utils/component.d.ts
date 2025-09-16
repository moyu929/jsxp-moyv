import type { ComponentCreateOptionType } from '../types.js';
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
export { Component };
