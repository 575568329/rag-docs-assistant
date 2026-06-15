# 📋 模块完成清单

> 详细的任务拆解与完成状态

---

## 🚩 M1: 项目初始化 (预估 2h)

**目标**: 搭建 Next.js 16 项目骨架，配置开发环境

**依赖**: 无

**交付物**: 能访问的空壳项目（3 工作台布局）

### 任务列表

- [x] 初始化 Next.js 16 项目
  - [x] `npx create-next-app@latest`
  - [x] 选择 App Router + TypeScript + Tailwind
  
- [x] 配置开发环境
  - [x] 配置 `tsconfig.json`
  - [x] 配置 `next.config.ts`
  - [x] 配置 ESLint
  - [x] 安装必要依赖

- [x] 搭建基础布局
  - [x] 创建 `app/layout.tsx`（根布局）
  - [x] 创建 `app/(platform)/layout.tsx`（平台布局）
  - [x] 创建顶部导航（3 个 Tab：对话/数据/图谱）
  - [x] 创建左侧边栏容器
  
- [x] 创建 3 个工作台页面
  - [x] `app/(platform)/chat/page.tsx`
  - [x] `app/(platform)/data/page.tsx`
  - [x] `app/(platform)/graph/page.tsx`

- [x] 验证
  - [x] `npm run dev` 启动成功
  - [x] 访问 http://localhost:3000
  - [x] 3 个 Tab 能正常切换

**状态**: ✅ 已完成

**实际耗时**: 约 2h

**完成日期**: 2026-06-15

---

## 🚩 M2: 文档解析模块 (预估 4h)

**目标**: 实现多格式文档解析和文本切片功能

**依赖**: M1 完成

**交付物**: `/api/kb/[id]/upload` 接口（到切片环节）

### 任务列表

- [ ] 安装文档解析依赖
  - [ ] `npm install pdfjs-dist mammoth exceljs`
  
- [ ] 实现文档解析器 (`src/lib/doc-parser.ts`)
  - [ ] 实现 PDF 解析（pdfjs-dist）
  - [ ] 实现 DOCX 解析（mammoth）
  - [ ] 实现 XLSX 解析（exceljs）
  - [ ] 实现 TXT/MD 解析（直接读取）
  - [ ] 导出 `parseDocument(file, filename)` 方法

- [ ] 实现文本切片器 (`src/lib/chunker.ts`)
  - [ ] 实现按 Markdown 标题分段
  - [ ] 实现固定大小切片（1000 字符）
  - [ ] 实现重叠机制（100 字符）
  - [ ] 附加元数据（filename, heading, chunkIndex）
  - [ ] 导出 `chunkTextWithMetadata(text, filename)` 方法

- [ ] 实现上传接口 (`src/app/api/kb/[id]/upload/route.ts`)
  - [ ] 接收 FormData
  - [ ] 调用 parseDocument
  - [ ] 调用 chunkTextWithMetadata
  - [ ] 返回切片统计

- [ ] 编写单元测试
  - [ ] 测试 PDF 解析
  - [ ] 测试切片器

**状态**: ⬜ 未开始

**实际耗时**: -

**完成日期**: -

---

## 🚩 M3: 向量检索模块 ⭐ (预估 6h)

**目标**: 实现完整的向量检索引擎（混合搜索 + 多库检索）

**依赖**: M2 完成

**交付物**: FileStore 向量存储 + 混合搜索实现

### 任务列表

- [ ] 实现向量化接口 (`src/lib/embedding.ts`)
  - [ ] 调用智谱 embedding-3 API
  - [ ] 批量处理（支持数组输入）
  - [ ] 错误处理

- [ ] 定义向量存储接口 (`src/lib/vector-store/types.ts`)
  - [ ] `VectorStore` 接口定义
  - [ ] `SearchResult` 类型定义
  - [ ] `CollectionConfig` 类型定义

- [ ] 实现 FileStore (`src/lib/vector-store/file-store.ts`)
  - [ ] 实现 `createCollection` 方法
  - [ ] 实现 `add` 方法（批量添加向量）
  - [ ] 实现向量搜索（余弦相似度）
  - [ ] 实现关键词搜索（TF-IDF）
  - [ ] 实现 RRF 融合算法
  - [ ] 实现 `search` 方法（混合搜索）
  - [ ] 实现 `delete` 方法
  - [ ] 持久化到 data/vectors.json

- [ ] 实现多知识库检索
  - [ ] 支持 collectionNames 数组输入
  - [ ] 跨库结果聚合和排序

- [ ] 更新上传接口
  - [ ] 切片后调用向量化
  - [ ] 存入向量库

- [ ] 编写测试用例
  - [ ] 测试余弦相似度计算
  - [ ] 测试混合搜索 vs 纯向量搜索
  - [ ] 测试多知识库检索

**状态**: ⬜ 未开始

**实际耗时**: -

**完成日期**: -

**关键知识点**:
- 余弦相似度公式
- RRF 融合算法
- TF-IDF 计算

---

## 🚩 M4: RAG 对话模块 ⭐ (预估 5h)

**目标**: 实现流式 RAG 对话，支持多轮对话和来源引用

**依赖**: M3 完成

**交付物**: `/api/chat` 接口完整功能

### 任务列表

- [ ] 安装 AI SDK
  - [ ] `npm install ai`
  - [ ] 配置智谱 API Key

