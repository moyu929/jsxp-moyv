import { Page } from 'playwright'

/**
 * 浏览器池管理器类 - Playwright 版本
 * 管理 Playwright 浏览器实例池，提供截图任务执行功能
 */
declare class BrowserPoolManager {
  constructor()

  /**
   * 初始化浏览器池
   * 创建并配置浏览器实例池
   */
  init(): Promise<void>

  /**
   * 执行截图任务
   * @param taskData - 截图任务数据
   * @returns Promise 解析为截图图片 Buffer
   */
  executeTask(taskData: {
    htmlFilePath: string
    PupOptions?: any
  }): Promise<Buffer>

  /**
   * 执行具体的截图操作
   * @param page - Playwright 页面实例
   * @param taskData - 截图任务数据
   * @returns Promise 解析为截图图片 Buffer
   */
  executeScreenshot(page: Page, taskData: {
    htmlFilePath: string
    PupOptions?: any
  }): Promise<Buffer>

  /**
   * 关闭浏览器池
   * 清理所有浏览器实例和资源
   */
  close(): Promise<void>
}

/**
 * 获取浏览器池管理器实例
 * @returns Promise 解析为 BrowserPoolManager 实例
 */
declare const getBrowserPoolManager: () => Promise<BrowserPoolManager>

export { BrowserPoolManager, getBrowserPoolManager }