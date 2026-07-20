import { apiRequest } from './client'

export function fetchUsers() {
  return apiRequest('/api/admin/users')
}

export function fetchUserDetail(pid) {
  return apiRequest(`/api/admin/users/${pid}`)
}

export function toggleUserRole(pid) {
  return apiRequest(`/api/admin/users/${pid}/toggle-role`, { method: 'PATCH' })
}

export function saveUser(payload, { isCreateMode, pid } = {}) {
  return apiRequest(`/api/admin/users${isCreateMode ? '' : `/${pid}`}`, {
    method: isCreateMode ? 'POST' : 'PUT',
    body: JSON.stringify(payload),
  })
}
