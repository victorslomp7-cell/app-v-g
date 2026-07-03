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
  res.json(db.prepare('SELECT * FROM documents ORDER BY uploaded_at DESC').all())
})

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Arquivo obrigatório' })
  const id = randomUUID()
  db.prepare(
    'INSERT INTO documents (id, category, filename, original_name, mime, notes) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, req.body.category || 'geral', req.file.filename, req.file.originalname, req.file.mimetype, req.body.notes || null)
  res.status(201).json(db.prepare('SELECT * FROM documents WHERE id = ?').get(id))
})

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Documento não encontrado' })
  const d = { ...existing, ...req.body, id: req.params.id }
  db.prepare('UPDATE documents SET category=@category, notes=@notes WHERE id=@id').run(d)
  res.json(db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id))
})

router.delete('/:id', (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id)
  if (doc) {
    const p = path.join(__dirname, '..', 'uploads', doc.filename)
    if (existsSync(p)) unlinkSync(p)
  }
  db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id)
  res.status(204).end()
})

export default router
