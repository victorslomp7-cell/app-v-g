import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from './api.js'

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    return api.settings
      .get()
      .then(setSettings)
      .catch((err) => setError(err.message || 'Não foi possível carregar os dados.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!settings) return
    const root = document.documentElement
    const applyDark = (dark) => root.classList.toggle('dark', dark)
    if (settings.theme === 'dark') applyDark(true)
    else if (settings.theme === 'light') applyDark(false)
    else {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      applyDark(mq.matches)
      const listener = (e) => applyDark(e.matches)
      mq.addEventListener('change', listener)
      return () => mq.removeEventListener('change', listener)
    }
  }, [settings?.theme])

  const update = useCallback(async (patch) => {
    const updated = await api.settings.update(patch)
    setSettings(updated)
    return updated
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linen dark:bg-ink-950 px-5">
        <div className="card w-full max-w-sm p-7 text-center space-y-3">
          <p className="font-display text-lg text-ink-900 dark:text-linen">Não deu para carregar o V&amp;G</p>
          <p className="text-sm text-ink-500 dark:text-ink-300">{error}</p>
          <button onClick={load} className="btn-primary">
            Tentar de novo
          </button>
        </div>
      </div>
    )
  }

  if (loading) return null

  return (
    <SettingsContext.Provider value={{ settings, loading, update, refresh: load }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings deve ser usado dentro de SettingsProvider')
  return ctx
}
