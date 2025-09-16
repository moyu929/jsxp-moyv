import type { JSXPOptions } from '../types.js';
/**
 * 创建服务器
 * @param userConfig 用户自定义配置，会覆盖默认配置
 */
declare function createServer(userConfig?: Partial<JSXPOptions>): Promise<void>;
export { createServer };
