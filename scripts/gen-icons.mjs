// Minimal zero-dependency PNG generator for the app icon (two interlocking rings).
import { deflateSync } from 'zlib'
import { writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0 // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idat = deflateSync(raw, { level: 9 })

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

function hex(c) {
  return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]
}

function drawIcon(size, { padded = false } = {}) {
  const bg = hex('#425737') // sage-700
  const ring = hex('#f6f1e9') // linen
  const accent = hex('#b9862a') // ochre-500

  const px = new Uint8Array(size * size * 4)
  const set = (x, y, [r, g, b], a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 4
    px[i] = r
    px[i + 1] = g
    px[i + 2] = b
    px[i + 3] = a
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) set(x, y, bg, 255)
  }

  const cx = size / 2
  const cy = size / 2 + size * 0.02
  const r = size * (padded ? 0.19 : 0.23)
  const thickness = size * 0.045
  const offset = size * (padded ? 0.11 : 0.135)

  const drawRing = (ox, oy, color) => {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - (cx + ox)
        const dy = y - (cy + oy)
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d >= r - thickness && d <= r) {
          const existing = px[(y * size + x) * 4]
          set(x, y, color)
        }
      }
    }
  }

  drawRing(-offset, offset * 0.3, ring)
  drawRing(offset, offset * 0.3, accent)

  return Buffer.from(px)
}

const targets = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 512, name: 'icon-maskable-512.png', padded: true },
  { size: 180, name: 'apple-touch-icon.png' },
]

for (const t of targets) {
  const png = encodePNG(t.size, t.size, drawIcon(t.size, { padded: t.padded }))
  writeFileSync(join(outDir, t.name), png)
  console.log('wrote', t.name)
}
