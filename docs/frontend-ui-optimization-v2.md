# 前端 UI 优化方案（第二批）

## 修改范围

侧边栏 + 数据管理页 + 知识图谱页，共 5+ 个组件文件。

---

## 〇、侧边栏 — 按页面差异化显示（P0）

**文件**: `src/app/(platform)/layout.tsx`

### 现状问题
- 左侧边栏在所有页面（对话/数据/图谱）都显示"新建知识库"按钮和知识库列表
- 对话页应显示"新对话"而非"新建知识库"
- 缺少历史对话记录功能
- 图谱页缺少收藏功能

### 侧边栏分区设计

```
┌──────────────────────┐
│  [功能区按钮]         │  ← 按页面不同
├──────────────────────┤
│  📚 全部             │  ← 知识库选择区（所有页面共享）
│     知识库 A          │
│     知识库 B          │
├──────────────────────┤
│  💬 对话1 (对话页)    │  ← 历史对话区 / 收藏区（按页面）
│     对话2             │
│     对话3             │
└──────────────────────┘
```

### 按页面差异

| 区域 | 对话页 | 数据页 | 图谱页 |
|------|--------|--------|--------|
| 功能按钮 | "新对话" | "新建知识库" | 无额外按钮 |
| 知识库选择 | ✅ 显示 | ✅ 显示 | ✅ 显示 |
| 历史对话 | ✅ 显示 | ❌ 隐藏 | ❌ 隐藏 |
| 收藏节点 | ❌ 隐藏 | ❌ 隐藏 | ✅ 显示 |

### 实现方案

**P0（本轮实现）**：功能区按钮按页面切换
- layout.tsx 中根据 `activePage` 条件渲染不同按钮
- 对话页：`+ 新对话` → 清空当前对话（重置 `useChat` 的 chatId）
- 数据页：`+ 新建知识库` → 保持现有逻辑
- 图谱页：不显示功能按钮

**P1（延后）**：历史对话 + 收藏功能
- 历史对话需要：对话持久化 API + `localStorage` 或数据库存储 → 工作量大，排到下一批
- 收藏功能需要：收藏 API + 存储 → 同上

### 涉及文件
- `src/app/(platform)/layout.tsx` — 条件渲染功能区按钮

---

## 一、KbCard — 文档列表卡片化

**文件**: `src/components/data/KbCard.tsx`

### 现状问题
- 文档列表项是 `bg-gray-50 rounded px-3 py-2` 的简单条目，缺乏层次感
- 删除按钮只是裸文字 "删除"，没有按钮形态

### 修改方案
文档列表项改为**小卡片**：

```
┌──────────────────────────────────────────┐
│  📄 地质灾害隐患点数据.xlsx               ×│
│     15 切片 · 2024-06-15 上传    [删除]  │
└──────────────────────────────────────────┘
```

- 每个文档一个 `bg-white border border-gray-200 rounded-lg p-3` 卡片
- 左侧显示文件图标（SVG，按扩展名区分颜色）+ 文件名（粗体）
- 第二行显示：切片数量 · 上传时间（如果有）
- 右侧：删除按钮改为图标按钮（垃圾桶 SVG），hover 时显示红色
- 去掉 alert() 校验，改为 Toast 提示（已有 Toast 组件）
- 文件图标颜色按类型：xlsx=绿色 / pdf=红色 / docx=蓝色 / txt=灰色 / md=紫色

### 涉及文件
- `src/components/data/KbCard.tsx` — 重写文档列表渲染部分

---

## 二、GraphCanvas — 背景色适配白色主题

**文件**: `src/components/graph/GraphCanvas.tsx`

### 现状问题
- `BG_COLOR = '#1a1a2e'`（深蓝黑），与整体白色 Perplexity 风格完全不搭
- `TEXT_COLOR = '#e2e8f0'`（浅灰白），如果背景改白色则文字不可见
- 边默认颜色 `rgba(255,255,255,0.15)` 是白色半透明，在白底上不可见

### 修改方案
全部改为**白色底 + 深色元素**：

