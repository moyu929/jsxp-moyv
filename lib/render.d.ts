import { ComponentCreateOptionType } from "./types.js";
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
export { render };
