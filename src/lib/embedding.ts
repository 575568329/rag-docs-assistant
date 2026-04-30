export async function getEmbedding(texts:string[]) {
  const apiKey = process.env.ZHIPU_API_KEY
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
    const data = await response.json()
    if (data && data.data && data.data.length) {
      return data.data.map((item: { embedding?: number[] }) => item.embedding || [])
    }else{
      throw new Error('Embedding API 调用失败')
    }
    
  } catch (error) {
    throw new Error('Embedding 方法错误'+error)
  }
} 