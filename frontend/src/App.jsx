import { useEffect, useRef, useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import faviconImage from '../../favicon.png'
import niceonImage from '../../niceon.png'
import './App.css'

function HomePage() {
  const heroCardRef = useRef(null)
  const [activeSlide, setActiveSlide] = useState(0)

  const gallerySlides = [
    { title: 'Kelas Offline', subtitle: 'Sesi pembahasan bersama mentor', image: '/gallery/dummy-1.svg' },
    { title: 'Tryout CAT', subtitle: 'Simulasi ujian dengan suasana real test', image: '/gallery/dummy-2.svg' },
    { title: 'Komunitas Belajar', subtitle: 'Diskusi aktif dan evaluasi progres', image: '/gallery/dummy-3.svg' },
  ]

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
      setActiveSlide((prev) => (prev + 1) % gallerySlides.length)
    }, 3200)

    return () => window.clearInterval(timer)
  }, [gallerySlides.length])

  useEffect(() => {
    const card = heroCardRef.current
    if (!card) return

    const media = window.matchMedia('(max-width: 980px)')
    if (media.matches) return

    const thumb = card.querySelector('.hero-thumb')
    let rafId = 0

    const animate = (xRatio, yRatio) => {
      const rotateY = xRatio * 6
      const rotateX = -yRatio * 5
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`
      if (thumb) {
        thumb.style.transform = `scale(1.06) translate(${xRatio * -10}px, ${yRatio * -8}px)`
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
      <div className="promo" data-parallax data-speed="0.04">
        <div className="container promo-inner">
          <span>Satu langkah kecil hari ini, peluang besar di hari seleksi.</span>
          <span className="promo-pill">Klaim Kelas Trial Gratis -&gt;</span>
        </div>
      </div>

      <header className="topbar">
        <div className="container topbar-inner">
          <div className="logo">
            <img src={niceonImage} alt="Nice On" className="logo-image" />
          </div>

          <nav className="menu">
            <a href="#" className="active">Beranda</a>
            <a href="#paket">Paket Belajar</a>
            <a href="#testimoni">Testimoni</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className="auth">
            <Link className="btn" to="/login">Masuk</Link>
            <Link className="btn primary" to="/register">Daftar</Link>
          </div>
        </div>
      </header>

      <section className="hero container" data-parallax data-speed="-0.06">
        <div>
          <div className="hero-badge">Dipakai ribuan pejuang ASN di seluruh Indonesia</div>
          <h1>Satu Langkah<br /><span>Menuju ASN.</span></h1>
          <p>Persiapan yang tepat dapat mengubah keraguan menjadi keyakinan.</p>
          <p>Dengan pendekatan belajar yang terstruktur, latihan yang relevan, dan bimbingan yang responsif, kamu dapat fokus pada hal yang benar-benar penting: meningkatkan peluang kelulusan.</p>
          <ul className="hero-points">
            <li>✅ Materi ringkas dan terarah</li>
            <li>✅ Simulasi CAT sesuai ujian asli</li>
            <li>✅ Evaluasi progres belajar</li>
            <li>✅ Mentor responsif saat kamu butuh bantuan</li>
          </ul>
          <div className="hero-actions">
            <a href="#" className="pill main">Mulai Belajar Sekarang</a>
            <a href="#" className="pill">Lihat Paket Kelas</a>
          </div>
        </div>

        <div className="hero-card" data-parallax data-speed="-0.12" ref={heroCardRef}>
          <div className="hero-thumb">
            {gallerySlides.map((slide, index) => (
              <div
                key={slide.title}
                className={`thumb-slide ${index === activeSlide ? 'is-active' : ''}`}
                aria-hidden={index !== activeSlide}
                style={{ backgroundImage: `url(${slide.image})` }}
              >
                <div className="thumb-overlay"></div>
                <div className="thumb-content">
                  <strong>{slide.title}</strong>
                  <span>{slide.subtitle}</span>
                </div>
              </div>
            ))}

            <div className="thumb-dots" aria-label="Galeri perusahaan">
              {gallerySlides.map((slide, index) => (
                <button
                  key={slide.title}
                  type="button"
                  className={`thumb-dot ${index === activeSlide ? 'is-active' : ''}`}
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
          <div className="hero-body">
            <h3>Program Intensif SKD 2026</h3>
            <p>Targetkan nilai aman dengan jadwal belajar terarah, evaluasi progres rutin, dan bank soal terbaru.</p>
          </div>
        </div>
      </section>

      <section className="stats container" data-parallax data-speed="-0.08">
        <div className="stats-card" data-parallax data-speed="-0.1">
          {[
            ['YT', '1.75Jt+', 'Subscribers'],
            ['TT', '742K+', 'Followers'],
            ['IG', '389K+', 'Followers'],
            ['X', '198K+', 'Followers'],
          ].map(([icon, value, label]) => (
            <div className="stat" key={icon}>
              <div className="icon">{icon}</div>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="testimonials container" id="testimoni">
        <div className="testimonials-head">
          <h2 className="testimonials-title">Testimoni Peserta</h2>
          <p className="testimonials-sub">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante
            venenatis dapibus posuere velit aliquet.
          </p>
        </div>

        <div className="testimonials-grid">
          <article className="testimonial-card">
            <div className="testimonial-top">
              <div className="avatar">AR</div>
              <div className="who">
                <strong>Lorem Arian</strong>
                <span>Lorem ipsum alumni</span>
              </div>
            </div>
            <div className="stars">★★★★★</div>
            <p className="testimonial-text">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
          </article>

          <article className="testimonial-card">
            <div className="testimonial-top">
              <div className="avatar">NS</div>
              <div className="who">
                <strong>Nadia S</strong>
                <span>Dolor sit amet peserta</span>
              </div>
            </div>
            <div className="stars">★★★★★</div>
            <p className="testimonial-text">Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
          </article>

          <article className="testimonial-card">
            <div className="testimonial-top">
              <div className="avatar">RK</div>
              <div className="who">
                <strong>Raka K</strong>
                <span>Consectetur program</span>
              </div>
            </div>
            <div className="stars">★★★★★</div>
            <p className="testimonial-text">Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
          </article>
        </div>
      </section>

      <section className="package container" id="paket">
        <h2 className="package-title">Paket Belajar</h2>
        <div className="package-tabs">
          <button className="package-tab active" type="button">Tryout</button>
          <button className="package-tab" type="button">Kelas Online</button>
          <button className="package-tab" type="button">Rekaman Kelas</button>
        </div>
        <div className="package-filter">
          <label htmlFor="program">Program</label>
          <select id="program" name="program" defaultValue="UTBK">
            <option>UTBK</option>
            <option>CPNS</option>
            <option>PPPK</option>
          </select>
        </div>

        <div className="package-grid">
          <article className="course-card">
            <div className="course-cover"></div>
            <div className="course-body">
              <h3 className="course-title">Lorem Ipsum Dolor Sit Amet 2026</h3>
              <p className="course-sub"><strong>Lorem ipsum dolor sit amet</strong><br />Consectetur adipiscing elit sed do eiusmod tempor incididunt.</p>
              <p className="course-meta"><strong>(Aktif hingga lorem ipsum selesai)</strong></p>
              <ul className="course-list">
                <li>✓ Lorem ipsum dolor sit amet, consectetur adipiscing elit.</li>
                <li>✓ Sed do eiusmod tempor incididunt ut labore et dolore.</li>
              </ul>
              <div className="course-price">
                <span className="badge-discount">52%</span>
                <span className="old-price">Rp25.000</span>
                <span className="new-price">Rp12.000</span>
              </div>
            </div>
          </article>

          <article className="course-card">
            <div className="course-cover"></div>
            <div className="course-body">
              <h3 className="course-title">Lorem Ipsum Fulltest Part 29</h3>
              <p className="course-sub"><strong>Lorem ipsum dolor sit amet</strong><br />Ut enim ad minim veniam quis nostrud exercitation ullamco.</p>
              <p className="course-meta"><strong>(Aktif hingga lorem ipsum selesai)</strong></p>
              <ul className="course-list">
                <li>✓ Duis aute irure dolor in reprehenderit in voluptate.</li>
                <li>✓ Velit esse cillum dolore eu fugiat nulla pariatur.</li>
              </ul>
              <div className="course-price">
                <span className="badge-discount">40%</span>
                <span className="old-price">Rp35.000</span>
                <span className="new-price">Rp21.000</span>
              </div>
            </div>
          </article>

          <article className="course-card">
            <div className="course-cover"></div>
            <div className="course-body">
              <h3 className="course-title">Lorem Bundling Persubtest 2026</h3>
              <p className="course-sub"><strong>Lorem ipsum dolor sit amet</strong><br />Excepteur sint occaecat cupidatat non proident sunt in culpa.</p>
              <p className="course-meta"><strong>(Aktif hingga lorem ipsum selesai)</strong></p>
              <ul className="course-list">
                <li>✓ Officia deserunt mollit anim id est laborum lorem.</li>
                <li>✓ Integer nec odio praesent libero sed cursus ante.</li>
              </ul>
              <div className="course-price">
                <span className="badge-discount">57%</span>
                <span className="old-price">Rp59.000</span>
                <span className="new-price">Rp25.000</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="faq container" id="faq">
        <h2 className="faq-title">Pertanyaan yang Sering Ditanyakan</h2>
        <div className="faq-grid">
          <details className="faq-item"><summary>Lorem ipsum dolor sit amet consectetur?</summary><div className="faq-answer">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer hendrerit, tortor et feugiat mattis.</div></details>
          <details className="faq-item"><summary>Consectetur adipiscing elit sed do eiusmod?</summary><div className="faq-answer">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse potenti. Nulla facilisi.</div></details>
          <details className="faq-item"><summary>Tempor incididunt ut labore et dolore?</summary><div className="faq-answer">Lorem ipsum dolor sit amet, consectetur adipiscing elit. In sit amet volutpat sem.</div></details>
          <details className="faq-item"><summary>Magna aliqua ut enim ad minim veniam?</summary><div className="faq-answer">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas commodo convallis arcu.</div></details>
          <details className="faq-item"><summary>Quis nostrud exercitation ullamco laboris?</summary><div className="faq-answer">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque habitant morbi tristique.</div></details>
          <details className="faq-item"><summary>Nisi ut aliquip ex ea commodo consequat?</summary><div className="faq-answer">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam semper justo eu dui vulputate.</div></details>
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

          <form className="register-form">
            <label htmlFor="loginEmail">Email</label>
            <input id="loginEmail" type="email" placeholder="nama@email.com" />

            <label htmlFor="loginPassword">Password</label>
            <div className="password-wrap">
              <input id="loginPassword" type="password" placeholder="Masukkan password" />
              <span aria-hidden="true">👁</span>
            </div>

            <a href="#" className="forgot-link">Lupa Password?</a>

            <button type="button" className="register-btn">Masuk</button>

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
          <p className="register-sub">Mulailah mengerjakan tryoutmu!</p>

          <form className="register-form">
            <label htmlFor="name">Nama</label>
            <input id="name" type="text" placeholder="Masukkan nama lengkap" />

            <label htmlFor="email">Email</label>
            <input id="email" type="email" placeholder="nama@email.com" />

            <label htmlFor="phone">Telepon</label>
            <div className="phone-wrap">
              <span>+62</span>
              <input id="phone" type="tel" placeholder="812 3456 7890" />
            </div>

            <label htmlFor="source">Dimana anda mengenal Nice On?</label>
            <input id="source" type="text" placeholder="Pilih sumber informasi" />

            <label htmlFor="category">Kategori</label>
            <select id="category" defaultValue="">
              <option value="" disabled>Pilih kategori</option>
              <option>UTBK</option>
              <option>CPNS</option>
              <option>PPPK</option>
            </select>

            <label htmlFor="password">Password</label>
            <div className="password-wrap">
              <input id="password" type="password" placeholder="Masukkan password" />
              <span aria-hidden="true">👁</span>
            </div>

            <label htmlFor="confirmPassword">Konfirmasi Password</label>
            <div className="password-wrap">
              <input id="confirmPassword" type="password" placeholder="Ulangi password" />
              <span aria-hidden="true">👁</span>
            </div>

            <div className="captcha-dummy">
              <div className="captcha-left">
                <div className="captcha-check">✓</div>
                <span>Berhasil!</span>
              </div>
              <small>CLOUDFLARE</small>
            </div>

            <button type="button" className="register-btn">Daftar</button>

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
        path="/register"
        element={<RegisterPage />}
      />
    </Routes>
  )
}

export default App
