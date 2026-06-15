# Next.js API Routes 速查表

> Next.js 16 App Router API Routes 常用写法

---

## 基础结构

### GET 请求
```typescript
// app/api/users/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  return Response.json({ data: [] });
}
```

### POST 请求
```typescript
// app/api/users/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  
  return Response.json({ success: true });
}
```

### 动态路由
```typescript
// app/api/users/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  return Response.json({ id });
}
```

---

## 常用响应

### JSON 响应
```typescript
return Response.json({ data: 'hello' });
```

### 错误响应
```typescript
return Response.json(
  { error: 'Not found' },
  { status: 404 }
);
```

### 流式响应（SSE）
```typescript
const stream = new ReadableStream({
  start(controller) {
    controller.enqueue('data: hello\n\n');
    controller.close();
  }
});

return new Response(stream, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
  },
});
```

---

## FormData 处理

```typescript
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const name = formData.get('name') as string;
  
  // 处理文件
  const buffer = await file.arrayBuffer();
  
  return Response.json({ success: true });
}
```

---

## 错误处理

```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // 业务逻辑
    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## ⚠️ 注意事项

1. **动态路由参数是 Promise**：Next.js 16 中 `params` 是异步的，需要 `await`
2. **不要使用 `req.query`**：使用 `new URL(request.url).searchParams`
3. **FormData vs JSON**：根据 Content-Type 自动判断
4. **CORS**：需要手动设置响应头
