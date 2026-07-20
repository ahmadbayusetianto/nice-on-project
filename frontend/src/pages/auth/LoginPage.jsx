import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import niceonImage from '../../../../niceon.png'
import { login } from '../../api/authApi'
import { storeAuthUser } from '../../utils/storage'

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitMessage, setSubmitMessage] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = (field) => (event) => {
    const value = event.target.value
    setForm((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleLoginSubmit = async (event) => {
    event.preventDefault()

    setIsSubmitting(true)
    setFieldErrors({})
    setSubmitMessage(null)

    try {
      const payload = await login({ email: form.email, password: form.password })

      setSubmitMessage({ type: 'success', text: payload.message ?? 'Login berhasil.' })
      storeAuthUser(payload.data ?? null)

      const isAdmin = Number(payload.data?.is_admin ?? 0) === 1
      if (isAdmin) {
        navigate('/dashboard-admin', {
          replace: true,
          state: {
            user: payload.data ?? null,
          },
        })
        return
      }

      navigate('/dashboard-user', {
        replace: true,
        state: {
          user: payload.data ?? null,
        },
      })
    } catch (error) {
      if (error.status) {
        setFieldErrors(error.errors ?? {})
        setSubmitMessage({ type: 'error', text: error.message ?? 'Login gagal.' })
      } else {
        setSubmitMessage({ type: 'error', text: 'Tidak bisa terhubung ke server login.' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page auth-page-blue auth-page-split">
      <section className="auth-visual">
        <div className="brand-stage">
          <div className="brand-stage-badge">NICE ON LEARNING HUB</div>
          <div className="login-hero-art">
            <img src={niceonImage} alt="Nice On" className="login-hero-image" />
          </div>
          <div className="login-brand-copy">
            <p className="login-brand-kicker">Platform belajar yang fokus, terarah, dan siap tempur.</p>
            <h2>Belajar tenang. Nembak skor lebih tajam.</h2>
            <p className="login-brand-lead">Satu ruang belajar untuk tryout, evaluasi progres, dan ritme latihan yang terasa jelas dari awal sampai hari ujian.</p>
          </div>
          <div className="brand-proof-grid" aria-label="Keunggulan utama">
            <span className="brand-proof">Tryout Real CAT</span>
            <span className="brand-proof">Mentor Aktif</span>
            <span className="brand-proof">Evaluasi Cepat</span>
          </div>
        </div>
        <div className="visual-card">
          <div className="visual-badge">TRYOUT</div>
          <h2>Belajar Lebih Cerdas<br /><span>Prestasi Mengesankan</span></h2>
          <p className="visual-card-copy">Bangun konsistensi belajar dengan simulasi, umpan balik, dan target yang terasa nyata.</p>
        </div>
      </section>

      <section className="auth-form-side">
        <div className="login-card">
          <h1>Selamat Datang<br />Kembali!</h1>
          <p className="register-sub">Mulailah mengerjakan tryoutmu!</p>

          <form className="register-form" onSubmit={(event) => void handleLoginSubmit(event)}>
            <label htmlFor="loginEmail">Email</label>
            <input id="loginEmail" type="email" placeholder="nama@email.com" value={form.email} onChange={updateField('email')} />
            {fieldErrors.email ? <div className="field-error">{fieldErrors.email[0]}</div> : null}

            <label htmlFor="loginPassword">Password</label>
            <div className="password-wrap">
              <input id="loginPassword" type={showPassword ? 'text' : 'password'} placeholder="Masukkan password" value={form.password} onChange={updateField('password')} />
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

            <Link to="/forgot-password" className="forgot-link">Lupa Password?</Link>

            {submitMessage ? <div className={`submit-message ${submitMessage.type}`}>{submitMessage.text}</div> : null}

            <button type="submit" className="register-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Memproses...' : 'Masuk'}
            </button>

            <div className="divider">ATAU</div>

            {false ? <button type="button" className="google-btn">Sign in with Google</button> : null}
            <Link to="/register" className="alt-auth-btn">Belum Punya Akun? Daftar Sekarang!</Link>

            <div className="auth-bottom-links">
              <a href="#">Tentang Kami</a>
              <a href="#">Syarat dan Ketentuan</a>
              <a href="#">Kebijakan Privasi</a>
            </div>
            <Link to="/" className="back-home">Kembali ke Beranda</Link>
          </form>
        </div>
      </section>
    </div>
  )
}
