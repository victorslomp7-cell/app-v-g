import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'
import { mkdirSync, existsSync, unlinkSync } from 'fs'
import { put, del } from '@vercel/blob'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// On Vercel the project folder is read-only — only /tmp is writable (and it
// doesn't survive cold starts), so fall back there instead of crashing if
// BLOB_READ_WRITE_TOKEN is ever missing on a deployment.
const uploadsDir = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, 'uploads')

// When BLOB_READ_WRITE_TOKEN is set (deployed on Vercel) files go to Vercel Blob
// storage and we keep files only in memory during the request. Otherwise
// (local `npm run dev`, no cloud account needed) they're written to disk.
export const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN

if (process.env.VERCEL && !useBlob) {
  console.error(
    '[V&G upload] BLOB_READ_WRITE_TOKEN não está definida nesta implantação — arquivos enviados vão para /tmp e NÃO persistem entre execuções. Confira Settings > Environment Variables na Vercel.'
  )
}

const storage = useBlob
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        mkdirSync(uploadsDir, { recursive: true })
        cb(null, uploadsDir)
      },
      filename: (req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname)}`),
    })

export const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } })

// Call after multer has parsed req.file — returns the URL/path to store in the DB.
export async function persistUpload(file) {
  if (useBlob) {
    const ext = path.extname(file.originalname)
    const blob = await put(`uploads/${randomUUID()}${ext}`, file.buffer, {
      access: 'public',
      contentType: file.mimetype,
      addRandomSuffix: false,
    })
    return blob.url
  }
  return `/uploads/${file.filename}`
}

// Accepts either a full Vercel Blob URL or a local "/uploads/xxx" path.
export async function removeUpload(urlOrPath) {
  if (!urlOrPath) return
  if (urlOrPath.startsWith('http')) {
    await del(urlOrPath).catch(() => {})
    return
  }
  const p = path.join(uploadsDir, path.basename(urlOrPath))
  if (existsSync(p)) unlinkSync(p)
}
