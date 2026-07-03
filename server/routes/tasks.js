import { Router } from 'express'
import { randomUUID } from 'crypto'
import { db } from '../db.js'

const router = Router()

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM tasks ORDER BY phase, position').all())
})

router.post('/', (req, res) => {
  const t = req.body
  const id = randomUUID()
  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as m FROM tasks WHERE phase = ?').get(t.phase || '12m').m
  db.prepare(
    `INSERT INTO tasks (id, title, category, phase, due_date, completed, position, notes)
     VALUES (@id, @title, @category, @phase, @due_date, @completed, @position, @notes)`
  ).run({
    id,
    title: t.title,
    category: t.category || null,
    phase: t.phase || '12m',
    due_date: t.due_date || null,
    completed: t.completed ? 1 : 0,
    position: maxPos + 1,
    notes: t.notes || null,
  })
  res.status(201).json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(id))
})

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Tarefa não encontrada' })
  const t = { ...existing, ...req.body, id: req.params.id }
  db.prepare(
    `UPDATE tasks SET title=@title, category=@category, phase=@phase, due_date=@due_date,
     completed=@completed, position=@position, notes=@notes WHERE id=@id`
  ).run({ ...t, completed: t.completed ? 1 : 0 })
  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id))
})

router.post('/reorder', (req, res) => {
  const { items } = req.body // [{id, phase, position}]
  const update = db.prepare('UPDATE tasks SET phase = ?, position = ? WHERE id = ?')
  const tx = db.transaction((rows) => rows.forEach((r) => update.run(r.phase, r.position, r.id)))
  tx(items)
  res.json({ ok: true })
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id)
  res.status(204).end()
})

export default router
