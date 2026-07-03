import { Router } from 'express'
import { randomUUID } from 'crypto'
import { db } from '../db.js'

const router = Router()

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM guests ORDER BY name COLLATE NOCASE').all())
})

router.get('/stats', (req, res) => {
  const rows = db.prepare('SELECT status, has_companion, COUNT(*) as c FROM guests GROUP BY status, has_companion').all()
  const stats = { total: 0, confirmado: 0, pendente: 0, recusado: 0 }
  rows.forEach((r) => {
    const count = r.c * (r.has_companion ? 2 : 1)
    stats.total += count
    stats[r.status] = (stats[r.status] || 0) + count
  })
  res.json(stats)
})

router.post('/', (req, res) => {
  const g = req.body
  const id = randomUUID()
  db.prepare(
    `INSERT INTO guests (id, name, side, status, has_companion, companion_name, dietary_restriction, table_id, phone, notes)
     VALUES (@id, @name, @side, @status, @has_companion, @companion_name, @dietary_restriction, @table_id, @phone, @notes)`
  ).run({
    id,
    name: g.name,
    side: g.side || 'ambos',
    status: g.status || 'pendente',
    has_companion: g.has_companion ? 1 : 0,
    companion_name: g.companion_name || null,
    dietary_restriction: g.dietary_restriction || null,
    table_id: g.table_id || null,
    phone: g.phone || null,
    notes: g.notes || null,
  })
  res.status(201).json(db.prepare('SELECT * FROM guests WHERE id = ?').get(id))
})

router.post('/import', (req, res) => {
  const { guests } = req.body
  if (!Array.isArray(guests)) return res.status(400).json({ error: 'guests deve ser uma lista' })
  const insert = db.prepare(
    `INSERT INTO guests (id, name, side, status, has_companion, companion_name, dietary_restriction, phone, notes)
     VALUES (@id, @name, @side, @status, @has_companion, @companion_name, @dietary_restriction, @phone, @notes)`
  )
  const tx = db.transaction((rows) => {
    rows.forEach((g) => {
      if (!g.name) return
      insert.run({
        id: randomUUID(),
        name: g.name,
        side: g.side || 'ambos',
        status: g.status || 'pendente',
        has_companion: g.has_companion ? 1 : 0,
        companion_name: g.companion_name || null,
        dietary_restriction: g.dietary_restriction || null,
        phone: g.phone || null,
        notes: g.notes || null,
      })
    })
  })
  tx(guests)
  res.status(201).json({ imported: guests.length })
})

router.put('/:id', (req, res) => {
  const g = req.body
  const existing = db.prepare('SELECT * FROM guests WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Convidado não encontrado' })
  db.prepare(
    `UPDATE guests SET name=@name, side=@side, status=@status, has_companion=@has_companion,
     companion_name=@companion_name, dietary_restriction=@dietary_restriction, table_id=@table_id,
     phone=@phone, notes=@notes, updated_at=datetime('now') WHERE id=@id`
  ).run({
    id: req.params.id,
    name: g.name ?? existing.name,
    side: g.side ?? existing.side,
    status: g.status ?? existing.status,
    has_companion: g.has_companion !== undefined ? (g.has_companion ? 1 : 0) : existing.has_companion,
    companion_name: g.companion_name !== undefined ? g.companion_name : existing.companion_name,
    dietary_restriction: g.dietary_restriction !== undefined ? g.dietary_restriction : existing.dietary_restriction,
    table_id: g.table_id !== undefined ? g.table_id : existing.table_id,
    phone: g.phone !== undefined ? g.phone : existing.phone,
    notes: g.notes !== undefined ? g.notes : existing.notes,
  })
  res.json(db.prepare('SELECT * FROM guests WHERE id = ?').get(req.params.id))
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM guests WHERE id = ?').run(req.params.id)
  res.status(204).end()
})

export default router
