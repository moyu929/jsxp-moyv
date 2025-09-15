import { chromium } from "playwright";
import { BrowserPool, PlaywrightPlugin } from "browser-pool";
import path from "path";
import fs from "fs";

// 浏览器池实例
let browserPoolInstance = null;

/**
 * 浏览器池管理器 - 使用Playwright + BrowserPool实现高性能截图
 * 支持智能队列管理、资源监控和性能优化
 */
class BrowserPoolManager {
  constructor() {
    this.browserPool = null;
    this.activeTasks = new Set(); // 当前活跃任务集合
    this.taskQueue = []; // 任务等待队列
    this.maxConcurrent = 10; // 最大并发任务数
    this.monitorInterval = null; // 性能监控定时器
    this.warmupTimer = null; // 浏览器预热定时器

    // 页面池管理
    this.pagePool = new Map(); // 页面池对象
    this.maxPagesPerBrowser = 10; // 页面池大小限制
    this.pageCleanupTimer = null; // 页面清理定时器
    this.pageIdleTimeout = 10 * 60 * 1000; // 页面空闲超时（单位：毫秒）

    this.playwrightOptions = {
      headless: true,
      timeout: 20000,
      args: [
        // ==================== 基础安全优化 ====================
        "--disable-dev-shm-usage", // 禁用共享内存，避免Docker环境问题
        "--disable-setuid-sandbox", // 禁用setuid沙盒（Linux环境优化）
        "--no-sandbox", // 完全禁用沙盒，提高无头浏览器兼容性

        // ==================== 性能优化 - 禁用无用功能 ====================
        "--disable-background-networking", // 禁用后台网络活动
        "--disable-background-timer-throttling", // 禁用后台定时器节流
        "--disable-backgrounding-occluded-windows", // 禁用被遮挡窗口的后台处理
        "--disable-extensions", // 禁用浏览器扩展
        "--disable-sync", // 禁用同步功能
        "--disable-default-apps", // 禁用默认应用
        "--disable-translate", // 禁用翻译功能
        "--disable-save-password-bubble", // 禁用保存密码气泡
        "--disable-password-generation", // 禁用密码生成功能
        "--disable-auto-reload", // 禁用自动重新加载
        "--disable-features=TranslateUI,BlinkGenPropertyTrees", // 禁用特定功能
        "--disable-hang-monitor", // 禁用挂起监控
        "--disable-ipc-flooding-protection", // 禁用IPC洪水保护
        "--disable-notifications", // 禁用通知功能
        "--disable-popup-blocking", // 禁用弹出窗口阻止
        "--disable-prompt-on-repost", // 禁用重新发布提示
        "--disable-renderer-backgrounding", // 禁用渲染器后台处理
        "--disable-search-engine-choice-screen", // 禁用搜索引擎选择屏幕
        "--disable-site-isolation-trials", // 禁用站点隔离试验
        "--disable-speech-api", // 禁用语音API
        "--disable-webrtc", // 禁用WebRTC（减少资源占用）
        "--disable-webgl", // 禁用WebGL（减少GPU内存）
        "--disable-3d-apis", // 禁用3D API
        "--disable-canvas-aa", // 禁用Canvas抗锯齿
        "--disable-2d-canvas-clip-aa", // 禁用2D Canvas裁剪抗锯齿
        "--disable-gl-drawing-for-tests", // 禁用测试用的GL绘制
        "--disable-accelerated-2d-canvas", // 禁用加速2D Canvas
        "--disable-accelerated-video-decode", // 禁用加速视频解码
        "--disable-breakpad", // 禁用崩溃报告
        "--disable-client-side-phishing-detection", // 禁用客户端钓鱼检测
        "--disable-component-extensions-with-background-pages", // 禁用后台页面组件扩展
        "--disable-datasaver-prompt", // 禁用数据节省提示
        "--disable-domain-reliability", // 禁用域可靠性监控
        "--disable-gpu-sandbox", // 禁用GPU沙盒
        "--disable-print-preview", // 禁用打印预览
        "--disable-remote-fonts", // 禁用远程字体
        "--disable-shared-workers", // 禁用共享worker
        "--disable-software-rasterizer", // 禁用软件光栅化器
        "--disable-threaded-animation", // 禁用线程动画
        "--disable-threaded-scrolling", // 禁用线程滚动
        "--disable-v8-idle-tasks", // 禁用V8空闲任务
        "--disable-video-capture", // 禁用视频捕获
        "--disable-web-media-player", // 禁用Web媒体播放器
        "--enable-aggressive-domstorage-flushing", // 启用积极的DOM存储刷新
        "--enable-low-end-device-mode", // 启用低端设备模式
        "--force-color-profile=srgb", // 强制使用sRGB色彩配置
        "--metrics-recording-only", // 仅记录指标（无上报）
        "--mute-audio", // 静音音频输出
        "--no-pings", // 禁用ping请求
        "--no-zygote", // 禁用zygote进程（Linux优化）

        // ==================== 字体和渲染优化 ====================
        "--enable-font-antialiasing", // 启用字体抗锯齿
        "--font-render-hinting=none", // 字体渲染提示设为无
        "--force-device-scale-factor=1", // 强制设备缩放因子为1
        "--high-dpi-support=1", // 高DPI支持设为1
        "--ignore-certificate-errors", // 忽略证书错误（用于测试）
        "--ignore-gpu-blacklist", // 忽略GPU黑名单
        "--enable-gpu-rasterization", // 启用GPU光栅化加速
        "--enable-zero-copy", // 启用零拷贝，提升渲染性能
        "--max-old-space-size=2048", // 设置最大老生代空间为2GB
        "--memory-pressure-off", // 关闭内存压力检测
        "--reduce-security-for-testing", // 为测试减少安全限制

        // ==================== 自动化优化 ====================
        "--enable-automation", // 启用自动化标志
        "--no-first-run", // 跳过首次运行检查
        "--no-default-browser-check", // 跳过默认浏览器检查
        "--disable-blink-features=AutomationControlled", // 禁用自动化控制特性
        "--disable-features=VizDisplayCompositor", // 禁用Viz显示合成器
      ],
    };
  }

