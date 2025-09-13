import React, { CSSProperties } from 'react';

/**
 * 背景图片组件属性类型
 * 扩展了 div 元素的属性，添加了背景图片相关配置
 */
type DivBackgroundImageProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>, 
  HTMLDivElement
> & {
  /**
   * 已废弃的背景图片 URL，请使用 src 属性
   * @deprecated 使用 src 属性替代
   */
  url?: string | string[];
  /**
   * 背景图片 URL 或 URL 数组
   * 支持单个图片或多个图片（用于 CSS 渐变或多背景）
   */
  src?: string | string[];
  /**
   * 背景图片大小
   * 设置元素背景图像的大小，图像可以保留其自然大小、拉伸或约束以适合可用空间
   */
  size?: CSSProperties['backgroundSize'];
};

/**
 * 背景图片组件
 * 提供一个带有背景图片的 div 容器组件
 * @param props - 组件属性
 * @returns React JSX 元素
 */
declare const BackgroundImage: (props: DivBackgroundImageProps) => React.JSX.Element;

export { BackgroundImage };
