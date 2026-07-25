import { useEffect } from 'react'

function LockIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path d="M16 21v-5a8 8 0 0 1 16 0v5" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
      <rect x="11" y="21" width="26" height="19" rx="5" fill="currentColor" />
      <rect x="21.5" y="27" width="5" height="8" rx="2.5" fill="#fff" />
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <circle cx="24" cy="16" r="7" fill="none" stroke="currentColor" strokeWidth="3.4" />
      <path d="M10 39c1.8-8 7-12 14-12s12.2 4 14 12" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
    </svg>
  )
}

export default function AuthRequiredModal({ open, onCancel, onLogin, onRegister }) {
  useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="auth-required-backdrop" role="presentation" onClick={onCancel}>
      <div className="auth-required-modal" role="dialog" aria-modal="true" aria-labelledby="authRequiredTitle" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="auth-required-close" aria-label="Tutup" onClick={onCancel}>×</button>

        <div className="auth-required-visual">
          <span className="auth-required-ring" aria-hidden="true" />
          <span className="auth-required-dot dot-1" aria-hidden="true" />
          <span className="auth-required-dot dot-2" aria-hidden="true" />
          <span className="auth-required-dot dot-3" aria-hidden="true" />
          <div className="auth-required-badge">
            <LockIcon />
          </div>
        </div>

        <h3 id="authRequiredTitle" className="auth-required-title">Masuk untuk melanjutkan</h3>
        <p className="auth-required-text">Kamu harus login atau daftar terlebih dahulu untuk membeli paket ini.</p>

        <div className="auth-required-footer">
          <button type="button" className="auth-required-action secondary" onClick={onRegister}>
            <PersonIcon />
            <span>Daftar</span>
          </button>
          <button type="button" className="auth-required-action primary" onClick={onLogin}>
            <LockIcon />
            <span>Masuk</span>
          </button>
        </div>
      </div>
    </div>
  )
}
