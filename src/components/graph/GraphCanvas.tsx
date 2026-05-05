'use client'

import { useRef, useCallback, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { getEntityConfig } from '@/lib/ui-constants'
import type { EntityType } from '@/lib/graph-store'

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false })

/**
 * react-force-graph-2d 内部节点类型。
 * 回调参数必须与此签名兼容，否则 TS 报错。
 */
type ForceNode = { [others: string]: any; id?: string | number; x?: number; y?: number; vx?: number; vy?: number; fx?: number; fy?: number }
/** 运行时节点对象：含预处理字段 */
interface InternalNode extends ForceNode {
  id: string
  label: string
  type: string
  val?: number
  x?: number
  y?: number
  neighbors: string[]
  links: Array<{ source: string | InternalNode; target: string | InternalNode; label: string }>
  __bckgDimensions?: [number, number]
}

/** Props 接口：对外暴露的节点只含业务字段 */
export interface SimpleGraphNode {
  id: string
  label: string
  type: EntityType
  val?: number
  x?: number
  y?: number
}

interface GraphCanvasProps {
  graphData: {
    nodes: Array<{ id: string; label: string; type: string; val?: number }>
    links: Array<{ source: string; target: string; label: string }>
  }
  onNodeClick: (node: SimpleGraphNode) => void
  onNodeHover: (node: SimpleGraphNode | null) => void
  hoveredNode: SimpleGraphNode | null
}

const TEXT_COLOR = '#374151'
const BG_COLOR = '#ffffff'
const NODE_RADIUS = 5

function toSimpleNode(node: InternalNode): SimpleGraphNode {
  return { id: node.id, label: node.label, type: node.type as EntityType, val: node.val, x: node.x, y: node.y }
}

