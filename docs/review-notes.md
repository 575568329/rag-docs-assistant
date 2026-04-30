# 复习笔记

> 基于 coding-review.md 中的薄弱点，整理需要复习和练习的知识点

---

## 1. TypeScript 类型系统

### 1.1 数组类型的维度区分

核心规则：**想清楚你要的是一个还是多个**。

```typescript
// 一个向量（一维）
let queryVector: number[] = [0.1, 0.2, 0.3]

// 多个向量（二维）— 比如批量存储时
let vectors: number[][] = [[0.1, 0.2], [0.3, 0.4]]

// 一个 ID
let id: string = 'chunk-0'

// 多个 ID（批量操作几乎都用数组）
let ids: string[] = ['chunk-0', 'chunk-1', 'chunk-2']
```

**判断技巧**：
- 方法里做"批量"操作（addVectors 存多个切片）→ 参数是数组
- 方法里做"单个"操作（getEmbedding 转一条文本）→ 参数是单值
- 返回"多条结果"→ 返回类型加 `[]`，如 `Promise<{ content: string; score: number }[]>`

### 1.2 export 不能忘

```typescript
// 其他文件要 import 的话，必须 export
export interface VectorStore { ... }
export class FileStore implements VectorStore { ... }
export async function getEmbedding(text: string) { ... }
```

### 1.3 返回值类型要和声明一致

```typescript
// 错误：声明返回 number，实际可能返回 string
score: distance !== null ? 1 - distance : ''

// 正确：兜底值也是 number
score: distance !== null ? 1 - distance : 0
```

---

## 2. 数组操作方法

### 2.1 四个核心方法速查

```typescript
const arr = [3, 1, 4, 1, 5]

// map — 转换每个元素，返回新数组
arr.map(n => n * 2)              // [6, 2, 8, 2, 10]

// filter — 过滤，返回满足条件的新数组
arr.filter(n => n > 2)           // [3, 4, 5]

// slice — 截取，不修改原数组
arr.slice(0, 3)                  // [3, 1, 4]

// sort — 排序，注意返回数字不是布尔值
arr.sort((a, b) => b - a)        // [5, 4, 3, 1, 1] 降序
arr.sort((a, b) => a - b)        // [1, 1, 3, 4, 5] 升序
```

### 2.2 常见错误

```typescript
// 错误：sort 回调返回 boolean
arr.sort((a, b) => a > b)        // 结果不确定！sort 需要数字

// 正确：sort 回调返回数字（正数/负数/零）
arr.sort((a, b) => a - b)

// 错误：手动 for 循环截取
const result = []
for (let i = 0; i < topK; i++) {
  result[i] = data[i]
}

// 正确：用 slice
const result = data.slice(0, topK)
```

---

## 3. 错误处理原则

```typescript
// 错误：返回字符串（调用方拿到 string 当 number[] 用会崩溃）
if (!data) return '请求失败'

// 正确：抛异常，让调用方 try-catch 处理
if (!data) throw new Error('请求失败')
```

**原则**：函数的返回类型应该是**唯一的**，出错就 throw，不要用返回值表示错误。

---

## 4. 层级边界意识

问自己一个问题：**这个模块该关心什么？**

```
向量存储层 → 只管向量 + 文本 + 相似度检索
业务层(db) → 只管元数据（名称、时间、数量）
Embedding  → 只管文本→向量转换
```

判断技巧：如果一个信息"检索时不需要"，就不属于向量存储层。

---

## 5. fetch 响应判断

```typescript
const res = await fetch('/api/kb')

// 错误：res 永远是 truthy（fetch 只有网络错误才 reject）
if (res) { ... }

// 正确：用 res.ok 判断 HTTP 状态码是否 2xx
if (res.ok) { ... }

// 或者用状态码
if (res.status === 200) { ... }
```

**原则**：`fetch` 返回的 Response 对象始终存在，即使服务器返回 404/500。用 `res.ok` 或 `res.status` 判断。

---

## 6. API Route 校验顺序

```typescript
// 错误：先做耗时操作再校验（浪费 API 调用）
const vectors = await getEmbedding(chunks)  // 耗时！
if (!kb) return error                       // 发现知识库不存在，白费了

// 正确：先校验再处理（卫语句思想）
if (!kb) return error
const vectors = await getEmbedding(chunks)  // 校验通过才执行
```

**原则**：校验前置，尽早返回，避免无效的耗时操作。

---

## 待补充

后续学习中发现新的薄弱点会持续更新到本文档。
