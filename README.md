# JSXP-MOYV

一个基于 Playwright 的高性能 React TSX 组件截图库，支持服务器渲染和热重载。

## ✨ 特性

- 🖼️ 支持 React TSX 组件实时渲染和截图
- 🚀 基于 Playwright 的高性能浏览器渲染引擎
- 📦 完整的 TypeScript 类型支持
- ⚡ 智能任务队列和并发控制（最大 15 并发）
- 🌐 内置 Koa 服务器，支持热重载和静态文件服务
- 🔧 资源缓存和文件复用机制，提升性能
- 🎯 支持直接渲染和文件渲染两种模式

## 📦 安装

```bash
npm install jsxp-moyv
# 或
yarn add jsxp-moyv
# 或
pnpm add jsxp-moyv
```

## 🚀 快速开始

### 基本使用 - 渲染 React 组件

```typescript
import { render, Component } from 'jsxp-moyv'
import React from 'react'

// 方式1: 使用render函数
const screenshotBuffer = await render(
  {
    component: (
      <div
        style={{
          padding: 20,
          background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
        }}
      >
        <h1>Hello JSXP!</h1>
        <p>高性能React组件截图</p>
      </div>
    ),
    name: 'MyComponent',
  },
  {
    selector: 'body',
    screenshot: {
      type: 'jpeg',
      quality: 90,
    },
  }
)

// 方式2: 使用Component类
const component = new Component()
const html = await component.compile({
  component: <MyApp />,
  create: false,
  server: true,
})
```

### 服务器模式

```typescript
import { createServer } from 'jsxp-moyv'

// 创建开发服务器（支持热重载）
createServer({
  port: 8080,
  host: '127.0.0.1',
  statics: ['public', 'assets'],
  routes: {
    '/': {
      component: <HomePage />,
    },
    '/dashboard': {
      component: <Dashboard />,
    },
  },
})

// 命令行启动
// node --jsxp-server
```

### 内置组件

```typescript
import {
  BackgroundImage,
  LinkESM,
  LinkESMFile,
  LinkStyleSheet
} from 'jsxp-moyv'

// 背景图片组件
<BackgroundImage
  src={['/bg1.jpg', '/bg2.jpg']}
  size="cover"
  style={{ opacity: 0.8 }}
/>

// ESM 模块引入
<LinkESM src="/module.js" />

// 文件内容内联
<LinkESMFile src="/path/to/module.js" />

// 样式表引入
<LinkStyleSheet src="/styles.css" />
```

## 📖 API 文档

### 核心函数

#### `render(comOptions: ComponentCreateOptionType, pupOptions?: PupOptions): Promise<Buffer>`

渲染 React 组件并返回截图 Buffer。

**参数：**

- `comOptions`: 组件配置选项

  - `component: React.ReactNode` - React 组件
  - `name?: string` - 组件名称（不要包含.html）
  - `path?: string` - 输出路径扩展
  - `create?: boolean` - 是否创建文件（默认 true）
  - `server?: boolean` - 是否服务器模式（默认 false）

- `pupOptions`: 浏览器选项
  - `goto?: any` - 页面跳转选项
  - `selector?: string` - 元素选择器（默认'body'）
  - `screenshot?: any` - 截图选项

#### `createServer(userConfig?: Partial<JSXPOptions>): Promise<void>`

创建开发服务器。

**配置选项：**

- `port?: number` - 端口号（默认 8080）
- `host?: string` - 主机地址（默认'127.0.0.1'）
- `prefix?: string` - URL 前缀
- `statics?: string | string[]` - 静态文件目录
- `routes?: Record<string, { component?: React.ReactNode }>` - 路由配置

#### `defineConfig(config: any): any`

定义配置（当前为直接返回配置对象）。

### 工具函数

#### `getProcessing(): { processingCount: number, queueLength: number, isProcessing: boolean }`

获取任务队列状态。

#### 任务管理函数

```typescript
import {
  taskMap, // 任务映射表
  createTask, // 创建任务
  cleanupTask, // 清理任务
  findAndLockReusableFile, // 查找可复用文件
  releaseReusableLock, // 释放文件锁
  cleanupCompletedFiles, // 清理已完成文件
  startCleanupTimer, // 启动清理定时器
} from 'jsxp-moyv'
```

## 🛠️ 高级配置

### 浏览器配置 (.browserrc.cjs)

项目根目录下的 `.browserrc.cjs` 文件会自动被包含在 npm 包中：

```javascript
module.exports = {
  executablePath: '/path/to/chrome', // 自动检测系统浏览器
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
}
```

### TypeScript 类型

完整类型定义：

```typescript
import type {
  JSXPOptions,
  ComponentCreateOptionType,
  RenderOptions,
  ObtainProps,
} from 'jsxp-moyv'
```

## 🔧 开发指南

### 项目结构

```
├── components/          # React组件
│   ├── BackgroundImage
│   ├── LinkESM
│   └── LinkStyles
├── server/             # 服务器相关
│   ├── index        # 主服务器
│   ├── main         # 命令行入口
│   └── refreshScript # 热重载脚本
├── utils/              # 工具函数
│   ├── cluster      # 浏览器池管理
│   ├── component   # 组件编译
│   ├── queue        # 任务队列
│   └── taskmanager  # 任务管理
├── types           # 类型定义
├── config          # 配置函数
├── render          # 主渲染函数
└── index           # 入口文件
```

### 构建项目

```bash
npm run build
```

## 📄 许可证

MIT License
