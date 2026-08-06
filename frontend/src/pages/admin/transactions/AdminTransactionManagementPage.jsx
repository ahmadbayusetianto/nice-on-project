import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { fetchAdminTransactions } from '../../../api/adminTransactionsApi'
import AdminBrandBlock from '../../../components/layout/AdminBrandBlock'
import ComingSoonModal from '../../../components/layout/ComingSoonModal'
import AdminLogoutModal from '../../../components/layout/AdminLogoutModal'
import AdminQuestionMenu from '../../../components/layout/AdminQuestionMenu'
import AdminSystemMenu from '../../../components/layout/AdminSystemMenu'
import AdminTopbar from '../../../components/layout/AdminTopbar'
import AdminUserMenu from '../../../components/layout/AdminUserMenu'
import { getFriendlyFetchError } from '../../../utils/fetchError'
import { formatAdminDate, formatCurrency, PAGE_SIZE_OPTIONS } from '../../../utils/format'
import { clearAuthUser, readStoredAdminSidebarState, readStoredUser, storeAdminSidebarState } from '../../../utils/storage'
import AdminTransactionDetailModal from './AdminTransactionDetailModal'
import './AdminTransactionManagementPage.css'

export default function AdminTransactionManagementPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => readStoredAdminSidebarState())
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [comingSoonLabel, setComingSoonLabel] = useState(null)
  const [showTransactionDetailModal, setShowTransactionDetailModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [transactionRows, setTransactionRows] = useState([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true)
  const [transactionError, setTransactionError] = useState(null)
  const [transactionSearch, setTransactionSearch] = useState('')
  const [selectedTransactionStatus, setSelectedTransactionStatus] = useState('Semua Status')
  const [selectedTransactionProgram, setSelectedTransactionProgram] = useState('Semua Program')
  const [transactionCurrentPage, setTransactionCurrentPage] = useState(1)
  const [transactionPageSize, setTransactionPageSize] = useState(10)
  const [transactionSummary, setTransactionSummary] = useState({
    total_transaksi: 0,
    total_pendapatan: 0,
    transaksi_berhasil: 0,
    menunggu_pembayaran: 0,
    dibatalkan: 0,
  })
  const storedUser = readStoredUser()
  const user = location.state?.user ?? storedUser

  if (!user || Number(user?.is_admin ?? 0) !== 1) {
    return <Navigate to="/login" replace state={{ from: '/dashboard-admin/transactions' }} />
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
    { label: 'Materi', href: '/dashboard-admin/materials' },
    { label: 'Transaksi', href: '/dashboard-admin/transactions' },
    { label: 'Konten', href: '#' },
    { label: 'Laporan', href: '#' },
  ]

  const transactionSummaryCards = [
    { label: 'Total Transaksi', value: String(transactionSummary.total_transaksi ?? 0), delta: 'Semua transaksi', accent: 'blue', icon: '🧾' },
    { label: 'Total Pendapatan', value: formatCurrency(transactionSummary.total_pendapatan ?? 0), delta: 'Transaksi berhasil', accent: 'green', icon: '💳' },
    { label: 'Transaksi Berhasil', value: String(transactionSummary.transaksi_berhasil ?? 0), delta: 'Status paid', accent: 'purple', icon: '✅' },
    { label: 'Menunggu Pembayaran', value: String(transactionSummary.menunggu_pembayaran ?? 0), delta: 'Status pending', accent: 'orange', icon: '⏳' },
    { label: 'Dibatalkan', value: String(transactionSummary.dibatalkan ?? 0), delta: 'Status cancelled', accent: 'red', icon: '⛔' },
  ]

  const transactionStatusOptions = ['Semua Status', 'Berhasil', 'Menunggu', 'Dibatalkan']
  const transactionProgramOptions = ['Semua Program', 'CPNS', 'PPPK']

  const loadTransactions = async ({ cancelled = () => false, showLoading = true } = {}) => {
    if (showLoading) {
      setIsLoadingTransactions(true)
    }

    setTransactionError(null)

    try {
      const payload = await fetchAdminTransactions({
        search: transactionSearch.trim(),
        status: selectedTransactionStatus,
        program: selectedTransactionProgram,
      })

      if (!cancelled()) {
        setTransactionRows(Array.isArray(payload?.data) ? payload.data : [])
        setTransactionSummary(payload?.summary ?? {
          total_transaksi: 0,
          total_pendapatan: 0,
          transaksi_berhasil: 0,
          menunggu_pembayaran: 0,
          dibatalkan: 0,
        })
      }
    } catch (error) {
      if (!cancelled()) {
        const message = getFriendlyFetchError(error, 'Data transaksi gagal dimuat.')
        setTransactionError(message.includes('<!DOCTYPE') ? 'Backend mengembalikan halaman HTML, periksa koneksi database/server.' : message)
      }
    } finally {
      if (showLoading && !cancelled()) {
        setIsLoadingTransactions(false)
      }
    }
  }

  useEffect(() => {
    let cancelled = false

    void loadTransactions({ cancelled: () => cancelled, showLoading: true })

    return () => {
      cancelled = true
    }
  }, [transactionSearch, selectedTransactionStatus, selectedTransactionProgram])

  const visibleTransactionRows = transactionRows
  const totalTransactionPages = Math.max(1, Math.ceil(visibleTransactionRows.length / transactionPageSize))
  const safeTransactionCurrentPage = Math.min(transactionCurrentPage, totalTransactionPages)
  const transactionStartIndex = (safeTransactionCurrentPage - 1) * transactionPageSize
  const transactionPaginatedRows = visibleTransactionRows.slice(transactionStartIndex, transactionStartIndex + transactionPageSize)

  useEffect(() => {
    setTransactionCurrentPage(1)
  }, [transactionSearch, selectedTransactionStatus, selectedTransactionProgram, transactionPageSize])

  useEffect(() => {
    if (transactionCurrentPage > totalTransactionPages) {
      setTransactionCurrentPage(totalTransactionPages)
    }
  }, [transactionCurrentPage, totalTransactionPages])

  const renderTransactionPaginationPages = () => {
    if (totalTransactionPages <= 1) return [1]

    const pages = new Set([1, totalTransactionPages, safeTransactionCurrentPage])
    if (safeTransactionCurrentPage > 1) pages.add(safeTransactionCurrentPage - 1)
    if (safeTransactionCurrentPage < totalTransactionPages) pages.add(safeTransactionCurrentPage + 1)

    return Array.from(pages).sort((a, b) => a - b)
  }

  const transactionDateRangeLabel = (() => {
    if (!transactionRows.length) return 'Belum ada data'

    const dates = transactionRows
      .map((row) => new Date(row.transactionDateRaw || row.paidDateRaw || ''))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())

    if (!dates.length) return 'Belum ada data'

    return `${formatAdminDate(dates[0], { hour: false })} - ${formatAdminDate(dates[dates.length - 1], { hour: false })}`
  })()

  const handleExportTransactions = () => {
    if (!visibleTransactionRows.length) return

    const headers = ['Invoice', 'Pelanggan', 'Email', 'No. HP', 'Paket', 'Tipe Paket', 'Program', 'Tgl Transaksi', 'Total', 'Status']
    const escapeCsvValue = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const csvRows = visibleTransactionRows.map((row) => [
      row.invoice,
      row.customerName,
      row.customerEmail,
      row.customerPhone,
      row.packageName,
      row.packageType,
      row.program,
      row.transactionDate,
      row.totalLabel,
      row.status,
    ]
      .map(escapeCsvValue)
      .join(','))
    const csvContent = [headers.map(escapeCsvValue).join(','), ...csvRows].join('\r\n')

    const blob = new Blob([String.fromCharCode(0xfeff), csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `data-transaksi-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const openTransactionDetail = (row) => {
    setSelectedTransaction(row)
    setShowTransactionDetailModal(true)
  }

  const closeTransactionDetail = () => {
    setShowTransactionDetailModal(false)
    setSelectedTransaction(null)
  }

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

  return (
    <div className="admin-dashboard-page admin-transaction-page">
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

        <main className="admin-main admin-transaction-main">
          <AdminTopbar
            title="Transaksi"
            searchPlaceholder="Cari transaksi..."
            currentDateLabel={currentDateLabel}
            displayName={displayName}
            profileUser={user}
            profileRoleLabel="Super Admin"
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={() => setIsSidebarCollapsed((current) => !current)}
            showSearch={false}
            onHomeClick={() => navigate('/')}
            onResumeProfile={(activeUser) => navigate('/account-profile', { state: { user: activeUser } })}
            onLogout={handleLogout}
            onNotificationItemClick={(item) => navigate(item.href, { state: { user } })}
          />

          <section className="admin-transaction-hero">
            <div>
              <h2>Transaksi</h2>
              <p>Kelola semua transaksi yang tercatat di platform Nice On.</p>
            </div>

            <div className="admin-transaction-actions">
              <button type="button" className="admin-outline-action" onClick={handleExportTransactions} disabled={!visibleTransactionRows.length}>Export Excel</button>
              <button type="button" className="admin-outline-action">Export PDF</button>
            </div>
          </section>

          <section className="admin-summary-grid admin-transaction-summary-grid">
            {transactionSummaryCards.map((card) => (
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

          <section className="admin-card admin-transaction-filter-card">
            {transactionError ? <div className="admin-user-message error">{transactionError}</div> : null}
            {isLoadingTransactions ? <div className="admin-user-message">Memuat data transaksi...</div> : null}

            <div className="admin-transaction-filters">
              <label className="admin-user-search admin-transaction-search">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  placeholder="Cari nama, email, no. HP, atau invoice..."
                  value={transactionSearch}
                  onChange={(event) => setTransactionSearch(event.target.value)}
                />
              </label>

              <div className="admin-transaction-filter-group">
                <select value={selectedTransactionStatus} onChange={(event) => setSelectedTransactionStatus(event.target.value)} className="admin-package-select admin-transaction-select">
                  {transactionStatusOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>

                <select value={selectedTransactionProgram} onChange={(event) => setSelectedTransactionProgram(event.target.value)} className="admin-package-select admin-transaction-select">
                  {transactionProgramOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>

                <label className="admin-page-size-control" aria-label="Jumlah data per halaman">
                  <select
                    className="admin-page-size-select"
                    value={transactionPageSize}
                    onChange={(event) => setTransactionPageSize(Number(event.target.value))}
                  >
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option} / halaman</option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="admin-package-reset"
                  onClick={() => {
                    setTransactionSearch('')
                    setSelectedTransactionStatus('Semua Status')
                    setSelectedTransactionProgram('Semua Program')
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          </section>

          <section className="admin-card admin-transaction-table-card">
            <div className="admin-transaction-table-head">
              <div>
                <h3>Daftar Transaksi</h3>
                <p>{transactionDateRangeLabel}</p>
              </div>
            </div>

            <div className="admin-transaction-table-wrap">
              <table className="admin-user-table admin-transaction-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Pelanggan</th>
                    <th>Paket</th>
                    <th>Program</th>
                    <th>Tgl Transaksi</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionPaginatedRows.map((row) => (
                    <tr key={row.pid}>
                      <td>
                        <strong className="admin-transaction-invoice">{row.invoice}</strong>
                      </td>
                      <td>
                        <div className="admin-user-cell admin-transaction-customer-cell">
                          <div className="admin-user-avatar">{row.customerName.slice(0, 1)}</div>
                          <div>
                            <strong>{row.customerName}</strong>
                            <span>{row.customerEmail}</span>
                            <span>{row.customerPhone}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="admin-transaction-package">
                          <strong>{row.packageName}</strong>
                          <span>{row.packageType}</span>
                        </div>
                      </td>
                      <td><span className="admin-transaction-program-pill">{row.program}</span></td>
                      <td>{row.transactionDate}</td>
                      <td><strong className="admin-transaction-total">{row.totalLabel}</strong></td>
                      <td><span className={`admin-transaction-status ${row.statusClass}`}>{row.status}</span></td>
                      <td>
                        <div className="admin-row-actions admin-transaction-row-actions">
                          <button type="button" className="admin-row-action" title="Lihat detail transaksi" aria-label={`Lihat detail ${row.invoice}`} onClick={() => openTransactionDetail(row)}>👁</button>
                          <button type="button" className="admin-row-action">🖨</button>
                          <button type="button" className="admin-row-action danger">⋮</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-user-footer admin-transaction-footer">
              <p>Menampilkan {transactionPaginatedRows.length} data dari {visibleTransactionRows.length} transaksi</p>
              <div className="admin-pagination">
                <button type="button" className="admin-pagination-arrow" disabled={safeTransactionCurrentPage === 1} onClick={() => setTransactionCurrentPage((current) => Math.max(1, current - 1))}>‹</button>
                {renderTransactionPaginationPages().map((page, index, array) => {
                  const previousPage = array[index - 1]
                  const shouldShowDots = previousPage && page - previousPage > 1

                  return (
                    <span key={page}>
                      {shouldShowDots ? <span className="admin-pagination-dots">…</span> : null}
                      <button type="button" className={`admin-pagination-page${page === safeTransactionCurrentPage ? ' active' : ''}`} onClick={() => setTransactionCurrentPage(page)}>{page}</button>
                    </span>
                  )
                })}
                <button type="button" className="admin-pagination-arrow" disabled={safeTransactionCurrentPage === totalTransactionPages} onClick={() => setTransactionCurrentPage((current) => Math.min(totalTransactionPages, current + 1))}>›</button>
              </div>
            </div>
          </section>

          <AdminLogoutModal
            open={showLogoutConfirm}
            onCancel={() => setShowLogoutConfirm(false)}
            onConfirm={confirmLogout}
          />

          <ComingSoonModal open={Boolean(comingSoonLabel)} label={comingSoonLabel} onClose={() => setComingSoonLabel(null)} />

          <AdminTransactionDetailModal
            open={showTransactionDetailModal}
            transaction={selectedTransaction}
            onCancel={closeTransactionDetail}
          />
        </main>
      </div>
    </div>
  )
}
