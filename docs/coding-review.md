# 编码问题追踪

> 每次代码提交后更新，追踪薄弱环节和进步

---

## 薄弱领域雷达

| 领域 | 出错次数 | 状态 |
|------|---------|------|
| TypeScript 类型 | 5 | Day 2 清零 ✅ |
| 数组操作 | 4 | Day 2 清零 ✅ |
| 错误处理 | 3 | 观察中 |
| 层级边界 | 3 | 需关注 |

---

## 问题记录

### Day 1（2026-04-29）— 数据层

| 文件 | 问题 | 类别 | 是否重复 |
|------|------|------|---------|
| types.ts | `ids` 参数类型写成 `string` 而非 `string[]`（数组 vs 单值） | TS类型 | - |
| types.ts | `queryVector` 类型写成 `number[][]` 而非 `number[]`（二维 vs 一维） | TS类型 | - |
| types.ts | `similaritySearch` 返回值漏了 `[]`，少了一层数组 | TS类型 | - |
| types.ts | 忘记加 `export` | TS类型 | - |
| embedding.ts | 参数类型写成 `number[][]`，应该是 `string`（完全写反了） | TS类型 | - |
| chroma-store.ts | for 循环复制数组，多余操作 | 数组操作 | - |
| file-store.ts | `sort` 回调返回 `boolean` 而非 `number` | 数组操作 | - |
| file-store.ts | 循环里硬编码 `[0]` 而非用循环变量 `[index]` | 数组操作 | - |
| file-store.ts | 用 for 循环截取 topK，不知道 `slice()` | 数组操作 | - |
| embedding.ts | 错误时返回字符串而非 throw | 错误处理 | - |
| chroma-store.ts | 错误时返回字符串而非 throw | 错误处理 | - |
| embedding.ts | 放进了 vector-store 目录（应在 lib/ 下） | 层级边界 | - |
| db.ts | `deleteKB` 没有同时删除关联文档 | 层级边界 | - |

### Day 2（2026-04-30）— API + 首页

| 文件 | 问题 | 类别 | 是否重复 |
|------|------|------|---------|
| page.tsx | `if (res)` 判断 fetch 成功，`res` 永远 truthy，应用 `res.ok` | 错误处理 | - |
| upload/route.ts | 校验放在向量化之后，浪费 API 调用 | 流程设计 | - |
| upload/route.ts | `addVectors` 第一个参数传了 `file.name` 而非集合名 `kb-${id}` | 层级边界 | ⚠️ 与 Day1 类似 |

---

## 已解决

（连续 2 次提交未犯同类错误后移入此处）

| 领域 | 解决日期 | 备注 |
|------|---------|------|
| TypeScript 类型 | 2026-04-30 | Day 2 连续 0 次出错 |
| 数组操作 | 2026-04-30 | Day 2 连续 0 次出错 |
