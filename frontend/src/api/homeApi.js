import { apiRequest } from './client'

export function fetchPackages() {
  return apiRequest('/api/packages')
}

export function fetchFaqs() {
  return apiRequest('/api/faqs')
}
