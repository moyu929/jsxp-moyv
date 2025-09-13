import { ComponentCreateOptionType } from '../types'

/**
 * 组件解析器类
 * 负责 TSX 组件的编译和 HTML 路径处理
 */
declare class Component {
  #private
  constructor()
  
  /**
   * 编译 TSX 组件为 HTML
   * @param options - 组件创建配置选项
   * @param taskId - 可选的任务 ID，用于任务追踪
   * @returns 编译后的 HTML 字符串
   */
  compile(options: ComponentCreateOptionType, taskId?: string): string
  
  /**
   * 处理 HTML 中的路径引用
   * 将相对路径转换为绝对路径或其他需要的格式
   * @param html - 需要处理的 HTML 字符串
   * @returns 处理后的 HTML 字符串
   */
  processHtmlPaths: (html: string) => string
}

export { Component }
