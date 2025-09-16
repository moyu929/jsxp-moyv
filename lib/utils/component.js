import { renderToString } from 'react-dom/server';
import { mkdirSync, writeFileSync, renameSync, existsSync } from 'fs';
import { join } from 'path';
import { startCleanupTimer, findAndLockReusableFile, releaseReusableLock } from './taskmanager.js';
import { getBrowserPoolManager } from './cluster.js';

/**
 * 组件解析类
 */
class Component {
    #dir = '';
    #cleanupStarted = false;
    constructor() {
        this.#dir = join(process.cwd(), '.data', 'component');
    }
    /**
     * 编译html（支持缓存检查和直接渲染模式）
     */
    async compile(options, taskId) {
        const DOCTYPE = '<!DOCTYPE html>';
        const HTML = renderToString(options.component);
        const html = `${DOCTYPE}${HTML}`;
        // create false 模式
        if (typeof options?.create === 'boolean' && options?.create === false) {
            if (options.server === true)
                return this.processHtmlPaths(html).html;
            return html;
        }
        // create true - HTML生成逻辑（新增缓存检查）
        const processedResult = this.processHtmlPaths(html, options.server);
        const requiredResources = processedResult.resources;
        const canUseDirectRender = await this.checkResourcesInCache(requiredResources);
        if (canUseDirectRender && requiredResources.length > 0) {
            console.log(`[jsxp] 资源已缓存，使用直接渲染模式，资源数量: ${requiredResources.length}`);
            return {
                type: 'direct',
                htmlContent: html,
                virtualUrl: `http://localhost/virtual-${taskId}.html`,
                resources: requiredResources,
            };
        }
        // 原有的文件创建逻辑
        const dir = join(this.#dir, options?.path ?? '');
        mkdirSync(dir, { recursive: true });
        if (!this.#cleanupStarted) {
            startCleanupTimer(dir);
            this.#cleanupStarted = true;
        }
        let fileName = taskId ?? 'jsxp';
        if (!fileName.endsWith('.html'))
            fileName = `${fileName}.html`;
        const address = join(dir, fileName);
        const processedHtml = processedResult.html;
        // 尝试复用已完成任务的文件
        const reusableFile = findAndLockReusableFile(dir);
        if (reusableFile) {
            const oldPath = join(dir, reusableFile);
            try {
                writeFileSync(oldPath, processedHtml);
                renameSync(oldPath, address);
                releaseReusableLock(oldPath);
                return {
                    type: 'file',
                    htmlFilePath: address,
                    resources: requiredResources,
                };
            }
            catch (error) {
                console.error('[jsxp] 文件复用失败，创建新文件:', error);
                releaseReusableLock(oldPath);
            }
        }
        // 没有可复用文件或复用失败时，创建新文件
        writeFileSync(address, processedHtml);
        console.log(`[jsxp] 使用文件模式，资源数量: ${requiredResources.length}`);
        return {
            type: 'file',
            htmlFilePath: address,
            resources: requiredResources,
        };
    }
    /** 检查资源是否都在缓存中 */
    async checkResourcesInCache(resources) {
        if (!resources || resources.length === 0)
            return true;
        try {
            const manager = await getBrowserPoolManager();
            return manager.checkResourcesInCache(resources);
        }
        catch (error) {
            console.error('[jsxp] 检查资源缓存失败:', error);
            return false;
        }
    }
    /**
     * 处理html路径并提取本地资源文件名
     */
    processHtmlPaths = (html, server = false) => {
        const resources = new Set();
        // 组合正则表达式，同时匹配属性和url()
        const combinedRegex = /((src|href)=["']([^"']+)["'])|(url\(["']?([^"')]+)["']?\))/g;
        html = html.replace(combinedRegex, (match, fullAttr, attrType, attrLink, fullUrl, urlLink) => {
            if (fullAttr) {
                // 处理src/href属性
                const url = decodeURIComponent(attrLink);
                if (existsSync(url)) {
                    const fileName = attrLink.split('/').pop()?.split('\\').pop() || '';
                    resources.add(fileName);
                    // 只有当服务器模式时才修改URL
                    if (server) {
                        const newPath = `/files?path=${encodeURIComponent(attrLink)}`;
                        return `${attrType}="${newPath}"`;
                    }
                }
            }
            else if (fullUrl) {
                // 处理url()引用
                const url = decodeURIComponent(urlLink);
                if (existsSync(url)) {
                    const fileName = urlLink.split('/').pop()?.split('\\').pop() || '';
                    resources.add(fileName);
                    // 只有当服务器模式时才修改URL
                    if (server) {
                        const newPath = `/files?path=${encodeURIComponent(urlLink)}`;
                        return `url(${newPath})`;
                    }
                }
            }
            return match;
        });
        console.log(`[jsxp] 处理路径并提取到 ${resources.size} 个资源文件:`, Array.from(resources));
        return {
            html,
            resources: Array.from(resources),
        };
    };
}

export { Component };
