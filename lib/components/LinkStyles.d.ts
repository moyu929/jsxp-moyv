import React from 'react';

/**
 * 样式表链接组件属性类型
 * 扩展了 link 元素的属性，添加了样式表源文件配置
 */
type LinkStyleSheetProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLLinkElement>, 
  HTMLLinkElement
> & {
  /** 样式表源文件路径，必需属性 */
  src: string;
};

/**
 * 样式表链接组件
 * 用于在 TSX 组件中引入外部 CSS 样式表
 * @param props - 组件属性
 * @returns React JSX 元素
 */
declare const LinkStyleSheet: (props: LinkStyleSheetProps) => React.JSX.Element;

export { LinkStyleSheet };
