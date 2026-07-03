import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 gap-3">
      <p className="font-display text-3xl text-ink-900 dark:text-linen">Página não encontrada</p>
      <Link to="/" className="btn-primary mt-2">
        Voltar para a visão geral
      </Link>
    </div>
  )
}
