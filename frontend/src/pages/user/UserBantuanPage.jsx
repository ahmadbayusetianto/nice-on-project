import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { fetchFaqs } from '../../api/homeApi'
import AdminLogoutModal from '../../components/layout/AdminLogoutModal'
import DashboardNotificationMenu from '../../components/layout/DashboardNotificationMenu'
import UserSidebar from '../../components/layout/UserSidebar'
import MaterialEmptyState from '../../components/shared/MaterialEmptyState'
import { stripFaqHtml } from '../../utils/sanitizeHtml'
import { clearAuthUser, readStoredUser } from '../../utils/storage'
import './UserBantuanPage.css'

const SUPPORT_EMAIL = 'nicecendekia@gmail.com'

export default function UserBantuanPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const profileMenuRef = useRef(null)
  const storedUser = readStoredUser()
  const user = location.state?.user ?? storedUser

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('faq')
  const [faqRows, setFaqRows] = useState([])
  const [isLoadingFaqs, setIsLoadingFaqs] = useState(true)
  const [faqError, setFaqError] = useState(null)

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
    let cancelled = false

    const loadFaqs = async () => {
      setIsLoadingFaqs(true)
      setFaqError(null)

      try {
        const payload = await fetchFaqs()

        if (!cancelled) {
          setFaqRows(Array.isArray(payload?.data) ? payload.data : [])
        }
      } catch (error) {
        if (!cancelled) {
          setFaqError(error instanceof Error ? error.message : 'FAQ gagal dimuat.')
        }
      } finally {
        if (!cancelled) {
          setIsLoadingFaqs(false)
        }
      }
    }

    void loadFaqs()

    return () => {
      cancelled = true
    }
  }, [])

  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/dashboard-user/bantuan' }} />
  }

  const currentPath = location.pathname
  const displayName = user?.nama || user?.name || user?.email?.split('@')?.[0] || 'User'
  const initials = displayName.slice(0, 2).toUpperCase()
  const isProfileComplete = user?.profile_completed !== false
  const userEmail = user?.email || ''

  const handleLogout = () => setShowLogoutConfirm(true)
  const confirmLogout = () => {
    clearAuthUser()
    navigate('/login', { replace: true })
  }

  const mailtoSubject = `Pertanyaan dari ${displayName}`
  const mailtoBody = `Halo Tim Nice Cendekia,\n\nSaya ${displayName}${userEmail ? ` (${userEmail})` : ''} ingin bertanya mengenai...`
  const mailtoHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(mailtoSubject)}&body=${encodeURIComponent(mailtoBody)}`

  const bantuanNotifications = [
    {
      id: 'bantuan-faq',
      title: 'FAQ tersedia',
      description: 'Cek pertanyaan yang sering ditanyakan sebelum menghubungi kami.',
      time: 'Baru',
      icon: '❓',
      accent: 'blue',
      href: '/dashboard-user/bantuan',
    },
  ]

  return (
    <div className="dashboard-page dashboard-page-v2 user-bantuan-page">
      <div className={`dashboard-shell dashboard-shell-v2${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <UserSidebar
          currentPath={currentPath}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapsed={() => setIsSidebarCollapsed((current) => !current)}
          navigate={navigate}
          user={user}
          displayName={displayName}
          isProfileComplete={isProfileComplete}
          onLogout={handleLogout}
        />

        <main className="dashboard-main dashboard-main-v2 user-bantuan-main">
          <header className="dashboard-topbar">
            <div className="dashboard-topbar-left">
              <button type="button" className="dashboard-menu-button" aria-label={isSidebarCollapsed ? 'Buka navigasi' : 'Sembunyikan navigasi'} onClick={() => setIsSidebarCollapsed((current) => !current)}>☰</button>
              <p>Bantuan untuk <strong>{displayName}</strong></p>
            </div>

            <div className="dashboard-topbar-right">
              <button type="button" className="dashboard-home-button" aria-label="Beranda" onClick={() => navigate('/dashboard-user', { state: { user } })}>🏠</button>
              <DashboardNotificationMenu items={bantuanNotifications} onItemClick={(item) => navigate(item.href, { state: { user } })} />
              <div className="dashboard-profile-menu-wrap" ref={profileMenuRef}>
                <button type="button" className="dashboard-profile-chip" aria-haspopup="menu" aria-expanded={isProfileMenuOpen} onClick={() => setIsProfileMenuOpen((current) => !current)}>
                  <span className="dashboard-profile-avatar">{initials}</span>
                  <span>{displayName}</span>
                  <span aria-hidden="true">⌄</span>
                </button>

                {isProfileMenuOpen ? (
                  <div className="dashboard-profile-dropdown" role="menu" aria-label="Menu akun">
                    <button type="button" className="dashboard-profile-dropdown-item" role="menuitem" onClick={() => { setIsProfileMenuOpen(false); navigate('/account-profile', { state: { user } }) }}>
                      <span className="dashboard-profile-dropdown-label">Resume Profile</span>
                    </button>
                    <button type="button" className="dashboard-profile-dropdown-item danger" role="menuitem" onClick={() => { setIsProfileMenuOpen(false); handleLogout() }}>
                      <span className="dashboard-profile-dropdown-label">Logout</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <section className="user-tryout-hero-card user-bantuan-hero-card">
            <div>
              <div className="dashboard-status-pill success">Pusat Bantuan</div>
              <h2>Ada yang bisa kami bantu?</h2>
              <p>Cek jawaban cepat di FAQ, atau hubungi tim kami langsung kalau belum ketemu jawabannya.</p>
            </div>
          </section>

          <div className="user-bantuan-tabs" role="tablist" aria-label="Menu Bantuan">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'faq'}
              className={`user-bantuan-tab${activeTab === 'faq' ? ' active' : ''}`}
              onClick={() => setActiveTab('faq')}
            >
              FAQ
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'kontak'}
              className={`user-bantuan-tab${activeTab === 'kontak' ? ' active' : ''}`}
              onClick={() => setActiveTab('kontak')}
            >
              Hubungi Kami
            </button>
          </div>

          {activeTab === 'faq' ? (
            <section className="user-bantuan-panel">
              {faqError ? <div className="dashboard-alert error">{faqError}</div> : null}
              {isLoadingFaqs ? <div className="dashboard-alert">Memuat FAQ...</div> : null}

              {!isLoadingFaqs && !faqError ? (
                faqRows.length ? (
                  <div className="user-bantuan-faq-list">
                    {faqRows.map((item) => (
                      <details className="user-bantuan-faq-item" key={item.pid}>
                        <summary>
                          <span className="user-bantuan-faq-icon" aria-hidden="true">{item.ikon || '❓'}</span>
                          <span>{item.pertanyaan}</span>
                        </summary>
                        <p className="user-bantuan-faq-answer">{stripFaqHtml(item.jawaban)}</p>
                      </details>
                    ))}
                  </div>
                ) : (
                  <MaterialEmptyState
                    title="Belum ada FAQ tersedia"
                    description="Pertanyaan yang sering ditanyakan akan muncul di sini setelah tersedia."
                    actionLabel="Hubungi Kami"
                    onAction={() => setActiveTab('kontak')}
                    accent="blue"
                  />
                )
              ) : null}
            </section>
          ) : (
            <section className="user-bantuan-panel">
              <article className="user-bantuan-contact-card">
                <div className="user-bantuan-contact-icon" aria-hidden="true">📧</div>
                <h3>Masih ada pertanyaan lain?</h3>
                <p>Tim kami siap membantu Anda kapan saja. Klik tombol di bawah untuk mengirim email — subjek dan isi pesan sudah otomatis kami siapkan.</p>
                <a href={mailtoHref} className="dashboard-primary-action user-bantuan-contact-button">
                  Hubungi via Email <span aria-hidden="true">📧</span>
                </a>
                <p className="user-bantuan-contact-email">atau kirim langsung ke <strong>{SUPPORT_EMAIL}</strong></p>
              </article>
            </section>
          )}
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
