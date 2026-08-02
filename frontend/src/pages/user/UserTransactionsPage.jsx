import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { fetchUserTransactions } from '../../api/accountProfileApi'
import AdminLogoutModal from '../../components/layout/AdminLogoutModal'
import DashboardNotificationMenu from '../../components/layout/DashboardNotificationMenu'
import UserSidebar from '../../components/layout/UserSidebar'
import MaterialEmptyState from '../../components/shared/MaterialEmptyState'
import { formatAdminDate, formatCurrency } from '../../utils/format'
import { clearAuthUser, readStoredUser } from '../../utils/storage'
import './UserTransactionsPage.css'

const STATUS_FILTERS = [
  { key: 'ALL', label: 'Semua' },
  { key: 'success', label: 'Berhasil' },
  { key: 'pending', label: 'Menunggu' },
  { key: 'cancelled', label: 'Dibatalkan' },
]

export default function UserTransactionsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const profileMenuRef = useRef(null)
  const storedUser = readStoredUser()
  const user = location.state?.user ?? storedUser

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true)
  const [transactionError, setTransactionError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    const handleDocumentPointerDown = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false)
      }
    }
    const handleDocumentKeyDown = (event) => {
      if (event.key === 'Escape') setIsProfileMenuOpen(false)
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
      setIsLoadingTransactions(false)
      return
    }

    let cancelled = false

    const loadTransactions = async () => {
      setIsLoadingTransactions(true)
      setTransactionError(null)

      try {
        const payload = await fetchUserTransactions(user.pid)
        if (!cancelled) setTransactions(Array.isArray(payload?.data) ? payload.data : [])
      } catch (error) {
        if (!cancelled) setTransactionError(error instanceof Error ? error.message : 'Riwayat transaksi gagal dimuat.')
      } finally {
        if (!cancelled) setIsLoadingTransactions(false)
      }
    }

    void loadTransactions()
    return () => { cancelled = true }
  }, [user?.pid])

  const filteredTransactions = useMemo(() => {
    if (statusFilter === 'ALL') return transactions
    return transactions.filter((row) => row.status_class === statusFilter)
  }, [transactions, statusFilter])

  const summary = useMemo(() => {
    const totalBelanja = transactions
      .filter((row) => row.status_class === 'success')
      .reduce((sum, row) => sum + Number(row.total || 0), 0)

    return {
      totalTransaksi: transactions.length,
      totalBelanja,
      menunggu: transactions.filter((row) => row.status_class === 'pending').length,
    }
  }, [transactions])

  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/dashboard-user/transactions' }} />
  }

  const currentPath = location.pathname
  const displayName = user?.nama || user?.name || user?.email?.split('@')?.[0] || 'User'
  const initials = displayName.slice(0, 2).toUpperCase()
  const isProfileComplete = user?.profile_completed !== false

  const handleLogout = () => setShowLogoutConfirm(true)
  const confirmLogout = () => { clearAuthUser(); navigate('/login', { replace: true }) }

  const transactionNotifications = [
    {
      id: 'transactions-info',
      title: 'Riwayat transaksi',
      description: 'Cek status pembayaran dan invoice paket yang kamu beli.',
      time: 'Baru',
      icon: '🧾',
      accent: 'blue',
      href: '/dashboard-user/transactions',
    },
  ]

  return (
    <div className="dashboard-page dashboard-page-v2 user-transactions-page">
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

        <main className="dashboard-main dashboard-main-v2 user-transactions-main">
          <header className="dashboard-topbar">
            <div className="dashboard-topbar-left">
              <button type="button" className="dashboard-menu-button" aria-label={isSidebarCollapsed ? 'Buka navigasi' : 'Sembunyikan navigasi'} onClick={() => setIsSidebarCollapsed((current) => !current)}>☰</button>
              <p>Riwayat Transaksi <strong>{displayName}</strong></p>
            </div>

            <div className="dashboard-topbar-right">
              <button type="button" className="dashboard-home-button" aria-label="Beranda" onClick={() => navigate('/dashboard-user', { state: { user } })}>🏠</button>
              <DashboardNotificationMenu items={transactionNotifications} onItemClick={(item) => navigate(item.href, { state: { user } })} />
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

          <section className="user-tryout-hero-card user-transactions-hero-card">
            <div>
              <div className="dashboard-status-pill success">Riwayat Transaksi</div>
              <h2>Semua pembelian paketmu di satu tempat.</h2>
              <p>Cek status pembayaran, invoice, dan paket yang pernah kamu beli.</p>
            </div>

            <div className="user-tryout-hero-stats">
              <article>
                <span>Total Transaksi</span>
                <strong>{summary.totalTransaksi}</strong>
              </article>
              <article>
                <span>Total Belanja</span>
                <strong>{formatCurrency(summary.totalBelanja)}</strong>
              </article>
              <article>
                <span>Menunggu Pembayaran</span>
                <strong>{summary.menunggu}</strong>
              </article>
            </div>
          </section>

          {transactionError ? <div className="dashboard-alert error">{transactionError}</div> : null}
          {isLoadingTransactions ? <div className="dashboard-alert">Memuat riwayat transaksi...</div> : null}

          {!isLoadingTransactions && !transactionError ? (
            transactions.length ? (
              <section className="user-transactions-panel">
                <div className="user-transactions-filter-row">
                  {STATUS_FILTERS.map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      className={`user-transactions-filter${statusFilter === filter.key ? ' active' : ''}`}
                      onClick={() => setStatusFilter(filter.key)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {filteredTransactions.length ? (
                  <div className="user-transactions-table-wrap">
                    <table className="user-transactions-table">
                      <thead>
                        <tr>
                          <th>Invoice</th>
                          <th>Paket</th>
                          <th>Tanggal</th>
                          <th>Total</th>
                          <th>Metode</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((row) => (
                          <tr key={row.pid}>
                            <td>{row.invoice}</td>
                            <td>{row.nama_paket}</td>
                            <td>{formatAdminDate(row.created_at, { hour: false })}</td>
                            <td>{formatCurrency(row.total)}</td>
                            <td>{row.payment_type || '-'}</td>
                            <td>
                              <span className={`user-transactions-status-badge ${row.status_class}`}>{row.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="user-transactions-note">Tidak ada transaksi dengan status ini.</p>
                )}
              </section>
            ) : (
              <MaterialEmptyState
                title="Belum ada transaksi"
                description="Riwayat pembelian paketmu akan muncul di sini setelah kamu membeli paket."
                actionLabel="Lihat Paket Tryout"
                onAction={() => navigate('/dashboard-user/tryout', { state: { user } })}
                accent="blue"
              />
            )
          ) : null}
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
