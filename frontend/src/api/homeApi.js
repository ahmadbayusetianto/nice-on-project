import { apiRequest } from './client'

export function fetchPackages({ kategori, userId } = {}) {
  const query = new URLSearchParams()
  if (kategori && kategori !== 'ALL') query.set('kategori', kategori)
  if (userId) query.set('user_id', userId)

  return apiRequest(`/api/packages${query.toString() ? `?${query.toString()}` : ''}`)
}

export function fetchFaqs() {
  return apiRequest('/api/faqs')
}
