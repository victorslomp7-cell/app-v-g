import { Router } from 'express'
import { randomUUID } from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'
import { unlinkSync, existsSync } from 'fs'
import { db } from '../db.js'
import { upload } from '../upload.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const router = Router()

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM moodboard_items ORDER BY created_at DESC').all())
})

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Imagem obrigatória' })
  const id = randomUUID()
  db.prepare(
    'INSERT INTO moodboard_items (id, category, filename, original_name, caption) VALUES (?, ?, ?, ?, ?)'
  ).run(id, req.body.category || 'geral', req.file.filename, req.file.originalname, req.body.caption || null)
  res.status(201).json(db.prepare('SELECT * FROM moodboard_items WHERE id = ?').get(id))
})

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM moodboard_items WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Item não encontrado' })
  const m = { ...existing, ...req.body, id: req.params.id }
  db.prepare('UPDATE moodboard_items SET category=@category, caption=@caption WHERE id=@id').run(m)
  res.json(db.prepare('SELECT * FROM moodboard_items WHERE id = ?').get(req.params.id))
})

router.delete('/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM moodboard_items WHERE id = ?').get(req.params.id)
  if (item) {
    const p = path.join(__dirname, '..', 'uploads', item.filename)
    if (existsSync(p)) unlinkSync(p)
  }
  db.prepare('DELETE FROM moodboard_items WHERE id = ?').run(req.params.id)
  res.status(204).end()
})

export default router
