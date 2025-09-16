import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf8"));

export default [
  // 主构建 - 生成ES模块（保持文件结构）
  {
    input: "src/index.ts",
    output: [
      {
        dir: "lib",
        format: "esm",
        preserveModules: true, // 保持原始文件结构
        preserveModulesRoot: "src", // 基于src目录保持结构
        sourcemap: false,
      },
    ],
    external: [
      "react",
      "react/jsx-runtime",
      "react-dom",
      "react-dom/server",
      "playwright",
      "koa",
      "koa-router",
      "koa-send",
      "koa-static",
      "browser-pool",
      "fs",
      "path",
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
    ],
    plugins: [
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: true,
        declarationDir: "lib",
        sourceMap: false,
      }),
    ],
  },
  // 类型声明文件构建
  {
    input: "lib/index.d.ts", // 只需要处理主声明文件
    output: [{ file: "lib/index.d.ts", format: "esm" }],
    plugins: [dts()],
  },
];
