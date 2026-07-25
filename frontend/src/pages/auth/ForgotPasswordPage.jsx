import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import niceonImage from '../../../../niceon.png'
import './ForgotPasswordPage.css'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()

    setIsSubmitting(true)
    setSubmitMessage(null)

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 700))
      setSubmitMessage({ type: 'success', text: 'Jika email terdaftar, tautan reset password akan dikirim ke email tersebut.' })
      setEmail('')
    } catch {
      setSubmitMessage({ type: 'error', text: 'Tidak bisa memproses permintaan saat ini.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page auth-page-blue auth-page-split forgot-page-split">
      <section className="auth-visual forgot-visual">
        <div className="brand-stage forgot-brand-stage">
          <div className="brand-stage-badge">NICE ON LEARNING HUB</div>
          <div className="login-hero-art forgot-hero-art">
            <img src={niceonImage} alt="Nice On" className="login-hero-image" />
          </div>
          <div className="login-brand-copy forgot-brand-copy">
            <p className="login-brand-kicker">Bantuan akses akun</p>
            <h2>Reset password lebih cepat, aman, dan terarah.</h2>
            <p className="login-brand-lead">Masukkan email akunmu untuk menerima tautan reset password dan lanjut belajar kembali tanpa hambatan.</p>
          </div>
          <div className="brand-proof-grid" aria-label="Keunggulan reset password">
            <span className="brand-proof">Proses Cepat</span>
            <span className="brand-proof">Aman</span>
            <span className="brand-proof">Mudah Dipahami</span>
          </div>
        </div>
      </section>

      <section className="auth-form-side forgot-form-side">
        <div className="register-card forgot-card">
          <div className="auth-secondary-logo" aria-label="Nice On">NICE ON</div>
          <h1>Lupa Password?</h1>
          <p className="register-sub">Masukkan email yang terdaftar untuk menerima tautan reset password.</p>

          <form className="register-form" onSubmit={(event) => void handleSubmit(event)}>
            <label htmlFor="forgotEmail">Email</label>
            <input
              id="forgotEmail"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <div className="register-note">
              Jika email cocok dengan akun kamu, kami akan mengirimkan instruksi untuk membuat password baru.
            </div>

            {submitMessage ? <div className={`submit-message ${submitMessage.type}`}>{submitMessage.text}</div> : null}

            <button type="submit" className="register-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Mengirim...' : 'Kirim Link Reset'}
            </button>

            <Link to="/login" className="alt-auth-btn">Kembali ke Login</Link>
            <Link to="/" className="back-home">Kembali ke Beranda</Link>
          </form>
        </div>
      </section>
    </div>
  )
}
