import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children, wide = false }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={`relative w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'} max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-linen dark:bg-ink-900 border border-ink-900/10 dark:border-linen/10 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-200`}
      >
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b border-ink-900/10 dark:border-linen/10 bg-linen/95 dark:bg-ink-900/95 backdrop-blur-sm">
          <h3 className="font-display text-xl text-ink-900 dark:text-linen">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full text-ink-500 hover:bg-ink-900/5 dark:hover:bg-linen/10">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
