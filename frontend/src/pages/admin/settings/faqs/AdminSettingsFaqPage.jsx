import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { deleteFaq, fetchAdminFaqDetail, fetchAdminFaqs, saveFaq, toggleFaqStatus } from '../../../../api/faqsApi'
import AdminBrandBlock from '../../../../components/layout/AdminBrandBlock'
import ComingSoonModal from '../../../../components/layout/ComingSoonModal'
import AdminLogoutModal from '../../../../components/layout/AdminLogoutModal'
import AdminQuestionMenu from '../../../../components/layout/AdminQuestionMenu'
import AdminSystemMenu from '../../../../components/layout/AdminSystemMenu'
import AdminTopbar from '../../../../components/layout/AdminTopbar'
import AdminUserMenu from '../../../../components/layout/AdminUserMenu'
import { getFriendlyFetchError } from '../../../../utils/fetchError'
import { PAGE_SIZE_OPTIONS } from '../../../../utils/format'
import { clearAuthUser, readStoredAdminSidebarState, readStoredUser, storeAdminSidebarState } from '../../../../utils/storage'
import AdminFaqFormModal from './AdminFaqFormModal'

function createFaqFormFromDetail(detail = {}) {
  return {
    kategori: detail.kategori ?? 'Umum',
    pertanyaan: detail.pertanyaan ?? '',
    jawaban: detail.jawaban ?? '',
    ikon: detail.ikon ?? '❓',
    urutan: detail.urutan !== undefined && detail.urutan !== null ? String(detail.urutan) : '0',
    is_active: Boolean(detail.status_key ? detail.status_key === 'active' : detail.status !== 'Nonaktif'),
  }
}

