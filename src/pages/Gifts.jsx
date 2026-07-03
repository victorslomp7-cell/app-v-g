import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Gift as GiftIcon, ExternalLink } from 'lucide-react'
import { api } from '../lib/api.js'
import { PageHeader, EmptyState, Badge } from '../components/ui.jsx'
import Modal from '../components/Modal.jsx'
import { formatCurrency } from '../lib/format.js'

const emptyGift = { name: '', description: '', link: '', value: '', status: 'desejado', gifted_by: '' }

export default function Gifts() {
  const [gifts, setGifts] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyGift)

  const load = () => api.gifts.list().then(setGifts)
  useEffect(() => { load() }, [])

  const openNew = () => { setEditing(null); setForm(emptyGift); setModalOpen(true) }
  const openEdit = (g) => { setEditing(g); setForm({ ...g, value: g.value ?? '' }); setModalOpen(true) }

  const save = async (e) => {
    e.preventDefault()
    const payload = { ...form, value: form.value === '' ? null : Number(form.value) }
    if (editing) await api.gifts.update(editing.id, payload)
    else await api.gifts.create(payload)
    setModalOpen(false)
    load()
  }

  const remove = async (g) => {
    if (!confirm(`Remover "${g.name}" da lista?`)) return
    await api.gifts.remove(g.id)
    load()
  }

  const toggleStatus = async (g) => {
    await api.gifts.update(g.id, { status: g.status === 'presenteado' ? 'desejado' : 'presenteado' })
    load()
  }

  return (
    <div>
      <PageHeader
        eyebrow="Sonhos e desejos"
        title="Lista de presentes"
        description="Itens, cotas e experiências que vocês gostariam de ganhar."
        actions={<button className="btn-primary" onClick={openNew}><Plus size={15} /> Item</button>}
      />

      {gifts.length === 0 ? (
        <EmptyState icon={GiftIcon} title="Lista vazia" description="Adicione itens desejados, cotas de lua de mel ou mobília." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gifts.map((g) => (
            <div key={g.id} className={`card p-5 ${g.status === 'presenteado' ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-display text-lg text-ink-900 dark:text-linen">{g.name}</p>
                <Badge tone={g.status === 'presenteado' ? 'sage' : 'ochre'}>{g.status === 'presenteado' ? 'Presenteado' : 'Desejado'}</Badge>
              </div>
              {g.description && <p className="text-sm text-ink-500 dark:text-ink-300 mt-1">{g.description}</p>}
              <div className="flex items-center justify-between mt-3">
                {g.value != null && <span className="text-sm font-medium text-ink-700 dark:text-linen">{formatCurrency(g.value)}</span>}
                {g.link && (
                  <a href={g.link} target="_blank" rel="noreferrer" className="text-xs text-sage-700 dark:text-sage-300 flex items-center gap-1 hover:underline">
                    ver item <ExternalLink size={12} />
                  </a>
                )}
              </div>
              {g.gifted_by && <p className="text-xs text-ink-400 mt-1">Presenteado por {g.gifted_by}</p>}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-ink-900/5 dark:border-linen/10">
                <button className="text-xs text-sage-700 dark:text-sage-300 hover:underline" onClick={() => toggleStatus(g)}>
                  {g.status === 'presenteado' ? 'marcar como desejado' : 'marcar como presenteado'}
                </button>
                <button className="ml-auto p-2.5 -m-1 rounded-full text-ink-500 hover:bg-ink-900/5 dark:hover:bg-linen/10" onClick={() => openEdit(g)}><Pencil size={14} /></button>
                <button className="p-2.5 -m-1 rounded-full text-clay-600 hover:bg-clay-500/10" onClick={() => remove(g)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar item' : 'Novo item'}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Nome</label>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea className="input" rows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Link externo</label>
              <input className="input" value={form.link || ''} onChange={(e) => setForm({ ...form, link: e.target.value })} />
            </div>
            <div>
              <label className="label">Valor (R$)</label>
              <input type="number" step="0.01" className="input" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="desejado">Desejado</option>
              <option value="presenteado">Presenteado</option>
            </select>
          </div>
          {form.status === 'presenteado' && (
            <div>
              <label className="label">Presenteado por</label>
              <input className="input" value={form.gifted_by || ''} onChange={(e) => setForm({ ...form, gifted_by: e.target.value })} />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
