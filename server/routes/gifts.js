import { Router } from 'express'
import { randomUUID } from 'crypto'
import { dbGet, dbAll, dbRun } from '../db.js'

const router = Router()

router.get('/', async (req, res) => {
  res.json(await dbAll('SELECT * FROM gifts ORDER BY created_at DESC'))
})

router.post('/', async (req, res) => {
  const g = req.body
  const id = randomUUID()
  await dbRun(
    `INSERT INTO gifts (id, name, description, link, value, status, gifted_by) VALUES (@id, @name, @description, @link, @value, @status, @gifted_by)`,
    {
      id,
      name: g.name,
      description: g.description || null,
      link: g.link || null,
      value: g.value ?? null,
      status: g.status || 'desejado',
      gifted_by: g.gifted_by || null,
    }
  )
  res.status(201).json(await dbGet('SELECT * FROM gifts WHERE id = ?', [id]))
})

router.put('/:id', async (req, res) => {
  const existing = await dbGet('SELECT * FROM gifts WHERE id = ?', [req.params.id])
  if (!existing) return res.status(404).json({ error: 'Presente não encontrado' })
  const g = { ...existing, ...req.body, id: req.params.id }
  await dbRun(
    `UPDATE gifts SET name=@name, description=@description, link=@link, value=@value, status=@status, gifted_by=@gifted_by WHERE id=@id`,
    g
  )
  res.json(await dbGet('SELECT * FROM gifts WHERE id = ?', [req.params.id]))
})

router.delete('/:id', async (req, res) => {
  await dbRun('DELETE FROM gifts WHERE id = ?', [req.params.id])
  res.status(204).end()
})

export default router
