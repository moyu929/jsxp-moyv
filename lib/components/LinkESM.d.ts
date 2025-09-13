import React from 'react';

/**
 * ESM 脚本链接组件属性类型
 * 扩展了 script 元素的属性，添加了 ESM 模块源文件配置
 */
type LinkESMProps = React.DetailedHTMLProps<
  React.ScriptHTMLAttributes<HTMLScriptElement>, 
  HTMLScriptElement
> & {
  /** ESM 模块源文件路径，必需属性 */
  src: string;
};

/**
 * ESM 脚本链接组件
 * 用于在 TSX 组件中引入外部 ESM JavaScript 模块
 * @param props - 组件属性
 * @returns React JSX 元素
 */
declare const LinkESM: (props: LinkESMProps) => React.JSX.Element;

/**
 * ESM 文件内容组件属性类型
 * 扩展了 script 元素的属性，添加了文件内容配置
 */
type LinkESMFileProps = React.DetailedHTMLProps<
  React.ScriptHTMLAttributes<HTMLScriptElement>, 
  HTMLScriptElement
> & {
  /** 文件路径，组件会读取文件内容并内联为脚本 */
  src: string;
};

/**
 * ESM 文件内容组件
 * 读取指定文件的内容并将其作为内联 ESM 脚本引入
 * @param props - 组件属性
 * @returns React JSX 元素
 */
declare const LinkESMFile: (props: LinkESMFileProps) => React.JSX.Element;

export { LinkESM, LinkESMFile };
