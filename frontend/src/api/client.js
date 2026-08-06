const DEFAULT_BACKEND_URL = import.meta.env.PROD ? 'https://api.niceon.id' : 'http://localhost:8000'

export const BACKEND_URL = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_BACKEND_URL

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  let payload = null
  try {
    payload = await response.json()
  } catch {
    // Non-JSON or empty body; treat as no payload.
  }

  if (!response.ok) {
    const error = new Error(payload?.message || `Request failed with status ${response.status}`)
    error.status = response.status
    error.errors = payload?.errors ?? null
    error.payload = payload
    throw error
  }

  return payload
}

export async function parseSafeJson(response) {
  const contentType = response.headers.get('content-type') || ''
  const rawBody = await response.text()
  const payload = contentType.includes('application/json') && rawBody ? JSON.parse(rawBody) : null
  return { payload, rawBody }
}

export function buildHttpErrorMessage(payload, rawBody, status, fallback) {
  return payload?.message || rawBody?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || `${fallback} (HTTP ${status}).`
}
