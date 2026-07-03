import { GripVertical } from 'lucide-react'

export default function DragHandle({ handleProps, className = '' }) {
  return (
    <button
      type="button"
      {...handleProps}
      className={`touch-none cursor-grab active:cursor-grabbing p-1.5 -m-1.5 text-ink-300 dark:text-ink-500 shrink-0 ${className}`}
      aria-label="Reordenar"
    >
      <GripVertical size={16} />
    </button>
  )
}
