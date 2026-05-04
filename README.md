# RAG 知识库问答系统

基于 RAG（检索增强生成）架构的 AI 知识库问答系统。上传文档后，AI 基于文档内容进行精准问答，支持来源引用。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) + React 19 |
| AI | Vercel AI SDK v6 + 智谱 GLM-4-flash |
| 向量存储 | 文件存储（FileStore）/ ChromaDB（可选） |
| 样式 | Tailwind CSS 4 |
| 语言 | TypeScript 5 (strict) |

## 功能特性

### 知识库管理
- 创建 / 删除知识库，支持多知识库并行
- 默认内置知识库，开箱即用

### 文档处理
- 支持 `.txt` / `.md` 文件上传
- Markdown 按标题分片，保留标题上下文
- 同名文件自动去重
- 上传进度条实时展示（XHR）
- 文档列表展开查看 / 单个删除（同步清理向量数据）

### RAG 对话
- 文档切片 → 向量化 → 相似度检索 → 注入上下文 → LLM 流式回答
- 余弦相似度搜索，Top-K + 最低阈值双过滤
- 无相关文档时自动切换通用回答模式
- 响应支持 Markdown 渲染（react-markdown）
- 来源引用标注

### 工程化
- JSON 文件持久化（`data/db.json` + `data/vectors.json`）
- 运行时日志记录（`data/app.log`）
- 向量存储策略模式（FileStore / ChromaStore 可切换）

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件：

```env
# 智谱 API Key（必填，从 https://open.bigmodel.cn 获取）
ZHIPU_API_KEY=your_api_key_here

# 向量存储方式：file（默认）或 chroma
VECTOR_STORE=file
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 即可使用。

## 使用流程

1. **创建知识库** — 点击「创建知识库」，填写名称和描述
2. **上传文档** — 在知识库卡片上点击「上传文档」，选择 `.txt` 或 `.md` 文件
3. **开始对话** — 点击「开始对话」进入问答页面，基于已上传文档进行提问

## 项目结构

```
src/
├── app/
│   ├── page.tsx                    # 首页 — 知识库管理
│   ├── api/
│   │   ├── chat/route.ts           # RAG 对话接口
│   │   └── kb/
│   │       ├── route.ts            # 知识库 CRUD
│   │       └── [id]/
│   │           ├── upload/route.ts # 文档上传 + 切片 + 向量化
│   │           └── docs/route.ts   # 文档列表 / 单个删除
├── components/
│   ├── ChatPanel.tsx               # 对话面板（AI SDK useChat）
│   └── Toast.tsx                   # 通知提示组件
└── lib/
    ├── db.ts                       # JSON 文件持久化（知识库 & 文档）
    ├── types.ts                    # 类型定义
    ├── chunker.ts                  # Markdown 文本切片
    ├── embedding.ts                # 向量化（智谱 embedding-3）
    ├── logger.ts                   # 运行时日志
    └── vector-store/
        ├── types.ts                # VectorStore 接口
        ├── index.ts                # 工厂函数（根据环境变量选择存储）
        ├── file-store.ts           # 文件存储实现
        └── chroma-store.ts         # ChromaDB 存储实现
```

## 数据存储

所有数据存储在项目根目录的 `data/` 下（自动创建）：

| 文件 | 说明 |
|------|------|
| `data/db.json` | 知识库和文档元数据 |
| `data/vectors.json` | 向量数据（仅 FileStore 模式） |
| `data/app.log` | 运行时日志 |

## RAG 流程

```
用户提问
  ↓
问题向量化（embedding-3）
  ↓
向量相似度搜索（余弦相似度，Top-K=5，阈值≥0.45）
  ↓
有相关文档？ ──否──→ 通用回答模式
  │是
  ↓
拼接检索结果 + 用户问题 → LLM（GLM-4-flash）
  ↓
流式返回 + 来源引用
```

## 后续优化方向

- [ ] 混合检索（向量 + BM25 关键词搜索）提升召回率
- [ ] 来源追溯标签（SourceBadge）
- [ ] 多轮对话上下文优化
- [ ] 接入 shadcn/ui 统一 UI 风格
- [ ] 替换为 PostgreSQL + pgvector 生产级存储
