import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, GripVertical, Clock, FileDown, Share2, Copy, Check } from 'lucide-react'
import { api } from '../lib/api.js'
import { useSettings } from '../lib/SettingsContext.jsx'
import { PageHeader, EmptyState } from '../components/ui.jsx'
import Modal from '../components/Modal.jsx'
import { exportTimelinePdf } from '../lib/pdf.js'

const emptyEvent = { time: '', title: '', description: '' }

export default function DayTimeline() {
  const { settings } = useSettings()
  const [events, setEvents] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyEvent)
  const [dragId, setDragId] = useState(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const load = () => api.timeline.list().then(setEvents)
  useEffect(() => { load() }, [])

  const openNew = () => { setEditing(null); setForm(emptyEvent); setModalOpen(true) }
  const openEdit = (ev) => { setEditing(ev); setForm({ ...ev }); setModalOpen(true) }

  const save = async (e) => {
    e.preventDefault()
    if (editing) await api.timeline.update(editing.id, form)
    else await api.timeline.create(form)
    setModalOpen(false)
    load()
  }

  const remove = async (ev) => {
    if (!confirm(`Remover "${ev.title}" do cronograma?`)) return
    await api.timeline.remove(ev.id)
    load()
  }

  const onDrop = async (target) => {
    if (!dragId || dragId === target?.id) return
    const list = [...events]
    const from = list.findIndex((e) => e.id === dragId)
    const to = target ? list.findIndex((e) => e.id === target.id) : list.length - 1
    const [moved] = list.splice(from, 1)
    list.splice(to, 0, moved)
    setEvents(list)
    setDragId(null)
    await api.timeline.reorder(list.map((e, i) => ({ id: e.id, position: i })))
    load()
  }

  const exportPdf = () => {
    exportTimelinePdf(events, `${settings.couple_name_1} & ${settings.couple_name_2}`, settings.wedding_date)
  }

  const shareLink = settings ? `${window.location.origin}/share/${settings.share_token}` : ''
  const copyLink = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  const regenerateLink = async () => {
    if (!confirm('Gerar um novo link invalida o link antigo. Continuar?')) return
    await api.backup.regenerateToken('share')
    location.reload()
  }

  return (
    <div>
      <PageHeader
        eyebrow="Grande dia"
        title="Cronograma do dia"
        description="A linha do tempo detalhada do casamento — compartilhe com fornecedores e padrinhos."
        actions={
          <>
            <button className="btn-secondary" onClick={() => setShareOpen(true)}><Share2 size={15} /> Compartilhar</button>
            <button className="btn-secondary" onClick={exportPdf}><FileDown size={15} /> PDF</button>
            <button className="btn-primary" onClick={openNew}><Plus size={15} /> Evento</button>
          </>
        }
      />

      {events.length === 0 ? (
        <EmptyState icon={Clock} title="Cronograma vazio" description="Adicione os horários do making of, cerimônia, festa e mais." />
      ) : (
        <div className="card divide-y divide-ink-900/5 dark:divide-linen/10">
          {events.map((ev) => (
            <div
              key={ev.id}
              draggable
              onDragStart={() => setDragId(ev.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(ev)}
              className="flex items-center gap-4 px-5 py-4 group"
            >
              <GripVertical size={15} className="text-ink-300 cursor-grab shrink-0" />
              <span className="font-display text-xl text-sage-700 dark:text-sage-300 w-16 shrink-0">{ev.time}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-800 dark:text-linen">{ev.title}</p>
                {ev.description && <p className="text-xs text-ink-400 mt-0.5">{ev.description}</p>}
              </div>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button className="p-1.5 rounded-full text-ink-500 hover:bg-ink-900/5 dark:hover:bg-linen/10" onClick={() => openEdit(ev)}><Pencil size={14} /></button>
                <button className="p-1.5 rounded-full text-clay-600 hover:bg-clay-500/10" onClick={() => remove(ev)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          <div onDragOver={(e) => e.preventDefault()} onDrop={() => onDrop(null)} className="h-3" />
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar evento' : 'Novo evento'}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Horário</label>
            <input required type="time" className="input" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </div>
          <div>
            <label className="label">Título</label>
            <input required className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Detalhes</label>
            <textarea className="input" rows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>

      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="Compartilhar cronograma (somente leitura)">
        <div className="space-y-4">
          <p className="text-sm text-ink-500 dark:text-ink-300">
            Envie este link para padrinhos, família e fornecedores. Eles verão o cronograma do dia sem poder editar nada.
          </p>
          <div className="flex items-center gap-2">
            <input readOnly className="input font-mono text-xs" value={shareLink} />
            <button className="btn-secondary shrink-0" onClick={copyLink}>{copied ? <Check size={15} /> : <Copy size={15} />}</button>
          </div>
          <button className="text-xs text-clay-600 hover:underline" onClick={regenerateLink}>Gerar novo link (invalida o atual)</button>
        </div>
      </Modal>
    </div>
  )
}
