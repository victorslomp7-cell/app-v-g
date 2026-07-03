import { createClient } from '@libsql/client'
import { readFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { seedIfEmpty } from './seed.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Uses a real Turso database when TURSO_DATABASE_URL/TURSO_AUTH_TOKEN are set
// (deployed on Vercel); otherwise falls back to a local SQLite file so
// `npm run dev` works offline with zero cloud accounts.
const remoteUrl = process.env.TURSO_DATABASE_URL
let url = remoteUrl
let authToken = process.env.TURSO_AUTH_TOKEN

console.log(
  `[V&G db] VERCEL=${process.env.VERCEL ?? '(unset)'} TURSO_DATABASE_URL=${remoteUrl ? 'set (' + remoteUrl.slice(0, 15) + '…)' : 'MISSING'} TURSO_AUTH_TOKEN=${authToken ? 'set' : 'MISSING'}`
)

if (!remoteUrl) {
  // On Vercel the project folder is read-only — only /tmp is writable, and it
  // doesn't survive cold starts. This keeps the app usable (with a throwaway,
  // non-persistent database) instead of crashing outright while the real
  // TURSO_DATABASE_URL variable gets sorted out.
  const dataDir = process.env.VERCEL ? '/tmp' : join(__dirname, 'data')
  mkdirSync(dataDir, { recursive: true })
  url = `file:${join(dataDir, 'vg.db')}`
  authToken = undefined
  if (process.env.VERCEL) {
    console.error(
      '[V&G db] TURSO_DATABASE_URL não está definida nesta implantação — usando um banco temporário em /tmp que NÃO guarda dados entre execuções. Confira Settings > Environment Variables na Vercel.'
    )
  }
}

export const client = createClient({ url, authToken })

function toPlain(row) {
  return row ? { ...row } : row
}

export async function dbGet(sql, args) {
  const res = await client.execute({ sql, args: args ?? [] })
  return toPlain(res.rows[0])
}

export async function dbAll(sql, args) {
  const res = await client.execute({ sql, args: args ?? [] })
  return res.rows.map(toPlain)
}

export async function dbRun(sql, args) {
  return client.execute({ sql, args: args ?? [] })
}

export async function dbBatch(statements) {
  return client.batch(
    statements.map((s) => ({ sql: s.sql, args: s.args ?? [] })),
    'write'
  )
}

let ready = null

export function ensureReady() {
  if (!ready) {
    ready = (async () => {
      const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8')
      const statements = schema
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean)
      for (const sql of statements) {
        await client.execute(sql)
      }
      await seedIfEmpty({ dbGet, dbAll, dbRun, dbBatch })
    })().catch((err) => {
      // Don't let one failed attempt (e.g. a transient connection hiccup on
      // cold start) permanently poison this warm function instance — let the
      // next request try again instead of 500-ing forever.
      ready = null
      throw err
    })
  }
  return ready
}
