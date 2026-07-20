export function getFriendlyFetchError(error, fallbackMessage) {
  const message = error instanceof Error ? error.message : ''
  const normalized = message.toLowerCase()

  if (normalized.includes('failed to fetch') || normalized.includes('networkerror') || normalized.includes('load failed') || normalized.includes('fetch failed')) {
    return 'Backend tidak dapat dijangkau. Pastikan server Laravel berjalan di https://api.niceon.id.'
  }

  return message || fallbackMessage
}
