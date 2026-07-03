export function StatCard({ label, value, sub, icon: Icon, tone = 'sage' }) {
  const tones = {
    sage: 'bg-sage-700 text-linen',
    clay: 'bg-clay-500 text-linen',
    ochre: 'bg-ochre-500 text-linen',
    ink: 'bg-ink-800 text-linen',
  }
  return (
    <div className="card p-5 flex items-start gap-4">
      {Icon && (
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tones[tone]}`}>
          <Icon size={18} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-2xl font-display text-ink-900 dark:text-linen leading-none">{value}</p>
        <p className="text-sm text-ink-500 dark:text-ink-300 mt-1">{label}</p>
        {sub && <p className="text-xs text-ink-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export function ProgressBar({ value, max = 100, tone = 'sage', overLabel }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const over = value > max
  const colors = {
    sage: 'bg-sage-600',
    clay: 'bg-clay-500',
    ochre: 'bg-ochre-500',
  }
  return (
    <div>
      <div className="h-2.5 w-full rounded-full bg-ink-900/10 dark:bg-linen/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-clay-500' : colors[tone]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {over && overLabel && <p className="mt-1 text-xs font-medium text-clay-600 dark:text-clay-300">{overLabel}</p>}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-700/10 text-sage-700 dark:text-sage-300">
          <Icon size={22} />
        </div>
      )}
      <div>
        <p className="font-display text-lg text-ink-900 dark:text-linen">{title}</p>
        {description && <p className="text-sm text-ink-500 dark:text-ink-300 mt-1 max-w-sm">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function Badge({ children, tone = 'ink' }) {
  const tones = {
    sage: 'bg-sage-600/15 text-sage-800 dark:text-sage-300',
    clay: 'bg-clay-500/15 text-clay-700 dark:text-clay-300',
    ochre: 'bg-ochre-500/15 text-ochre-600 dark:text-ochre-400',
    ink: 'bg-ink-900/10 text-ink-600 dark:bg-linen/10 dark:text-ink-200',
  }
  return <span className={`badge ${tones[tone]}`}>{children}</span>
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
      <div>
        {eyebrow && <p className="text-xs font-medium uppercase tracking-widest text-sage-700 dark:text-sage-400 mb-1">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
        {description && <p className="text-sm text-ink-500 dark:text-ink-300 mt-1.5 max-w-lg">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
