import { BACKEND_URL, buildHttpErrorMessage, parseSafeJson } from './client'

export async function fetchAdminMaterials({ search, packageId, status } = {}) {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (packageId && packageId !== 'ALL') params.set('package_id', packageId)
  if (status && status !== 'ALL') params.set('status', status)

  const response = await fetch(`${BACKEND_URL}/api/admin/materials${params.toString() ? `?${params.toString()}` : ''}`)
  const { payload, rawBody } = await parseSafeJson(response)

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(payload, rawBody, response.status, 'Data materi gagal dimuat'))
  }

  return payload
}

export async function fetchAdminMaterialDetail(pid) {
  const response = await fetch(`${BACKEND_URL}/api/admin/materials/${pid}`)
  const { payload, rawBody } = await parseSafeJson(response)

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(payload, rawBody, response.status, 'Detail materi gagal dimuat'))
  }

  return payload
}

export async function saveMaterial(formData, { isEditMode, pid } = {}) {
  const response = await fetch(`${BACKEND_URL}/api/admin/materials${isEditMode ? `/${pid}` : ''}`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: formData,
  })
  const { payload, rawBody } = await parseSafeJson(response)

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(payload, rawBody, response.status, 'Materi gagal disimpan'))
  }

  return payload
}

export async function deleteMaterial(pid) {
  const response = await fetch(`${BACKEND_URL}/api/admin/materials/${pid}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  })
  const { payload, rawBody } = await parseSafeJson(response)

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(payload, rawBody, response.status, 'Materi gagal dihapus'))
  }

  return payload
}

export async function fetchUserMaterials({ userId, search, packageId } = {}) {
  const params = new URLSearchParams({ user_id: String(userId) })
  if (search) params.set('search', search)
  if (packageId && packageId !== 'ALL') params.set('package_id', packageId)

  const response = await fetch(`${BACKEND_URL}/api/materials?${params.toString()}`)
  const { payload, rawBody } = await parseSafeJson(response)

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(payload, rawBody, response.status, 'Data materi gagal dimuat'))
  }

  return payload
}
