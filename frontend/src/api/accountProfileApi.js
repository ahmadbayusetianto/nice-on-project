import { apiRequest } from './client'

export function fetchAccountProfile(pid) {
  return apiRequest(`/api/account-profile/${pid}`)
}

export function fetchUserActivityLog(pid, limit = 10) {
  return apiRequest(`/api/users/${pid}/activity-log?limit=${limit}`)
}