| 元素 | 旧值 | 新值 |
|------|------|------|
| 背景色 | `#1a1a2e` | `#ffffff` |
| 节点文字 | `#e2e8f0` | `#374151`（gray-700） |
| 边默认色 | `rgba(255,255,255,0.15)` | `rgba(156,163,175,0.25)`（gray-400 半透明） |
| 边高亮色 | `#3b82f6` | `#3b82f6`（不变） |
| 边非高亮消隐 | `rgba(255,255,255,0.05)` | `rgba(156,163,175,0.05)` |
| 节点默认 alpha | `1` | `1`（不变） |
| 节点非高亮 alpha | `0.15` | `0.15`（不变） |

### 审查结论 ✅ 通过

> **调研来源**: Datawrapper 博客（2023 年主流数据可视化工具调研）、Cambridge Intelligence 图谱可视化最佳实践
>
> - 大多数数据可视化工具（Datawrapper、Flourish、Observable）默认使用亮色背景，暗色背景仅用于演示/大屏场景
> - 我们的图谱**文字标签密集**（节点名、边标签），亮色背景更利于文字阅读
> - Neo4j Bloom、Linkurious 等专业图谱工具均支持亮色主题
> - **唯一例外**：暗色背景对长时间盯屏更护眼，但本项目为短时查询场景，不是持续监控，白色更合适
>
> **结论**：白底方案合理，无需调整。

### 涉及文件
- `src/components/graph/GraphCanvas.tsx` — 修改常量和边颜色回调

---

## 三、GraphPage — 有数据时自动加载图谱

**文件**: `src/components/graph/GraphPage.tsx`

### 现状问题
- 进入图谱页时 `graphData` 初始为空，页面显示"探索知识图谱"空态
- 必须手动搜索才能看到图谱数据
- 即使知识库已上传文档且提取了实体，用户也看不到任何东西

### 修改方案
增加 `loadOverview()` 函数：

1. 组件挂载时（有 kbId），调用 `/api/graph?mode=overview&kbId={kbId}` 获取概览图
2. 如果后端返回了节点，直接展示全库实体关系概览
3. 用户搜索时，切换为搜索结果的子图展示
4. 点击搜索结果后，调用 `loadNodeNeighborhood` 展开邻居
5. 新增"重置"按钮，点击后回到概览视图

空态仅在以下情况显示：
- 没有 kbId
- 后端 overview 返回空数据（确实没有上传文档/没有实体）

### 审查结论 ✅ 通过

> **调研来源**: NN/g 空态设计指南、UX StackExchange 讨论、Cambridge Intelligence 渐进式展示
>
> - NN/g 明确建议：初始页面应展示有意义的概览数据，而非空态提示
> - 图谱场景中，直接展示全库实体关系概览比空态更直观
> - Cambridge Intelligence 推荐渐进式展示：先概览 → 搜索聚焦 → 点击展开邻居
> - 空态仅在"真的没有数据"时出现，符合用户预期
>
> **结论**：自动加载概览方案合理，无需调整。

### 涉及文件
- `src/components/graph/GraphPage.tsx` — 新增 `loadOverview` + useEffect 自动加载
- `src/app/api/graph/route.ts` — 已有 `mode=overview` 支持，无需修改

---

## 四、GraphSearch — 搜索框优化（搜索栏 + 快捷键）

**文件**: `src/components/graph/GraphSearch.tsx`

### 现状问题
- 搜索框固定在页面顶部 `p-4 max-w-2xl mx-auto`，像一个孤立的输入框悬浮在图谱上方
- 在白色背景上，`bg-white/10 border-white/20 text-white` 样式是为深色背景设计的
- 视觉上与整体页面脱节

### 修改方案

改为**固定搜索栏 + 快捷键触发 + 模态结果面板**的混合模式：

```
默认态（固定在图谱左上角）：
┌─────────────────────────────────────────────────────┐
│ 🔍 搜索图谱节点...                    Ctrl+K       │
└─────────────────────────────────────────────────────┘
          ↓ 用户点击或按 Ctrl+K → 激活搜索框
┌─────────────────────────────────────────────────────┐
│ 🔍 泥石流                                   ✕     │
├─────────────────────────────────────────────────────┤
│  🔵 泥石流隐患沟    [概念]  8 个关联               │
│  🔵 泥石流防治工程  [概念]  5 个关联               │
│  🟢 映秀镇          [地点]  12 个关联              │
│  📄 泥石流防治规范  [文档]  3 个关联               │
└─────────────────────────────────────────────────────┘
```

