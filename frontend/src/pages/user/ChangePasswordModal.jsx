import { useEffect, useState } from 'react'
import { changeAccountPassword } from '../../api/accountProfileApi'

const EMPTY_FORM = { current_password: '', password: '', password_confirmation: '' }

export default function ChangePasswordModal({ open, onClose, pid, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM)
      setFieldErrors({})
      setSubmitError(null)
    }
  }, [open])

  if (!open) return null

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!pid) return

    setIsSaving(true)
    setSubmitError(null)

    try {
      await changeAccountPassword(pid, form)
      onSaved?.()
      onClose()
    } catch (error) {
      setFieldErrors(error?.errors ?? {})
      setSubmitError(error instanceof Error ? error.message : 'Password gagal diperbarui.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="account-profile-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="account-profile-modal" role="dialog" aria-modal="true" aria-labelledby="changePasswordTitle" onClick={(event) => event.stopPropagation()}>
        <div className="account-profile-modal-head">
          <div>
            <p className="account-profile-modal-kicker">Keamanan Akun</p>
            <h3 id="changePasswordTitle">Ubah Password</h3>
          </div>
          <button type="button" className="account-profile-modal-close" onClick={onClose} aria-label="Tutup">×</button>
        </div>

        <p className="account-profile-modal-note">
          Masukkan password saat ini, lalu tentukan password baru Anda.
        </p>

        {submitError ? <div className="account-profile-modal-error">{submitError}</div> : null}

        <form onSubmit={handleSubmit}>
          <div className="account-profile-modal-grid">
            <label className="account-profile-field account-profile-field-full">
              <span>Password Saat Ini</span>
              <input
                type="password"
                autoComplete="current-password"
                value={form.current_password}
                onChange={(event) => updateField('current_password', event.target.value)}
                disabled={isSaving}
              />
              {fieldErrors.current_password ? <span className="account-profile-field-error">{fieldErrors.current_password[0]}</span> : null}
            </label>

            <label className="account-profile-field">
              <span>Password Baru</span>
              <input
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                disabled={isSaving}
              />
              {fieldErrors.password ? <span className="account-profile-field-error">{fieldErrors.password[0]}</span> : null}
            </label>

            <label className="account-profile-field">
              <span>Konfirmasi Password Baru</span>
              <input
                type="password"
                autoComplete="new-password"
                value={form.password_confirmation}
                onChange={(event) => updateField('password_confirmation', event.target.value)}
                disabled={isSaving}
              />
            </label>
          </div>

          <div className="account-profile-modal-actions">
            <button type="button" className="dashboard-secondary-action" onClick={onClose} disabled={isSaving}>Tutup</button>
            <button type="submit" className="register-btn" disabled={isSaving}>{isSaving ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
