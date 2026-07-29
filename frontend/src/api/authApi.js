import { apiRequest } from './client'

export function login({ email, password }) {
  return apiRequest('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function register({ email, password, confirmPassword, captchaToken, captchaAnswer }) {
  return apiRequest('/api/register', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      password_confirmation: confirmPassword,
      captchaToken,
      captchaAnswer,
    }),
  })
}

export function forgotPassword({ email }) {
  return apiRequest('/api/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function resetPassword({ token, email, password, confirmPassword }) {
  return apiRequest('/api/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      token,
      email,
      password,
      password_confirmation: confirmPassword,
    }),
  })
}

export function fetchCaptcha() {
  return apiRequest('/api/captcha')
}

export function completeProfile(payload) {
  return apiRequest('/api/complete-profile', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
