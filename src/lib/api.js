const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : undefined,
    ...options,
  })
  if (!res.ok) {
    let message = `Erro ${res.status}`
    try {
      const data = await res.json()
      message = data.error || message
    } catch {}
    throw new Error(message)
  }
  if (res.status === 204) return null
  return res.json()
}

const get = (path) => request(path)
const post = (path, body) => request(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) })
const put = (path, body) => request(path, { method: 'PUT', body: body instanceof FormData ? body : JSON.stringify(body) })
const del = (path) => request(path, { method: 'DELETE' })

export const api = {
  auth: {
    status: () => get('/auth/status'),
    logout: () => post('/auth/logout'),
  },
  settings: {
    get: () => get('/settings'),
    update: (data) => put('/settings', data),
    uploadPhoto: (key, file) => {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('key', key)
      return post('/settings/photo', fd)
    },
  },
  guests: {
    list: () => get('/guests'),
    stats: () => get('/guests/stats'),
    create: (data) => post('/guests', data),
    update: (id, data) => put(`/guests/${id}`, data),
    remove: (id) => del(`/guests/${id}`),
    import: (guests) => post('/guests/import', { guests }),
  },
  tasks: {
    list: () => get('/tasks'),
    create: (data) => post('/tasks', data),
    update: (id, data) => put(`/tasks/${id}`, data),
    remove: (id) => del(`/tasks/${id}`),
    reorder: (items) => post('/tasks/reorder', { items }),
  },
  vendors: {
    list: () => get('/vendors'),
    create: (data) => post('/vendors', data),
    update: (id, data) => put(`/vendors/${id}`, data),
    remove: (id) => del(`/vendors/${id}`),
    addPayment: (id, data) => post(`/vendors/${id}/payments`, data),
    updatePayment: (id, paymentId, data) => put(`/vendors/${id}/payments/${paymentId}`, data),
    removePayment: (id, paymentId) => del(`/vendors/${id}/payments/${paymentId}`),
    uploadAttachment: (id, file) => {
      const fd = new FormData()
      fd.append('file', file)
      return post(`/vendors/${id}/attachments`, fd)
    },
    removeAttachment: (id, attachmentId) => del(`/vendors/${id}/attachments/${attachmentId}`),
  },
  budgetCategories: {
    list: () => get('/budget-categories'),
    create: (data) => post('/budget-categories', data),
    update: (id, data) => put(`/budget-categories/${id}`, data),
    remove: (id) => del(`/budget-categories/${id}`),
  },
  expenses: {
    list: () => get('/expenses'),
    create: (data) => post('/expenses', data),
    update: (id, data) => put(`/expenses/${id}`, data),
    remove: (id) => del(`/expenses/${id}`),
  },
  timeline: {
    list: () => get('/timeline'),
    create: (data) => post('/timeline', data),
    update: (id, data) => put(`/timeline/${id}`, data),
    remove: (id) => del(`/timeline/${id}`),
    reorder: (items) => post('/timeline/reorder', { items }),
  },
  seatingTables: {
    list: () => get('/seating-tables'),
    create: (data) => post('/seating-tables', data),
    update: (id, data) => put(`/seating-tables/${id}`, data),
    remove: (id) => del(`/seating-tables/${id}`),
  },
  gifts: {
    list: () => get('/gifts'),
    create: (data) => post('/gifts', data),
    update: (id, data) => put(`/gifts/${id}`, data),
    remove: (id) => del(`/gifts/${id}`),
  },
  moodboard: {
    list: () => get('/moodboard'),
    create: (category, caption, file) => {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('category', category)
      if (caption) fd.append('caption', caption)
      return post('/moodboard', fd)
    },
    remove: (id) => del(`/moodboard/${id}`),
  },
  documents: {
    list: () => get('/documents'),
    create: (category, notes, file) => {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('category', category)
      if (notes) fd.append('notes', notes)
      return post('/documents', fd)
    },
    remove: (id) => del(`/documents/${id}`),
  },
  publicRsvp: {
    info: (token) => get(`/public/rsvp/${token}`),
    search: (token, q) => get(`/public/rsvp/${token}/search?q=${encodeURIComponent(q)}`),
    confirm: (token, guestId, data) => post(`/public/rsvp/${token}/${guestId}`, data),
  },
  publicShare: {
    info: (token) => get(`/public/share/${token}`),
  },
  backup: {
    downloadUrl: () => `${BASE}/backup/download`,
    exportUrl: () => `${BASE}/backup/export.json`,
    regenerateToken: (kind) => post('/backup/regenerate-token', { kind }),
  },
}
