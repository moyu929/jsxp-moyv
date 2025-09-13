# JSXP

一个强大的 TypeScript React 组件截图库，使用 Playwright 实现高质量的组件截图功能。

## ✨ 特性

- 🖼️ 支持 React TSX 组件截图
- 🚀 基于 Playwright 的高性能浏览器渲染
- 📦 开箱即用的 TypeScript 支持
- 🔧 可配置的截图选项
- ⚡ 内置任务队列和并发控制
- 🌐 提供服务器端渲染服务

## 📦 安装

```bash
npm install jsxp-moyv
# 或
yarn add jsxp-moyv
# 或
pnpm add jsxp-moyv
```

## 🚀 快速开始

### 基本使用

```typescript
import { render, defineConfig } from "jsxp-moyv";

// 定义配置
const config = defineConfig({
  maxConcurrent: 4, // 最大并发数
  timeout: 30000, // 超时时间(毫秒)
});

// 渲染组件并截图
async function captureComponent() {
  const result = await render(
    `import React from 'react';
    
    function MyComponent() {
      return <div style={{ padding: 20, background: '#f0f0f0' }}>
        <h1>Hello JSXP!</h1>
        <p>这是一个示例组件</p>
      </div>
    }`,
    "MyComponent",
    {
      width: 800,
      height: 600,
      quality: 90,
    }
  );

  console.log("截图保存路径:", result.filePath);
  console.log("截图数据:", result.buffer);
}
```

### 服务器模式

```typescript
import { createServer } from "jsxp-moyv";

// 创建截图服务器
const server = createServer({
  port: 3000,
  maxConcurrent: 4,
});

// 启动服务器
server.start().then(() => {
  console.log("JSXP 截图服务器已启动在 http://localhost:3000");
});
```

## 📖 API 文档

### `render(componentCode: string, componentName: string, options?: RenderOptions)`

渲染并截图 React 组件。

**参数：**

- `componentCode`: 组件的 TypeScript/JavaScript 代码字符串
- `componentName`: 要渲染的组件名称
- `options`: 可选配置项
  - `width`: 截图宽度（默认: 1200）
  - `height`: 截图高度（默认: 800）
  - `quality`: 图片质量 1-100（默认: 80）
  - `type`: 图片类型 'png' | 'jpeg'（默认: 'png'）

### `createServer(options?: ServerOptions)`

创建截图服务器实例。

**参数：**

- `port`: 服务器端口（默认: 3000）
- `maxConcurrent`: 最大并发请求数（默认: 2）

### `defineConfig(config: Config)`

定义全局配置。

### `setMaxConcurrent(max: number)`

设置最大并发任务数。

### `getProcessing()`

获取当前正在处理的任务数量。

## 🛠️ 高级用法

### 使用自定义组件

```typescript
import { Component, BackgroundImage } from "jsxp-moyv";

// 创建自定义组件
const MyCustomComponent = Component(({ title, content }) => (
  <div style={{ padding: 20, border: "1px solid #ccc" }}>
    <h2>{title}</h2>
    <p>{content}</p>
    <BackgroundImage src="/path/to/image.png" />
  </div>
));
```

### 任务管理

```typescript
import {
  taskMap,
  createTask,
  cleanupTask,
  cleanupCompletedFiles,
} from "jsxp-moyv";

// 创建截图任务
const taskId = createTask("component-screenshot", {
  componentCode: "...",
  componentName: "MyComponent",
});

// 清理已完成的任务文件
cleanupCompletedFiles();
```

## 🔧 配置选项

在项目根目录创建 `.browserrc.cjs` 文件来自定义浏览器配置：

```javascript
module.exports = {
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  defaultViewport: {
    width: 1200,
    height: 800,
  },
};
```
