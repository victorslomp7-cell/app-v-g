import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, GripVertical, ListChecks } from 'lucide-react'
import { api } from '../lib/api.js'
import { PageHeader, EmptyState, ProgressBar } from '../components/ui.jsx'
import Modal from '../components/Modal.jsx'
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

export default function Checklist() {
  const [tasks, setTasks] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyTask)
  const [dragId, setDragId] = useState(null)
  const [activePhase, setActivePhase] = useState(PHASES[0].key)

  const load = () => api.tasks.list().then(setTasks)
  useEffect(() => {
    load()
  }, [])

  const grouped = useMemo(() => {
    const map = Object.fromEntries(PHASES.map((p) => [p.key, []]))
    tasks.forEach((t) => map[t.phase]?.push(t))
    Object.values(map).forEach((list) => list.sort((a, b) => a.position - b.position))
    return map
  }, [tasks])

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

  const onDrop = async (phaseKey, targetTask) => {
    if (!dragId) return
    const list = grouped[phaseKey].filter((t) => t.id !== dragId)
    const dragged = tasks.find((t) => t.id === dragId)
    if (!dragged) return
    const targetIndex = targetTask ? list.findIndex((t) => t.id === targetTask.id) : list.length
    list.splice(targetIndex === -1 ? list.length : targetIndex, 0, { ...dragged, phase: phaseKey })
    const items = list.map((t, i) => ({ id: t.id, phase: phaseKey, position: i }))
    setDragId(null)
    setTasks((prev) => {
      const others = prev.filter((t) => !items.some((i) => i.id === t.id))
      return [...others, ...items.map((i) => ({ ...prev.find((t) => t.id === i.id), ...i }))]
    })
    await api.tasks.reorder(items)
    load()
  }

  return (
    <div>
      <PageHeader
        eyebrow="Cronograma de preparação"
        title="Checklist"
        description="Organizado por prazo, do planejamento inicial ao grande dia."
        actions={
          <button className="btn-primary" onClick={() => openNew(activePhase)}>
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
        <div className="space-y-8">
          {PHASES.map((phase) => (
            <section key={phase.key} onFocus={() => setActivePhase(phase.key)}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-lg text-ink-900 dark:text-linen">{phase.label}</h2>
                <button className="text-xs text-sage-700 dark:text-sage-300 hover:underline" onClick={() => openNew(phase.key)}>
                  + adicionar
                </button>
              </div>
              <div
                className="card divide-y divide-ink-900/5 dark:divide-linen/10 min-h-[3rem]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(phase.key, null)}
              >
                {grouped[phase.key].length === 0 && (
                  <p className="px-5 py-4 text-sm text-ink-400">Nenhuma tarefa nesta fase.</p>
                )}
                {grouped[phase.key].map((t) => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={() => setDragId(t.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.stopPropagation()
                      onDrop(phase.key, t)
                    }}
                    className="flex items-center gap-3 px-4 py-3 group"
                  >
                    <GripVertical size={15} className="text-ink-300 cursor-grab shrink-0" />
                    <input
                      type="checkbox"
                      checked={!!t.completed}
                      onChange={() => toggle(t)}
                      className="h-4 w-4 rounded accent-sage-700 shrink-0"
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
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button className="p-1.5 rounded-full text-ink-500 hover:bg-ink-900/5 dark:hover:bg-linen/10" onClick={() => openEdit(t)}>
                        <Pencil size={14} />
                      </button>
                      <button className="p-1.5 rounded-full text-clay-600 hover:bg-clay-500/10" onClick={() => remove(t)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
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