  /**
   * 初始化浏览器池
   */
  async init() {
    try {
      this.browserPool = new BrowserPool({
        browserPlugins: [
          new PlaywrightPlugin(chromium, {
            launchOptions: {
              ...this.playwrightOptions,
              viewport: { width: 800, height: 600 },
            },
          }),
        ],
        maxOpenPagesPerBrowser: 5, // 每个浏览器的页面数上限
        retireBrowserAfterPageCount: 200, // 浏览器处理200个页面后自动退休
        closeInactiveBrowserAfterSecs: 15 * 60, // 闲置浏览器15分钟后自动关闭
        operationTimeoutSecs: 15, // 单个浏览器操作15秒超时
      });
      console.log("[jsxp] 浏览器池初始化成功");
      // 启动性能监控
      this.pageCleanupTimer = setInterval(() => {
        this._cleanupIdlePages();
      }, 3 * 60 * 1000); // 每3分钟清理一次空闲页面
    } catch (error) {
      console.error("[jsxp] 浏览器池初始化失败:", error);
      throw error;
    }
  }

  /**
   * 执行截图任务
   * @param {object} taskData 任务数据
   */
  async executeTask(taskData) {
    if (!this.browserPool) throw new Error("浏览器池未初始化");
    // 生成任务ID用于追踪
    const taskId = taskData.taskId;
    return new Promise((resolve, reject) => {
      // 使用同步检查和添加，避免竞态条件
      if (this.activeTasks.size >= this.maxConcurrent) {
        console.log(
          `[jsxp] 任务 ${taskId} 进入队列等待，当前活跃任务: ${
            this.activeTasks.size
          }/${this.maxConcurrent}，队列长度: ${this.taskQueue.length + 1}`
        );
        this.taskQueue.push({ taskData, resolve, reject });
        return;
      }
      // 立即添加到活跃任务集合，防止并发竞争
      this.activeTasks.add(taskId);
      console.log(
        `[jsxp] 直接执行任务 ${taskId}，当前活跃任务: ${this.activeTasks.size}/${this.maxConcurrent}`
      );
      // 异步执行任务
      this._executeTaskInternal(taskData)
        .then(resolve)
        .catch(reject)
        .finally(() => {
          this.activeTasks.delete(taskId);
          console.log(
            `[jsxp] 任务 ${taskId} 执行完成，当前活跃任务: ${this.activeTasks.size}/${this.maxConcurrent}`
          );
          // 使用 setImmediate 确保队列处理不会阻塞当前任务的返回
          setImmediate(() => this._processQueue());
        });
    });
  }

