import type { NextConfig } from "next";
import { BASE_PATH } from "./src/lib/api";

const nextConfig: NextConfig = {
  basePath: BASE_PATH,
  // 独立输出：构建时自动追踪并打包依赖，生成自包含 server.js
  // 解决"本地构建 / 异机运行"时 node_modules 解析不一致导致的模块加载失败
  output: "standalone",
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
