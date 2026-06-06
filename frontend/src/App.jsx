import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import faviconImage from '../../favicon.png'
import niceonImage from '../../niceon.png'
import './App.css'

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'
const AUTH_STORAGE_KEY = 'niceon.auth.user'
const ADMIN_SIDEBAR_COLLAPSED_KEY = 'niceon.admin.sidebarCollapsed'

function readStoredUser() {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.sessionStorage.getItem(AUTH_STORAGE_KEY)
    if (raw) return JSON.parse(raw)

    const fallbackRaw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    return fallbackRaw ? JSON.parse(fallbackRaw) : null
  } catch {
    return null
  }
}

function storeAuthUser(user) {
  if (typeof window === 'undefined') return

  const value = JSON.stringify(user ?? null)

  try {
    window.sessionStorage.setItem(AUTH_STORAGE_KEY, value)
  } catch {
    // Ignore storage failures and keep the in-memory route state.
  }

  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, value)
  } catch {
    // Ignore storage failures and keep the in-memory route state.
  }
}

function clearAuthUser() {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
    // Ignore storage failures.
  }

  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
    // Ignore storage failures.
  }
}

function readStoredAdminSidebarState() {
  if (typeof window === 'undefined') return false

  try {
    return window.localStorage.getItem(ADMIN_SIDEBAR_COLLAPSED_KEY) === 'true'
  } catch {
    return false
  }
}

function AdminTopbar({ title, searchPlaceholder, currentDateLabel, displayName, onToggleSidebar, isSidebarCollapsed, showSearch = true, onHomeClick }) {
  return (
    <header className="admin-topbar">
      <div className="admin-topbar-left">
        <button
          type="button"
          className="admin-menu-button"
          aria-label={isSidebarCollapsed ? 'Tampilkan menu' : 'Sembunyikan menu'}
          onClick={onToggleSidebar}
        >
          ☰
        </button>
        <h1>{title}</h1>
      </div>

      <div className="admin-topbar-right">
        <button type="button" className="admin-home-button" aria-label="Beranda" onClick={onHomeClick}>
          🏠
        </button>
        {showSearch ? (
          <label className="admin-search">
            <span aria-hidden="true">⌕</span>
            <input type="search" placeholder={searchPlaceholder} />
            <kbd>⌘K</kbd>
          </label>
        ) : null}

        <button type="button" className="admin-notification-button" aria-label="Notifikasi">
          🔔
          <span className="admin-notification-badge">3</span>
        </button>

        <button type="button" className="admin-date-chip">
          <span aria-hidden="true">📅</span>
          <span>{currentDateLabel}</span>
          <span aria-hidden="true">⌄</span>
        </button>

        <button type="button" className="admin-profile-chip">
          <span className="admin-profile-avatar">AB</span>
          <span className="admin-profile-copy">
            <strong>{displayName}</strong>
            <span>Super Admin</span>
          </span>
          <span aria-hidden="true">⌄</span>
        </button>
      </div>
    </header>
  )
}

function AdminLogoutModal({ open, onCancel, onConfirm, title = 'Keluar dari akun?', message = 'Pastikan semua pekerjaan sudah disimpan sebelum Anda logout.', confirmLabel = 'Ya, keluar' }) {
  if (!open) return null

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onCancel}>
      <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="adminLogoutTitle" onClick={(event) => event.stopPropagation()}>
        <div className="admin-modal-icon" aria-hidden="true">!</div>
        <h3 id="adminLogoutTitle">{title}</h3>
        <p>{message}</p>
        <div className="admin-modal-actions">
          <button type="button" className="admin-modal-button secondary" onClick={onCancel}>Batal</button>
          <button type="button" className="admin-modal-button primary" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

