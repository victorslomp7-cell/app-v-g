import { useEffect, useMemo, useState } from 'react'
import Papa from 'papaparse'
import { Plus, Search, Upload, Link2, FileDown, Pencil, Trash2, Copy, Check, Users } from 'lucide-react'
import { api } from '../lib/api.js'
import { useSettings } from '../lib/SettingsContext.jsx'
import { PageHeader, Badge, EmptyState } from '../components/ui.jsx'
import Modal from '../components/Modal.jsx'
import { exportGuestListPdf } from '../lib/pdf.js'

const SIDE_LABEL = { noivo: 'Noivo', noiva: 'Noiva', ambos: 'Ambos' }
const STATUS_LABEL = { confirmado: 'Confirmado', pendente: 'Pendente', recusado: 'Recusado' }
const STATUS_TONE = { confirmado: 'sage', pendente: 'ochre', recusado: 'clay' }

const emptyGuest = {
  name: '',
  side: 'ambos',
  status: 'pendente',
  has_companion: false,
  companion_name: '',
  dietary_restriction: '',
  phone: '',
  notes: '',
}

export default function Guests() {
  const { settings } = useSettings()
  const [guests, setGuests] = useState([])
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sideFilter, setSideFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyGuest)
  const [importOpen, setImportOpen] = useState(false)
  const [importRows, setImportRows] = useState([])
  const [importError, setImportError] = useState('')
  const [linkOpen, setLinkOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const load = () => {
    api.guests.list().then(setGuests)
    api.seatingTables.list().then(setTables)
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([api.guests.list(), api.seatingTables.list()]).then(([g, t]) => {
      setGuests(g)
      setTables(t)
      setLoading(false)
    })
  }, [])

  const tableName = (id) => tables.find((t) => t.id === id)?.name

  const filtered = useMemo(() => {
    return guests.filter((g) => {
      if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false
      if (sideFilter !== 'all' && g.side !== sideFilter) return false
      if (statusFilter !== 'all' && g.status !== statusFilter) return false
      return true
    })
  }, [guests, search, sideFilter, statusFilter])

  const counts = useMemo(() => {
    const c = { total: 0, confirmado: 0, pendente: 0, recusado: 0 }
    guests.forEach((g) => {
      const n = g.has_companion ? 2 : 1
      c.total += n
      c[g.status] = (c[g.status] || 0) + n
    })
    return c
  }, [guests])

  const openNew = () => {
    setEditing(null)
    setForm(emptyGuest)
    setModalOpen(true)
  }

  const openEdit = (g) => {
    setEditing(g)
    setForm({ ...g })
    setModalOpen(true)
  }

  const save = async (e) => {
    e.preventDefault()
    if (editing) await api.guests.update(editing.id, form)
    else await api.guests.create(form)
    setModalOpen(false)
    load()
  }

  const remove = async (g) => {
    if (!confirm(`Remover ${g.name} da lista de convidados?`)) return
    await api.guests.remove(g.id)
    load()
  }

  const handleCsvFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError('')
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data
          .map((r) => ({
            name: r.nome || r.name || '',
            side: (r.lado || r.side || 'ambos').toLowerCase(),
            status: (r.status || 'pendente').toLowerCase(),
            has_companion: /sim|true|1/i.test(r.acompanhante || r.has_companion || ''),
            companion_name: r.nome_acompanhante || r.companion_name || '',
            dietary_restriction: r.restricao || r.dietary_restriction || '',
            phone: r.telefone || r.phone || '',
          }))
          .filter((r) => r.name)
        if (!rows.length) setImportError('Nenhum convidado válido encontrado. Verifique se a planilha tem a coluna "nome".')
        setImportRows(rows)
      },
      error: () => setImportError('Não foi possível ler o arquivo CSV.'),
    })
  }

  const confirmImport = async () => {
    await api.guests.import(importRows)
    setImportOpen(false)
    setImportRows([])
    load()
  }

  const rsvpLink = settings ? `${window.location.origin}/rsvp/${settings.rsvp_token}` : ''

  const copyLink = () => {
    navigator.clipboard.writeText(rsvpLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const regenerateLink = async () => {
    if (!confirm('Gerar um novo link invalida o link antigo. Continuar?')) return
    await api.backup.regenerateToken('rsvp')
    location.reload()
  }

  const exportPdf = () => {
    const withTables = guests.map((g) => ({ ...g, table_name: tableName(g.table_id) }))
    exportGuestListPdf(withTables, `${settings.couple_name_1} & ${settings.couple_name_2}`)
  }

  return (
    <div>
      <PageHeader
        eyebrow="Lista de convidados"
        title="Convidados"
        description="Gerencie confirmações, restrições alimentares e mesas."
        actions={
          <>
            <button className="btn-secondary" onClick={() => setImportOpen(true)}>
              <Upload size={15} /> Importar CSV
            </button>
            <button className="btn-secondary" onClick={() => setLinkOpen(true)}>
              <Link2 size={15} /> Link RSVP
            </button>
            <button className="btn-primary" onClick={openNew}>
              <Plus size={15} /> Convidado
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          ['Total', counts.total, 'ink'],
          ['Confirmados', counts.confirmado, 'sage'],
          ['Pendentes', counts.pendente, 'ochre'],
          ['Recusados', counts.recusado, 'clay'],
        ].map(([label, value, tone]) => (
          <div key={label} className="card px-4 py-3">
            <p className="text-2xl font-display text-ink-900 dark:text-linen">{value}</p>
            <p className="text-xs text-ink-500 dark:text-ink-300">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            className="input pl-9"
            placeholder="Buscar por nome…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input sm:w-40" value={sideFilter} onChange={(e) => setSideFilter(e.target.value)}>
          <option value="all">Todos os lados</option>
          <option value="noivo">Noivo</option>
          <option value="noiva">Noiva</option>
          <option value="ambos">Ambos</option>
        </select>
        <select className="input sm:w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Todos os status</option>
          <option value="confirmado">Confirmado</option>
          <option value="pendente">Pendente</option>
          <option value="recusado">Recusado</option>
        </select>
        <button className="btn-secondary" onClick={exportPdf}>
          <FileDown size={15} /> PDF
        </button>
      </div>

      {!loading && filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={guests.length === 0 ? 'Nenhum convidado cadastrado' : 'Nenhum convidado encontrado'}
          description={guests.length === 0 ? 'Adicione convidados manualmente ou importe uma planilha CSV.' : 'Tente ajustar a busca ou os filtros.'}
          action={guests.length === 0 && <button className="btn-primary" onClick={openNew}><Plus size={15} /> Adicionar convidado</button>}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="hidden md:grid grid-cols-[2fr,0.8fr,1fr,1.2fr,1fr,0.8fr,auto] gap-2 px-5 py-3 text-xs font-medium uppercase tracking-wide text-ink-400 border-b border-ink-900/5 dark:border-linen/10">
            <span>Nome</span>
            <span>Lado</span>
            <span>Status</span>
            <span>Acompanhante</span>
            <span>Restrição</span>
            <span>Mesa</span>
            <span></span>
          </div>
          <div className="divide-y divide-ink-900/5 dark:divide-linen/10">
            {filtered.map((g) => (
              <div key={g.id} className="grid grid-cols-2 md:grid-cols-[2fr,0.8fr,1fr,1.2fr,1fr,0.8fr,auto] gap-2 px-5 py-3.5 items-center text-sm">
                <span className="font-medium text-ink-800 dark:text-linen col-span-2 md:col-span-1">{g.name}</span>
                <span className="text-ink-500 dark:text-ink-300 hidden md:block">{SIDE_LABEL[g.side]}</span>
                <span><Badge tone={STATUS_TONE[g.status]}>{STATUS_LABEL[g.status]}</Badge></span>
                <span className="text-ink-500 dark:text-ink-300 truncate">{g.has_companion ? g.companion_name || 'Sim' : '—'}</span>
                <span className="text-ink-500 dark:text-ink-300 truncate hidden md:block">{g.dietary_restriction || '—'}</span>
                <span className="text-ink-500 dark:text-ink-300 hidden md:block">{tableName(g.table_id) || '—'}</span>
                <span className="flex justify-end gap-1">
                  <button className="p-1.5 rounded-full text-ink-500 hover:bg-ink-900/5 dark:hover:bg-linen/10" onClick={() => openEdit(g)}>
                    <Pencil size={15} />
                  </button>
                  <button className="p-1.5 rounded-full text-clay-600 hover:bg-clay-500/10" onClick={() => remove(g)}>
                    <Trash2 size={15} />
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar convidado' : 'Novo convidado'}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Nome</label>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Lado</label>
              <select className="input" value={form.side} onChange={(e) => setForm({ ...form, side: e.target.value })}>
                <option value="ambos">Ambos</option>
                <option value="noivo">Noivo</option>
                <option value="noiva">Noiva</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="pendente">Pendente</option>
                <option value="confirmado">Confirmado</option>
                <option value="recusado">Recusado</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Telefone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-700 dark:text-ink-200">
            <input
              type="checkbox"
              checked={!!form.has_companion}
              onChange={(e) => setForm({ ...form, has_companion: e.target.checked })}
            />
            Vai com acompanhante
          </label>
          {form.has_companion && (
            <div>
              <label className="label">Nome do acompanhante</label>
              <input className="input" value={form.companion_name} onChange={(e) => setForm({ ...form, companion_name: e.target.value })} />
            </div>
          )}
          <div>
            <label className="label">Restrição alimentar</label>
            <input className="input" value={form.dietary_restriction} onChange={(e) => setForm({ ...form, dietary_restriction: e.target.value })} />
          </div>
          <div>
            <label className="label">Observações</label>
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>

      <Modal open={importOpen} onClose={() => { setImportOpen(false); setImportRows([]) }} title="Importar convidados via CSV" wide>
        <div className="space-y-4">
          <p className="text-sm text-ink-500 dark:text-ink-300">
            Envie um arquivo CSV com as colunas: <code className="text-xs bg-ink-900/5 dark:bg-linen/10 px-1 rounded">nome, lado, status, acompanhante, nome_acompanhante, restricao, telefone</code>
          </p>
          <input type="file" accept=".csv" onChange={handleCsvFile} className="input" />
          {importError && <p className="text-sm text-clay-600">{importError}</p>}
          {importRows.length > 0 && (
            <div className="max-h-64 overflow-y-auto border border-ink-900/10 dark:border-linen/10 rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-ink-900/5 dark:bg-linen/5 sticky top-0">
                  <tr>
                    <th className="text-left px-2 py-1.5">Nome</th>
                    <th className="text-left px-2 py-1.5">Lado</th>
                    <th className="text-left px-2 py-1.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {importRows.map((r, i) => (
                    <tr key={i} className="border-t border-ink-900/5 dark:border-linen/10">
                      <td className="px-2 py-1.5">{r.name}</td>
                      <td className="px-2 py-1.5">{r.side}</td>
                      <td className="px-2 py-1.5">{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary" onClick={() => { setImportOpen(false); setImportRows([]) }}>Cancelar</button>
            <button className="btn-primary" disabled={!importRows.length} onClick={confirmImport}>
              Importar {importRows.length > 0 && `(${importRows.length})`}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={linkOpen} onClose={() => setLinkOpen(false)} title="Link público de confirmação (RSVP)">
        <div className="space-y-4">
          <p className="text-sm text-ink-500 dark:text-ink-300">
            Compartilhe este link com seus convidados. Eles poderão buscar o nome deles e confirmar presença sem login — a resposta atualiza sua lista automaticamente.
          </p>
          <div className="flex items-center gap-2">
            <input readOnly className="input font-mono text-xs" value={rsvpLink} />
            <button className="btn-secondary shrink-0" onClick={copyLink}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>
          <button className="text-xs text-clay-600 hover:underline" onClick={regenerateLink}>
            Gerar novo link (invalida o atual)
          </button>
        </div>
      </Modal>
    </div>
  )
}
