import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import niceonImage from '../../../../niceon.png'
import { createCheckout } from '../../api/checkoutApi'
import { fetchFaqs, fetchPackages } from '../../api/homeApi'
import { getFriendlyFetchError } from '../../utils/fetchError'
import { formatCurrency } from '../../utils/format'
import { renderSocialBrandIcon } from '../../utils/icons'
import { loadMidtransSnap } from '../../utils/loadMidtransSnap'
import { stripFaqHtml } from '../../utils/sanitizeHtml'
import { clearAuthUser, readStoredUser } from '../../utils/storage'
import './Home.css'
import AuthRequiredModal from './AuthRequiredModal'
import PackageInfoModal from './PackageInfoModal'

const DEFAULT_FAQ_ITEMS = [
  { icon: '❓', label: 'Lorem ipsum dolor sit amet consectetur?', answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer hendrerit, tortor et feugiat mattis.' },
  { icon: '📘', label: 'Consectetur adipiscing elit sed do eiusmod?', answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer hendrerit, tortor et feugiat mattis.' },
  { icon: '💬', label: 'Tempor incididunt ut labore et dolore?', answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer hendrerit, tortor et feugiat mattis.' },
  { icon: '🎓', label: 'Magna aliqua ut enim ad minim veniam?', answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer hendrerit, tortor et feugiat mattis.' },
  { icon: '🧩', label: 'Quis nostrud exercitation ullamco laboris?', answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer hendrerit, tortor et feugiat mattis.' },
  { icon: '🛡️', label: 'Nisi ut aliquip ex ea commodo consequat?', answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer hendrerit, tortor et feugiat mattis.' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const heroCardRef = useRef(null)
  const [activeSlide, setActiveSlide] = useState(0)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [activeSection, setActiveSection] = useState('beranda')
  const [storedUser, setStoredUser] = useState(() => readStoredUser())
  const [packageRows, setPackageRows] = useState([])
  const [selectedProgram, setSelectedProgram] = useState('CPNS')
  const [packageLoading, setPackageLoading] = useState(true)
  const [packageError, setPackageError] = useState(null)
  const [activePackageInfo, setActivePackageInfo] = useState(null)
  const [authPromptOpen, setAuthPromptOpen] = useState(false)
  const [checkoutPendingKey, setCheckoutPendingKey] = useState(null)
  const [checkoutMessage, setCheckoutMessage] = useState(null)
  const [faqRows, setFaqRows] = useState([])
  const [faqLoading, setFaqLoading] = useState(true)
  const isLoggedIn = Boolean(storedUser)
  const displayName = storedUser?.nama || storedUser?.name || storedUser?.email?.split('@')?.[0] || 'User'
  const authLabel = Number(storedUser?.is_admin ?? 0) === 1 ? 'Admin' : 'User'
  const dashboardPath = Number(storedUser?.is_admin ?? 0) === 1 ? '/dashboard-admin' : '/dashboard-user'
  const dashboardCtaLabel = Number(storedUser?.is_admin ?? 0) === 1 ? 'Masuk ke Dashboard Admin' : 'Masuk ke Dashboard User'
  const dashboardCtaClass = Number(storedUser?.is_admin ?? 0) === 1 ? 'pill main home-dashboard-cta admin' : 'pill main home-dashboard-cta user'
  const currentYear = new Date().getFullYear()

  const handleHomeLogout = () => {
    clearAuthUser()
    setStoredUser(null)
  }

  const handleBuyClick = async (card) => {
    if (!isLoggedIn) {
      setAuthPromptOpen(true)
      return
    }

    setCheckoutMessage(null)
    setCheckoutPendingKey(card.key)

    try {
      const snap = await loadMidtransSnap()
      const { data } = await createCheckout({ pidUser: storedUser.pid, pidPaket: card.source.pid })

      snap.pay(data.snap_token, {
        onSuccess: () => setCheckoutMessage({ type: 'success', text: 'Pembayaran berhasil. Paket akan segera aktif di akunmu.' }),
        onPending: () => setCheckoutMessage({ type: 'info', text: 'Menunggu pembayaran. Selesaikan pembayaran untuk mengaktifkan paket.' }),
        onError: () => setCheckoutMessage({ type: 'error', text: 'Pembayaran gagal, silakan coba lagi.' }),
        onClose: () => {},
      })
    } catch (error) {
      setCheckoutMessage({ type: 'error', text: getFriendlyFetchError(error, 'Checkout gagal dimulai.') })
    } finally {
      setCheckoutPendingKey(null)
    }
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

  useEffect(() => {
    let cancelled = false

    const loadPackages = async () => {
      setPackageLoading(true)
      setPackageError(null)

      try {
        const payload = await fetchPackages()

        if (!cancelled) {
          setPackageRows(Array.isArray(payload.data) ? payload.data : [])
        }
      } catch (error) {
        if (!cancelled) {
          setPackageError(getFriendlyFetchError(error, 'Data paket gagal dimuat.'))
        }
      } finally {
        if (!cancelled) {
          setPackageLoading(false)
        }
      }
    }

    void loadPackages()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll('[data-nav-section]'))
    if (!sections.length) return undefined

    let rafId = 0
    const updateActiveSection = () => {
      const topbar = document.querySelector('.topbar')
      const offset = (topbar?.offsetHeight || 0) + 24

      const candidates = sections
        .map((section) => {
          const rect = section.getBoundingClientRect()
          return {
            id: section.id,
            top: rect.top - offset,
          }
        })
        .filter((entry) => entry.id)
        .sort((a, b) => a.top - b.top)

      const current = [...candidates].reverse().find((entry) => entry.top <= 0)
      const nextSection = current?.id || candidates[0]?.id || 'beranda'
      setActiveSection(nextSection)
    }

    const onScrollOrResize = () => {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(updateActiveSection)
    }

    const hash = window.location.hash.replace('#', '')
    if (hash) {
      setActiveSection(hash)
    }

    const handleHashChange = () => {
      const nextHash = window.location.hash.replace('#', '')
      if (nextHash) setActiveSection(nextHash)
    }

    updateActiveSection()
    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize)
    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
      window.removeEventListener('hashchange', handleHashChange)
      if (rafId) cancelAnimationFrame(rafId)
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

  const socialCards = [
    {
      key: 'youtube',
      platform: 'YouTube',
      initials: 'YT',
      description: 'Pembahasan soal CAT dan tips belajar gratis setiap hari.',
      tone: 'youtube',
      action: 'Kunjungi',
    },
    {
      key: 'instagram',
      platform: 'Instagram',
      initials: 'IG',
      description: 'Infografis, reminder jadwal, dan update seleksi terbaru.',
      tone: 'instagram',
      action: 'Follow',
      href: 'https://www.instagram.com/niceon_id/',
    },
    {
      key: 'tiktok',
      platform: 'TikTok',
      initials: 'TT',
      description: 'Tips singkat, trik cepat, dan highlight materi penting.',
      tone: 'tiktok',
      action: 'Ikuti',
    },
    {
      key: 'x',
      platform: 'X (Twitter)',
      initials: 'X',
      description: 'Update jadwal seleksi, info umum, dan pengumuman cepat.',
      tone: 'x',
      action: 'Follow',
    },
  ]

  const featureCards = [
    {
      icon: '🛡️',
      title: 'Konten Terpercaya',
      description: 'Disusun oleh tim ahli dan berpengalaman di bidangnya.',
      tone: 'blue',
    },
    {
      icon: '⭐',
      title: 'Update Berkala',
      description: 'Materi dan soal selalu diperbarui sesuai kebijakan terbaru.',
      tone: 'green',
    },
    {
      icon: '🎧',
      title: 'Dukungan Mentor',
      description: 'Konsultasi dan bantuan cepat dari mentor berpengalaman.',
      tone: 'violet',
    },
    {
      icon: '🔒',
      title: 'Akses Fleksibel',
      description: 'Belajar kapan saja, di mana saja melalui semua perangkat.',
      tone: 'orange',
    },
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

  const normalizedSelectedProgram = selectedProgram.toUpperCase()
  const visiblePackageRows = packageRows.filter((item) => {
    if (normalizedSelectedProgram === 'ALL') return true
    return String(item.kategori || '').trim().toUpperCase() === normalizedSelectedProgram
  })

  const packageCards = visiblePackageRows.map((item, index) => {
    const kategori = String(item.kategori || 'Program').trim()
    const namaPaket = item.nama_paket || 'Nama Paket'
    const subtitle = item.formasi || item.jadwal || item.ket || 'Paket belajar terarah.'
    const note = item.jadwal ? `(Jadwal ${item.jadwal})` : '(Aktif)'
    const ketText = String(item.ket || '').replace(/\s+/g, ' ').trim()
    const bullets = [item.formasi, item.jadwal, ketText].filter(Boolean).slice(0, 2)
    const basePrice = Number(item.harga) || 0

    return {
      key: item.pid ?? `${kategori}-${index}`,
      title: namaPaket,
      subtitle,
      note,
      source: item,
      bullets: bullets.length ? bullets : [ketText || 'Paket belajar terarah.', 'Informasi paket tersedia di detail.'],
      newPrice: formatCurrency(basePrice),
      icon: kategori.toUpperCase() === 'PPPK' ? '🎯' : kategori.toUpperCase() === 'CPNS' ? '📋' : '📦',
      badge: kategori ? kategori.toUpperCase() : 'PROGRAM',
    }
  })

  useEffect(() => {
    if (!packageRows.length) return

    const availablePrograms = Array.from(new Set(packageRows.map((item) => String(item.kategori || '').trim().toUpperCase()).filter(Boolean)))
    if (!availablePrograms.length) return

    setSelectedProgram((current) => {
      const normalizedCurrent = current.toUpperCase()
      if (availablePrograms.includes(normalizedCurrent)) {
        return current
      }

      if (availablePrograms.includes('CPNS')) return 'CPNS'
      if (availablePrograms.includes('PPPK')) return 'PPPK'

      return current
    })
  }, [packageRows])

  const faqItems = faqRows.length
    ? faqRows.map((item) => ({
      icon: item.icon || '❓',
      label: item.pertanyaan,
      answer: stripFaqHtml(item.jawaban),
    }))
    : DEFAULT_FAQ_ITEMS.map((item) => ({
      ...item,
      answer: item.answer,
    }))

  const currentSlide = heroSlides[activeSlide]

  const cycleSlide = (direction) => {
    setActiveSlide((current) => {
      const next = current + direction
      if (next < 0) return heroSlides.length - 1
      return next % heroSlides.length
    })
  }

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
    let cancelled = false

    const loadFaqs = async () => {
      setFaqLoading(true)

      try {
        const payload = await fetchFaqs()

        if (!cancelled) {
          setFaqRows(Array.isArray(payload.data) ? payload.data : [])
        }
      } catch {
        if (!cancelled) {
          setFaqRows([])
        }
      } finally {
        if (!cancelled) {
          setFaqLoading(false)
        }
      }
    }

    void loadFaqs()

    return () => {
      cancelled = true
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
      <header className="topbar">
        <div className="container topbar-inner">
          <div className="logo">
            <img src={niceonImage} alt="Nice On" className="logo-image" />
          </div>

          <nav className="menu">
            <a href="#beranda" className={activeSection === 'beranda' ? 'active' : ''}>Beranda</a>
            <a href="#paket" className={activeSection === 'paket' ? 'active' : ''}>Paket Belajar</a>
            <a href="#testimoni" className={activeSection === 'testimoni' ? 'active' : ''}>Testimoni</a>
            <a href="#social-media" className={activeSection === 'social-media' ? 'active' : ''}>Social Media</a>
            <a href="#faq" className={activeSection === 'faq' ? 'active' : ''}>FAQ</a>
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

      <section className="hero container" id="beranda" data-nav-section data-parallax data-speed="-0.06">
        <div className="hero-copy">
          <div className="hero-badge">Dipakai ribuan pejuang ASN di seluruh Indonesia</div>
          <h1>Satu Langkah<br /><span>Menuju ASN</span></h1>
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

      <section className="socials container" id="social-media" data-nav-section aria-label="Media Sosial NiceOn">
        <div className="hero-social-panel social-media-panel">
          <div className="hero-social-head">
            <h3>Dapatkan Tips &amp; Info Terbaru di Media Sosial NiceOn</h3>
            <p>Ribuan soal, tips belajar, dan informasi seleksi kami bagikan secara gratis melalui seluruh media sosial NiceOn.</p>
          </div>

          <div className="hero-social-grid">
            {socialCards.map((card) => (
              <article className={`hero-social-card ${card.tone}`} key={card.key}>
                <div className={`hero-social-logo ${card.tone}`} aria-hidden="true">
                  {renderSocialBrandIcon(card.tone)}
                </div>
                <div className="hero-social-copy">
                  <h4>{card.platform}</h4>
                  <p>{card.description}</p>
                </div>
                <a
                  href={card.href || '#'}
                  className={`hero-social-button ${card.tone}`}
                  aria-label={`Buka ${card.platform}`}
                  target={card.href ? '_blank' : undefined}
                  rel={card.href ? 'noreferrer' : undefined}
                >
                  {card.action} <span aria-hidden="true">→</span>
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="features container" aria-label="Keunggulan Nice On">
        <div className="features-grid">
          {featureCards.map((feature) => (
            <article className="feature-card" key={feature.title}>
              <div className={`feature-icon ${feature.tone}`} aria-hidden="true">
                {feature.icon}
              </div>
              <div className="feature-copy">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="testimonials container" id="testimoni" data-nav-section>
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

      <section className="package container" id="paket" data-nav-section>
        <div className="section-kicker package-kicker">PAKET BELAJAR</div>
        <h2 className="section-title package-heading">Paket Belajar Terbaik untukmu</h2>
        <p className="section-subtitle package-subtitle">Pilih program yang sesuai dengan tujuanmu dan mulai persiapan sekarang.</p>

        <div className="package-filter package-filter-ref">
          <label htmlFor="program">Program</label>
          <select id="program" name="program" value={selectedProgram} onChange={(event) => setSelectedProgram(event.target.value)}>
            <option>CPNS</option>
            <option>PPPK</option>
          </select>
        </div>

        {packageError ? <div className="package-status package-status-error">{packageError}</div> : null}
        {packageLoading ? <div className="package-status">Memuat paket belajar...</div> : null}
        {checkoutMessage ? <div className={`package-status package-status-${checkoutMessage.type}`}>{checkoutMessage.text}</div> : null}

        {!packageLoading && !packageError && packageCards.length === 0 ? (
          <div className="package-status">Belum ada paket untuk program ini.</div>
        ) : null}

        <div className="package-grid package-grid-ref">
          {packageCards.map((card) => (
            <article className="course-card course-card-ref" key={card.key}>
              <div className="course-cover course-cover-ref">
                <div className="course-cover-badge">{card.badge || 'TRYOUT BUNDLE'}</div>
                <div className="course-cover-icon" aria-hidden="true">{card.icon}</div>
                <h3>{card.title}</h3>
              </div>
              <div className="course-body course-body-ref">
                <p className="course-sub"><strong>{card.subtitle}</strong></p>
                <p className="course-meta"><strong>{card.note}</strong></p>
                <ul className="course-list">
                  {card.bullets.map((bullet) => <li key={bullet}>✓ {bullet}</li>)}
                </ul>
                <div className="course-cta-row" aria-label={`Aksi paket ${card.title}`}>
                  <div className="course-action-group">
                    <button
                      type="button"
                      className="course-detail-link"
                      onClick={() => setActivePackageInfo(card.source)}
                      aria-label={`Lihat detail ${card.title}`}
                    >
                      <span className="course-detail-label">Detail</span>
                    </button>
                    <a
                      href="#"
                      className="course-cart-button"
                      onClick={(event) => {
                        event.preventDefault()
                        if (checkoutPendingKey) return
                        handleBuyClick(card)
                      }}
                      aria-label={`Beli paket ${card.title}`}
                      title="Beli"
                    >
                      <span aria-hidden="true">{checkoutPendingKey === card.key ? '⏳' : '🛒'}</span>
                    </a>
                  </div>
                </div>
                <div className="course-price course-price-ref">
                  {/* Diskon dan harga lama belum ditampilkan sampai data tersedia di database. */}
                  <span className="new-price">{card.newPrice}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <PackageInfoModal
        open={Boolean(activePackageInfo)}
        packageData={activePackageInfo}
        onCancel={() => setActivePackageInfo(null)}
      />

      <AuthRequiredModal
        open={authPromptOpen}
        onCancel={() => setAuthPromptOpen(false)}
        onLogin={() => navigate('/login', { state: { from: '/#paket' } })}
        onRegister={() => navigate('/register', { state: { from: '/#paket' } })}
      />

      <section className="faq-wrap" id="faq" data-nav-section>
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
                  </summary>
                  <div className="faq-answer">{item.answer}</div>
                </details>
              ))}
              {faqLoading ? <div className="faq-loading-note">Memuat FAQ...</div> : null}
            </div>
          </div>

          <aside className="faq-help-card" aria-label="Bantuan FAQ">
            <div className="faq-help-illustration">
              <img src="/study.png" alt="Ilustrasi bantuan" className="faq-help-image" />
            </div>
            <h3>Masih ada pertanyaan lain?</h3>
            <p>Tim kami siap membantu Anda kapan saja.</p>
            <a
              href="mailto:nicecendekia@gmail.com?subject=Halo%20Nice%20Cendekia&body=Halo%20Tim%20Nice%20Cendekia%2C%0A%0ASaya%20ingin%20bertanya%20mengenai..."
              className="faq-help-button"
            >
              Hubungi Kami <span aria-hidden="true">🎧</span>
            </a>
          </aside>
        </div>
      </section>

      <footer className="site-footer" aria-label="Footer Nice On">
        <div className="container site-footer-inner">
          <div className="site-footer-copy">© {currentYear} Nice On. All rights reserved.</div>
        </div>
      </footer>

    </div>
  )
}
