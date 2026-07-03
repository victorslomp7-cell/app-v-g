import { useEffect, useMemo, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { Plus, Pencil, Trash2, Wallet, Check } from 'lucide-react'
import { api } from '../lib/api.js'
import { useSettings } from '../lib/SettingsContext.jsx'
import { PageHeader, ProgressBar, EmptyState, Badge } from '../components/ui.jsx'
import Modal from '../components/Modal.jsx'
import { formatCurrency, formatDate } from '../lib/format.js'

const CHART_COLORS = ['#546f43', '#c85f36', '#b9862a', '#4d544c', '#87a672', '#e39d78', '#a5aba3', '#976b21']

const emptyCategory = { name: '', planned_amount: '' }
const emptyExpense = { description: '', category_id: '', amount: '', status: 'pendente', date: '' }

export default function Budget() {
  const { settings, update } = useSettings()
  const [categories, setCategories] = useState([])
  const [expenses, setExpenses] = useState([])
  const [totalInput, setTotalInput] = useState('')
  const [savingTotal, setSavingTotal] = useState(false)
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [editingCat, setEditingCat] = useState(null)
  const [catForm, setCatForm] = useState(emptyCategory)
  const [expModalOpen, setExpModalOpen] = useState(false)
  const [editingExp, setEditingExp] = useState(null)
  const [expForm, setExpForm] = useState(emptyExpense)

  const load = () => {
    api.budgetCategories.list().then(setCategories)
    api.expenses.list().then(setExpenses)
  }
  useEffect(() => { load() }, [])
  useEffect(() => { if (settings) setTotalInput(settings.budget_total || '0') }, [settings])

  const spentByCategory = useMemo(() => {
    const map = {}
    expenses.forEach((e) => {
      map[e.category_id] = (map[e.category_id] || 0) + e.amount
    })
    return map
  }, [expenses])

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0)
  const totalBudget = Number(settings?.budget_total) || 0

  const pieData = categories
    .map((c) => ({ name: c.name, value: spentByCategory[c.id] || 0 }))
    .filter((d) => d.value > 0)

  const comparisonData = categories.map((c) => ({
    name: c.name.length > 12 ? c.name.slice(0, 11) + '…' : c.name,
    Orçado: c.planned_amount,
    Gasto: spentByCategory[c.id] || 0,
  }))

  const saveTotal = async () => {
    setSavingTotal(true)
    try {
      await update({ budget_total: totalInput })
    } finally {
      setSavingTotal(false)
    }
  }

  const openNewCat = () => { setEditingCat(null); setCatForm(emptyCategory); setCatModalOpen(true) }
  const openEditCat = (c) => { setEditingCat(c); setCatForm({ ...c, planned_amount: c.planned_amount || '' }); setCatModalOpen(true) }
  const saveCat = async (e) => {
    e.preventDefault()
    const payload = { ...catForm, planned_amount: Number(catForm.planned_amount) || 0 }
    if (editingCat) await api.budgetCategories.update(editingCat.id, payload)
    else await api.budgetCategories.create(payload)
    setCatModalOpen(false)
    load()
  }
  const removeCat = async (c) => {
    if (!confirm(`Remover categoria "${c.name}"? Gastos vinculados ficarão sem categoria.`)) return
    await api.budgetCategories.remove(c.id)
    load()
  }

  const openNewExp = () => { setEditingExp(null); setExpForm(emptyExpense); setExpModalOpen(true) }
  const openEditExp = (e) => { setEditingExp(e); setExpForm({ ...e, amount: e.amount || '', category_id: e.category_id || '' }); setExpModalOpen(true) }
  const saveExp = async (e) => {
    e.preventDefault()
    const payload = { ...expForm, amount: Number(expForm.amount) || 0, category_id: expForm.category_id || null }
    if (editingExp) await api.expenses.update(editingExp.id, payload)
    else await api.expenses.create(payload)
    setExpModalOpen(false)
    load()
  }
  const removeExp = async (e) => {
    if (!confirm('Remover este gasto?')) return
    await api.expenses.remove(e.id)
    load()
  }
  const toggleExpPaid = async (e) => {
    await api.expenses.update(e.id, { status: e.status === 'pago' ? 'pendente' : 'pago' })
    load()
  }

  const categoryName = (id) => categories.find((c) => c.id === id)?.name || 'Sem categoria'

  return (
    <div>
      <PageHeader
        eyebrow="Controle financeiro"
        title="Orçamento"
        description="Acompanhe o orçamento planejado versus o que já foi gasto."
      />

      <div className="card p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
          <label className="text-sm font-medium text-ink-600 dark:text-ink-200 shrink-0">Orçamento total do casamento</label>
          <div className="flex gap-2 flex-1">
            <input type="number" step="0.01" className="input" value={totalInput} onChange={(e) => setTotalInput(e.target.value)} />
            <button className="btn-secondary shrink-0" onClick={saveTotal} disabled={savingTotal}>
              <Check size={15} /> Salvar
            </button>
          </div>
        </div>
        <ProgressBar
          value={totalSpent}
          max={totalBudget || 1}
          overLabel={`Orçamento estourado em ${formatCurrency(totalSpent - totalBudget)}`}
        />
        <div className="flex justify-between mt-2 text-xs text-ink-500 dark:text-ink-300">
          <span>Gasto: {formatCurrency(totalSpent)}</span>
          <span>Orçamento: {formatCurrency(totalBudget)}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="card p-5">
          <h3 className="font-display text-lg text-ink-900 dark:text-linen mb-3">Gastos por categoria</h3>
          {pieData.length === 0 ? (
            <p className="text-sm text-ink-400 py-10 text-center">Nenhum gasto lançado ainda.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card p-5">
          <h3 className="font-display text-lg text-ink-900 dark:text-linen mb-3">Orçado vs. gasto</h3>
          {comparisonData.length === 0 ? (
            <p className="text-sm text-ink-400 py-10 text-center">Cadastre categorias para comparar.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#c9cdc7" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Orçado" fill="#a6bd91" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Gasto" fill="#c85f36" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl text-ink-900 dark:text-linen">Categorias</h2>
          <button className="btn-secondary" onClick={openNewCat}><Plus size={15} /> Categoria</button>
        </div>
        <div className="card divide-y divide-ink-900/5 dark:divide-linen/10">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-5 py-3 text-sm">
              <span className="flex-1 font-medium text-ink-800 dark:text-linen">{c.name}</span>
              <span className="text-ink-500 dark:text-ink-300">{formatCurrency(spentByCategory[c.id] || 0)} / {formatCurrency(c.planned_amount)}</span>
              <button className="p-1.5 rounded-full text-ink-500 hover:bg-ink-900/5 dark:hover:bg-linen/10" onClick={() => openEditCat(c)}><Pencil size={14} /></button>
              <button className="p-1.5 rounded-full text-clay-600 hover:bg-clay-500/10" onClick={() => removeCat(c)}><Trash2 size={14} /></button>
            </div>
          ))}
          {categories.length === 0 && <p className="px-5 py-4 text-sm text-ink-400">Nenhuma categoria cadastrada.</p>}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl text-ink-900 dark:text-linen">Lançamentos</h2>
          <button className="btn-primary" onClick={openNewExp}><Plus size={15} /> Gasto</button>
        </div>
        {expenses.length === 0 ? (
          <EmptyState icon={Wallet} title="Nenhum gasto lançado" description="Registre pagamentos feitos ou previstos para acompanhar o orçamento." />
        ) : (
          <div className="card divide-y divide-ink-900/5 dark:divide-linen/10">
            {expenses.map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                <input type="checkbox" checked={e.status === 'pago'} onChange={() => toggleExpPaid(e)} className="h-4 w-4 accent-sage-700 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-800 dark:text-linen truncate">{e.description}</p>
                  <p className="text-xs text-ink-400">{categoryName(e.category_id)} {e.date ? `· ${formatDate(e.date)}` : ''}</p>
                </div>
                <Badge tone={e.status === 'pago' ? 'sage' : 'ochre'}>{e.status === 'pago' ? 'Pago' : 'Pendente'}</Badge>
                <span className="text-sm font-medium text-ink-700 dark:text-linen w-24 text-right shrink-0">{formatCurrency(e.amount)}</span>
                <button className="p-1.5 rounded-full text-ink-500 hover:bg-ink-900/5 dark:hover:bg-linen/10" onClick={() => openEditExp(e)}><Pencil size={14} /></button>
                <button className="p-1.5 rounded-full text-clay-600 hover:bg-clay-500/10" onClick={() => removeExp(e)}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </section>

      <Modal open={catModalOpen} onClose={() => setCatModalOpen(false)} title={editingCat ? 'Editar categoria' : 'Nova categoria'}>
        <form onSubmit={saveCat} className="space-y-4">
          <div>
            <label className="label">Nome</label>
            <input required className="input" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Valor planejado (R$)</label>
            <input type="number" step="0.01" className="input" value={catForm.planned_amount} onChange={(e) => setCatForm({ ...catForm, planned_amount: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setCatModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>

      <Modal open={expModalOpen} onClose={() => setExpModalOpen(false)} title={editingExp ? 'Editar gasto' : 'Novo gasto'}>
        <form onSubmit={saveExp} className="space-y-4">
          <div>
            <label className="label">Descrição</label>
            <input required className="input" value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Categoria</label>
              <select className="input" value={expForm.category_id} onChange={(e) => setExpForm({ ...expForm, category_id: e.target.value })}>
                <option value="">Sem categoria</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Valor (R$)</label>
              <input type="number" step="0.01" className="input" value={expForm.amount} onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Data</label>
              <input type="date" className="input" value={expForm.date || ''} onChange={(e) => setExpForm({ ...expForm, date: e.target.value })} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={expForm.status} onChange={(e) => setExpForm({ ...expForm, status: e.target.value })}>
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setExpModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
