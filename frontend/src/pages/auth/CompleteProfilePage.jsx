import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import niceonImage from '../../../../niceon.png'
import { completeProfile } from '../../api/authApi'
import './CompleteProfilePage.css'

export default function CompleteProfilePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const registeredUser = location.state?.registeredUser
  const [form, setForm] = useState({
    nama: '',
    ttl: '',
    gender: '',
    nohp: '',
    alamat: '',
    refference: '',
    referenceOther: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitMessage, setSubmitMessage] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const onboardingSteps = [
    { number: '1', label: 'Buat Akun', state: 'complete' },
    { number: '2', label: 'Lengkapi Profil', state: 'current' },
    { number: '3', label: 'Mulai Belajar', state: 'pending' },
  ]
  const referenceOptions = ['Instagram', 'Teman', 'Google', 'TikTok', 'YouTube', 'Sekolah/Kampus', 'Lainnya']
  const completedOnboardingSteps = onboardingSteps.filter((step) => step.state === 'complete').length
  const profileProgress = Math.round((completedOnboardingSteps / onboardingSteps.length) * 100)

  const sanitizePhoneNumber = (value) => {
    const normalized = String(value ?? '').replace(/[^0-9+]/g, '')
    if (!normalized.includes('+')) return normalized

    const leadingPlus = normalized.startsWith('+') ? '+' : ''
    const digitsOnly = normalized.slice(leadingPlus ? 1 : 0).replace(/\+/g, '')
    return `${leadingPlus}${digitsOnly}`
  }

  const updateField = (field) => (event) => {
    const value = event.target.value
    setForm((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleCompleteProfileSubmit = async (event) => {
    event.preventDefault()

    if (!registeredUser?.pid) {
      setSubmitMessage({ type: 'error', text: 'Data akun tidak ditemukan. Ulangi proses register terlebih dahulu.' })
      return
    }

    setIsSubmitting(true)
    setFieldErrors({})
    setSubmitMessage(null)

    try {
      const payload = await completeProfile({
        pid_user: registeredUser.pid,
        nama: form.nama,
        ttl: form.ttl,
        gender: form.gender,
        nohp: form.nohp,
        alamat: form.alamat,
        refference: form.refference,
        reference_other: form.refference === 'Lainnya' ? form.referenceOther : '',
      })

      setSubmitMessage({ type: 'success', text: payload.message ?? 'Profil berhasil disimpan.' })
      window.setTimeout(() => {
        navigate('/login')
      }, 900)
    } catch (error) {
      if (error.status) {
        setFieldErrors(error.errors ?? {})
        setSubmitMessage({ type: 'error', text: error.message ?? 'Profil gagal disimpan.' })
      } else {
        setSubmitMessage({ type: 'error', text: 'Tidak bisa terhubung ke server profil.' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page auth-page-blue onboarding-page complete-profile-page">
      <div className="complete-profile-shell">
        <header className="complete-profile-hero onboarding-surface-card">
          <div className="complete-profile-hero-copy">
            <div className="onboarding-success-pill complete-profile-badge">Almost there</div>
            <h1>Bagus, akunmu sudah siap. Tinggal lengkapi profil untuk lanjut belajar.</h1>
            <p>Kami siapkan langkah onboarding yang lebih rapi supaya pengalaman belajarmu terasa lebih personal dan terarah.</p>

            <div className="complete-profile-stepper" aria-label="Progress onboarding">
              {onboardingSteps.map((step) => (
                <div key={step.label} className={`complete-profile-step is-${step.state}`}>
                  <span>{step.state === 'complete' ? '✓' : step.number}</span>
                  <strong>{step.label}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="complete-profile-progress-wrap" aria-label="Progress selesai 25 persen">
            <div className="complete-profile-progress-ring" style={{ '--progress-angle': `${profileProgress * 3.6}deg` }}>
              <div className="complete-profile-progress-inner">
                <strong>{profileProgress}%</strong>
                <span>Selesai</span>
              </div>
            </div>
          </div>
        </header>

        <div className="complete-profile-grid">
          <aside className="onboarding-summary-panel onboarding-summary-surface complete-profile-side-card">
            <img src={niceonImage} alt="Nice On" className="onboarding-stage-logo" />
            <p className="onboarding-stage-kicker">Next Step</p>
            <h2>Lengkapi identitas dasar agar pengalaman belajar lebih pas.</h2>

            <div className="onboarding-summary-grid complete-profile-summary-grid">
              <div className="onboarding-summary-card">
                <span>Email Terdaftar</span>
                <strong>{registeredUser?.email ?? 'Belum tersedia'}</strong>
              </div>
              <div className="onboarding-summary-card">
                <span>Status Akun</span>
                <strong>Onboarding aktif</strong>
              </div>
              <div className="onboarding-summary-card">
                <span>Target Tahap Ini</span>
                <strong>Profil dasar selesai</strong>
              </div>
            </div>

            <div className="onboarding-bullet-card complete-profile-benefits-card">
              <strong>Setelah profil selesai</strong>
              <ul>
                <li>Data akun jadi lebih lengkap dan siap dipakai</li>
                <li>Onboarding kamu terasa lebih terarah</li>
                <li>Tahap masuk ke belajar jadi lebih mulus</li>
              </ul>
            </div>
          </aside>

          <section className="register-card complete-profile-card onboarding-form-card onboarding-form-surface">
            <div className="auth-secondary-logo onboarding-mini-brand" aria-label="Nice On">NICE ON</div>
            <p className="complete-profile-kicker">Lengkapi Profil</p>
            <h2 className="complete-profile-title">Informasi tentang dirimu</h2>
            <p className="register-sub complete-profile-sub">Isi data dasar dengan benar agar pengalaman belajar bisa disesuaikan lebih optimal.</p>

            <div className="submit-message success onboarding-account-banner complete-profile-banner">
              <strong>Akun onboarding aktif.</strong> {registeredUser ? <>Email <strong>{registeredUser.email}</strong> sudah tercatat dengan ID <strong>{registeredUser.pid}</strong>.</> : 'Lanjutkan dengan melengkapi profil dasar.'}
            </div>

            <form className="register-form complete-profile-form" onSubmit={(event) => void handleCompleteProfileSubmit(event)}>
              <div className="complete-profile-fields">
                <div className="complete-profile-field full">
                  <label htmlFor="profileName">Nama Lengkap</label>
                  <input id="profileName" type="text" placeholder="Masukkan nama lengkap" value={form.nama} onChange={updateField('nama')} />
                  {fieldErrors.nama ? <div className="field-error">{fieldErrors.nama[0]}</div> : null}
                </div>

                <div className="complete-profile-field full">
                  <label htmlFor="profileTtl">Tempat, Tanggal Lahir</label>
                  <input id="profileTtl" type="text" placeholder="Contoh: Jakarta, 01 Januari 2000" value={form.ttl} onChange={updateField('ttl')} />
                  {fieldErrors.ttl ? <div className="field-error">{fieldErrors.ttl[0]}</div> : null}
                </div>

                <div className="complete-profile-field">
                  <label htmlFor="profileGender">Jenis Kelamin</label>
                  <select id="profileGender" value={form.gender} onChange={updateField('gender')}>
                    <option value="" disabled>Pilih jenis kelamin</option>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                  {fieldErrors.gender ? <div className="field-error">{fieldErrors.gender[0]}</div> : null}
                </div>

                <div className="complete-profile-field">
                  <label htmlFor="profilePhone">No. HP</label>
                  <input
                    id="profilePhone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="08xxxxxxxxxx"
                    value={form.nohp}
                    onChange={(event) => {
                      const value = sanitizePhoneNumber(event.target.value)
                      setForm((current) => ({ ...current, nohp: value }))
                      setFieldErrors((current) => ({ ...current, nohp: undefined }))
                    }}
                  />
                  {fieldErrors.nohp ? <div className="field-error">{fieldErrors.nohp[0]}</div> : null}
                </div>

                <div className="complete-profile-field full">
                  <label htmlFor="profileAddress">Alamat</label>
                  <textarea id="profileAddress" placeholder="Masukkan alamat lengkap" value={form.alamat} onChange={updateField('alamat')}></textarea>
                  {fieldErrors.alamat ? <div className="field-error">{fieldErrors.alamat[0]}</div> : null}
                </div>

                <div className="complete-profile-field full">
                  <label htmlFor="profileReference">Referensi (Opsional)</label>
                  <select
                    id="profileReference"
                    value={form.refference}
                    onChange={(event) => {
                      const value = event.target.value
                      setForm((current) => ({
                        ...current,
                        refference: value,
                        referenceOther: value === 'Lainnya' ? current.referenceOther : '',
                      }))
                      setFieldErrors((current) => ({
                        ...current,
                        refference: undefined,
                        reference_other: undefined,
                      }))
                    }}
                  >
                    <option value="">Pilih referensi</option>
                    {referenceOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {fieldErrors.refference ? <div className="field-error">{fieldErrors.refference[0]}</div> : null}
                </div>

                {form.refference === 'Lainnya' ? (
                  <div className="complete-profile-field full">
                    <label htmlFor="profileReferenceOther">Referensi Lainnya</label>
                    <input
                      id="profileReferenceOther"
                      type="text"
                      placeholder="Tulis referensi lainnya"
                      value={form.referenceOther}
                      onChange={(event) => {
                        const value = event.target.value
                        setForm((current) => ({ ...current, referenceOther: value }))
                        setFieldErrors((current) => ({ ...current, reference_other: undefined }))
                      }}
                    />
                    {fieldErrors.reference_other ? <div className="field-error">{fieldErrors.reference_other[0]}</div> : null}
                  </div>
                ) : null}

                {fieldErrors.pid_user ? <div className="field-error complete-profile-error full">{fieldErrors.pid_user[0]}</div> : null}

                {submitMessage ? <div className={`submit-message ${submitMessage.type} complete-profile-submit full`}>{submitMessage.text}</div> : null}
              </div>

              <button type="submit" className="register-btn complete-profile-btn" disabled={isSubmitting}>
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan dan Lanjut'}</span>
                <span className="complete-profile-btn-arrow" aria-hidden="true">→</span>
              </button>

              <div className="onboarding-footer-note complete-profile-security-note">Data kamu aman. Kami tidak akan membagikan informasi pribadimu ke pihak lain.</div>

              <Link to="/login" className="back-home complete-profile-back-link">Lanjut ke Login</Link>
            </form>
          </section>
        </div>

        <div className="complete-profile-footer">
          <strong>Langkah 2 dari 3</strong>
          <div className="complete-profile-dots" aria-hidden="true">
            <span className="is-active"></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  )
}
