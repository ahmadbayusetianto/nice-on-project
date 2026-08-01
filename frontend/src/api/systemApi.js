import { apiRequest } from './client'

export function fetchSystemHealth() {
  return apiRequest('/api/health')
}
