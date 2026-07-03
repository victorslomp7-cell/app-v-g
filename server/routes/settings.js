import { Router } from 'express'
import { dbAll, dbBatch } from '../db.js'
import { upload, persistUpload } from '../upload.js'

const router = Router()

async function getAllSettings() {
  const rows = await dbAll('SELECT key, value FROM settings')
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}

router.get('/', async (req, res) => {
  res.json(await getAllSettings())
})

router.put('/', async (req, res) => {
  await dbBatch(
    Object.entries(req.body).map(([k, v]) => ({
      sql: 'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      args: [k, String(v ?? '')],
    }))
  )
  res.json(await getAllSettings())
})

router.post('/photo', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Imagem obrigatória' })
  const key = req.body.key
  const allowed = ['cover_photo', 'hero_photo_1', 'hero_photo_2']
  if (!allowed.includes(key)) return res.status(400).json({ error: 'key inválida' })
  const url = await persistUpload(req.file)
  await dbBatch([
    {
      sql: 'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      args: [key, url],
    },
  ])
  res.json(await getAllSettings())
})

export default router
