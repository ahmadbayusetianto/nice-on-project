import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { fetchParameterDetail, fetchParameters, saveParameter } from '../../../../api/parametersApi'
import AdminBrandBlock from '../../../../components/layout/AdminBrandBlock'
import AdminLogoutModal from '../../../../components/layout/AdminLogoutModal'
import AdminQuestionMenu from '../../../../components/layout/AdminQuestionMenu'
import AdminSystemMenu from '../../../../components/layout/AdminSystemMenu'
import AdminTopbar from '../../../../components/layout/AdminTopbar'
import AdminUserMenu from '../../../../components/layout/AdminUserMenu'
import { getFriendlyFetchError } from '../../../../utils/fetchError'
import { formatParameterValue, PAGE_SIZE_OPTIONS } from '../../../../utils/format'
import { clearAuthUser, readStoredAdminSidebarState, readStoredUser, storeAdminSidebarState } from '../../../../utils/storage'
import AdminParameterFormModal from './AdminParameterFormModal'

function createParameterFormFromDetail(detail = {}) {
  return {
    kode: detail.kode ?? '',
    nama: detail.nama ?? '',
    kategori: detail.kategori ?? 'Aplikasi',
    nilai: detail.nilai ?? '',
    tipe: detail.tipe ?? 'text',
    deskripsi: detail.deskripsi ?? '',
    is_active: Boolean(detail.status_key ? detail.status_key === 'active' : detail.status !== 'Nonaktif'),
  }
}

