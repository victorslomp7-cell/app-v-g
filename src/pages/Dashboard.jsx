import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, ListChecks, Wallet, Store, ArrowRight, CalendarHeart } from 'lucide-react'
import { api } from '../lib/api.js'
import { useSettings } from '../lib/SettingsContext.jsx'
import { StatCard, EmptyState } from '../components/ui.jsx'
import PhotoSlot from '../components/PhotoSlot.jsx'
import { daysUntil, formatDate, isOverdue } from '../lib/format.js'

export default function Dashboard() {
  const { settings } = useSettings()
  const [guestStats, setGuestStats] = useState(null)
  const [tasks, setTasks] = useState([])
  const [vendors, setVendors] = useState([])
  const [categories, setCategories] = useState([])
  const [expenses, setExpenses] = useState([])

  useEffect(() => {
    api.guests.stats().then(setGuestStats)
    api.tasks.list().then(setTasks)
    api.vendors.list().then(setVendors)
    api.budgetCategories.list().then(setCategories)
    api.expenses.list().then(setExpenses)
  }, [])

  const days = daysUntil(settings?.wedding_date)

  const taskProgress = useMemo(() => {
    if (!tasks.length) return 0
    return Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100)
  }, [tasks])

  const rsvpProgress = useMemo(() => {
    if (!guestStats || !guestStats.total) return 0
    return Math.round((guestStats.confirmado / guestStats.total) * 100)
  }, [guestStats])

  const budgetTotal = Number(settings?.budget_total) || categories.reduce((s, c) => s + c.planned_amount, 0)
  const spent = expenses.reduce((s, e) => s + e.amount, 0)
  const budgetProgress = budgetTotal > 0 ? Math.round((spent / budgetTotal) * 100) : 0

  const vendorsClosed = vendors.filter((v) => ['contratado', 'pago'].includes(v.status)).length

  const upcomingTasks = tasks
    .filter((t) => !t.completed && t.due_date)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5)

  return (
    <div className="space-y-8">
      <section className="card overflow-hidden relative">
        <div className="grid md:grid-cols-[1.3fr,1fr] gap-0">
          <div className="p-6 md:p-10 flex flex-col justify-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-sage-700 dark:text-sage-400 mb-3 flex items-center gap-1.5">
              <CalendarHeart size={14} /> Contagem regressiva
            </p>
            <h1 className="font-display text-4xl md:text-5xl text-ink-900 dark:text-linen leading-[1.05]">
              {settings?.couple_name_1 || 'Victor'} <span className="text-clay-500">&amp;</span>{' '}
              {settings?.couple_name_2 || 'Gabi'}
            </h1>
            {settings?.wedding_date ? (
              <div className="mt-6 flex items-baseline gap-3">
                <span className="font-display text-6xl md:text-7xl text-sage-700 dark:text-sage-300">
                  {days >= 0 ? days : 0}
                </span>
                <span className="text-ink-500 dark:text-ink-300 text-sm">
                  {days === 0 ? 'é hoje! 🎉' : days === 1 ? 'dia até o grande dia' : 'dias até o grande dia'}
                  <br />
                  {formatDate(settings.wedding_date, { weekday: 'long' })}
                </span>
              </div>
            ) : (
              <p className="mt-6 text-sm text-ink-500 dark:text-ink-300">
                Defina a data do casamento em{' '}
                <Link to="/configuracoes" className="text-sage-700 dark:text-sage-300 underline underline-offset-2">
                  Ajustes
                </Link>{' '}
                para ver a contagem regressiva.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1 p-1 min-h-[220px] md:min-h-0">
            <PhotoSlot settingKey="hero_photo_1" className="w-full h-full" rounded="rounded-xl" placeholder="Foto do casal" />
            <PhotoSlot settingKey="hero_photo_2" className="w-full h-full" rounded="rounded-xl" placeholder="Foto do casal" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} tone="sage" label="Convidados confirmados" value={`${rsvpProgress}%`} sub={`${guestStats?.confirmado || 0} de ${guestStats?.total || 0}`} />
        <StatCard icon={ListChecks} tone="clay" label="Tarefas concluídas" value={`${taskProgress}%`} sub={`${tasks.filter((t) => t.completed).length} de ${tasks.length}`} />
        <StatCard icon={Wallet} tone="ochre" label="Orçamento utilizado" value={`${budgetProgress}%`} sub={budgetTotal ? `de ${budgetTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : 'defina o orçamento'} />
        <StatCard icon={Store} tone="ink" label="Fornecedores fechados" value={vendorsClosed} sub={`de ${vendors.length} cadastrados`} />
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl text-ink-900 dark:text-linen">Próximas tarefas</h2>
          <Link to="/checklist" className="text-sm text-sage-700 dark:text-sage-300 flex items-center gap-1 hover:underline">
            ver checklist <ArrowRight size={14} />
          </Link>
        </div>
        {upcomingTasks.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="Nenhuma tarefa com prazo definido"
            description="Adicione datas-limite às tarefas do checklist para vê-las por aqui."
          />
        ) : (
          <div className="card divide-y divide-ink-900/5 dark:divide-linen/10">
            {upcomingTasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-ink-800 dark:text-linen">{t.title}</p>
                  {t.category && <p className="text-xs text-ink-400 mt-0.5">{t.category}</p>}
                </div>
                <span className={`text-xs font-medium ${isOverdue(t.due_date, t.completed) ? 'text-clay-600' : 'text-ink-500 dark:text-ink-300'}`}>
                  {formatDate(t.due_date)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
