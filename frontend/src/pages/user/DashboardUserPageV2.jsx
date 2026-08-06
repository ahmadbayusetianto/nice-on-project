import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { fetchAccountProfile, fetchLearningStreak } from '../../api/accountProfileApi'
import AdminBrandBlock from '../../components/layout/AdminBrandBlock'
import AdminLogoutModal from '../../components/layout/AdminLogoutModal'
import AdminQuestionMenu from '../../components/layout/AdminQuestionMenu'
import AdminSystemMenu from '../../components/layout/AdminSystemMenu'
import AdminUserMenu from '../../components/layout/AdminUserMenu'
import DashboardNotificationMenu from '../../components/layout/DashboardNotificationMenu'
import ComingSoonModal from '../../components/layout/ComingSoonModal'
import UserSidebar from '../../components/layout/UserSidebar'
import { clearAuthUser, readStoredUser } from '../../utils/storage'

export default function DashboardUserPageV2() {
  const location = useLocation()
  const navigate = useNavigate()
  const storedUser = readStoredUser()
  const user = location.state?.user ?? storedUser
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef(null)
  const [streakDays, setStreakDays] = useState(null)
  const [comingSoonLabel, setComingSoonLabel] = useState(null)
  const [profileName, setProfileName] = useState(null)

  useEffect(() => {
    if (!user?.pid) return

    let isMounted = true

    fetchLearningStreak(user.pid)
      .then((payload) => {
        if (isMounted) setStreakDays(payload?.data?.streak_days ?? 0)
      })
      .catch(() => {
        if (isMounted) setStreakDays(0)
      })

    return () => {
      isMounted = false
    }
  }, [user?.pid])

  useEffect(() => {
    if (!user?.pid) return

    let isMounted = true

    fetchAccountProfile(user.pid)
      .then((payload) => {
        if (isMounted) setProfileName(payload?.data?.detail?.nama ?? null)
      })
      .catch(() => {
        if (isMounted) setProfileName(null)
      })

    return () => {
      isMounted = false
    }
  }, [user?.pid])

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

  const currentPath = location.pathname
  const isAdminSandbox = false
  const displayName = profileName || user?.nama || user?.name || user?.email?.split('@')?.[0] || 'User'
  const isProfileComplete = user?.profile_completed !== false
  const initials = displayName.slice(0, 2).toUpperCase()

  const stats = [
    ['Progress', isProfileComplete ? '100%' : '0%', isProfileComplete ? 'Profil siap dipakai' : 'Profil belum lengkap'],
    ['Tryout Hari Ini', '0', 'Belum ada aktivitas'],
    ['Target Mingguan', '7 sesi', 'Siap ditetapkan'],
    ['Streak Belajar', streakDays === null ? '...' : `${streakDays} hari`, streakDays ? 'Pertahankan konsistensi!' : 'Belum ada aktivitas'],
  ]

  const quickActions = [
    { label: 'Materi', desc: 'Buka materi belajar', href: '/dashboard-user/materials' },
    { label: 'Tryout', desc: 'Kerjakan tryout', href: '/dashboard-user/tryout' },
    { label: 'Jadwal', desc: 'Lihat jadwal kelas', href: '#' },
    { label: 'Bantuan', desc: 'Butuh bantuan?', href: '/dashboard-user/bantuan' },
    { label: 'Riwayat Transaksi', desc: 'Cek status pembayaran', href: '/dashboard-user/transactions' },
  ]

  const nextSteps = [
    isProfileComplete ? 'Mulai dari materi atau tryout yang tersedia.' : 'Lengkapi profil dasar agar akun lebih lengkap.',
    'Masuk ke dashboard belajar dan pilih program yang sesuai.',
    'Pantau progres dari riwayat sesi berikutnya.',
  ]

  const dashboardNotifications = [
    {
      id: 'dashboard-materials',
      title: 'Materi siap dibuka',
      description: 'Ada materi terbaru yang bisa kamu pelajari sekarang.',
      time: 'Baru',
      icon: '📚',
      accent: 'blue',
      href: '/dashboard-user/materials',
    },
    {
      id: 'dashboard-tryout',
      title: 'Tryout menunggu',
      description: 'Coba sesi tryout berikutnya untuk melihat progres.',
      time: '10 mnt',
      icon: '📝',
      accent: 'green',
      href: '/dashboard-user/tryout',
    },
    {
      id: 'dashboard-profile',
      title: 'Profil akun',
      description: isProfileComplete ? 'Profil kamu sudah rapi.' : 'Lengkapi profil agar dashboard makin maksimal.',
      time: 'Hari ini',
      icon: '👤',
      accent: 'purple',
      href: '/account-profile',
    },
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
        {isAdminSandbox ? (
          <aside className={`admin-sidebar${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
            <div className="dashboard-sidebar-brand-row">
              <AdminBrandBlock isCollapsed={isSidebarCollapsed} />
              <button
                type="button"
                className="dashboard-sidebar-collapse"
                aria-label={isSidebarCollapsed ? 'Tampilkan sidebar' : 'Sembunyikan sidebar'}
                onClick={() => setIsSidebarCollapsed((current) => !current)}
              >
                {isSidebarCollapsed ? '»' : '«'}
              </button>
            </div>

            <div className="admin-sidebar-group-label">Main</div>
            <nav className="admin-sidebar-nav" aria-label="Navigasi admin sandbox">
              {adminMainMenu.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={`admin-sidebar-item${adminSidebarPath === item.href ? ' active' : ''}`}
                  onClick={() => (item.href === '#' ? setComingSoonLabel(item.label) : navigate(item.href, { state: { user } }))}
                >
                  <span className="admin-sidebar-icon" aria-hidden="true">{item.label.slice(0, 1)}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <AdminQuestionMenu currentPath={adminSidebarPath} navigate={navigate} />
            <AdminSystemMenu currentPath={adminSidebarPath} navigate={navigate} />
            <AdminUserMenu
              profileUser={user}
              displayName={displayName}
              onResumeProfile={(activeUser) => navigate('/account-profile', { state: { user: activeUser } })}
              onLogout={handleLogout}
            />
          </aside>
        ) : (
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
        )}

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
              <DashboardNotificationMenu items={dashboardNotifications} onItemClick={(item) => navigate(item.href, { state: { user } })} />
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
                <button type="button" className="dashboard-primary-action" onClick={() => navigate('/dashboard-user/materials', { state: { user } })}>
                  Materi <span aria-hidden="true">→</span>
                </button>
                <button type="button" className="dashboard-secondary-action" onClick={() => navigate('/dashboard-user/tryout', { state: { user } })}>
                  Tryout <span aria-hidden="true">→</span>
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
                {quickActions.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className="dashboard-quick-tile"
                    onClick={() => (item.href === '#' ? setComingSoonLabel(item.label) : navigate(item.href, { state: { user } }))}
                  >
                    <div className="dashboard-quick-tile-icon">{item.label.slice(0, 1)}</div>
                    <div className="dashboard-quick-tile-copy">
                      <strong>{item.label}</strong>
                      <span>{item.desc}</span>
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

      <ComingSoonModal open={Boolean(comingSoonLabel)} label={comingSoonLabel} onClose={() => setComingSoonLabel(null)} />
    </div>
  )
}
