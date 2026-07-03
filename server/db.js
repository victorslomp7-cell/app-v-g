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

if (!remoteUrl) {
  const dataDir = join(__dirname, 'data')
  mkdirSync(dataDir, { recursive: true })
  url = `file:${join(dataDir, 'vg.db')}`
  authToken = undefined
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
    })()
  }
  return ready
}
