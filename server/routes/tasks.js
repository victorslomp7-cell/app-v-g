import { Router } from 'express'
import { randomUUID } from 'crypto'
import { dbGet, dbAll, dbRun, dbBatch } from '../db.js'

const router = Router()

router.get('/', async (req, res) => {
  res.json(await dbAll('SELECT * FROM tasks ORDER BY phase, position'))
})

router.post('/', async (req, res) => {
  const t = req.body
  const id = randomUUID()
  const maxPos = (await dbGet('SELECT COALESCE(MAX(position), -1) as m FROM tasks WHERE phase = ?', [t.phase || '12m'])).m
  await dbRun(
    `INSERT INTO tasks (id, title, category, phase, due_date, completed, position, notes)
     VALUES (@id, @title, @category, @phase, @due_date, @completed, @position, @notes)`,
    {
      id,
      title: t.title,
      category: t.category || null,
      phase: t.phase || '12m',
      due_date: t.due_date || null,
      completed: t.completed ? 1 : 0,
      position: maxPos + 1,
      notes: t.notes || null,
    }
  )
  res.status(201).json(await dbGet('SELECT * FROM tasks WHERE id = ?', [id]))
})

router.put('/:id', async (req, res) => {
  const existing = await dbGet('SELECT * FROM tasks WHERE id = ?', [req.params.id])
  if (!existing) return res.status(404).json({ error: 'Tarefa não encontrada' })
  const t = { ...existing, ...req.body, id: req.params.id }
  await dbRun(
    `UPDATE tasks SET title=@title, category=@category, phase=@phase, due_date=@due_date,
     completed=@completed, position=@position, notes=@notes WHERE id=@id`,
    { ...t, completed: t.completed ? 1 : 0 }
  )
  res.json(await dbGet('SELECT * FROM tasks WHERE id = ?', [req.params.id]))
})

router.post('/reorder', async (req, res) => {
  const { items } = req.body // [{id, phase, position}]
  await dbBatch(
    items.map((r) => ({ sql: 'UPDATE tasks SET phase = ?, position = ? WHERE id = ?', args: [r.phase, r.position, r.id] }))
  )
  res.json({ ok: true })
})

router.delete('/:id', async (req, res) => {
  await dbRun('DELETE FROM tasks WHERE id = ?', [req.params.id])
  res.status(204).end()
})

export default router
