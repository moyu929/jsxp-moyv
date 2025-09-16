import type { FC } from 'react';
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
export declare const BackgroundImage: FC<BackgroundImageProps>;
export {};
