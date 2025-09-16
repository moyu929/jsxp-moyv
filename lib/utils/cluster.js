import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

// 浏览器管理器实例
let browserPoolInstance = null;
/**
 * 浏览器管理器 - 使用Playwright实现高性能截图
 * 支持智能队列管理、资源监控和性能优化
 */
class BrowserPoolManager {
    /** 浏览器实例 */
    browser = null;
    /** 浏览器上下文 */
    context = null;
    /** 当前活跃的任务ID集合 */
    activeTasks = new Set();
    /** 任务等待队列 */
    taskQueue = [];
    /** 系统配置参数 */
    config = {
        /** 最大并发任务数 */
        maxConcurrent: 10,
        /** 页面池最大页面数 */
        maxPagesPerBrowser: 10,
        /** 页面空闲时间（毫秒） */
        pageIdleTimeout: 10 * 60 * 1000,
        /** 任务执行超时时间（毫秒） */
        taskTimeout: 15 * 1000,
        /** 页面加载超时时间（毫秒） */
        pageLoadTimeout: 15 * 1000,
        /** 网络空闲等待超时（毫秒） */
        networkIdleTimeout: 10 * 1000,
        /** 页面清理间隔（毫秒） */
        pageCleanupInterval: 3 * 60 * 1000,
        /** 页面视口大小 */
        viewport: { width: 800, height: 600 },
        /** 缓存清理配置 */
        cacheCleanup: {
            /** 最大缓存数量 */
            maxItems: 50,
            /** 最大缓存大小（字节） */
            maxSize: 300 * 1024 * 1024,
            /** 清理比例 */
            cleanupRatio: 2 / 3,
        },
        /** Playwright配置选项 */
        playwright: {
            /** 无头模式 */
            headless: true,
            /** 超时时间20秒 */
            timeout: 20000,
        },
    };
    /** 页面复用池 */
    pagePool = new Map();
    /** 页面清理定时器 */
    pageCleanupTimer = null;
    /** 资源缓存系统 */
    resourceCache = new Map();
    /** 缓存总大小（字节） */
    totalCacheSize = 0;
    /** 初始化浏览器 */
    async init() {
        try {
            console.log('[jsxp] 启动浏览器实例...');
            // 创建单个浏览器实例
            this.browser = await chromium.launch(this.config.playwright);
            console.log('[jsxp] 浏览器实例启动成功');
            // 创建浏览器上下文并设置视口大小
            this.context = await this.browser.newContext({
                viewport: this.config.viewport,
            });
            // 关闭默认创建的页面（避免性能浪费）
            const defaultPages = this.context.pages();
            for (const page of defaultPages) {
                await page.close().catch(() => { });
            }
            // 为浏览器设置全局路由拦截器
            console.log('[jsxp] 设置全局路由拦截器...');
            await this.setupGlobalRouteInterceptor();
            console.log('[jsxp] ✅ 全局路由拦截器设置完成');
            // 启动性能监控
            this.pageCleanupTimer = setInterval(() => {
                this._cleanupIdlePages();
            }, this.config.pageCleanupInterval);
        }
        catch (error) {
            console.error('[jsxp] 浏览器实例启动失败:', error);
            throw error;
        }
    }
    /** 为浏览器设置全局路由拦截器 */
    async setupGlobalRouteInterceptor() {
        if (!this.browser)
            throw new Error('浏览器未初始化');
        if (!this.context)
            throw new Error('浏览器上下文未初始化');
        // 为浏览器上下文设置路由拦截器
        await this.context.route('**/*', async (route) => {
            const url = route.request().url();
            if (!this.isStaticResource(url)) {
                await route.continue();
                return;
            }
            console.log(`[jsxp] 📡 拦截到资源请求: ${url}`);
            const fileName = this.extractFileName(url);
            if (this.resourceCache.has(fileName)) {
                const cachedResource = this.resourceCache.get(fileName);
                // 更新使用次数和最后使用时间
                cachedResource.usageCount += 1;
                cachedResource.lastUsedAt = Date.now();
                this.resourceCache.set(fileName, cachedResource);
                await route.fulfill({
                    status: cachedResource.status || 200,
                    body: cachedResource.body,
                    headers: cachedResource.headers,
                });
                console.log(`[jsxp] ✅ [缓存命中] ${fileName} (使用次数: ${cachedResource.usageCount})`);
                return;
            }
            // 缓存未命中，放行请求，响应监听器会自动缓存
            console.log(`[jsxp] ❌ [缓存未命中] ${fileName}`);
            await route.continue();
        });
        // 为浏览器上下文添加全局响应监听器
        this.context.on('response', async (response) => {
            const url = response.url();
            if (!this.isStaticResource(url))
                return;
            const fileName = this.extractFileName(url);
            // 只缓存成功的响应
            if (response.status() >= 200 && response.status() < 300) {
                try {
                    const body = await response.body();
                    const headers = response.headers();
                    this.resourceCache.set(fileName, {
                        body,
                        headers,
                        status: response.status(),
                        usageCount: 0,
                        createdAt: Date.now(),
                        lastUsedAt: Date.now(),
                    });
                    this.totalCacheSize += body.length;
                    console.log(`[jsxp] 💾 资源缓存成功: ${fileName} (当前总缓存: ${Math.round(this.totalCacheSize / 1024 / 1024)}MB)`);
                    // 检查是否需要清理缓存
                    this._checkAndCleanupCache();
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
        const baseUrl = urlOrPath.split('?')[0];
        return path.basename(baseUrl);
    }
    /** 获取内容类型 */
    getContentType(ext) {
        const types = {
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
        };
        return types[ext] || 'application/octet-stream';
    }
    /** 检查资源是否都在缓存中 */
    checkResourcesInCache(resources) {
        if (!resources || resources.length === 0)
            return true;
        const result = resources.every((fileName) => {
            const inCache = this.resourceCache.has(fileName);
            console.log(`[jsxp] 检查缓存 ${fileName}: ${inCache ? '✅ 已缓存' : '❌ 未缓存'}`);
            return inCache;
        });
        console.log(`[jsxp] 缓存检查结果: ${result ? '全部已缓存' : '部分未缓存'}`);
        return result;
    }
    /** 执行截图任务 */
    async executeTask(taskData) {
        if (!this.browser)
            throw new Error('浏览器未初始化');
        return new Promise((resolve, reject) => {
            if (this.activeTasks.size >= this.config.maxConcurrent) {
                console.log(`[jsxp] 任务 ${taskData.taskId} 进入队列等待，当前活跃任务: ${this.activeTasks.size}/${this.config.maxConcurrent}，队列长度: ${this.taskQueue.length + 1}`);
                this.taskQueue.push({ taskData, resolve, reject });
                return;
            }
            this.activeTasks.add(taskData.taskId);
            console.log(`[jsxp] 执行任务${taskData.taskId}，当前活跃任务: ${this.activeTasks.size}/${this.config.maxConcurrent}`);
            this._executeTaskInternal(taskData)
                .then(resolve)
                .catch(reject)
                .finally(() => {
                this.activeTasks.delete(taskData.taskId);
                console.log(`[jsxp] 任务${taskData.taskId}执行完成，当前活跃任务: ${this.activeTasks.size}/${this.config.maxConcurrent}`);
                setImmediate(() => this._processQueue());
            });
        });
    }
    /** 处理任务队列 */
    _processQueue() {
        while (this.taskQueue.length > 0 &&
            this.activeTasks.size < this.config.maxConcurrent) {
            const task = this.taskQueue.shift();
            const taskId = task.taskData.taskId;
            this.activeTasks.add(taskId);
            console.log(`[jsxp] 从队列启动任务${taskId}，当前活跃: ${this.activeTasks.size}/${this.config.maxConcurrent}，队列剩余: ${this.taskQueue.length}`);
            this._executeTaskInternal(task.taskData)
                .then(task.resolve)
                .catch(task.reject)
                .finally(() => {
                this.activeTasks.delete(taskId);
                console.log(`[jsxp] 队列任务${taskId}完成，当前活跃: ${this.activeTasks.size}/${this.config.maxConcurrent}，队列剩余: ${this.taskQueue.length}`);
                setImmediate(() => this._processQueue());
            });
        }
    }
    /** 内部任务执行方法 */
    async _executeTaskInternal(taskData) {
        const timeoutMs = this.config.taskTimeout;
        let page = null;
        try {
            page = await this._getPageFromPool();
            page._lastUsed = Date.now();
            // 根据任务类型选择执行方法
            const result = await Promise.race([
                (async () => {
                    if (taskData.type === 'direct') {
                        return await this.executeDirectRender(page, taskData);
                    }
                    else {
                        return await this.executeScreenshot(page, taskData);
                    }
                })(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('任务执行超时')), timeoutMs)),
            ]);
            await this._releasePageToPool(page);
            return result;
        }
        catch (error) {
            if (page)
                await page.close().catch(() => { });
            console.error(`[jsxp] 任务 ${taskData.taskId} 执行失败:`, error.message);
            throw error;
        }
    }
    /** 执行直接渲染截图操作 */
    async executeDirectRender(page, taskData) {
        const { htmlContent, virtualUrl, PupOptions } = taskData;
        const { selector, screenshot } = PupOptions ?? {};
        try {
            console.log(`📝 HTML内容长度: ${htmlContent.length} 字符`);
            console.log('🔄 准备直接渲染HTML内容');
            const modifiedHtml = this.prepareHtmlForDirectRender(htmlContent, virtualUrl);
            await page.setContent(modifiedHtml, {
                waitUntil: 'networkidle',
                timeout: this.config.pageLoadTimeout,
            });
            console.log('⏳ 等待页面资源加载完成...');
            await page.waitForLoadState('networkidle', {
                timeout: this.config.networkIdleTimeout,
            });
            const selectorToUse = selector ?? 'body';
            const targetElement = await page.waitForSelector(selectorToUse, {
                timeout: 3000,
                state: 'attached',
            });
            if (!targetElement) {
                throw new Error(`目标元素未找到: ${selectorToUse}`);
            }
            const screenshotOptions = {
                type: 'jpeg',
                quality: 90,
                ...(screenshot ?? {}),
            };
            if (screenshotOptions.type === 'png') {
                delete screenshotOptions.quality;
            }
            else if (screenshotOptions.type === 'jpeg') {
                screenshotOptions.quality = screenshotOptions.quality || 90;
            }
            else {
                console.warn(`[jsxp] 不支持的截图格式: ${screenshotOptions.type}，回退到JPEG`);
                screenshotOptions.type = 'jpeg';
                screenshotOptions.quality = 90;
            }
            const buff = await targetElement.screenshot(screenshotOptions);
            console.log('📸 直接渲染截图成功');
            return buff;
        }
        catch (error) {
            console.error('[jsxp] 直接渲染失败:', error.message);
            throw error;
        }
    }
    /** 执行文件渲染截图操作 */
    async executeScreenshot(page, taskData) {
        const { htmlFilePath, PupOptions } = taskData;
        const { goto, selector, screenshot } = PupOptions ?? {};
        try {
            if (!htmlFilePath || typeof htmlFilePath !== 'string') {
                throw new Error(`无效的文件路径: ${htmlFilePath}`);
            }
            let fileUrl = htmlFilePath;
            if (!fileUrl.startsWith('file://')) {
                fileUrl = fileUrl.replace(/\\/g, '/');
                if (!fileUrl.startsWith('/') && !fileUrl.match(/^[a-zA-Z]:/)) {
                    fileUrl = path.resolve(fileUrl);
                }
                fileUrl = `file://${fileUrl}`;
            }
            const actualFilePath = fileUrl.replace(/^file:\/\//, '');
            if (!fs.existsSync(actualFilePath)) {
                throw new Error(`文件不存在: ${actualFilePath}`);
            }
            await page.goto(fileUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 3000,
                ...(goto ?? {}),
            });
            const selectorToUse = selector ?? 'body';
            const targetElement = await page.waitForSelector(selectorToUse, {
                timeout: 3000,
                state: 'attached',
            });
            if (!targetElement) {
                throw new Error(`目标元素未找到: ${selectorToUse}`);
            }
            const screenshotOptions = {
                type: 'jpeg',
                quality: 90,
                ...(screenshot ?? {}),
            };
            if (screenshotOptions.type === 'png') {
                delete screenshotOptions.quality;
            }
            else if (screenshotOptions.type === 'jpeg') {
                screenshotOptions.quality = screenshotOptions.quality || 90;
            }
            else {
                console.warn(`[jsxp] 不支持的截图格式: ${screenshotOptions.type}，回退到JPEG`);
                screenshotOptions.type = 'jpeg';
                screenshotOptions.quality = 90;
            }
            const buff = await targetElement.screenshot(screenshotOptions);
            console.log('[jsxp] 截图成功');
            return buff;
        }
        catch (error) {
            console.error('[jsxp] 截图错误:', error);
            if (error.message.includes('detached') ||
                error.message.includes('closed') ||
                error.message.includes('Target closed')) {
                throw new Error('页面分离，需要重试');
            }
            if (error.message.includes('timeout') ||
                error.message.includes('Timeout')) {
                throw new Error(`页面加载超时: ${htmlFilePath}`);
            }
            throw error;
        }
    }
    /** 预处理HTML内容用于直接渲染 */
    prepareHtmlForDirectRender(htmlContent, baseUrl) {
        if (!htmlContent.includes('<base')) {
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
        const defaultKey = 'default';
        if (this.pagePool.has(defaultKey) &&
            this.pagePool.get(defaultKey).length > 0) {
            const page = this.pagePool.get(defaultKey).pop();
            console.log(`[jsxp] 复用页面，当前池: ${this.pagePool.get(defaultKey).length}`);
            return page;
        }
        console.log('[jsxp] 创建新页面');
        if (!this.context)
            throw new Error('浏览器上下文未初始化');
        const page = await this.context.newPage();
        return page;
    }
    /** 释放页面到页面池 */
    async _releasePageToPool(page) {
        try {
            await this._cleanPageState(page);
            const defaultKey = 'default';
            if (!this.pagePool.has(defaultKey)) {
                this.pagePool.set(defaultKey, []);
            }
            const pages = this.pagePool.get(defaultKey);
            if (pages.length < this.config.maxPagesPerBrowser) {
                ;
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
                    console.log('[jsxp] 页面池已满且无任务，关闭页面');
                    await page.close();
                }
            }
        }
        catch (error) {
            console.warn('[jsxp] 页面释放失败，直接关闭:', error.message);
            await page.close().catch(() => { });
        }
    }
    /** 清理页面状态 */
    async _cleanPageState(page) {
        try {
            await page.evaluate(() => {
                document.body.innerHTML = '';
            });
        }
        catch (error) {
            console.warn('[jsxp] 页面状态清理失败:', error.message);
            throw error;
        }
    }
    /** 清理空闲时间过长的页面 */
    async _cleanupIdlePages() {
        let totalCleaned = 0;
        const defaultKey = 'default';
        if (this.pagePool.has(defaultKey)) {
            const pages = this.pagePool.get(defaultKey);
            const activePages = [];
            for (const page of pages) {
                const idleTime = Date.now() - (page._lastUsed || 0);
                if (idleTime > this.config.pageIdleTimeout) {
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
    /** 关闭浏览器 */
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
                task.reject(new Error('浏览器关闭，任务被取消'));
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
        if (this.browser) {
            await this.browser.close();
            console.log('[jsxp] 浏览器已优雅关闭');
        }
        this.activeTasks.clear();
    }
    /** 检查并清理缓存 */
    _checkAndCleanupCache() {
        const cacheSize = this.resourceCache.size;
        // 检查是否需要清理
        if (cacheSize <= this.config.cacheCleanup.maxItems &&
            this.totalCacheSize <= this.config.cacheCleanup.maxSize) {
            return;
        }
        console.log(`[jsxp] 🗑️ 触发缓存清理: ${cacheSize}个资源, ${Math.round(this.totalCacheSize / 1024 / 1024)}MB`);
        this._cleanupCache();
    }
    /** 执行缓存清理 */
    _cleanupCache() {
        const cacheItems = Array.from(this.resourceCache.entries());
        // 按使用次数和创建时间排序
        cacheItems.sort((a, b) => {
            const [, itemA] = a;
            const [, itemB] = b;
            // 优先按使用次数排序
            if (itemA.usageCount !== itemB.usageCount) {
                return itemA.usageCount - itemB.usageCount;
            }
            // 使用次数相同则按创建时间排序
            return itemA.createdAt - itemB.createdAt;
        });
        // 计算需要清理的数量
        const itemsToRemove = Math.ceil(cacheItems.length * this.config.cacheCleanup.cleanupRatio);
        const itemsToKeep = cacheItems.length - itemsToRemove;
        // 清理缓存并更新总大小
        for (let i = 0; i < itemsToRemove; i++) {
            const [key, item] = cacheItems[i];
            this.totalCacheSize -= item.body.length;
            this.resourceCache.delete(key);
        }
        console.log(`[jsxp] ✅ 缓存清理完成: 保留${itemsToKeep}个, 清理${itemsToRemove}个资源`);
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
