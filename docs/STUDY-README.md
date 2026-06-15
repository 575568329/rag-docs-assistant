# 🎓 RAG 项目复习学习库

> 通过"从零重写"的方式，深度掌握 RAG 技术栈
> 学习方式参考 `D:\Study\Node.js-Study`

---

## 📌 当前定位

- **学习分支**: `study/rag-rewrite-2026-06`
- **参考分支**: `master`（完整实现，作为参考答案）
- **开始日期**: 2026-06-15
- **学习方式**: 理论学习 → 代码实现 → 测试验证 → 笔记沉淀

---

## 🎯 学习目标

通过重写 RAG 文档知识管理平台，复习并掌握：

| 技术 | 复习重点 |
|------|---------|
| **Node.js** | 异步编程、文件 IO、流处理 |
| **Next.js 16** | App Router、API Routes、流式响应、Server Components |
| **LangChain / AI SDK** | 流式输出、消息管理、Prompt 工程、结构化输出 |
| **LangGraph** | 状态机编排、节点流转（如项目中有用到） |
| **向量检索** | 向量化、相似度计算、混合搜索（RRF）、多库检索 |
| **知识图谱** | 实体抽取、关系建模、Graphology、力导图可视化 |

---

## 📂 目录导航

| 目录 | 用途 |
|------|------|
| [notes/](notes/) | 📚 知识点笔记库（按领域分层） |
| [notes/00-学习导航/](notes/00-学习导航/) | 学习路线图、技术栈清单、数据流图 |
| [notes/01-知识点总结/](notes/01-知识点总结/) | 6 大领域知识点 |
| [notes/03-易错点与陷阱/](notes/03-易错点与陷阱/) | 踩坑记录 |
| [notes/05-速查表/](notes/05-速查表/) | 快速查阅 |
| [sessions/](sessions/) | 📅 每日学习会话记录 |
| [code-examples/](code-examples/) | 💻 独立可运行的代码示例 |
| [milestones/](milestones/) | 🚩 6 大里程碑实现记录 |
| [progress/](progress/) | 📊 进度追踪 |

---

## 🗺️ 学习路径

按里程碑顺序推进（详见 [progress/module-checklist.md](progress/module-checklist.md)）：

```
M1 项目初始化 (2h)
  └─> M2 文档解析模块 (4h)
        └─> M3 向量检索模块 ⭐ (6h)
              └─> M4 RAG 对话模块 ⭐ (5h)
                    └─> M5 知识图谱模块 (4h)
                          └─> M6 前端交互 (3h)
```

---

## 🔄 每日学习循环

1. **学习前**：查看 [progress/overall-progress.md](progress/overall-progress.md) 确认当前位置
2. **学习中**：
   - 阅读对应领域笔记（理论）
   - 对照 `master` 分支理解原实现
   - 在 `study` 分支从零实现
   - 编写测试验证
3. **学习后**：
   - 在 `sessions/{日期}/session-notes.md` 记录会话
   - 更新 `progress/` 进度
   - 沉淀易错点到 `notes/03-易错点与陷阱/`
   - 更新 `notes/INDEX.md` 和 `sessions/INDEX.md` 索引

---

## 🚀 快速开始

```bash
# 确认在学习分支
git branch --show-current   # 应输出 study/rag-rewrite-2026-06

# 对比参考实现
git diff master -- src/lib/vector-store/file-store.ts

# 开始今天的学习，复制会话模板
cp study/sessions/SESSION-TEMPLATE.md study/sessions/$(date +%Y-%m-%d)/session-notes.md
```

---

## 📊 当前进度速览

| 里程碑 | 状态 | 完成度 |
|--------|------|--------|
| M1 项目初始化 | ⬜ 未开始 | 0% |
| M2 文档解析 | ⬜ 未开始 | 0% |
| M3 向量检索 ⭐ | ⬜ 未开始 | 0% |
| M4 RAG 对话 ⭐ | ⬜ 未开始 | 0% |
| M5 知识图谱 | ⬜ 未开始 | 0% |
| M6 前端交互 | ⬜ 未开始 | 0% |

> 详细进度见 [progress/overall-progress.md](progress/overall-progress.md)
