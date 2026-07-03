import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, ListChecks } from 'lucide-react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { api } from '../lib/api.js'
import { PageHeader, EmptyState, ProgressBar } from '../components/ui.jsx'
import Modal from '../components/Modal.jsx'
import SortableRow from '../components/dnd/SortableRow.jsx'
import DragHandle from '../components/dnd/DragHandle.jsx'
import { formatDate, isOverdue } from '../lib/format.js'

const PHASES = [
  { key: '12m', label: '12+ meses antes' },
  { key: '6m', label: '6 meses antes' },
  { key: '3m', label: '3 meses antes' },
  { key: '1m', label: '1 mês antes' },
  { key: '1w', label: '1 semana antes' },
  { key: 'dia', label: 'Dia do casamento' },
]

const emptyTask = { title: '', category: '', phase: '12m', due_date: '', notes: '' }

function findContainer(id, tasks) {
  if (typeof id === 'string' && id.startsWith('phase:')) return id.slice(6)
  return tasks.find((t) => t.id === id)?.phase
}

function TaskRow({ t, handleProps, onToggle, onEdit, onRemove }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 group">
      <DragHandle handleProps={handleProps} />
      <input
        type="checkbox"
        checked={!!t.completed}
        onChange={() => onToggle(t)}
        className="h-5 w-5 rounded accent-sage-700 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${t.completed ? 'line-through text-ink-400' : 'text-ink-800 dark:text-linen'}`}>
          {t.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {t.category && <span className="text-xs text-ink-400">{t.category}</span>}
          {t.due_date && (
            <span className={`text-xs ${isOverdue(t.due_date, t.completed) ? 'text-clay-600 font-medium' : 'text-ink-400'}`}>
              {isOverdue(t.due_date, t.completed) ? 'Atrasada · ' : ''}
              {formatDate(t.due_date)}
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-0.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shrink-0">
        <button className="p-2 -m-0.5 rounded-full text-ink-500 hover:bg-ink-900/5 dark:hover:bg-linen/10" onClick={() => onEdit(t)}>
          <Pencil size={14} />
        </button>
        <button className="p-2 -m-0.5 rounded-full text-clay-600 hover:bg-clay-500/10" onClick={() => onRemove(t)}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

function PhaseColumn({ phase, items, onNew, children }) {
  const { setNodeRef } = useDroppable({ id: `phase:${phase.key}` })
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg text-ink-900 dark:text-linen">{phase.label}</h2>
        <button className="text-xs text-sage-700 dark:text-sage-300 hover:underline p-1 -m-1" onClick={() => onNew(phase.key)}>
          + adicionar
        </button>
      </div>
      <div ref={setNodeRef} className="card divide-y divide-ink-900/5 dark:divide-linen/10 min-h-[3.5rem]">
        <SortableContext items={items.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {items.length === 0 && <p className="px-5 py-4 text-sm text-ink-400">Nenhuma tarefa nesta fase.</p>}
          {children}
        </SortableContext>
      </div>
    </section>
  )
}

export default function Checklist() {
  const [tasks, setTasks] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyTask)
  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const load = () => api.tasks.list().then(setTasks)
  useEffect(() => {
    load()
  }, [])

  const grouped = useMemo(() => {
    const map = Object.fromEntries(PHASES.map((p) => [p.key, []]))
    tasks.forEach((t) => map[t.phase]?.push(t))
    return map
  }, [tasks])

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null

  const overallProgress = useMemo(() => {
    if (!tasks.length) return 0
    return Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100)
  }, [tasks])

  const toggle = async (t) => {
    await api.tasks.update(t.id, { completed: !t.completed })
    load()
  }

  const openNew = (phase) => {
    setEditing(null)
    setForm({ ...emptyTask, phase })
    setModalOpen(true)
  }

  const openEdit = (t) => {
    setEditing(t)
    setForm({ ...t, due_date: t.due_date || '' })
    setModalOpen(true)
  }

  const save = async (e) => {
    e.preventDefault()
    if (editing) await api.tasks.update(editing.id, form)
    else await api.tasks.create(form)
    setModalOpen(false)
    load()
  }

  const remove = async (t) => {
    if (!confirm(`Excluir a tarefa "${t.title}"?`)) return
    await api.tasks.remove(t.id)
    load()
  }

  const handleDragStart = (event) => setActiveId(event.active.id)

  const handleDragOver = (event) => {
    const { active, over } = event
    if (!over) return
    const activeContainer = findContainer(active.id, tasks)
    const overContainer = findContainer(over.id, tasks)
    if (!activeContainer || !overContainer || activeContainer === overContainer) return

    setTasks((prev) => {
      const overItems = prev.filter((t) => t.phase === overContainer && t.id !== active.id)
      const overIndex = overItems.findIndex((t) => t.id === over.id)
      const insertAt = overIndex >= 0 ? overIndex : overItems.length
      const moved = { ...prev.find((t) => t.id === active.id), phase: overContainer }
      overItems.splice(insertAt, 0, moved)
      const rest = prev.filter((t) => t.phase !== overContainer && t.id !== active.id)
      return [...rest, ...overItems]
    })
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return
    const overContainer = findContainer(over.id, tasks)
    if (!overContainer) return

    setTasks((prev) => {
      const containerItems = prev.filter((t) => t.phase === overContainer)
      const activeIndex = containerItems.findIndex((t) => t.id === active.id)
      const overIndex = containerItems.findIndex((t) => t.id === over.id)
      let reordered = containerItems
      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        reordered = arrayMove(containerItems, activeIndex, overIndex)
      }
      const others = prev.filter((t) => t.phase !== overContainer)
      const items = reordered.map((t, i) => ({ id: t.id, phase: overContainer, position: i }))
      api.tasks.reorder(items).catch(load)
      return [...others, ...reordered]
    })
  }

  return (
    <div>
      <PageHeader
        eyebrow="Cronograma de preparação"
        title="Checklist"
        description="Organizado por prazo, do planejamento inicial ao grande dia."
        actions={
          <button className="btn-primary" onClick={() => openNew(PHASES[0].key)}>
            <Plus size={15} /> Tarefa
          </button>
        }
      />

      <div className="card p-4 mb-6 flex items-center gap-4">
        <div className="flex-1">
          <ProgressBar value={tasks.filter((t) => t.completed).length} max={tasks.length || 1} />
        </div>
        <span className="text-sm font-medium text-ink-600 dark:text-ink-200 shrink-0">{overallProgress}% concluído</span>
      </div>

      {tasks.length === 0 ? (
        <EmptyState icon={ListChecks} title="Nenhuma tarefa cadastrada" description="Adicione sua primeira tarefa para começar a organizar o casamento." />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-8">
            {PHASES.map((phase) => (
              <PhaseColumn key={phase.key} phase={phase} items={grouped[phase.key]} onNew={openNew}>
                {grouped[phase.key].map((t) => (
                  <SortableRow key={t.id} id={t.id}>
                    {({ handleProps }) => (
                      <TaskRow t={t} handleProps={handleProps} onToggle={toggle} onEdit={openEdit} onRemove={remove} />
                    )}
                  </SortableRow>
                ))}
              </PhaseColumn>
            ))}
          </div>
          <DragOverlay>
            {activeTask && (
              <div className="card px-4 py-3 shadow-xl text-sm font-medium text-ink-800 dark:text-linen">
                {activeTask.title}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar tarefa' : 'Nova tarefa'}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Título</label>
            <input required className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Fase</label>
              <select className="input" value={form.phase} onChange={(e) => setForm({ ...form, phase: e.target.value })}>
                {PHASES.map((p) => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Categoria</label>
              <input className="input" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Data-limite (opcional)</label>
            <input type="date" className="input" value={form.due_date || ''} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </div>
          <div>
            <label className="label">Notas</label>
            <textarea className="input" rows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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
