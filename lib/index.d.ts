/**
 * JSXP-MOYV 主入口类型定义文件
 * 提供 TSX 组件截图库的所有导出类型
 */

export {
  ComponentCreateOptionType,
  JSXPOptions,
  ObtainProps,
  RenderOptions
} from './types'
export { Component } from './utils/component'
export { BackgroundImage } from './components/BackgroundImage'
export { LinkStyleSheet } from './components/LinkStyles'
export { LinkESM, LinkESMFile } from './components/LinkESM'
export { createServer } from './server/index'
export { render } from './render'
export { defineConfig } from './config'
export { getProcessing, setMaxConcurrent } from './utils/queue'
export {
  taskMap,
  createTask,
  cleanupTask,
  findAndLockReusableFile,
  releaseReusableLock,
  cleanupCompletedFiles,
  startCleanupTimer
} from './utils/taskmanager'
