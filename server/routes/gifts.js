import { Router } from 'express'
import { randomUUID } from 'crypto'
import { db } from '../db.js'

const router = Router()

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM gifts ORDER BY created_at DESC').all())
})

router.post('/', (req, res) => {
  const g = req.body
  const id = randomUUID()
  db.prepare(
    `INSERT INTO gifts (id, name, description, link, value, status, gifted_by) VALUES (@id, @name, @description, @link, @value, @status, @gifted_by)`
  ).run({
    id,
    name: g.name,
    description: g.description || null,
    link: g.link || null,
    value: g.value ?? null,
    status: g.status || 'desejado',
    gifted_by: g.gifted_by || null,
  })
  res.status(201).json(db.prepare('SELECT * FROM gifts WHERE id = ?').get(id))
})

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM gifts WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Presente não encontrado' })
  const g = { ...existing, ...req.body, id: req.params.id }
  db.prepare(
    `UPDATE gifts SET name=@name, description=@description, link=@link, value=@value, status=@status, gifted_by=@gifted_by WHERE id=@id`
  ).run(g)
  res.json(db.prepare('SELECT * FROM gifts WHERE id = ?').get(req.params.id))
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM gifts WHERE id = ?').run(req.params.id)
  res.status(204).end()
})

export default router
