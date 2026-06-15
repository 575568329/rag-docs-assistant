/**
 * 部署子路径（basePath）的单一数据源。
 * next.config.ts 和前端 fetch/链接都从这里取值，避免硬编码散落多处。
 * 本地开发时为空字符串，部署到 /rag/ 子路径时设为 '/rag'。
 */
export const BASE_PATH = '/rag'

/**
 * 给 API / 下载等绝对路径补上 basePath 前缀。
 * Next.js 的 basePath 只会自动处理 <Link>、路由跳转和静态资源，
 * 不会给代码里 fetch('/api/...') 这类硬编码路径加前缀，需要显式调用本函数。
 */
export const apiPath = (path: string): string => `${BASE_PATH}${path}`
