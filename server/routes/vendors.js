import { Router } from 'express'
import { randomUUID } from 'crypto'
import { dbGet, dbAll, dbRun } from '../db.js'
import { upload, persistUpload, removeUpload } from '../upload.js'

const router = Router()

router.get('/', async (req, res) => {
  const [vendors, payments, attachments] = await Promise.all([
    dbAll('SELECT * FROM vendors ORDER BY name COLLATE NOCASE'),
    dbAll('SELECT * FROM vendor_payments'),
    dbAll('SELECT * FROM vendor_attachments'),
  ])
  res.json(
    vendors.map((v) => ({
      ...v,
      payments: payments.filter((p) => p.vendor_id === v.id),
      attachments: attachments.filter((a) => a.vendor_id === v.id),
    }))
  )
})

router.post('/', async (req, res) => {
  const v = req.body
  const id = randomUUID()
  await dbRun(
    `INSERT INTO vendors (id, name, category, phone, email, instagram, status, agreed_value, notes)
     VALUES (@id, @name, @category, @phone, @email, @instagram, @status, @agreed_value, @notes)`,
    {
      id,
      name: v.name,
      category: v.category || null,
      phone: v.phone || null,
      email: v.email || null,
      instagram: v.instagram || null,
      status: v.status || 'a_contatar',
      agreed_value: v.agreed_value ?? null,
      notes: v.notes || null,
    }
  )
  res.status(201).json(await dbGet('SELECT * FROM vendors WHERE id = ?', [id]))
})

router.put('/:id', async (req, res) => {
  const existing = await dbGet('SELECT * FROM vendors WHERE id = ?', [req.params.id])
  if (!existing) return res.status(404).json({ error: 'Fornecedor não encontrado' })
  const v = { ...existing, ...req.body, id: req.params.id }
  await dbRun(
    `UPDATE vendors SET name=@name, category=@category, phone=@phone, email=@email, instagram=@instagram,
     status=@status, agreed_value=@agreed_value, notes=@notes WHERE id=@id`,
    v
  )
  res.json(await dbGet('SELECT * FROM vendors WHERE id = ?', [req.params.id]))
})

router.delete('/:id', async (req, res) => {
  const atts = await dbAll('SELECT * FROM vendor_attachments WHERE vendor_id = ?', [req.params.id])
  await Promise.all(atts.map((a) => removeUpload(a.filename)))
  await dbRun('DELETE FROM vendors WHERE id = ?', [req.params.id])
  res.status(204).end()
})

// Payments
router.post('/:id/payments', async (req, res) => {
  const p = req.body
  const id = randomUUID()
  await dbRun(
    `INSERT INTO vendor_payments (id, vendor_id, description, amount, due_date, paid, paid_date)
     VALUES (@id, @vendor_id, @description, @amount, @due_date, @paid, @paid_date)`,
    {
      id,
      vendor_id: req.params.id,
      description: p.description || null,
      amount: p.amount || 0,
      due_date: p.due_date || null,
      paid: p.paid ? 1 : 0,
      paid_date: p.paid_date || null,
    }
  )
  res.status(201).json(await dbGet('SELECT * FROM vendor_payments WHERE id = ?', [id]))
})

router.put('/:id/payments/:paymentId', async (req, res) => {
  const existing = await dbGet('SELECT * FROM vendor_payments WHERE id = ?', [req.params.paymentId])
  if (!existing) return res.status(404).json({ error: 'Parcela não encontrada' })
  const p = { ...existing, ...req.body, id: req.params.paymentId }
  await dbRun(
    `UPDATE vendor_payments SET description=@description, amount=@amount, due_date=@due_date,
     paid=@paid, paid_date=@paid_date WHERE id=@id`,
    { ...p, paid: p.paid ? 1 : 0 }
  )
  res.json(await dbGet('SELECT * FROM vendor_payments WHERE id = ?', [req.params.paymentId]))
})

router.delete('/:id/payments/:paymentId', async (req, res) => {
  await dbRun('DELETE FROM vendor_payments WHERE id = ?', [req.params.paymentId])
  res.status(204).end()
})

// Attachments
router.post('/:id/attachments', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Arquivo obrigatório' })
  const url = await persistUpload(req.file)
  const id = randomUUID()
  await dbRun(
    `INSERT INTO vendor_attachments (id, vendor_id, filename, original_name, mime) VALUES (?, ?, ?, ?, ?)`,
    [id, req.params.id, url, req.file.originalname, req.file.mimetype]
  )
  res.status(201).json(await dbGet('SELECT * FROM vendor_attachments WHERE id = ?', [id]))
})

router.delete('/:id/attachments/:attachmentId', async (req, res) => {
  const att = await dbGet('SELECT * FROM vendor_attachments WHERE id = ?', [req.params.attachmentId])
  if (att) await removeUpload(att.filename)
  await dbRun('DELETE FROM vendor_attachments WHERE id = ?', [req.params.attachmentId])
  res.status(204).end()
})

export default router
