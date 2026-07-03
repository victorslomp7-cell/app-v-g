import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api.js'
import { formatDate } from '../lib/format.js'

export default function PublicShare() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    api.publicShare
      .info(token)
      .then(setData)
      .catch(() => setError(true))
  }, [token])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linen p-6">
        <p className="text-ink-600 font-display text-xl text-center">Este link de compartilhamento não é válido.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linen dark:bg-ink-950 px-5 py-14 flex flex-col items-center">
      <div className="w-full max-w-lg">
        {data?.cover_photo && <img src={data.cover_photo} alt="" className="w-full h-48 object-cover rounded-xl2 mb-6 shadow-soft" />}
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.25em] text-sage-700 mb-2">Cronograma do dia</p>
          <h1 className="font-display text-4xl text-ink-900 dark:text-linen">
            {data?.couple_name_1 || '...'} <span className="text-clay-500">&amp;</span> {data?.couple_name_2 || ''}
          </h1>
          {data?.wedding_date && <p className="text-ink-500 dark:text-ink-300 mt-2 text-sm">{formatDate(data.wedding_date, { weekday: 'long' })}</p>}
        </div>

        {data && (
          <div className="card divide-y divide-ink-900/5 dark:divide-linen/10">
            {data.timeline.map((ev) => (
              <div key={ev.id} className="flex items-center gap-4 px-5 py-4">
                <span className="font-display text-xl text-sage-700 dark:text-sage-300 w-16 shrink-0">{ev.time}</span>
                <div>
                  <p className="text-sm font-medium text-ink-800 dark:text-linen">{ev.title}</p>
                  {ev.description && <p className="text-xs text-ink-400 mt-0.5">{ev.description}</p>}
                </div>
              </div>
            ))}
            {data.timeline.length === 0 && <p className="px-5 py-6 text-sm text-ink-400 text-center">O cronograma ainda não foi definido.</p>}
          </div>
        )}
        <p className="text-center text-xs text-ink-400 mt-8">Com carinho, {data?.couple_name_1} &amp; {data?.couple_name_2}</p>
      </div>
    </div>
  )
}
