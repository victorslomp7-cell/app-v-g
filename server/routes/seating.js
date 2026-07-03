import { Router } from 'express'
import { randomUUID } from 'crypto'
import { db } from '../db.js'

const router = Router()

router.get('/', (req, res) => {
  const tables = db.prepare('SELECT * FROM seating_tables ORDER BY name COLLATE NOCASE').all()
  const guests = db.prepare("SELECT id, name, table_id, has_companion, companion_name FROM guests WHERE status = 'confirmado'").all()
  res.json(tables.map((t) => ({ ...t, guests: guests.filter((g) => g.table_id === t.id) })))
})

router.post('/', (req, res) => {
  const t = req.body
  const id = randomUUID()
  db.prepare('INSERT INTO seating_tables (id, name, capacity, pos_x, pos_y) VALUES (?, ?, ?, ?, ?)').run(
    id,
    t.name,
    t.capacity || 8,
    t.pos_x || 0,
    t.pos_y || 0
  )
  res.status(201).json(db.prepare('SELECT * FROM seating_tables WHERE id = ?').get(id))
})

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM seating_tables WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Mesa não encontrada' })
  const t = { ...existing, ...req.body, id: req.params.id }
  db.prepare('UPDATE seating_tables SET name=@name, capacity=@capacity, pos_x=@pos_x, pos_y=@pos_y WHERE id=@id').run(t)
  res.json(db.prepare('SELECT * FROM seating_tables WHERE id = ?').get(req.params.id))
})

router.delete('/:id', (req, res) => {
  db.prepare('UPDATE guests SET table_id = NULL WHERE table_id = ?').run(req.params.id)
  db.prepare('DELETE FROM seating_tables WHERE id = ?').run(req.params.id)
  res.status(204).end()
})

export default router
