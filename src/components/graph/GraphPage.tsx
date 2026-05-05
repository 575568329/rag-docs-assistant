'use client'

import { useState, useCallback, useEffect } from 'react'
import GraphCanvas from './GraphCanvas'
import GraphSearch from './GraphSearch'
import NodeDetail from './NodeDetail'
import { EntityType } from '@/lib/graph-store'

export interface GraphPageProps {
  kbId?: string | null
  focusEntityId?: string
}

export interface GraphNode {
  id: string
  label: string
  type: EntityType
  val?: number
}

export interface GraphLink {
  source: string
  target: string
  label: string
}

export interface SearchResult {
  id: string
  label: string
  type: string
  properties: Record<string, string | number | boolean>
  edgeCount: number
}

interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

export default function GraphPage({ kbId, focusEntityId }: GraphPageProps) {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] })
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [selectedNodeEdges, setSelectedNodeEdges] = useState<{ target: string; label: string }[]>([])
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const [loading, setLoading] = useState(false)
  const [overviewLoaded, setOverviewLoaded] = useState(false)
  const [favoritedNodes, setFavoritedNodes] = useState<Set<string>>(new Set())

  // 组件挂载时自动加载概览 + 已收藏节点
  useEffect(() => {
    if (focusEntityId) {
      loadNodeNeighborhood(focusEntityId)
    } else if (kbId) {
      loadOverview()
    }
    // 加载已收藏节点 ID
    const params = new URLSearchParams()
    if (kbId) params.set('kbId', kbId)
    fetch(`/api/graph/favorites?${params}`)
      .then(res => res.json())
      .then((data: { nodeId: string }[]) => {
        setFavoritedNodes(new Set(data.map(f => f.nodeId)))
      })
      .catch(() => {})
  }, [focusEntityId, kbId])

  const loadOverview = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ mode: 'overview' })
      if (kbId) params.append('kbId', kbId)

      const response = await fetch(`/api/graph?${params}`)
      if (!response.ok) throw new Error('加载概览失败')

      const data = await response.json()
      const nodes: GraphNode[] = (data.nodes || []).map((node: any) => ({
        id: node.id, label: node.label, type: node.type, val: node.val,
      }))
      const links: GraphLink[] = (data.edges || []).map((edge: any) => ({
        source: edge.source, target: edge.target, label: edge.label,
      }))

      setGraphData({ nodes, links })
      setOverviewLoaded(true)
    } catch (error) {
      console.error('加载概览失败:', error)
    } finally {
      setLoading(false)
    }
  }, [kbId])

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({ query, limit: '20' })
      if (kbId) params.append('kbId', kbId)

      const response = await fetch(`/api/graph/search?${params}`)
      if (!response.ok) throw new Error('搜索失败')

      const data = await response.json()
      setSearchResults(data.results || [])
    } catch (error) {
      console.error('搜索失败:', error)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }, [kbId])

  const loadNodeNeighborhood = useCallback(async (nodeId: string, depth = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ nodeId, depth: String(depth) })
      if (kbId) params.append('kbId', kbId)

      const response = await fetch(`/api/graph?${params}`)
      if (!response.ok) throw new Error('加载图谱失败')

      const data = await response.json()

      const nodes: GraphNode[] = (data.nodes || []).map((node: any) => ({
        id: node.id,
        label: node.label,
        type: node.type,
        val: node.val,
      }))

      const links: GraphLink[] = (data.edges || []).map((edge: any) => ({
        source: edge.source,
        target: edge.target,
        label: edge.label,
      }))

      setGraphData({ nodes, links })
    } catch (error) {
      console.error('加载图谱失败:', error)
    } finally {
      setLoading(false)
    }
  }, [kbId])

  const handleSearchResultSelect = useCallback((nodeId: string) => {
    setSearchResults([])
    loadNodeNeighborhood(nodeId, 1)
  }, [loadNodeNeighborhood])

  const handleNodeClick = useCallback(async (node: GraphNode) => {
    setSelectedNode(node)

    const params = new URLSearchParams({ nodeId: node.id, depth: '1' })
    if (kbId) params.append('kbId', kbId)

    const response = await fetch(`/api/graph?${params}`)
    if (response.ok) {
      const data = await response.json()
      setSelectedNodeEdges(data.edges || [])
    } else {
      setSelectedNodeEdges([])
    }
  }, [kbId])

  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNode(node)
  }, [])

  const handleExpand = useCallback((nodeId: string) => {
    loadNodeNeighborhood(nodeId, 2)
  }, [loadNodeNeighborhood])

  const handleCloseDetail = useCallback(() => {
    setSelectedNode(null)
    setSelectedNodeEdges([])
  }, [])

  const handleReset = useCallback(() => {
    setSearchResults([])
    setSelectedNode(null)
    setSelectedNodeEdges([])
    loadOverview()
  }, [loadOverview])

  const handleFavorite = useCallback(async (nodeId: string, nodeLabel: string, nodeType: string) => {
    if (favoritedNodes.has(nodeId)) return
    try {
      const res = await fetch('/api/graph/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId, nodeLabel, nodeType, kbId: kbId || null }),
      })
      if (res.ok) {
        setFavoritedNodes(prev => new Set([...prev, nodeId]))
      }
    } catch { /* ignore */ }
  }, [kbId, favoritedNodes])

  const isEmpty = graphData.nodes.length === 0 && overviewLoaded

  return (
    <div className="relative h-full bg-white">
      <GraphCanvas
        graphData={graphData}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        hoveredNode={hoveredNode}
      />

      <GraphSearch
        onSearch={handleSearch}
        results={searchResults}
        onSelect={handleSearchResultSelect}
        loading={loading}
      />

      {isEmpty && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <h2 className="text-3xl font-bold text-gray-300 mb-3">探索知识图谱</h2>
          <p className="text-gray-400 text-base">上传文档后自动生成知识图谱</p>
        </div>
      )}

      {overviewLoaded && graphData.nodes.length > 0 && (
        <button
          onClick={handleReset}
          className="absolute top-4 right-4 z-10 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
        >
          重置概览
        </button>
      )}

      {selectedNode && (
        <NodeDetail
          node={selectedNode}
          edges={selectedNodeEdges}
          onExpand={handleExpand}
          onClose={handleCloseDetail}
          onFavorite={handleFavorite}
          isFavorited={favoritedNodes.has(selectedNode.id)}
        />
      )}
    </div>
  )
}
