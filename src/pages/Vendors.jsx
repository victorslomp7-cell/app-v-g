import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Store, Phone, Mail, Instagram, Paperclip, Upload, X, DollarSign } from 'lucide-react'
import { api } from '../lib/api.js'
import { PageHeader, Badge, EmptyState } from '../components/ui.jsx'
import Modal from '../components/Modal.jsx'
import { formatCurrency, formatDate } from '../lib/format.js'

const STATUS_OPTIONS = [
  { value: 'a_contatar', label: 'A contatar', tone: 'ink' },
  { value: 'orcamento_pedido', label: 'Orçamento pedido', tone: 'ochre' },
  { value: 'em_negociacao', label: 'Em negociação', tone: 'ochre' },
  { value: 'contratado', label: 'Contratado', tone: 'sage' },
  { value: 'pago', label: 'Pago', tone: 'sage' },
]
const statusMeta = (v) => STATUS_OPTIONS.find((s) => s.value === v) || STATUS_OPTIONS[0]

const emptyVendor = { name: '', category: '', phone: '', email: '', instagram: '', status: 'a_contatar', agreed_value: '', notes: '' }
const emptyPayment = { description: '', amount: '', due_date: '', paid: false, paid_date: '' }

export default function Vendors() {
  const [vendors, setVendors] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyVendor)
  const [detail, setDetail] = useState(null)
  const [paymentForm, setPaymentForm] = useState(emptyPayment)
  const [statusFilter, setStatusFilter] = useState('all')

  const load = () => api.vendors.list().then((data) => {
    setVendors(data)
    setDetail((d) => (d ? data.find((v) => v.id === d.id) || null : null))
  })
  useEffect(() => { load() }, [])

  const filtered = useMemo(
    () => (statusFilter === 'all' ? vendors : vendors.filter((v) => v.status === statusFilter)),
    [vendors, statusFilter]
  )

  const openNew = () => { setEditing(null); setForm(emptyVendor); setModalOpen(true) }
  const openEdit = (v) => { setEditing(v); setForm({ ...v, agreed_value: v.agreed_value ?? '' }); setModalOpen(true) }

  const save = async (e) => {
    e.preventDefault()
    const payload = { ...form, agreed_value: form.agreed_value === '' ? null : Number(form.agreed_value) }
    if (editing) await api.vendors.update(editing.id, payload)
    else await api.vendors.create(payload)
    setModalOpen(false)
    load()
  }

  const remove = async (v) => {
    if (!confirm(`Remover fornecedor "${v.name}"?`)) return
    await api.vendors.remove(v.id)
    load()
  }

  const addPayment = async (e) => {
    e.preventDefault()
    await api.vendors.addPayment(detail.id, { ...paymentForm, amount: Number(paymentForm.amount) || 0 })
    setPaymentForm(emptyPayment)
    load()
  }

  const togglePaid = async (p) => {
    await api.vendors.updatePayment(detail.id, p.id, { paid: !p.paid, paid_date: !p.paid ? new Date().toISOString().slice(0, 10) : null })
    load()
  }

  const removePayment = async (p) => {
    if (!confirm('Remover esta parcela?')) return
    await api.vendors.removePayment(detail.id, p.id)
    load()
  }

  const uploadFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    await api.vendors.uploadAttachment(detail.id, file)
    e.target.value = ''
    load()
  }

  const removeAttachment = async (a) => {
    if (!confirm('Remover este anexo?')) return
    await api.vendors.removeAttachment(detail.id, a.id)
    load()
  }

  return (
    <div>
      <PageHeader
        eyebrow="Prestadores de serviço"
        title="Fornecedores"
        description="Contatos, negociações, contratos e pagamentos em um só lugar."
        actions={<button className="btn-primary" onClick={openNew}><Plus size={15} /> Fornecedor</button>}
      />

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setStatusFilter('all')}
          className={`badge cursor-pointer ${statusFilter === 'all' ? 'bg-sage-700 text-linen' : 'bg-ink-900/5 dark:bg-linen/10 text-ink-600 dark:text-ink-200'}`}
        >
          Todos ({vendors.length})
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(s.value)}
            className={`badge cursor-pointer ${statusFilter === s.value ? 'bg-sage-700 text-linen' : 'bg-ink-900/5 dark:bg-linen/10 text-ink-600 dark:text-ink-200'}`}
          >
            {s.label} ({vendors.filter((v) => v.status === s.value).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Store} title="Nenhum fornecedor por aqui" description="Cadastre buffet, decoração, fotografia e outros prestadores." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v) => {
            const paid = v.payments.reduce((s, p) => s + (p.paid ? p.amount : 0), 0)
            return (
              <div key={v.id} className="card p-5 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setDetail(v)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display text-lg text-ink-900 dark:text-linen truncate">{v.name}</p>
                    {v.category && <p className="text-xs text-ink-400">{v.category}</p>}
                  </div>
                  <Badge tone={statusMeta(v.status).tone}>{statusMeta(v.status).label}</Badge>
                </div>
                <div className="mt-3 space-y-1 text-xs text-ink-500 dark:text-ink-300">
                  {v.agreed_value != null && <p>Valor combinado: <span className="font-medium text-ink-700 dark:text-linen">{formatCurrency(v.agreed_value)}</span></p>}
                  {v.payments.length > 0 && <p>Pago: {formatCurrency(paid)} {v.agreed_value ? `de ${formatCurrency(v.agreed_value)}` : ''}</p>}
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-ink-900/5 dark:border-linen/10">
                  <button className="p-2.5 -m-1 rounded-full text-ink-500 hover:bg-ink-900/5 dark:hover:bg-linen/10" onClick={(e) => { e.stopPropagation(); openEdit(v) }}>
                    <Pencil size={14} />
                  </button>
                  <button className="p-2.5 -m-1 rounded-full text-clay-600 hover:bg-clay-500/10" onClick={(e) => { e.stopPropagation(); remove(v) }}>
                    <Trash2 size={14} />
                  </button>
                  {v.attachments.length > 0 && (
                    <span className="ml-auto flex items-center gap-1 text-xs text-ink-400"><Paperclip size={12} />{v.attachments.length}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar fornecedor' : 'Novo fornecedor'}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Nome</label>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Categoria</label>
              <input className="input" placeholder="Buffet, Fotografia…" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Telefone</label>
              <input className="input" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">Instagram</label>
              <input className="input" value={form.instagram || ''} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">E-mail</label>
            <input className="input" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Valor combinado (R$)</label>
            <input type="number" step="0.01" className="input" value={form.agreed_value} onChange={(e) => setForm({ ...form, agreed_value: e.target.value })} />
          </div>
          <div>
            <label className="label">Observações</label>
            <textarea className="input" rows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name || ''} wide>
        {detail && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4 text-sm text-ink-600 dark:text-ink-200">
              {detail.phone && <span className="flex items-center gap-1.5"><Phone size={14} />{detail.phone}</span>}
              {detail.email && <span className="flex items-center gap-1.5"><Mail size={14} />{detail.email}</span>}
              {detail.instagram && <span className="flex items-center gap-1.5"><Instagram size={14} />{detail.instagram}</span>}
            </div>
            {detail.notes && <p className="text-sm text-ink-500 dark:text-ink-300 bg-ink-900/5 dark:bg-linen/5 rounded-lg p-3">{detail.notes}</p>}

            <div>
              <h4 className="font-display text-base text-ink-900 dark:text-linen mb-2 flex items-center gap-1.5"><DollarSign size={16} /> Pagamentos</h4>
              <div className="space-y-2 mb-3">
                {detail.payments.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-lg border border-ink-900/10 dark:border-linen/10 px-3 py-2">
                    <input type="checkbox" checked={!!p.paid} onChange={() => togglePaid(p)} className="h-5 w-5 accent-sage-700 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${p.paid ? 'text-ink-400 line-through' : 'text-ink-800 dark:text-linen'}`}>{p.description || 'Parcela'}</p>
                      <p className="text-xs text-ink-400">{p.due_date ? `venc. ${formatDate(p.due_date)}` : ''} {p.paid && p.paid_date ? `· pago em ${formatDate(p.paid_date)}` : ''}</p>
                    </div>
                    <span className="text-sm font-medium text-ink-700 dark:text-linen">{formatCurrency(p.amount)}</span>
                    <button onClick={() => removePayment(p)} className="text-clay-600 p-2 -m-1"><X size={14} /></button>
                  </div>
                ))}
                {detail.payments.length === 0 && <p className="text-sm text-ink-400">Nenhum pagamento registrado.</p>}
              </div>
              <form onSubmit={addPayment} className="grid grid-cols-[1fr,110px,130px,auto] gap-2 items-end">
                <div>
                  <label className="label">Descrição</label>
                  <input className="input" value={paymentForm.description} onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })} />
                </div>
                <div>
                  <label className="label">Valor</label>
                  <input type="number" step="0.01" className="input" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
                </div>
                <div>
                  <label className="label">Vencimento</label>
                  <input type="date" className="input" value={paymentForm.due_date} onChange={(e) => setPaymentForm({ ...paymentForm, due_date: e.target.value })} />
                </div>
                <button type="submit" className="btn-secondary h-[38px]">Adicionar</button>
              </form>
            </div>

            <div>
              <h4 className="font-display text-base text-ink-900 dark:text-linen mb-2 flex items-center gap-1.5"><Paperclip size={16} /> Propostas e contratos</h4>
              <div className="space-y-2 mb-3">
                {detail.attachments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border border-ink-900/10 dark:border-linen/10 px-3 py-2">
                    <a href={`/uploads/${a.filename}`} target="_blank" rel="noreferrer" className="text-sm text-sage-700 dark:text-sage-300 hover:underline truncate">
                      {a.original_name}
                    </a>
                    <button onClick={() => removeAttachment(a)} className="text-clay-600 p-2 -m-1"><X size={14} /></button>
                  </div>
                ))}
                {detail.attachments.length === 0 && <p className="text-sm text-ink-400">Nenhum arquivo anexado.</p>}
              </div>
              <label className="btn-secondary cursor-pointer inline-flex">
                <Upload size={15} /> Anexar arquivo
                <input type="file" className="hidden" onChange={uploadFile} accept=".pdf,image/*" />
              </label>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
