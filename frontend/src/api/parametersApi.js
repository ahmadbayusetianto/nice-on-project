import { BACKEND_URL, buildHttpErrorMessage, parseSafeJson } from './client'

export async function fetchParameters({ search, category, status } = {}) {
  const query = new URLSearchParams()
  if (search) query.set('search', search)
  if (category && category !== 'Semua Kategori') query.set('category', category)
  if (status && status !== 'Semua Status') query.set('status', status)

  const response = await fetch(`${BACKEND_URL}/api/admin/parameters${query.toString() ? `?${query.toString()}` : ''}`, {
    credentials: 'include',
  })
  const { payload, rawBody } = await parseSafeJson(response)

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(payload, rawBody, response.status, 'Data parameter gagal dimuat'))
  }

  return payload
}

export async function fetchParameterDetail(pid) {
  const response = await fetch(`${BACKEND_URL}/api/admin/parameters/${pid}`, {
    credentials: 'include',
  })
  const { payload, rawBody } = await parseSafeJson(response)

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(payload, rawBody, response.status, 'Detail parameter gagal dimuat'))
  }

  return payload
}

export async function saveParameter(form, { isEditMode, pid } = {}) {
  const response = await fetch(`${BACKEND_URL}/api/admin/parameters${isEditMode ? `/${pid}` : ''}`, {
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
    throw new Error(buildHttpErrorMessage(payload, rawBody, response.status, 'Parameter gagal disimpan'))
  }

  return payload
}
