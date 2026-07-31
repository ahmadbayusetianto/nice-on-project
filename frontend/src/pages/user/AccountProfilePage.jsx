import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import './AccountProfilePage.css'
import { fetchAccountProfile, fetchUserActivityLog } from '../../api/accountProfileApi'
import AdminBrandBlock from '../../components/layout/AdminBrandBlock'
import AdminLogoutModal from '../../components/layout/AdminLogoutModal'
import AdminQuestionMenu from '../../components/layout/AdminQuestionMenu'
import AdminSystemMenu from '../../components/layout/AdminSystemMenu'
import AdminUserMenu from '../../components/layout/AdminUserMenu'
import DashboardNotificationMenu from '../../components/layout/DashboardNotificationMenu'
import UserSidebar from '../../components/layout/UserSidebar'
import { formatAdminDate, formatProfileJoinDate, formatReferenceDisplay } from '../../utils/format'
import { clearAuthUser, readStoredUser } from '../../utils/storage'
import AccountProfileEditModal from './AccountProfileEditModal'

export default function AccountProfilePage() {
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
  const [activityLog, setActivityLog] = useState([])
  const [isLoadingActivity, setIsLoadingActivity] = useState(Boolean(user))

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
        const payload = await fetchAccountProfile(user.pid)

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

  useEffect(() => {
    if (!user?.pid) {
      setIsLoadingActivity(false)
      return
    }

    let isMounted = true

    const loadActivityLog = async () => {
      setIsLoadingActivity(true)

      try {
        const payload = await fetchUserActivityLog(user.pid)

        if (isMounted) {
          setActivityLog(Array.isArray(payload.data) ? payload.data : [])
        }
      } catch {
        if (isMounted) {
          setActivityLog([])
        }
      } finally {
        if (isMounted) {
          setIsLoadingActivity(false)
        }
      }
    }

    void loadActivityLog()

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
  const backDashboardPath = Number(activeProfile?.is_admin ?? user?.is_admin ?? 0) === 1 ? '/dashboard-admin' : '/dashboard-user'
  const genderLabel = detail.gender === 'L' ? 'Laki-laki' : detail.gender === 'P' ? 'Perempuan' : 'Belum diisi'
  const formattedBirthDate = detail.ttl || 'Belum diisi'

  const currentPath = location.pathname
  const adminMainMenu = [
    { label: 'Dashboard', href: '/dashboard-admin' },
    { label: 'User', href: '/dashboard-admin/users' },
    { label: 'Paket', href: '/dashboard-admin/packages' },
    { label: 'Materi', href: '/dashboard-admin/materials' },
    { label: 'Transaksi', href: '/dashboard-admin/transactions' },
    { label: 'Konten', href: '#' },
    { label: 'Laporan', href: '#' },
  ]
  const isAdminProfile = Number(activeProfile?.is_admin ?? user?.is_admin ?? 0) === 1
  const profileJoinedAt = formatProfileJoinDate(activeProfile?.created_at ?? user?.created_at)
  const roleLabel = isAdminProfile ? 'Super Admin' : 'User'
  const accountStatusLabel = String(activeProfile?.status ?? user?.status ?? '') === 'active' ? 'Aktif' : 'Nonaktif'
  const adminCode = `#USR-${String(activeProfile?.pid ?? user?.pid ?? '').padStart(4, '0')}`
  const bioText = String(detail.alamat ?? '').trim()
  const personalInfoItems = [
    ['Nama Lengkap', displayName],
    ['Tempat, Tanggal Lahir', formattedBirthDate],
    ['Jenis Kelamin', genderLabel],
    ['No. HP', detail.nohp || '-'],
    ['Alamat', detail.alamat || '-'],
    ...(isAdminProfile ? [] : [['Referensi', formatReferenceDisplay(detail)]]),
  ]

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    clearAuthUser()

    navigate('/login', { replace: true })
  }

  const profileNotifications = [
    {
      id: 'profile-complete',
      title: 'Profil akun',
      description: isAdminProfile ? 'Pastikan data admin tetap terbarui.' : 'Lengkapi profil agar fitur belajar aktif penuh.',
      time: 'Baru',
      icon: '👤',
      accent: 'purple',
      href: '/dashboard-user',
    },
    {
      id: 'profile-security',
      title: 'Keamanan akun',
      description: 'Ganti sandi secara berkala untuk menjaga akses.',
      time: '15 mnt',
      icon: '🔒',
      accent: 'orange',
      href: '/account-profile',
    },
  ]

  return (
    <div className={`${isAdminProfile ? 'admin-dashboard-page' : 'dashboard-page dashboard-page-v2'} account-profile-page`}>
      <div className={`${isAdminProfile ? 'admin-dashboard-shell' : 'dashboard-shell dashboard-shell-v2'}${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        {isAdminProfile ? (
          <aside className={`admin-sidebar${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
            <AdminBrandBlock isCollapsed={isSidebarCollapsed} />

            <div className="admin-sidebar-group-label">Main</div>
            <nav className="admin-sidebar-nav" aria-label="Navigasi admin">
              {adminMainMenu.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={`admin-sidebar-item${currentPath === item.href || (item.label === 'Dashboard' && currentPath === '/account-profile') ? ' active' : ''}`}
                  onClick={() => item.href !== '#' && navigate(item.href)}
                >
                  <span className="admin-sidebar-icon" aria-hidden="true">{item.label.slice(0, 1)}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <AdminQuestionMenu currentPath={currentPath} navigate={navigate} />

            <AdminSystemMenu currentPath={currentPath} navigate={navigate} />

            <AdminUserMenu
              profileUser={activeProfile}
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
            user={activeProfile}
            displayName={displayName}
            isProfileComplete={activeProfile?.profile_completed !== false}
            onLogout={handleLogout}
          />
        )}

        <main className={`${isAdminProfile ? 'admin-main' : 'dashboard-main dashboard-main-v2'} account-profile-main`}>
          <div className="account-profile-shell">
            <header className="dashboard-topbar account-profile-topbar">
              <div className="dashboard-topbar-left account-profile-topbar-left">
                <button
                  type="button"
                  className="dashboard-menu-button"
                  aria-label={isSidebarCollapsed ? 'Buka navigasi' : 'Sembunyikan navigasi'}
                  onClick={() => setIsSidebarCollapsed((current) => !current)}
                >
                  ☰
                </button>
                <div className="account-profile-breadcrumb">
                  <span>Dashboard</span>
                  <span aria-hidden="true">›</span>
                  <span>{isAdminProfile ? 'Admin' : 'User'}</span>
                  <span aria-hidden="true">›</span>
                  <strong>Profil</strong>
                </div>
              </div>

              <div className="dashboard-topbar-right account-profile-topbar-right">
                <label className="account-profile-topbar-search">
                  <span aria-hidden="true">⌕</span>
                  <input type="search" placeholder="Cari sesuatu..." />
                  <kbd>⌘K</kbd>
                </label>
                <DashboardNotificationMenu items={profileNotifications} onItemClick={(item) => navigate(item.href, { state: { user: activeProfile } })} />
                <div className="dashboard-profile-menu-wrap" ref={profileMenuRef}>
                  <button
                    type="button"
                    className={isAdminProfile ? 'dashboard-profile-chip admin-profile-chip' : 'dashboard-profile-chip'}
                    aria-haspopup="menu"
                    aria-expanded={isProfileMenuOpen}
                    onClick={() => setIsProfileMenuOpen((current) => !current)}
                  >
                    <span className={isAdminProfile ? 'dashboard-profile-avatar admin-profile-avatar' : 'dashboard-profile-avatar'}>{displayName.slice(0, 2).toUpperCase()}</span>
                    {isAdminProfile ? (
                      <span className="dashboard-profile-copy admin-profile-copy">
                        <strong>{displayName}</strong>
                        <span>{roleLabel}</span>
                      </span>
                    ) : (
                      <span>{displayName}</span>
                    )}
                    {isAdminProfile ? (
                      <span className="admin-profile-chip-chevron" aria-hidden="true">⌄</span>
                    ) : (
                      <span aria-hidden="true">⌄</span>
                    )}
                  </button>

                  {isProfileMenuOpen ? (
                    <div className="dashboard-profile-dropdown" role="menu" aria-label="Menu akun">
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

            {profileError ? <div className="account-profile-alert error">{profileError}</div> : null}
            {isLoadingProfile ? <div className="account-profile-alert">Memuat data profil...</div> : null}

            <section className="account-profile-hero-card">
              <div className="account-profile-cover">
                <div className="account-profile-avatar-frame">
                  <div className="account-profile-avatar-circle" aria-hidden="true">
                    <span>{displayName.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <span className="account-profile-avatar-camera" aria-hidden="true">📷</span>
                </div>
              </div>

              <div className="account-profile-hero-content">
                <div className="account-profile-title-block">
                  <div className="account-profile-title-line">
                    <h1>{displayName}</h1>
                    <span className="account-profile-role-badge">{roleLabel}</span>
                  </div>
                  <div className="account-profile-hero-meta">
                    <span>{username}</span>
                    <span>{emailLabel}</span>
                    <span>Bergabung {profileJoinedAt}</span>
                  </div>
                </div>

                <button type="button" className="account-profile-hero-edit" onClick={() => setShowEditModal(true)}>
                  <span aria-hidden="true">✎</span>
                  Edit Profil
                </button>
              </div>
            </section>

            <section className="account-profile-grid-layout">
              <article className="account-profile-card">
                <div className="account-profile-card-head">
                  <div className="account-profile-card-title">
                    <span className="account-profile-card-icon" aria-hidden="true">👤</span>
                    <h2>Informasi Pribadi</h2>
                  </div>
                  <button type="button" className="account-profile-edit-button" onClick={() => setShowEditModal(true)}>Edit</button>
                </div>
                <div className="account-profile-card-body">
                  {personalInfoItems.map(([label, value]) => (
                    <div className="account-profile-row" key={label}>
                      <span className="account-profile-row-label">{label}</span>
                      <strong className="account-profile-row-value">{value}</strong>
                    </div>
                  ))}
                </div>
              </article>

              <article className="account-profile-card">
                <div className="account-profile-card-head">
                  <div className="account-profile-card-title">
                    <span className="account-profile-card-icon" aria-hidden="true">📝</span>
                    <h2>Biografi</h2>
                  </div>
                  <button type="button" className="account-profile-edit-button" onClick={() => setShowEditModal(true)}>Edit</button>
                </div>
                <div className="account-profile-card-body">
                  {bioText ? (
                    <div className="account-profile-bio-box">
                      <p>{bioText}</p>
                    </div>
                  ) : (
                    <div className="account-profile-empty-state account-profile-bio-empty">
                      <div className="account-profile-empty-icon" aria-hidden="true">📝</div>
                      <strong>Belum ada biografi</strong>
                      <p>Tambahkan biografi untuk memperkenalkan diri Anda.</p>
                      <button type="button" className="account-profile-empty-action account-profile-empty-action-primary" onClick={() => setShowEditModal(true)}>
                        <span aria-hidden="true">+</span>
                        Tambah Biografi
                      </button>
                    </div>
                  )}
                </div>
              </article>

              {isAdminProfile ? (
                <article className="account-profile-card">
                  <div className="account-profile-card-head">
                    <div className="account-profile-card-title">
                      <span className="account-profile-card-icon" aria-hidden="true">🛡️</span>
                      <h2>Info Akses & Peran</h2>
                    </div>
                  </div>
                  <div className="account-profile-card-body">
                    <div className="account-profile-row">
                      <span className="account-profile-row-label">Peran</span>
                      <strong className="account-profile-row-value">{roleLabel}</strong>
                    </div>
                    <div className="account-profile-row">
                      <span className="account-profile-row-label">Status Akun</span>
                      <strong className="account-profile-row-value">{accountStatusLabel}</strong>
                    </div>
                    <div className="account-profile-row">
                      <span className="account-profile-row-label">Kode Admin</span>
                      <strong className="account-profile-row-value">{adminCode}</strong>
                    </div>
                    <div className="account-profile-row">
                      <span className="account-profile-row-label">Hak Akses</span>
                      <strong className="account-profile-row-value">Akses penuh ke seluruh modul admin (Paket, Soal, User, Transaksi, dll.)</strong>
                    </div>
                  </div>
                </article>
              ) : null}

              <article className="account-profile-card account-profile-empty-card">
                <div className="account-profile-card-head">
                  <div className="account-profile-card-title">
                    <span className="account-profile-card-icon" aria-hidden="true">🕘</span>
                    <h2>Riwayat Aktivitas</h2>
                  </div>
                </div>
                {isLoadingActivity ? (
                  <div className="account-profile-empty-state account-profile-history-empty">
                    <p>Memuat riwayat aktivitas...</p>
                  </div>
                ) : activityLog.length > 0 ? (
                  <ul className="account-profile-history-list">
                    {activityLog.map((activity) => (
                      <li key={activity.id} className="account-profile-history-item">
                        <span className="account-profile-history-item-icon" aria-hidden="true">{activity.icon || '🕘'}</span>
                        <div className="account-profile-history-item-content">
                          <strong>{activity.title}</strong>
                          {activity.description ? <p>{activity.description}</p> : null}
                          <time>{formatAdminDate(activity.created_at)}</time>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="account-profile-empty-state account-profile-history-empty">
                    <div className="account-profile-empty-icon account-profile-history-icon" aria-hidden="true">🧾</div>
                    <strong>Tidak ada riwayat aktivitas</strong>
                    <p>Riwayat aktivitas akan tampil setelah aktivitas tersedia.</p>
                  </div>
                )}
              </article>
            </section>

            <div className="account-profile-footer-actions">
              <button type="button" className="dashboard-secondary-action" onClick={() => navigate(backDashboardPath, { state: { user: activeProfile } })}>
                <span aria-hidden="true">←</span>
                Kembali ke Dashboard
              </button>
            </div>
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
