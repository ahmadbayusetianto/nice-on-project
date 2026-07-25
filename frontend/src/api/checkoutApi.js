import { apiRequest } from './client'

export function createCheckout({ pidUser, pidPaket }) {
  return apiRequest('/api/checkout', {
    method: 'POST',
    body: JSON.stringify({ pid_user: pidUser, pid_paket: pidPaket }),
  })
}
