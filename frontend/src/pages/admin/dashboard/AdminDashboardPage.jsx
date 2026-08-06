import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { fetchAccountProfile } from '../../../api/accountProfileApi'
import { fetchDashboardSummary } from '../../../api/notificationsApi'
import { fetchSystemHealth } from '../../../api/systemApi'
import AdminBrandBlock from '../../../components/layout/AdminBrandBlock'
import ComingSoonModal from '../../../components/layout/ComingSoonModal'
import AdminLogoutModal from '../../../components/layout/AdminLogoutModal'
import AdminQuestionMenu from '../../../components/layout/AdminQuestionMenu'
import AdminSystemMenu from '../../../components/layout/AdminSystemMenu'
import AdminTopbar from '../../../components/layout/AdminTopbar'
import AdminUserMenu from '../../../components/layout/AdminUserMenu'
import { formatCurrency } from '../../../utils/format'
import './AdminDashboardPage.css'
import { clearAuthUser, readStoredAdminSidebarState, readStoredUser, storeAdminSidebarState } from '../../../utils/storage'

export default function AdminDashboardPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => readStoredAdminSidebarState())
  const [dashboardSummary, setDashboardSummary] = useState({
    total_user: 0,
    user_aktif: 0,
    user_nonaktif: 0,
    total_transaksi: 0,
    total_pendapatan: 0,
    total_paket: 0,
  })
  const [systemStatus, setSystemStatus] = useState({ backend: 'checking', database: 'checking', mail: 'checking', storage: 'checking' })
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [comingSoonLabel, setComingSoonLabel] = useState(null)
  const [profileName, setProfileName] = useState(null)
  const storedUser = readStoredUser()
  const user = location.state?.user ?? storedUser
  const currentPath = location.pathname

  if (!user || Number(user?.is_admin ?? 0) !== 1) {
    return <Navigate to="/login" replace state={{ from: '/dashboard-admin' }} />
  }

  const displayName = profileName || user?.nama || user?.email?.split('@')?.[0] || 'Admin'
  const summaryCards = [
    { label: 'Total User', value: String(dashboardSummary.total_user ?? 0), delta: 'Data dari tbl_user', accent: 'blue', icon: '👥' },
    { label: 'Total Transaksi', value: String(dashboardSummary.total_transaksi ?? 0), delta: 'Data dari tbl_transaksi', accent: 'green', icon: '🛒' },
    { label: 'Total Pendapatan', value: formatCurrency(dashboardSummary.total_pendapatan ?? 0), delta: 'Transaksi berstatus paid', accent: 'orange', icon: '💳' },
    { label: 'Total Paket', value: String(dashboardSummary.total_paket ?? 0), delta: 'Data dari tbl_paket', accent: 'purple', icon: '📦' },
  ]
  const userAktif = Number(dashboardSummary.user_aktif ?? 0)
  const userNonaktif = Number(dashboardSummary.user_nonaktif ?? 0)
  const userDistribusiTotal = userAktif + userNonaktif
  const aktifPct = userDistribusiTotal > 0 ? (userAktif / userDistribusiTotal) * 100 : 0
  const nonaktifPct = userDistribusiTotal > 0 ? 100 - aktifPct : 0
  const formatPct = (value) => `${value.toFixed(1).replace('.', ',')}%`

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
  const systemStatusItems = [
    ['Backend', systemStatus.backend],
    ['Database', systemStatus.database],
    ['Mail Service', systemStatus.mail],
    ['Storage', systemStatus.storage],
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
    { label: 'Materi', href: '/dashboard-admin/materials' },
    { label: 'Transaksi', href: '/dashboard-admin/transactions' },
    { label: 'Konten', href: '#' },
    { label: 'Laporan', href: '#' },
  ]
  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    clearAuthUser()

    navigate('/login', { replace: true })
  }

  useEffect(() => {
    storeAdminSidebarState(isSidebarCollapsed)
  }, [isSidebarCollapsed])

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
    let cancelled = false

    const loadSummary = async () => {
      try {
        const payload = await fetchDashboardSummary()
        const nextSummary = payload?.data

        if (!cancelled && nextSummary) {
          setDashboardSummary({
            total_user: Number(nextSummary.total_user ?? 0),
            user_aktif: Number(nextSummary.user_aktif ?? 0),
            user_nonaktif: Number(nextSummary.user_nonaktif ?? 0),
            total_transaksi: Number(nextSummary.total_transaksi ?? 0),
            total_pendapatan: Number(nextSummary.total_pendapatan ?? 0),
            total_paket: Number(nextSummary.total_paket ?? 0),
          })
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

  useEffect(() => {
    let cancelled = false

    const checkHealth = async () => {
      try {
        const payload = await fetchSystemHealth()

        if (!cancelled) {
          setSystemStatus({
            backend: payload?.status === 'ok' ? 'online' : 'offline',
            database: payload?.database === 'ok' ? 'online' : 'offline',
            mail: payload?.mail === 'ok' ? 'online' : 'offline',
            storage: typeof payload?.storage === 'number' ? payload.storage : 'offline',
          })
        }
      } catch {
        if (!cancelled) {
          setSystemStatus({ backend: 'offline', database: 'offline', mail: 'offline', storage: 'offline' })
        }
      }
    }

    void checkHealth()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="admin-dashboard-page">
      <div className={`admin-dashboard-shell${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <aside className={`admin-sidebar${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
          <AdminBrandBlock isCollapsed={isSidebarCollapsed} />

          <div className="admin-sidebar-group-label">Main</div>
          <nav className="admin-sidebar-nav" aria-label="Navigasi admin">
            {adminMainMenu.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`admin-sidebar-item${currentPath === item.href ? ' active' : ''}`}
                onClick={() => (item.href === '#' ? setComingSoonLabel(item.label) : navigate(item.href))}
              >
                <span className="admin-sidebar-icon" aria-hidden="true">{item.label.slice(0, 1)}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <AdminQuestionMenu currentPath={currentPath} navigate={navigate} />

          <AdminSystemMenu currentPath={currentPath} navigate={navigate} />

          <AdminUserMenu profileUser={user} displayName={displayName} onResumeProfile={(activeUser) => navigate('/account-profile', { state: { user: activeUser } })} onLogout={handleLogout} />
        </aside>

        <main className="admin-main">
          <AdminTopbar
            title="Dashboard Admin"
            searchPlaceholder="Cari sesuatu..."
            currentDateLabel={currentDateLabel}
            displayName={displayName}
            profileUser={user}
            profileRoleLabel="Super Admin"
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={() => setIsSidebarCollapsed((current) => !current)}
            onHomeClick={() => navigate('/')}
            onResumeProfile={(activeUser) => navigate('/account-profile', { state: { user: activeUser } })}
            onLogout={handleLogout}
            onNotificationItemClick={(item) => navigate(item.href, { state: { user } })}
          />

          <section className="admin-hero-row">
            <div>
              <h2>Selamat datang kembali, {displayName}! 👋</h2>
              <p>Berikut ringkasan performa platform hari ini.</p>
            </div>

            <button type="button" className="admin-range-chip">
              <span aria-hidden="true">📅</span>
              <span>19 Mei 2025 - 26 Mei 2025</span>
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
              <div className="admin-card-head">
                <h3>Distribusi User</h3>
              </div>
              <hr className="admin-donut-divider" />
              <div className="admin-donut-wrap">
                <div
                  className="admin-donut"
                  aria-hidden="true"
                  style={{
                    background: `conic-gradient(#2dbf75 0 ${aktifPct}%, #ffbf1f ${aktifPct}% 100%)`,
                  }}
                >
                  <div className="admin-donut-center">
                    <strong>{userDistribusiTotal.toLocaleString('id-ID')}</strong>
                    <span>Total User</span>
                  </div>
                </div>

                <div className="admin-donut-legend">
                  <div className="admin-donut-legend-row active">
                    <span className="admin-donut-legend-dot"><i className="dot green" /></span>
                    <div className="admin-donut-legend-copy">
                      <strong>Active</strong>
                      <span>{formatPct(aktifPct)} dari total user</span>
                    </div>
                    <strong className="admin-donut-legend-value">{userAktif.toLocaleString('id-ID')}</strong>
                  </div>
                  <div className="admin-donut-legend-row inactive">
                    <span className="admin-donut-legend-dot"><i className="dot yellow" /></span>
                    <div className="admin-donut-legend-copy">
                      <strong>Inactive</strong>
                      <span>{formatPct(nonaktifPct)} dari total user</span>
                    </div>
                    <strong className="admin-donut-legend-value">{userNonaktif.toLocaleString('id-ID')}</strong>
                  </div>
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
                {systemStatusItems.map(([name, status]) => {
                  const isPercent = typeof status === 'number'
                  const tone = isPercent
                    ? status >= 90
                      ? 'status-offline'
                      : status >= 70
                        ? 'status-warning'
                        : 'status-online'
                    : `status-${status}`
                  const label = isPercent
                    ? `${status}% terpakai`
                    : status === 'checking'
                      ? 'Mengecek...'
                      : status === 'online'
                        ? 'Online'
                        : 'Offline'

                  return (
                    <div className="admin-status-item" key={name}>
                      <div className="admin-status-name">{name}</div>
                      <span className={`admin-status-pill ${tone}`}>{label}</span>
                    </div>
                  )
                })}
              </div>
            </article>
          </section>

          <AdminLogoutModal
            open={showLogoutConfirm}
            onCancel={() => setShowLogoutConfirm(false)}
            onConfirm={confirmLogout}
          />

          <ComingSoonModal open={Boolean(comingSoonLabel)} label={comingSoonLabel} onClose={() => setComingSoonLabel(null)} />
        </main>
      </div>
    </div>
  )
}
