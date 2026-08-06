import { BACKEND_URL, buildHttpErrorMessage, parseSafeJson } from './client'

export async function fetchQuestions({ search, group, type, includeTrashed } = {}) {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (group && group !== 'Semua Grup') params.set('group', group)
  if (type && type !== 'Semua Tipe') params.set('type', type)
  if (includeTrashed) params.set('include_trashed', 'true')

  const response = await fetch(`${BACKEND_URL}/api/admin/questions${params.toString() ? `?${params.toString()}` : ''}`, {
    credentials: 'include',
  })
  const { payload, rawBody } = await parseSafeJson(response)

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(payload, rawBody, response.status, 'Data soal gagal dimuat'))
  }

  return payload
}

export async function fetchQuestionDetail(id) {
  const response = await fetch(`${BACKEND_URL}/api/admin/questions/${id}`, {
    credentials: 'include',
  })
  const { payload, rawBody } = await parseSafeJson(response)

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(payload, rawBody, response.status, 'Detail soal gagal dimuat'))
  }

  return payload
}

export async function saveQuestion(formData, { isEditMode, id } = {}) {
  const response = await fetch(`${BACKEND_URL}/api/admin/questions${isEditMode ? `/${id}` : ''}`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    body: formData,
  })
  const { payload, rawBody } = await parseSafeJson(response)

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(payload, rawBody, response.status, 'Soal gagal disimpan'))
  }

  return payload
}

export async function deleteQuestion(id) {
  const response = await fetch(`${BACKEND_URL}/api/admin/questions/${id}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  })
  const { payload, rawBody } = await parseSafeJson(response)

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(payload, rawBody, response.status, 'Soal gagal dihapus'))
  }

  return payload
}

export async function restoreQuestion(id) {
  const response = await fetch(`${BACKEND_URL}/api/admin/questions/${id}/restore`, {
    method: 'PATCH',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  })
  const { payload, rawBody } = await parseSafeJson(response)

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(payload, rawBody, response.status, 'Soal gagal dipulihkan'))
  }

  return payload
}

export async function fetchSandboxPaket() {
  const response = await fetch(`${BACKEND_URL}/api/admin/ref-paket`, {
    credentials: 'include',
  })
  const { payload, rawBody } = await parseSafeJson(response)

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(payload, rawBody, response.status, 'Data paket sandbox gagal dimuat'))
  }

  return payload
}

export function fetchRefPaketByPid(pid) {
  return fetch(`${BACKEND_URL}/api/admin/ref-paket?pid=${encodeURIComponent(pid)}`, {
    credentials: 'include',
  })
    .then((response) => response.json().catch(() => null))
}

export function fetchRefPaketByBundle(bundleName) {
  return fetch(`${BACKEND_URL}/api/admin/ref-paket?bundle=${encodeURIComponent(bundleName)}`, {
    credentials: 'include',
  })
    .then((response) => response.json().catch(() => null))
}

export function fetchQuestionGroups({ type, packageId } = {}) {
  const params = new URLSearchParams({ type })
  if (packageId) params.set('package_id', String(packageId))

  return fetch(`${BACKEND_URL}/api/admin/question-groups?${params.toString()}`, {
    credentials: 'include',
  })
    .then((response) => response.json().catch(() => null).then((payload) => ({ ok: response.ok, payload })))
}

export async function createQuestionGroup(payload) {
  const response = await fetch(`${BACKEND_URL}/api/admin/question-groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  const responsePayload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(responsePayload?.message || 'Gagal menambah grup.')
  return responsePayload
}

export async function updateQuestionGroup(id, payload) {
  const response = await fetch(`${BACKEND_URL}/api/admin/question-groups/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  const responsePayload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(responsePayload?.message || 'Gagal mengubah grup.')
  return responsePayload
}

export async function deleteQuestionGroup(id) {
  const response = await fetch(`${BACKEND_URL}/api/admin/question-groups/${id}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  })
  const responsePayload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(responsePayload?.message || 'Gagal menghapus grup.')
  return responsePayload
}

export async function startSandboxTryout(payload) {
  const response = await fetch(`${BACKEND_URL}/api/admin/tryout-sandbox/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  const { payload: responsePayload, rawBody } = await parseSafeJson(response)

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(responsePayload, rawBody, response.status, 'Sandbox tryout gagal dibuat'))
  }

  return responsePayload
}