  /** 处理任务队列 */
  _processQueue() {
    // 处理队列中的任务
    while (
      this.taskQueue.length > 0 &&
      this.activeTasks.size < this.maxConcurrent
    ) {
      const task = this.taskQueue.shift();
      const taskId = task.taskData.taskId;
      this.activeTasks.add(taskId);
      console.log(
        `[jsxp] 从队列启动任务 ${taskId}，当前活跃: ${this.activeTasks.size}/${this.maxConcurrent}，队列剩余: ${this.taskQueue.length}`
      );
      // 异步执行任务，不阻塞队列处理
      this._executeTaskInternal(task.taskData)
        .then((result) => {
          task.resolve(result);
        })
        .catch((error) => {
          task.reject(error);
        })
        .finally(() => {
          this.activeTasks.delete(taskId);
          console.log(
            `[jsxp] 队列任务 ${taskId} 完成，当前活跃: ${this.activeTasks.size}/${this.maxConcurrent}，队列剩余: ${this.taskQueue.length}`
          );
          // 任务完成后继续处理队列
          setImmediate(() => this._processQueue());
        });
    }
  }

  /** 内部任务执行方法 */
  async _executeTaskInternal(taskData) {
    const timeoutMs = 15000; // 15秒超时
    try {
      // 使用Promise.race实现超时控制
      const result = await Promise.race([
        this._executeScreenshotWithRetry(taskData),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("任务执行超时")), timeoutMs)
        ),
      ]);
      return result;
    } catch (error) {
      console.error(`[jsxp] 任务 ${taskData.taskId} 执行失败:`, error.message);
      throw error;
    }
  }

  /** 截图执行 */
  async _executeScreenshotWithRetry(taskData, maxRetries = 2) {
    let page = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // 从页面池获取页面（优先复用）
        page = await this._getPageFromPool();
        page._lastUsed = Date.now(); // 记录使用时间
        const result = await this.executeScreenshot(page, taskData);
        // 成功完成后释放页面到池中（不关闭）
        await this._releasePageToPool(page);
        return result;
      } catch (error) {
        // 清理当前页面（如果存在）
        if (page) {
          await page.close().catch(() => {});
          page = null;
        }
        if (attempt === maxRetries) throw error;
        // 可重试的错误类型
        if (
          error.message.includes("页面分离") ||
          error.message.includes("detached") ||
          error.message.includes("Target closed") ||
          error.message.includes("导航")
        ) {
          console.log(`[jsxp] 任务 ${taskData.taskId} 第 ${attempt} 次重试...`);
          // 智能重试等待：第一次重试等待500ms，第二次等待1s
          const waitTime = attempt == 1 ? 500 : 1000;
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }
        throw error;
      }
    }
  }

  /** 执行具体的截图操作 */
  async executeScreenshot(page, taskData) {
    const { htmlFilePath, PupOptions } = taskData;
    const { goto, selector, screenshot } = PupOptions ?? {};
    try {
      // 检查文件路径是否有效
      if (!htmlFilePath || typeof htmlFilePath !== "string") {
        throw new Error(`无效的文件路径: ${htmlFilePath}`);
      }
      // 处理Windows路径分隔符和绝对路径
      let fileUrl = htmlFilePath;
      if (!fileUrl.startsWith("file://")) {
        fileUrl = fileUrl.replace(/\\/g, "/");
        if (!fileUrl.startsWith("/") && !fileUrl.match(/^[a-zA-Z]:/)) {
          fileUrl = path.resolve(fileUrl);
        }
        fileUrl = `file://${fileUrl}`;
      }
      // 提取实际文件路径检查文件是否存在
      const actualFilePath = fileUrl.replace(/^file:\/\//, "");
      if (!fs.existsSync(actualFilePath)) {
        throw new Error(`文件不存在: ${actualFilePath}`);
      }
      // 导航到页面
      await page.goto(fileUrl, {
        waitUntil: "domcontentloaded",
        timeout: 3000,
        ...(goto ?? {}),
      });
      // 等待目标元素
      const selectorToUse = selector ?? "body";
      const targetElement = await page.waitForSelector(selectorToUse, {
        timeout: 3000,
        state: "attached",
      });
      if (!targetElement) {
        throw new Error(`目标元素未找到: ${selectorToUse}`);
      }
      // 截图选项
      const screenshotOptions = {
        type: "jpeg",
        quality: 90,
        ...(screenshot ?? {}),
      };
      // 根据格式调整quality设置
      if (screenshotOptions.type === "png") {
        delete screenshotOptions.quality;
      } else if (screenshotOptions.type === "jpeg") {
        screenshotOptions.quality = screenshotOptions.quality || 90;
      } else {
        // 如果用户指定了不支持的格式，回退到JPEG
        console.warn(
          `[jsxp] 不支持的截图格式: ${screenshotOptions.type}，回退到JPEG`
        );
        screenshotOptions.type = "jpeg";
        screenshotOptions.quality = 90;
      }
      const buff = await targetElement.screenshot(screenshotOptions);
      console.log("[jsxp] 截图成功");
      return buff;
    } catch (error) {
      console.error("[jsxp] 截图错误:", error);
      if (
        error.message.includes("detached") ||
        error.message.includes("closed") ||
        error.message.includes("Target closed")
      ) {
        throw new Error("页面分离，需要重试");
      }
      if (
        error.message.includes("timeout") ||
        error.message.includes("Timeout")
      ) {
        throw new Error(`页面加载超时: ${htmlFilePath}`);
      }

      throw error;
    }
  }

  /** 从页面池获取可复用页面 */
  async _getPageFromPool() {
    // 检查是否有空闲页面
    const defaultKey = "default";
    if (
      this.pagePool.has(defaultKey) &&
      this.pagePool.get(defaultKey).length > 0
    ) {
      const page = this.pagePool.get(defaultKey).pop();
      console.log(
        `[jsxp] 复用页面，当前池: ${this.pagePool.get(defaultKey).length}`
      );
      return page;
    }
    // 没有空闲页面，创建新页面
    console.log("[jsxp] 创建新页面，将自动分配或创建浏览器实例");
    const page = await this.browserPool.newPage();
    return page;
  }

  /** 释放页面到页面池 */
  async _releasePageToPool(page) {
    try {
      // 清理页面状态
      await this._cleanPageState(page);
      const defaultKey = "default";
      if (!this.pagePool.has(defaultKey)) {
        this.pagePool.set(defaultKey, []);
      }
      const pages = this.pagePool.get(defaultKey);
      // 如果页面池未满，直接添加
      if (pages.length < this.maxPagesPerBrowser) {
        page._lastUsed = Date.now(); // 记录最后使用时间
        pages.push(page);
        // 减少详细日志输出，只在需要时启用
        // console.log(`[jsxp] 页面释放到池中，当前池大小: ${pages.length}`);
      } else {
        // 页面池已满，根据情况决定是否替换
        if (this.taskQueue.length > 0 || this.activeTasks.size > 0) {
          // 有活跃任务或等待任务，替换最旧的页面
          const oldPage = pages.shift();
          await oldPage.close().catch(() => {});
          page._lastUsed = Date.now();
          pages.push(page);
          console.log(
            `[jsxp] 页面池已满，替换最旧页面，当前池大小: ${pages.length}`
          );
        } else {
          // 没有任务需要处理，直接关闭页面
          console.log("[jsxp] 页面池已满且无任务，关闭页面");
          await page.close();
        }
      }
    } catch (error) {
      console.warn("[jsxp] 页面释放失败，直接关闭:", error.message);
      await page.close().catch(() => {}); // 安全关闭
    }
  }

  /** 清理页面状态 */
  async _cleanPageState(page) {
    try {
      // 轻量级清理：清除页面内容而不导航
      await page.evaluate(() => {
        document.body.innerHTML = "";
      });
    } catch (error) {
      console.warn("[jsxp] 页面状态清理失败:", error.message);
      // 清理失败时直接关闭页面
      throw error;
    }
  }

  /** 清理空闲时间过长的页面 */
  async _cleanupIdlePages() {
    let totalCleaned = 0;
    const defaultKey = "default";
    if (this.pagePool.has(defaultKey)) {
      const pages = this.pagePool.get(defaultKey);
      const activePages = [];
      for (const page of pages) {
        // 检查页面是否超过空闲时间
        const idleTime = Date.now() - (page._lastUsed || 0);
        if (idleTime > this.pageIdleTimeout) {
          console.log(
            `[jsxp] 清理空闲页面（空闲 ${Math.round(idleTime / 1000)}秒）`
          );
          await page.close().catch(() => {});
          totalCleaned++;
        } else {
          activePages.push(page);
        }
      }
      if (activePages.length === 0) {
        this.pagePool.delete(defaultKey);
      } else {
        this.pagePool.set(defaultKey, activePages);
      }
    }
    if (totalCleaned > 0) {
      console.log(`[jsxp] 清理了 ${totalCleaned} 个空闲页面`);
    }
  }

  /** 关闭浏览器池 */
  async close() {
    // 清理监控定时器
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    if (this.warmupTimer) {
      clearInterval(this.warmupTimer);
      this.warmupTimer = null;
    }
    if (this.pageCleanupTimer) {
      clearInterval(this.pageCleanupTimer);
      this.pageCleanupTimer = null;
    }
    // 等待当前活跃任务完成
    if (this.activeTasks.size > 0) {
      console.log(`[jsxp] 等待 ${this.activeTasks.size} 个活跃任务完成...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    // 清空任务队列
    if (this.taskQueue.length > 0) {
      console.log(`[jsxp] 清空 ${this.taskQueue.length} 个等待任务`);
      this.taskQueue.forEach((task) => {
        task.reject(new Error("浏览器池关闭，任务被取消"));
      });
      this.taskQueue = [];
    }
    // 清理页面池中的所有页面
    let pageCount = 0;
    for (const [browserKey, pages] of this.pagePool.entries()) {
      pageCount += pages.length;
      for (const page of pages) {
        await page.close().catch(() => {});
      }
    }
    this.pagePool.clear();
    if (pageCount > 0) {
      console.log(`[jsxp] 清理了 ${pageCount} 个页面池中的页面`);
    }
    // 关闭浏览器池
    if (this.browserPool) {
      await this.browserPool.destroy();
      console.log("[jsxp] 浏览器池已优雅关闭");
    }
    this.activeTasks.clear();
  }
}

/** 获取浏览器池管理器实例 */
const getBrowserPoolManager = async () => {
  if (!browserPoolInstance) {
    browserPoolInstance = new BrowserPoolManager();
    await browserPoolInstance.init();
  }
  return browserPoolInstance;
};

export { BrowserPoolManager, getBrowserPoolManager };
