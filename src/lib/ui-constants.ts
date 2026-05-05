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

/* ------------------------------------------------------------------ */
/*  统一 UI 样式常量                                                   */
/*  所有前端组件引用此对象，保持视觉一致。不引入额外依赖。               */
/* ------------------------------------------------------------------ */
export const ui = {
  button: {
    primary:
      'px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors',
    secondary:
      'px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors',
    danger:
      'px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors',
    icon: 'w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors',
  },
  input:
    'w-full px-3 py-2 text-sm border border-gray-200 bg-white rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors placeholder:text-gray-400',
  card: 'bg-white border border-gray-200 rounded-lg p-4',
  panel:
    'bg-white border border-gray-200 rounded-lg shadow-lg',
  dialogOverlay: 'fixed inset-0 bg-black/30 flex items-center justify-center z-50',
  dialogPanel: 'bg-white border border-gray-200 rounded-lg shadow-lg p-6 w-full max-w-md',
} as const
