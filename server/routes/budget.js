import { Router } from 'express'
import { randomUUID } from 'crypto'
import { dbGet, dbAll, dbRun } from '../db.js'

const categories = Router()
const expenses = Router()

categories.get('/', async (req, res) => {
  res.json(await dbAll('SELECT * FROM budget_categories ORDER BY position'))
})

categories.post('/', async (req, res) => {
  const c = req.body
  const id = randomUUID()
  const maxPos = (await dbGet('SELECT COALESCE(MAX(position), -1) as m FROM budget_categories')).m
  await dbRun('INSERT INTO budget_categories (id, name, planned_amount, position) VALUES (?, ?, ?, ?)', [
    id,
    c.name,
    c.planned_amount || 0,
    maxPos + 1,
  ])
  res.status(201).json(await dbGet('SELECT * FROM budget_categories WHERE id = ?', [id]))
})

categories.put('/:id', async (req, res) => {
  const existing = await dbGet('SELECT * FROM budget_categories WHERE id = ?', [req.params.id])
  if (!existing) return res.status(404).json({ error: 'Categoria não encontrada' })
  const c = { ...existing, ...req.body, id: req.params.id }
  await dbRun('UPDATE budget_categories SET name=@name, planned_amount=@planned_amount, position=@position WHERE id=@id', c)
  res.json(await dbGet('SELECT * FROM budget_categories WHERE id = ?', [req.params.id]))
})

categories.delete('/:id', async (req, res) => {
  await dbRun('DELETE FROM budget_categories WHERE id = ?', [req.params.id])
  res.status(204).end()
})

expenses.get('/', async (req, res) => {
  res.json(await dbAll('SELECT * FROM expenses ORDER BY date DESC'))
})

expenses.post('/', async (req, res) => {
  const e = req.body
  const id = randomUUID()
  await dbRun(
    `INSERT INTO expenses (id, category_id, description, amount, status, date, vendor_id)
     VALUES (@id, @category_id, @description, @amount, @status, @date, @vendor_id)`,
    {
      id,
      category_id: e.category_id || null,
      description: e.description,
      amount: e.amount || 0,
      status: e.status || 'pendente',
      date: e.date || null,
      vendor_id: e.vendor_id || null,
    }
  )
  res.status(201).json(await dbGet('SELECT * FROM expenses WHERE id = ?', [id]))
})

expenses.put('/:id', async (req, res) => {
  const existing = await dbGet('SELECT * FROM expenses WHERE id = ?', [req.params.id])
  if (!existing) return res.status(404).json({ error: 'Gasto não encontrado' })
  const e = { ...existing, ...req.body, id: req.params.id }
  await dbRun(
    `UPDATE expenses SET category_id=@category_id, description=@description, amount=@amount,
     status=@status, date=@date, vendor_id=@vendor_id WHERE id=@id`,
    e
  )
  res.json(await dbGet('SELECT * FROM expenses WHERE id = ?', [req.params.id]))
})

expenses.delete('/:id', async (req, res) => {
  await dbRun('DELETE FROM expenses WHERE id = ?', [req.params.id])
  res.status(204).end()
})

export default { categories, expenses }