具体设计：

1. **搜索触发器**（默认态）：
   - 放在 GraphPage 左上角，绝对定位（`absolute top-4 left-4 z-10`）
   - 样式：`bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm`
   - 内容：🔍 图标 + "搜索图谱..." + 右侧 `Ctrl+K` 快捷键提示（灰色小字）
   - 视觉上融入页面，不突兀

2. **激活态**（搜索态）：
   - 点击触发器或按 Ctrl+K → 触发器变为输入框，下方展开结果面板
   - 面板样式：`bg-white rounded-xl shadow-lg border max-w-md`
   - 输入框 + 结果列表在面板内
   - 点击外部区域 / ESC / 选择结果后回到触发器状态
   - Ctrl+K 快捷键切换

3. **颜色适配白色主题**：
   - 输入框：`bg-white border-gray-200 text-gray-900 placeholder-gray-400`
   - 结果项：`hover:bg-gray-50`，文字 `text-gray-900`
   - 类型标签颜色保留（来自 `getEntityConfig`）

### 审查结论 ⚠️ 调整（原方案为 Command Palette，已改为混合模式）

> **调研来源**: Sam Solomon UX 分析、Mobbin 设计模式库、Reddit UX 讨论
>
> - **Command Palette 适用场景**：命令+导航+最近项（键盘优先），如 VS Code ⌘K、Notion ⌘K
> - **Inline Search 适用场景**：内容发现（普适理解），如 Google 搜索栏
> - 我们的图谱搜索**仅搜索节点**，无命令/动作/导航，更接近内容搜索
> - Reddit UX 讨论建议混合方案：搜索栏形态的触发按钮，点击/快捷键激活后展开结果
>
> **调整**：保留快捷键（Ctrl+K）和模态结果面板的交互体验，但不使用完整的 Command Palette 模式。
> 触发器始终可见（不是隐藏的弹窗），降低用户发现成本。

### 涉及文件
- `src/components/graph/GraphSearch.tsx` — 重写为 Command Palette 模式
- `src/components/graph/GraphPage.tsx` — 搜索框不再在顶部，改为左上角触发器 + 模态面板

---

## 修改文件清单

| 文件 | 修改类型 | 优先级 | 说明 |
|------|---------|--------|------|
| `src/app/(platform)/layout.tsx` | 逻辑 | P0 | 侧边栏功能区按页面差异化渲染 |
| `src/components/data/KbCard.tsx` | 重构 | P0 | 文档列表卡片化 + 文件类型图标 |
| `src/components/graph/GraphCanvas.tsx` | 样式 | P0 | 白色背景 + 深色元素 |
| `src/components/graph/GraphPage.tsx` | 逻辑+样式 | P0 | 自动加载概览 + 背景色改白 |
| `src/components/graph/GraphSearch.tsx` | 重构 | P0 | 搜索栏 + 快捷键 + 模态结果面板 |

### 延后项（P1，下一批实现）

**存储方案**：延续现有 JSON 文件（`data/db.json`），与知识库/文档一致，不引入新依赖。

在 `src/lib/db.ts` 的 `DBData` 接口中新增两个字段：

```jsonc
{
  "knowledgeBases": [...],
  "documents": [...],
  "conversations": [
    { "id": "conv_1", "title": "地质灾害防治相关问题", "kbId": "know_1", "createdAt": "..." }
  ],
  "favorites": [
    { "id": "fav_1", "nodeId": "泥石流隐患沟", "nodeType": "Concept", "nodeLabel": "泥石流隐患沟", "kbId": "know_1", "createdAt": "..." }
  ]
}
```

**历史对话**：
- `src/lib/db.ts` — 新增 conversations CRUD
- `src/app/api/chat/history/route.ts` — 对话列表 API
- `src/app/(platform)/layout.tsx` — 对话页侧边栏渲染历史列表
- 消息内容仍由 `useChat` 管理（内存），侧边栏只存对话摘要（id + title + kbId）

**收藏节点**：
- `src/lib/db.ts` — 新增 favorites CRUD
- `src/app/api/graph/favorites/route.ts` — 收藏 API
- `src/components/graph/GraphPage.tsx` — 节点右键/长按收藏 + 侧边栏收藏列表

P0 不涉及后端修改。`/api/graph?mode=overview` 已存在。
