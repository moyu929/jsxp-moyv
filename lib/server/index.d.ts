import type { JSXPOptions } from '../types.js';
/**
 * 创建JSXP服务器
 * @function createServer
 * @param {Partial<JSXPOptions>} [userConfig] - 用户自定义配置，会覆盖默认配置
 * @returns {Promise<void>} Promise对象，服务器启动后resolve
 * @description 创建一个Koa服务器，支持热重载、静态文件服务和路由处理
 */
declare function createServer(userConfig?: Partial<JSXPOptions>): Promise<void>;
export { createServer };
