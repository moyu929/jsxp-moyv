import type { FC } from 'react';
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
export declare const LinkStyleSheet: FC<LinkStyleSheetProps>;
export {};
