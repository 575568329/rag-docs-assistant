
export interface VectorStore {
  addVectors(collectionName:string, vectors:number[][], texts:string[], ids:string[]):Promise<void>
  similaritySearch(collectionName:string, queryVector:number[], topK:number):Promise<{ content: string|null; score: number|null }[]>
  deleteCollection(collectionName:string):Promise<void>
  count(collectionName:string):Promise<number>
}
