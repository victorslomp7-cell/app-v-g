import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import {
  Heart,
  Home,
  Users,
  ListChecks,
  Store,
  Wallet,
  Clock,
  LayoutGrid,
  Gift,
  Image,
  FileText,
  Settings as SettingsIcon,
  Menu,
  X,
  Moon,
  Sun,
  MonitorSmartphone,
} from 'lucide-react'
import { useSettings } from '../lib/SettingsContext.jsx'

const NAV = [
  { to: '/', label: 'Visão geral', icon: Home, end: true },
  { to: '/convidados', label: 'Convidados', icon: Users },
  { to: '/checklist', label: 'Checklist', icon: ListChecks },
  { to: '/fornecedores', label: 'Fornecedores', icon: Store },
  { to: '/orcamento', label: 'Orçamento', icon: Wallet },
  { to: '/cronograma', label: 'Cronograma do dia', icon: Clock },
  { to: '/mesas', label: 'Mesas', icon: LayoutGrid },
  { to: '/presentes', label: 'Presentes', icon: Gift },
  { to: '/mural', label: 'Mural', icon: Image },
  { to: '/documentos', label: 'Documentos', icon: FileText },
]

const MOBILE_NAV = [NAV[0], NAV[1], NAV[2], NAV[4]]

function ThemeToggle() {
  const { settings, update } = useSettings()
  if (!settings) return null
  const options = [
    { value: 'light', icon: Sun },
    { value: 'system', icon: MonitorSmartphone },
    { value: 'dark', icon: Moon },
  ]
  return (
    <div className="flex items-center gap-0.5 rounded-full border border-ink-900/10 dark:border-linen/15 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => update({ theme: o.value })}
          className={`rounded-full p-1.5 transition-colors ${
            settings.theme === o.value
              ? 'bg-sage-700 text-linen'
              : 'text-ink-500 dark:text-ink-300 hover:bg-ink-900/5 dark:hover:bg-linen/10'
          }`}
          title={o.value}
        >
          <o.icon size={14} />
        </button>
      ))}
    </div>
  )
}

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { settings } = useSettings()

  const coupleLabel = settings ? `${settings.couple_name_1} & ${settings.couple_name_2}` : 'V&G'

  return (
    <div className="min-h-screen flex bg-linen dark:bg-ink-950">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r border-ink-900/10 dark:border-linen/10 bg-white/60 dark:bg-ink-900/40 backdrop-blur-sm">
        <div className="px-6 py-7 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-700 text-linen">
            <Heart size={16} fill="currentColor" />
          </div>
          <div>
            <p className="font-display text-lg leading-tight text-ink-900 dark:text-linen">{coupleLabel}</p>
            <p className="text-[11px] uppercase tracking-wider text-ink-400">Nosso casamento</p>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sage-700 text-linen shadow-sm'
                    : 'text-ink-600 dark:text-ink-200 hover:bg-sage-700/10 dark:hover:bg-linen/5'
                }`
              }
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-ink-900/10 dark:border-linen/10 flex items-center justify-between">
          <NavLink
            to="/configuracoes"
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                isActive ? 'text-sage-700 dark:text-sage-300' : 'text-ink-500 dark:text-ink-300 hover:text-sage-700'
              }`
            }
          >
            <SettingsIcon size={16} />
            Ajustes
          </NavLink>
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 py-3 bg-linen/90 dark:bg-ink-950/90 backdrop-blur-sm border-b border-ink-900/10 dark:border-linen/10">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sage-700 text-linen">
            <Heart size={14} fill="currentColor" />
          </div>
          <p className="font-display text-base text-ink-900 dark:text-linen">{coupleLabel}</p>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 text-ink-700 dark:text-linen">
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-ink-950/50" onClick={() => setMobileOpen(false)} />
          <div className="relative ml-auto h-full w-72 bg-linen dark:bg-ink-950 border-l border-ink-900/10 dark:border-linen/10 p-5 flex flex-col animate-in slide-in-from-right">
            <div className="flex items-center justify-between mb-6">
              <p className="font-display text-lg text-ink-900 dark:text-linen">Menu</p>
              <button onClick={() => setMobileOpen(false)} className="p-1 text-ink-600 dark:text-linen">
                <X size={20} />
              </button>
            </div>
            <nav className="space-y-1 flex-1 overflow-y-auto">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                      isActive ? 'bg-sage-700 text-linen' : 'text-ink-700 dark:text-ink-200'
                    }`
                  }
                >
                  <item.icon size={17} />
                  {item.label}
                </NavLink>
              ))}
              <NavLink
                to="/configuracoes"
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                    isActive ? 'bg-sage-700 text-linen' : 'text-ink-700 dark:text-ink-200'
                  }`
                }
              >
                <SettingsIcon size={17} />
                Ajustes
              </NavLink>
            </nav>
            <div className="pt-4 border-t border-ink-900/10 dark:border-linen/10 flex justify-center">
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 pt-16 pb-20 md:pt-0 md:pb-0">
        <div className="mx-auto max-w-6xl px-4 md:px-8 py-6 md:py-10">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 dark:bg-ink-900/90 backdrop-blur-sm border-t border-ink-900/10 dark:border-linen/10 flex items-stretch">
        {MOBILE_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium ${
                isActive ? 'text-sage-700 dark:text-sage-300' : 'text-ink-400 dark:text-ink-400'
              }`
            }
          >
            <item.icon size={19} />
            {item.label}
          </NavLink>
        ))}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium text-ink-400"
        >
          <Menu size={19} />
          Mais
        </button>
      </nav>
    </div>
  )
}
