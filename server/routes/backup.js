import { Router } from 'express'
import { randomUUID } from 'crypto'
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { dbAll, dbRun } from '../db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const localDbPath = join(__dirname, '..', 'data', 'vg.db')
const usingRemoteDb = !!process.env.TURSO_DATABASE_URL

const router = Router()

router.get('/download', (req, res) => {
  if (usingRemoteDb || !existsSync(localDbPath)) {
    return res
      .status(400)
      .json({ error: 'O app está rodando com um banco de dados na nuvem — use "Exportar tudo (.json)" para fazer backup.' })
  }
  res.download(localDbPath, `vg-casamento-backup-${new Date().toISOString().slice(0, 10)}.db`)
})

router.get('/export.json', async (req, res) => {
  const tables = [
    'settings',
    'guests',
    'tasks',
    'vendors',
    'vendor_payments',
    'vendor_attachments',
    'budget_categories',
    'expenses',
    'timeline_events',
    'seating_tables',
    'gifts',
    'moodboard_items',
    'documents',
  ]
  const data = {}
  for (const t of tables) {
    data[t] = await dbAll(`SELECT * FROM ${t}`)
  }
  res.setHeader('Content-Disposition', `attachment; filename="vg-export-${new Date().toISOString().slice(0, 10)}.json"`)
  res.json(data)
})

router.post('/regenerate-token', async (req, res) => {
  const { kind } = req.body // 'rsvp' | 'share'
  if (!['rsvp', 'share'].includes(kind)) return res.status(400).json({ error: 'kind inválido' })
  const token = randomUUID()
  await dbRun('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [
    `${kind}_token`,
    token,
  ])
  res.json({ token })
})

export default router
