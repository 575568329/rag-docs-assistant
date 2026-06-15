# 🚩 M4: RAG 对话模块 ⭐

> 实现流式 RAG 对话，支持多轮对话和来源引用

---

## 📊 里程碑信息

- **预估时长**: 5h
- **实际耗时**: -
- **开始日期**: -
- **完成日期**: -
- **状态**: ⬜ 未开始
- **依赖**: M3 完成
- **涉及领域**: B. 向量检索 + C. LangChain 集成 ⭐ 核心

---

## 🎯 目标

实现 RAG 系统的对话引擎：检索增强生成，支持流式输出、多轮对话优化、来源引用标注。

---

## 📝 任务清单

### 1. 安装 AI SDK

```bash
npm install ai
```

### 2. 实现对话接口 (`src/app/api/chat/route.ts`)

#### 2.1 接收请求
```typescript
export async function POST(request: Request) {
  const { messages, kbId, conversationId } = await request.json();
  
  // messages: Array<{role: 'user'|'assistant', content: string}>
  // kbId: string | undefined (undefined = 全库检索)
  // conversationId: string (对话 ID)
}
```

#### 2.2 多轮对话优化
- [ ] 实现 `buildSearchQuery(messages: Message[]): string`
  ```typescript
  function buildSearchQuery(messages: Message[]): string {
    // 1. 提取最近 5 条消息
    const recentMessages = messages.slice(-5);
    
    // 2. 拼接为完整上下文
    const context = recentMessages.map(m => m.content).join('\n');
    
    // 3. 截断到 500 字符（避免稀释 embedding）
    return context.slice(-500);
  }
  ```

- [ ] 提取用户最新问题
  ```typescript
  const userQuery = messages[messages.length - 1].content;
  ```

#### 2.3 解析检索范围
- [ ] 实现 `resolveKnowledgeBaseScope(kbId?: string): string[]`
  ```typescript
  function resolveKnowledgeBaseScope(kbId?: string): string[] {
    if (kbId) {
      return [`kb-${kbId}`]; // 单库检索
    } else {
      // 全库检索：读取所有知识库 ID
      const allKbs = db.listKB();
      return allKbs.map(kb => `kb-${kb.id}`);
    }
  }
  ```

#### 2.4 向量检索
- [ ] 问题向量化
  ```typescript
  const searchQuery = buildSearchQuery(messages);
  const [queryVector] = await getEmbedding([searchQuery]);
  ```

- [ ] 调用混合搜索
  ```typescript
  const collectionNames = resolveKnowledgeBaseScope(kbId);
  const searchResults = await vectorStore.search(
    collectionNames,
    queryVector,
    5, // topK
    userQuery // 关键词搜索
  );
  ```

#### 2.5 构建上下文
- [ ] 实现 `buildContext(results: SearchResult[]): {context: string, sources: SourceRef[]}`
  ```typescript
  interface SourceRef {
    index: number;
    kbId: string;
    docId: string;
    filename: string;
    heading?: string;
    score: number;
  }
  
  function buildContext(results: SearchResult[]) {
    let context = '';
    const sources: SourceRef[] = [];
    
    results.forEach((result, index) => {
      context += `[${index + 1}] ${result.content}\n\n`;
      sources.push({
        index: index + 1,
        kbId: result.metadata.kbId,
        docId: result.metadata.docId,
        filename: result.metadata.filename,
        heading: result.metadata.heading,
        score: result.score,
      });
    });
    
    return { context, sources };
  }
  ```

#### 2.6 构建系统提示词
- [ ] 实现 `buildSystemPrompt(context: string, hasContext: boolean): string`
  ```typescript
  function buildSystemPrompt(context: string, hasContext: boolean): string {
    if (hasContext) {
      return `你是一个 RAG 助手，基于以下知识库内容回答用户问题。
  
  知识库内容：
  ${context}
  
  要求：
  1. 优先使用知识库内容回答
  2. 在回答中标注来源，格式：[编号]
  3. 如果知识库没有相关内容，诚实告知
  4. 回答要简洁、准确`;
    } else {
      return `知识库中没有找到相关内容。以下为 AI 补充回答：`;
    }
  }
  ```

#### 2.7 流式生成
- [ ] 使用 AI SDK streamText
  ```typescript
  import { streamText } from 'ai';
  import { createOpenAI } from '@ai-sdk/openai';
  
  // 配置智谱 API
  const zhipu = createOpenAI({
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    apiKey: process.env.ZHIPU_API_KEY,
  });
  
  const { context, sources } = buildContext(searchResults);
  const systemPrompt = buildSystemPrompt(context, searchResults.length > 0);
  
  const result = streamText({
    model: zhipu('glm-4-flash'),
    system: systemPrompt,
    messages,
    onFinish: async ({ text }) => {
      // 持久化对话记录
      await db.addConversationMessage(conversationId, 'user', userQuery);
      await db.addConversationMessage(conversationId, 'assistant', text, { sources });
    },
  });
  
  return result.toDataStreamResponse({
    getMessageAnnotations: () => ({ sources }), // 传递 sources 给前端
  });
  ```

