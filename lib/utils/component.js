import { renderToString } from 'react-dom/server'
import { mkdirSync, writeFileSync, existsSync, renameSync } from 'fs'
import { join } from 'path'
import {
  findAndLockReusableFile,
  releaseReusableLock,
  startCleanupTimer
} from './taskmanager.js'

/**
 * ************
 * 组件解析
 * **********
 */
class Component {
  #dir = ''
  #cleanupStarted = false
  constructor() {
    this.#dir = join(process.cwd(), '.data', 'component')
  }
  /**
   * 编译html
   * @param {import('../types').ComponentCreateOpsionType} options
   * @returns {string|string}
   */
  compile(options, taskId) {
    const DOCTYPE = '<!DOCTYPE html>'
    const HTML = renderToString(options.component)
    const html = `${DOCTYPE}${HTML}`
    /**
     * create false
     */
    if (typeof options?.create == 'boolean' && options?.create == false) {
      // is server  启动 server 解析
      if (options.server === true) return this.processHtmlPaths(html)
      return html
    }

    /**
     * create true - HTML生成逻辑
     */
    const dir = join(this.#dir, options?.path ?? '')
    // mkdir
    mkdirSync(dir, { recursive: true })
    // 启动定时清理器
    if (!this.#cleanupStarted) {
      startCleanupTimer(dir)
      this.#cleanupStarted = true
    }
    // 使用taskId作为文件名，确保有.html扩展名
    let fileName = taskId ?? 'jsxp'
    if (!fileName.endsWith('.html')) fileName = `${fileName}.html`
    const address = join(dir, fileName)
    // 根据server选项决定是否处理路径
    const processedHtml =
      options.server === true ? this.processHtmlPaths(html) : html
    // 尝试复用已完成任务的文件
    const reusableFile = findAndLockReusableFile(dir)
    if (reusableFile) {
      const oldPath = join(dir, reusableFile)
      try {
        // 覆写已有文件内容
        writeFileSync(oldPath, processedHtml)
        // 重命名为新的任务文件
        renameSync(oldPath, address)
        // 释放文件复用锁
        releaseReusableLock(oldPath)
        return address
      } catch (error) {
        console.error('[jsxp] 文件复用失败，创建新文件:', error)
        // 复用失败时也要释放锁
        releaseReusableLock(oldPath)
      }
    }
    // 没有可复用文件或复用失败时，创建新文件
    writeFileSync(address, processedHtml)
    return address
  }
  /**
   * 处理html路径
   * @param html
   * @returns
   */
  processHtmlPaths = html => {
    // 使用正则表达式提取所有 src 和 href 属性中的路径
    const attrRegex = /(src|href)=["']([^"']+)["']/g
    html = html.replace(attrRegex, (match, attr, link) => {
      const url = decodeURIComponent(link)
      if (existsSync(url)) {
        const newPath = `/files?path=${encodeURIComponent(link)}`
        return `${attr}="${newPath}"`
      }
      return match
    })
    // 使用正则表达式提取 CSS 中 url() 的路径
    const urlRegex = /url\(["']?([^"')]+)["']?\)/g
    html = html.replace(urlRegex, (match, link) => {
      const url = decodeURIComponent(link)
      if (existsSync(url)) {
        const newPath = `/files?path=${encodeURIComponent(link)}`
        return `url(${newPath})`
      }
      return match
    })
    return html
  }
}

export { Component }
