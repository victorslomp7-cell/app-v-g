import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, FileText, Download, FileImage } from 'lucide-react'
import { api } from '../lib/api.js'
import { PageHeader, EmptyState } from '../components/ui.jsx'
import Modal from '../components/Modal.jsx'
import { formatDate } from '../lib/format.js'

const DEFAULT_CATEGORIES = ['Certidões', 'Contratos', 'Comprovantes', 'Outros']

export default function Documents() {
  const [docs, setDocs] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [category, setCategory] = useState('Outros')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [filter, setFilter] = useState('all')

  const load = () => api.documents.list().then(setDocs)
  useEffect(() => { load() }, [])

  const categories = useMemo(() => {
    const set = new Set(DEFAULT_CATEGORIES)
    docs.forEach((d) => set.add(d.category))
    return Array.from(set)
  }, [docs])

  const filtered = filter === 'all' ? docs : docs.filter((d) => d.category === filter)

  const upload = async (e) => {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    try {
      await api.documents.create(category, notes, file)
      setModalOpen(false)
      setNotes('')
      setFile(null)
      load()
    } finally {
      setUploading(false)
    }
  }

  const remove = async (d) => {
    if (!confirm(`Remover "${d.original_name}"?`)) return
    await api.documents.remove(d.id)
    load()
  }

  const isImage = (mime) => mime?.startsWith('image/')

  return (
    <div>
      <PageHeader
        eyebrow="Papelada do casamento"
        title="Documentos importantes"
        description="Certidões, contratos e comprovantes organizados por categoria."
        actions={<button className="btn-primary" onClick={() => setModalOpen(true)}><Plus size={15} /> Documento</button>}
      />

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setFilter('all')} className={`badge cursor-pointer ${filter === 'all' ? 'bg-sage-700 text-linen' : 'bg-ink-900/5 dark:bg-linen/10 text-ink-600 dark:text-ink-200'}`}>
          Todos
        </button>
        {categories.map((c) => (
          <button key={c} onClick={() => setFilter(c)} className={`badge cursor-pointer ${filter === c ? 'bg-sage-700 text-linen' : 'bg-ink-900/5 dark:bg-linen/10 text-ink-600 dark:text-ink-200'}`}>
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FileText} title="Nenhum documento salvo" description="Guarde certidões, contratos e comprovantes para não perder nada." />
      ) : (
        <div className="card divide-y divide-ink-900/5 dark:divide-linen/10">
          {filtered.map((d) => (
            <div key={d.id} className="flex items-center gap-3 px-5 py-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage-700/10 text-sage-700 dark:text-sage-300">
                {isImage(d.mime) ? <FileImage size={16} /> : <FileText size={16} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink-800 dark:text-linen truncate">{d.original_name}</p>
                <p className="text-xs text-ink-400">{d.category} · {formatDate(d.uploaded_at)}{d.notes ? ` · ${d.notes}` : ''}</p>
              </div>
              <a href={`/uploads/${d.filename}`} download={d.original_name} className="p-2 rounded-full text-ink-500 hover:bg-ink-900/5 dark:hover:bg-linen/10">
                <Download size={16} />
              </a>
              <button className="p-2 rounded-full text-clay-600 hover:bg-clay-500/10" onClick={() => remove(d)}><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Adicionar documento">
        <form onSubmit={upload} className="space-y-4">
          <div>
            <label className="label">Categoria</label>
            <input list="doc-categories" className="input" value={category} onChange={(e) => setCategory(e.target.value)} />
            <datalist id="doc-categories">
              {categories.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div>
            <label className="label">Notas (opcional)</label>
            <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div>
            <label className="label">Arquivo</label>
            <input required type="file" className="input" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" disabled={uploading} className="btn-primary">{uploading ? 'Enviando…' : 'Salvar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
