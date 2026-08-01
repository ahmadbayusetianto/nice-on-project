import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import './AdminPackageManagementPage.css'
import { deleteAdminPackage, fetchAdminPackageDetail, fetchAdminPackages, saveAdminPackage } from '../../../api/adminPackagesApi'
import AdminBrandBlock from '../../../components/layout/AdminBrandBlock'
import AdminLogoutModal from '../../../components/layout/AdminLogoutModal'
import AdminQuestionMenu from '../../../components/layout/AdminQuestionMenu'
import AdminSystemMenu from '../../../components/layout/AdminSystemMenu'
import AdminTopbar from '../../../components/layout/AdminTopbar'
import AdminUserMenu from '../../../components/layout/AdminUserMenu'
import { getFriendlyFetchError } from '../../../utils/fetchError'
import { formatCurrency, PAGE_SIZE_OPTIONS, parseCurrencyToNumber } from '../../../utils/format'
import { clearAuthUser, readStoredAdminSidebarState, readStoredUser, storeAdminSidebarState } from '../../../utils/storage'
import AdminPackageDetailModal from './AdminPackageDetailModal'
import AdminPackageFormModal from './AdminPackageFormModal'

function createPackageFormFromDetail(detail = {}) {
  return {
    kategori: detail.kategori ?? 'CPNS',
    formasi: detail.formasi ?? '',
    jadwal: detail.jadwal ?? '',
    nama_paket: detail.nama_paket ?? '',
    tipe_paket: detail.tipe_paket ?? 'tunggal',
    bundling_id: detail.bundling_id !== undefined && detail.bundling_id !== null ? String(detail.bundling_id) : '',
    harga: detail.harga !== undefined && detail.harga !== null ? String(detail.harga) : '',
    ket: detail.ket ?? '',
  }
}

