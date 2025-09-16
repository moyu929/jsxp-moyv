import { chromium } from 'playwright';
import { BrowserPool, PlaywrightPlugin } from 'browser-pool';
import path from 'path';
import fs from 'fs';

// import { promises as fsPromises } from "fs";
// 浏览器池实例
let browserPoolInstance = null;
/**
 * 浏览器池管理器 - 使用Playwright + BrowserPool实现高性能截图
 * 支持智能队列管理、资源监控和性能优化
 */
class BrowserPoolManager {
    browserPool = null;
    activeTasks = new Set();
    taskQueue = [];
    maxConcurrent = 10;
    // 页面池管理
    pagePool = new Map();
    maxPagesPerBrowser = 10;
    pageCleanupTimer = null;
    pageIdleTimeout = 10 * 60 * 1000;
    // 资源缓存系统
    resourceCache = new Map();
    playwrightOptions = {
        headless: true,
        timeout: 20000,
        viewport: { width: 800, height: 600 },
    };
    /** 初始化浏览器池 */
    async init() {
        try {
            console.log("🚀 启动浏览器实例...");
            // 创建浏览器池，使用postPageCreateHooks为每个新页面设置路由拦截器
            this.browserPool = new BrowserPool({
                browserPlugins: [
                    new PlaywrightPlugin(chromium, {
                        launchOptions: { ...this.playwrightOptions },
                    }),
                ],
                maxOpenPagesPerBrowser: 5,
                retireBrowserAfterPageCount: 200,
                closeInactiveBrowserAfterSecs: 15 * 60,
                operationTimeoutSecs: 15,
                postPageCreateHooks: [
                    async (page) => {
                        console.log("[jsxp] 🔧 为新页面设置路由拦截器...");
                        await this.setupPageRouteInterceptor(page);
                        console.log("[jsxp] ✅ 页面路由拦截器设置完成");
                    },
                ],
            });
            console.log("[jsxp] 浏览器池初始化成功");
            // 启动性能监控
            this.pageCleanupTimer = setInterval(() => {
                this._cleanupIdlePages();
            }, 3 * 60 * 1000);
        }
        catch (error) {
            console.error("[jsxp] 浏览器池初始化失败:", error);
            throw error;
        }
    }
    /** 为单个页面设置路由拦截器 */
    async setupPageRouteInterceptor(page) {
        await page.route("**/*", async (route) => {
            const url = route.request().url();
            if (!this.isStaticResource(url)) {
                await route.continue();
                return;
            }
            console.log(`[jsxp] 📡 拦截到资源请求: ${url}`);
            const fileName = this.extractFileName(url);
            if (this.resourceCache.has(fileName)) {
                const cachedResource = this.resourceCache.get(fileName);
                await route.fulfill({
                    status: cachedResource.status || 200,
                    body: cachedResource.body,
                    headers: cachedResource.headers,
                });
                console.log(`[jsxp] ✅ [缓存命中] ${fileName}`);
                return;
            }
            // 缓存未命中，放行请求，响应监听器会自动缓存
            console.log(`[jsxp] ❌ [缓存未命中] ${fileName}`);
            await route.continue();
        });
        // 添加响应监听器来自动缓存成功的资源
        page.on("response", async (response) => {
            const url = response.url();
            if (!this.isStaticResource(url))
                return;
            const fileName = this.extractFileName(url);
            // 只缓存成功的响应（200-299状态码）
            if (response.status() >= 200 && response.status() < 300) {
                try {
                    const body = await response.body();
                    const headers = response.headers();
                    this.resourceCache.set(fileName, {
                        body,
                        headers,
                        status: response.status(),
                    });
                    console.log(`[jsxp] 💾 资源缓存成功: ${fileName}`);
                }
                catch (error) {
                    console.error(`[jsxp] ❌ 缓存响应失败 ${fileName}: ${error.message}`);
                }
            }
        });
    }
    /** 判断是否为静态资源 */
    isStaticResource(url) {
        return /\.(css|js|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttc|ttf)(\?.*)?$/i.test(url);
    }
    /** 提取文件名 */
    extractFileName(urlOrPath) {
        const baseUrl = urlOrPath.split("?")[0];
        return decodeURIComponent(path.basename(baseUrl));
    }
    /** 获取内容类型 */
    getContentType(ext) {
        const types = {
            ".css": "text/css",
            ".js": "application/javascript",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".gif": "image/gif",
            ".svg": "image/svg+xml",
            ".webp": "image/webp",
            ".woff": "font/woff",
            ".woff2": "font/woff2",
            ".ttc": "font/ttc",
            ".ttf": "font/ttf",
        };
        return types[ext] || "application/octet-stream";
    }
    /** 检查资源是否都在缓存中 */
    checkResourcesInCache(resources) {
        if (!resources || resources.length === 0)
            return true;
        const result = resources.every((fileName) => {
            const inCache = this.resourceCache.has(fileName);
            console.log(`[jsxp] 检查缓存 ${fileName}: ${inCache ? "✅ 已缓存" : "❌ 未缓存"}`);
            return inCache;
        });
        console.log(`[jsxp] 缓存检查结果: ${result ? "全部已缓存" : "部分未缓存"}`);
        return result;
    }
    /** 执行截图任务 */
    async executeTask(taskData) {
        if (!this.browserPool)
            throw new Error("浏览器池未初始化");
        return new Promise((resolve, reject) => {
            if (this.activeTasks.size >= this.maxConcurrent) {
                console.log(`[jsxp] 任务 ${taskData.taskId} 进入队列等待，当前活跃任务: ${this.activeTasks.size}/${this.maxConcurrent}，队列长度: ${this.taskQueue.length + 1}`);
                this.taskQueue.push({ taskData, resolve, reject });
                return;
            }
            this.activeTasks.add(taskData.taskId);
            console.log(`[jsxp] 直接执行任务 ${taskData.taskId}，当前活跃任务: ${this.activeTasks.size}/${this.maxConcurrent}`);
            this._executeTaskInternal(taskData)
                .then(resolve)
                .catch(reject)
                .finally(() => {
                this.activeTasks.delete(taskData.taskId);
                console.log(`[jsxp] 任务 ${taskData.taskId} 执行完成，当前活跃任务: ${this.activeTasks.size}/${this.maxConcurrent}`);
                setImmediate(() => this._processQueue());
            });
        });
    }
    /** 处理任务队列 */
    _processQueue() {
        while (this.taskQueue.length > 0 &&
            this.activeTasks.size < this.maxConcurrent) {
            const task = this.taskQueue.shift();
            const taskId = task.taskData.taskId;
            this.activeTasks.add(taskId);
            console.log(`[jsxp] 从队列启动任务 ${taskId}，当前活跃: ${this.activeTasks.size}/${this.maxConcurrent}，队列剩余: ${this.taskQueue.length}`);
            this._executeTaskInternal(task.taskData)
                .then(task.resolve)
                .catch(task.reject)
                .finally(() => {
                this.activeTasks.delete(taskId);
                console.log(`[jsxp] 队列任务 ${taskId} 完成，当前活跃: ${this.activeTasks.size}/${this.maxConcurrent}，队列剩余: ${this.taskQueue.length}`);
                setImmediate(() => this._processQueue());
            });
        }
    }
    /** 内部任务执行方法 */
    async _executeTaskInternal(taskData) {
        const timeoutMs = 15000;
        try {
            const executeMethod = taskData.type === "direct"
                ? this._executeDirectRenderWithRetry(taskData)
                : this._executeScreenshotWithRetry(taskData);
            const result = await Promise.race([
                executeMethod,
                new Promise((_, reject) => setTimeout(() => reject(new Error("任务执行超时")), timeoutMs)),
            ]);
            return result;
        }
        catch (error) {
            console.error(`[jsxp] 任务 ${taskData.taskId} 执行失败:`, error.message);
            throw error;
        }
    }
    /** 直接渲染模式 */
    async _executeDirectRenderWithRetry(taskData) {
        let page = null;
        try {
            page = await this._getPageFromPool();
            page._lastUsed = Date.now();
            const result = await this.executeDirectRender(page, taskData);
            await this._releasePageToPool(page);
            return result;
        }
        catch (error) {
            if (page)
                await page.close().catch(() => { });
            throw error;
        }
    }
    /** 文件模式 */
    async _executeScreenshotWithRetry(taskData) {
        let page = null;
        try {
            page = await this._getPageFromPool();
            page._lastUsed = Date.now();
            const result = await this.executeScreenshot(page, taskData);
            await this._releasePageToPool(page);
            return result;
        }
        catch (error) {
            if (page)
                await page.close().catch(() => { });
            throw error;
        }
    }
    /** 执行直接渲染截图操作 */
    async executeDirectRender(page, taskData) {
        const { htmlContent, virtualUrl, PupOptions } = taskData;
        const { selector, screenshot } = PupOptions ?? {};
        try {
            console.log(`📝 HTML内容长度: ${htmlContent.length} 字符`);
            console.log("🔄 准备直接渲染HTML内容");
            const modifiedHtml = this.prepareHtmlForDirectRender(htmlContent, virtualUrl);
            await page.setContent(modifiedHtml, {
                waitUntil: "networkidle",
                timeout: 15000,
            });
            console.log("⏳ 等待页面资源加载完成...");
            await page.waitForLoadState("networkidle", { timeout: 10000 });
            const selectorToUse = selector ?? "body";
            const targetElement = await page.waitForSelector(selectorToUse, {
                timeout: 3000,
                state: "attached",
            });
            if (!targetElement) {
                throw new Error(`目标元素未找到: ${selectorToUse}`);
            }
            const screenshotOptions = {
                type: "jpeg",
                quality: 90,
                ...(screenshot ?? {}),
            };
            if (screenshotOptions.type === "png") {
                delete screenshotOptions.quality;
            }
            else if (screenshotOptions.type === "jpeg") {
                screenshotOptions.quality = screenshotOptions.quality || 90;
            }
            else {
                console.warn(`[jsxp] 不支持的截图格式: ${screenshotOptions.type}，回退到JPEG`);
                screenshotOptions.type = "jpeg";
                screenshotOptions.quality = 90;
            }
            const buff = await targetElement.screenshot(screenshotOptions);
            console.log("📸 直接渲染截图成功");
            return buff;
        }
        catch (error) {
            console.error("❌ 直接渲染失败:", error.message);
            if (error.message.includes("detached") ||
                error.message.includes("closed") ||
                error.message.includes("Target closed")) {
                throw new Error("页面分离，需要重试");
            }
            if (error.message.includes("timeout") ||
                error.message.includes("Timeout")) {
                throw new Error(`直接渲染超时: ${virtualUrl}`);
            }
            throw error;
        }
    }
    /** 执行文件渲染截图操作 */
    async executeScreenshot(page, taskData) {
        const { htmlFilePath, PupOptions } = taskData;
        const { goto, selector, screenshot } = PupOptions ?? {};
        try {
            if (!htmlFilePath || typeof htmlFilePath !== "string") {
                throw new Error(`无效的文件路径: ${htmlFilePath}`);
            }
            let fileUrl = htmlFilePath;
            if (!fileUrl.startsWith("file://")) {
                fileUrl = fileUrl.replace(/\\/g, "/");
                if (!fileUrl.startsWith("/") && !fileUrl.match(/^[a-zA-Z]:/)) {
                    fileUrl = path.resolve(fileUrl);
                }
                fileUrl = `file://${fileUrl}`;
            }
            const actualFilePath = fileUrl.replace(/^file:\/\//, "");
            if (!fs.existsSync(actualFilePath)) {
                throw new Error(`文件不存在: ${actualFilePath}`);
            }
            await page.goto(fileUrl, {
                waitUntil: "domcontentloaded",
                timeout: 3000,
                ...(goto ?? {}),
            });
            const selectorToUse = selector ?? "body";
            const targetElement = await page.waitForSelector(selectorToUse, {
                timeout: 3000,
                state: "attached",
            });
            if (!targetElement) {
                throw new Error(`目标元素未找到: ${selectorToUse}`);
            }
            const screenshotOptions = {
                type: "jpeg",
                quality: 90,
                ...(screenshot ?? {}),
            };
            if (screenshotOptions.type === "png") {
                delete screenshotOptions.quality;
            }
            else if (screenshotOptions.type === "jpeg") {
                screenshotOptions.quality = screenshotOptions.quality || 90;
            }
            else {
                console.warn(`[jsxp] 不支持的截图格式: ${screenshotOptions.type}，回退到JPEG`);
                screenshotOptions.type = "jpeg";
                screenshotOptions.quality = 90;
            }
            const buff = await targetElement.screenshot(screenshotOptions);
            console.log("[jsxp] 截图成功");
            return buff;
        }
        catch (error) {
            console.error("[jsxp] 截图错误:", error);
            if (error.message.includes("detached") ||
                error.message.includes("closed") ||
                error.message.includes("Target closed")) {
                throw new Error("页面分离，需要重试");
            }
            if (error.message.includes("timeout") ||
                error.message.includes("Timeout")) {
                throw new Error(`页面加载超时: ${htmlFilePath}`);
            }
            throw error;
        }
    }
    // /** 递归在子目录中查找文件 */
    // private async _findFileInSubdirectories(
    //   dir: string,
    //   fileName: string
    // ): Promise<string[]> {
    //   const results: string[] = [];
    //   async function searchDirectory(currentDir: string): Promise<void> {
    //     try {
    //       const items = await fsPromises.readdir(currentDir, {
    //         withFileTypes: true,
    //       });
    //       for (const item of items) {
    //         const fullPath = path.join(currentDir, item.name);
    //         if (item.isDirectory()) {
    //           await searchDirectory(fullPath);
    //         } else if (item.isFile() && item.name === fileName) {
    //           results.push(fullPath);
    //         }
    //       }
    //     } catch (error) {
    //       console.warn(
    //         `[jsxp] 搜索目录失败 ${currentDir}:`,
    //         (error as Error).message
    //       );
    //     }
    //   }
    //   await searchDirectory(dir);
    //   return results;
    // }
    /** 预处理HTML内容用于直接渲染 */
    prepareHtmlForDirectRender(htmlContent, baseUrl) {
        if (!htmlContent.includes("<base")) {
            const headMatch = htmlContent.match(/<head[^>]*>/i);
            if (headMatch) {
                const headTag = headMatch[0];
                const baseTag = `<base href="${baseUrl}/">`;
                htmlContent = htmlContent.replace(headTag, `${headTag}     ${baseTag}`);
            }
        }
        const resourceBase = `${baseUrl}/resources/`;
        htmlContent = htmlContent.replace(/(href|src)=["']\.\/resources\/([^"']+)["']/gi, `$1="${resourceBase}$2"`);
        return htmlContent;
    }
    /** 从页面池获取可复用页面 */
    async _getPageFromPool() {
        const defaultKey = "default";
        if (this.pagePool.has(defaultKey) &&
            this.pagePool.get(defaultKey).length > 0) {
            const page = this.pagePool.get(defaultKey).pop();
            console.log(`[jsxp] 复用页面，当前池: ${this.pagePool.get(defaultKey).length}`);
            return page;
        }
        console.log("[jsxp] 创建新页面，将自动分配或创建浏览器实例");
        const page = await this.browserPool.newPage();
        return page;
    }
    /** 释放页面到页面池 */
    async _releasePageToPool(page) {
        try {
            await this._cleanPageState(page);
            const defaultKey = "default";
            if (!this.pagePool.has(defaultKey)) {
                this.pagePool.set(defaultKey, []);
            }
            const pages = this.pagePool.get(defaultKey);
            if (pages.length < this.maxPagesPerBrowser) {
                page._lastUsed = Date.now();
                pages.push(page);
            }
            else {
                if (this.taskQueue.length > 0 || this.activeTasks.size > 0) {
                    const oldPage = pages.shift();
                    await oldPage.close().catch(() => { });
                    page._lastUsed = Date.now();
                    pages.push(page);
                    console.log(`[jsxp] 页面池已满，替换最旧页面，当前池大小: ${pages.length}`);
                }
                else {
                    console.log("[jsxp] 页面池已满且无任务，关闭页面");
                    await page.close();
                }
            }
        }
        catch (error) {
            console.warn("[jsxp] 页面释放失败，直接关闭:", error.message);
            await page.close().catch(() => { });
        }
    }
    /** 清理页面状态 */
    async _cleanPageState(page) {
        try {
            await page.evaluate(() => {
                document.body.innerHTML = "";
            });
        }
        catch (error) {
            console.warn("[jsxp] 页面状态清理失败:", error.message);
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
                const idleTime = Date.now() - (page._lastUsed || 0);
                if (idleTime > this.pageIdleTimeout) {
                    console.log(`[jsxp] 清理空闲页面（空闲 ${Math.round(idleTime / 1000)}秒）`);
                    await page.close().catch(() => { });
                    totalCleaned++;
                }
                else {
                    activePages.push(page);
                }
            }
            if (activePages.length === 0) {
                this.pagePool.delete(defaultKey);
            }
            else {
                this.pagePool.set(defaultKey, activePages);
            }
        }
        if (totalCleaned > 0) {
            console.log(`[jsxp] 清理了 ${totalCleaned} 个空闲页面`);
        }
    }
    /** 关闭浏览器池 */
    async close() {
        if (this.pageCleanupTimer) {
            clearInterval(this.pageCleanupTimer);
            this.pageCleanupTimer = null;
        }
        if (this.activeTasks.size > 0) {
            console.log(`[jsxp] 等待 ${this.activeTasks.size} 个活跃任务完成...`);
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
        if (this.taskQueue.length > 0) {
            console.log(`[jsxp] 清空 ${this.taskQueue.length} 个等待任务`);
            this.taskQueue.forEach((task) => {
                task.reject(new Error("浏览器池关闭，任务被取消"));
            });
            this.taskQueue = [];
        }
        let pageCount = 0;
        for (const pages of this.pagePool.values()) {
            pageCount += pages.length;
            for (const page of pages) {
                await page.close().catch(() => { });
            }
        }
        this.pagePool.clear();
        if (pageCount > 0) {
            console.log(`[jsxp] 清理了 ${pageCount} 个页面池中的页面`);
        }
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
