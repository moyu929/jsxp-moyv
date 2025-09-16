import { createServer } from './index.js'

// 如果命令行参数包含 --jsxp-server，则启动服务器
if (process.argv.includes('--jsxp-server')) {
  createServer()
}
