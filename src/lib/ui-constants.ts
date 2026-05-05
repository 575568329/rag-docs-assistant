/**
 * 共享 UI 常量
 *
 * 图谱实体类型的颜色、标签、图标统一管理，
 * 所有前端组件引用此文件，保持视觉一致。
 */

/** 实体类型 */
export type EntityType = 'Person' | 'Organization' | 'Location' | 'Concept' | 'Event' | 'Document'

/** 实体类型配置（颜色 + 中文标签） */
export const ENTITY_CONFIG: Record<EntityType, {
  /** 主色（hex，用于 Canvas 绘制和 CSS style） */
  color: string
  /** Tailwind 背景色 class */
  bgClass: string
  /** Tailwind 文字 + 边框色 class */
  textClass: string
  /** 中文标签 */
  label: string
}> = {
  Person: {
    color: '#8b5cf6',
    bgClass: 'bg-purple-50',
    textClass: 'text-purple-600 border-purple-200',
    label: '人物',
  },
  Organization: {
    color: '#3b82f6',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-600 border-blue-200',
    label: '组织',
  },
  Location: {
    color: '#22c55e',
    bgClass: 'bg-green-50',
    textClass: 'text-green-600 border-green-200',
    label: '地点',
  },
  Concept: {
    color: '#f97316',
    bgClass: 'bg-orange-50',
    textClass: 'text-orange-600 border-orange-200',
    label: '概念',
  },
  Event: {
    color: '#ef4444',
    bgClass: 'bg-red-50',
    textClass: 'text-red-600 border-red-200',
    label: '事件',
  },
  Document: {
    color: '#6b7280',
    bgClass: 'bg-gray-50',
    textClass: 'text-gray-600 border-gray-200',
    label: '文档',
  },
}

/** 获取实体配置（带 fallback） */
export function getEntityConfig(type: string) {
  return ENTITY_CONFIG[type as EntityType] ?? ENTITY_CONFIG.Concept
}