export default function AdminSettingsFaqPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => readStoredAdminSidebarState())
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [comingSoonLabel, setComingSoonLabel] = useState(null)
  const [faqRows, setFaqRows] = useState([])
  const [faqCategories, setFaqCategories] = useState([])
  const [isLoadingFaqs, setIsLoadingFaqs] = useState(true)
  const [faqError, setFaqError] = useState(null)
  const [faqSearch, setFaqSearch] = useState('')
  const [selectedFaqCategory, setSelectedFaqCategory] = useState('Semua Kategori')
  const [selectedFaqStatus, setSelectedFaqStatus] = useState('Semua Status')
  const [faqCurrentPage, setFaqCurrentPage] = useState(1)
  const [faqPageSize, setFaqPageSize] = useState(10)
  const [showFaqModal, setShowFaqModal] = useState(false)
  const [isSavingFaq, setIsSavingFaq] = useState(false)
  const [faqSubmitError, setFaqSubmitError] = useState(null)
  const [faqSubmitSuccess, setFaqSubmitSuccess] = useState(null)
  const [faqModalMode, setFaqModalMode] = useState('create')
  const [editingFaqPid, setEditingFaqPid] = useState(null)
  const [faqForm, setFaqForm] = useState({
    kategori: 'Umum',
    pertanyaan: '',
    jawaban: '',
    ikon: '❓',
    urutan: '0',
    is_active: true,
  })
  const [faqSummary, setFaqSummary] = useState({ total_faq: 0, faq_aktif: 0, faq_nonaktif: 0 })
  const faqSuccessTimerRef = useRef(null)
  const storedUser = readStoredUser()
  const user = location.state?.user ?? storedUser

  if (!user || Number(user?.is_admin ?? 0) !== 1) {
    return <Navigate to="/login" replace state={{ from: '/dashboard-admin/settings/faqs' }} />
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

  const faqSummaryCards = [
    { label: 'Total FAQ', value: String(faqSummary.total_faq ?? 0), delta: 'Semua pertanyaan', accent: 'blue', icon: '❓' },
    { label: 'FAQ Aktif', value: String(faqSummary.faq_aktif ?? 0), delta: 'Tampil di landing page', accent: 'green', icon: '✅' },
    { label: 'FAQ Nonaktif', value: String(faqSummary.faq_nonaktif ?? 0), delta: 'Disembunyikan sementara', accent: 'orange', icon: '⏸' },
    { label: 'Kategori', value: String(Math.max(0, faqCategories.length - 1)), delta: 'Filter kategori', accent: 'purple', icon: '🗂' },
  ]

  const loadFaqs = async ({ cancelled = () => false, showLoading = true } = {}) => {
    if (showLoading) {
      setIsLoadingFaqs(true)
    }

    setFaqError(null)

    try {
      const payload = await fetchAdminFaqs({
        search: faqSearch.trim(),
        category: selectedFaqCategory,
        status: selectedFaqStatus,
      })

      if (!cancelled()) {
        setFaqRows(Array.isArray(payload?.data) ? payload.data : [])
        setFaqSummary(payload?.summary ?? { total_faq: 0, faq_aktif: 0, faq_nonaktif: 0 })
        setFaqCategories(['Semua Kategori', ...(Array.isArray(payload?.categories) ? payload.categories : [])])
      }
    } catch (error) {
      if (!cancelled()) {
        const message = getFriendlyFetchError(error, 'Data FAQ gagal dimuat.')
        setFaqError(message.includes('<!DOCTYPE') ? 'Backend mengembalikan halaman HTML, periksa koneksi database/server.' : message)
      }
    } finally {
      if (showLoading && !cancelled()) {
        setIsLoadingFaqs(false)
      }
    }
  }

  useEffect(() => {
    let cancelled = false

    void loadFaqs({ cancelled: () => cancelled, showLoading: true })

    return () => {
      cancelled = true
    }
  }, [faqSearch, selectedFaqCategory, selectedFaqStatus])

  const openAddFaqModal = () => {
    if (faqSuccessTimerRef.current) {
      window.clearTimeout(faqSuccessTimerRef.current)
      faqSuccessTimerRef.current = null
    }

    setFaqModalMode('create')
    setEditingFaqPid(null)
    setFaqSubmitError(null)
    setFaqSubmitSuccess(null)
    setFaqForm({
      kategori: selectedFaqCategory !== 'Semua Kategori' ? selectedFaqCategory : 'Umum',
      pertanyaan: '',
      jawaban: '',
      ikon: '❓',
      urutan: String(faqRows.length + 1),
      is_active: true,
    })
    setShowFaqModal(true)
  }

  const openEditFaqModal = async (row) => {
    if (faqSuccessTimerRef.current) {
      window.clearTimeout(faqSuccessTimerRef.current)
      faqSuccessTimerRef.current = null
    }

    setFaqModalMode('edit')
    setEditingFaqPid(row?.pid ?? null)
    setFaqSubmitError(null)
    setFaqSubmitSuccess(null)
    setShowFaqModal(true)
    setFaqForm({
      kategori: row?.kategori || 'Umum',
      pertanyaan: row?.pertanyaan || '',
      jawaban: row?.jawaban || '',
      ikon: row?.ikon || '❓',
      urutan: String(row?.urutan ?? 0),
      is_active: (row?.status_key || 'active') === 'active',
    })

    try {
      const payload = await fetchAdminFaqDetail(row?.pid)
      setFaqForm(createFaqFormFromDetail(payload?.data ?? {}))
    } catch {
      // Keep the modal usable even if detail fetch fails.
    }
  }

  const closeFaqModal = () => {
    if (isSavingFaq) return

    if (faqSuccessTimerRef.current) {
      window.clearTimeout(faqSuccessTimerRef.current)
      faqSuccessTimerRef.current = null
    }

    setShowFaqModal(false)
    setFaqSubmitError(null)
    setFaqSubmitSuccess(null)
  }

  const handleFaqFieldChange = (field, value) => {
    setFaqForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleFaqSubmit = async (event) => {
    event.preventDefault()

    if (!faqForm.kategori.trim() || !faqForm.pertanyaan.trim() || !faqForm.jawaban.trim()) {
      setFaqSubmitError('Kategori, pertanyaan, dan jawaban wajib diisi.')
      return
    }

    setIsSavingFaq(true)
    setFaqSubmitError(null)
    setFaqSubmitSuccess(null)

    try {
      const isEditMode = faqModalMode === 'edit' && editingFaqPid !== null

      await saveFaq({
        kategori: faqForm.kategori.trim(),
        pertanyaan: faqForm.pertanyaan.trim(),
        jawaban: faqForm.jawaban.trim(),
        ikon: faqForm.ikon.trim(),
        urutan: Number(faqForm.urutan) || 0,
        is_active: Boolean(faqForm.is_active),
      }, { isEditMode, pid: editingFaqPid })

      setFaqSubmitSuccess(isEditMode ? 'FAQ berhasil diperbarui.' : 'FAQ berhasil disimpan.')
      setShowFaqModal(false)
      setEditingFaqPid(null)
      setFaqForm({
        kategori: 'Umum',
        pertanyaan: '',
        jawaban: '',
        ikon: '❓',
        urutan: '0',
        is_active: true,
      })

      await loadFaqs({ cancelled: () => false, showLoading: false })

      if (faqSuccessTimerRef.current) {
        window.clearTimeout(faqSuccessTimerRef.current)
      }

      faqSuccessTimerRef.current = window.setTimeout(() => {
        setFaqSubmitSuccess(null)
        faqSuccessTimerRef.current = null
      }, 2800)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'FAQ gagal disimpan.'
      setFaqSubmitError(message)
    } finally {
      setIsSavingFaq(false)
    }
  }

  const handleDeleteFaq = async (row) => {
    if (!window.confirm(`Hapus FAQ "${row?.pertanyaan || ''}"?`)) return

    try {
      await deleteFaq(row?.pid)
      await loadFaqs({ cancelled: () => false, showLoading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'FAQ gagal dihapus.'
      setFaqError(message)
    }
  }

  const handleToggleFaqStatus = async (row) => {
    try {
      await toggleFaqStatus(row?.pid)
      await loadFaqs({ cancelled: () => false, showLoading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Status FAQ gagal diperbarui.'
      setFaqError(message)
    }
  }

  useEffect(() => {
    return () => {
      if (faqSuccessTimerRef.current) {
        window.clearTimeout(faqSuccessTimerRef.current)
      }
    }
  }, [])

  const visibleFaqRows = faqRows
  const totalFaqPages = Math.max(1, Math.ceil(visibleFaqRows.length / faqPageSize))
  const safeFaqCurrentPage = Math.min(faqCurrentPage, totalFaqPages)
  const faqStartIndex = (safeFaqCurrentPage - 1) * faqPageSize
  const faqPaginatedRows = visibleFaqRows.slice(faqStartIndex, faqStartIndex + faqPageSize)

  useEffect(() => {
    setFaqCurrentPage(1)
  }, [faqSearch, selectedFaqCategory, selectedFaqStatus, faqPageSize])

  useEffect(() => {
    if (faqCurrentPage > totalFaqPages) {
      setFaqCurrentPage(totalFaqPages)
    }
  }, [faqCurrentPage, totalFaqPages])

  const renderFaqPaginationPages = () => {
    if (totalFaqPages <= 1) return [1]

    const pages = new Set([1, totalFaqPages, safeFaqCurrentPage])
    if (safeFaqCurrentPage > 1) pages.add(safeFaqCurrentPage - 1)
    if (safeFaqCurrentPage < totalFaqPages) pages.add(safeFaqCurrentPage + 1)

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

        <main className="admin-main admin-faq-main">
          <AdminTopbar
            title="FAQ"
            searchPlaceholder="Cari FAQ..."
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
              <h2>Daftar FAQ</h2>
              <div className="admin-breadcrumb">
                Dashboard <span>›</span> Pengaturan <span>›</span> FAQ
              </div>
            </div>

            <div className="admin-package-actions admin-faq-actions">
              <button type="button" className="admin-outline-action">⬇ Ekspor Data</button>
              <button type="button" className="admin-primary-action" onClick={openAddFaqModal}>＋ Tambah FAQ</button>
            </div>
          </section>

          <section className="admin-summary-grid admin-faq-summary-grid">
            {faqSummaryCards.map((card) => (
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
            {faqError ? <div className="admin-user-message error">{faqError}</div> : null}
            {isLoadingFaqs ? <div className="admin-user-message">Memuat data FAQ...</div> : null}

            <div className="admin-package-filters admin-faq-filters">
              <label className="admin-package-search">
                <span aria-hidden="true">⌕</span>
                <input type="search" placeholder="Cari FAQ..." value={faqSearch} onChange={(event) => setFaqSearch(event.target.value)} />
              </label>

              <div className="admin-package-filter-group admin-faq-filter-group">
                <select className="admin-package-select" value={selectedFaqCategory} onChange={(event) => setSelectedFaqCategory(event.target.value)}>
                  {(faqCategories.length ? faqCategories : ['Semua Kategori']).map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>

                <select className="admin-package-select" value={selectedFaqStatus} onChange={(event) => setSelectedFaqStatus(event.target.value)}>
                  {['Semua Status', 'Aktif', 'Nonaktif'].map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>

                <label className="admin-page-size-control" aria-label="Jumlah data per halaman">
                  <select
                    className="admin-page-size-select"
                    value={faqPageSize}
                    onChange={(event) => setFaqPageSize(Number(event.target.value))}
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
                    setFaqSearch('')
                    setSelectedFaqCategory('Semua Kategori')
                    setSelectedFaqStatus('Semua Status')
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          </section>

          <section className="admin-card admin-faq-table-card">
            {faqSubmitSuccess ? <div className="admin-package-banner success">{faqSubmitSuccess}</div> : null}
            <div className="admin-user-table-wrap">
              <table className="admin-user-table admin-faq-table">
                <thead>
                  <tr>
                    <th>FAQ</th>
                    <th>Kategori</th>
                    <th>Urutan</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {faqPaginatedRows.map((row) => (
                    <tr key={row.pid}>
                      <td>
                        <div className="admin-user-cell admin-faq-cell">
                          <div className={`admin-user-avatar admin-parameter-avatar ${row.status_key === 'active' ? 'active' : 'inactive'}`}>{row.ikon || '❓'}</div>
                          <div>
                            <strong>{row.pertanyaan}</strong>
                            <span>{String(row.jawaban || '-').slice(0, 120)}{String(row.jawaban || '').length > 120 ? '...' : ''}</span>
                          </div>
                        </div>
                      </td>
                      <td><span className="admin-parameter-category-pill">{row.kategori}</span></td>
                      <td><span className="admin-faq-order-pill">#{row.urutan}</span></td>
                      <td>
                        <button
                          type="button"
                          className={`admin-faq-status-toggle${row.status_key === 'active' ? ' active' : ''}`}
                          onClick={() => { void handleToggleFaqStatus(row) }}
                          aria-pressed={row.status_key === 'active'}
                          aria-label={`Ubah status FAQ ${row.pertanyaan}`}
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
                            title="Edit FAQ"
                            aria-label={`Edit FAQ ${row.pertanyaan}`}
                            onClick={() => {
                              void openEditFaqModal(row)
                            }}
                          >
                            ✎
                          </button>
                          <button type="button" className="admin-row-action danger" title="Hapus FAQ" aria-label={`Hapus FAQ ${row.pertanyaan}`} onClick={() => { void handleDeleteFaq(row) }}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-package-footer admin-user-footer">
              <p>Menampilkan {faqPaginatedRows.length} data dari {visibleFaqRows.length} FAQ</p>
              <div className="admin-pagination">
                <button type="button" className="admin-pagination-arrow" disabled={safeFaqCurrentPage === 1} onClick={() => setFaqCurrentPage((current) => Math.max(1, current - 1))}>‹</button>
                {renderFaqPaginationPages().map((page, index, array) => {
                  const previousPage = array[index - 1]
                  const shouldShowDots = previousPage && page - previousPage > 1

                  return (
                    <span key={page}>
                      {shouldShowDots ? <span className="admin-pagination-dots">…</span> : null}
                      <button type="button" className={`admin-pagination-page${page === safeFaqCurrentPage ? ' active' : ''}`} onClick={() => setFaqCurrentPage(page)}>{page}</button>
                    </span>
                  )
                })}
                <button type="button" className="admin-pagination-arrow" disabled={safeFaqCurrentPage === totalFaqPages} onClick={() => setFaqCurrentPage((current) => Math.min(totalFaqPages, current + 1))}>›</button>
              </div>
            </div>
          </section>

          <AdminFaqFormModal
            open={showFaqModal}
            onCancel={closeFaqModal}
            onSubmit={handleFaqSubmit}
            form={faqForm}
            onFieldChange={handleFaqFieldChange}
            loading={isSavingFaq}
            error={faqSubmitError}
            title={faqModalMode === 'edit' ? 'Edit FAQ' : 'Tambah FAQ'}
            submitLabel={faqModalMode === 'edit' ? 'Perbarui FAQ' : 'Simpan FAQ'}
            helpText={faqModalMode === 'edit' ? 'Ubah data FAQ lalu simpan perubahan.' : 'Isi pertanyaan dan jawaban FAQ untuk ditampilkan di landing page.'}
          />

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
