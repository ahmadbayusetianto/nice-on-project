import { logout as logoutRequest } from '../api/authApi'

const AUTH_STORAGE_KEY = 'niceon.auth.user'
const ADMIN_SIDEBAR_COLLAPSED_KEY = 'niceon.admin.sidebarCollapsed'
const SANDBOX_ADMIN_STORAGE_KEY = 'niceon.sandbox.admin'

export function readStoredUser() {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.sessionStorage.getItem(AUTH_STORAGE_KEY)
    if (raw) return JSON.parse(raw)

    const fallbackRaw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    return fallbackRaw ? JSON.parse(fallbackRaw) : null
  } catch {
    return null
  }
}

export function storeAuthUser(user) {
  if (typeof window === 'undefined') return

  const value = JSON.stringify(user ?? null)

  try {
    window.sessionStorage.setItem(AUTH_STORAGE_KEY, value)
  } catch {
    // Ignore storage failures and keep the in-memory route state.
  }

  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, value)
  } catch {
    // Ignore storage failures and keep the in-memory route state.
  }
}

export function clearAuthUser() {
  if (typeof window === 'undefined') return

  logoutRequest().catch(() => {
    // Best-effort: proceed with clearing local state even if the server call fails.
  })

  try {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
    // Ignore storage failures.
  }

  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
    // Ignore storage failures.
  }

  try {
    window.sessionStorage.removeItem(SANDBOX_ADMIN_STORAGE_KEY)
  } catch {
    // Ignore storage failures.
  }
}

export function readStoredSandboxAdminMode() {
  if (typeof window === 'undefined') return false

  try {
    return window.sessionStorage.getItem(SANDBOX_ADMIN_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function storeSandboxAdminMode() {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.setItem(SANDBOX_ADMIN_STORAGE_KEY, '1')
  } catch {
    // Ignore storage failures.
  }
}

export function readStoredAdminSidebarState() {
  if (typeof window === 'undefined') return false

  try {
    return window.localStorage.getItem(ADMIN_SIDEBAR_COLLAPSED_KEY) === 'true'
  } catch {
    return false
  }
}

export function storeAdminSidebarState(isCollapsed) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(ADMIN_SIDEBAR_COLLAPSED_KEY, String(isCollapsed))
  } catch {
    // Ignore storage failures.
  }
}
