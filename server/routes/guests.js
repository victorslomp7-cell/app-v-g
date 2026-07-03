import { Router } from 'express'
import { randomUUID } from 'crypto'
import { dbGet, dbAll, dbRun, dbBatch } from '../db.js'

const router = Router()

router.get('/', async (req, res) => {
  res.json(await dbAll('SELECT * FROM guests ORDER BY name COLLATE NOCASE'))
})

router.get('/stats', async (req, res) => {
  const rows = await dbAll('SELECT status, has_companion, COUNT(*) as c FROM guests GROUP BY status, has_companion')
  const stats = { total: 0, confirmado: 0, pendente: 0, recusado: 0 }
  rows.forEach((r) => {
    const count = r.c * (r.has_companion ? 2 : 1)
    stats.total += count
    stats[r.status] = (stats[r.status] || 0) + count
  })
  res.json(stats)
})

router.post('/', async (req, res) => {
  const g = req.body
  const id = randomUUID()
  await dbRun(
    `INSERT INTO guests (id, name, side, status, has_companion, companion_name, dietary_restriction, table_id, phone, notes)
     VALUES (@id, @name, @side, @status, @has_companion, @companion_name, @dietary_restriction, @table_id, @phone, @notes)`,
    {
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
    }
  )
  res.status(201).json(await dbGet('SELECT * FROM guests WHERE id = ?', [id]))
})

router.post('/import', async (req, res) => {
  const { guests } = req.body
  if (!Array.isArray(guests)) return res.status(400).json({ error: 'guests deve ser uma lista' })
  const valid = guests.filter((g) => g.name)
  await dbBatch(
    valid.map((g) => ({
      sql: `INSERT INTO guests (id, name, side, status, has_companion, companion_name, dietary_restriction, phone, notes)
            VALUES (@id, @name, @side, @status, @has_companion, @companion_name, @dietary_restriction, @phone, @notes)`,
      args: {
        id: randomUUID(),
        name: g.name,
        side: g.side || 'ambos',
        status: g.status || 'pendente',
        has_companion: g.has_companion ? 1 : 0,
        companion_name: g.companion_name || null,
        dietary_restriction: g.dietary_restriction || null,
        phone: g.phone || null,
        notes: g.notes || null,
      },
    }))
  )
  res.status(201).json({ imported: valid.length })
})

router.put('/:id', async (req, res) => {
  const g = req.body
  const existing = await dbGet('SELECT * FROM guests WHERE id = ?', [req.params.id])
  if (!existing) return res.status(404).json({ error: 'Convidado não encontrado' })
  await dbRun(
    `UPDATE guests SET name=@name, side=@side, status=@status, has_companion=@has_companion,
     companion_name=@companion_name, dietary_restriction=@dietary_restriction, table_id=@table_id,
     phone=@phone, notes=@notes, updated_at=datetime('now') WHERE id=@id`,
    {
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
    }
  )
  res.json(await dbGet('SELECT * FROM guests WHERE id = ?', [req.params.id]))
})

router.delete('/:id', async (req, res) => {
  await dbRun('DELETE FROM guests WHERE id = ?', [req.params.id])
  res.status(204).end()
})

export default router
