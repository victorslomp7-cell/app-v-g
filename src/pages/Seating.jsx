import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, LayoutGrid, Users } from 'lucide-react'
import { api } from '../lib/api.js'
import { PageHeader, EmptyState } from '../components/ui.jsx'
import Modal from '../components/Modal.jsx'

const emptyTable = { name: '', capacity: 8 }

export default function Seating() {
  const [tables, setTables] = useState([])
  const [guests, setGuests] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyTable)
  const [dragGuest, setDragGuest] = useState(null)

  const load = () => {
    api.seatingTables.list().then(setTables)
    api.guests.list().then((all) => setGuests(all.filter((g) => g.status === 'confirmado')))
  }
  useEffect(() => { load() }, [])

  const unassigned = useMemo(() => guests.filter((g) => !g.table_id), [guests])

  const occupied = (table) => {
    const seated = guests.filter((g) => g.table_id === table.id)
    return seated.reduce((s, g) => s + 1 + (g.has_companion ? 1 : 0), 0)
  }

  const openNew = () => { setEditing(null); setForm(emptyTable); setModalOpen(true) }
  const openEdit = (t) => { setEditing(t); setForm({ name: t.name, capacity: t.capacity }); setModalOpen(true) }

  const save = async (e) => {
    e.preventDefault()
    if (editing) await api.seatingTables.update(editing.id, form)
    else await api.seatingTables.create(form)
    setModalOpen(false)
    load()
  }

  const remove = async (t) => {
    if (!confirm(`Remover a mesa "${t.name}"? Os convidados voltarão para a lista sem mesa.`)) return
    await api.seatingTables.remove(t.id)
    load()
  }

  const assign = async (guestId, tableId) => {
    setGuests((prev) => prev.map((g) => (g.id === guestId ? { ...g, table_id: tableId } : g)))
    await api.guests.update(guestId, { table_id: tableId })
    load()
  }

  return (
    <div>
      <PageHeader
        eyebrow="Layout do salão"
        title="Mesas"
        description="Arraste os convidados confirmados para organizar a disposição das mesas."
        actions={<button className="btn-primary" onClick={openNew}><Plus size={15} /> Mesa</button>}
      />

      {guests.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum convidado confirmado ainda" description="Assim que houver confirmações de presença, eles aparecerão aqui para organizar nas mesas." />
      ) : (
        <div className="grid lg:grid-cols-[260px,1fr] gap-6">
          <div
            className="card p-4 h-fit lg:sticky lg:top-6"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => dragGuest && assign(dragGuest, null)}
          >
            <h3 className="font-display text-base text-ink-900 dark:text-linen mb-3 flex items-center gap-1.5">
              <Users size={16} /> Sem mesa ({unassigned.length})
            </h3>
            <div className="space-y-1.5 min-h-[3rem]">
              {unassigned.map((g) => (
                <div
                  key={g.id}
                  draggable
                  onDragStart={() => setDragGuest(g.id)}
                  className="rounded-lg bg-sage-700/10 px-3 py-2 text-sm text-ink-800 dark:text-linen cursor-grab"
                >
                  {g.name}
                  {g.has_companion && <span className="text-xs text-ink-400"> + {g.companion_name || 'acompanhante'}</span>}
                </div>
              ))}
              {unassigned.length === 0 && <p className="text-xs text-ink-400">Todos os convidados já têm mesa.</p>}
            </div>
          </div>

          {tables.length === 0 ? (
            <EmptyState icon={LayoutGrid} title="Nenhuma mesa criada" description="Crie mesas para começar a organizar os convidados." />
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 content-start">
              {tables.map((t) => {
                const seated = guests.filter((g) => g.table_id === t.id)
                const count = occupied(t)
                const over = count > t.capacity
                return (
                  <div
                    key={t.id}
                    className="card p-4"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => dragGuest && assign(dragGuest, t.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-display text-lg text-ink-900 dark:text-linen">{t.name}</p>
                        <p className={`text-xs ${over ? 'text-clay-600 font-medium' : 'text-ink-400'}`}>{count} / {t.capacity} lugares</p>
                      </div>
                      <div className="flex gap-0.5">
                        <button className="p-1.5 rounded-full text-ink-500 hover:bg-ink-900/5 dark:hover:bg-linen/10" onClick={() => openEdit(t)}><Pencil size={13} /></button>
                        <button className="p-1.5 rounded-full text-clay-600 hover:bg-clay-500/10" onClick={() => remove(t)}><Trash2 size={13} /></button>
                      </div>
                    </div>
                    <div className="space-y-1.5 min-h-[2.5rem]">
                      {seated.map((g) => (
                        <div
                          key={g.id}
                          draggable
                          onDragStart={() => setDragGuest(g.id)}
                          className="rounded-lg bg-ink-900/5 dark:bg-linen/10 px-3 py-1.5 text-sm text-ink-700 dark:text-linen cursor-grab"
                        >
                          {g.name}
                          {g.has_companion && <span className="text-xs text-ink-400"> + {g.companion_name || 'acompanhante'}</span>}
                        </div>
                      ))}
                      {seated.length === 0 && <p className="text-xs text-ink-400 italic">Arraste convidados aqui</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar mesa' : 'Nova mesa'}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Nome da mesa</label>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Capacidade</label>
            <input required type="number" min="1" className="input" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
