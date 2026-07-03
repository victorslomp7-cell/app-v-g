import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, LayoutGrid, Users, GripVertical } from 'lucide-react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core'
import { api } from '../lib/api.js'
import { PageHeader, EmptyState } from '../components/ui.jsx'
import Modal from '../components/Modal.jsx'

const emptyTable = { name: '', capacity: 8 }
const POOL_ID = 'pool'

function GuestChip({ guest, tone = 'sage' }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: guest.id })
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined
  const tones = {
    sage: 'bg-sage-700/10 text-ink-800 dark:text-linen',
    ink: 'bg-ink-900/5 dark:bg-linen/10 text-ink-700 dark:text-linen',
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`touch-none flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm cursor-grab active:cursor-grabbing ${tones[tone]} ${isDragging ? 'opacity-30' : ''}`}
    >
      <GripVertical size={13} className="text-ink-300 shrink-0" />
      <span className="min-w-0 truncate">
        {guest.name}
        {guest.has_companion && <span className="text-xs text-ink-400"> + {guest.companion_name || 'acompanhante'}</span>}
      </span>
    </div>
  )
}

function DropZone({ id, className = '', children }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div ref={setNodeRef} className={`${className} ${isOver ? 'ring-2 ring-sage-500 ring-inset' : ''}`}>
      {children}
    </div>
  )
}

export default function Seating() {
  const [tables, setTables] = useState([])
  const [guests, setGuests] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyTable)
  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  )

  const load = () => {
    api.seatingTables.list().then(setTables)
    api.guests.list().then((all) => setGuests(all.filter((g) => g.status === 'confirmado')))
  }
  useEffect(() => { load() }, [])

  const unassigned = useMemo(() => guests.filter((g) => !g.table_id), [guests])
  const activeGuest = activeId ? guests.find((g) => g.id === activeId) : null

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

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return
    const tableId = over.id === POOL_ID ? null : over.id
    assign(active.id, tableId)
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={(e) => setActiveId(e.active.id)}
          onDragEnd={handleDragEnd}
        >
          <div className="grid lg:grid-cols-[260px,1fr] gap-6">
            <DropZone id={POOL_ID} className="card p-4 h-fit lg:sticky lg:top-6">
              <h3 className="font-display text-base text-ink-900 dark:text-linen mb-3 flex items-center gap-1.5">
                <Users size={16} /> Sem mesa ({unassigned.length})
              </h3>
              <div className="space-y-1.5 min-h-[3rem]">
                {unassigned.map((g) => (
                  <GuestChip key={g.id} guest={g} tone="sage" />
                ))}
                {unassigned.length === 0 && <p className="text-xs text-ink-400">Todos os convidados já têm mesa.</p>}
              </div>
            </DropZone>

            {tables.length === 0 ? (
              <EmptyState icon={LayoutGrid} title="Nenhuma mesa criada" description="Crie mesas para começar a organizar os convidados." />
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 content-start">
                {tables.map((t) => {
                  const seated = guests.filter((g) => g.table_id === t.id)
                  const count = occupied(t)
                  const over = count > t.capacity
                  return (
                    <DropZone key={t.id} id={t.id} className="card p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-display text-lg text-ink-900 dark:text-linen">{t.name}</p>
                          <p className={`text-xs ${over ? 'text-clay-600 font-medium' : 'text-ink-400'}`}>{count} / {t.capacity} lugares</p>
                        </div>
                        <div className="flex gap-0.5">
                          <button className="p-2 -m-1 rounded-full text-ink-500 hover:bg-ink-900/5 dark:hover:bg-linen/10" onClick={() => openEdit(t)}><Pencil size={13} /></button>
                          <button className="p-2 -m-1 rounded-full text-clay-600 hover:bg-clay-500/10" onClick={() => remove(t)}><Trash2 size={13} /></button>
                        </div>
                      </div>
                      <div className="space-y-1.5 min-h-[2.5rem]">
                        {seated.map((g) => (
                          <GuestChip key={g.id} guest={g} tone="ink" />
                        ))}
                        {seated.length === 0 && <p className="text-xs text-ink-400 italic">Arraste convidados aqui</p>}
                      </div>
                    </DropZone>
                  )
                })}
              </div>
            )}
          </div>
          <DragOverlay>
            {activeGuest && (
              <div className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm bg-sage-700 text-linen shadow-xl">
                <GripVertical size={13} />
                {activeGuest.name}
              </div>
            )}
          </DragOverlay>
        </DndContext>
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
