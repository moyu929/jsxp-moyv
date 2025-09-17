import { chromium, Page, Browser, BrowserContext } from 'playwright'
import * as path from 'path'
import * as fs from 'fs'

// 浏览器管理器实例
let browserPoolInstance: BrowserPoolManager | null = null

/**
 * 资源缓存项接口
 * @interface ResourceCacheItem
 * @property {Buffer} body - 资源内容，存储为Buffer格式
 * @property {Record<string, string>} headers - HTTP响应头信息
 * @property {number} [status] - HTTP状态码（可选）
 * @property {number} usageCount - 使用次数
 * @property {number} createdAt - 加入时间戳
 * @property {number} lastUsedAt - 最后使用时间
 */
interface ResourceCacheItem {
  /** 资源内容，存储为Buffer格式 */
  body: Buffer
  /** HTTP响应头信息 */
  headers: Record<string, string>
  /** HTTP状态码（可选） */
  status?: number
  /** 使用次数 */
  usageCount: number
  /** 加入时间戳 */
  createdAt: number
  /** 最后使用时间 */
  lastUsedAt: number
}

/**
 * 任务数据结构定义
 * @interface TaskData
 * @property {string} taskId - 任务唯一标识符
 * @property {'direct' | 'file'} type - 任务类型：direct=直接渲染HTML内容，file=从文件加载
 * @property {string} [htmlContent] - HTML内容字符串（type为direct时使用）
 * @property {string} [htmlFilePath] - HTML文件路径（type为file时使用）
 * @property {string} [virtualUrl] - 虚拟URL，用于资源路径解析
 * @property {Object} [PupOptions] - Playwright页面选项配置
 * @property {any} [PupOptions.goto] - 页面导航选项（如timeout、waitUntil等）
 * @property {string} [PupOptions.selector] - 目标元素选择器，默认为"body"
 * @property {any} [PupOptions.screenshot] - 截图选项（如quality、type等）
 */
interface TaskData {
  /** 任务唯一标识符 */
  taskId: string
  /** 任务类型：direct=直接渲染HTML内容，file=从文件加载 */
  type: 'direct' | 'file'
  /** HTML内容字符串（type为direct时使用） */
  htmlContent?: string
  /** HTML文件路径（type为file时使用） */
  htmlFilePath?: string
  /** 虚拟URL，用于资源路径解析 */
  virtualUrl?: string
  /** Playwright页面选项配置 */
  PupOptions?: {
    /** 页面导航选项（如timeout、waitUntil等） */
    goto?: any
    /** 目标元素选择器，默认为"body" */
    selector?: string
    /** 截图选项（如quality、type等） */
    screenshot?: any
  }
}

/**
 * 浏览器管理器 - 使用Playwright实现高性能截图
 * 支持智能队列管理、资源监控和性能优化
 */
