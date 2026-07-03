import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from './api.js'

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.settings
      .get()
      .then(setSettings)
      .finally(() => setLoading(false))
  }, [])

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

  return (
    <SettingsContext.Provider value={{ settings, loading, update, refresh: () => api.settings.get().then(setSettings) }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings deve ser usado dentro de SettingsProvider')
  return ctx
}
