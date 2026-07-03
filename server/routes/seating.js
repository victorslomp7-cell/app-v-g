import { Router } from 'express'
import { randomUUID } from 'crypto'
import { dbGet, dbAll, dbRun } from '../db.js'

const router = Router()

router.get('/', async (req, res) => {
  const [tables, guests] = await Promise.all([
    dbAll('SELECT * FROM seating_tables ORDER BY name COLLATE NOCASE'),
    dbAll("SELECT id, name, table_id, has_companion, companion_name FROM guests WHERE status = 'confirmado'"),
  ])
  res.json(tables.map((t) => ({ ...t, guests: guests.filter((g) => g.table_id === t.id) })))
})

router.post('/', async (req, res) => {
  const t = req.body
  const id = randomUUID()
  await dbRun('INSERT INTO seating_tables (id, name, capacity, pos_x, pos_y) VALUES (?, ?, ?, ?, ?)', [
    id,
    t.name,
    t.capacity || 8,
    t.pos_x || 0,
    t.pos_y || 0,
  ])
  res.status(201).json(await dbGet('SELECT * FROM seating_tables WHERE id = ?', [id]))
})

router.put('/:id', async (req, res) => {
  const existing = await dbGet('SELECT * FROM seating_tables WHERE id = ?', [req.params.id])
  if (!existing) return res.status(404).json({ error: 'Mesa não encontrada' })
  const t = { ...existing, ...req.body, id: req.params.id }
  await dbRun('UPDATE seating_tables SET name=@name, capacity=@capacity, pos_x=@pos_x, pos_y=@pos_y WHERE id=@id', t)
  res.json(await dbGet('SELECT * FROM seating_tables WHERE id = ?', [req.params.id]))
})

router.delete('/:id', async (req, res) => {
  await dbRun('UPDATE guests SET table_id = NULL WHERE table_id = ?', [req.params.id])
  await dbRun('DELETE FROM seating_tables WHERE id = ?', [req.params.id])
  res.status(204).end()
})

export default router