class BrowserPoolManager {
  /** 浏览器实例 */
  private browser: Browser | null = null
  /** 浏览器上下文 */
  private context: BrowserContext | null = null
  /** 当前活跃的任务ID集合 */
  private activeTasks: Set<string> = new Set()
  /** 任务等待队列 */
  private taskQueue: Array<{
    /** 任务数据 */
    taskData: TaskData
    /** Promise成功回调 */
    resolve: (value: any) => void
    /** Promise失败回调 */
    reject: (reason?: any) => void
    /** 任务特定配置 */
    config?: any
  }> = []
  /** 系统默认配置参数 */
  private defaultConfig = {
    /** 最大并发任务数 */
    maxConcurrent: 15,
    /** 组件编译并发数 */
    componentCompileConcurrent: 10,
    /** 渲染并发数 */
    renderConcurrent: 10,
    /** 任务执行超时时间（毫秒） */
    taskTimeout: 15000,
    /** 页面加载超时时间（毫秒） */
    pageLoadTimeout: 15000,
    /** 网络空闲等待超时（毫秒） */
    networkIdleTimeout: 10000,
    /** 页面空闲超时时间（毫秒） */
    pageIdleTimeout: 600000,
    /** 页面清理间隔（毫秒） */
    pageCleanupInterval: 180000,
    /** 每个浏览器的最大页面数 */
    maxPagesPerBrowser: 10,
    /** 页面池最小保持页面数 */
    pagePoolMinSize: 2,
    /** 页面池最大页面数 */
    pagePoolMaxSize: 15,
    /** 页面视口配置 */
    viewport: { width: 800, height: 600, deviceScaleFactor: 1 },
    /** 是否无头模式 */
    headless: true,
    /** Playwright操作超时时间（毫秒） */
    playwrightTimeout: 20000,
    /** 缓存清理配置 */
    cacheCleanup: {
      /** 最大缓存数量 */
      maxItems: 50,
      /** 最大缓存大小（字节） */
      maxSize: 314572800,
      /** 清理比例 */
      cleanupRatio: 0.67,
      /** 缓存最小保留时间（毫秒） */
      minAge: 5000,
    },
    /** 文件清理配置 */
    fileCleanup: {
      /** 保留的已完成文件数量 */
      keepCount: 2,
      /** 文件清理间隔（分钟） */
      cleanupInterval: 5,
      /** 文件复用最小年龄（毫秒） */
      reuseMinAge: 5000,
    },
    /** 功能开关配置 */
    features: {
      /** 是否启用直接渲染模式 */
      enableDirectRender: true,
      /** 是否启用资源缓存 */
      enableResourceCache: true,
      /** 是否启用文件复用 */
      enableFileReuse: true,
      /** 是否启用页面池 */
      enablePagePool: true,
      /** 是否启用队列处理 */
      enableQueueProcessing: true,
      /** 是否启用资源拦截 */
      enableResourceInterception: true,
    },
    /** 队列配置 */
    queue: {
      /** 队列处理延迟（毫秒） */
      processDelay: 0,
    },
    /** 截图默认配置 */
    screenshot: {
      /** 截图格式 */
      type: 'jpeg',
      /** 截图质量（JPEG） */
      quality: 90,
      /** 是否全屏截图 */
      fullPage: false,
    },
    /** 页面导航配置 */
    navigation: {
      /** 导航等待条件 */
      waitUntil: 'networkidle',
      /** 导航超时时间（毫秒） */
      timeout: 15000,
    },
    /** 资源拦截配置 */
    resourceInterception: {
      /** 拦截的资源扩展名 */
      extensions: [
        'css',
        'js',
        'png',
        'jpg',
        'jpeg',
        'gif',
        'svg',
        'webp',
        'woff',
        'woff2',
        'ttc',
        'ttf',
      ],
      /** 是否启用资源拦截 */
      enabled: true,
    },
    /** 性能监控配置 */
    performance: {
      /** 是否监控内存使用 */
      monitorMemory: false,
      /** 内存检查间隔（毫秒） */
      memoryCheckInterval: 30000,
      /** 最大内存使用量（MB） */
      maxMemoryUsage: 1024,
    },
  }

  /** 当前生效的配置 */
  private config = { ...this.defaultConfig }
  /** 渲染计数器 */
  private renderCount: number = 0
  /** 最大渲染次数后重启浏览器 */
  private maxRenderCountBeforeRestart: number = 200
  /** 浏览器操作锁，防止并发关闭/重启 */
  private isLocked: boolean = false

  /** 页面复用池 */
  private pagePool: Map<string, Page[]> = new Map()
  /** 页面清理定时器 */
  private pageCleanupTimer: NodeJS.Timeout | null = null
  /** 资源缓存系统 */
  private resourceCache: Map<string, ResourceCacheItem> = new Map()
  /** 缓存总大小（字节） */
  private totalCacheSize: number = 0

  /** 初始化浏览器 */
  async init(config?: any): Promise<void> {
    try {
      // 合并传入的配置
      if (config) {
        this.config = this.mergeConfig(this.defaultConfig, config)
        // 设置最大渲染次数
        if (config.browserRestart?.maxRenderCountBeforeRestart !== undefined) {
          this.maxRenderCountBeforeRestart =
            config.browserRestart.maxRenderCountBeforeRestart
        } else if (config.maxRenderCountBeforeRestart !== undefined) {
          this.maxRenderCountBeforeRestart = config.maxRenderCountBeforeRestart
        }
      }

      console.log('[jsxp] 启动浏览器实例...')
      // 创建单个浏览器实例
      this.browser = await chromium.launch({
        headless: this.config.headless,
        timeout: this.config.playwrightTimeout,
      })
      console.log('[jsxp] 浏览器实例启动成功')
      // 创建浏览器上下文并设置视口大小
      this.context = await this.browser.newContext({
        viewport: this.config.viewport,
      })
      // 关闭默认创建的页面（避免性能浪费）
      const defaultPages = this.context.pages()
      for (const page of defaultPages) {
        await page.close().catch(() => {})
      }
      // 为浏览器设置全局路由拦截器
      if (this.config.features.enableResourceInterception) {
        console.log('[jsxp] 设置全局路由拦截器...')
        await this.setupGlobalRouteInterceptor()
        console.log('[jsxp] ✅ 全局路由拦截器设置完成')
      }
      // 启动性能监控
      this.pageCleanupTimer = setInterval(() => {
        this._cleanupIdlePages()
      }, this.config.pageCleanupInterval)
    } catch (error) {
      console.error('[jsxp] 浏览器实例启动失败:', error)
      throw error
    }
  }

