import { useEffect, useState } from 'react'
import { Download, DatabaseBackup, Save, LogOut } from 'lucide-react'
import { api } from '../lib/api.js'
import { useSettings } from '../lib/SettingsContext.jsx'
import { PageHeader } from '../components/ui.jsx'
import PhotoSlot from '../components/PhotoSlot.jsx'

export default function Settings() {
  const { settings, update } = useSettings()
  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(false)
  const [authRequired, setAuthRequired] = useState(false)

  useEffect(() => {
    if (settings) setForm(settings)
  }, [settings])

  useEffect(() => {
    api.auth.status().then((s) => setAuthRequired(s.authRequired))
  }, [])

  const logout = async () => {
    await api.auth.logout()
    window.location.reload()
  }

  if (!form) return null

  const save = async (e) => {
    e.preventDefault()
    await update({
      couple_name_1: form.couple_name_1,
      couple_name_2: form.couple_name_2,
      wedding_date: form.wedding_date,
      budget_total: form.budget_total,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="max-w-2xl">
      <PageHeader eyebrow="Personalização" title="Ajustes" description="Informações do casal, aparência e backup dos dados." />

      <form onSubmit={save} className="card p-6 space-y-4 mb-8">
        <h2 className="font-display text-lg text-ink-900 dark:text-linen">Sobre o casamento</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Nome 1</label>
            <input className="input" value={form.couple_name_1} onChange={(e) => setForm({ ...form, couple_name_1: e.target.value })} />
          </div>
          <div>
            <label className="label">Nome 2</label>
            <input className="input" value={form.couple_name_2} onChange={(e) => setForm({ ...form, couple_name_2: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Data do casamento</label>
            <input type="date" className="input" value={form.wedding_date || ''} onChange={(e) => setForm({ ...form, wedding_date: e.target.value })} />
          </div>
          <div>
            <label className="label">Orçamento total (R$)</label>
            <input type="number" step="0.01" className="input" value={form.budget_total} onChange={(e) => setForm({ ...form, budget_total: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Foto de capa (usada no link de RSVP e no compartilhamento)</label>
          <PhotoSlot settingKey="cover_photo" className="w-full h-40" placeholder="Foto de capa" />
        </div>
        <button type="submit" className="btn-primary">
          {saved ? 'Salvo!' : <><Save size={15} /> Salvar</>}
        </button>
      </form>

      <div className="card p-6 space-y-4 mb-8">
        <h2 className="font-display text-lg text-ink-900 dark:text-linen flex items-center gap-2"><DatabaseBackup size={18} /> Backup dos dados</h2>
        <p className="text-sm text-ink-500 dark:text-ink-300">
          Faça backups regulares para não perder nada, especialmente antes de mudanças grandes.
        </p>
        <div className="flex flex-wrap gap-2">
          <a href={api.backup.downloadUrl()} className="btn-secondary"><Download size={15} /> Baixar banco de dados (.db)</a>
          <a href={api.backup.exportUrl()} className="btn-secondary"><Download size={15} /> Exportar tudo (.json)</a>
        </div>
      </div>

      {authRequired && (
        <div className="card p-6">
          <button onClick={logout} className="btn-secondary text-clay-600">
            <LogOut size={15} /> Sair deste aparelho
          </button>
        </div>
      )}
    </div>
  )
}
