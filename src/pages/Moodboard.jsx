import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Image as ImageIcon, X } from 'lucide-react'
import { api } from '../lib/api.js'
import { PageHeader, EmptyState } from '../components/ui.jsx'
import Modal from '../components/Modal.jsx'

const DEFAULT_CATEGORIES = ['Decoração', 'Buffet', 'Vestido', 'Traje', 'Convites', 'Geral']

export default function Moodboard() {
  const [items, setItems] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [category, setCategory] = useState('Geral')
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [filter, setFilter] = useState('all')
  const [lightbox, setLightbox] = useState(null)

  const load = () => api.moodboard.list().then(setItems)
  useEffect(() => { load() }, [])

  const categories = useMemo(() => {
    const set = new Set(DEFAULT_CATEGORIES)
    items.forEach((i) => set.add(i.category))
    return Array.from(set)
  }, [items])

  const filtered = filter === 'all' ? items : items.filter((i) => i.category === filter)

  const upload = async (e) => {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    try {
      await api.moodboard.create(category, caption, file)
      setModalOpen(false)
      setCaption('')
      setFile(null)
      load()
    } finally {
      setUploading(false)
    }
  }

  const remove = async (item) => {
    if (!confirm('Remover esta imagem do mural?')) return
    await api.moodboard.remove(item.id)
    setLightbox(null)
    load()
  }

  return (
    <div>
      <PageHeader
        eyebrow="Referências visuais"
        title="Mural de inspiração"
        description="Guarde imagens de decoração, buffet, vestido e traje por categoria."
        actions={<button className="btn-primary" onClick={() => setModalOpen(true)}><Plus size={15} /> Imagem</button>}
      />

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setFilter('all')} className={`badge cursor-pointer ${filter === 'all' ? 'bg-sage-700 text-linen' : 'bg-ink-900/5 dark:bg-linen/10 text-ink-600 dark:text-ink-200'}`}>
          Todas
        </button>
        {categories.map((c) => (
          <button key={c} onClick={() => setFilter(c)} className={`badge cursor-pointer ${filter === c ? 'bg-sage-700 text-linen' : 'bg-ink-900/5 dark:bg-linen/10 text-ink-600 dark:text-ink-200'}`}>
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ImageIcon} title="Nenhuma imagem por aqui" description="Salve fotos de referência para lembrar do estilo que vocês querem." />
      ) : (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 [column-fill:_balance]">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => setLightbox(item)}
              className="mb-3 block w-full break-inside-avoid rounded-xl2 overflow-hidden shadow-soft group relative"
            >
              <img src={item.filename} alt={item.caption || ''} className="w-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-linen text-left truncate">{item.category}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Adicionar imagem">
        <form onSubmit={upload} className="space-y-4">
          <div>
            <label className="label">Categoria</label>
            <input list="categories" className="input" value={category} onChange={(e) => setCategory(e.target.value)} />
            <datalist id="categories">
              {categories.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div>
            <label className="label">Legenda (opcional)</label>
            <input className="input" value={caption} onChange={(e) => setCaption(e.target.value)} />
          </div>
          <div>
            <label className="label">Imagem</label>
            <input required type="file" accept="image/*" className="input" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" disabled={uploading} className="btn-primary">{uploading ? 'Enviando…' : 'Salvar'}</button>
          </div>
        </form>
      </Modal>

      {lightbox && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink-950/80 p-4" onClick={() => setLightbox(null)}>
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.filename} alt="" className="w-full rounded-xl2 max-h-[80vh] object-contain bg-ink-950" />
            <div className="flex items-center justify-between mt-3">
              <div>
                <p className="text-linen text-sm font-medium">{lightbox.category}</p>
                {lightbox.caption && <p className="text-linen/70 text-xs">{lightbox.caption}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => remove(lightbox)} className="p-2 rounded-full bg-clay-500/20 text-clay-300 hover:bg-clay-500/30"><Trash2 size={16} /></button>
                <button onClick={() => setLightbox(null)} className="p-2 rounded-full bg-linen/10 text-linen hover:bg-linen/20"><X size={16} /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
