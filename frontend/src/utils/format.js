export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

export function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

export function formatFileSize(bytes) {
  const value = Number(bytes || 0)
  if (value <= 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  let size = value
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${new Intl.NumberFormat('id-ID', { maximumFractionDigits: unitIndex === 0 ? 0 : 1 }).format(size)} ${units[unitIndex]}`
}

export function formatAdminDate(value, options = {}) {
  if (!value) return '-'

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: options.hour === false ? undefined : '2-digit',
    minute: options.hour === false ? undefined : '2-digit',
    ...(options.hour === false ? { hour: undefined, minute: undefined } : {}),
  }).format(date)
}

export function formatProfileJoinDate(value) {
  if (!value) return 'Belum tersedia'

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return 'Belum tersedia'

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function formatTryoutCountdown(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function formatReferenceDisplay(detail = {}) {
  const reference = String(detail.refference ?? '').trim()
  const referenceOther = String(detail.reference_other ?? '').trim()

  if (!reference) return 'Belum diisi'
  if (reference === 'Lainnya' && referenceOther) return `Lainnya: ${referenceOther}`

  return reference
}

export function formatParameterValue(detail = {}) {
  const type = String(detail.tipe ?? 'text')
  const value = String(detail.nilai ?? '')

  if (type === 'boolean') {
    return value === '1' || value.toLowerCase() === 'true' ? 'Aktif' : 'Nonaktif'
  }

  return value || '-'
}

export function parseCurrencyToNumber(value) {
  const normalized = String(value ?? '')
    .replace(/[^\d]/g, '')
    .trim()

  return normalized ? Number(normalized) : ''
}
