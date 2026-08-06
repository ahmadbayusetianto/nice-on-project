import { BACKEND_URL, buildHttpErrorMessage, parseSafeJson } from './client'

const STATUS_QUERY_MAP = {
  Berhasil: 'paid',
  Menunggu: 'pending',
  Dibatalkan: 'cancelled',
}

export async function fetchAdminTransactions({ search, status, program } = {}) {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (status && status !== 'Semua Status') params.set('status', STATUS_QUERY_MAP[status])
  if (program && program !== 'Semua Program') params.set('program', program)

  const response = await fetch(`${BACKEND_URL}/api/admin/transactions${params.toString() ? `?${params.toString()}` : ''}`, {
    credentials: 'include',
  })
  const { payload, rawBody } = await parseSafeJson(response)

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(payload, rawBody, response.status, 'Data transaksi gagal dimuat'))
  }

  return payload
}
