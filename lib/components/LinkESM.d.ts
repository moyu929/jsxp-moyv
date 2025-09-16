import type { FC, ReactNode } from "react";
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
export declare const LinkESM: FC<LinkESMProps>;
/**
 * 读取文件内容并作为 ESM 文件引入
 */
export declare const LinkESMFile: FC<LinkESMFileProps>;
export {};
