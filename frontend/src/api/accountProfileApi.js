import { apiRequest } from './client'

export function fetchAccountProfile(pid) {
  return apiRequest(`/api/account-profile/${pid}`)
}
