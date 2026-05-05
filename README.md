# 智能知识管理平台

一个面向个人或小团队的 RAG 文档知识管理平台。项目围绕「知识库管理、AI 问答、知识图谱」三个工作区组织：先上传并解析文档，再通过向量检索辅助问答，同时用图谱视图观察文档中的实体与关系。

## 设计理念

- **工作台优先**：首屏直接进入可操作界面，不做营销式落地页；顶部负责全局模块切换，左侧负责知识库选择，主区域聚焦当前任务。
- **信息密度适中**：数据页采用紧凑卡片和表格化文档列表，减少大面积按钮和空白，让知识库、文档数、切片数、上传状态更容易扫描。
- **上下文一致**：通过 `kbId` 保持对话、数据、图谱之间的知识库选择一致；新建、上传、删除后同步刷新左侧知识库列表和图谱状态。
- **轻量视觉系统**：整体使用浅色背景、低饱和边框、8px 内圆角、克制的蓝色强调，服务于后台管理和重复操作场景。

## 技术栈

| 类别 | 技术 |
| --- | --- |
| Web 框架 | Next.js 16.2.4 App Router |
| 前端 | React 19.2.4 + TypeScript 5 |
| 样式 | Tailwind CSS 4 |
| AI 编排 | AI SDK v6、`@ai-sdk/react`、`@ai-sdk/openai` |
| 模型服务 | 智谱 GLM-4-flash、embedding-3 |
| 文档解析 | `pdfjs-dist`、`mammoth`、`exceljs` |
| 向量存储 | 本地 FileStore，ChromaDB 可选 |
| 知识图谱 | `graphology`、`react-force-graph-2d` |
| 持久化 | 本地 JSON 文件：`data/db.json`、`data/vectors.json`、`data/app.log` |

## 核心能力

- 多知识库创建、删除、选择与状态同步。
- 支持上传 `.txt`、`.md`、`.pdf`、`.docx`、`.xlsx` 文档。
- 文档解析、切片、向量化和相似度检索。
- 基于知识库的流式 AI 问答，支持 Markdown 回答和来源引用。
- 数据页查看知识库文档数、切片数、文档列表和处理状态。
- 图谱页展示当前知识库的实体节点、关系数量、搜索和收藏节点。
- 本地文件持久化，适合开发、演示和轻量个人知识库场景。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local`：

```env
# 智谱 API Key，从 https://open.bigmodel.cn 获取
ZHIPU_API_KEY=your_api_key_here

# 向量存储方式：file（默认）或 chroma
VECTOR_STORE=file
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)。

## 使用流程

1. 在「数据」页创建或选择知识库。
2. 上传文档，等待解析、切片和向量化完成。
3. 切到「对话」页，基于当前知识库提问。
4. 切到「图谱」页，查看当前知识库抽取出的节点和关系。

## 项目结构

```text
src/
├── app/
│   ├── (platform)/
│   │   ├── layout.tsx          # 平台布局：顶部导航 + 左侧知识库栏
│   │   ├── chat/page.tsx       # 对话页
│   │   ├── data/page.tsx       # 数据管理页
│   │   └── graph/page.tsx      # 知识图谱页
│   └── api/
│       ├── chat/               # RAG 对话与历史
│       ├── kb/                 # 知识库、文档、上传接口
│       └── graph/              # 图谱数据、搜索、收藏接口
├── components/
│   ├── chat/                   # 对话页组件
│   ├── data/                   # 知识库和文档管理组件
│   └── graph/                  # 图谱画布、搜索、节点详情
└── lib/
    ├── db.ts                   # 本地元数据持久化
    ├── doc-parser.ts           # 多格式文档解析
    ├── chunker.ts              # 文档切片
    ├── embedding.ts            # 向量化
    ├── graph-store.ts          # 图谱数据存取
    └── vector-store/           # FileStore / ChromaStore
```

## 数据存储

运行时会自动创建 `data/` 目录：

| 文件 | 说明 |
| --- | --- |
| `data/db.json` | 知识库、文档和会话元数据 |
| `data/vectors.json` | FileStore 模式下的向量数据 |
| `data/app.log` | 运行时日志 |

## 构建

```bash
npm run build
npm run start
```
