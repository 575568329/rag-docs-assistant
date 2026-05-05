'use client'

import { getEntityConfig } from '@/lib/ui-constants'

interface EntityTagsProps {
  entities: { id: string; name: string; type: string }[]
  onEntityClick?: (entityId: string) => void
}

export default function EntityTags({ entities, onEntityClick }: EntityTagsProps) {
  if (!entities || entities.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {entities.map((entity) => {
        const config = getEntityConfig(entity.type)

        return (
          <button
            key={entity.id}
            onClick={() => onEntityClick?.(entity.id)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${config.bgClass} ${config.textClass} hover:opacity-80 transition-opacity`}
          >
            <span>{config.label}</span>
            <span className="font-semibold">{entity.name}</span>
          </button>
        )
      })}
    </div>
  )
}
