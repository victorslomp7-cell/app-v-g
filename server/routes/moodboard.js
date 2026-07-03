import { Router } from 'express'
import { randomUUID } from 'crypto'
import { dbGet, dbAll, dbRun } from '../db.js'
import { upload, persistUpload, removeUpload } from '../upload.js'

const router = Router()

router.get('/', async (req, res) => {
  res.json(await dbAll('SELECT * FROM moodboard_items ORDER BY created_at DESC'))
})

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Imagem obrigatória' })
  const url = await persistUpload(req.file)
  const id = randomUUID()
  await dbRun('INSERT INTO moodboard_items (id, category, filename, original_name, caption) VALUES (?, ?, ?, ?, ?)', [
    id,
    req.body.category || 'geral',
    url,
    req.file.originalname,
    req.body.caption || null,
  ])
  res.status(201).json(await dbGet('SELECT * FROM moodboard_items WHERE id = ?', [id]))
})

router.put('/:id', async (req, res) => {
  const existing = await dbGet('SELECT * FROM moodboard_items WHERE id = ?', [req.params.id])
  if (!existing) return res.status(404).json({ error: 'Item não encontrado' })
  const m = { ...existing, ...req.body, id: req.params.id }
  await dbRun('UPDATE moodboard_items SET category=@category, caption=@caption WHERE id=@id', m)
  res.json(await dbGet('SELECT * FROM moodboard_items WHERE id = ?', [req.params.id]))
})

router.delete('/:id', async (req, res) => {
  const item = await dbGet('SELECT * FROM moodboard_items WHERE id = ?', [req.params.id])
  if (item) await removeUpload(item.filename)
  await dbRun('DELETE FROM moodboard_items WHERE id = ?', [req.params.id])
  res.status(204).end()
})

export default router
