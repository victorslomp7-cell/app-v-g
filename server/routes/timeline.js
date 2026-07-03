import { Router } from 'express'
import { randomUUID } from 'crypto'
import { dbGet, dbAll, dbRun, dbBatch } from '../db.js'

const router = Router()

router.get('/', async (req, res) => {
  res.json(await dbAll('SELECT * FROM timeline_events ORDER BY position'))
})

router.post('/', async (req, res) => {
  const e = req.body
  const id = randomUUID()
  const maxPos = (await dbGet('SELECT COALESCE(MAX(position), -1) as m FROM timeline_events')).m
  await dbRun('INSERT INTO timeline_events (id, time, title, description, position) VALUES (?, ?, ?, ?, ?)', [
    id,
    e.time,
    e.title,
    e.description || null,
    maxPos + 1,
  ])
  res.status(201).json(await dbGet('SELECT * FROM timeline_events WHERE id = ?', [id]))
})

router.put('/:id', async (req, res) => {
  const existing = await dbGet('SELECT * FROM timeline_events WHERE id = ?', [req.params.id])
  if (!existing) return res.status(404).json({ error: 'Evento não encontrado' })
  const e = { ...existing, ...req.body, id: req.params.id }
  await dbRun('UPDATE timeline_events SET time=@time, title=@title, description=@description, position=@position WHERE id=@id', e)
  res.json(await dbGet('SELECT * FROM timeline_events WHERE id = ?', [req.params.id]))
})

router.post('/reorder', async (req, res) => {
  const { items } = req.body
  await dbBatch(items.map((r) => ({ sql: 'UPDATE timeline_events SET position = ? WHERE id = ?', args: [r.position, r.id] })))
  res.json({ ok: true })
})

router.delete('/:id', async (req, res) => {
  await dbRun('DELETE FROM timeline_events WHERE id = ?', [req.params.id])
  res.status(204).end()
})

export default router
