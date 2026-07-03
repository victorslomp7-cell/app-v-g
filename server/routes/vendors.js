import { Router } from 'express'
import { randomUUID } from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'
import { unlinkSync, existsSync } from 'fs'
import { db } from '../db.js'
import { upload } from '../upload.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const router = Router()

router.get('/', (req, res) => {
  const vendors = db.prepare('SELECT * FROM vendors ORDER BY name COLLATE NOCASE').all()
  const payments = db.prepare('SELECT * FROM vendor_payments').all()
  const attachments = db.prepare('SELECT * FROM vendor_attachments').all()
  res.json(
    vendors.map((v) => ({
      ...v,
      payments: payments.filter((p) => p.vendor_id === v.id),
      attachments: attachments.filter((a) => a.vendor_id === v.id),
    }))
  )
})

router.post('/', (req, res) => {
  const v = req.body
  const id = randomUUID()
  db.prepare(
    `INSERT INTO vendors (id, name, category, phone, email, instagram, status, agreed_value, notes)
     VALUES (@id, @name, @category, @phone, @email, @instagram, @status, @agreed_value, @notes)`
  ).run({
    id,
    name: v.name,
    category: v.category || null,
    phone: v.phone || null,
    email: v.email || null,
    instagram: v.instagram || null,
    status: v.status || 'a_contatar',
    agreed_value: v.agreed_value ?? null,
    notes: v.notes || null,
  })
  res.status(201).json(db.prepare('SELECT * FROM vendors WHERE id = ?').get(id))
})

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Fornecedor não encontrado' })
  const v = { ...existing, ...req.body, id: req.params.id }
  db.prepare(
    `UPDATE vendors SET name=@name, category=@category, phone=@phone, email=@email, instagram=@instagram,
     status=@status, agreed_value=@agreed_value, notes=@notes WHERE id=@id`
  ).run(v)
  res.json(db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id))
})

router.delete('/:id', (req, res) => {
  const atts = db.prepare('SELECT * FROM vendor_attachments WHERE vendor_id = ?').all(req.params.id)
  atts.forEach((a) => {
    const p = path.join(__dirname, '..', 'uploads', a.filename)
    if (existsSync(p)) unlinkSync(p)
  })
  db.prepare('DELETE FROM vendors WHERE id = ?').run(req.params.id)
  res.status(204).end()
})

// Payments
router.post('/:id/payments', (req, res) => {
  const p = req.body
  const id = randomUUID()
  db.prepare(
    `INSERT INTO vendor_payments (id, vendor_id, description, amount, due_date, paid, paid_date)
     VALUES (@id, @vendor_id, @description, @amount, @due_date, @paid, @paid_date)`
  ).run({
    id,
    vendor_id: req.params.id,
    description: p.description || null,
    amount: p.amount || 0,
    due_date: p.due_date || null,
    paid: p.paid ? 1 : 0,
    paid_date: p.paid_date || null,
  })
  res.status(201).json(db.prepare('SELECT * FROM vendor_payments WHERE id = ?').get(id))
})

router.put('/:id/payments/:paymentId', (req, res) => {
  const existing = db.prepare('SELECT * FROM vendor_payments WHERE id = ?').get(req.params.paymentId)
  if (!existing) return res.status(404).json({ error: 'Parcela não encontrada' })
  const p = { ...existing, ...req.body, id: req.params.paymentId }
  db.prepare(
    `UPDATE vendor_payments SET description=@description, amount=@amount, due_date=@due_date,
     paid=@paid, paid_date=@paid_date WHERE id=@id`
  ).run({ ...p, paid: p.paid ? 1 : 0 })
  res.json(db.prepare('SELECT * FROM vendor_payments WHERE id = ?').get(req.params.paymentId))
})

router.delete('/:id/payments/:paymentId', (req, res) => {
  db.prepare('DELETE FROM vendor_payments WHERE id = ?').run(req.params.paymentId)
  res.status(204).end()
})

// Attachments
router.post('/:id/attachments', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Arquivo obrigatório' })
  const id = randomUUID()
  db.prepare(
    `INSERT INTO vendor_attachments (id, vendor_id, filename, original_name, mime) VALUES (?, ?, ?, ?, ?)`
  ).run(id, req.params.id, req.file.filename, req.file.originalname, req.file.mimetype)
  res.status(201).json(db.prepare('SELECT * FROM vendor_attachments WHERE id = ?').get(id))
})

router.delete('/:id/attachments/:attachmentId', (req, res) => {
  const att = db.prepare('SELECT * FROM vendor_attachments WHERE id = ?').get(req.params.attachmentId)
  if (att) {
    const p = path.join(__dirname, '..', 'uploads', att.filename)
    if (existsSync(p)) unlinkSync(p)
  }
  db.prepare('DELETE FROM vendor_attachments WHERE id = ?').run(req.params.attachmentId)
  res.status(204).end()
})

export default router