export default function GraphCanvas({ graphData, onNodeClick, onNodeHover, hoveredNode }: GraphCanvasProps) {
  const fgRef = useRef<any>(null)
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set())
  const [highlightLinks, setHighlightLinks] = useState<Set<number>>(new Set())

  // ---------- 预处理：给每个 node 加 neighbors[] 和 links[] ----------
  const processedData = useMemo(() => {
    const nodeMap = new Map<string, InternalNode>()

    for (const raw of graphData.nodes) {
      nodeMap.set(raw.id, { ...raw, neighbors: [], links: [] } as InternalNode)
    }

    const processedLinks = graphData.links.map((raw) => {
      const srcId = String(raw.source)
      const tgtId = String(raw.target)
      const srcNode = nodeMap.get(srcId)
      const tgtNode = nodeMap.get(tgtId)
      const link = { source: srcId, target: tgtId, label: raw.label }

      if (srcNode && tgtNode) {
        srcNode.neighbors.push(tgtId)
        tgtNode.neighbors.push(srcId)
        srcNode.links.push(link)
        tgtNode.links.push(link)
      }

      return link
    })

    return { nodes: Array.from(nodeMap.values()), links: processedLinks }
  }, [graphData])

  // ---------- hover 时更新高亮集合 ----------
  const handleNodeHover = useCallback(
    (node: ForceNode | null) => {
      const internal = node as InternalNode | null
      const newHighlightNodes = new Set<string>()
      const newHighlightLinks = new Set<number>()

      if (internal) {
        newHighlightNodes.add(internal.id)
        for (const neighborId of internal.neighbors) {
          newHighlightNodes.add(neighborId)
        }
        for (let i = 0; i < processedData.links.length; i++) {
          const link = processedData.links[i]
          const srcId = typeof link.source === 'string' ? link.source : (link.source as InternalNode).id
          const tgtId = typeof link.target === 'string' ? link.target : (link.target as InternalNode).id
          if (srcId === internal.id || tgtId === internal.id) {
            newHighlightLinks.add(i)
          }
        }
      }

      setHighlightNodes(newHighlightNodes)
      setHighlightLinks(newHighlightLinks)
      onNodeHover(internal ? toSimpleNode(internal) : null)
    },
    [processedData.links, onNodeHover],
  )

  // ---------- 点击聚焦动画 ----------
  const handleNodeClick = useCallback(
    (node: ForceNode) => {
      const internal = node as InternalNode
      if (fgRef.current && internal.x != null && internal.y != null) {
        fgRef.current.centerAt(internal.x, internal.y, 1000)
        fgRef.current.zoom(2, 1000)
      }
      onNodeClick(toSimpleNode(internal))
    },
    [onNodeClick],
  )

  // ---------- 自定义节点绘制：彩色圆点 + 右侧文字 ----------
  const nodeCanvasObject = useCallback(
    (node: ForceNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const internal = node as InternalNode
      const config = getEntityConfig(internal.type)
      const isHighlighted = highlightNodes.size === 0 || highlightNodes.has(internal.id)
      const alpha = isHighlighted ? 1 : 0.15

      const fontSize = Math.max(12 / globalScale, 2)
      const label = internal.label || internal.id

      // 画彩色圆点
      ctx.beginPath()
      ctx.arc(internal.x!, internal.y!, NODE_RADIUS, 0, 2 * Math.PI)
      ctx.fillStyle = config.color
      ctx.globalAlpha = alpha
      ctx.fill()
      ctx.globalAlpha = 1

      // 画文字标签（圆点右侧）
      ctx.font = `${fontSize}px Sans-Serif`
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = TEXT_COLOR
      ctx.globalAlpha = alpha
      ctx.fillText(label, internal.x! + NODE_RADIUS + 1, internal.y!)
      ctx.globalAlpha = 1

      // 缓存背景尺寸供 nodePointerAreaPaint 使用
      const textWidth = ctx.measureText(label).width
      internal.__bckgDimensions = [textWidth + NODE_RADIUS * 2 + 2, Math.max(fontSize, NODE_RADIUS * 2)]
    },
    [highlightNodes],
  )

  // ---------- 节点点击区域 ----------
  const nodePointerAreaPaint = useCallback(
    (node: ForceNode, color: string, ctx: CanvasRenderingContext2D) => {
      const internal = node as InternalNode
      const [bckgWidth = NODE_RADIUS * 2, bckgHeight = NODE_RADIUS * 2] = internal.__bckgDimensions ?? []
      ctx.fillStyle = color
      ctx.fillRect(internal.x! - NODE_RADIUS, internal.y! - bckgHeight / 2, bckgWidth + NODE_RADIUS, bckgHeight)
    },
    [],
  )

  // ---------- 边颜色 ----------
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getLinkColor = useCallback(
    (link: any) => {
      const idx = processedData.links.indexOf(link)
      if (highlightLinks.has(idx)) return '#3b82f6'
      if (highlightNodes.size > 0) return 'rgba(156, 163, 175, 0.05)'
      return 'rgba(156, 163, 175, 0.25)'
    },
    [processedData.links, highlightLinks, highlightNodes],
  )

  // ---------- 边宽度 ----------
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getLinkWidth = useCallback(
    (link: any) => {
      const idx = processedData.links.indexOf(link)
      return highlightLinks.has(idx) ? 2.5 : 0.8
    },
    [processedData.links, highlightLinks],
  )

  // ---------- 节点 val 访问器 ----------
  const getNodeVal = useCallback((node: ForceNode) => {
    return (node as InternalNode).val ?? 1
  }, [])

  return (
    <div className="w-full h-full">
      <ForceGraph2D
        ref={fgRef}
        graphData={processedData}
        nodeId="id"
        linkSource="source"
        linkTarget="target"
        backgroundColor={BG_COLOR}
        nodeRelSize={1}
        nodeVal={getNodeVal}
        nodeCanvasObject={nodeCanvasObject}
        nodePointerAreaPaint={nodePointerAreaPaint}
        linkColor={getLinkColor}
        linkWidth={getLinkWidth}
        linkDirectionalArrowLength={3}
        linkDirectionalArrowRelPos={1}
        minZoom={0.5}
        maxZoom={20}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        enableNodeDrag={true}
        autoPauseRedraw={false}
        cooldownTime={3000}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        linkHoverPrecision={4}
      />
    </div>
  )
}
