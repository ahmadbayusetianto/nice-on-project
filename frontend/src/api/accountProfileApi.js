import { apiRequest } from './client'

export function fetchAccountProfile(pid) {
  return apiRequest(`/api/account-profile/${pid}`)
}

export function updateAccountProfile(pid, payload) {
  return apiRequest(`/api/account-profile/${pid}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function fetchUserActivityLog(pid, limit = 10) {
  return apiRequest(`/api/users/${pid}/activity-log?limit=${limit}`)
}

export function fetchLearningStreak(pid) {
  return apiRequest(`/api/users/${pid}/learning-streak`)
}

export function fetchTryoutHistory(pid) {
  return apiRequest(`/api/users/${pid}/tryout-history`)
}

export function fetchActivityCalendar(pid, month) {
  return apiRequest(`/api/users/${pid}/activity-calendar${month ? `?month=${month}` : ''}`)
}

export function fetchUserTransactions(pid) {
  return apiRequest(`/api/users/${pid}/transactions`)
}

export function changeAccountPassword(pid, payload) {
  return apiRequest(`/api/account-profile/${pid}/password`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}
