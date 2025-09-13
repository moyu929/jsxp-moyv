/**
 * 创建 JSXP 截图服务器
 * 启动一个 Koa 服务器用于处理 TSX 组件截图请求
 * @returns Promise 在服务器启动完成后解析
 */
declare function createServer(): Promise<void>;

export { createServer };
