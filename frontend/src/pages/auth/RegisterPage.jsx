import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import niceonImage from '../../../../niceon.png'
import { fetchCaptcha, register } from '../../api/authApi'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    captchaAnswer: '',
  })
  const [captchaChallenge, setCaptchaChallenge] = useState(null)
  const [captchaLoading, setCaptchaLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const updateField = (field) => (event) => {
    const value = event.target.value

    setForm((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
  }

  const loadCaptcha = async () => {
    setCaptchaLoading(true)

    try {
      const payload = await fetchCaptcha()
      setCaptchaChallenge(payload)
    } catch {
      setCaptchaChallenge(null)
    } finally {
      setCaptchaLoading(false)
    }
  }

  useEffect(() => {
    void loadCaptcha()
  }, [])

  const handleRegisterSubmit = async (event) => {
    event.preventDefault()

    setIsSubmitting(true)
    setSubmitMessage(null)
    setFieldErrors({})

    try {
      const payload = await register({
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        captchaToken: captchaChallenge?.token ?? '',
        captchaAnswer: form.captchaAnswer,
      })

      setSubmitMessage({ type: 'success', text: payload.message ?? 'Akun berhasil dibuat.' })
      setForm({
        email: '',
        password: '',
        confirmPassword: '',
        captchaAnswer: '',
      })
      await loadCaptcha()
      navigate('/complete-profile', {
        state: {
          registeredUser: payload.data ?? null,
        },
      })
    } catch (error) {
      if (error.status) {
        setFieldErrors(error.errors ?? {})
        setSubmitMessage({ type: 'error', text: error.message ?? 'Pendaftaran gagal.' })
        setForm((current) => ({ ...current, captchaAnswer: '' }))
        await loadCaptcha()
      } else {
        setSubmitMessage({ type: 'error', text: 'Tidak bisa terhubung ke server register.' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page auth-page-blue auth-page-split register-page-split">
      <section className="auth-visual register-visual">
        <div className="brand-stage register-brand-stage">
          <div className="brand-stage-badge">NICE ON LEARNING HUB</div>
          <div className="login-hero-art register-hero-art">
            <img src={niceonImage} alt="Nice On" className="login-hero-image" />
          </div>
          <div className="login-brand-copy register-brand-copy">
            <p className="login-brand-kicker">Start Your Nice On Journey</p>
            <h2>Siapkan akunmu. Belajar lebih terarah setiap hari</h2>
            <p className="login-brand-lead">Gabung ke ruang belajar yang menyatukan tryout, evaluasi progres, dan pendampingan yang terasa rapi sejak awal.</p>
          </div>
          <div className="brand-proof-grid" aria-label="Keunggulan register">
            <span className="brand-proof">Akses Cepat</span>
            <span className="brand-proof">Progres Tercatat</span>
            <span className="brand-proof">Belajar Terarah</span>
          </div>
        </div>
      </section>

      <section className="auth-form-side register-form-side">
        <div className="register-card">
          <div className="auth-secondary-logo" aria-label="Nice On">NICE ON</div>
          <h1>Daftar Akun</h1>
          <p className="register-sub">Buat akun dulu, lengkapi profil setelah pendaftaran berhasil.</p>

          <form className="register-form" onSubmit={(event) => void handleRegisterSubmit(event)}>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" placeholder="nama@email.com" value={form.email} onChange={updateField('email')} />
            {fieldErrors.email ? <div className="field-error">{fieldErrors.email[0]}</div> : null}

            <label htmlFor="password">Password</label>
            <div className="password-wrap">
              <input id="password" type={showPassword ? 'text' : 'password'} placeholder="Masukkan password" value={form.password} onChange={updateField('password')} />
              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
            {fieldErrors.password ? <div className="field-error">{fieldErrors.password[0]}</div> : null}

            <label htmlFor="confirmPassword">Konfirmasi Password</label>
            <div className="password-wrap">
              <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="Ulangi password" value={form.confirmPassword} onChange={updateField('confirmPassword')} />
              <button
                type="button"
                className="password-toggle"
                aria-label={showConfirmPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                aria-pressed={showConfirmPassword}
                onClick={() => setShowConfirmPassword((current) => !current)}
              >
                {showConfirmPassword ? '🙈' : '👁'}
              </button>
            </div>
            {fieldErrors.password_confirmation ? <div className="field-error">{fieldErrors.password_confirmation[0]}</div> : null}

            <div className="register-note">
              Setelah akun dibuat, kamu akan diarahkan untuk melengkapi profil seperti nama, no. HP, alamat, dan data pribadi lainnya.
            </div>

            <label htmlFor="captchaAnswer">Captcha</label>
            <div className="captcha-box">
              <div className="captcha-dummy">
                {captchaChallenge ? (
                  <img src={captchaChallenge.image} alt="Captcha code" className="captcha-image" />
                ) : (
                  <div className="captcha-fallback">Captcha belum tersedia</div>
                )}
                <button type="button" className="captcha-refresh" onClick={() => void loadCaptcha()} disabled={captchaLoading}>
                  {captchaLoading ? 'Memuat...' : 'Muat Ulang'}
                </button>
              </div>
              <input
                id="captchaAnswer"
                type="text"
                placeholder="Ketik kode captcha"
                autoComplete="off"
                value={form.captchaAnswer}
                onChange={(event) => {
                  const value = event.target.value.toUpperCase()
                  setForm((current) => ({ ...current, captchaAnswer: value }))
                  setFieldErrors((current) => ({ ...current, captcha_answer: undefined }))
                }}
              />
              {fieldErrors.captcha_answer ? <div className="field-error">{fieldErrors.captcha_answer[0]}</div> : null}
              {captchaChallenge?.token ? <input type="hidden" name="captchaToken" value={captchaChallenge.token} readOnly /> : null}
            </div>

            {submitMessage ? <div className={`submit-message ${submitMessage.type}`}>{submitMessage.text}</div> : null}

            <button type="submit" className="register-btn" disabled={isSubmitting || captchaLoading}>
              {isSubmitting ? 'Memproses...' : 'Daftar'}
            </button>

            <p className="register-switch">
              Sudah pernah daftar? <Link to="/login">Login di sini</Link>
            </p>
            <Link to="/" className="back-home">Kembali ke Beranda</Link>
          </form>
        </div>
      </section>
    </div>
  )
}
