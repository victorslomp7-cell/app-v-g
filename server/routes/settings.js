import { Router } from 'express'
import { db } from '../db.js'
import { upload } from '../upload.js'

const router = Router()

function getAllSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all()
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}

router.get('/', (req, res) => {
  res.json(getAllSettings())
})

router.put('/', (req, res) => {
  const upsert = db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  )
  const tx = db.transaction((entries) => {
    entries.forEach(([k, v]) => upsert.run(k, String(v ?? '')))
  })
  tx(Object.entries(req.body))
  res.json(getAllSettings())
})

router.post('/photo', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Imagem obrigatória' })
  const key = req.body.key
  const allowed = ['cover_photo', 'hero_photo_1', 'hero_photo_2']
  if (!allowed.includes(key)) return res.status(400).json({ error: 'key inválida' })
  const url = `/uploads/${req.file.filename}`
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, url)
  res.json(getAllSettings())
})

export default router
