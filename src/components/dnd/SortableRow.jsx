import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Render-prop wrapper: exposes drag handle listeners separately so buttons
// inside the row (edit/delete) stay tappable instead of triggering a drag.
export default function SortableRow({ id, className = '', children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${className} ${isDragging ? 'relative z-10 opacity-40' : ''}`}
    >
      {children({ handleProps: { ...attributes, ...listeners } })}
    </div>
  )
}