  /** 为浏览器设置全局路由拦截器 */
  async setupGlobalRouteInterceptor(): Promise<void> {
    if (!this.browser) throw new Error('浏览器未初始化')
    if (!this.context) throw new Error('浏览器上下文未初始化')
    // 为浏览器上下文设置路由拦截器
    await this.context.route('**/*', async (route) => {
      const url = route.request().url()
      if (!this.isStaticResource(url)) {
        await route.continue()
        return
      }
      // console.log(`[jsxp] 📡 拦截到资源请求: ${url}`)
      const fileName = this.extractFileName(url)
      if (this.resourceCache.has(fileName)) {
        const cachedResource = this.resourceCache.get(fileName)!
        // 更新使用次数和最后使用时间
        cachedResource.usageCount += 1
        cachedResource.lastUsedAt = Date.now()
        this.resourceCache.set(fileName, cachedResource)

        await route.fulfill({
          status: cachedResource.status || 200,
          body: cachedResource.body,
          headers: cachedResource.headers,
        })
        // console.log(
        //   `[jsxp] ✅ [缓存命中] ${fileName} (使用次数: ${cachedResource.usageCount})`
        // )
        return
      }
      // 缓存未命中，放行请求，响应监听器会自动缓存
      // console.log(`[jsxp] ❌ [缓存未命中] ${fileName}`)
      await route.continue()
    })

    // 为浏览器上下文添加全局响应监听器
    this.context.on('response', async (response) => {
      const url = response.url()
      if (!this.isStaticResource(url)) return
      const fileName = this.extractFileName(url)
      // 只缓存成功的响应
      if (response.status() >= 200 && response.status() < 300) {
        try {
          const body = await response.body()
          const headers = response.headers()
          this.resourceCache.set(fileName, {
            body,
            headers,
            status: response.status(),
            usageCount: 0,
            createdAt: Date.now(),
            lastUsedAt: Date.now(),
          })
          this.totalCacheSize += body.length
          // console.log(
          //   `[jsxp] 💾 资源缓存成功: ${fileName} (当前总缓存: ${Math.round(
          //     this.totalCacheSize / 1024 / 1024
          //   )}MB)`
          // )
          // 检查是否需要清理缓存
          this._checkAndCleanupCache()
        } catch (error) {
          console.error(
            `[jsxp] ❌ 缓存响应失败 ${fileName}: ${(error as Error).message}`
          )
        }
      }
    })
  }

  /** 判断是否为静态资源 */
  isStaticResource(url: string): boolean {
    return /\.(css|js|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttc|ttf)(\?.*)?$/i.test(
      url
    )
  }

  /** 提取文件名 */
  extractFileName(urlOrPath: string): string {
    const baseUrl = urlOrPath.split('?')[0]
    return path.basename(baseUrl)
  }

  /** 获取内容类型 */
  getContentType(ext: string): string {
    const types: Record<string, string> = {
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttc': 'font/ttc',
      '.ttf': 'font/ttf',
    }
    return types[ext] || 'application/octet-stream'
  }

  /** 检查资源是否都在缓存中 */
  checkResourcesInCache(resources: string[]): boolean {
    if (!resources || resources.length === 0) return true
    const result = resources.every((fileName) => {
      const inCache = this.resourceCache.has(fileName)
      // console.log(
      //   `[jsxp] 检查缓存 ${fileName}: ${inCache ? '✅ 已缓存' : '❌ 未缓存'}`
      // )
      return inCache
    })
    console.log(`[jsxp] 缓存检查结果: ${result ? '全部已缓存' : '部分未缓存'}`)
    return result
  }