function HomePage() {
  const navigate = useNavigate()
  const heroCardRef = useRef(null)
  const [activeSlide, setActiveSlide] = useState(0)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [isPromoVisible, setIsPromoVisible] = useState(true)
  const [storedUser, setStoredUser] = useState(() => readStoredUser())
  const isLoggedIn = Boolean(storedUser)
  const displayName = storedUser?.nama || storedUser?.name || storedUser?.email?.split('@')?.[0] || 'User'
  const authLabel = Number(storedUser?.is_admin ?? 0) === 1 ? 'Admin' : 'User'
  const dashboardPath = Number(storedUser?.is_admin ?? 0) === 1 ? '/dashboard-admin' : '/dashboard-user'
  const dashboardCtaLabel = Number(storedUser?.is_admin ?? 0) === 1 ? 'Masuk ke Dashboard Admin' : 'Masuk ke Dashboard User'
  const dashboardCtaClass = Number(storedUser?.is_admin ?? 0) === 1 ? 'pill main home-dashboard-cta admin' : 'pill main home-dashboard-cta user'

  const handleHomeLogout = () => {
    clearAuthUser()
    setStoredUser(null)
  }

  useEffect(() => {
    const syncAuth = () => setStoredUser(readStoredUser())

    window.addEventListener('storage', syncAuth)
    window.addEventListener('focus', syncAuth)
    document.addEventListener('visibilitychange', syncAuth)

    return () => {
      window.removeEventListener('storage', syncAuth)
      window.removeEventListener('focus', syncAuth)
      document.removeEventListener('visibilitychange', syncAuth)
    }
  }, [])

  const heroSlides = [
    {
      badge: 'KELAS OFFLINE',
      title: 'Kelas Offline',
      subtitle: 'Soal pembahasan bersama mentor',
      tone: 'tone-one',
      features: [
        { icon: '👥', label: 'Diskusi' },
        { icon: '📘', label: 'Modul' },
        { icon: '📈', label: 'Progress' },
      ],
    },
    {
      badge: 'TRYOUT CAT',
      title: 'Tryout CAT',
      subtitle: 'Simulasi ujian dengan suasana real test',
      tone: 'tone-two',
      features: [
        { icon: '⏱', label: 'Timer' },
        { icon: '✅', label: 'Skor' },
        { icon: '🧠', label: 'Analisis' },
      ],
    },
    {
      badge: 'BELAJAR RUTIN',
      title: 'Belajar Rutin',
      subtitle: 'Jadwal terarah untuk menjaga konsistensi',
      tone: 'tone-three',
      features: [
        { icon: '🗓', label: 'Jadwal' },
        { icon: '🔔', label: 'Reminder' },
        { icon: '📚', label: 'Materi' },
      ],
    },
  ]

  const stats = [
    ['YT', '1.75Jt+', 'Subscribers', '↑ 12.5%'],
    ['IG', '742K+', 'Followers', '↑ 8.2%'],
    ['TT', '389K+', 'Followers', '↑ 15.3%'],
    ['X', '198K+', 'Followers', '↑ 10.1%'],
  ]

  const testimonials = [
    {
      initials: 'AR',
      name: 'Lorem Arian',
      role: 'Lolos instansi alumni',
      text: 'Materi sangat ringkas dan terarah. Simulasi CAT mirip dengan ujian asli, sangat membantu!',
      tone: 'sky',
      image: '/testimoni-1.png',
    },
    {
      initials: 'NS',
      name: 'Nadia S',
      role: 'Dokter umum peserta',
      text: 'UI enak dan mudah digunakan. Fitur evaluasi membantu saya memantau progres belajar.',
      tone: 'violet',
      image: '/testimoni-2.png',
    },
    {
      initials: 'RK',
      name: 'Raka K',
      role: 'Contecturer program',
      text: 'Mentornya responsif dan kelas intensifnya benar-benar berkualitas.',
      tone: 'mint',
      image: '/testimoni-3.png',
    },
  ]

  const packageCards = [
    {
      title: 'Lorem Ipsum Dolor Sit Amet 2026',
      subtitle: 'Consectetur adipiscing elit sed do eiusmod tempor incididunt.',
      note: '(Aktif hingga lorem ipsum selesai)',
      bullets: [
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        'Sed do eiusmod tempor incididunt ut labore et dolore.',
      ],
      discount: '52%',
      oldPrice: 'Rp25.000',
      newPrice: 'Rp12.000',
      icon: '📋',
    },
    {
      title: 'Lorem Ipsum Fulltest Part 29',
      subtitle: 'Ut enim ad minim veniam quis nostrud exercitation ullamco.',
      note: '(Aktif hingga lorem ipsum selesai)',
      bullets: [
        'Duis aute irure dolor in reprehenderit in voluptate.',
        'Velit esse cillum dolore eu fugiat nulla pariatur.',
      ],
      discount: '40%',
      oldPrice: 'Rp35.000',
      newPrice: 'Rp21.000',
      icon: '🎯',
    },
    {
      title: 'Lorem Bundling Persubtest 2026',
      subtitle: 'Excepteur sint occaecat cupidatat non proident sunt in culpa.',
      note: '(Aktif hingga lorem ipsum selesai)',
      bullets: [
        'Officia deserunt mollit anim id est laborum lorem.',
        'Integer nec odio praesent libero sed cursus ante.',
      ],
      discount: '57%',
      oldPrice: 'Rp59.000',
      newPrice: 'Rp25.000',
      icon: '📊',
    },
  ]

  const faqItems = [
    { icon: '❓', label: 'Lorem ipsum dolor sit amet consectetur?' },
    { icon: '📘', label: 'Consectetur adipiscing elit sed do eiusmod?' },
    { icon: '💬', label: 'Tempor incididunt ut labore et dolore?' },
    { icon: '🎓', label: 'Magna aliqua ut enim ad minim veniam?' },
    { icon: '🧩', label: 'Quis nostrud exercitation ullamco laboris?' },
    { icon: '🛡️', label: 'Nisi ut aliquip ex ea commodo consequat?' },
  ]

  const currentSlide = heroSlides[activeSlide]

  const cycleSlide = (direction) => {
    setActiveSlide((current) => {
      const next = current + direction
      if (next < 0) return heroSlides.length - 1
      return next % heroSlides.length
    })
  }

  const handlePromoClose = () => setIsPromoVisible(false)

  useEffect(() => {
    const layers = Array.from(document.querySelectorAll('[data-parallax]'))
    if (!layers.length) return

    let rafId = 0

    const updateParallax = () => {
      const scrollY = window.scrollY || 0
      layers.forEach((layer) => {
        const speed = Number(layer.getAttribute('data-speed') || 0.12)
        layer.style.transform = `translate3d(0, ${scrollY * speed}px, 0)`
      })
      rafId = 0
    }

    const onScroll = () => {
      if (rafId) return
      rafId = window.requestAnimationFrame(updateParallax)
    }

    updateParallax()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafId) window.cancelAnimationFrame(rafId)
    }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length)
    }, 3200)

    return () => window.clearInterval(timer)
  }, [heroSlides.length])

  useEffect(() => {
    const card = heroCardRef.current
    if (!card) return

    const media = window.matchMedia('(max-width: 980px)')
    if (media.matches) return

    const thumb = card.querySelector('.hero-card-visual')
    let rafId = 0

    const animate = (xRatio, yRatio) => {
      const rotateY = xRatio * 6
      const rotateX = -yRatio * 5
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`
      if (thumb) {
        thumb.style.transform = `translate(${xRatio * -8}px, ${yRatio * -6}px)`
      }
    }

    const onMove = (event) => {
      const rect = card.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width
      const y = (event.clientY - rect.top) / rect.height
      const xRatio = (x - 0.5) * 2
      const yRatio = (y - 0.5) * 2

      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => animate(xRatio, yRatio))
    }

    const reset = () => {
      card.style.transform = ''
      if (thumb) thumb.style.transform = ''
    }

    card.addEventListener('mousemove', onMove)
    card.addEventListener('mouseleave', reset)

    return () => {
      card.removeEventListener('mousemove', onMove)
      card.removeEventListener('mouseleave', reset)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div className="app">
      {isPromoVisible ? (
        <div className="promo" data-parallax data-speed="0.04">
          <div className="container promo-inner">
            <span className="promo-copy">Satu langkah kecil hari ini, peluang besar di hari seleksi.</span>
            <span className="promo-pill">Klaim Kelas Trial Gratis -&gt;</span>
            <button type="button" className="promo-close" onClick={handlePromoClose} aria-label="Tutup promo">
              ×
            </button>
          </div>
        </div>
      ) : null}

      <header className="topbar">
        <div className="container topbar-inner">
          <div className="logo">
            <img src={niceonImage} alt="Nice On" className="logo-image" />
          </div>

          <nav className="menu">
            <a href="#" className="active">Beranda</a>
            <a href="#paket">Paket Belajar</a>
            <a href="#testimoni">Testimoni</a>
            <a href="#paket">Social Media</a>
            <a href="#faq">FAQ</a>
          </nav>

          {isLoggedIn ? (
            <div className="auth auth-logged-in">
              <button type="button" className="home-user-chip home-user-chip-button" onClick={() => navigate(dashboardPath, { state: { user: storedUser } })}>
                <span className="home-user-avatar">{displayName.slice(0, 2).toUpperCase()}</span>
                <span className="home-user-copy">
                  <strong>{displayName}</strong>
                  <span>{authLabel} aktif</span>
                </span>
              </button>
              <button type="button" className="btn auth-logout" onClick={handleHomeLogout}>Logout</button>
            </div>
          ) : (
            <div className="auth">
              <Link className="btn" to="/login">Masuk</Link>
              <Link className="btn primary" to="/register">Daftar</Link>
            </div>
          )}
        </div>
      </header>

      <section className="hero container" data-parallax data-speed="-0.06">
        <div className="hero-copy">
          <div className="hero-badge">Dipakai ribuan pejuang ASN di seluruh Indonesia</div>
          <h1>Satu Langkah<br /><span>Menuju ASN.</span></h1>
          <p>Persiapan yang tepat dapat mengubah keraguan menjadi keyakinan.</p>
          <p>Dengan pendekatan belajar yang terstruktur, latihan yang relevan, dan bimbingan yang responsif, kamu dapat fokus pada hal yang benar-benar penting: meningkatkan peluang kelulusan.</p>
          <ul className="hero-points">
            <li>Materi ringkas dan terarah</li>
            <li>Simulasi CAT sesuai ujian asli</li>
            <li>Evaluasi progres belajar</li>
            <li>Mentor responsif saat kamu butuh bantuan</li>
          </ul>
          <div className="hero-actions">
            {isLoggedIn ? (
              <button type="button" className={dashboardCtaClass} onClick={() => navigate(dashboardPath, { state: { user: storedUser } })}>
                {dashboardCtaLabel} <span aria-hidden="true">→</span>
              </button>
            ) : (
              <a href="#paket" className="pill main">Mulai Belajar Sekarang <span aria-hidden="true">→</span></a>
            )}
            <a href="#paket" className="pill">Lihat Paket Kelas</a>
          </div>
        </div>

        <div className="hero-card-wrap">
          <button type="button" className="hero-nav hero-nav-left" onClick={() => cycleSlide(-1)} aria-label="Slide sebelumnya">←</button>

          <div className="hero-card" data-parallax data-speed="-0.12" ref={heroCardRef}>
            <div className={`hero-card-visual ${currentSlide.tone}`}>
              <div className="hero-card-kicker">{currentSlide.badge}</div>
              <div className="hero-card-head">
                <h3>{currentSlide.title}</h3>
                <p>{currentSlide.subtitle}</p>
              </div>
              <div className="hero-card-features" aria-label="Fitur unggulan slide">
                {currentSlide.features.map((feature) => (
                  <div key={feature.label} className="hero-feature-tile">
                    <span aria-hidden="true">{feature.icon}</span>
                    <strong>{feature.label}</strong>
                  </div>
                ))}
              </div>
              <div className="hero-card-dots" aria-label="Pilihan slide">
                {heroSlides.map((slide, index) => (
                  <button
                    key={slide.title}
                    type="button"
                    className={`hero-dot${index === activeSlide ? ' is-active' : ''}`}
                    onClick={() => setActiveSlide(index)}
                    aria-label={`Slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="hero-card-body">
              <h3>Program Intensif SKD 2026</h3>
              <p>Targetkan nilai aman dengan jadwal belajar terarah, evaluasi progres rutin, dan bank soal terbaru.</p>
              <div className="hero-card-links">
                {[
                  'Jadwal Terarah',
                  'Evaluasi Rutin',
                  'Bank Soal Terbaru',
                ].map((label) => (
                  <span key={label} className="hero-card-link">{label}</span>
                ))}
              </div>
            </div>
          </div>

          <button type="button" className="hero-nav hero-nav-right" onClick={() => cycleSlide(1)} aria-label="Slide berikutnya">→</button>
        </div>
      </section>

      <section className="stats container" data-parallax data-speed="-0.08">
        <div className="stats-card" data-parallax data-speed="-0.1">
          {stats.map(([icon, value, label, growth]) => (
            <div className="stat" key={icon}>
              <div className="stat-icon">{icon}</div>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
              <div className="stat-growth">{growth}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="testimonials container" id="testimoni">
        <div className="testimonials-head testimonials-head-ref">
          <div className="testimonials-head-center">
            <div className="section-kicker testimonials-kicker">💬 KATA MEREKA</div>
            <h2 className="testimonials-title">Testimoni <span>Peserta</span></h2>
            <p className="testimonials-sub">Cerita nyata dari para pejuang yang telah merasakan manfaat belajar bersama NiceOn.</p>
            <a className="testimonials-link" href="#">Lihat semua testimoni →</a>
          </div>
        </div>

        <div className="testimonials-carousel testimonials-carousel-ref">
          <button type="button" className="carousel-nav testimonials-nav" aria-label="Testimoni sebelumnya">‹</button>

          <div className="testimonials-grid testimonials-grid-ref">
            {testimonials.map((item, index) => (
              <article className={`testimonial-card testimonial-card-ref${index === activeTestimonial ? ' is-active' : ''}`} key={item.name}>
                <div className="testimonial-top testimonial-top-ref">
                  <img src={item.image} alt={item.name} className={`avatar-ref avatar-photo ${item.tone}`} />
                  <div className="who">
                    <strong>{item.name}</strong>
                    <span>{item.role}</span>
                    <div className="testimonial-rating">
                      <span className="testimonial-stars">★★★★★</span>
                      <span className="testimonial-score">5.0</span>
                    </div>
                  </div>
                  <div className="testimonial-quote-top" aria-hidden="true">❝</div>
                </div>
                <p className="testimonial-text testimonial-text-ref">{item.text}</p>
                <div className="testimonial-quote-bottom" aria-hidden="true">❝</div>
              </article>
            ))}
          </div>

          <button type="button" className="carousel-nav testimonials-nav" aria-label="Testimoni berikutnya">›</button>
        </div>

        <div className="testimonials-dots" aria-label="Pagination testimoni">
          {testimonials.map((item, index) => (
            <button
              key={item.name}
              type="button"
              className={`testimonials-dot${index === activeTestimonial ? ' active' : ''}`}
              onClick={() => setActiveTestimonial(index)}
              aria-label={`Testimoni ${index + 1}`}
            />
          ))}
        </div>
      </section>

      <section className="package container" id="paket">
        <div className="section-kicker package-kicker">PAKET BELAJAR</div>
        <h2 className="section-title package-heading">Paket Belajar Terbaik untukmu</h2>
        <p className="section-subtitle package-subtitle">Pilih program yang sesuai dengan tujuanmu dan mulai persiapan sekarang.</p>

        <div className="package-filter package-filter-ref">
          <label htmlFor="program">Program</label>
          <select id="program" name="program" defaultValue="UTBK">
            <option>CPNS</option>
            <option>PPPK</option>
          </select>
        </div>

        <div className="package-grid package-grid-ref">
          {packageCards.map((card) => (
            <article className="course-card course-card-ref" key={card.title}>
              <div className="course-cover course-cover-ref">
                <div className="course-cover-badge">TRYOUT BUNDLE</div>
                <div className="course-cover-icon" aria-hidden="true">{card.icon}</div>
                <h3>{card.title}</h3>
              </div>
              <div className="course-body course-body-ref">
                <p className="course-sub"><strong>Lorem ipsum dolor sit amet</strong><br />{card.subtitle}</p>
                <p className="course-meta"><strong>{card.note}</strong></p>
                <ul className="course-list">
                  {card.bullets.map((bullet) => <li key={bullet}>✓ {bullet}</li>)}
                </ul>
                <div className="course-price course-price-ref">
                  <span className="badge-discount">{card.discount}</span>
                  <span className="old-price">{card.oldPrice}</span>
                  <span className="new-price">{card.newPrice}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="faq-wrap" id="faq">
        <div className="container faq faq-inner">
          <div className="faq-content">
            <div className="section-kicker faq-kicker">FAQ</div>
            <h2 className="faq-title">Pertanyaan yang Sering Ditanyakan</h2>
            <p className="faq-subtitle">Temukan jawaban cepat untuk pertanyaan yang paling sering diajukan.</p>

            <div className="faq-grid faq-grid-ref">
              {faqItems.map((item) => (
                <details className="faq-item faq-item-ref" key={item.label}>
                  <summary>
                    <span className="faq-summary-left">
                      <span className="faq-icon-badge" aria-hidden="true">{item.icon}</span>
                      <span>{item.label}</span>
                    </span>
                    <span className="faq-chevron" aria-hidden="true">⌄</span>
                  </summary>
                  <div className="faq-answer">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer hendrerit, tortor et feugiat mattis.</div>
                </details>
              ))}
            </div>
          </div>

          <aside className="faq-help-card" aria-label="Bantuan FAQ">
            <div className="faq-help-illustration">
              <img src="/study.png" alt="Ilustrasi bantuan" className="faq-help-image" />
            </div>
            <h3>Masih ada pertanyaan lain?</h3>
            <p>Tim kami siap membantu Anda kapan saja.</p>
            <a href="#" className="faq-help-button">Hubungi Kami <span aria-hidden="true">🎧</span></a>
          </aside>
        </div>
      </section>
    </div>
  )
}

function AuthPage({ title, cta, secondary, secondaryLink }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>{title}</h1>
        <p>{secondary}</p>
        <input placeholder="Email" />
        <input placeholder="Password" type="password" />
        {title === 'Daftar Akun' && <input placeholder="Konfirmasi Password" type="password" />}
        <button>{cta}</button>
        <p className="auth-switch">{secondaryLink.text} <Link to={secondaryLink.to}>{secondaryLink.link}</Link></p>
        <Link to="/" className="back-home">Kembali ke Beranda</Link>
      </div>
    </div>
  )
}

function LoginPage() {
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
      const response = await fetch(`${BACKEND_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        setFieldErrors(payload.errors ?? {})
        setSubmitMessage({ type: 'error', text: payload.message ?? 'Login gagal.' })
        return
      }

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
    } catch {
      setSubmitMessage({ type: 'error', text: 'Tidak bisa terhubung ke server login.' })
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

            <button type="button" className="google-btn">Sign in with Google</button>
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

function RegisterPage() {
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
      const response = await fetch(`${BACKEND_URL}/api/captcha`)
      if (!response.ok) {
        throw new Error('Failed to load captcha')
      }

      const payload = await response.json()
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
      const response = await fetch(`${BACKEND_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          password_confirmation: form.confirmPassword,
          captchaToken: captchaChallenge?.token ?? '',
          captchaAnswer: form.captchaAnswer,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        setFieldErrors(payload.errors ?? {})
        setSubmitMessage({ type: 'error', text: payload.message ?? 'Pendaftaran gagal.' })
        setForm((current) => ({ ...current, captchaAnswer: '' }))
        await loadCaptcha()
        return
      }

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
    } catch {
      setSubmitMessage({ type: 'error', text: 'Tidak bisa terhubung ke server register.' })
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
              <input id="captchaAnswer" type="text" placeholder="Ketik kode captcha" autoComplete="off" value={form.captchaAnswer} onChange={updateField('captchaAnswer')} />
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

function ForgotPasswordPage() {
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

function CompleteProfilePage() {
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
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitMessage, setSubmitMessage] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      const response = await fetch(`${BACKEND_URL}/api/complete-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          pid_user: registeredUser.pid,
          nama: form.nama,
          ttl: form.ttl,
          gender: form.gender,
          nohp: form.nohp,
          alamat: form.alamat,
          refference: form.refference,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        setFieldErrors(payload.errors ?? {})
        setSubmitMessage({ type: 'error', text: payload.message ?? 'Profil gagal disimpan.' })
        return
      }

      setSubmitMessage({ type: 'success', text: payload.message ?? 'Profil berhasil disimpan.' })
      window.setTimeout(() => {
        navigate('/login')
      }, 900)
    } catch {
      setSubmitMessage({ type: 'error', text: 'Tidak bisa terhubung ke server profil.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page auth-page-blue onboarding-page">
      <div className="onboarding-shell">
        <header className="onboarding-header-card onboarding-surface-card">
          <div>
            <div className="onboarding-success-pill">Akun Berhasil Dibuat</div>
            <h1>Bagus, akunmu sudah siap. Tinggal lengkapi profil untuk lanjut belajar.</h1>
            <p>Kami ubah tahap ini jadi onboarding, bukan layar login biasa, supaya progresmu terasa jelas dari awal.</p>
          </div>

          <div className="onboarding-stepper" aria-label="Progress onboarding">
            <div className="onboarding-step is-complete">
              <span>1</span>
              <strong>Buat Akun</strong>
            </div>
            <div className="onboarding-step is-current">
              <span>2</span>
              <strong>Lengkapi Profil</strong>
            </div>
            <div className="onboarding-step">
              <span>3</span>
              <strong>Mulai Belajar</strong>
            </div>
          </div>
        </header>

        <div className="onboarding-body onboarding-surface-card">
          <aside className="onboarding-summary-panel onboarding-summary-surface">
            <img src={niceonImage} alt="Nice On" className="onboarding-stage-logo" />
            <p className="onboarding-stage-kicker">Next step</p>
            <h2>Lengkapi identitas dasar agar sistem bisa menyiapkan pengalaman belajar yang pas.</h2>

            <div className="onboarding-summary-grid">
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

            <div className="onboarding-bullet-card">
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
            <h2 className="complete-profile-title">Lengkapi Profil</h2>
            <p className="register-sub">Isi data inti dulu supaya akunmu siap dipakai belajar.</p>

            <div className="submit-message success onboarding-account-banner">
              <strong>Akun onboarding aktif.</strong> {registeredUser ? <>Email <strong>{registeredUser.email}</strong> sudah tercatat dengan ID <strong>{registeredUser.pid}</strong>.</> : 'Lanjutkan dengan melengkapi profil dasar.'}
            </div>

            <form className="register-form" onSubmit={(event) => void handleCompleteProfileSubmit(event)}>
              <label htmlFor="profileName">Nama</label>
              <input id="profileName" type="text" placeholder="Masukkan nama lengkap" value={form.nama} onChange={updateField('nama')} />
              {fieldErrors.nama ? <div className="field-error">{fieldErrors.nama[0]}</div> : null}

              <label htmlFor="profileTtl">Tempat, Tanggal Lahir</label>
              <input id="profileTtl" type="text" placeholder="Contoh: Jakarta, 01 Januari 2000" value={form.ttl} onChange={updateField('ttl')} />
              {fieldErrors.ttl ? <div className="field-error">{fieldErrors.ttl[0]}</div> : null}

              <label htmlFor="profileGender">Jenis Kelamin</label>
              <select id="profileGender" value={form.gender} onChange={updateField('gender')}>
                <option value="" disabled>Pilih jenis kelamin</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
              {fieldErrors.gender ? <div className="field-error">{fieldErrors.gender[0]}</div> : null}

              <label htmlFor="profilePhone">No. HP</label>
              <input id="profilePhone" type="tel" placeholder="08xxxxxxxxxx" value={form.nohp} onChange={updateField('nohp')} />
              {fieldErrors.nohp ? <div className="field-error">{fieldErrors.nohp[0]}</div> : null}

              <label htmlFor="profileAddress">Alamat</label>
              <textarea id="profileAddress" placeholder="Masukkan alamat lengkap" value={form.alamat} onChange={updateField('alamat')}></textarea>
              {fieldErrors.alamat ? <div className="field-error">{fieldErrors.alamat[0]}</div> : null}

              <label htmlFor="profileReference">Referensi</label>
              <input id="profileReference" type="text" placeholder="Contoh: Instagram, Teman, Internal" value={form.refference} onChange={updateField('refference')} />
              {fieldErrors.refference ? <div className="field-error">{fieldErrors.refference[0]}</div> : null}

              {fieldErrors.pid_user ? <div className="field-error">{fieldErrors.pid_user[0]}</div> : null}

              {submitMessage ? <div className={`submit-message ${submitMessage.type}`}>{submitMessage.text}</div> : null}

              <button type="submit" className="register-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan dan Lanjut'}
              </button>

              <div className="onboarding-footer-note">Setelah ini kamu bisa lanjut ke tahap belajar dengan identitas akun yang sudah lebih lengkap.</div>

              <Link to="/login" className="back-home">Lanjut ke Login</Link>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}

function AccountProfileEditModal({ open, onClose, profile }) {
  if (!open) return null

  const detail = profile?.detail ?? {}

  return (
    <div className="account-profile-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="account-profile-modal" role="dialog" aria-modal="true" aria-labelledby="accountProfileEditTitle" onClick={(event) => event.stopPropagation()}>
        <div className="account-profile-modal-head">
          <div>
            <p className="account-profile-modal-kicker">Edit Profile</p>
            <h3 id="accountProfileEditTitle">Form edit belum diaktifkan</h3>
          </div>
          <button type="button" className="account-profile-modal-close" onClick={onClose} aria-label="Tutup">×</button>
        </div>

        <p className="account-profile-modal-note">
          Untuk sementara ini modal hanya menampilkan data yang sudah tersimpan. Logika simpan/update akan ditambahkan nanti.
        </p>

        <div className="account-profile-modal-grid">
          {[
            ['Nama', detail.nama || 'Belum diisi'],
            ['Tanggal Lahir', detail.ttl || 'Belum diisi'],
            ['Jenis Kelamin', detail.gender === 'L' ? 'Laki-laki' : detail.gender === 'P' ? 'Perempuan' : 'Belum diisi'],
            ['No. HP', detail.nohp || 'Belum diisi'],
            ['Alamat', detail.alamat || 'Belum diisi'],
            ['Referensi', detail.refference || 'Belum diisi'],
          ].map(([label, value]) => (
            <label className="account-profile-field" key={label}>
              <span>{label}</span>
              <input type="text" value={value} readOnly />
            </label>
          ))}
        </div>

        <div className="account-profile-modal-actions">
          <button type="button" className="dashboard-secondary-action" onClick={onClose}>Tutup</button>
          <button type="button" className="register-btn" disabled>Simpan (nanti)</button>
        </div>
      </div>
    </div>
  )
}

function AccountProfilePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const storedUser = readStoredUser()
  const user = location.state?.user ?? storedUser
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef(null)
  const [profile, setProfile] = useState(user ? { ...user, detail: null } : null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(Boolean(user))
  const [profileError, setProfileError] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    const handleDocumentPointerDown = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false)
      }
    }

    const handleDocumentKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handleDocumentPointerDown)
    document.addEventListener('keydown', handleDocumentKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handleDocumentPointerDown)
      document.removeEventListener('keydown', handleDocumentKeyDown)
    }
  }, [])

  useEffect(() => {
    if (!user?.pid) {
      setIsLoadingProfile(false)
      return
    }

    let isMounted = true

    const loadProfile = async () => {
      setIsLoadingProfile(true)
      setProfileError(null)

      try {
        const response = await fetch(`${BACKEND_URL}/api/account-profile/${user.pid}`)
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message || 'Profil gagal dimuat.')
        }

        if (isMounted) {
          setProfile((current) => ({
            ...current,
            ...payload.data,
            detail: payload.data?.detail ?? null,
          }))
        }
      } catch (error) {
        if (isMounted) {
          setProfileError(error instanceof Error ? error.message : 'Profil gagal dimuat.')
        }
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false)
        }
      }
    }

    void loadProfile()

    return () => {
      isMounted = false
    }
  }, [user?.pid])

  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/account-profile' }} />
  }

  const activeProfile = profile ?? user
  const detail = activeProfile?.detail ?? {}
  const displayName = detail.nama || activeProfile?.nama || activeProfile?.name || activeProfile?.email?.split('@')?.[0] || 'User'
  const username = activeProfile?.email ? `@${activeProfile.email.split('@')[0]}` : '@user'
  const emailLabel = activeProfile?.email || 'Belum tersedia'
  const genderLabel = detail.gender === 'L' ? 'Laki-laki' : detail.gender === 'P' ? 'Perempuan' : 'Belum diisi'
  const formattedBirthDate = detail.ttl || 'Belum diisi'
  const biodataItems = [
    ['Nama Lengkap', displayName],
    ['Tempat, Tanggal Lahir', formattedBirthDate],
    ['Jenis Kelamin', genderLabel],
    ['No. HP', detail.nohp || 'Belum diisi'],
    ['Alamat', detail.alamat || 'Belum diisi'],
    ['Referensi', detail.refference || 'Belum diisi'],
  ]

  const sidebarItems = [
    { label: 'Dashboard' },
    { label: 'Materi' },
    { label: 'Tryout' },
    { label: 'Jadwal' },
    { label: 'Bantuan' },
  ]

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    clearAuthUser()

    navigate('/login', { replace: true })
  }

  return (
    <div className="dashboard-page dashboard-page-v2 account-profile-page">
      <div className={`dashboard-shell dashboard-shell-v2${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <aside className={`dashboard-sidebar dashboard-sidebar-v2${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
          <div className="dashboard-sidebar-brand-row">
            <div className="dashboard-brand-lockup">
              <Link to="/" className="dashboard-brand-link" aria-label="Beranda Nice On">
                <div className="dashboard-brand-logo-shell">
                  <img src={niceonImage} alt="Nice On" className="dashboard-brand-logo" />
                </div>
              </Link>
            </div>
            <button
              type="button"
              className="dashboard-sidebar-collapse"
              aria-label={isSidebarCollapsed ? 'Tampilkan sidebar' : 'Sembunyikan sidebar'}
              onClick={() => setIsSidebarCollapsed((current) => !current)}
            >
              {isSidebarCollapsed ? '»' : '«'}
            </button>
          </div>

          <nav className="dashboard-nav" aria-label="Navigasi dashboard">
            {sidebarItems.map((item) => (
              <button key={item.label} type="button" className={`dashboard-nav-item${item.label === 'Dashboard' ? ' active' : ''}`}>
                <span className="dashboard-nav-icon" aria-hidden="true">{item.label.slice(0, 1)}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="dashboard-sidebar-section-label">Akun</div>

          <div className="dashboard-account-card">
            <div className="dashboard-account-avatar">{displayName.slice(0, 2).toUpperCase()}</div>
            <div>
              <div className="dashboard-account-name">{displayName}</div>
              <div className="dashboard-account-meta">{emailLabel}</div>
            </div>
          </div>

          <button type="button" className="dashboard-upgrade-card" onClick={() => navigate('/complete-profile', { state: { registeredUser: activeProfile } })}>
            <strong>Tetap tingkatkan kemampuanmu!</strong>
            <p>{detail.nama ? 'Data profil sudah tersimpan. Kamu bisa memperbarui kapan saja.' : 'Lengkapi profil untuk pengalaman belajar yang lebih personal.'}</p>
            <span className="dashboard-upgrade-cta">Lihat Progress</span>
          </button>

          <button type="button" className="dashboard-logout-button" onClick={handleLogout} aria-label="Keluar Akun">
            <span aria-hidden="true">⎋</span>
            <span className="dashboard-button-label">Keluar Akun</span>
          </button>
        </aside>

        <main className="dashboard-main dashboard-main-v2 account-profile-main">
          <header className="dashboard-topbar">
            <div className="dashboard-topbar-left">
              <button
                type="button"
                className="dashboard-menu-button"
                aria-label={isSidebarCollapsed ? 'Buka navigasi' : 'Sembunyikan navigasi'}
                onClick={() => setIsSidebarCollapsed((current) => !current)}
              >
                ☰
              </button>
              <p>Profil akun <strong>{displayName}</strong></p>
            </div>

            <div className="dashboard-topbar-right">
              <button type="button" className="dashboard-home-button" aria-label="Beranda" onClick={() => navigate('/')}>
                🏠
              </button>
              <button type="button" className="dashboard-notification-button" aria-label="Notifikasi">
                🔔<span className="dashboard-notification-dot" />
              </button>
              <div className="dashboard-profile-menu-wrap" ref={profileMenuRef}>
                <button
                  type="button"
                  className="dashboard-profile-chip"
                  aria-haspopup="menu"
                  aria-expanded={isProfileMenuOpen}
                  onClick={() => setIsProfileMenuOpen((current) => !current)}
                >
                  <span className="dashboard-profile-avatar">{displayName.slice(0, 2).toUpperCase()}</span>
                  <span>{displayName}</span>
                  <span aria-hidden="true">⌄</span>
                </button>

                {isProfileMenuOpen ? (
                  <div className="dashboard-profile-dropdown" role="menu" aria-label="Menu akun">
                    <button
                      type="button"
                      className="dashboard-profile-dropdown-item"
                      role="menuitem"
                      onClick={() => {
                        setIsProfileMenuOpen(false)
                        navigate('/account-profile', { state: { user: activeProfile } })
                      }}
                    >
                      <span className="dashboard-profile-dropdown-label">Resume Profile</span>
                    </button>
                    <button
                      type="button"
                      className="dashboard-profile-dropdown-item danger"
                      role="menuitem"
                      onClick={() => {
                        setIsProfileMenuOpen(false)
                        handleLogout()
                      }}
                    >
                      <span className="dashboard-profile-dropdown-label">Logout</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <section className="account-profile-hero-card">
            <div className="account-profile-cover">
              <div className="account-profile-avatar-frame">
                <div className="account-profile-avatar-circle" aria-hidden="true">
                  <span>{displayName.slice(0, 2).toUpperCase()}</span>
                </div>
              </div>
            </div>

            <section className="account-profile-header-row">
              <div className="account-profile-title-block">
                <h1>{displayName}</h1>
                <p>{username}</p>
                <span>{emailLabel}</span>
              </div>

              <div className="account-profile-tabs" aria-label="Navigasi profil">
                <button type="button" className="account-profile-tab active">Personal Info</button>
                <button type="button" className="account-profile-tab">Eduparx Points</button>
                <button type="button" className="account-profile-tab">Personal Historical Learning</button>
              </div>
            </section>
          </section>

          {profileError ? <div className="account-profile-alert error">{profileError}</div> : null}
          {isLoadingProfile ? <div className="account-profile-alert">Memuat data profil...</div> : null}

          <section className="account-profile-grid-layout">
            <div className="account-profile-column">
              <article className="account-profile-card">
                <div className="account-profile-card-head">
                  <h2>Biodata</h2>
                  <button type="button" className="account-profile-edit-button" onClick={() => setShowEditModal(true)}>Edit ✎</button>
                </div>
                <div className="account-profile-card-body">
                  {biodataItems.map(([label, value]) => (
                    <div className="account-profile-row" key={label}>
                      <span className="account-profile-row-label">{label}</span>
                      <strong className="account-profile-row-value">{value}</strong>
                    </div>
                  ))}
                </div>
              </article>

              <article className="account-profile-card account-profile-empty-card">
                <div className="account-profile-card-head">
                  <h2>Job Roles</h2>
                </div>
                <div className="account-profile-empty-state">
                  <strong>Tidak Ada Data</strong>
                  <p>Mohon pilih minimal satu job role</p>
                </div>
              </article>
            </div>

            <div className="account-profile-column">
              <article className="account-profile-card">
                <div className="account-profile-card-head">
                  <h2>Biografi</h2>
                  <button type="button" className="account-profile-edit-button" onClick={() => setShowEditModal(true)}>Edit ✎</button>
                </div>
                <div className="account-profile-card-body">
                  <div className="account-profile-bio-box">
                    <p>{detail.alamat || 'Biografi belum diisi untuk akun ini.'}</p>
                  </div>
                </div>
              </article>

              <article className="account-profile-card account-profile-empty-card">
                <div className="account-profile-card-head">
                  <h2>Riwayat</h2>
                </div>
                <div className="account-profile-empty-state account-profile-history-empty">
                  <strong>Tidak Ada Data</strong>
                  <p>Riwayat belajar akan tampil setelah aktivitas tersedia.</p>
                </div>
              </article>
            </div>
          </section>

          <div className="account-profile-footer-actions">
            <button type="button" className="dashboard-secondary-action" onClick={() => navigate('/dashboard-user', { state: { user: activeProfile } })}>
              Kembali ke Dashboard
            </button>
          </div>
        </main>
      </div>

      <AccountProfileEditModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        profile={activeProfile}
      />

      <AdminLogoutModal
        open={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Keluar dari akun user?"
        message="Pastikan progres atau aktivitas yang sedang berjalan sudah disimpan sebelum Anda logout."
        confirmLabel="Ya, keluar"
      />
    </div>
  )
}

function DashboardUserPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const storedUser = readStoredUser()
  const user = location.state?.user ?? storedUser

  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/dashboard-user' }} />
  }

  const displayName = user?.nama || user?.name || user?.email?.split('@')?.[0] || 'User'
  const isProfileComplete = user?.profile_completed !== false

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    clearAuthUser()

    navigate('/login', { replace: true })
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <aside className="dashboard-sidebar">
          <div className="dashboard-brand">NICE ON</div>
          <div className="dashboard-sidebar-heading">
            <h1>Dashboard User</h1>
            <p className="dashboard-user-name">{displayName}</p>
          </div>
          <p>
            {isProfileComplete
              ? 'Kamu berhasil login dan siap mulai belajar.'
              : 'Kamu berhasil login. Lanjutkan melengkapi profil agar pengalaman belajar lebih personal.'}
          </p>

          <div className="dashboard-status-card">
            <span>Mode Akses</span>
            <strong>Dashboard User</strong>
          </div>

          <div className="dashboard-status-card">
            <span>Status Akun</span>
            <strong>{user?.status ?? 'active'}</strong>
          </div>

          <div className="dashboard-status-card">
            <span>Email</span>
            <strong>{user?.email ?? 'Belum tersedia'}</strong>
          </div>

          <div className="dashboard-actions">
            {!isProfileComplete ? (
              <button
                type="button"
                className="register-btn"
                onClick={() => navigate('/complete-profile', { state: { registeredUser: user } })}
              >
                Lanjut Lengkapi Profil
              </button>
            ) : (
              <button type="button" className="register-btn" onClick={() => navigate('/')}>
                Mulai Belajar
              </button>
            )}
            <button type="button" className="dashboard-logout-button" onClick={handleLogout}>
              Keluar Akun
            </button>
          </div>
        </aside>

        <main className="dashboard-main">
          <section className="dashboard-hero-card">
            <div className="dashboard-hero-topline">
              <div className="onboarding-success-pill">Login Berhasil</div>
              <div className="dashboard-hero-meta">Selamat datang kembali</div>
            </div>
            <h2>Dashboard user yang lebih rapi dan fokus.</h2>
            <p>
              Dari sini kamu bisa melanjutkan profil, mengecek progres, atau langsung masuk ke sesi belajar berikutnya.
            </p>
            <div className="dashboard-hero-actions">
              {!isProfileComplete ? (
                <button
                  type="button"
                  className="dashboard-primary-action"
                  onClick={() => navigate('/complete-profile', { state: { registeredUser: user } })}
                >
                  Lengkapi Profil
                </button>
              ) : (
                <button type="button" className="dashboard-primary-action" onClick={() => navigate('/')}>
                  Mulai Belajar
                </button>
              )}
              <button type="button" className="dashboard-secondary-action" onClick={() => navigate('/login')}>
                Ganti Akun
              </button>
            </div>
          </section>

          <section className="dashboard-grid">
            {[
              ['Progress', isProfileComplete ? '100%' : '0%', isProfileComplete ? 'Profil siap dipakai' : 'Profil awal belum diselesaikan'],
              ['Tryout Hari Ini', '0', 'Belum ada aktivitas'],
              ['Target Mingguan', '7 sesi', 'Siap ditetapkan'],
            ].map(([label, value, desc]) => (
              <article className="dashboard-metric" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <p>{desc}</p>
              </article>
            ))}
          </section>

          <section className="dashboard-lower-grid">
            <article className="dashboard-panel-card">
              <div className="dashboard-panel-head">
                <h3>Langkah Berikutnya</h3>
                <span>{isProfileComplete ? 'Siap' : 'Perlu dilengkapi'}</span>
              </div>
              <ol className="dashboard-steps">
                <li>{isProfileComplete ? 'Mulai dari materi atau tryout yang tersedia.' : 'Lengkapi profil dasar agar akun lebih lengkap.'}</li>
                <li>Masuk ke dashboard belajar dan pilih program yang sesuai.</li>
                <li>Pantau progres dari riwayat sesi berikutnya.</li>
              </ol>
            </article>

            <article className="dashboard-panel-card">
              <div className="dashboard-panel-head">
                <h3>Akses Cepat</h3>
                <span>Shortcut</span>
              </div>
              <div className="dashboard-quick-actions">
                <button type="button" className="dashboard-quick-button">Materi</button>
                <button type="button" className="dashboard-quick-button">Tryout</button>
                <button type="button" className="dashboard-quick-button">Jadwal</button>
                <button type="button" className="dashboard-quick-button">Bantuan</button>
              </div>
            </article>
          </section>
        </main>
      </div>
      <AdminLogoutModal
        open={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Keluar dari akun user?"
        message="Pastikan progres atau aktivitas yang sedang berjalan sudah disimpan sebelum Anda logout."
        confirmLabel="Ya, keluar"
      />
    </div>
  )
}

function DashboardUserPageV2() {
  const location = useLocation()
  const navigate = useNavigate()
  const storedUser = readStoredUser()
  const user = location.state?.user ?? storedUser
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef(null)

  useEffect(() => {
    const handleDocumentPointerDown = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false)
      }
    }

    const handleDocumentKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handleDocumentPointerDown)
    document.addEventListener('keydown', handleDocumentKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handleDocumentPointerDown)
      document.removeEventListener('keydown', handleDocumentKeyDown)
    }
  }, [])

  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/dashboard-user' }} />
  }

  const displayName = user?.nama || user?.name || user?.email?.split('@')?.[0] || 'User'
  const isProfileComplete = user?.profile_completed !== false
  const initials = displayName.slice(0, 2).toUpperCase()

  const sidebarItems = [
    { label: 'Dashboard', active: true },
    { label: 'Materi' },
    { label: 'Tryout' },
    { label: 'Jadwal' },
    { label: 'Bantuan' },
  ]

  const stats = [
    ['Progress', isProfileComplete ? '100%' : '0%', isProfileComplete ? 'Profil siap dipakai' : 'Profil belum lengkap'],
    ['Tryout Hari Ini', '0', 'Belum ada aktivitas'],
    ['Target Mingguan', '7 sesi', 'Siap ditetapkan'],
    ['Streak Belajar', '3 hari', 'Pertahankan konsistensi!'],
  ]

  const quickActions = [
    ['Materi', 'Buka materi belajar'],
    ['Tryout', 'Kerjakan tryout'],
    ['Jadwal', 'Lihat jadwal kelas'],
    ['Bantuan', 'Butuh bantuan?'],
  ]

  const nextSteps = [
    isProfileComplete ? 'Mulai dari materi atau tryout yang tersedia.' : 'Lengkapi profil dasar agar akun lebih lengkap.',
    'Masuk ke dashboard belajar dan pilih program yang sesuai.',
    'Pantau progres dari riwayat sesi berikutnya.',
  ]

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    clearAuthUser()

    navigate('/login', { replace: true })
  }

  return (
    <div className="dashboard-page dashboard-page-v2">
      <div className={`dashboard-shell dashboard-shell-v2${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <aside className={`dashboard-sidebar dashboard-sidebar-v2${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
          <div className="dashboard-sidebar-brand-row">
            <div className="dashboard-brand-lockup">
              <Link to="/" className="dashboard-brand-link" aria-label="Beranda Nice On">
                <div className="dashboard-brand-logo-shell">
                  <img src={niceonImage} alt="Nice On" className="dashboard-brand-logo" />
                </div>
              </Link>
            </div>
            <button
              type="button"
              className="dashboard-sidebar-collapse"
              aria-label={isSidebarCollapsed ? 'Tampilkan sidebar' : 'Sembunyikan sidebar'}
              onClick={() => setIsSidebarCollapsed((current) => !current)}
            >
              {isSidebarCollapsed ? '»' : '«'}
            </button>
          </div>

          <nav className="dashboard-nav" aria-label="Navigasi dashboard">
            {sidebarItems.map((item) => (
              <button key={item.label} type="button" className={`dashboard-nav-item${item.active ? ' active' : ''}`}>
                <span className="dashboard-nav-icon" aria-hidden="true">{item.label.slice(0, 1)}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="dashboard-sidebar-section-label">Akun</div>

          <div className="dashboard-account-card">
            <div className="dashboard-account-avatar">{initials}</div>
            <div>
              <div className="dashboard-account-name">{displayName}</div>
              <div className="dashboard-account-meta">{user?.email ?? 'Belum tersedia'}</div>
            </div>
          </div>

          <button type="button" className="dashboard-upgrade-card" onClick={() => navigate('/complete-profile', { state: { registeredUser: user } })}>
            <strong>Tetap tingkatkan kemampuanmu!</strong>
            <p>{isProfileComplete ? 'Belajar rutin dan jaga ritme progresmu.' : 'Lengkapi profil untuk pengalaman belajar yang lebih personal.'}</p>
            <span className="dashboard-upgrade-cta">Lihat Progress</span>
          </button>

          <button type="button" className="dashboard-logout-button" onClick={handleLogout} aria-label="Keluar Akun">
            <span aria-hidden="true">⎋</span>
            <span className="dashboard-button-label">Keluar Akun</span>
          </button>
        </aside>

        <main className="dashboard-main dashboard-main-v2">
          <header className="dashboard-topbar">
            <div className="dashboard-topbar-left">
              <button
                type="button"
                className="dashboard-menu-button"
                aria-label={isSidebarCollapsed ? 'Buka navigasi' : 'Sembunyikan navigasi'}
                onClick={() => setIsSidebarCollapsed((current) => !current)}
              >
                ☰
              </button>
              <p>Selamat datang kembali, <strong>{displayName}</strong>! 👋</p>
            </div>

            <div className="dashboard-topbar-right">
              <button type="button" className="dashboard-home-button" aria-label="Beranda" onClick={() => navigate('/')}>
                🏠
              </button>
              <button type="button" className="dashboard-notification-button" aria-label="Notifikasi">
                🔔<span className="dashboard-notification-dot" />
              </button>
              <div className="dashboard-profile-menu-wrap" ref={profileMenuRef}>
                <button
                  type="button"
                  className="dashboard-profile-chip"
                  aria-haspopup="menu"
                  aria-expanded={isProfileMenuOpen}
                  onClick={() => setIsProfileMenuOpen((current) => !current)}
                >
                  <span className="dashboard-profile-avatar">{initials}</span>
                  <span>{displayName}</span>
                  <span aria-hidden="true">⌄</span>
                </button>

                {isProfileMenuOpen ? (
                  <div className="dashboard-profile-dropdown" role="menu" aria-label="Menu akun">
                    <button
                      type="button"
                      className="dashboard-profile-dropdown-item"
                      role="menuitem"
                      onClick={() => {
                        setIsProfileMenuOpen(false)
                        navigate('/account-profile', { state: { user } })
                      }}
                    >
                      <span className="dashboard-profile-dropdown-label">Resume Profile</span>
                    </button>
                    <button
                      type="button"
                      className="dashboard-profile-dropdown-item danger"
                      role="menuitem"
                      onClick={() => {
                        setIsProfileMenuOpen(false)
                        handleLogout()
                      }}
                    >
                      <span className="dashboard-profile-dropdown-label">Logout</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <section className="dashboard-hero-card dashboard-hero-card--light">
            <div className="dashboard-hero-copy">
              <div className="dashboard-status-pill success">Login Berhasil</div>
              <h1>Dashboard siap menemani belajarmu.</h1>
              <p>
                Dari sini kamu bisa melanjutkan profil, mengecek progres, atau langsung masuk ke sesi belajar berikutnya.
              </p>
              <div className="dashboard-hero-actions">
                <button type="button" className="dashboard-primary-action" onClick={() => navigate('/')}>
                  Mulai Belajar <span aria-hidden="true">→</span>
                </button>
                <button type="button" className="dashboard-secondary-action" onClick={() => navigate('/login')}>
                  Ganti Akun <span aria-hidden="true">↻</span>
                </button>
              </div>
            </div>

            <div className="dashboard-hero-visual dashboard-hero-visual-image" aria-hidden="true">
              <img src="/study.png" alt="Ilustrasi belajar" className="dashboard-study-image" />
            </div>
          </section>

          <section className="dashboard-stats-grid">
            {stats.map(([label, value, desc], index) => (
              <article className="dashboard-stat-card" key={label}>
                <div className="dashboard-stat-badge">{label.slice(0, 1)}</div>
                <div className="dashboard-stat-label">{label}</div>
                <strong>{value}</strong>
                <p>{desc}</p>
                <span className={`dashboard-stat-bar bar-${index + 1}`} />
              </article>
            ))}
          </section>

          <section className="dashboard-panels-grid">
            <article className="dashboard-panel-card dashboard-next-steps-card">
              <div className="dashboard-panel-head">
                <h3>Langkah Berikutnya</h3>
                <span>{isProfileComplete ? 'SIAP' : 'PERLU DILENGKAPI'}</span>
              </div>
              <ol className="dashboard-step-list">
                {nextSteps.map((step, index) => (
                  <li key={step}>
                    <span>{index + 1}</span>
                    <p>{step}</p>
                    <span aria-hidden="true">›</span>
                  </li>
                ))}
              </ol>
            </article>

            <article className="dashboard-panel-card dashboard-quick-access-card">
              <div className="dashboard-panel-head">
                <h3>Akses Cepat</h3>
                <span>SHORTCUT</span>
              </div>
              <div className="dashboard-quick-grid">
                {quickActions.map(([label, desc]) => (
                  <button key={label} type="button" className="dashboard-quick-tile">
                    <div className="dashboard-quick-tile-icon">{label.slice(0, 1)}</div>
                    <div className="dashboard-quick-tile-copy">
                      <strong>{label}</strong>
                      <span>{desc}</span>
                    </div>
                    <span aria-hidden="true">→</span>
                  </button>
                ))}
              </div>
            </article>
          </section>
        </main>
      </div>
      <AdminLogoutModal
        open={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Keluar dari akun user?"
        message="Pastikan progres atau aktivitas yang sedang berjalan sudah disimpan sebelum Anda logout."
        confirmLabel="Ya, keluar"
      />
    </div>
  )
}

function AdminDashboardPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => readStoredAdminSidebarState())
  const [totalPackages, setTotalPackages] = useState('24')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const storedUser = readStoredUser()
  const user = location.state?.user ?? storedUser
  const currentPath = location.pathname

  if (!user || Number(user?.is_admin ?? 0) !== 1) {
    return <Navigate to="/login" replace state={{ from: '/dashboard-admin' }} />
  }

  const displayName = user?.email?.split('@')?.[0] || 'Admin'
  const summaryCards = [
    { label: 'Total User', value: '1.248', delta: '↑ 12.5% dari minggu lalu', accent: 'blue', icon: '👥' },
    { label: 'Total Transaksi', value: '320', delta: '↑ 8.2% dari minggu lalu', accent: 'green', icon: '🛒' },
    { label: 'Total Pendapatan', value: 'Rp 24.560.000', delta: '↑ 15.3% dari minggu lalu', accent: 'orange', icon: '💳' },
    { label: 'Total Paket', value: totalPackages, delta: 'Tidak berubah', accent: 'purple', icon: '📦' },
  ]
  const activityItems = [
    { icon: '👤', title: 'User baru mendaftar', subtitle: 'Budi Santoso', time: '10 menit lalu', tone: 'blue' },
    { icon: '✅', title: 'Transaksi berhasil', subtitle: 'INV-202505-1289', time: '35 menit lalu', tone: 'green' },
    { icon: '📦', title: 'Paket baru ditambahkan', subtitle: 'Paket Intensif CPNS', time: '1 jam lalu', tone: 'purple' },
    { icon: '📝', title: 'Konten baru diterbitkan', subtitle: 'Tips Belajar Efektif', time: '2 jam lalu', tone: 'blue' },
    { icon: '👤', title: 'Admin mengupdate data user', subtitle: 'Siti Aminah', time: '3 jam lalu', tone: 'orange' },
  ]
  const topPackages = [
    ['Paket Intensif CPNS', '128 transaksi'],
    ['Paket PPPK Guru', '96 transaksi'],
    ['Paket Kedinasan', '64 transaksi'],
    ['Paket Tryout Premium', '32 transaksi'],
    ['Paket Belajar Mandiri', '28 transaksi'],
  ]
  const systemStatus = [
    ['Server', 'Online'],
    ['Database', 'Online'],
    ['Mail Service', 'Online'],
    ['Storage', 'Online'],
    ['Backup', 'Aktif'],
  ]
  const currentDateLabel = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
    .format(new Date())
    .replace(/^./, (char) => char.toUpperCase())

  const adminMainMenu = [
    { label: 'Dashboard', href: '/dashboard-admin' },
    { label: 'User', href: '/dashboard-admin/users' },
    { label: 'Paket', href: '/dashboard-admin/packages' },
    { label: 'Transaksi', href: '#' },
    { label: 'Konten', href: '#' },
    { label: 'Laporan', href: '#' },
  ]
  const adminSystemMenu = [
    { label: 'Pengaturan', href: '#', active: false },
    { label: 'Admin', href: '#', active: false },
    { label: 'Log Aktivitas', href: '#', active: false },
  ]

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    clearAuthUser()

    navigate('/login', { replace: true })
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(ADMIN_SIDEBAR_COLLAPSED_KEY, String(isSidebarCollapsed))
  }, [isSidebarCollapsed])

  useEffect(() => {
    let cancelled = false

    const loadSummary = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/admin/dashboard-summary`)
        if (!response.ok) return

        const payload = await response.json()
        const nextTotal = payload?.data?.total_paket

        if (!cancelled && nextTotal !== undefined && nextTotal !== null) {
          setTotalPackages(String(nextTotal))
        }
      } catch {
        // Keep fallback value.
      }
    }

    void loadSummary()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="admin-dashboard-page">
      <div className={`admin-dashboard-shell${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <aside className={`admin-sidebar${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
          <div className="admin-brand-block">
            <Link to="/" className="admin-brand-link" aria-label="Beranda Nice On">
              <img src={niceonImage} alt="Nice On" className="admin-brand-logo" />
              <div className={`admin-brand-copy${isSidebarCollapsed ? ' collapsed' : ''}`}>
                <strong>Admin Panel</strong>
                <span>Learning Hub</span>
              </div>
            </Link>
          </div>

          <div className="admin-sidebar-group-label">Main</div>
          <nav className="admin-sidebar-nav" aria-label="Navigasi admin">
            {adminMainMenu.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`admin-sidebar-item${currentPath === item.href ? ' active' : ''}`}
                onClick={() => item.href !== '#' && navigate(item.href)}
              >
                <span className="admin-sidebar-icon" aria-hidden="true">{item.label.slice(0, 1)}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="admin-sidebar-group-label">System</div>
          <nav className="admin-sidebar-nav" aria-label="Menu sistem admin">
            {adminSystemMenu.map((item) => (
              <button
                key={item.label}
                type="button"
                className="admin-sidebar-item secondary"
                onClick={() => item.href !== '#' && navigate(item.href)}
              >
                <span className="admin-sidebar-icon" aria-hidden="true">{item.label.slice(0, 1)}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="admin-sidebar-footer-card">
            <button type="button" className="admin-sidebar-logout" onClick={handleLogout}>
              <span aria-hidden="true">⎋</span>
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <main className="admin-main">
          <AdminTopbar
            title="Dashboard Admin"
            searchPlaceholder="Cari sesuatu..."
            currentDateLabel={currentDateLabel}
            displayName="Ahmad Bayu"
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={() => setIsSidebarCollapsed((current) => !current)}
            onHomeClick={() => navigate('/')}
          />

          <section className="admin-hero-row">
            <div>
              <h2>Selamat datang kembali, Ahmad Bayu! 👋</h2>
              <p>Berikut ringkasan performa platform hari ini.</p>
            </div>

            <button type="button" className="admin-range-chip">
              <span aria-hidden="true">📅</span>
              <span>19 Mei 2025 - 26 Mei 2025</span>
              <span aria-hidden="true">⌄</span>
            </button>
          </section>

          <section className="admin-summary-grid">
            {summaryCards.map((card) => (
              <article className={`admin-summary-card ${card.accent}`} key={card.label}>
                <div className={`admin-summary-icon ${card.accent}`}>{card.icon}</div>
                <div className="admin-summary-copy">
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                  <p>{card.delta}</p>
                </div>
              </article>
            ))}
          </section>

          <section className="admin-content-grid">
            <article className="admin-card admin-chart-card">
              <div className="admin-card-head">
                <h3>Grafik Pendapatan</h3>
                <button type="button" className="admin-card-chip">7 Hari Terakhir <span aria-hidden="true">⌄</span></button>
              </div>

              <div className="admin-chart-wrap">
                <svg viewBox="0 0 720 240" className="admin-chart-svg" aria-hidden="true" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="incomeLine" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stopColor="#1d64ff" />
                      <stop offset="100%" stopColor="#2e7bff" />
                    </linearGradient>
                    <linearGradient id="incomeFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="rgba(29,100,255,0.20)" />
                      <stop offset="100%" stopColor="rgba(29,100,255,0.02)" />
                    </linearGradient>
                  </defs>
                  <path d="M40 172 C90 170, 116 156, 160 132 S248 100, 292 114 S380 158, 430 98 S520 56, 580 110 S660 150, 680 146 L680 218 L40 218 Z" fill="url(#incomeFill)" />
                  <path d="M40 172 C90 170, 116 156, 160 132 S248 100, 292 114 S380 158, 430 98 S520 56, 580 110 S660 150, 680 146" fill="none" stroke="url(#incomeLine)" strokeWidth="4" strokeLinecap="round" />
                  <path d="M40 198 C90 188, 116 184, 160 150 S248 128, 292 136 S380 166, 430 138 S520 146, 580 136 S660 154, 680 160" fill="none" stroke="#b8c7ff" strokeWidth="3" strokeDasharray="4 8" strokeLinecap="round" opacity="0.9" />
                  {[40, 160, 292, 430, 580, 680].map((x, index) => (
                    <circle key={x} cx={x} cy={[172, 132, 114, 98, 110, 146][index]} r="6" fill="#fff" stroke="#1d64ff" strokeWidth="3" />
                  ))}
                </svg>

                <div className="admin-chart-legend">
                  <span><i className="legend-primary" /> Pendapatan</span>
                  <span><i className="legend-secondary" /> Minggu Lalu</span>
                </div>
              </div>
            </article>

            <article className="admin-card admin-activity-card">
              <div className="admin-card-head">
                <h3>Aktivitas Terbaru</h3>
                <button type="button" className="admin-card-link">Lihat semua</button>
              </div>

              <div className="admin-activity-list">
                {activityItems.map((item) => (
                  <div className="admin-activity-item" key={`${item.title}-${item.subtitle}`}>
                    <div className={`admin-activity-icon ${item.tone}`}>{item.icon}</div>
                    <div className="admin-activity-copy">
                      <strong>{item.title}</strong>
                      <span>{item.subtitle}</span>
                    </div>
                    <div className="admin-activity-time">{item.time}</div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="admin-bottom-grid">
            <article className="admin-card admin-donut-card">
              <h3>Distribusi User</h3>
              <div className="admin-donut-wrap">
                <div className="admin-donut" aria-hidden="true">
                  <div className="admin-donut-center">
                    <strong>1.248</strong>
                    <span>Total User</span>
                  </div>
                </div>

                <div className="admin-donut-legend">
                  <div><i className="dot green" /> Active <span>876 (70.2%)</span></div>
                  <div><i className="dot yellow" /> Inactive <span>234 (18.8%)</span></div>
                  <div><i className="dot purple" /> Pending <span>138 (11.0%)</span></div>
                </div>
              </div>
            </article>

            <article className="admin-card admin-packages-card">
              <div className="admin-card-head">
                <h3>Top Paket Terlaris</h3>
                <button type="button" className="admin-card-link">Lihat semua</button>
              </div>

              <div className="admin-rank-list">
                {topPackages.map(([name, count], index) => (
                  <div className="admin-rank-item" key={name}>
                    <div className="admin-rank-number">{index + 1}</div>
                    <div className="admin-rank-name">{name}</div>
                    <div className="admin-rank-count">{count}</div>
                  </div>
                ))}
              </div>
            </article>

            <article className="admin-card admin-status-card">
              <h3>Status Sistem</h3>
              <div className="admin-status-list">
                {systemStatus.map(([name, status]) => (
                  <div className="admin-status-item" key={name}>
                    <div className="admin-status-name">{name}</div>
                    <span className="admin-status-pill">{status}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <AdminLogoutModal
            open={showLogoutConfirm}
            onCancel={() => setShowLogoutConfirm(false)}
            onConfirm={confirmLogout}
          />
        </main>
      </div>
    </div>
  )
}

function AdminUserManagementPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => readStoredAdminSidebarState())
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const storedUser = readStoredUser()
  const user = location.state?.user ?? storedUser

  if (!user || Number(user?.is_admin ?? 0) !== 1) {
    return <Navigate to="/login" replace state={{ from: '/dashboard-admin/users' }} />
  }

  const currentPath = location.pathname
  const displayName = user?.email?.split('@')?.[0] || 'Admin'
  const currentDateLabel = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
    .format(new Date())
    .replace(/^./, (char) => char.toUpperCase())

  const adminMainMenu = [
    { label: 'Dashboard', href: '/dashboard-admin' },
    { label: 'User', href: '/dashboard-admin/users' },
    { label: 'Paket', href: '/dashboard-admin/packages' },
    { label: 'Transaksi', href: '#' },
    { label: 'Konten', href: '#' },
    { label: 'Laporan', href: '#' },
  ]

  const adminSystemMenu = [
    { label: 'Pengaturan', href: '#' },
    { label: 'Admin', href: '#' },
    { label: 'Log Aktivitas', href: '#' },
  ]

  const userSummaryCards = [
    { label: 'Total User', value: '1.248', delta: '↑ 12.5% dari minggu lalu', accent: 'blue', icon: '👥' },
    { label: 'User Aktif', value: '1.102', delta: '↑ 8.3% dari minggu lalu', accent: 'green', icon: '✅' },
    { label: 'User Nonaktif', value: '120', delta: '↓ 3.1% dari minggu lalu', accent: 'orange', icon: '👤' },
    { label: 'Admin', value: '26', delta: 'Tidak berubah', accent: 'purple', icon: '🛡️' },
  ]

  const userRows = [
    { name: 'Budi Santoso', pid: '#USR-1001', email: 'budi.santoso@gmail.com', phone: '0812-3456-7890', role: 'User', status: 'Aktif', joined: '21 Mei 2025' },
    { name: 'Siti Aminah', pid: '#USR-1002', email: 'siti.aminah@gmail.com', phone: '0821-2345-6789', role: 'User', status: 'Aktif', joined: '20 Mei 2025' },
    { name: 'Ahmad Fauzi', pid: '#USR-1003', email: 'ahmad.fauzi@gmail.com', phone: '0813-1122-3344', role: 'User', status: 'Nonaktif', joined: '18 Mei 2025' },
    { name: 'Dewi Lestari', pid: '#USR-1004', email: 'dewi.lestari@gmail.com', phone: '0856-7788-9900', role: 'User', status: 'Aktif', joined: '17 Mei 2025' },
    { name: 'Rizky Maulana', pid: '#USR-1005', email: 'rizky.maulana@gmail.com', phone: '0877-6655-4433', role: 'Admin', status: 'Aktif', joined: '15 Mei 2025' },
    { name: 'Fitriani', pid: '#USR-1006', email: 'fitriani@gmail.com', phone: '0814-9988-7766', role: 'User', status: 'Nonaktif', joined: '12 Mei 2025' },
    { name: 'Hendra Wijaya', pid: '#USR-1007', email: 'hendra.wijaya@gmail.com', phone: '0899-1122-3344', role: 'User', status: 'Aktif', joined: '10 Mei 2025' },
  ]

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    clearAuthUser()

    navigate('/login', { replace: true })
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(ADMIN_SIDEBAR_COLLAPSED_KEY, String(isSidebarCollapsed))
  }, [isSidebarCollapsed])

  return (
    <div className="admin-dashboard-page admin-user-page">
      <div className={`admin-dashboard-shell${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <aside className={`admin-sidebar${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
          <div className="admin-brand-block">
            <Link to="/" className="admin-brand-link" aria-label="Beranda Nice On">
              <img src={niceonImage} alt="Nice On" className="admin-brand-logo" />
              <div className={`admin-brand-copy${isSidebarCollapsed ? ' collapsed' : ''}`}>
                <strong>Admin Panel</strong>
                <span>Learning Hub</span>
              </div>
            </Link>
          </div>

          <div className="admin-sidebar-group-label">Main</div>
          <nav className="admin-sidebar-nav" aria-label="Navigasi admin">
            {adminMainMenu.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`admin-sidebar-item${currentPath === item.href ? ' active' : ''}`}
                onClick={() => item.href !== '#' && navigate(item.href)}
              >
                <span className="admin-sidebar-icon" aria-hidden="true">{item.label.slice(0, 1)}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="admin-sidebar-group-label">System</div>
          <nav className="admin-sidebar-nav" aria-label="Menu sistem admin">
            {adminSystemMenu.map((item) => (
              <button
                key={item.label}
                type="button"
                className="admin-sidebar-item secondary"
                onClick={() => item.href !== '#' && navigate(item.href)}
              >
                <span className="admin-sidebar-icon" aria-hidden="true">{item.label.slice(0, 1)}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="admin-sidebar-footer-card">
            <button type="button" className="admin-sidebar-logout" onClick={handleLogout}>
              <span aria-hidden="true">⎋</span>
              <span>Keluar</span>
            </button>
          </div>
        </aside>

        <main className="admin-main admin-user-main">
          <AdminTopbar
            title="Manajemen User"
            searchPlaceholder="Cari user..."
            currentDateLabel={currentDateLabel}
            displayName="Ahmad Bayu"
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={() => setIsSidebarCollapsed((current) => !current)}
            onHomeClick={() => navigate('/')}
          />

          <section className="admin-user-toolbar">
            <div />
            <div className="admin-user-actions">
              <button type="button" className="admin-outline-action">Export</button>
              <button type="button" className="admin-primary-action">+ Tambah User</button>
            </div>
          </section>

          <section className="admin-summary-grid admin-user-summary-grid">
            {userSummaryCards.map((card) => (
              <article className={`admin-summary-card ${card.accent}`} key={card.label}>
                <div className={`admin-summary-icon ${card.accent}`}>{card.icon}</div>
                <div className="admin-summary-copy">
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                  <p>{card.delta}</p>
                </div>
              </article>
            ))}
          </section>

          <section className="admin-card admin-user-table-card">
            <div className="admin-user-filters">
              <label className="admin-user-search">
                <span aria-hidden="true">⌕</span>
                <input type="search" placeholder="Cari berdasarkan nama, email, atau no HP..." />
              </label>

              <div className="admin-user-filter-group">
                <button type="button" className="admin-user-filter-pill">Semua Status <span aria-hidden="true">⌄</span></button>
                <button type="button" className="admin-user-filter-pill">Semua Peran <span aria-hidden="true">⌄</span></button>
                <button type="button" className="admin-user-filter-button">Filter</button>
              </div>
            </div>

            <div className="admin-user-table-wrap">
              <table className="admin-user-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>No HP</th>
                    <th>Peran</th>
                    <th>Status</th>
                    <th>Bergabung</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {userRows.map((row) => (
                    <tr key={row.pid}>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-user-avatar">{row.name.slice(0, 1)}</div>
                          <div>
                            <strong>{row.name}</strong>
                            <span>{row.pid}</span>
                          </div>
                        </div>
                      </td>
                      <td>{row.email}</td>
                      <td>{row.phone}</td>
                      <td><span className={`admin-role-badge ${row.role.toLowerCase()}`}>{row.role}</span></td>
                      <td><span className={`admin-status-pill ${row.status.toLowerCase()}`}>{row.status}</span></td>
                      <td>{row.joined}</td>
                      <td>
                        <div className="admin-row-actions">
                          <button type="button" className="admin-row-action">👁</button>
                          <button type="button" className="admin-row-action">✎</button>
                          <button type="button" className="admin-row-action danger">🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-user-footer">
              <p>Menampilkan 1 - 10 dari 1.248 data</p>
              <div className="admin-pagination">
                <button type="button" className="admin-pagination-arrow">‹</button>
                <button type="button" className="admin-pagination-page active">1</button>
                <button type="button" className="admin-pagination-page">2</button>
                <button type="button" className="admin-pagination-page">3</button>
                <span className="admin-pagination-dots">…</span>
                <button type="button" className="admin-pagination-page">125</button>
                <button type="button" className="admin-pagination-arrow">›</button>
                <button type="button" className="admin-pagination-size">10 / halaman <span aria-hidden="true">⌄</span></button>
              </div>
            </div>
          </section>

          <AdminLogoutModal
            open={showLogoutConfirm}
            onCancel={() => setShowLogoutConfirm(false)}
            onConfirm={confirmLogout}
          />
        </main>
      </div>
    </div>
  )
}

function AdminPackageManagementPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => readStoredAdminSidebarState())
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const storedUser = readStoredUser()
  const user = location.state?.user ?? storedUser

  if (!user || Number(user?.is_admin ?? 0) !== 1) {
    return <Navigate to="/login" replace state={{ from: '/dashboard-admin/packages' }} />
  }

  const currentPath = location.pathname
  const displayName = user?.email?.split('@')?.[0] || 'Admin'
  const currentDateLabel = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
    .format(new Date())
    .replace(/^./, (char) => char.toUpperCase())

  const adminMainMenu = [
    { label: 'Dashboard', href: '/dashboard-admin' },
    { label: 'User', href: '/dashboard-admin/users' },
    { label: 'Paket', href: '/dashboard-admin/packages' },
    { label: 'Transaksi', href: '#' },
    { label: 'Konten', href: '#' },
    { label: 'Laporan', href: '#' },
  ]

  const adminSystemMenu = [
    { label: 'Pengaturan', href: '#' },
    { label: 'Admin', href: '#' },
    { label: 'Log Aktivitas', href: '#' },
  ]

  const packageSummaryCards = [
    { label: 'Total Paket', value: '24', delta: 'Semua paket tersedia', accent: 'blue', icon: '📦' },
    { label: 'Paket Aktif', value: '18', delta: 'Paket sedang aktif', accent: 'green', icon: '🏷️' },
    { label: 'Paket Nonaktif', value: '6', delta: 'Paket tidak aktif', accent: 'orange', icon: '⏱️' },
    { label: 'Total Penjualan', value: '1.248', delta: 'Paket terjual', accent: 'purple', icon: '🛒' },
  ]

  const packageFilters = [
    { placeholder: 'Semua Program', options: ['Semua Program', 'CPNS', 'PPPK'] },
    { placeholder: 'Semua Status', options: ['Semua Status', 'Aktif', 'Nonaktif'] },
  ]

  const packageRows = [
    {
      name: 'Tryout Bundle UTBK 2026',
      desc: 'Akses tryout lengkap UTBK 2026 dengan pembahasan.',
      thumb: 'TRYOUT\nBUNDLE',
      tone: 'red',
      program: 'UTBK 2026',
      type: 'Tryout',
      typeClass: 'tryout',
      price: 'Rp150.000',
      discount: '30%',
      finalPrice: 'Rp105.000',
      status: 'Aktif',
      statusClass: 'aktif',
      sold: '342',
    },
    {
      name: 'Kelas Online UTBK 2026',
      desc: 'Video materi, latihan soal, dan live class interaktif.',
      thumb: 'KELAS\nONLINE',
      tone: 'blue',
      program: 'UTBK 2026',
      type: 'Kelas Online',
      typeClass: 'online',
      price: 'Rp299.000',
      discount: '20%',
      finalPrice: 'Rp239.000',
      status: 'Aktif',
      statusClass: 'aktif',
      sold: '186',
    },
    {
      name: 'Rekaman Kelas UTBK 2026',
      desc: 'Akses rekaman kelas kapan saja dan di mana saja.',
      thumb: 'REKAMAN\nKELAS',
      tone: 'purple',
      program: 'UTBK 2026',
      type: 'Rekaman Kelas',
      typeClass: 'recorded',
      price: 'Rp199.000',
      discount: '25%',
      finalPrice: 'Rp149.000',
      status: 'Aktif',
      statusClass: 'aktif',
      sold: '275',
    },
    {
      name: 'Tryout Bundle SNBT 2026',
      desc: 'Paket tryout SNBT 2026 terlengkap.',
      thumb: 'TRYOUT\nBUNDLE',
      tone: 'red',
      program: 'SNBT 2026',
      type: 'Tryout',
      typeClass: 'tryout',
      price: 'Rp175.000',
      discount: '15%',
      finalPrice: 'Rp148.750',
      status: 'Aktif',
      statusClass: 'aktif',
      sold: '213',
    },
    {
      name: 'Kelas Online SNBT 2026',
      desc: 'Materi, latihan, dan live class persiapan SNBT.',
      thumb: 'KELAS\nONLINE',
      tone: 'blue',
      program: 'SNBT 2026',
      type: 'Kelas Online',
      typeClass: 'online',
      price: 'Rp329.000',
      discount: '20%',
      finalPrice: 'Rp263.200',
      status: 'Nonaktif',
      statusClass: 'nonaktif',
      sold: '32',
    },
  ]

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    clearAuthUser()

    navigate('/login', { replace: true })
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(ADMIN_SIDEBAR_COLLAPSED_KEY, String(isSidebarCollapsed))
  }, [isSidebarCollapsed])

  return (
    <div className="admin-dashboard-page admin-package-page">
      <div className={`admin-dashboard-shell${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <aside className={`admin-sidebar${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
          <div className="admin-brand-block">
            <Link to="/" className="admin-brand-link" aria-label="Beranda Nice On">
              <img src={niceonImage} alt="Nice On" className="admin-brand-logo" />
              <div className={`admin-brand-copy${isSidebarCollapsed ? ' collapsed' : ''}`}>
                <strong>Admin Panel</strong>
                <span>Learning Hub</span>
              </div>
            </Link>
          </div>

          <div className="admin-sidebar-group-label">Main</div>
          <nav className="admin-sidebar-nav" aria-label="Navigasi admin">
            {adminMainMenu.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`admin-sidebar-item${currentPath === item.href ? ' active' : ''}`}
                onClick={() => item.href !== '#' && navigate(item.href)}
              >
                <span className="admin-sidebar-icon" aria-hidden="true">{item.label.slice(0, 1)}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="admin-sidebar-group-label">System</div>
          <nav className="admin-sidebar-nav" aria-label="Menu sistem admin">
            {adminSystemMenu.map((item) => (
              <button
                key={item.label}
                type="button"
                className="admin-sidebar-item secondary"
                onClick={() => item.href !== '#' && navigate(item.href)}
              >
                <span className="admin-sidebar-icon" aria-hidden="true">{item.label.slice(0, 1)}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="admin-sidebar-footer-card">
            <button type="button" className="admin-sidebar-logout" onClick={handleLogout}>
              <span aria-hidden="true">⎋</span>
              <span>Keluar</span>
            </button>
          </div>
        </aside>

        <main className="admin-main admin-package-main">
          <AdminTopbar
            title="Paket Belajar"
            searchPlaceholder="Cari paket..."
            currentDateLabel={currentDateLabel}
            displayName={displayName}
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={() => setIsSidebarCollapsed((current) => !current)}
            showSearch={false}
            onHomeClick={() => navigate('/')}
          />

          <section className="admin-package-hero">
            <div>
              <h2>Paket Belajar</h2>
              <div className="admin-breadcrumb">
                Dashboard <span>›</span> Paket
              </div>
            </div>

            <div className="admin-package-actions">
              <button type="button" className="admin-outline-action">⬇ Ekspor Data</button>
              <button type="button" className="admin-primary-action">＋ Tambah Paket</button>
            </div>
          </section>

          <section className="admin-summary-grid admin-package-summary-grid">
            {packageSummaryCards.map((card) => (
              <article className={`admin-summary-card ${card.accent}`} key={card.label}>
                <div className={`admin-summary-icon ${card.accent}`}>{card.icon}</div>
                <div className="admin-summary-copy">
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                  <p>{card.delta}</p>
                </div>
              </article>
            ))}
          </section>

          <section className="admin-card admin-package-filter-card">
            <div className="admin-package-filters">
              <label className="admin-package-search">
                <span aria-hidden="true">⌕</span>
                <input type="search" placeholder="Cari paket..." />
              </label>

              <div className="admin-package-filter-group">
                {packageFilters.map((filter) => (
                  <select key={filter.placeholder} className="admin-package-select" defaultValue={filter.placeholder}>
                    {filter.options.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                ))}

                <button type="button" className="admin-user-filter-button admin-package-filter-button">Filter</button>
                <button type="button" className="admin-package-reset">Reset</button>
              </div>
            </div>
          </section>

          <section className="admin-card admin-package-table-card">
            <div className="admin-package-table-wrap">
              <table className="admin-user-table admin-package-table">
                <thead>
                  <tr>
                    <th>Paket</th>
                    <th>Program</th>
                    <th>Tipe</th>
                    <th>Harga</th>
                    <th>Diskon</th>
                    <th>Harga Akhir</th>
                    <th>Status</th>
                    <th>Terjual</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {packageRows.map((row) => (
                    <tr key={row.name}>
                      <td>
                        <div className="admin-package-cell">
                          <div className={`admin-package-thumb ${row.tone}`}>
                            <span>{row.thumb}</span>
                          </div>
                          <div className="admin-package-name">
                            <strong>{row.name}</strong>
                            <span>{row.desc}</span>
                          </div>
                        </div>
                      </td>
                      <td>{row.program}</td>
                      <td><span className={`admin-package-type-badge ${row.typeClass}`}>{row.type}</span></td>
                      <td>{row.price}</td>
                      <td><span className="admin-package-discount-pill">{row.discount}</span></td>
                      <td><strong className="admin-package-final-price">{row.finalPrice}</strong></td>
                      <td><span className={`admin-status-pill ${row.statusClass}`}>{row.status}</span></td>
                      <td>{row.sold}</td>
                      <td>
                        <div className="admin-row-actions admin-package-row-actions">
                          <button type="button" className="admin-row-action">👁</button>
                          <button type="button" className="admin-row-action">✎</button>
                          <button type="button" className="admin-row-action danger">🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-package-footer admin-user-footer">
              <p>Menampilkan 1 - 5 dari 24 paket</p>
              <div className="admin-pagination">
                <button type="button" className="admin-pagination-arrow">‹</button>
                <button type="button" className="admin-pagination-page active">1</button>
                <button type="button" className="admin-pagination-page">2</button>
                <button type="button" className="admin-pagination-page">3</button>
                <span className="admin-pagination-dots">…</span>
                <button type="button" className="admin-pagination-page">5</button>
                <button type="button" className="admin-pagination-arrow">›</button>
                <button type="button" className="admin-pagination-size">10 / halaman <span aria-hidden="true">⌄</span></button>
              </div>
            </div>
          </section>

          <AdminLogoutModal
            open={showLogoutConfirm}
            onCancel={() => setShowLogoutConfirm(false)}
            onConfirm={confirmLogout}
          />
        </main>
      </div>
    </div>
  )
}

function App() {
  useEffect(() => {
    const faviconLink = document.querySelector('link[rel="icon"]') || document.createElement('link')

    faviconLink.setAttribute('rel', 'icon')
    faviconLink.setAttribute('type', 'image/png')
    faviconLink.setAttribute('href', faviconImage)

    if (!faviconLink.parentNode) {
      document.head.appendChild(faviconLink)
    }
  }, [])

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/login"
        element={<LoginPage />}
      />
      <Route
        path="/forgot-password"
        element={<ForgotPasswordPage />}
      />
      <Route
        path="/register"
        element={<RegisterPage />}
      />
      <Route
        path="/complete-profile"
        element={<CompleteProfilePage />}
      />
      <Route
        path="/account-profile"
        element={<AccountProfilePage />}
      />
      <Route
        path="/dashboard-user"
        element={<DashboardUserPageV2 />}
      />
      <Route
        path="/dashboard-admin"
        element={<AdminDashboardPage />}
      />
      <Route
        path="/dashboard-admin/users"
        element={<AdminUserManagementPage />}
      />
      <Route
        path="/dashboard-admin/packages"
        element={<AdminPackageManagementPage />}
      />
    </Routes>
  )
}

export default App
