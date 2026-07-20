import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { BACKEND_URL } from '../../api/client'
import { fetchUserMaterials } from '../../api/materialsApi'
import DashboardNotificationMenu from '../../components/layout/DashboardNotificationMenu'
import AdminLogoutModal from '../../components/layout/AdminLogoutModal'
import UserSidebar from '../../components/layout/UserSidebar'
import MaterialEmptyState from '../../components/shared/MaterialEmptyState'
import { getFriendlyFetchError } from '../../utils/fetchError'
import { clearAuthUser, readStoredUser } from '../../utils/storage'
import UserMaterialViewerModal from './UserMaterialViewerModal'

export default function UserMaterialsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const profileMenuRef = useRef(null)
  const storedUser = readStoredUser()
  const user = location.state?.user ?? storedUser

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [materialRows, setMaterialRows] = useState([])
  const [materialPackages, setMaterialPackages] = useState([])
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true)
  const [materialError, setMaterialError] = useState(null)
  const [selectedMaterialPackage, setSelectedMaterialPackage] = useState('ALL')
  const [materialSearch, setMaterialSearch] = useState('')
  const [previewMaterial, setPreviewMaterial] = useState(null)

  useEffect(() => {
    const handleDocumentPointerDown = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false)
      }
    }

    const handleDocumentKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false)
        setPreviewMaterial(null)
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
      setIsLoadingMaterials(false)
      return
    }

    let cancelled = false

    const loadMaterials = async () => {
      setIsLoadingMaterials(true)
      setMaterialError(null)

      try {
        const payload = await fetchUserMaterials({
          userId: user.pid,
          search: materialSearch.trim(),
          packageId: selectedMaterialPackage,
        })

        if (!cancelled) {
          setMaterialRows(Array.isArray(payload?.data) ? payload.data : [])
          setMaterialPackages(Array.isArray(payload?.packages) ? payload.packages : [])
        }
      } catch (error) {
        if (!cancelled) setMaterialError(getFriendlyFetchError(error, 'Data materi gagal dimuat.'))
      } finally {
        if (!cancelled) setIsLoadingMaterials(false)
      }
    }

    void loadMaterials()

    return () => { cancelled = true }
  }, [user?.pid, materialSearch, selectedMaterialPackage])

  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/dashboard-user/materials' }} />
  }

  const currentPath = location.pathname
  const displayName = user?.nama || user?.name || user?.email?.split('@')?.[0] || 'User'
  const initials = displayName.slice(0, 2).toUpperCase()
  const isProfileComplete = user?.profile_completed !== false

  const handleLogout = () => setShowLogoutConfirm(true)
  const confirmLogout = () => { clearAuthUser(); navigate('/login', { replace: true }) }

  const filteredRows = materialRows
  const previewSrc = previewMaterial ? `${BACKEND_URL}/api/materials/${previewMaterial.pid}/view?user_id=${user.pid}` : ''

  const materialNotifications = [
    {
      id: 'material-new',
      title: 'Materi PDF tersedia',
      description: 'Buka materi terbaru untuk paket belajar kamu.',
      time: 'Baru',
      icon: '📄',
      accent: 'blue',
      href: '/dashboard-user/materials',
    },
    {
      id: 'material-view-only',
      title: 'Mode lihat saja',
      description: 'Dokumen dibuka langsung tanpa unduhan.',
      time: 'Hari ini',
      icon: '👁️',
      accent: 'orange',
      href: '/dashboard-user/materials',
    },
  ]

  return (
    <div className="dashboard-page dashboard-page-v2 user-material-page">
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

        <main className="dashboard-main dashboard-main-v2 user-material-main">
          <header className="dashboard-topbar">
            <div className="dashboard-topbar-left">
              <button type="button" className="dashboard-menu-button" aria-label={isSidebarCollapsed ? 'Buka navigasi' : 'Sembunyikan navigasi'} onClick={() => setIsSidebarCollapsed((current) => !current)}>☰</button>
              <p>Materi Belajar <strong>{displayName}</strong></p>
            </div>

            <div className="dashboard-topbar-right">
              <button type="button" className="dashboard-home-button" aria-label="Beranda" onClick={() => navigate('/dashboard-user', { state: { user } })}>🏠</button>
              <DashboardNotificationMenu items={materialNotifications} onItemClick={(item) => navigate(item.href, { state: { user } })} />
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

          {materialError ? <div className="dashboard-alert error">{materialError}</div> : null}
          {isLoadingMaterials ? <div className="dashboard-alert">Memuat materi...</div> : null}

          <section className="user-tryout-hero-card user-material-hero-card">
            <div>
              <div className="dashboard-status-pill success">Akses Materi</div>
              <h2>Materi PDF yang sesuai paketmu.</h2>
              <p>Materi yang tampil hanya untuk paket yang sudah kamu beli dan bisa dibuka langsung di browser saat login.</p>
            </div>

            <div className="user-tryout-hero-stats">
              <article>
                <span>Materi Aktif</span>
                <strong>{materialRows.length}</strong>
              </article>
              <article>
                <span>Paket Terakses</span>
                <strong>{materialPackages.length}</strong>
              </article>
              <article>
                <span>Status</span>
                <strong>View Only</strong>
              </article>
            </div>
          </section>

          <section className="admin-card admin-package-filter-card">
            <div className="admin-package-filters">
              <label className="admin-package-search">
                <span aria-hidden="true">⌕</span>
                <input type="search" placeholder="Cari materi..." value={materialSearch} onChange={(event) => setMaterialSearch(event.target.value)} />
              </label>

              <div className="admin-package-filter-group">
                <select className="admin-package-select" value={selectedMaterialPackage} onChange={(event) => setSelectedMaterialPackage(event.target.value)}>
                  <option value="ALL">Semua Paket</option>
                  {materialPackages.map((item) => (
                    <option key={item.pid} value={String(item.pid)}>{item.name}</option>
                  ))}
                </select>

                <button type="button" className="admin-user-filter-button admin-package-filter-button">Filter</button>
                <button type="button" className="admin-package-reset" onClick={() => { setMaterialSearch(''); setSelectedMaterialPackage('ALL') }}>Reset</button>
              </div>
            </div>
          </section>

          <section className="user-material-grid">
            {filteredRows.length ? (
              filteredRows.map((row) => (
                <article className="user-material-card" key={row.pid}>
                  <div className="user-material-card-head">
                    <span className="user-tryout-package-badge">{row.package_name}</span>
                    <span className={`admin-package-type-badge ${row.status_key === 'published' ? 'online' : 'tryout'}`}>{row.status}</span>
                  </div>
                  <h3>{row.judul}</h3>
                  <p>{row.deskripsi || 'Tidak ada deskripsi materi.'}</p>
                  <div className="user-material-meta">
                    <span>{row.file_size_label}</span>
                    <span>{row.original_name}</span>
                  </div>
                  <button type="button" className="dashboard-primary-action user-material-open-button" onClick={() => setPreviewMaterial(row)}>
                    Lihat Materi
                  </button>
                </article>
              ))
            ) : (
              <MaterialEmptyState
                title="Belum ada materi yang bisa diakses"
                description="Materi akan muncul setelah kamu membeli paket yang sesuai."
                actionLabel="Kembali ke Dashboard"
                onAction={() => navigate('/dashboard-user', { state: { user } })}
                accent="green"
              />
            )}
          </section>
        </main>
      </div>

      <UserMaterialViewerModal
        open={Boolean(previewMaterial)}
        material={previewMaterial}
        src={previewSrc}
        onClose={() => setPreviewMaterial(null)}
      />

      <AdminLogoutModal
        open={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Keluar dari akun user?"
        message="Pastikan materi yang sedang dibuka sudah selesai dibaca sebelum logout."
        confirmLabel="Ya, keluar"
      />
    </div>
  )
}