export default function AdminPackageManagementPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => readStoredAdminSidebarState())
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [packageRows, setPackageRows] = useState([])
  const [isLoadingPackages, setIsLoadingPackages] = useState(true)
  const [packageError, setPackageError] = useState(null)
  const [packageSearch, setPackageSearch] = useState('')
  const [selectedProgram, setSelectedProgram] = useState('Semua Program')
  const [selectedStatus, setSelectedStatus] = useState('Semua Status')
  const [packageCurrentPage, setPackageCurrentPage] = useState(1)
  const [packagePageSize, setPackagePageSize] = useState(10)
  const [showAddPackageModal, setShowAddPackageModal] = useState(false)
  const [isSavingPackage, setIsSavingPackage] = useState(false)
  const [packageSubmitError, setPackageSubmitError] = useState(null)
  const [packageSubmitSuccess, setPackageSubmitSuccess] = useState(null)
  const [packageModalMode, setPackageModalMode] = useState('create')
  const [editingPackagePid, setEditingPackagePid] = useState(null)
  const [showPackageDetailModal, setShowPackageDetailModal] = useState(false)
  const [packageDetail, setPackageDetail] = useState(null)
  const [isLoadingPackageDetail, setIsLoadingPackageDetail] = useState(false)
  const [packageDetailError, setPackageDetailError] = useState(null)
  const [packageForm, setPackageForm] = useState({
    kategori: 'CPNS',
    formasi: '',
    jadwal: '',
    nama_paket: '',
    tipe_paket: 'tunggal',
    bundling_id: '',
    harga: '',
    ket: '',
  })
  const [packageSummary, setPackageSummary] = useState({ total_paket: 0, paket_aktif: 0, paket_nonaktif: 0, total_penjualan: 0 })
  const packageSuccessTimerRef = useRef(null)
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
    { label: 'Materi', href: '/dashboard-admin/materials' },
    { label: 'Transaksi', href: '/dashboard-admin/transactions' },
    { label: 'Konten', href: '#' },
    { label: 'Laporan', href: '#' },
  ]

  const packageSummaryCards = [
    { label: 'Total Paket', value: String(packageSummary.total_paket ?? 0), delta: 'Semua paket tersedia', accent: 'blue', icon: '📦' },
    { label: 'Paket Aktif', value: String(packageSummary.paket_aktif ?? 0), delta: 'Paket sedang aktif', accent: 'green', icon: '🏷️' },
    { label: 'Paket Nonaktif', value: String(packageSummary.paket_nonaktif ?? 0), delta: 'Paket tidak aktif', accent: 'orange', icon: '⏱️' },
    { label: 'Total Penjualan', value: formatCurrency(packageSummary.total_penjualan ?? 0), delta: 'Akumulasi harga paket', accent: 'purple', icon: '🛒' },
  ]

  const packageFilters = [
    { key: 'program', placeholder: 'Semua Program', value: selectedProgram, options: ['Semua Program', 'CPNS', 'PPPK'] },
    { key: 'status', placeholder: 'Semua Status', value: selectedStatus, options: ['Semua Status', 'Aktif', 'Nonaktif'] },
  ]

  const loadPackages = async ({ cancelled = () => false, showLoading = true } = {}) => {
    if (showLoading) {
      setIsLoadingPackages(true)
    }

    setPackageError(null)

    try {
      const payload = await fetchAdminPackages({ kategori: selectedProgram })

      if (!cancelled()) {
        setPackageRows(Array.isArray(payload?.data) ? payload.data : [])
        setPackageSummary(payload?.summary ?? { total_paket: 0, paket_aktif: 0, paket_nonaktif: 0, total_penjualan: 0 })
      }
    } catch (error) {
      if (!cancelled()) {
        const message = getFriendlyFetchError(error, 'Data paket gagal dimuat.')
        setPackageError(message.includes('<!DOCTYPE') ? 'Backend mengembalikan halaman HTML, periksa koneksi database/server.' : message)
      }
    } finally {
      if (showLoading && !cancelled()) {
        setIsLoadingPackages(false)
      }
    }
  }

  useEffect(() => {
    let cancelled = false

    void loadPackages({ cancelled: () => cancelled, showLoading: true })

    return () => {
      cancelled = true
    }
  }, [selectedProgram])

  const openAddPackageModal = () => {
    if (packageSuccessTimerRef.current) {
      window.clearTimeout(packageSuccessTimerRef.current)
      packageSuccessTimerRef.current = null
    }

    setPackageModalMode('create')
    setEditingPackagePid(null)
    setPackageSubmitError(null)
    setPackageSubmitSuccess(null)
    setPackageForm({
      kategori: 'CPNS',
      formasi: '',
      jadwal: '',
      nama_paket: '',
      tipe_paket: 'tunggal',
      bundling_id: '',
      harga: '',
      ket: '',
    })
    setShowAddPackageModal(true)
  }

  const openPackageDetailModal = async (row) => {
    setShowPackageDetailModal(true)
    setPackageDetail(row ?? null)
    setPackageDetailError(null)
    setIsLoadingPackageDetail(true)

    try {
      const payload = await fetchAdminPackageDetail(row?.pid)
      setPackageDetail(payload?.data ?? row ?? null)
    } catch (error) {
      setPackageDetailError(error instanceof Error ? error.message : 'Detail paket gagal dimuat.')
    } finally {
      setIsLoadingPackageDetail(false)
    }
  }

  const closePackageDetailModal = () => {
    setShowPackageDetailModal(false)
    setPackageDetail(null)
    setPackageDetailError(null)
  }

  const openEditPackageModal = async (row) => {
    if (packageSuccessTimerRef.current) {
      window.clearTimeout(packageSuccessTimerRef.current)
      packageSuccessTimerRef.current = null
    }

    setPackageModalMode('edit')
    setEditingPackagePid(row?.pid ?? null)
    setPackageSubmitError(null)
    setPackageSubmitSuccess(null)
    setShowAddPackageModal(true)
    setPackageForm({
      kategori: row?.program || 'CPNS',
      formasi: row?.type || '',
      jadwal: '',
      nama_paket: row?.name || '',
      tipe_paket: row?.tipe_paket || 'tunggal',
      bundling_id: row?.bundling_id !== undefined && row?.bundling_id !== null ? String(row.bundling_id) : '',
      harga: parseCurrencyToNumber(row?.price),
      ket: row?.desc || '',
    })

    try {
      const payload = await fetchAdminPackageDetail(row?.pid)
      setPackageForm(createPackageFormFromDetail(payload?.data ?? {}))
    } catch (error) {
      // Keep the modal usable even if detail fetch fails.
    } finally {
      // Keep modal responsive; detail fetch is optional.
    }
  }

  const closeAddPackageModal = () => {
    if (isSavingPackage) return

    if (packageSuccessTimerRef.current) {
      window.clearTimeout(packageSuccessTimerRef.current)
      packageSuccessTimerRef.current = null
    }

    setShowAddPackageModal(false)
    setPackageSubmitError(null)
    setPackageSubmitSuccess(null)
  }

  const handlePackageFieldChange = (field, value) => {
    setPackageForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handlePackageSubmit = async (event) => {
    event.preventDefault()

    if (!packageForm.kategori.trim() || !packageForm.nama_paket.trim() || String(packageForm.harga).trim() === '') {
      setPackageSubmitError('Kategori, nama paket, dan harga wajib diisi.')
      return
    }

    setIsSavingPackage(true)
    setPackageSubmitError(null)
    setPackageSubmitSuccess(null)

    try {
      const isEditMode = packageModalMode === 'edit' && editingPackagePid !== null

      await saveAdminPackage({
        kategori: packageForm.kategori.trim(),
        formasi: packageForm.formasi.trim(),
        jadwal: packageForm.jadwal.trim(),
        nama_paket: packageForm.nama_paket.trim(),
        tipe_paket: packageForm.tipe_paket === 'bundling' ? 'bundling' : 'tunggal',
        bundling_id: packageForm.tipe_paket === 'bundling' || !packageForm.bundling_id ? null : Number(packageForm.bundling_id),
        harga: Number(packageForm.harga),
        ket: packageForm.ket.trim(),
      }, { isEditMode, pid: editingPackagePid })

      setPackageSubmitSuccess(isEditMode ? 'Data paket berhasil diperbarui.' : 'Data paket berhasil disimpan.')
      setShowAddPackageModal(false)
      setEditingPackagePid(null)
      setPackageForm({
        kategori: 'CPNS',
        formasi: '',
        jadwal: '',
        nama_paket: '',
        tipe_paket: 'tunggal',
        bundling_id: '',
        harga: '',
        ket: '',
      })

      await loadPackages({ cancelled: () => false, showLoading: false })

      if (packageSuccessTimerRef.current) {
        window.clearTimeout(packageSuccessTimerRef.current)
      }

      packageSuccessTimerRef.current = window.setTimeout(() => {
        setPackageSubmitSuccess(null)
        packageSuccessTimerRef.current = null
      }, 2800)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Paket gagal disimpan.'
      setPackageSubmitError(message)
    } finally {
      setIsSavingPackage(false)
    }
  }

  const handleDeletePackage = async (row) => {
    if (!row?.pid) return

    const confirmed = window.confirm(`Hapus paket ${row.name}? Paket akan disembunyikan dari daftar.`)
    if (!confirmed) return

    setPackageError(null)

    try {
      await deleteAdminPackage(row.pid)
      await loadPackages({ cancelled: () => false, showLoading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Paket gagal dihapus.'
      setPackageError(message)
    }
  }

  useEffect(() => {
    return () => {
      if (packageSuccessTimerRef.current) {
        window.clearTimeout(packageSuccessTimerRef.current)
      }
    }
  }, [])

  const visiblePackageRows = packageRows.filter((row) => {
    const search = packageSearch.trim().toLowerCase()
    if (selectedStatus !== 'Semua Status' && String(row.status || '').toLowerCase() !== selectedStatus.toLowerCase()) {
      return false
    }

    if (!search) return true

    return [row.name, row.program, row.type, row.price, row.status, row.desc]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search))
  })

  const totalPackagePages = Math.max(1, Math.ceil(visiblePackageRows.length / packagePageSize))
  const safePackageCurrentPage = Math.min(packageCurrentPage, totalPackagePages)
  const packageStartIndex = (safePackageCurrentPage - 1) * packagePageSize
  const packagePaginatedRows = visiblePackageRows.slice(packageStartIndex, packageStartIndex + packagePageSize)

  useEffect(() => {
    setPackageCurrentPage(1)
  }, [packageSearch, selectedProgram, selectedStatus, packagePageSize])

  useEffect(() => {
    if (packageCurrentPage > totalPackagePages) {
      setPackageCurrentPage(totalPackagePages)
    }
  }, [packageCurrentPage, totalPackagePages])

  const renderPackagePaginationPages = () => {
    if (totalPackagePages <= 1) return [1]

    const pages = new Set([1, totalPackagePages, safePackageCurrentPage])
    if (safePackageCurrentPage > 1) pages.add(safePackageCurrentPage - 1)
    if (safePackageCurrentPage < totalPackagePages) pages.add(safePackageCurrentPage + 1)

    return Array.from(pages).sort((a, b) => a - b)
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

  const handleExportPackages = () => {
    if (!visiblePackageRows.length) return

    const headers = ['Paket', 'Program', 'Tipe', 'Harga', 'Diskon', 'Harga Akhir', 'Status', 'Terjual']
    const escapeCsvValue = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const csvRows = visiblePackageRows.map((row) => [row.name, row.program, row.type, row.price, row.discount, row.finalPrice, row.status, row.sold]
      .map(escapeCsvValue)
      .join(','))
    const csvContent = [headers.map(escapeCsvValue).join(','), ...csvRows].join('\r\n')

    const blob = new Blob([String.fromCharCode(0xfeff), csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `data-paket-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="admin-dashboard-page admin-package-page">
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
                onClick={() => item.href !== '#' && navigate(item.href)}
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

        <main className="admin-main admin-package-main">
          <AdminTopbar
            title="Paket Belajar"
            searchPlaceholder="Cari paket..."
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

          <section className="admin-package-hero">
            <div>
              <h2>Paket Belajar</h2>
              <div className="admin-breadcrumb">
                Dashboard <span>›</span> Paket
              </div>
            </div>

            <div className="admin-package-actions">
              <button type="button" className="admin-outline-action" onClick={handleExportPackages} disabled={!visiblePackageRows.length}>⬇ Ekspor Data</button>
              <button type="button" className="admin-primary-action" onClick={openAddPackageModal}>＋ Tambah Paket</button>
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
            {packageError ? <div className="admin-user-message error">{packageError}</div> : null}
            {isLoadingPackages ? <div className="admin-user-message">Memuat data paket...</div> : null}

            <div className="admin-package-filters">
              <label className="admin-package-search">
                <span aria-hidden="true">⌕</span>
                <input type="search" placeholder="Cari paket..." value={packageSearch} onChange={(event) => setPackageSearch(event.target.value)} />
              </label>

              <div className="admin-package-filter-group">
                {packageFilters.map((filter) => (
                  <select
                    key={filter.key}
                    className="admin-package-select"
                    value={filter.value}
                    onChange={(event) => {
                      if (filter.key === 'program') {
                        setSelectedProgram(event.target.value)
                      } else {
                        setSelectedStatus(event.target.value)
                      }
                    }}
                  >
                    {filter.options.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                ))}

                <button type="button" className="admin-user-filter-button admin-package-filter-button">Filter</button>
                <label className="admin-page-size-control" aria-label="Jumlah data per halaman">
                  <select
                    className="admin-page-size-select"
                    value={packagePageSize}
                    onChange={(event) => setPackagePageSize(Number(event.target.value))}
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
                    setPackageSearch('')
                    setSelectedProgram('Semua Program')
                    setSelectedStatus('Semua Status')
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          </section>

          <section className="admin-card admin-package-table-card">
            {packageSubmitSuccess ? <div className="admin-package-banner success">{packageSubmitSuccess}</div> : null}
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
                  {packagePaginatedRows.map((row) => (
                    <tr key={row.pid}>
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
                          <button
                            type="button"
                            className="admin-row-action"
                            title="Lihat paket"
                            aria-label={`Lihat paket ${row.name}`}
                            onClick={() => {
                              void openPackageDetailModal(row)
                            }}
                          >
                            👁
                          </button>
                          <button
                            type="button"
                            className="admin-row-action admin-row-action-edit"
                            title="Edit paket"
                            aria-label={`Edit paket ${row.name}`}
                            onClick={() => {
                              void openEditPackageModal(row)
                            }}
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            className="admin-row-action danger"
                            title="Hapus paket"
                            aria-label={`Hapus paket ${row.name}`}
                            onClick={() => {
                              void handleDeletePackage(row)
                            }}
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-package-footer admin-user-footer">
              <p>Menampilkan {packagePaginatedRows.length} data dari {visiblePackageRows.length} paket</p>
              <div className="admin-pagination">
                <button type="button" className="admin-pagination-arrow" disabled={safePackageCurrentPage === 1} onClick={() => setPackageCurrentPage((current) => Math.max(1, current - 1))}>‹</button>
                {renderPackagePaginationPages().map((page, index, array) => {
                  const previousPage = array[index - 1]
                  const shouldShowDots = previousPage && page - previousPage > 1

                  return (
                    <span key={page}>
                      {shouldShowDots ? <span className="admin-pagination-dots">…</span> : null}
                      <button type="button" className={`admin-pagination-page${page === safePackageCurrentPage ? ' active' : ''}`} onClick={() => setPackageCurrentPage(page)}>{page}</button>
                    </span>
                  )
                })}
                <button type="button" className="admin-pagination-arrow" disabled={safePackageCurrentPage === totalPackagePages} onClick={() => setPackageCurrentPage((current) => Math.min(totalPackagePages, current + 1))}>›</button>
              </div>
            </div>
          </section>

          <AdminPackageDetailModal
            open={showPackageDetailModal}
            pkg={packageDetail}
            loading={isLoadingPackageDetail}
            error={packageDetailError}
            onCancel={closePackageDetailModal}
            onEdit={() => {
              closePackageDetailModal()
              void openEditPackageModal(packageDetail)
            }}
          />

          <AdminPackageFormModal
            open={showAddPackageModal}
            onCancel={closeAddPackageModal}
            onSubmit={handlePackageSubmit}
            form={packageForm}
            onFieldChange={handlePackageFieldChange}
            loading={isSavingPackage}
            error={packageSubmitError}
            title={packageModalMode === 'edit' ? 'Edit Paket' : 'Tambah Paket'}
            submitLabel={packageModalMode === 'edit' ? 'Perbarui Paket' : 'Simpan Paket'}
            helpText={packageModalMode === 'edit' ? 'Ubah data paket lalu simpan perubahan.' : 'Isi data paket sesuai kolom yang tersedia di tabel paket.'}
          />

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
