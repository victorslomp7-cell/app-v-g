import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

function getSetting(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key)
  return row ? row.value : null
}

function requireToken(kind) {
  return (req, res, next) => {
    const expected = getSetting(kind === 'rsvp' ? 'rsvp_token' : 'share_token')
    if (!expected || req.params.token !== expected) {
      return res.status(404).json({ error: 'Link inválido ou expirado' })
    }
    next()
  }
}

// --- RSVP público ---
router.get('/rsvp/:token', requireToken('rsvp'), (req, res) => {
  res.json({
    couple_name_1: getSetting('couple_name_1'),
    couple_name_2: getSetting('couple_name_2'),
    wedding_date: getSetting('wedding_date'),
    cover_photo: getSetting('cover_photo'),
  })
})

router.get('/rsvp/:token/search', requireToken('rsvp'), (req, res) => {
  const q = (req.query.q || '').toString().trim().toLowerCase()
  if (q.length < 2) return res.json([])
  const rows = db
    .prepare('SELECT id, name, status, has_companion, companion_name, dietary_restriction FROM guests WHERE lower(name) LIKE ?')
    .all(`%${q}%`)
  res.json(rows.slice(0, 15))
})

router.post('/rsvp/:token/:guestId', requireToken('rsvp'), (req, res) => {
  const existing = db.prepare('SELECT * FROM guests WHERE id = ?').get(req.params.guestId)
  if (!existing) return res.status(404).json({ error: 'Convidado não encontrado' })
  const b = req.body
  db.prepare(
    `UPDATE guests SET status=@status, has_companion=@has_companion, companion_name=@companion_name,
     dietary_restriction=@dietary_restriction, updated_at=datetime('now') WHERE id=@id`
  ).run({
    id: req.params.guestId,
    status: b.status || 'confirmado',
    has_companion: b.has_companion ? 1 : 0,
    companion_name: b.companion_name || null,
    dietary_restriction: b.dietary_restriction || null,
  })
  res.json(db.prepare('SELECT * FROM guests WHERE id = ?').get(req.params.guestId))
})

// --- Compartilhamento somente-leitura (cronograma do dia) ---
router.get('/share/:token', requireToken('share'), (req, res) => {
  res.json({
    couple_name_1: getSetting('couple_name_1'),
    couple_name_2: getSetting('couple_name_2'),
    wedding_date: getSetting('wedding_date'),
    cover_photo: getSetting('cover_photo'),
    timeline: db.prepare('SELECT * FROM timeline_events ORDER BY position').all(),
  })
})

export default router
