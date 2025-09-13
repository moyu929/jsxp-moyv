/// <reference types="node" />
import { ComponentCreateOptionType, RenderOptions } from './types'

/**
 * 渲染 React 组件为图片
 * 使用 Playwright 无头浏览器进行组件渲染和截图
 * @param ComOptions - 组件编译配置选项
 * @param PupOptions - Playwright 浏览器配置参数
 * @returns Promise 解析为图片 Buffer 或 false（失败时）
 */
declare const render: (
  ComOptions: ComponentCreateOptionType,
  PupOptions?: RenderOptions
) => Promise<Buffer | false>

export { render }
