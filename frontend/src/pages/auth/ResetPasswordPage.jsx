import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import niceonImage from '../../../../niceon.png'
import { resetPassword } from '../../api/authApi'
import './ResetPasswordPage.css'

export default function ResetPasswordPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = new URLSearchParams(location.search)
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState(null)

  const updateField = (field) => (event) => {
    const value = event.target.value
    setForm((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setIsSubmitting(true)
    setFieldErrors({})
    setSubmitMessage(null)

    try {
      const payload = await resetPassword({
        token,
        email,
        password: form.password,
        confirmPassword: form.confirmPassword,
      })

      setSubmitMessage({ type: 'success', text: payload.message ?? 'Password berhasil direset.' })
      window.setTimeout(() => navigate('/login', { replace: true }), 1500)
    } catch (error) {
      if (error.status) {
        setFieldErrors(error.errors ?? {})
        setSubmitMessage({ type: 'error', text: error.message ?? 'Reset password gagal.' })
      } else {
        setSubmitMessage({ type: 'error', text: 'Tidak bisa terhubung ke server.' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const isLinkInvalid = !token || !email

  return (
    <div className="auth-page auth-page-blue auth-page-split reset-page-split">
      <section className="auth-visual reset-visual">
        <div className="brand-stage reset-brand-stage">
          <div className="brand-stage-badge">NICE ON LEARNING HUB</div>
          <div className="login-hero-art reset-hero-art">
            <img src={niceonImage} alt="Nice On" className="login-hero-image" />
          </div>
          <div className="login-brand-copy reset-brand-copy">
            <p className="login-brand-kicker">Bantuan akses akun</p>
            <h2>Buat password baru, lanjut belajar lagi.</h2>
            <p className="login-brand-lead">Masukkan password baru untuk akunmu dan kembali lanjutkan belajar tanpa hambatan.</p>
          </div>
          <div className="brand-proof-grid" aria-label="Keunggulan reset password">
            <span className="brand-proof">Proses Cepat</span>
            <span className="brand-proof">Aman</span>
            <span className="brand-proof">Mudah Dipahami</span>
          </div>
        </div>
      </section>

      <section className="auth-form-side reset-form-side">
        <div className="register-card reset-card">
          <div className="auth-secondary-logo" aria-label="Nice On">NICE ON</div>
          <h1>Buat Password Baru</h1>

          {isLinkInvalid ? (
            <>
              <p className="register-sub">Link reset password tidak valid atau sudah tidak lengkap.</p>
              <Link to="/forgot-password" className="alt-auth-btn">Minta Link Baru</Link>
              <Link to="/" className="back-home">Kembali ke Beranda</Link>
            </>
          ) : (
            <>
              <p className="register-sub">Masukkan password baru untuk akun {email}.</p>

              <form className="register-form" onSubmit={(event) => void handleSubmit(event)}>
                <label htmlFor="resetPassword">Password Baru</label>
                <div className="password-wrap">
                  <input
                    id="resetPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan password baru"
                    value={form.password}
                    onChange={updateField('password')}
                  />
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

                <label htmlFor="resetConfirmPassword">Konfirmasi Password</label>
                <div className="password-wrap">
                  <input
                    id="resetConfirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Ulangi password baru"
                    value={form.confirmPassword}
                    onChange={updateField('confirmPassword')}
                  />
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

                {submitMessage ? <div className={`submit-message ${submitMessage.type}`}>{submitMessage.text}</div> : null}

                <button type="submit" className="register-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Memproses...' : 'Reset Password'}
                </button>

                <Link to="/login" className="alt-auth-btn">Kembali ke Login</Link>
                <Link to="/" className="back-home">Kembali ke Beranda</Link>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
