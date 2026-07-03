import { createHmac, timingSafeEqual } from 'crypto'

export const COOKIE_NAME = 'vg_session'
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

function sign(value, secret) {
  return createHmac('sha256', secret).update(value).digest('hex')
}

export function isAuthEnabled() {
  return !!process.env.APP_PASSWORD
}

export function createSessionCookie() {
  const expires = Date.now() + THIRTY_DAYS_MS
  const sig = sign(String(expires), process.env.APP_PASSWORD)
  return `${expires}.${sig}`
}

export function verifySessionCookie(value) {
  if (!value || !isAuthEnabled()) return false
  const [expires, sig] = value.split('.')
  if (!expires || !sig) return false
  const expected = sign(expires, process.env.APP_PASSWORD)
  const sigBuf = Buffer.from(sig)
  const expectedBuf = Buffer.from(expected)
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) return false
  return Number(expires) > Date.now()
}

export function parseCookies(header) {
  const out = {}
  if (!header) return out
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=')
    if (idx === -1) return
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim())
  })
  return out
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: !!process.env.VERCEL,
  maxAge: THIRTY_DAYS_MS,
  path: '/',
}

// Protects everything under /api except /api/public/* (guest RSVP + share links)
// and /api/auth/* (the login endpoint itself). No-op entirely when APP_PASSWORD isn't set.
export function authGate(req, res, next) {
  if (!isAuthEnabled()) return next()
  if (req.path.startsWith('/public') || req.path.startsWith('/auth')) return next()
  const cookies = parseCookies(req.headers.cookie)
  if (verifySessionCookie(cookies[COOKIE_NAME])) return next()
  res.status(401).json({ error: 'auth_required' })
}
