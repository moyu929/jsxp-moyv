import { Page, PageScreenshotOptions } from 'playwright'
import React from 'react'

/**
 * 无头浏览器渲染函数配置参数
 * 用于配置 Playwright 页面渲染和截图选项
 */
type RenderOptions = {
  /** 页面跳转参数，传递给 page.goto() 方法 */
  goto?: Parameters<Page['goto']>[1]
  /** 选择器，用于定位要截图的元素 */
  selector?: any
  /** 截图参数，注意不可使用 webp 格式 */
  screenshot?: Readonly<PageScreenshotOptions>
}

/**
 * 组件创建选项类型
 * 用于配置 TSX 组件的编译和渲染选项
 */
type ComponentCreateOptionType = {
  /** 组件输出路径扩展 */
  path?: string
  /** 组件名称，不可包含 ".html" 字样 */
  name?: string
  /** 是否保存并返回文件地址，默认为 true */
  create?: boolean
  /** 服务器模式，用于调试目的，默认为 false */
  server?: boolean
  /** 可被浏览器渲染的完整 React 组件 */
  component: React.ReactNode
}

/**
 * JSXP 工程配置选项
 * 用于配置整个截图服务的全局选项
 */
type JSXPOptions = {
  /** 服务器端口号 */
  port?: number
  /** 基础路径 */
  path?: string
  /** 服务器主机地址 */
  host?: string
  /** URL 前缀 */
  prefix?: string
  /** 静态文件目录路径 */
  statics?: string | string[]
  /** 路由配置 */
  routes?: {
    [key: string]: {
      component?: React.ReactNode
    }
  }
}

/**
 * 提取 React 组件 Props 类型
 * @template T - React 组件类型
 */
type ObtainProps<T> = T extends React.FC<infer P>
  ? P
  : T extends React.ComponentClass<infer P>
  ? P
  : never

export type {
  ComponentCreateOptionType,
  JSXPOptions,
  ObtainProps,
  RenderOptions
}
