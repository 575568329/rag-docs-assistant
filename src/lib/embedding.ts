export async function getEmbedding(texts:string[]) {
  const apiKey = process.env.ZHIPU_API_KEY
  if (!apiKey) {
    throw new Error('缺少 ZHIPU_API_KEY 环境变量')
  }

  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'embedding-3',
        input: texts
      })
    })

    const data = await response.json().catch(() => null)
    if (!response.ok) {
      const message = data?.error?.message ?? data?.message ?? response.statusText
      throw new Error(`Embedding API 调用失败 (${response.status}): ${message}`)
    }

    if (data && data.data && data.data.length) {
      return data.data.map((item: { embedding?: number[] }) => item.embedding || [])
    }else{
      throw new Error('Embedding API 调用失败')
    }
    
  } catch (error) {
    throw new Error(`Embedding 方法错误: ${error instanceof Error ? error.message : String(error)}`)
  }
} 
