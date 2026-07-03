import { Router } from 'express'
import { randomUUID } from 'crypto'
import { db } from '../db.js'

const router = Router()

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM timeline_events ORDER BY position').all())
})

router.post('/', (req, res) => {
  const e = req.body
  const id = randomUUID()
  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as m FROM timeline_events').get().m
  db.prepare('INSERT INTO timeline_events (id, time, title, description, position) VALUES (?, ?, ?, ?, ?)').run(
    id,
    e.time,
    e.title,
    e.description || null,
    maxPos + 1
  )
  res.status(201).json(db.prepare('SELECT * FROM timeline_events WHERE id = ?').get(id))
})

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM timeline_events WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Evento não encontrado' })
  const e = { ...existing, ...req.body, id: req.params.id }
  db.prepare('UPDATE timeline_events SET time=@time, title=@title, description=@description, position=@position WHERE id=@id').run(e)
  res.json(db.prepare('SELECT * FROM timeline_events WHERE id = ?').get(req.params.id))
})

router.post('/reorder', (req, res) => {
  const { items } = req.body
  const update = db.prepare('UPDATE timeline_events SET position = ? WHERE id = ?')
  const tx = db.transaction((rows) => rows.forEach((r) => update.run(r.position, r.id)))
  tx(items)
  res.json({ ok: true })
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM timeline_events WHERE id = ?').run(req.params.id)
  res.status(204).end()
})

export default router
