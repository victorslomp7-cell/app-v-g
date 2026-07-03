import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { db } from './db.js'

import settingsRoutes from './routes/settings.js'
import guestsRoutes from './routes/guests.js'
import tasksRoutes from './routes/tasks.js'
import vendorsRoutes from './routes/vendors.js'
import budgetRoutes from './routes/budget.js'
import timelineRoutes from './routes/timeline.js'
import seatingRoutes from './routes/seating.js'
import giftsRoutes from './routes/gifts.js'
import moodboardRoutes from './routes/moodboard.js'
import documentsRoutes from './routes/documents.js'
import publicRoutes from './routes/public.js'
import backupRoutes from './routes/backup.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

app.use(cors())
app.use(express.json({ limit: '15mb' }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api/settings', settingsRoutes)
app.use('/api/guests', guestsRoutes)
app.use('/api/tasks', tasksRoutes)
app.use('/api/vendors', vendorsRoutes)
app.use('/api/budget-categories', budgetRoutes.categories)
app.use('/api/expenses', budgetRoutes.expenses)
app.use('/api/timeline', timelineRoutes)
app.use('/api/seating-tables', seatingRoutes)
app.use('/api/gifts', giftsRoutes)
app.use('/api/moodboard', moodboardRoutes)
app.use('/api/documents', documentsRoutes)
app.use('/api/public', publicRoutes)
app.use('/api/backup', backupRoutes)

app.get('/api/health', (req, res) => res.json({ ok: true }))

if (process.env.NODE_ENV === 'production') {
  const distDir = path.join(__dirname, '..', 'dist')
  app.use(express.static(distDir))
  app.get('*', (req, res) => res.sendFile(path.join(distDir, 'index.html')))
}

const PORT = process.env.PORT || 4321
app.listen(PORT, () => {
  console.log(`V&G API rodando em http://localhost:${PORT}`)
})

process.on('SIGINT', () => {
  db.close()
  process.exit(0)
})
