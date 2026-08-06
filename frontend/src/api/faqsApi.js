import { BACKEND_URL, buildHttpErrorMessage, parseSafeJson } from './client'

export async function fetchAdminFaqs({ search, category, status } = {}) {
  const query = new URLSearchParams()
  if (search) query.set('search', search)
  if (category && category !== 'Semua Kategori') query.set('category', category)
  if (status && status !== 'Semua Status') query.set('status', status)

  const response = await fetch(`${BACKEND_URL}/api/admin/faqs${query.toString() ? `?${query.toString()}` : ''}`, {
    credentials: 'include',
  })
  const { payload, rawBody } = await parseSafeJson(response)

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(payload, rawBody, response.status, 'Data FAQ gagal dimuat'))
  }

  return payload
}

export async function fetchAdminFaqDetail(pid) {
  const response = await fetch(`${BACKEND_URL}/api/admin/faqs/${pid}`, {
    credentials: 'include',
  })
  const { payload, rawBody } = await parseSafeJson(response)

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(payload, rawBody, response.status, 'Detail FAQ gagal dimuat'))
  }

  return payload
}

export async function saveFaq(form, { isEditMode, pid } = {}) {
  const response = await fetch(`${BACKEND_URL}/api/admin/faqs${isEditMode ? `/${pid}` : ''}`, {
    method: isEditMode ? 'PUT' : 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(form),
  })
  const { payload, rawBody } = await parseSafeJson(response)

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(payload, rawBody, response.status, 'FAQ gagal disimpan'))
  }

  return payload
}

export async function deleteFaq(pid) {
  const response = await fetch(`${BACKEND_URL}/api/admin/faqs/${pid}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  })
  const { payload, rawBody } = await parseSafeJson(response)

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(payload, rawBody, response.status, 'FAQ gagal dihapus'))
  }

  return payload
}

export async function toggleFaqStatus(pid) {
  const response = await fetch(`${BACKEND_URL}/api/admin/faqs/${pid}/toggle`, {
    method: 'PATCH',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  })
  const { payload, rawBody } = await parseSafeJson(response)

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(payload, rawBody, response.status, 'Status FAQ gagal diperbarui'))
  }

  return payload
}
