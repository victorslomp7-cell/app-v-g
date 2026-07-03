import { useRef, useState } from 'react'
import { Camera, Loader2, TriangleAlert } from 'lucide-react'
import { api } from '../lib/api.js'
import { useSettings } from '../lib/SettingsContext.jsx'

export default function PhotoSlot({ settingKey, className = '', rounded = 'rounded-xl2', placeholder }) {
  const { settings, refresh } = useSettings()
  const inputRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const url = settings?.[settingKey]

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError('')
    try {
      await api.settings.uploadPhoto(settingKey, file)
      await refresh()
    } catch (err) {
      setError(err.message || 'Não foi possível enviar a foto.')
    } finally {
      setLoading(false)
      e.target.value = ''
    }
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className={`group relative overflow-hidden ${rounded} ${className} bg-sage-800/10 dark:bg-linen/5`}
    >
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-sage-700 dark:text-sage-300 p-4 text-center">
          <Camera size={22} />
          <span className="text-xs font-medium">{placeholder || 'Adicionar foto'}</span>
        </div>
      )}
      {url && (
        <div className="absolute inset-0 flex items-center justify-center bg-ink-950/0 lg:group-hover:bg-ink-950/30 transition-colors">
          {loading && <Loader2 size={20} className="animate-spin text-linen" />}
        </div>
      )}
      {url && !loading && (
        <div className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-ink-950/60 text-linen lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
          <Camera size={14} />
        </div>
      )}
      {error && (
        <div className="absolute inset-x-0 bottom-0 flex items-start gap-1.5 bg-clay-600/95 px-2.5 py-2 text-left">
          <TriangleAlert size={13} className="text-linen shrink-0 mt-0.5" />
          <span className="text-[11px] leading-snug text-linen">{error}</span>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </button>
  )
}