  /** 执行截图任务 */
  async executeTask(taskData: TaskData & { config?: any }): Promise<Buffer> {
    if (!this.browser) throw new Error('浏览器未初始化')

    // 检查是否被锁定，如果锁定则等待
    if (this.isLocked) {
      console.log('[jsxp] 🔒 浏览器正在重启中，任务进入等待队列')
      return new Promise((resolve, reject) => {
        this.taskQueue.push({
          taskData,
          resolve,
          reject,
          config: taskData.config || this.config,
        })
      })
    }

    // 检查是否需要重启浏览器
    if (this.renderCount >= this.maxRenderCountBeforeRestart) {
      console.log(
        `[jsxp] 🔄 达到渲染次数限制 (${this.renderCount}/${this.maxRenderCountBeforeRestart})，重启浏览器`
      )
      await this.restartBrowser()
    }

    // 增加渲染计数
    this.renderCount++
    console.log(
      `[jsxp] 📊 当前渲染计数: ${this.renderCount}/${this.maxRenderCountBeforeRestart}`
    )
    // 应用任务特定的配置（如果提供了的话）
    const taskConfig = taskData.config || {}
    const effectiveConfig = this.mergeConfig(this.config, taskConfig)
    // 检查是否启用队列处理
    if (!effectiveConfig.features.enableQueueProcessing) {
      return this._executeTaskInternal(taskData, effectiveConfig)
    }
    return new Promise((resolve, reject) => {
      if (this.activeTasks.size >= effectiveConfig.maxConcurrent) {
        console.log(
          `[jsxp] 任务 ${taskData.taskId} 进入队列等待，当前活跃任务: ${
            this.activeTasks.size
          }/${effectiveConfig.maxConcurrent}，队列长度: ${
            this.taskQueue.length + 1
          }`
        )
        this.taskQueue.push({
          taskData,
          resolve,
          reject,
          config: effectiveConfig,
        })
        return
      }
      this.activeTasks.add(taskData.taskId)
      console.log(
        `[jsxp] 执行任务${taskData.taskId}，当前活跃任务: ${this.activeTasks.size}/${effectiveConfig.maxConcurrent}`
      )
      this._executeTaskInternal(taskData, effectiveConfig)
        .then(resolve)
        .catch(reject)
        .finally(() => {
          this.activeTasks.delete(taskData.taskId)
          console.log(
            `[jsxp] 任务${taskData.taskId}执行完成，当前活跃任务: ${this.activeTasks.size}/${effectiveConfig.maxConcurrent}`
          )
          // 添加队列处理延迟
          setTimeout(
            () => this._processQueue(),
            effectiveConfig.queue.processDelay
          )
        })
    })
  }

  /** 处理任务队列 */
  private _processQueue(): void {
    // 如果浏览器被锁定，不处理队列
    if (this.isLocked) {
      console.log('[jsxp] 🔒 浏览器锁定中，暂停处理队列')
      return
    }

    while (this.taskQueue.length > 0) {
      const task = this.taskQueue[0] // 查看队列第一个任务但不移除
      const effectiveConfig = task.config || this.config
      if (this.activeTasks.size >= effectiveConfig.maxConcurrent) {
        break // 达到并发限制，停止处理
      }
      // 从队列中移除任务
      const dequeuedTask = this.taskQueue.shift()!
      const taskId = dequeuedTask.taskData.taskId
      this.activeTasks.add(taskId)
      console.log(
        `[jsxp] 从队列启动任务${taskId}，当前活跃: ${this.activeTasks.size}/${effectiveConfig.maxConcurrent}，队列剩余: ${this.taskQueue.length}`
      )
      this._executeTaskInternal(dequeuedTask.taskData, effectiveConfig)
        .then(dequeuedTask.resolve)
        .catch(dequeuedTask.reject)
        .finally(() => {
          this.activeTasks.delete(taskId)
          console.log(
            `[jsxp] 队列任务${taskId}完成，当前活跃: ${this.activeTasks.size}/${effectiveConfig.maxConcurrent}，队列剩余: ${this.taskQueue.length}`
          )
          setImmediate(() => this._processQueue())
        })
    }
  }

