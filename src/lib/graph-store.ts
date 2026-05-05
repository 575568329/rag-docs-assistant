/**
 * GraphStore - 基于 Graphology 的图存储
 *
 * 持久化到 data/graph.json，支持节点/边的增删查和邻域查询。
 * 按 kbId 隔离知识库数据。
 */

import Graph from 'graphology'
import { bfsFromNode } from 'graphology-traversal'
import * as fs from 'fs'
import * as path from 'path'

const GRAPH_FILE = path.resolve('data/graph.json')

/** 实体类型 */
export type EntityType =
  | 'Person'
  | 'Organization'
  | 'Location'
  | 'Concept'
  | 'Event'
  | 'Document'

/** 关系类型 */
export type RelationType =
  | 'BELONGS_TO'
  | 'RELATED_TO'
  | 'LOCATED_AT'
  | 'PART_OF'
  | 'CAUSED_BY'

/** 节点属性 */
export interface NodeProperties {
  kbId: string
  createdAt: string
  [key: string]: string | number | boolean | undefined
}

/** 边属性 */
export interface EdgeProperties {
  [key: string]: string | number | boolean | undefined
}

/** 导出的节点（用于前端） */
export interface ExportedNode {
  id: string
  label: string
  type: EntityType
  properties: Record<string, string | number | boolean>
}

/** 导出的边（用于前端） */
export interface ExportedEdge {
  source: string
  target: string
  label: RelationType
}

/** 图谱统计 */
export interface GraphStats {
  nodeCount: number
  edgeCount: number
  typeDistribution: Partial<Record<EntityType, number>>
  relationDistribution: Partial<Record<RelationType, number>>
}

/** 图谱快照（节点 + 边 + 统计） */
export interface GraphSnapshot {
  nodes: ExportedNode[]
  edges: ExportedEdge[]
  stats: GraphStats
}

/** 读取 graph.json，返回序列化数据或空图 */
function loadGraphData(): {
  attributes: Record<string, unknown>
  options: Record<string, unknown>
  nodes: Array<{ key: string; attributes: NodeProperties }>
  edges: Array<{
    key: string
    source: string
    target: string
    attributes: EdgeProperties & { type: RelationType; label?: RelationType }
  }>
} {
  if (!fs.existsSync(GRAPH_FILE)) {
    return { attributes: {}, options: { allowSelfLoops: true, multi: false, type: 'mixed' }, nodes: [], edges: [] }
  }
  return JSON.parse(fs.readFileSync(GRAPH_FILE, 'utf8'))
}

/** 写入 graph.json */
function saveGraphData(data: unknown): void {
  fs.mkdirSync(path.dirname(GRAPH_FILE), { recursive: true })
  fs.writeFileSync(GRAPH_FILE, JSON.stringify(data, null, 2), 'utf8')
}

/** 创建 Graph 实例并加载数据 */
function createGraph(): Graph {
  const data = loadGraphData()
  const graph = new Graph()
  graph.import(data)
  return graph
}

export class GraphStore {
  private graph: Graph

  constructor() {
    this.graph = createGraph()
  }

  /**
   * 添加或更新节点
   * @param id 节点 ID
   * @param label 节点显示名称
   * @param type 实体类型
   * @param properties 自定义属性（必须包含 kbId）
   */
  addNode(id: string, label: string, type: EntityType, properties: NodeProperties): void {
    if (this.graph.hasNode(id)) {
      // 更新现有节点
      this.graph.mergeNodeAttributes(id, { label, type, ...properties })
    } else {
      this.graph.addNode(id, { label, type, ...properties })
    }
    this._persist()
  }

  /**
   * 添加边
   * @param source 源节点 ID
   * @param target 目标节点 ID
   * @param label 关系类型
   * @param properties 自定义属性
   */
  addEdge(source: string, target: string, label: RelationType, properties?: EdgeProperties): void {
    const edgeKey = `${source}->${target}`
    if (this.graph.hasEdge(edgeKey)) {
      // 更新现有边
      this.graph.mergeEdgeAttributes(edgeKey, { type: label, ...properties })
    } else {
      this.graph.addEdge(source, target, { type: label, label, ...properties })
    }
    this._persist()
  }

  /**
   * 按名称模糊搜索节点
   * @param query 搜索关键词
   * @param kbId 知识库 ID（可选，不传则搜索全部）
   */
  searchNodes(query: string, kbId?: string): ExportedNode[] {
    const results: ExportedNode[] = []

    this.graph.forEachNode((nodeId, attrs) => {
      const nodeAttrs = attrs as { label: string; type: EntityType; kbId: string }
      if (kbId && nodeAttrs.kbId !== kbId) return

      if (nodeAttrs.label && nodeAttrs.label.includes(query)) {
        results.push({
          id: nodeId,
          label: nodeAttrs.label,
          type: nodeAttrs.type,
          properties: { kbId: nodeAttrs.kbId },
        })
      }
    })

    return results
  }

