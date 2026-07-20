import { BACKEND_URL, buildHttpErrorMessage, parseSafeJson } from './client'

export async function fetchCurrentTryout({ userId, includeDraft } = {}) {
  const response = await fetch(`${BACKEND_URL}/api/tryout/current?user_id=${userId}${includeDraft ? '&include_draft=1' : ''}`)
  const { payload, rawBody } = await parseSafeJson(response)

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(payload, rawBody, response.status, 'Sesi tryout gagal dimuat'))
  }

  return payload
}

export async function startTryout({ userId, packageId, jenisTryout }) {
  const response = await fetch(`${BACKEND_URL}/api/tryout/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      package_id: packageId,
      jenis_tryout: jenisTryout,
    }),
  })
  const { payload, rawBody } = await parseSafeJson(response)

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(payload, rawBody, response.status, 'Tryout gagal dimulai'))
  }

  return payload
}

export async function saveTryoutAnswer({ sessionId, userId, questionId, optionId }) {
  const response = await fetch(`${BACKEND_URL}/api/tryout/${sessionId}/answer`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      question_id: questionId,
      option_id: optionId,
    }),
  })
  const { payload, rawBody } = await parseSafeJson(response)

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(payload, rawBody, response.status, 'Jawaban gagal disimpan'))
  }

  return payload
}

export async function finishTryout({ sessionId, userId }) {
  const response = await fetch(`${BACKEND_URL}/api/tryout/${sessionId}/finish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ user_id: userId }),
  })
  const { payload, rawBody } = await parseSafeJson(response)

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(payload, rawBody, response.status, 'Tryout gagal diselesaikan'))
  }

  return payload
}
