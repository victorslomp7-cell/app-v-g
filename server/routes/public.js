import { Router } from 'express'
import { dbGet, dbAll, dbRun } from '../db.js'

const router = Router()

async function getSetting(key) {
  const row = await dbGet('SELECT value FROM settings WHERE key = ?', [key])
  return row ? row.value : null
}

function requireToken(kind) {
  return async (req, res, next) => {
    const expected = await getSetting(kind === 'rsvp' ? 'rsvp_token' : 'share_token')
    if (!expected || req.params.token !== expected) {
      return res.status(404).json({ error: 'Link inválido ou expirado' })
    }
    next()
  }
}

// --- RSVP público ---
router.get('/rsvp/:token', requireToken('rsvp'), async (req, res) => {
  res.json({
    couple_name_1: await getSetting('couple_name_1'),
    couple_name_2: await getSetting('couple_name_2'),
    wedding_date: await getSetting('wedding_date'),
    cover_photo: await getSetting('cover_photo'),
  })
})

router.get('/rsvp/:token/search', requireToken('rsvp'), async (req, res) => {
  const q = (req.query.q || '').toString().trim().toLowerCase()
  if (q.length < 2) return res.json([])
  const rows = await dbAll(
    'SELECT id, name, status, has_companion, companion_name, dietary_restriction FROM guests WHERE lower(name) LIKE ?',
    [`%${q}%`]
  )
  res.json(rows.slice(0, 15))
})

router.post('/rsvp/:token/:guestId', requireToken('rsvp'), async (req, res) => {
  const existing = await dbGet('SELECT * FROM guests WHERE id = ?', [req.params.guestId])
  if (!existing) return res.status(404).json({ error: 'Convidado não encontrado' })
  const b = req.body
  await dbRun(
    `UPDATE guests SET status=@status, has_companion=@has_companion, companion_name=@companion_name,
     dietary_restriction=@dietary_restriction, updated_at=datetime('now') WHERE id=@id`,
    {
      id: req.params.guestId,
      status: b.status || 'confirmado',
      has_companion: b.has_companion ? 1 : 0,
      companion_name: b.companion_name || null,
      dietary_restriction: b.dietary_restriction || null,
    }
  )
  res.json(await dbGet('SELECT * FROM guests WHERE id = ?', [req.params.guestId]))
})

// --- Compartilhamento somente-leitura (cronograma do dia) ---
router.get('/share/:token', requireToken('share'), async (req, res) => {
  res.json({
    couple_name_1: await getSetting('couple_name_1'),
    couple_name_2: await getSetting('couple_name_2'),
    wedding_date: await getSetting('wedding_date'),
    cover_photo: await getSetting('cover_photo'),
    timeline: await dbAll('SELECT * FROM timeline_events ORDER BY position'),
  })
})

export default router
