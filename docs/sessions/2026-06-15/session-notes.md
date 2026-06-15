# RAG 项目学习会话记录

## 📅 会话概述
- **日期**: 2026-06-15
- **学习时长**: 约 2h
- **当前进度**: M1 项目初始化 (100%)
- **学习方式**: 理论学习 + 代码实现 + 验证调试

---

## 🎯 本次学习目标
- [x] 初始化 Next.js 16 项目并完成基础环境配置
- [x] 理解并运用 App Router 的路由分组与布局嵌套
- [x] 完成 3 个工作台页面（对话 / 数据 / 图谱）的骨架

---

## 💡 关键知识点学习

### 1. 路由分组 `(platform)`
**定义**: Next.js App Router 中，用括号包裹的目录名是「路由分组」（Route Group），仅用于组织目录结构，不会出现在最终 URL 路径中。

**为什么需要**:
- 让一组路由共享同一个 `layout.tsx`，但保持 URL 干净
- 例如 `app/(platform)/chat/page.tsx` 实际访问路径是 `/chat`，而不是 `/(platform)/chat`

**代码示例**:
```
app/
├── layout.tsx                    # 根布局（全局 html/body）
├── page.tsx                      # 根页面（重定向到 /chat）
└── (platform)/
    ├── layout.tsx                # 平台布局（顶部导航 + 侧边栏）
    ├── chat/page.tsx             # → /chat
    ├── data/page.tsx             # → /data
    └── graph/page.tsx            # → /graph
```

**应用场景**: 多个工作台共用同一套 Header/Sidebar，但又不想在 URL 中暴露分组层级。

---

### 2. 布局嵌套（Layout Nesting）
**定义**: App Router 中每个目录可以放一个 `layout.tsx`，子路由会自动被父级 layout 包裹，形成嵌套渲染。

**关键规则**:
- 父 layout 的 `children` 占位符决定子内容渲染位置
- 切换同一 layout 下的兄弟路由时，layout 不会重新挂载（保留状态）
- `layout.tsx` 必须 `export default` 一个组件

**代码示例**:
```tsx
// app/(platform)/layout.tsx
export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen">
      <TopNav />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
```

---

### 3. Server Components vs Client Components
✅ **正确理解**:
- **默认就是 Server Component**：在服务端渲染，不带 JS 到浏览器，体积小、首屏快
- **`'use client'` 指令**：把组件标记为 Client Component，可以用 `useState`/`useEffect`/`usePathname` 等 Hook、绑定事件
- **指令位置**：必须放在文件顶部第一行（在 import 之前）

**应用场景**:
- TopNav 用到 `usePathname` 高亮当前 Tab → 需要 `'use client'`
- 静态展示页（chat/data/graph 占位页） → 保持 Server Component

**易错**: `usePathname` 等 Next 提供的 Hook 必须从 `next/navigation` 导入，且只能在 Client Component 中使用。

---

### 4. TypeScript 解构 + 类型注解
**典型写法**:
```tsx
export default function Layout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
```

**拆解**:
- `{ children }` 是参数对象的解构
- `: { children: React.ReactNode }` 是对解构后参数的类型注解
- `React.ReactNode` 涵盖所有可渲染内容（字符串、数字、JSX、null、undefined、数组）

**对比写法**:
```tsx
type LayoutProps = { children: React.ReactNode };
export default function Layout({ children }: LayoutProps) { ... }
```

---

## 📝 实现过程记录

### 实现 1: Next.js 16 项目骨架
**步骤**:
1. ✅ `npx create-next-app@latest` 初始化（TS + Tailwind + App Router + import alias `@/*`）
2. ✅ 安装核心依赖：`npm install ai zod`
3. ✅ 创建路由分组 `app/(platform)/`
4. ✅ 实现 `app/(platform)/layout.tsx`（顶部导航 + 侧边栏 + 主内容区）
5. ✅ 创建 3 个工作台占位页（chat / data / graph）
6. ✅ 实现根 `page.tsx` 重定向到 `/chat`
7. ✅ `npm run dev` 启动验证

**关键决策**:
- **不使用 `src/` 目录**：项目体量适中，扁平结构更直观
- **侧边栏宽度 260px**：与 master 分支保持一致，留足知识库列表展示空间
- **TopNav 用 `usePathname` 而非 props 传递**：解耦 layout 与路由状态

---

## 🧪 测试验证

### 测试 1: 三 Tab 切换
**预期**: 点击顶部导航的对话 / 数据 / 图谱，URL 切换且高亮当前项，layout 不重新挂载
**实际**: ✅ 通过

### 测试 2: 根路径重定向
**预期**: 访问 `http://localhost:3000` → 自动跳转到 `/chat`
**实际**: ✅ 通过

---

## 📊 进度更新
- **M1 项目初始化**: 0% → 100%
  - ✅ 项目初始化
  - ✅ 开发环境配置
  - ✅ 平台布局搭建
  - ✅ 3 个工作台页面
  - ✅ 启动验证

**累计完成**:
- 完成里程碑: 1/6
- 累计学习时长: 2h

---

## 💡 易错点记录

1. ❌ **易错点 1**: `layout.tsx` / `page.tsx` 必须使用默认导出 (`export default`)
   - **错误代码**: `export function Layout(...) { ... }`
   - **正确代码**: `export default function Layout(...) { ... }`
   - **后果**: Next.js 无法识别为路由组件，构建报错或渲染空白
   - **记忆点**: App Router 约定的特殊文件，一律 `export default`

2. ❌ **易错点 2**: Next.js 模块路径大小写敏感（即使 Windows 文件系统不敏感）
   - **错误代码**: `import TopNav from "@/Components/TopNav"`（实际目录是 `components/`）
   - **正确代码**: `import TopNav from "@/components/TopNav"`
   - **后果**: 本地能跑，部署到 Linux 服务器/CI 时构建失败
   - **记忆点**: 路径与文件名严格按目录大小写来写，不要依赖 OS 容错

---

## 🎓 学到的最佳实践

1. **路由分组 + 共享 layout**: 把同一类页面（如所有工作台）放进 `(group)/` 下统一套 layout，URL 干净、维护集中
2. **Client Component 最小化**: 只在需要交互/Hook 的叶子组件加 `'use client'`，让父级尽量保持 Server Component，减少 hydration 成本

---

## 🎯 下次学习计划

**明确目标**:
- [ ] 进入 M2 文档解析模块
- [ ] 安装 `pdfjs-dist` / `mammoth` / `exceljs`
- [ ] 实现 `parseDocument(file, filename)` 多格式解析
- [ ] 实现 `chunkTextWithMetadata` 文本切片器（含重叠机制）
- [ ] 实现 `/api/kb/[id]/upload` 接口（到切片环节）

**预计耗时**: 约 4h

**前置准备**:
- 阅读 Next.js Route Handler 相关文档（`node_modules/next/dist/docs/`）
- 准备一份 PDF / DOCX / XLSX 测试样本

---

## 💬 自我反思

**做得好的地方**:
- 严格按里程碑节奏推进，先做最小可运行骨架再扩展
- 路由分组与 layout 嵌套理解到位，没有走 URL 嵌套的弯路

**需要改进的地方**:
- 对 Server/Client Component 边界还需要更多实战巩固
- TypeScript 解构 + 类型注解的复合语法需要刻意练习

**下次注意**:
- M2 涉及文件 IO 与第三方解析库，注意异步处理与错误传播
- API Route 的入参/出参契约先定义，再实现