  /**
   * 获取指定节点的 N 层邻居（BFS）
   * @param nodeId 节点 ID
   * @param depth 深度（默认 1，最大 3）
   * @param kbId 知识库 ID（过滤）
   */
  getNeighborhood(nodeId: string, depth = 1, kbId?: string): { nodes: ExportedNode[]; edges: ExportedEdge[] } {
    const visited = new Set<string>([nodeId])
    const nodes: ExportedNode[] = []
    const edges: ExportedEdge[] = []
    const effectiveDepth = Math.min(depth, 3)

    bfsFromNode(
      this.graph,
      nodeId,
      (currNode, attrs, currDepth) => {
        if (currDepth > effectiveDepth) return true // 停止遍历

        const nodeAttrs = attrs as { label: string; type: EntityType; kbId: string }
        if (kbId && nodeAttrs.kbId !== kbId) return

        nodes.push({
          id: currNode,
          label: nodeAttrs.label,
          type: nodeAttrs.type,
          properties: { kbId: nodeAttrs.kbId },
        })

        // 收集到已访问节点的边
        this.graph.forEachOutEdge(currNode, (edge, _, source, target, attrs) => {
          const edgeAttrs = attrs as { type: RelationType; label?: RelationType }
          if (!visited.has(target)) return // 只记录到下一层的边
          edges.push({
            source,
            target,
            label: edgeAttrs.type,
          })
        })
      }
    )

    return { nodes, edges }
  }

  /**
   * 获取图谱快照（用于前端可视化）
   * @param kbId 知识库 ID（可选）
   */
  getGraphSnapshot(kbId?: string): GraphSnapshot {
    const nodes: ExportedNode[] = []
    const edges: ExportedEdge[] = []

    this.graph.forEachNode((nodeId, attrs) => {
      const nodeAttrs = attrs as { label: string; type: EntityType; kbId: string }
      if (kbId && nodeAttrs.kbId !== kbId) return

      nodes.push({
        id: nodeId,
        label: nodeAttrs.label,
        type: nodeAttrs.type,
        properties: { kbId: nodeAttrs.kbId },
      })
    })

    this.graph.forEachEdge((edgeId, attrs, source, target) => {
      const sourceAttrs = this.graph.getNodeAttributes(source) as { kbId?: string }
      const targetAttrs = this.graph.getNodeAttributes(target) as { kbId?: string }

      // 如果任意端点不匹配 kbId，则跳过
      if (kbId && sourceAttrs.kbId !== kbId && targetAttrs.kbId !== kbId) return

      const edgeAttrs = attrs as { type: RelationType; label?: RelationType }
      edges.push({
        source,
        target,
        label: edgeAttrs.type,
      })
    })

    return { nodes, edges, stats: this._computeStats(kbId) }
  }

  /**
   * 删除指定知识库的所有图谱数据
   * @param kbId 知识库 ID
   */
  deleteCollection(kbId: string): void {
    const nodesToDelete: string[] = []

    this.graph.forEachNode((nodeId, attrs) => {
      const nodeAttrs = attrs as { kbId: string }
      if (nodeAttrs.kbId === kbId) {
        nodesToDelete.push(nodeId)
      }
    })

    nodesToDelete.forEach(nodeId => this.graph.dropNode(nodeId))
    this._persist()
  }

  /**
   * 统计节点和边数量
   * @param kbId 知识库 ID（可选）
   */
  stats(kbId?: string): GraphStats {
    return this._computeStats(kbId)
  }

  /** 计算统计信息 */
  private _computeStats(kbId?: string): GraphStats {
    const typeDistribution: Partial<Record<EntityType, number>> = {}
    const relationDistribution: Partial<Record<RelationType, number>> = {}
    let nodeCount = 0
    let edgeCount = 0

    this.graph.forEachNode((_, attrs) => {
      const nodeAttrs = attrs as { type: EntityType; kbId: string }
      if (kbId && nodeAttrs.kbId !== kbId) return

      nodeCount++
      const type = nodeAttrs.type
      typeDistribution[type] = (typeDistribution[type] ?? 0) + 1
    })

    this.graph.forEachEdge((_, attrs, source, target) => {
      const sourceAttrs = this.graph.getNodeAttributes(source) as { kbId?: string }
      const targetAttrs = this.graph.getNodeAttributes(target) as { kbId?: string }

      // 只有当边连接的两个节点都属于 kbId 时才计入
      if (kbId && (sourceAttrs.kbId !== kbId || targetAttrs.kbId !== kbId)) return

      edgeCount++
      const edgeAttrs = attrs as { type: RelationType }
      const type = edgeAttrs.type
      relationDistribution[type] = (relationDistribution[type] ?? 0) + 1
    })

    return { nodeCount, edgeCount, typeDistribution, relationDistribution }
  }

  /** 持久化到文件 */
  private _persist(): void {
    const data = this.graph.export()
    saveGraphData(data)
  }
}

/** 单例实例 */
let graphStoreInstance: GraphStore | null = null

export function getGraphStore(): GraphStore {
  if (!graphStoreInstance) {
    graphStoreInstance = new GraphStore()
  }
  return graphStoreInstance
}