- [ ] 实现多轮对话优化 (`src/app/api/chat/route.ts`)
  - [ ] 实现 `buildSearchQuery`（拼接最近 5 条消息）
  - [ ] 实现截断逻辑（500 字符）

- [ ] 实现检索范围解析
  - [ ] `resolveKnowledgeBaseScope(kbId)`
  - [ ] 单库 vs 全库检索

- [ ] 实现上下文注入
  - [ ] 调用向量检索
  - [ ] 构建来源引用 `SourceRef[]`
  - [ ] 拼接上下文字符串

- [ ] 实现 Prompt 工程
  - [ ] `buildSystemPrompt`
  - [ ] 有上下文：要求标注 [编号]
  - [ ] 无上下文：标注 "AI 补充回答"

- [ ] 实现流式对话
  - [ ] 调用 `streamText`（AI SDK）
  - [ ] 返回 SSE 流式响应
  - [ ] `onFinish` 持久化对话记录

- [ ] 实现前端聊天组件 (`src/components/chat/ChatPage.tsx`)
  - [ ] 使用 `useChat` Hook
  - [ ] 消息列表渲染
  - [ ] 来源卡片显示

- [ ] 编写 curl 测试脚本
  - [ ] 测试单轮对话
  - [ ] 测试多轮对话
  - [ ] 测试来源引用

**状态**: ⬜ 未开始

**实际耗时**: -

**完成日期**: -

**关键知识点**:
- AI SDK streamText 用法
- 流式响应（SSE）
- Prompt 工程

---

## 🚩 M5: 知识图谱模块 (预估 4h)

**目标**: 实现实体抽取、图谱构建和可视化

**依赖**: M3 完成

**交付物**: 知识图谱完整链路（抽取 → 存储 → 查询 → 可视化）

### 任务列表

- [ ] 安装图谱依赖
  - [ ] `npm install graphology react-force-graph-2d`

- [ ] 设计实体和关系 Schema
  - [ ] 定义实体类型（Person/Org/Location/Concept/Event/Document）
  - [ ] 定义关系类型（BELONGS_TO/RELATED_TO/...）
  - [ ] 用 Zod 定义 Schema

- [ ] 实现实体抽取器 (`src/lib/entity-extractor.ts`)
  - [ ] 使用 `generateObject`（AI SDK）
  - [ ] 传入 Zod schema
  - [ ] 从文档切片中提取实体和关系

- [ ] 实现图谱存储 (`src/lib/graph-store.ts`)
  - [ ] 初始化 Graphology 实例
  - [ ] 实现 `addNode` 方法
  - [ ] 实现 `addEdge` 方法
  - [ ] 实现 `queryGraph` 方法（按 kbId 过滤）
  - [ ] 实现 `searchNodes` 方法（关键词搜索）
  - [ ] 持久化到 data/graph.json

- [ ] 实现图谱查询 API (`src/app/api/graph/route.ts`)
  - [ ] GET 支持 query / kbId / nodeId 参数
  - [ ] 返回节点和边数据

- [ ] 实现前端可视化 (`src/components/graph/GraphCanvas.tsx`)
  - [ ] 使用 react-force-graph-2d
  - [ ] 节点点击显示详情
  - [ ] 节点搜索高亮

- [ ] 更新上传接口
  - [ ] 切片后调用实体抽取
  - [ ] 存入图谱库

**状态**: ⬜ 未开始

**实际耗时**: -

**完成日期**: -

**关键知识点**:
- AI SDK generateObject
- Graphology 使用
- 力导图布局算法

---

## 🚩 M6: 前端交互 (预估 3h)

**目标**: 完善前端 UI 和交互体验

**依赖**: M2/M3/M4/M5 完成

**交付物**: 完整的用户界面（3 个工作台）

### 任务列表

- [ ] 实现对话页 (`src/components/chat/ChatPage.tsx`)
  - [ ] 聊天输入框
  - [ ] 消息列表（Markdown 渲染）
  - [ ] 来源卡片组件 (`SourceCard.tsx`)
  - [ ] 对话历史管理（左侧边栏）

- [ ] 实现数据管理页 (`src/components/data/DataPage.tsx`)
  - [ ] 知识库列表
  - [ ] 创建知识库对话框 (`CreateKbDialog.tsx`)
  - [ ] 知识库卡片 (`KbCard.tsx`)
  - [ ] 文档上传（拖拽 + 文件选择）
  - [ ] 文档列表
  - [ ] 文档删除

- [ ] 实现图谱页 (`src/components/graph/GraphPage.tsx`)
  - [ ] 图谱画布 (`GraphCanvas.tsx`)
  - [ ] 搜索面板 (`GraphSearch.tsx`)
  - [ ] 节点详情面板 (`NodeDetail.tsx`)
  - [ ] 节点收藏管理

- [ ] 实现通用组件
  - [ ] Toast 通知 (`Toast.tsx`)
  - [ ] Loading 状态

- [ ] 样式优化
  - [ ] 响应式布局
  - [ ] 暗色模式（可选）

**状态**: ⬜ 未开始

**实际耗时**: -

**完成日期**: -

---

## 📊 总体统计

**总任务数**: 待统计

**已完成**: 0

**进行中**: 0

**未开始**: 待统计

---

## 🔗 相关文档
- [总体进度](overall-progress.md)
- [学习路线图](../notes/00-学习导航/学习路线图.md)