### 3. 实现前端聊天组件 (`src/components/chat/ChatPage.tsx`)

- [ ] 使用 `useChat` Hook
  ```typescript
  'use client';
  
  import { useChat } from 'ai/react';
  
  export function ChatPage() {
    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
      api: '/api/chat',
      body: {
        kbId: selectedKbId,
        conversationId: currentConversationId,
      },
    });
    
    return (
      <div>
        <MessageList messages={messages} />
        <ChatInput
          value={input}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          disabled={isLoading}
        />
      </div>
    );
  }
  ```

- [ ] 消息列表组件
  - Markdown 渲染（react-markdown）
  - 来源卡片显示

- [ ] 来源卡片组件 (`src/components/chat/SourceCard.tsx`)
  ```typescript
  interface SourceCardProps {
    source: SourceRef;
  }
  
  export function SourceCard({ source }: SourceCardProps) {
    return (
      <div className="border rounded p-2">
        <div className="text-sm font-medium">[{source.index}] {source.filename}</div>
        {source.heading && <div className="text-xs text-gray-500">{source.heading}</div>}
        <div className="text-xs">相似度: {(source.score * 100).toFixed(1)}%</div>
      </div>
    );
  }
  ```

### 4. 测试验证

- [ ] **curl 测试脚本** (`tests/curl/test_chat.sh`)
  ```bash
  #!/bin/bash
  set -euo pipefail
  
  BASE_URL="${BASE_URL:-http://localhost:3000}"
  
  echo "=== 测试：单轮对话 ==="
  curl -X POST "$BASE_URL/api/chat" \
    -H "Content-Type: application/json" \
    -d '{
      "messages": [{"role": "user", "content": "什么是向量检索？"}],
      "kbId": "know_0",
      "conversationId": "test_conv_1"
    }'
  
  echo -e "\n\n=== 测试：多轮对话 ==="
  curl -X POST "$BASE_URL/api/chat" \
    -H "Content-Type: application/json" \
    -d '{
      "messages": [
        {"role": "user", "content": "什么是向量检索？"},
        {"role": "assistant", "content": "向量检索是..."},
        {"role": "user", "content": "它有什么优势？"}
      ],
      "kbId": "know_0",
      "conversationId": "test_conv_1"
    }'
  
  echo -e "\n\n=== 测试：全库检索 ==="
  curl -X POST "$BASE_URL/api/chat" \
    -H "Content-Type: application/json" \
    -d '{
      "messages": [{"role": "user", "content": "总结一下项目的核心功能"}],
      "conversationId": "test_conv_2"
    }'
  ```

- [ ] **前端测试**
  - 发送问题，观察流式输出
  - 查看来源卡片是否正确显示
  - 测试多轮对话（追问）

---

## 📚 涉及知识点

- [ ] AI SDK v6 核心 API
  - `streamText`: 流式生成
  - `useChat`: React Hook
  - `toDataStreamResponse`: SSE 响应

- [ ] 流式响应（SSE）原理
  - Server-Sent Events
  - `Content-Type: text/event-stream`

- [ ] Prompt 工程
  - 系统提示词设计
  - 上下文注入策略
  - 来源引用要求

- [ ] 多轮对话优化
  - 为什么要拼接最近 5 条消息
  - 为什么要截断到 500 字符

---

## ⚠️ 注意事项

1. **智谱 API 兼容性**：确认 AI SDK 是否原生支持智谱，可能需要自定义 provider
2. **流式输出前端处理**：`useChat` 会自动处理流式数据
3. **来源元数据传递**：通过 `getMessageAnnotations` 返回给前端
4. **对话持久化时机**：在 `onFinish` 回调中，确保流式输出完成后再保存
5. **相似度过滤**：如果检索结果都低于阈值，`hasContext = false`

---

## 🔗 参考文件（master 分支）

- `src/app/api/chat/route.ts:1-274`
- `src/components/chat/ChatPage.tsx:1-200`
- `src/components/chat/SourceCard.tsx:1-50`

对比命令：
```bash
git diff master -- src/app/api/chat/route.ts
git diff master -- src/components/chat/ChatPage.tsx
```

---

## 📊 完成标准

- ✅ 对话接口能正常返回流式响应
- ✅ 多轮对话优化生效（拼接上下文）
- ✅ 来源引用正确标注（[1]、[2]...）
- ✅ 前端能显示流式输出
- ✅ 来源卡片正确显示
- ✅ 对话记录能持久化
- ✅ 全库检索和单库检索都能工作
- ✅ curl 测试脚本通过

---

## 🎯 下一步

完成 M4 后，进入 **M5: 知识图谱模块**。
