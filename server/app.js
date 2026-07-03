import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { ensureReady } from './db.js'
import { authGate, isAuthEnabled, verifySessionCookie, createSessionCookie, parseCookies, COOKIE_NAME, SESSION_COOKIE_OPTIONS } from './auth.js'

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

// Local disk fallback for uploads (no-op path when Vercel Blob is configured).
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Auth routes never touch the database, so they're registered before the
// ensureReady() gate below — a slow/failed DB connection should never be
// able to make the login screen itself unreachable.
app.post('/api/auth/login', (req, res) => {
  if (!isAuthEnabled()) return res.json({ ok: true })
  if (req.body.password !== process.env.APP_PASSWORD) {
    return res.status(401).json({ error: 'Senha incorreta' })
  }
  res.cookie(COOKIE_NAME, createSessionCookie(), SESSION_COOKIE_OPTIONS)
  res.json({ ok: true })
})

app.get('/api/auth/status', (req, res) => {
  if (!isAuthEnabled()) return res.json({ authRequired: false, authenticated: true })
  const cookies = parseCookies(req.headers.cookie)
  res.json({ authRequired: true, authenticated: verifySessionCookie(cookies[COOKIE_NAME]) })
})

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' })
  res.json({ ok: true })
})

app.use('/api', authGate)

// Make sure schema + seed data exist before handling any other request
// (cheap no-op after the first call).
app.use(async (req, res, next) => {
  try {
    await ensureReady()
    next()
  } catch (err) {
    console.error('Falha ao preparar o banco de dados', err)
    res.status(500).json({ error: 'Erro ao conectar ao banco de dados' })
  }
})

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

// Standalone self-hosted mode only (e.g. Tailscale setup) — on Vercel, static
// files are served by the platform itself per vercel.json, not by this app.
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  const distDir = path.join(__dirname, '..', 'dist')
  app.use(express.static(distDir))
  app.get('*', (req, res) => res.sendFile(path.join(distDir, 'index.html')))
}

export default app
