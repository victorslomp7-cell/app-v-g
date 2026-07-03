import { useEffect, useState } from 'react'
import { Lock, Heart } from 'lucide-react'

export default function AuthGate({ children }) {
  const [status, setStatus] = useState(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const checkStatus = () => {
    fetch('/api/auth/status')
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ authRequired: false, authenticated: true }))
  }

  useEffect(() => {
    checkStatus()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        setError('Senha incorreta.')
        return
      }
      checkStatus()
    } catch {
      setError('Não foi possível conectar. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!status) return null

  if (status.authRequired && !status.authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linen dark:bg-ink-950 px-5">
        <form onSubmit={submit} className="card w-full max-w-sm p-7 space-y-4">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-700 text-linen shrink-0">
              <Heart size={16} fill="currentColor" />
            </div>
            <h1 className="font-display text-xl text-ink-900 dark:text-linen">V&amp;G é só nosso</h1>
          </div>
          <p className="text-sm text-ink-500 dark:text-ink-300">Digite a senha combinada entre vocês para entrar.</p>
          <div>
            <label className="label">Senha</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                autoFocus
                type="password"
                className="input pl-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          {error && <p className="text-sm text-clay-600">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    )
  }

  return children
}