export default function AdminSettingsParameterPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => readStoredAdminSidebarState())
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [parameterRows, setParameterRows] = useState([])
  const [parameterCategories, setParameterCategories] = useState([])
  const [isLoadingParameters, setIsLoadingParameters] = useState(true)
  const [parameterError, setParameterError] = useState(null)
  const [parameterSearch, setParameterSearch] = useState('')
  const [selectedParameterCategory, setSelectedParameterCategory] = useState('Semua Kategori')
  const [selectedParameterStatus, setSelectedParameterStatus] = useState('Semua Status')
  const [parameterCurrentPage, setParameterCurrentPage] = useState(1)
  const [parameterPageSize, setParameterPageSize] = useState(10)
  const [showParameterModal, setShowParameterModal] = useState(false)
  const [isSavingParameter, setIsSavingParameter] = useState(false)
  const [parameterSubmitError, setParameterSubmitError] = useState(null)
  const [parameterSubmitSuccess, setParameterSubmitSuccess] = useState(null)
  const [parameterModalMode, setParameterModalMode] = useState('create')
  const [editingParameterPid, setEditingParameterPid] = useState(null)
  const [parameterForm, setParameterForm] = useState({
    kode: '',
    nama: '',
    kategori: 'Aplikasi',
    nilai: '',
    tipe: 'text',
    deskripsi: '',
    is_active: true,
  })
  const [parameterSummary, setParameterSummary] = useState({ total_parameter: 0, parameter_aktif: 0, parameter_nonaktif: 0 })
  const parameterSuccessTimerRef = useRef(null)
  const storedUser = readStoredUser()
  const user = location.state?.user ?? storedUser

  if (!user || Number(user?.is_admin ?? 0) !== 1) {
    return <Navigate to="/login" replace state={{ from: '/dashboard-admin/settings/parameters' }} />
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

  const parameterSummaryCards = [
    { label: 'Total Parameter', value: String(parameterSummary.total_parameter ?? 0), delta: 'Semua parameter', accent: 'blue', icon: '⚙' },
    { label: 'Parameter Aktif', value: String(parameterSummary.parameter_aktif ?? 0), delta: 'Parameter yang dipakai sistem', accent: 'green', icon: '✅' },
    { label: 'Parameter Nonaktif', value: String(parameterSummary.parameter_nonaktif ?? 0), delta: 'Parameter sementara dimatikan', accent: 'orange', icon: '⏸' },
    { label: 'Kategori Tersedia', value: String(Math.max(0, parameterCategories.length - 1)), delta: 'Filter kategori', accent: 'purple', icon: '🗂' },
  ]

  const loadParameters = async ({ cancelled = () => false, showLoading = true } = {}) => {
    if (showLoading) {
      setIsLoadingParameters(true)
    }

    setParameterError(null)

    try {
      const payload = await fetchParameters({
        search: parameterSearch.trim(),
        category: selectedParameterCategory,
        status: selectedParameterStatus,
      })

      if (!cancelled()) {
        setParameterRows(Array.isArray(payload?.data) ? payload.data : [])
        setParameterSummary(payload?.summary ?? { total_parameter: 0, parameter_aktif: 0, parameter_nonaktif: 0 })
        setParameterCategories(['Semua Kategori', ...(Array.isArray(payload?.categories) ? payload.categories : [])])
      }
    } catch (error) {
      if (!cancelled()) {
        const message = getFriendlyFetchError(error, 'Data parameter gagal dimuat.')
        setParameterError(message.includes('<!DOCTYPE') ? 'Backend mengembalikan halaman HTML, periksa koneksi database/server.' : message)
      }
    } finally {
      if (showLoading && !cancelled()) {
        setIsLoadingParameters(false)
      }
    }
  }

  useEffect(() => {
    let cancelled = false

    void loadParameters({ cancelled: () => cancelled, showLoading: true })

    return () => {
      cancelled = true
    }
  }, [parameterSearch, selectedParameterCategory, selectedParameterStatus])

  const openAddParameterModal = () => {
    if (parameterSuccessTimerRef.current) {
      window.clearTimeout(parameterSuccessTimerRef.current)
      parameterSuccessTimerRef.current = null
    }

    setParameterModalMode('create')
    setEditingParameterPid(null)
    setParameterSubmitError(null)
    setParameterSubmitSuccess(null)
    setParameterForm({
      kode: '',
      nama: '',
      kategori: selectedParameterCategory !== 'Semua Kategori' ? selectedParameterCategory : 'Aplikasi',
      nilai: '',
      tipe: 'text',
      deskripsi: '',
      is_active: true,
    })
    setShowParameterModal(true)
  }

  const openEditParameterModal = async (row) => {
    if (parameterSuccessTimerRef.current) {
      window.clearTimeout(parameterSuccessTimerRef.current)
      parameterSuccessTimerRef.current = null
    }

    setParameterModalMode('edit')
    setEditingParameterPid(row?.pid ?? null)
    setParameterSubmitError(null)
    setParameterSubmitSuccess(null)
    setShowParameterModal(true)
    setParameterForm({
      kode: row?.kode || '',
      nama: row?.nama || '',
      kategori: row?.kategori || 'Aplikasi',
      nilai: row?.nilai || '',
      tipe: row?.tipe || 'text',
      deskripsi: row?.deskripsi || '',
      is_active: (row?.status_key || 'active') === 'active',
    })

    try {
      const payload = await fetchParameterDetail(row?.pid)
      setParameterForm(createParameterFormFromDetail(payload?.data ?? {}))
    } catch {
      // Keep the modal usable even if detail fetch fails.
    }
  }

  const closeParameterModal = () => {
    if (isSavingParameter) return

    if (parameterSuccessTimerRef.current) {
      window.clearTimeout(parameterSuccessTimerRef.current)
      parameterSuccessTimerRef.current = null
    }

    setShowParameterModal(false)
    setParameterSubmitError(null)
    setParameterSubmitSuccess(null)
  }

  const handleParameterFieldChange = (field, value) => {
    setParameterForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleParameterSubmit = async (event) => {
    event.preventDefault()

    if (!parameterForm.kode.trim() || !parameterForm.nama.trim() || !parameterForm.nilai.trim()) {
      setParameterSubmitError('Kode, nama, dan nilai wajib diisi.')
      return
    }

    setIsSavingParameter(true)
    setParameterSubmitError(null)
    setParameterSubmitSuccess(null)

    try {
      const isEditMode = parameterModalMode === 'edit' && editingParameterPid !== null

      await saveParameter({
        kode: parameterForm.kode.trim(),
        nama: parameterForm.nama.trim(),
        kategori: parameterForm.kategori.trim(),
        nilai: parameterForm.nilai.trim(),
        tipe: parameterForm.tipe,
        deskripsi: parameterForm.deskripsi.trim(),
        is_active: Boolean(parameterForm.is_active),
      }, { isEditMode, pid: editingParameterPid })

      setParameterSubmitSuccess(isEditMode ? 'Parameter berhasil diperbarui.' : 'Parameter berhasil disimpan.')
      setShowParameterModal(false)
      setEditingParameterPid(null)
      setParameterForm({
        kode: '',
        nama: '',
        kategori: 'Aplikasi',
        nilai: '',
        tipe: 'text',
        deskripsi: '',
        is_active: true,
      })

      await loadParameters({ cancelled: () => false, showLoading: false })

      if (parameterSuccessTimerRef.current) {
        window.clearTimeout(parameterSuccessTimerRef.current)
      }

      parameterSuccessTimerRef.current = window.setTimeout(() => {
        setParameterSubmitSuccess(null)
        parameterSuccessTimerRef.current = null
      }, 2800)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Parameter gagal disimpan.'
      setParameterSubmitError(message)
    } finally {
      setIsSavingParameter(false)
    }
  }

  useEffect(() => {
    return () => {
      if (parameterSuccessTimerRef.current) {
        window.clearTimeout(parameterSuccessTimerRef.current)
      }
    }
  }, [])

  const visibleParameterRows = parameterRows

  const totalParameterPages = Math.max(1, Math.ceil(visibleParameterRows.length / parameterPageSize))
  const safeParameterCurrentPage = Math.min(parameterCurrentPage, totalParameterPages)
  const parameterStartIndex = (safeParameterCurrentPage - 1) * parameterPageSize
  const parameterPaginatedRows = visibleParameterRows.slice(parameterStartIndex, parameterStartIndex + parameterPageSize)

  useEffect(() => {
    setParameterCurrentPage(1)
  }, [parameterSearch, selectedParameterCategory, selectedParameterStatus, parameterPageSize])

  useEffect(() => {
    if (parameterCurrentPage > totalParameterPages) {
      setParameterCurrentPage(totalParameterPages)
    }
  }, [parameterCurrentPage, totalParameterPages])

  const renderParameterPaginationPages = () => {
    if (totalParameterPages <= 1) return [1]

    const pages = new Set([1, totalParameterPages, safeParameterCurrentPage])
    if (safeParameterCurrentPage > 1) pages.add(safeParameterCurrentPage - 1)
    if (safeParameterCurrentPage < totalParameterPages) pages.add(safeParameterCurrentPage + 1)

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

  return (
    <div className="admin-dashboard-page admin-parameter-page">
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

        <main className="admin-main admin-parameter-main">
          <AdminTopbar
            title="Parameter"
            searchPlaceholder="Cari parameter..."
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

          <section className="admin-hero-row admin-parameter-hero">
            <div>
              <h2>Daftar Parameter</h2>
              <div className="admin-breadcrumb">
                Dashboard <span>›</span> Pengaturan <span>›</span> Parameter
              </div>
            </div>

            <div className="admin-package-actions admin-parameter-actions">
              <button type="button" className="admin-outline-action">⬇ Ekspor Data</button>
              <button type="button" className="admin-primary-action" onClick={openAddParameterModal}>＋ Tambah Parameter</button>
            </div>
          </section>

          <section className="admin-summary-grid admin-parameter-summary-grid">
            {parameterSummaryCards.map((card) => (
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

          <section className="admin-card admin-parameter-filter-card">
            {parameterError ? <div className="admin-user-message error">{parameterError}</div> : null}
            {isLoadingParameters ? <div className="admin-user-message">Memuat data parameter...</div> : null}

            <div className="admin-package-filters admin-parameter-filters">
              <label className="admin-package-search">
                <span aria-hidden="true">⌕</span>
                <input type="search" placeholder="Cari parameter..." value={parameterSearch} onChange={(event) => setParameterSearch(event.target.value)} />
              </label>

              <div className="admin-package-filter-group admin-parameter-filter-group">
                <select className="admin-package-select" value={selectedParameterCategory} onChange={(event) => setSelectedParameterCategory(event.target.value)}>
                  {(parameterCategories.length ? parameterCategories : ['Semua Kategori']).map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>

                <select className="admin-package-select" value={selectedParameterStatus} onChange={(event) => setSelectedParameterStatus(event.target.value)}>
                  {['Semua Status', 'Aktif', 'Nonaktif'].map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>

                <button type="button" className="admin-user-filter-button admin-package-filter-button">Filter</button>
                <label className="admin-page-size-control" aria-label="Jumlah data per halaman">
                  <select
                    className="admin-page-size-select"
                    value={parameterPageSize}
                    onChange={(event) => setParameterPageSize(Number(event.target.value))}
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
                    setParameterSearch('')
                    setSelectedParameterCategory('Semua Kategori')
                    setSelectedParameterStatus('Semua Status')
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          </section>

          <section className="admin-card admin-parameter-table-card">
            {parameterSubmitSuccess ? <div className="admin-package-banner success">{parameterSubmitSuccess}</div> : null}
            <div className="admin-user-table-wrap">
              <table className="admin-user-table admin-parameter-table">
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Kode</th>
                    <th>Kategori</th>
                    <th>Nilai</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {parameterPaginatedRows.map((row) => (
                    <tr key={row.pid}>
                      <td>
                        <div className="admin-user-cell admin-parameter-cell">
                          <div className={`admin-user-avatar admin-parameter-avatar ${row.status_key === 'active' ? 'active' : 'inactive'}`}>{row.nama.slice(0, 1)}</div>
                          <div>
                            <strong>{row.nama}</strong>
                            <span>{row.deskripsi || '-'}</span>
                          </div>
                        </div>
                      </td>
                      <td><code className="admin-parameter-code">{row.kode}</code></td>
                      <td><span className="admin-parameter-category-pill">{row.kategori}</span></td>
                      <td>{formatParameterValue(row)}</td>
                      <td><span className={`admin-status-pill ${row.status_key === 'active' ? 'success' : 'cancelled'}`}>{row.status}</span></td>
                      <td>
                        <div className="admin-row-actions admin-package-row-actions">
                          <button type="button" className="admin-row-action" title="Lihat parameter" aria-label={`Lihat parameter ${row.nama}`}>👁</button>
                          <button
                            type="button"
                            className="admin-row-action admin-row-action-edit"
                            title="Edit parameter"
                            aria-label={`Edit parameter ${row.nama}`}
                            onClick={() => {
                              void openEditParameterModal(row)
                            }}
                          >
                            ✎
                          </button>
                          <button type="button" className="admin-row-action danger" title="Hapus parameter" aria-label={`Hapus parameter ${row.nama}`}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-package-footer admin-user-footer">
              <p>Menampilkan {parameterPaginatedRows.length} data dari {visibleParameterRows.length} parameter</p>
              <div className="admin-pagination">
                <button type="button" className="admin-pagination-arrow" disabled={safeParameterCurrentPage === 1} onClick={() => setParameterCurrentPage((current) => Math.max(1, current - 1))}>‹</button>
                {renderParameterPaginationPages().map((page, index, array) => {
                  const previousPage = array[index - 1]
                  const shouldShowDots = previousPage && page - previousPage > 1

                  return (
                    <span key={page}>
                      {shouldShowDots ? <span className="admin-pagination-dots">…</span> : null}
                      <button type="button" className={`admin-pagination-page${page === safeParameterCurrentPage ? ' active' : ''}`} onClick={() => setParameterCurrentPage(page)}>{page}</button>
                    </span>
                  )
                })}
                <button type="button" className="admin-pagination-arrow" disabled={safeParameterCurrentPage === totalParameterPages} onClick={() => setParameterCurrentPage((current) => Math.min(totalParameterPages, current + 1))}>›</button>
              </div>
            </div>
          </section>

          <AdminParameterFormModal
            open={showParameterModal}
            onCancel={closeParameterModal}
            onSubmit={handleParameterSubmit}
            form={parameterForm}
            onFieldChange={handleParameterFieldChange}
            loading={isSavingParameter}
            error={parameterSubmitError}
            title={parameterModalMode === 'edit' ? 'Edit Parameter' : 'Tambah Parameter'}
            submitLabel={parameterModalMode === 'edit' ? 'Perbarui Parameter' : 'Simpan Parameter'}
            helpText={parameterModalMode === 'edit' ? 'Ubah data parameter lalu simpan perubahan.' : 'Isi parameter baru untuk pengaturan aplikasi.'}
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
