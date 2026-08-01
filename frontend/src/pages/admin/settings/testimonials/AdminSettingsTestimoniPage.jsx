import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { deleteTestimoni, fetchAdminTestimoniDetail, fetchAdminTestimonials, saveTestimoni, toggleTestimoniStatus } from '../../../../api/testimonialsApi'
import AdminBrandBlock from '../../../../components/layout/AdminBrandBlock'
import AdminLogoutModal from '../../../../components/layout/AdminLogoutModal'
import AdminQuestionMenu from '../../../../components/layout/AdminQuestionMenu'
import AdminSystemMenu from '../../../../components/layout/AdminSystemMenu'
import AdminTopbar from '../../../../components/layout/AdminTopbar'
import AdminUserMenu from '../../../../components/layout/AdminUserMenu'
import { getFriendlyFetchError } from '../../../../utils/fetchError'
import { PAGE_SIZE_OPTIONS } from '../../../../utils/format'
import { clearAuthUser, readStoredAdminSidebarState, readStoredUser, storeAdminSidebarState } from '../../../../utils/storage'
import AdminTestimoniFormModal from './AdminTestimoniFormModal'

function createTestimoniFormFromDetail(detail = {}) {
  return {
    nama: detail.nama ?? '',
    jabatan: detail.jabatan ?? '',
    isi: detail.isi ?? '',
    rating: detail.rating !== undefined && detail.rating !== null ? String(detail.rating) : '5',
    urutan: detail.urutan !== undefined && detail.urutan !== null ? String(detail.urutan) : '0',
    is_active: Boolean(detail.status_key ? detail.status_key === 'active' : detail.status !== 'Nonaktif'),
    foto: null,
    foto_preview: null,
    existing_foto_path: detail.foto ?? null,
    existing_foto_url: detail.foto_url ?? null,
  }
}

export default function AdminSettingsTestimoniPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => readStoredAdminSidebarState())
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [testimoniRows, setTestimoniRows] = useState([])
  const [isLoadingTestimonials, setIsLoadingTestimonials] = useState(true)
  const [testimoniError, setTestimoniError] = useState(null)
  const [testimoniSearch, setTestimoniSearch] = useState('')
  const [selectedTestimoniStatus, setSelectedTestimoniStatus] = useState('Semua Status')
  const [testimoniCurrentPage, setTestimoniCurrentPage] = useState(1)
  const [testimoniPageSize, setTestimoniPageSize] = useState(10)
  const [showTestimoniModal, setShowTestimoniModal] = useState(false)
  const [isSavingTestimoni, setIsSavingTestimoni] = useState(false)
  const [testimoniSubmitError, setTestimoniSubmitError] = useState(null)
  const [testimoniSubmitSuccess, setTestimoniSubmitSuccess] = useState(null)
  const [testimoniModalMode, setTestimoniModalMode] = useState('create')
  const [editingTestimoniPid, setEditingTestimoniPid] = useState(null)
  const [testimoniForm, setTestimoniForm] = useState(() => createTestimoniFormFromDetail())
  const [testimoniSummary, setTestimoniSummary] = useState({ total_testimoni: 0, testimoni_aktif: 0, testimoni_nonaktif: 0 })
  const testimoniSuccessTimerRef = useRef(null)
  const storedUser = readStoredUser()
  const user = location.state?.user ?? storedUser

  if (!user || Number(user?.is_admin ?? 0) !== 1) {
    return <Navigate to="/login" replace state={{ from: '/dashboard-admin/settings/testimonials' }} />
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

  const testimoniSummaryCards = [
    { label: 'Total Testimoni', value: String(testimoniSummary.total_testimoni ?? 0), delta: 'Semua testimoni', accent: 'blue', icon: '💬' },
    { label: 'Testimoni Aktif', value: String(testimoniSummary.testimoni_aktif ?? 0), delta: 'Tampil di landing page', accent: 'green', icon: '✅' },
    { label: 'Testimoni Nonaktif', value: String(testimoniSummary.testimoni_nonaktif ?? 0), delta: 'Disembunyikan sementara', accent: 'orange', icon: '⏸' },
  ]

  const loadTestimonials = async ({ cancelled = () => false, showLoading = true } = {}) => {
    if (showLoading) {
      setIsLoadingTestimonials(true)
    }

    setTestimoniError(null)

    try {
      const payload = await fetchAdminTestimonials({
        search: testimoniSearch.trim(),
        status: selectedTestimoniStatus,
      })

      if (!cancelled()) {
        setTestimoniRows(Array.isArray(payload?.data) ? payload.data : [])
        setTestimoniSummary(payload?.summary ?? { total_testimoni: 0, testimoni_aktif: 0, testimoni_nonaktif: 0 })
      }
    } catch (error) {
      if (!cancelled()) {
        const message = getFriendlyFetchError(error, 'Data testimoni gagal dimuat.')
        setTestimoniError(message.includes('<!DOCTYPE') ? 'Backend mengembalikan halaman HTML, periksa koneksi database/server.' : message)
      }
    } finally {
      if (showLoading && !cancelled()) {
        setIsLoadingTestimonials(false)
      }
    }
  }

  useEffect(() => {
    let cancelled = false

    void loadTestimonials({ cancelled: () => cancelled, showLoading: true })

    return () => {
      cancelled = true
    }
  }, [testimoniSearch, selectedTestimoniStatus])

  const openAddTestimoniModal = () => {
    if (testimoniSuccessTimerRef.current) {
      window.clearTimeout(testimoniSuccessTimerRef.current)
      testimoniSuccessTimerRef.current = null
    }

    setTestimoniModalMode('create')
    setEditingTestimoniPid(null)
    setTestimoniSubmitError(null)
    setTestimoniSubmitSuccess(null)
    setTestimoniForm(createTestimoniFormFromDetail({ urutan: testimoniRows.length + 1 }))
    setShowTestimoniModal(true)
  }

  const openEditTestimoniModal = async (row) => {
    if (testimoniSuccessTimerRef.current) {
      window.clearTimeout(testimoniSuccessTimerRef.current)
      testimoniSuccessTimerRef.current = null
    }

    setTestimoniModalMode('edit')
    setEditingTestimoniPid(row?.pid ?? null)
    setTestimoniSubmitError(null)
    setTestimoniSubmitSuccess(null)
    setShowTestimoniModal(true)
    setTestimoniForm(createTestimoniFormFromDetail(row ?? {}))

    try {
      const payload = await fetchAdminTestimoniDetail(row?.pid)
      setTestimoniForm(createTestimoniFormFromDetail(payload?.data ?? {}))
    } catch {
      // Keep the modal usable even if detail fetch fails.
    }
  }

  const closeTestimoniModal = () => {
    if (isSavingTestimoni) return

    if (testimoniSuccessTimerRef.current) {
      window.clearTimeout(testimoniSuccessTimerRef.current)
      testimoniSuccessTimerRef.current = null
    }

    setShowTestimoniModal(false)
    setTestimoniSubmitError(null)
    setTestimoniSubmitSuccess(null)
  }

  const handleTestimoniFieldChange = (field, value) => {
    setTestimoniForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleTestimoniSubmit = async (event) => {
    event.preventDefault()

    if (!testimoniForm.nama.trim() || !testimoniForm.isi.trim()) {
      setTestimoniSubmitError('Nama dan isi testimoni wajib diisi.')
      return
    }

    setIsSavingTestimoni(true)
    setTestimoniSubmitError(null)
    setTestimoniSubmitSuccess(null)

    try {
      const isEditMode = testimoniModalMode === 'edit' && editingTestimoniPid !== null
      const formData = new FormData()
      if (isEditMode) formData.append('_method', 'PUT')
      formData.append('nama', testimoniForm.nama.trim())
      formData.append('jabatan', testimoniForm.jabatan.trim())
      formData.append('isi', testimoniForm.isi.trim())
      formData.append('rating', String(Number(testimoniForm.rating) || 5))
      formData.append('urutan', String(Number(testimoniForm.urutan) || 0))
      formData.append('is_active', testimoniForm.is_active ? '1' : '0')

      if (testimoniForm.foto instanceof File) {
        formData.append('foto', testimoniForm.foto)
      } else if (testimoniForm.existing_foto_path) {
        formData.append('existing_foto_path', testimoniForm.existing_foto_path)
      }

      await saveTestimoni(formData, { isEditMode, pid: editingTestimoniPid })

      setTestimoniSubmitSuccess(isEditMode ? 'Testimoni berhasil diperbarui.' : 'Testimoni berhasil disimpan.')
      setShowTestimoniModal(false)
      setEditingTestimoniPid(null)
      setTestimoniForm(createTestimoniFormFromDetail())

      await loadTestimonials({ cancelled: () => false, showLoading: false })

      if (testimoniSuccessTimerRef.current) {
        window.clearTimeout(testimoniSuccessTimerRef.current)
      }

      testimoniSuccessTimerRef.current = window.setTimeout(() => {
        setTestimoniSubmitSuccess(null)
        testimoniSuccessTimerRef.current = null
      }, 2800)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Testimoni gagal disimpan.'
      setTestimoniSubmitError(message)
    } finally {
      setIsSavingTestimoni(false)
    }
  }

  const handleDeleteTestimoni = async (row) => {
    if (!window.confirm(`Hapus testimoni "${row?.nama || ''}"?`)) return

    try {
      await deleteTestimoni(row?.pid)
      await loadTestimonials({ cancelled: () => false, showLoading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Testimoni gagal dihapus.'
      setTestimoniError(message)
    }
  }

  const handleToggleTestimoniStatus = async (row) => {
    try {
      await toggleTestimoniStatus(row?.pid)
      await loadTestimonials({ cancelled: () => false, showLoading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Status testimoni gagal diperbarui.'
      setTestimoniError(message)
    }
  }

  useEffect(() => {
    return () => {
      if (testimoniSuccessTimerRef.current) {
        window.clearTimeout(testimoniSuccessTimerRef.current)
      }
    }
  }, [])

  const visibleTestimoniRows = testimoniRows
  const totalTestimoniPages = Math.max(1, Math.ceil(visibleTestimoniRows.length / testimoniPageSize))
  const safeTestimoniCurrentPage = Math.min(testimoniCurrentPage, totalTestimoniPages)
  const testimoniStartIndex = (safeTestimoniCurrentPage - 1) * testimoniPageSize
  const testimoniPaginatedRows = visibleTestimoniRows.slice(testimoniStartIndex, testimoniStartIndex + testimoniPageSize)

  useEffect(() => {
    setTestimoniCurrentPage(1)
  }, [testimoniSearch, selectedTestimoniStatus, testimoniPageSize])

  useEffect(() => {
    if (testimoniCurrentPage > totalTestimoniPages) {
      setTestimoniCurrentPage(totalTestimoniPages)
    }
  }, [testimoniCurrentPage, totalTestimoniPages])

  const renderTestimoniPaginationPages = () => {
    if (totalTestimoniPages <= 1) return [1]

    const pages = new Set([1, totalTestimoniPages, safeTestimoniCurrentPage])
    if (safeTestimoniCurrentPage > 1) pages.add(safeTestimoniCurrentPage - 1)
    if (safeTestimoniCurrentPage < totalTestimoniPages) pages.add(safeTestimoniCurrentPage + 1)

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
    <div className="admin-dashboard-page admin-faq-page">
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

        <main className="admin-main admin-faq-main">
          <AdminTopbar
            title="Testimoni"
            searchPlaceholder="Cari testimoni..."
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

          <section className="admin-hero-row admin-faq-hero">
            <div>
              <h2>Daftar Testimoni</h2>
              <div className="admin-breadcrumb">
                Dashboard <span>›</span> Pengaturan <span>›</span> Testimoni
              </div>
            </div>

            <div className="admin-package-actions admin-faq-actions">
              <button type="button" className="admin-primary-action" onClick={openAddTestimoniModal}>＋ Tambah Testimoni</button>
            </div>
          </section>

          <section className="admin-summary-grid admin-faq-summary-grid">
            {testimoniSummaryCards.map((card) => (
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

          <section className="admin-card admin-faq-filter-card">
            {testimoniError ? <div className="admin-user-message error">{testimoniError}</div> : null}
            {isLoadingTestimonials ? <div className="admin-user-message">Memuat data testimoni...</div> : null}

            <div className="admin-package-filters admin-faq-filters">
              <label className="admin-package-search">
                <span aria-hidden="true">⌕</span>
                <input type="search" placeholder="Cari testimoni..." value={testimoniSearch} onChange={(event) => setTestimoniSearch(event.target.value)} />
              </label>

              <div className="admin-package-filter-group admin-faq-filter-group">
                <select className="admin-package-select" value={selectedTestimoniStatus} onChange={(event) => setSelectedTestimoniStatus(event.target.value)}>
                  {['Semua Status', 'Aktif', 'Nonaktif'].map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>

                <label className="admin-page-size-control" aria-label="Jumlah data per halaman">
                  <select
                    className="admin-page-size-select"
                    value={testimoniPageSize}
                    onChange={(event) => setTestimoniPageSize(Number(event.target.value))}
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
                    setTestimoniSearch('')
                    setSelectedTestimoniStatus('Semua Status')
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          </section>

          <section className="admin-card admin-faq-table-card">
            {testimoniSubmitSuccess ? <div className="admin-package-banner success">{testimoniSubmitSuccess}</div> : null}
            <div className="admin-user-table-wrap">
              <table className="admin-user-table admin-faq-table">
                <thead>
                  <tr>
                    <th>Testimoni</th>
                    <th>Rating</th>
                    <th>Urutan</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {testimoniPaginatedRows.map((row) => (
                    <tr key={row.pid}>
                      <td>
                        <div className="admin-user-cell admin-faq-cell">
                          {row.foto_url ? (
                            <img className="admin-user-avatar" src={row.foto_url} alt={row.nama} />
                          ) : (
                            <div className={`admin-user-avatar admin-parameter-avatar ${row.status_key === 'active' ? 'active' : 'inactive'}`}>{row.nama?.slice(0, 1)?.toUpperCase() || '?'}</div>
                          )}
                          <div>
                            <strong>{row.nama}</strong>
                            <span>{row.jabatan || '-'} · {String(row.isi || '-').slice(0, 80)}{String(row.isi || '').length > 80 ? '...' : ''}</span>
                          </div>
                        </div>
                      </td>
                      <td><span className="admin-parameter-category-pill">{'★'.repeat(row.rating || 0)}{'☆'.repeat(5 - (row.rating || 0))}</span></td>
                      <td><span className="admin-faq-order-pill">#{row.urutan}</span></td>
                      <td>
                        <button
                          type="button"
                          className={`admin-faq-status-toggle${row.status_key === 'active' ? ' active' : ''}`}
                          onClick={() => { void handleToggleTestimoniStatus(row) }}
                          aria-pressed={row.status_key === 'active'}
                          aria-label={`Ubah status testimoni ${row.nama}`}
                        >
                          <span className="admin-faq-status-track" aria-hidden="true">
                            <span className="admin-faq-status-thumb" />
                          </span>
                          <span>{row.status_key === 'active' ? 'Aktif' : 'Nonaktif'}</span>
                        </button>
                      </td>
                      <td>
                        <div className="admin-row-actions admin-package-row-actions">
                          <button
                            type="button"
                            className="admin-row-action admin-row-action-edit"
                            title="Edit testimoni"
                            aria-label={`Edit testimoni ${row.nama}`}
                            onClick={() => {
                              void openEditTestimoniModal(row)
                            }}
                          >
                            ✎
                          </button>
                          <button type="button" className="admin-row-action danger" title="Hapus testimoni" aria-label={`Hapus testimoni ${row.nama}`} onClick={() => { void handleDeleteTestimoni(row) }}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-package-footer admin-user-footer">
              <p>Menampilkan {testimoniPaginatedRows.length} data dari {visibleTestimoniRows.length} testimoni</p>
              <div className="admin-pagination">
                <button type="button" className="admin-pagination-arrow" disabled={safeTestimoniCurrentPage === 1} onClick={() => setTestimoniCurrentPage((current) => Math.max(1, current - 1))}>‹</button>
                {renderTestimoniPaginationPages().map((page, index, array) => {
                  const previousPage = array[index - 1]
                  const shouldShowDots = previousPage && page - previousPage > 1

                  return (
                    <span key={page}>
                      {shouldShowDots ? <span className="admin-pagination-dots">…</span> : null}
                      <button type="button" className={`admin-pagination-page${page === safeTestimoniCurrentPage ? ' active' : ''}`} onClick={() => setTestimoniCurrentPage(page)}>{page}</button>
                    </span>
                  )
                })}
                <button type="button" className="admin-pagination-arrow" disabled={safeTestimoniCurrentPage === totalTestimoniPages} onClick={() => setTestimoniCurrentPage((current) => Math.min(totalTestimoniPages, current + 1))}>›</button>
              </div>
            </div>
          </section>

          <AdminTestimoniFormModal
            open={showTestimoniModal}
            onCancel={closeTestimoniModal}
            onSubmit={handleTestimoniSubmit}
            form={testimoniForm}
            onFieldChange={handleTestimoniFieldChange}
            loading={isSavingTestimoni}
            error={testimoniSubmitError}
            title={testimoniModalMode === 'edit' ? 'Edit Testimoni' : 'Tambah Testimoni'}
            submitLabel={testimoniModalMode === 'edit' ? 'Perbarui Testimoni' : 'Simpan Testimoni'}
            helpText={testimoniModalMode === 'edit' ? 'Ubah data testimoni lalu simpan perubahan.' : 'Isi data testimoni untuk ditampilkan di landing page.'}
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
