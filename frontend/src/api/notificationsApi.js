import { apiRequest } from './client'

export function fetchDashboardSummary() {
  return apiRequest('/api/admin/dashboard-summary')
}

export function fetchAdminNotifications(adminUserId, limit = 8) {
  return apiRequest(`/api/admin/notifications?admin_user_id=${adminUserId}&limit=${limit}`)
}

export function markNotificationRead(adminUserId, notificationId) {
  return apiRequest(`/api/admin/notifications/${notificationId}/read`, {
    method: 'PATCH',
    body: JSON.stringify({ admin_user_id: adminUserId }),
  })
}

export function markAllNotificationsRead(adminUserId) {
  return apiRequest('/api/admin/notifications/read-all', {
    method: 'PATCH',
    body: JSON.stringify({ admin_user_id: adminUserId }),
  })
}
