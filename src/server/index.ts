import Koa from 'koa'
import KoaStatic from 'koa-static'
import Router from 'koa-router'
import { existsSync } from 'fs'
import send from 'koa-send'
import { createRefreshScript } from './refreshScript.js'
import { Component } from '../utils/component.js'
import type { JSXPOptions } from '../types.js'

/**
 * 创建JSXP服务器
 * @function createServer
 * @param {Partial<JSXPOptions>} [userConfig] - 用户自定义配置，会覆盖默认配置
 * @returns {Promise<void>} Promise对象，服务器启动后resolve
 * @description 创建一个Koa服务器，支持热重载、静态文件服务和路由处理
 */
async function createServer(userConfig?: Partial<JSXPOptions>): Promise<void> {
  // 默认配置
  const defaultConfig: JSXPOptions = {
    host: '127.0.0.1',
    port: 8080,
    prefix: '',
    routes: {
      '/': {
        component: 'HomePage',
      },
    },
    statics: 'public',
  }
  // 合并配置（用户配置覆盖默认配置）
  const config: JSXPOptions = { ...defaultConfig, ...userConfig }
  const app = new Koa()
  const prefix = config?.prefix ?? ''
  const router = new Router({ prefix })
  const Com = new Component()
  console.log('_______jsxp_______')
  const routes = config?.routes
  if (!routes) return
  // 当前时间戳作为热重载标识
  const key = Date.now().toString()
  const refreshScript = createRefreshScript(key)
  // 热重载检查接口
  router.get('/check-for-changes', (ctx) => {
    if (ctx.request.query?.key === key) {
      ctx.body = { hasChanges: false }
    } else {
      ctx.body = { hasChanges: true }
    }
  })
  // 文件请求接口
  router.get('/files', async (ctx) => {
    const filePath = ctx.query.path
    if (!filePath || typeof filePath !== 'string') {
      ctx.status = 400
      ctx.body = { error: 'Missing "path" query parameter' }
      return
    }
    const fileUrl = decodeURIComponent(filePath)
    if (!existsSync(fileUrl)) {
      ctx.status = 404
      ctx.body = { error: 'File not found' }
      return
    }
    try {
      await send(ctx, fileUrl, { root: '/' })
    } catch (error) {
      console.error('发送文件错误:', error)
      ctx.status = 500
      ctx.body = { error: 'Internal server error' }
    }
  })

  // 路由处理
  for (const url in routes) {
    console.log(
      `http://${config?.host ?? '127.0.0.1'}:${config?.port ?? 8080}${
        prefix + url
      }`
    )

    router.get(url, async (ctx) => {
      const options = config.routes?.[url]
      if (!options) return

      // 使用 Component 类编译 HTML
      const HTML = await Com.compile({
        component: options.component,
        create: false,
        server: true,
      })

      // 内容
      ctx.body = `${HTML}${refreshScript}`
    })
  }

  // 静态文件服务
  const statics = config?.statics ?? 'public'
  if (Array.isArray(statics)) {
    for (const item of statics) {
      app.use(KoaStatic(item))
    }
  } else {
    app.use(KoaStatic(statics))
  }

  // 使用路由
  app.use(router.routes())

  // 启动服务器
  const port = config?.port ?? 8080
  const host = config?.host ?? '127.0.0.1'

  app.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`)
    console.log('自行调整默认浏览器尺寸 800 X 1280 100%')
    console.log('_______jsxp_______')
  })
}

export { createServer }