  /** 内部任务执行方法 */
  private async _executeTaskInternal(
    taskData: TaskData,
    config: any = this.config
  ): Promise<Buffer> {
    const timeoutMs = config.taskTimeout || this.config.taskTimeout
    let page: Page | null = null
    try {
      page = await this._getPageFromPool()
      ;(page as any)._lastUsed = Date.now()

      // 应用配置到页面（如果有视口配置）
      if (config.viewport) {
        await page.setViewportSize({
          width: config.viewport.width || this.config.viewport.width,
          height: config.viewport.height || this.config.viewport.height,
        })
      }

      // 根据任务类型选择执行方法
      const result = await Promise.race([
        (async () => {
          if (taskData.type === 'direct') {
            return await this.executeDirectRender(page!, taskData, config)
          } else {
            return await this.executeScreenshot(page!, taskData, config)
          }
        })(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('任务执行超时')), timeoutMs)
        ),
      ])
      await this._releasePageToPool(page)
      return result as Buffer
    } catch (error) {
      if (page) await page.close().catch(() => {})
      console.error(
        `[jsxp] 任务 ${taskData.taskId} 执行失败:`,
        (error as Error).message
      )
      throw error
    }
  }

  /** 执行直接渲染截图操作 */
  async executeDirectRender(
    page: Page,
    taskData: TaskData,
    config: any = this.config
  ): Promise<Buffer> {
    const { htmlContent, virtualUrl, PupOptions } = taskData
    const { selector, screenshot } = PupOptions ?? {}
    try {
      // console.log(`📝 HTML内容长度: ${htmlContent!.length} 字符`)
      console.log('[jsxp] 🔄 准备直接渲染HTML内容')
      const modifiedHtml = this.prepareHtmlForDirectRender(
        htmlContent!,
        virtualUrl!
      )
      const pageLoadTimeout =
        config.pageLoadTimeout || this.config.pageLoadTimeout
      const networkIdleTimeout =
        config.networkIdleTimeout || this.config.networkIdleTimeout

      await page.setContent(modifiedHtml, {
        waitUntil: 'networkidle',
        timeout: pageLoadTimeout,
      })
      console.log('[jsxp] ⏳ 等待页面资源加载完成...')
      await page.waitForLoadState('networkidle', {
        timeout: networkIdleTimeout,
      })
      const selectorToUse = selector ?? 'body'
      const targetElement = await page.waitForSelector(selectorToUse, {
        timeout: 3000,
        state: 'attached',
      })
      if (!targetElement) {
        throw new Error(`目标元素未找到: ${selectorToUse}`)
      }
      const screenshotOptions = {
        type: 'jpeg',
        quality: 90,
        ...(screenshot ?? {}),
      }
      if (screenshotOptions.type === 'png') {
        delete screenshotOptions.quality
      } else if (screenshotOptions.type === 'jpeg') {
        screenshotOptions.quality = screenshotOptions.quality || 90
      } else {
        console.warn(
          `[jsxp] 不支持的截图格式: ${screenshotOptions.type}，回退到JPEG`
        )
        screenshotOptions.type = 'jpeg'
        screenshotOptions.quality = 90
      }
      const buff = await targetElement.screenshot(screenshotOptions)
      console.log('[jsxp] 📸 直接渲染截图成功')
      return buff
    } catch (error) {
      console.error('[jsxp] 直接渲染失败:', (error as Error).message)
      throw error
    }
  }

  /** 执行文件渲染截图操作 */
  async executeScreenshot(
    page: Page,
    taskData: TaskData,
    config: any = this.config
  ): Promise<Buffer> {
    const { htmlFilePath, PupOptions } = taskData
    const { goto, selector, screenshot } = PupOptions ?? {}
    try {
      if (!htmlFilePath || typeof htmlFilePath !== 'string') {
        throw new Error(`无效的文件路径: ${htmlFilePath}`)
      }
      let fileUrl = htmlFilePath
      if (!fileUrl.startsWith('file://')) {
        fileUrl = fileUrl.replace(/\\/g, '/')
        if (!fileUrl.startsWith('/') && !fileUrl.match(/^[a-zA-Z]:/)) {
          fileUrl = path.resolve(fileUrl)
        }
        fileUrl = `file://${fileUrl}`
      }
      const actualFilePath = fileUrl.replace(/^file:\/\//, '')
      if (!fs.existsSync(actualFilePath)) {
        throw new Error(`文件不存在: ${actualFilePath}`)
      }

      const pageLoadTimeout =
        config.pageLoadTimeout || this.config.pageLoadTimeout

      await page.goto(fileUrl, {
        waitUntil: 'domcontentloaded',
        timeout: pageLoadTimeout,
        ...(goto ?? {}),
      })
      const selectorToUse = selector ?? 'body'
      const targetElement = await page.waitForSelector(selectorToUse, {
        timeout: 3000,
        state: 'attached',
      })
      if (!targetElement) {
        throw new Error(`目标元素未找到: ${selectorToUse}`)
      }
      const screenshotOptions = {
        type: 'jpeg',
        quality: 90,
        ...(screenshot ?? {}),
      }
      if (screenshotOptions.type === 'png') {
        delete screenshotOptions.quality
      } else if (screenshotOptions.type === 'jpeg') {
        screenshotOptions.quality = screenshotOptions.quality || 90
      } else {
        console.warn(
          `[jsxp] 不支持的截图格式: ${screenshotOptions.type}，回退到JPEG`
        )
        screenshotOptions.type = 'jpeg'
        screenshotOptions.quality = 90
      }
      const buff = await targetElement.screenshot(screenshotOptions)
      console.log('[jsxp] 截图成功')
      return buff
    } catch (error) {
      console.error('[jsxp] 截图错误:', error)
      if (
        (error as Error).message.includes('detached') ||
        (error as Error).message.includes('closed') ||
        (error as Error).message.includes('Target closed')
      ) {
        throw new Error('页面分离，需要重试')
      }
      if (
        (error as Error).message.includes('timeout') ||
        (error as Error).message.includes('Timeout')
      ) {
        throw new Error(`页面加载超时: ${htmlFilePath}`)
      }
      throw error
    }
  }

  /** 预处理HTML内容用于直接渲染 */
  private prepareHtmlForDirectRender(
    htmlContent: string,
    baseUrl: string
  ): string {
    if (!htmlContent.includes('<base')) {
      const headMatch = htmlContent.match(/<head[^>]*>/i)
      if (headMatch) {
        const headTag = headMatch[0]
        const baseTag = `<base href="${baseUrl}/">`
        htmlContent = htmlContent.replace(headTag, `${headTag}     ${baseTag}`)
      }
    }
    const resourceBase = `${baseUrl}/resources/`
    htmlContent = htmlContent.replace(
      /(href|src)=["']\.\/resources\/([^"']+)["']/gi,
      `$1="${resourceBase}$2"`
    )
    return htmlContent
  }

  /** 从页面池获取可复用页面 */
  private async _getPageFromPool(): Promise<Page> {
    // 检查是否启用页面池
    if (!this.config.features.enablePagePool) {
      console.log('[jsxp] 页面池已禁用，创建新页面')
      if (!this.context) throw new Error('浏览器上下文未初始化')
      return await this.context.newPage()
    }
    const defaultKey = 'default'
    if (
      this.pagePool.has(defaultKey) &&
      this.pagePool.get(defaultKey)!.length > 0
    ) {
      const page = this.pagePool.get(defaultKey)!.pop()!
      console.log(
        `[jsxp] 复用页面，当前池: ${this.pagePool.get(defaultKey)!.length}`
      )
      return page
    }
    console.log('[jsxp] 创建新页面')
    if (!this.context) throw new Error('浏览器上下文未初始化')
    const page = await this.context.newPage()
    return page
  }

  /** 释放页面到页面池 */
  private async _releasePageToPool(page: Page): Promise<void> {
    try {
      await this._cleanPageState(page)
      // 检查是否启用页面池
      if (!this.config.features.enablePagePool) {
        console.log('[jsxp] 页面池已禁用，直接关闭页面')
        await page.close()
        return
      }
      const defaultKey = 'default'
      if (!this.pagePool.has(defaultKey)) {
        this.pagePool.set(defaultKey, [])
      }
      const pages = this.pagePool.get(defaultKey)!
      // 检查页面池大小限制
      const currentSize = pages.length
      const maxSize = this.config.pagePoolMaxSize
      const minSize = this.config.pagePoolMinSize
      if (currentSize < maxSize) {
        ;(page as any)._lastUsed = Date.now()
        pages.push(page)
        console.log(
          `[jsxp] 页面释放到池，当前池大小: ${pages.length}/${maxSize}`
        )
      } else {
        // 页面池已满，根据活跃任务情况决定是否替换
        if (this.taskQueue.length > 0 || this.activeTasks.size > 0) {
          // 有任务等待，替换最旧页面
          const oldPage = pages.shift()!
          await oldPage.close().catch(() => {})
          ;(page as any)._lastUsed = Date.now()
          pages.push(page)
          console.log(
            `[jsxp] 页面池已满，替换最旧页面，当前池大小: ${pages.length}/${maxSize}`
          )
        } else if (currentSize > minSize) {
          // 无任务且超过最小保持数量，关闭页面
          console.log('[jsxp] 页面池已满且无任务，关闭页面')
          await page.close()
        } else {
          // 保持最小页面数量
          ;(page as any)._lastUsed = Date.now()
          pages.push(page)
          console.log(
            `[jsxp] 保持最小页面数量，当前池大小: ${pages.length}/${maxSize}`
          )
        }
      }
    } catch (error) {
      console.warn('[jsxp] 页面释放失败，直接关闭:', (error as Error).message)
      await page.close().catch(() => {})
    }
  }

  /** 清理页面状态 */
  private async _cleanPageState(page: Page): Promise<void> {
    try {
      await page.evaluate(() => {
        document.body.innerHTML = ''
      })
    } catch (error) {
      console.warn('[jsxp] 页面状态清理失败:', (error as Error).message)
      throw error
    }
  }

  /** 清理空闲时间过长的页面 */
  private async _cleanupIdlePages(): Promise<void> {
    let totalCleaned = 0
    const defaultKey = 'default'
    if (this.pagePool.has(defaultKey)) {
      const pages = this.pagePool.get(defaultKey)!
      const activePages: Page[] = []
      for (const page of pages) {
        const idleTime = Date.now() - ((page as any)._lastUsed || 0)
        if (idleTime > this.config.pageIdleTimeout) {
          console.log(
            `[jsxp] 清理空闲页面（空闲 ${Math.round(idleTime / 1000)}秒）`
          )
          await page.close().catch(() => {})
          totalCleaned++
        } else {
          activePages.push(page)
        }
      }
      if (activePages.length === 0) {
        this.pagePool.delete(defaultKey)
      } else {
        this.pagePool.set(defaultKey, activePages)
      }
    }
    if (totalCleaned > 0) {
      console.log(`[jsxp] 清理了 ${totalCleaned} 个空闲页面`)
    }
  }

  /** 重启浏览器 */
  async restartBrowser(): Promise<void> {
    // 检查是否已经锁定，防止并发重启
    if (this.isLocked) {
      console.log('[jsxp] ⚠️ 浏览器重启操作已在进行中，跳过重复重启')
      return
    }

    // 设置锁定标志
    this.isLocked = true
    console.log('[jsxp] 🔒 锁定浏览器操作')

    try {
      console.log('[jsxp] 🔄 正在重启浏览器...')
      await this.close(true) // 传递锁定状态给close方法
      await this.init(this.config)
      this.renderCount = 0
      console.log('[jsxp] ✅ 浏览器重启完成')
    } finally {
      // 无论如何都要解锁
      this.isLocked = false
      console.log('[jsxp] 🔓 解锁浏览器操作')

      // 重启完成后处理等待队列中的任务
      if (this.taskQueue.length > 0) {
        console.log(
          `[jsxp] 🔄 处理等待队列中的 ${this.taskQueue.length} 个任务`
        )
        this._processQueue()
      }
    }
  }

  /** 关闭浏览器 */
  async close(isRestart?: boolean): Promise<void> {
    const isRestartOperation = isRestart || false
    // 如果是重启操作且已经锁定，跳过关闭
    if (isRestartOperation && this.isLocked) {
      console.log('[jsxp] ⚠️ 浏览器已锁定，跳过关闭操作')
      return
    }
    if (this.pageCleanupTimer) {
      clearInterval(this.pageCleanupTimer)
      this.pageCleanupTimer = null
    }
    // 如果是重启操作，不清空等待队列，让重启后继续处理
    if (!isRestartOperation && this.taskQueue.length > 0) {
      console.log(`[jsxp] 清空 ${this.taskQueue.length} 个等待任务`)
      this.taskQueue.forEach((task) => {
        task.reject(new Error('浏览器关闭，任务被取消'))
      })
      this.taskQueue = []
    }
    if (this.activeTasks.size > 0) {
      console.log(`[jsxp] 等待 ${this.activeTasks.size} 个活跃任务完成...`)
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
    if (this.taskQueue.length > 0) {
      console.log(`[jsxp] 清空 ${this.taskQueue.length} 个等待任务`)
      this.taskQueue.forEach((task) => {
        task.reject(new Error('浏览器关闭，任务被取消'))
      })
      this.taskQueue = []
    }
    let pageCount = 0
    const pageValues = Array.from(this.pagePool.values())
    for (const pages of pageValues) {
      pageCount += pages.length
      for (const page of pages) {
        await page.close().catch(() => {})
      }
    }
    this.pagePool.clear()
    if (pageCount > 0) {
      console.log(`[jsxp] 清理了 ${pageCount} 个页面池中的页面`)
    }
    if (this.browser) {
      await this.browser.close()
      console.log('[jsxp] 浏览器已优雅关闭')
    }
    this.activeTasks.clear()
  }

  /** 合并配置 */
  private mergeConfig(defaultConfig: any, overrideConfig: any): any {
    const result = { ...defaultConfig }
    for (const key in overrideConfig) {
      if (overrideConfig[key] !== undefined) {
        if (
          typeof overrideConfig[key] === 'object' &&
          overrideConfig[key] !== null &&
          typeof result[key] === 'object' &&
          result[key] !== null
        ) {
          // 深度合并对象
          result[key] = this.mergeConfig(result[key], overrideConfig[key])
        } else {
          // 直接覆盖
          result[key] = overrideConfig[key]
        }
      }
    }

    return result
  }

  /** 检查并清理缓存 */
  private _checkAndCleanupCache(): void {
    // 检查是否启用资源缓存
    if (!this.config.features.enableResourceCache) return
    const cacheSize = this.resourceCache.size
    // 检查是否需要清理
    if (
      cacheSize <= this.config.cacheCleanup.maxItems &&
      this.totalCacheSize <= this.config.cacheCleanup.maxSize
    ) {
      return
    }
    console.log(
      `[jsxp] 🗑️ 触发缓存清理: ${cacheSize}个资源, ${Math.round(
        this.totalCacheSize / 1024 / 1024
      )}MB`
    )
    this._cleanupCache()
  }

  /** 执行缓存清理 */
  private _cleanupCache(): void {
    const cacheItems = Array.from(this.resourceCache.entries())
    // 按使用次数和创建时间排序（优先清理使用次数少的，次数相同则清理加入时间早的）
    cacheItems.sort((a, b) => {
      const [, itemA] = a
      const [, itemB] = b
      const now = Date.now()
      const ageA = now - itemA.createdAt
      const ageB = now - itemB.createdAt

      // 优先清理超过最小保留时间的资源
      if (
        ageA < this.config.cacheCleanup.minAge &&
        ageB >= this.config.cacheCleanup.minAge
      ) {
        return -1
      }
      if (
        ageA >= this.config.cacheCleanup.minAge &&
        ageB < this.config.cacheCleanup.minAge
      ) {
        return 1
      }

      // 都在最小保留时间内或都超过，按使用次数排序（使用次数少的优先清理）
      if (itemA.usageCount !== itemB.usageCount) {
        return itemA.usageCount - itemB.usageCount
      }
      // 使用次数相同则按创建时间排序（创建时间早的优先清理）
      return itemA.createdAt - itemB.createdAt
    })

    // 计算需要清理的数量
    const itemsToRemove = Math.ceil(
      cacheItems.length * this.config.cacheCleanup.cleanupRatio
    )
    const itemsToKeep = cacheItems.length - itemsToRemove

    // 清理缓存并更新总大小
    let removedCount = 0
    for (let i = 0; i < cacheItems.length; i++) {
      if (removedCount >= itemsToRemove) break

      const [key, item] = cacheItems[i]
      const age = Date.now() - item.createdAt

      // 只清理超过最小保留时间的资源
      if (age >= this.config.cacheCleanup.minAge) {
        this.totalCacheSize -= item.body.length
        this.resourceCache.delete(key)
        removedCount++
      }
    }

    console.log(
      `[jsxp] ✅ 缓存清理完成: 保留${itemsToKeep}个, 清理${removedCount}个资源`
    )
  }
}

/** 获取浏览器池管理器实例 */
const getBrowserPoolManager = async (
  config?: any
): Promise<BrowserPoolManager> => {
  if (!browserPoolInstance) {
    browserPoolInstance = new BrowserPoolManager()
    await browserPoolInstance.init(config)
  }
  return browserPoolInstance
}

export { BrowserPoolManager, getBrowserPoolManager }
