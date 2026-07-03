import { Router } from 'express'
import { randomUUID } from 'crypto'
import { dbGet, dbAll, dbRun } from '../db.js'
import { upload, persistUpload, removeUpload } from '../upload.js'

const router = Router()

router.get('/', async (req, res) => {
  res.json(await dbAll('SELECT * FROM documents ORDER BY uploaded_at DESC'))
})

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Arquivo obrigatório' })
  const url = await persistUpload(req.file)
  const id = randomUUID()
  await dbRun('INSERT INTO documents (id, category, filename, original_name, mime, notes) VALUES (?, ?, ?, ?, ?, ?)', [
    id,
    req.body.category || 'geral',
    url,
    req.file.originalname,
    req.file.mimetype,
    req.body.notes || null,
  ])
  res.status(201).json(await dbGet('SELECT * FROM documents WHERE id = ?', [id]))
})

router.put('/:id', async (req, res) => {
  const existing = await dbGet('SELECT * FROM documents WHERE id = ?', [req.params.id])
  if (!existing) return res.status(404).json({ error: 'Documento não encontrado' })
  const d = { ...existing, ...req.body, id: req.params.id }
  await dbRun('UPDATE documents SET category=@category, notes=@notes WHERE id=@id', d)
  res.json(await dbGet('SELECT * FROM documents WHERE id = ?', [req.params.id]))
})

router.delete('/:id', async (req, res) => {
  const doc = await dbGet('SELECT * FROM documents WHERE id = ?', [req.params.id])
  if (doc) await removeUpload(doc.filename)
  await dbRun('DELETE FROM documents WHERE id = ?', [req.params.id])
  res.status(204).end()
})

export default router
