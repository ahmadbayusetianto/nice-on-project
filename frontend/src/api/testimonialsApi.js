import { BACKEND_URL, buildHttpErrorMessage, parseSafeJson } from './client'

export async function fetchAdminTestimonials({ search, status } = {}) {
  const query = new URLSearchParams()
  if (search) query.set('search', search)
  if (status && status !== 'Semua Status') query.set('status', status)

  const response = await fetch(`${BACKEND_URL}/api/admin/testimonials${query.toString() ? `?${query.toString()}` : ''}`, {
    credentials: 'include',
  })
  const { payload, rawBody } = await parseSafeJson(response)

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(payload, rawBody, response.status, 'Data testimoni gagal dimuat'))
  }

  return payload
}

export async function fetchAdminTestimoniDetail(pid) {
  const response = await fetch(`${BACKEND_URL}/api/admin/testimonials/${pid}`, {
    credentials: 'include',
  })
  const { payload, rawBody } = await parseSafeJson(response)

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(payload, rawBody, response.status, 'Detail testimoni gagal dimuat'))
  }

  return payload
}

export async function saveTestimoni(formData, { isEditMode, pid } = {}) {
  const response = await fetch(`${BACKEND_URL}/api/admin/testimonials${isEditMode ? `/${pid}` : ''}`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    body: formData,
  })
  const { payload, rawBody } = await parseSafeJson(response)

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(payload, rawBody, response.status, 'Testimoni gagal disimpan'))
  }

  return payload
}

export async function deleteTestimoni(pid) {
  const response = await fetch(`${BACKEND_URL}/api/admin/testimonials/${pid}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  })
  const { payload, rawBody } = await parseSafeJson(response)

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(payload, rawBody, response.status, 'Testimoni gagal dihapus'))
  }

  return payload
}

export async function toggleTestimoniStatus(pid) {
  const response = await fetch(`${BACKEND_URL}/api/admin/testimonials/${pid}/toggle`, {
    method: 'PATCH',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  })
  const { payload, rawBody } = await parseSafeJson(response)

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(payload, rawBody, response.status, 'Status testimoni gagal diperbarui'))
  }

  return payload
}
