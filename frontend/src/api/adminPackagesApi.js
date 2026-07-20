import { BACKEND_URL, buildHttpErrorMessage, parseSafeJson } from './client'

export async function fetchAdminPackages({ kategori } = {}) {
  const query = new URLSearchParams()
  if (kategori && kategori !== 'Semua Program') query.set('kategori', kategori)

  const response = await fetch(`${BACKEND_URL}/api/admin/packages${query.toString() ? `?${query.toString()}` : ''}`)
  const { payload, rawBody } = await parseSafeJson(response)

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(payload, rawBody, response.status, 'Data paket gagal dimuat'))
  }

  return payload
}

export async function fetchAdminPackageDetail(pid) {
  const response = await fetch(`${BACKEND_URL}/api/admin/packages/${pid}`)
  const { payload, rawBody } = await parseSafeJson(response)

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(payload, rawBody, response.status, 'Detail paket gagal dimuat'))
  }

  return payload
}

export async function saveAdminPackage(form, { isEditMode, pid } = {}) {
  const response = await fetch(`${BACKEND_URL}/api/admin/packages${isEditMode ? `/${pid}` : ''}`, {
    method: isEditMode ? 'PUT' : 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(form),
  })
  const { payload, rawBody } = await parseSafeJson(response)

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(payload, rawBody, response.status, 'Paket gagal disimpan'))
  }

  return payload
}

export async function deleteAdminPackage(pid) {
  const response = await fetch(`${BACKEND_URL}/api/admin/packages/${pid}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  })
  const { payload, rawBody } = await parseSafeJson(response)

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(payload, rawBody, response.status, 'Paket gagal dihapus'))
  }

  return payload
}
