import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Search, CheckCircle2, XCircle, HeartHandshake } from 'lucide-react'
import { api } from '../lib/api.js'
import { formatDate } from '../lib/format.js'

export default function PublicRsvp() {
  const { token } = useParams()
  const [info, setInfo] = useState(null)
  const [error, setError] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [status, setStatus] = useState('confirmado')
  const [hasCompanion, setHasCompanion] = useState(false)
  const [companionName, setCompanionName] = useState('')
  const [dietary, setDietary] = useState('')
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.publicRsvp
      .info(token)
      .then(setInfo)
      .catch(() => setError(true))
  }, [token])

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    const id = setTimeout(() => {
      api.publicRsvp.search(token, query).then(setResults).catch(() => setResults([]))
    }, 250)
    return () => clearTimeout(id)
  }, [query, token])

  const selectGuest = (g) => {
    setSelected(g)
    setStatus(g.status === 'recusado' ? 'recusado' : 'confirmado')
    setHasCompanion(!!g.has_companion)
    setCompanionName(g.companion_name || '')
    setDietary(g.dietary_restriction || '')
    setResults([])
    setQuery(g.name)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!selected) return
    setSaving(true)
    try {
      await api.publicRsvp.confirm(token, selected.id, {
        status,
        has_companion: hasCompanion,
        companion_name: hasCompanion ? companionName : '',
        dietary_restriction: dietary,
      })
      setDone(true)
    } finally {
      setSaving(false)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linen p-6">
        <p className="text-ink-600 font-display text-xl text-center">Este link de confirmação não é válido.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linen dark:bg-ink-950 flex flex-col items-center px-5 py-14">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <div className="w-full max-w-md">
        {info?.cover_photo && (
          <img src={info.cover_photo} alt="" className="w-full h-48 object-cover rounded-xl2 mb-6 shadow-soft" />
        )}
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.25em] text-sage-700 mb-2">Confirmação de presença</p>
          <h1 className="font-display text-4xl text-ink-900 dark:text-linen">
            {info?.couple_name_1 || '...'} <span className="text-clay-500">&amp;</span> {info?.couple_name_2 || ''}
          </h1>
          {info?.wedding_date && <p className="text-ink-500 dark:text-ink-300 mt-2 text-sm">{formatDate(info.wedding_date, { weekday: 'long' })}</p>}
        </div>

        {done ? (
          <div className="card p-8 text-center flex flex-col items-center gap-3">
            <HeartHandshake size={32} className="text-sage-700" />
            <p className="font-display text-xl text-ink-900 dark:text-linen">Obrigado, {selected?.name}!</p>
            <p className="text-sm text-ink-500 dark:text-ink-300">
              {status === 'confirmado' ? 'Sua presença foi confirmada com carinho.' : 'Sentiremos sua falta, obrigado por avisar.'}
            </p>
          </div>
        ) : (
          <div className="card p-6">
            {!selected ? (
              <>
                <label className="label">Encontre seu nome na lista</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    autoFocus
                    className="input pl-9"
                    placeholder="Digite seu nome…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                {results.length > 0 && (
                  <div className="mt-2 border border-ink-900/10 dark:border-linen/10 rounded-lg overflow-hidden divide-y divide-ink-900/5 dark:divide-linen/10">
                    {results.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => selectGuest(g)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-sage-700/10 transition-colors"
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                )}
                {query.trim().length >= 2 && results.length === 0 && (
                  <p className="text-xs text-ink-400 mt-2">
                    Não encontramos esse nome. Verifique a grafia ou fale com os noivos.
                  </p>
                )}
              </>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                <div className="flex items-center justify-between">
                  <p className="font-display text-lg text-ink-900 dark:text-linen">{selected.name}</p>
                  <button type="button" className="text-xs text-ink-400 underline" onClick={() => setSelected(null)}>
                    trocar
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStatus('confirmado')}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-4 transition-colors ${
                      status === 'confirmado' ? 'border-sage-600 bg-sage-600/10' : 'border-ink-900/10 dark:border-linen/10'
                    }`}
                  >
                    <CheckCircle2 size={22} className="text-sage-700" />
                    <span className="text-sm font-medium">Vou comparecer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('recusado')}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-4 transition-colors ${
                      status === 'recusado' ? 'border-clay-500 bg-clay-500/10' : 'border-ink-900/10 dark:border-linen/10'
                    }`}
                  >
                    <XCircle size={22} className="text-clay-600" />
                    <span className="text-sm font-medium">Não poderei ir</span>
                  </button>
                </div>

                {status === 'confirmado' && (
                  <>
                    <label className="flex items-center gap-2 text-sm text-ink-700 dark:text-ink-200">
                      <input type="checkbox" checked={hasCompanion} onChange={(e) => setHasCompanion(e.target.checked)} />
                      Levarei um acompanhante
                    </label>
                    {hasCompanion && (
                      <div>
                        <label className="label">Nome do acompanhante</label>
                        <input className="input" value={companionName} onChange={(e) => setCompanionName(e.target.value)} />
                      </div>
                    )}
                    <div>
                      <label className="label">Restrição alimentar (opcional)</label>
                      <input className="input" placeholder="Ex: vegetariano, sem lactose…" value={dietary} onChange={(e) => setDietary(e.target.value)} />
                    </div>
                  </>
                )}

                <button type="submit" disabled={saving} className="btn-primary w-full">
                  {saving ? 'Enviando…' : 'Confirmar resposta'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
