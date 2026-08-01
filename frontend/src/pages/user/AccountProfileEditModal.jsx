import { useEffect, useState } from 'react'
import { updateAccountProfile } from '../../api/accountProfileApi'

const REFERENCE_OPTIONS = ['Instagram', 'Teman', 'Google', 'TikTok', 'YouTube', 'Sekolah/Kampus', 'Lainnya']

function sanitizePhoneNumber(value) {
  const normalized = String(value ?? '').replace(/[^0-9+]/g, '')
  if (!normalized.includes('+')) return normalized

  const leadingPlus = normalized.startsWith('+') ? '+' : ''
  const digitsOnly = normalized.slice(leadingPlus ? 1 : 0).replace(/\+/g, '')
  return `${leadingPlus}${digitsOnly}`
}

function buildFormFromDetail(detail) {
  return {
    nama: detail?.nama ?? '',
    ttl: detail?.ttl ?? '',
    gender: detail?.gender ?? '',
    nohp: detail?.nohp ?? '',
    alamat: detail?.alamat ?? '',
    refference: detail?.refference ?? '',
    reference_other: detail?.reference_other ?? '',
  }
}

export default function AccountProfileEditModal({ open, onClose, profile, isAdminProfile = false, onSaved }) {
  const [form, setForm] = useState(() => buildFormFromDetail(profile?.detail))
  const [fieldErrors, setFieldErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    if (open) {
      setForm(buildFormFromDetail(profile?.detail))
      setFieldErrors({})
      setSubmitError(null)
    }
  }, [open, profile])

  if (!open) return null

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!profile?.pid) return

    setIsSaving(true)
    setSubmitError(null)

    try {
      const payload = {
        ...form,
        reference_other: form.refference === 'Lainnya' ? form.reference_other : '',
      }
      const response = await updateAccountProfile(profile.pid, payload)
      onSaved?.(response?.data)
      onClose()
    } catch (error) {
      setFieldErrors(error?.errors ?? {})
      setSubmitError(error instanceof Error ? error.message : 'Profil gagal disimpan.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="account-profile-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="account-profile-modal" role="dialog" aria-modal="true" aria-labelledby="accountProfileEditTitle" onClick={(event) => event.stopPropagation()}>
        <div className="account-profile-modal-head">
          <div>
            <p className="account-profile-modal-kicker">Edit Profile</p>
            <h3 id="accountProfileEditTitle">Edit Data Profil</h3>
          </div>
          <button type="button" className="account-profile-modal-close" onClick={onClose} aria-label="Tutup">×</button>
        </div>

        <p className="account-profile-modal-note">
          Perbarui data pribadi Anda. Klik simpan untuk menyimpan perubahan.
        </p>

        {submitError ? <div className="account-profile-modal-error">{submitError}</div> : null}

        <form onSubmit={handleSubmit}>
          <div className="account-profile-modal-grid">
            <label className="account-profile-field">
              <span>Nama</span>
              <input type="text" value={form.nama} onChange={(event) => updateField('nama', event.target.value)} disabled={isSaving} />
              {fieldErrors.nama ? <span className="account-profile-field-error">{fieldErrors.nama[0]}</span> : null}
            </label>

            <label className="account-profile-field">
              <span>Tempat, Tanggal Lahir</span>
              <input type="text" placeholder="Contoh: Jakarta, 01-01-2000" value={form.ttl} onChange={(event) => updateField('ttl', event.target.value)} disabled={isSaving} />
              {fieldErrors.ttl ? <span className="account-profile-field-error">{fieldErrors.ttl[0]}</span> : null}
            </label>

            <label className="account-profile-field">
              <span>Jenis Kelamin</span>
              <select value={form.gender} onChange={(event) => updateField('gender', event.target.value)} disabled={isSaving}>
                <option value="">Belum diisi</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
              {fieldErrors.gender ? <span className="account-profile-field-error">{fieldErrors.gender[0]}</span> : null}
            </label>

            <label className="account-profile-field">
              <span>No. HP</span>
              <input
                type="tel"
                inputMode="numeric"
                value={form.nohp}
                onChange={(event) => updateField('nohp', sanitizePhoneNumber(event.target.value))}
                disabled={isSaving}
              />
              {fieldErrors.nohp ? <span className="account-profile-field-error">{fieldErrors.nohp[0]}</span> : null}
            </label>

            <label className="account-profile-field account-profile-field-full">
              <span>Alamat</span>
              <textarea value={form.alamat} onChange={(event) => updateField('alamat', event.target.value)} disabled={isSaving} rows={3} />
              {fieldErrors.alamat ? <span className="account-profile-field-error">{fieldErrors.alamat[0]}</span> : null}
            </label>

            {isAdminProfile ? null : (
              <>
                <label className="account-profile-field">
                  <span>Referensi</span>
                  <select value={form.refference} onChange={(event) => updateField('refference', event.target.value)} disabled={isSaving}>
                    <option value="">Belum diisi</option>
                    {REFERENCE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {fieldErrors.refference ? <span className="account-profile-field-error">{fieldErrors.refference[0]}</span> : null}
                </label>

                {form.refference === 'Lainnya' ? (
                  <label className="account-profile-field">
                    <span>Referensi Lainnya</span>
                    <input type="text" value={form.reference_other} onChange={(event) => updateField('reference_other', event.target.value)} disabled={isSaving} />
                    {fieldErrors.reference_other ? <span className="account-profile-field-error">{fieldErrors.reference_other[0]}</span> : null}
                  </label>
                ) : null}
              </>
            )}
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
