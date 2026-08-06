import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { BACKEND_URL } from '../../../api/client'
import { deleteMaterial, fetchAdminMaterialDetail, fetchAdminMaterials, saveMaterial } from '../../../api/materialsApi'
import { fetchParameters } from '../../../api/parametersApi'
import AdminBrandBlock from '../../../components/layout/AdminBrandBlock'
import ComingSoonModal from '../../../components/layout/ComingSoonModal'
import AdminLogoutModal from '../../../components/layout/AdminLogoutModal'
import AdminQuestionMenu from '../../../components/layout/AdminQuestionMenu'
import AdminSystemMenu from '../../../components/layout/AdminSystemMenu'
import AdminTopbar from '../../../components/layout/AdminTopbar'
import AdminUserMenu from '../../../components/layout/AdminUserMenu'
import MaterialEmptyState from '../../../components/shared/MaterialEmptyState'
import { getFriendlyFetchError } from '../../../utils/fetchError'
import { formatAdminDate, formatFileSize, PAGE_SIZE_OPTIONS } from '../../../utils/format'
import { clearAuthUser, readStoredAdminSidebarState, readStoredUser, storeAdminSidebarState } from '../../../utils/storage'
import AdminMaterialFormModal from './AdminMaterialFormModal'
import './AdminMaterialManagementPage.css'

function createMaterialFormFromDetail(detail = {}) {
  return {
    package_id: detail.package_id !== undefined && detail.package_id !== null ? String(detail.package_id) : '',
    judul: detail.judul ?? '',
    deskripsi: detail.deskripsi ?? '',
    sort_order: detail.sort_order !== undefined && detail.sort_order !== null ? String(detail.sort_order) : '0',
    is_published: Boolean(detail.status_key ? detail.status_key === 'published' : detail.is_published !== false),
    file: null,
    original_file_label: detail.original_name ?? '',
    original_file_size_label: detail.file_size_label ?? '',
  }
}

export default function AdminMaterialManagementPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => readStoredAdminSidebarState())
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [comingSoonLabel, setComingSoonLabel] = useState(null)
  const [materialRows, setMaterialRows] = useState([])
  const [materialPackages, setMaterialPackages] = useState([])
  const [materialSummary, setMaterialSummary] = useState({ total_materi: 0, materi_terbit: 0, materi_draft: 0 })
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true)
  const [materialError, setMaterialError] = useState(null)
  const [materialSearch, setMaterialSearch] = useState('')
  const [selectedMaterialPackage, setSelectedMaterialPackage] = useState('ALL')
  const [selectedMaterialStatus, setSelectedMaterialStatus] = useState('ALL')
  const [materialCurrentPage, setMaterialCurrentPage] = useState(1)
  const [materialPageSize, setMaterialPageSize] = useState(PAGE_SIZE_OPTIONS[0])
  const materialSearchInputRef = useRef(null)
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [materialModalMode, setMaterialModalMode] = useState('create')
  const [editingMaterialPid, setEditingMaterialPid] = useState(null)
  const [isSavingMaterial, setIsSavingMaterial] = useState(false)
  const [materialSubmitError, setMaterialSubmitError] = useState(null)
  const [materialSubmitSuccess, setMaterialSubmitSuccess] = useState(null)
  const [materialForm, setMaterialForm] = useState(() => createMaterialFormFromDetail())
  const [maxUploadSizeMb, setMaxUploadSizeMb] = useState(5)
  const materialSuccessTimerRef = useRef(null)
  const storedUser = readStoredUser()
  const user = location.state?.user ?? storedUser

  if (!user || Number(user?.is_admin ?? 0) !== 1) {
    return <Navigate to="/login" replace state={{ from: '/dashboard-admin/materials' }} />
  }

  const currentPath = location.pathname
  const displayName = user?.email?.split('@')?.[0] || 'Admin'
  const currentDateLabel = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date()).replace(/^./, (char) => char.toUpperCase())

  const adminMainMenu = [
    { label: 'Dashboard', href: '/dashboard-admin' },
    { label: 'User', href: '/dashboard-admin/users' },
    { label: 'Paket', href: '/dashboard-admin/packages' },
    { label: 'Materi', href: '/dashboard-admin/materials' },
    { label: 'Transaksi', href: '/dashboard-admin/transactions' },
    { label: 'Konten', href: '#' },
    { label: 'Laporan', href: '#' },
  ]

  const totalMaterialSizeBytes = materialRows.reduce((sum, row) => sum + (Number(row.file_size) || 0), 0)

  const materialSummaryCards = [
    { label: 'Total Materi', value: String(materialSummary.total_materi ?? 0), delta: 'Semua materi', accent: 'blue', icon: '📄' },
    { label: 'Terbit', value: String(materialSummary.materi_terbit ?? 0), delta: 'Siap diakses user', accent: 'green', icon: '✅' },
    { label: 'Draft', value: String(materialSummary.materi_draft ?? 0), delta: 'Belum dipublikasikan', accent: 'orange', icon: '📝' },
    { label: 'Total Ukuran', value: formatFileSize(totalMaterialSizeBytes), delta: `Dari ${materialRows.length} file`, accent: 'purple', icon: '💾' },
  ]

  const loadMaterials = async ({ cancelled = () => false, showLoading = true } = {}) => {
    if (showLoading) setIsLoadingMaterials(true)
    setMaterialError(null)

    try {
      const payload = await fetchAdminMaterials({
        search: materialSearch.trim(),
        packageId: selectedMaterialPackage,
        status: selectedMaterialStatus,
      })

      if (!cancelled()) {
        setMaterialRows(Array.isArray(payload?.data) ? payload.data : [])
        setMaterialPackages(Array.isArray(payload?.packages) ? payload.packages : [])
        setMaterialSummary(payload?.summary ?? { total_materi: 0, materi_terbit: 0, materi_draft: 0 })
      }
    } catch (error) {
      if (!cancelled()) {
        const message = getFriendlyFetchError(error, 'Data materi gagal dimuat.')
        setMaterialError(message.includes('<!DOCTYPE') ? 'Backend mengembalikan halaman HTML, periksa koneksi database/server.' : message)
      }
    } finally {
      if (showLoading && !cancelled()) setIsLoadingMaterials(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    void loadMaterials({ cancelled: () => cancelled, showLoading: true })
    return () => { cancelled = true }
  }, [materialSearch, selectedMaterialPackage, selectedMaterialStatus])

  useEffect(() => {
    setMaterialCurrentPage(1)
  }, [materialSearch, selectedMaterialPackage, selectedMaterialStatus, materialPageSize])

  useEffect(() => {
    storeAdminSidebarState(isSidebarCollapsed)
  }, [isSidebarCollapsed])

  useEffect(() => {
    let cancelled = false

    const loadMaxUploadSize = async () => {
      try {
        const payload = await fetchParameters({ search: 'system.max_upload_size' })
        const match = (payload?.data ?? []).find((item) => item.kode === 'system.max_upload_size')
        const value = Number(match?.nilai)

        if (!cancelled && Number.isFinite(value) && value > 0) {
          setMaxUploadSizeMb(value)
        }
      } catch {
        // Keep the default fallback if the parameter can't be loaded.
      }
    }

    void loadMaxUploadSize()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => () => {
    if (materialSuccessTimerRef.current) window.clearTimeout(materialSuccessTimerRef.current)
  }, [])

  useEffect(() => {
    const handleSearchShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        materialSearchInputRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleSearchShortcut)
    return () => document.removeEventListener('keydown', handleSearchShortcut)
  }, [])

  const openAddMaterialModal = () => {
    if (materialSuccessTimerRef.current) {
      window.clearTimeout(materialSuccessTimerRef.current)
      materialSuccessTimerRef.current = null
    }

    setMaterialModalMode('create')
    setEditingMaterialPid(null)
    setMaterialSubmitError(null)
    setMaterialSubmitSuccess(null)
    setMaterialForm(createMaterialFormFromDetail({ package_id: selectedMaterialPackage !== 'ALL' ? selectedMaterialPackage : '' }))
    setShowMaterialModal(true)
  }

  const openEditMaterialModal = async (row) => {
    if (materialSuccessTimerRef.current) {
      window.clearTimeout(materialSuccessTimerRef.current)
      materialSuccessTimerRef.current = null
    }

    setMaterialModalMode('edit')
    setEditingMaterialPid(row?.pid ?? null)
    setMaterialSubmitError(null)
    setMaterialSubmitSuccess(null)
    setShowMaterialModal(true)
    setMaterialForm(createMaterialFormFromDetail(row ?? {}))

    try {
      const payload = await fetchAdminMaterialDetail(row?.pid)
      setMaterialForm(createMaterialFormFromDetail(payload?.data ?? {}))
    } catch {
      // Keep modal usable even if detail fetch fails.
    }
  }

  const closeMaterialModal = () => {
    if (isSavingMaterial) return
    if (materialSuccessTimerRef.current) {
      window.clearTimeout(materialSuccessTimerRef.current)
      materialSuccessTimerRef.current = null
    }
    setShowMaterialModal(false)
    setMaterialSubmitError(null)
    setMaterialSubmitSuccess(null)
  }

  const handleMaterialFieldChange = (field, value) => {
    setMaterialForm((current) => ({ ...current, [field]: value }))
  }

  const handleMaterialFileChange = (file) => {
    if (file) {
      const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
      if (!isPdf) {
        setMaterialSubmitError('File harus berformat PDF.')
        return
      }

      if (file.size > maxUploadSizeMb * 1024 * 1024) {
        setMaterialSubmitError(`Ukuran file melebihi batas maksimal ${maxUploadSizeMb}MB.`)
        return
      }
    }

    setMaterialSubmitError(null)
    setMaterialForm((current) => ({ ...current, file }))
  }

  const handleMaterialSubmit = async (event) => {
    event.preventDefault()

    if (!materialForm.package_id || !materialForm.judul.trim()) {
      setMaterialSubmitError('Paket dan judul materi wajib diisi.')
      return
    }

    if (materialModalMode === 'create' && !materialForm.file) {
      setMaterialSubmitError('File PDF wajib diunggah.')
      return
    }

    setIsSavingMaterial(true)
    setMaterialSubmitError(null)
    setMaterialSubmitSuccess(null)

    try {
      const isEditMode = materialModalMode === 'edit' && editingMaterialPid !== null
      const formData = new FormData()
      if (isEditMode) {
        formData.append('_method', 'PUT')
      }
      formData.append('package_id', materialForm.package_id)
      formData.append('judul', materialForm.judul.trim())
      formData.append('deskripsi', materialForm.deskripsi.trim())
      formData.append('sort_order', String(materialForm.sort_order || 0))
      formData.append('is_published', materialForm.is_published ? '1' : '0')
      if (materialForm.file instanceof File) {
        formData.append('file', materialForm.file)
      }

      await saveMaterial(formData, { isEditMode, pid: editingMaterialPid })

      setMaterialSubmitSuccess(isEditMode ? 'Materi berhasil diperbarui.' : 'Materi berhasil diunggah.')
      setShowMaterialModal(false)
      setEditingMaterialPid(null)
      setMaterialForm(createMaterialFormFromDetail())

      await loadMaterials({ cancelled: () => false, showLoading: false })

      if (materialSuccessTimerRef.current) window.clearTimeout(materialSuccessTimerRef.current)
      materialSuccessTimerRef.current = window.setTimeout(() => {
        setMaterialSubmitSuccess(null)
        materialSuccessTimerRef.current = null
      }, 2800)
    } catch (error) {
      setMaterialSubmitError(error instanceof Error ? error.message : 'Materi gagal disimpan.')
    } finally {
      setIsSavingMaterial(false)
    }
  }

  const handleDeleteMaterial = async (row) => {
    if (!row?.pid) return
    if (!window.confirm(`Hapus materi ${row.judul}? File PDF akan dihapus dari penyimpanan.`)) return

    try {
      await deleteMaterial(row.pid)
      await loadMaterials({ cancelled: () => false, showLoading: false })
    } catch (error) {
      setMaterialError(error instanceof Error ? error.message : 'Materi gagal dihapus.')
    }
  }

  const handleLogout = () => setShowLogoutConfirm(true)
  const confirmLogout = () => { clearAuthUser(); navigate('/login', { replace: true }) }

  const filteredRows = materialRows
  const totalMaterialPages = Math.max(1, Math.ceil(filteredRows.length / materialPageSize))
  const safeMaterialCurrentPage = Math.min(materialCurrentPage, totalMaterialPages)
  const materialStartIndex = (safeMaterialCurrentPage - 1) * materialPageSize
  const materialPaginatedRows = filteredRows.slice(materialStartIndex, materialStartIndex + materialPageSize)

  const renderMaterialPaginationPages = () => {
    if (totalMaterialPages <= 1) return [1]

    const pages = new Set([1, totalMaterialPages, safeMaterialCurrentPage])
    if (safeMaterialCurrentPage > 1) pages.add(safeMaterialCurrentPage - 1)
    if (safeMaterialCurrentPage < totalMaterialPages) pages.add(safeMaterialCurrentPage + 1)

    return Array.from(pages).sort((a, b) => a - b)
  }

  useEffect(() => {
    if (materialCurrentPage > totalMaterialPages) {
      setMaterialCurrentPage(totalMaterialPages)
    }
  }, [materialCurrentPage, totalMaterialPages])

  const handleExportMaterials = () => {
    if (!filteredRows.length) return

    const headers = ['Materi', 'Paket', 'File', 'Ukuran', 'Tanggal Upload', 'Status']
    const escapeCsvValue = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const csvRows = filteredRows.map((row) => [
      row.judul,
      row.package_name,
      row.original_name,
      row.file_size_label,
      formatAdminDate(row.created_at),
      row.status,
    ]
      .map(escapeCsvValue)
      .join(','))
    const csvContent = [headers.map(escapeCsvValue).join(','), ...csvRows].join('\r\n')

    const blob = new Blob([String.fromCharCode(0xfeff), csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `data-materi-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="admin-dashboard-page admin-material-page">
      <div className={`admin-dashboard-shell${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <aside className={`admin-sidebar${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
          <AdminBrandBlock isCollapsed={isSidebarCollapsed} />

          <div className="admin-sidebar-group-label">Main</div>
          <nav className="admin-sidebar-nav" aria-label="Navigasi admin">
            {adminMainMenu.map((item) => (
              <button key={item.label} type="button" className={`admin-sidebar-item${currentPath === item.href ? ' active' : ''}`} onClick={() => (item.href === '#' ? setComingSoonLabel(item.label) : navigate(item.href))}>
                <span className="admin-sidebar-icon" aria-hidden="true">{item.label.slice(0, 1)}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <AdminQuestionMenu currentPath={currentPath} navigate={navigate} />
          <AdminSystemMenu currentPath={currentPath} navigate={navigate} />

          <AdminUserMenu profileUser={user} displayName={displayName} onResumeProfile={(activeUser) => navigate('/account-profile', { state: { user: activeUser } })} onLogout={handleLogout} />
        </aside>

        <main className="admin-main admin-material-main">
          <AdminTopbar
            title="Materi PDF"
            searchPlaceholder="Cari materi..."
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
              <h2>Materi PDF</h2>
              <div className="admin-breadcrumb">
                Dashboard <span>›</span> Materi
              </div>
            </div>

            <div className="admin-package-actions">
              <button type="button" className="admin-outline-action" onClick={handleExportMaterials} disabled={!filteredRows.length}>⬇ Ekspor Data</button>
              <button type="button" className="admin-primary-action" onClick={openAddMaterialModal}>＋ Upload Materi</button>
            </div>
          </section>

          <section className="admin-summary-grid admin-package-summary-grid">
            {materialSummaryCards.map((card) => (
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
            {materialError ? <div className="admin-user-message error">{materialError}</div> : null}
            {isLoadingMaterials ? <div className="admin-user-message">Memuat data materi...</div> : null}

            <div className="admin-package-filters">
              <label className="admin-package-search">
                <span aria-hidden="true">⌕</span>
                <input
                  ref={materialSearchInputRef}
                  type="search"
                  placeholder="Cari berdasarkan judul, paket, atau file..."
                  value={materialSearch}
                  onChange={(event) => setMaterialSearch(event.target.value)}
                />
                <kbd>⌘K</kbd>
              </label>

              <div className="admin-package-filter-group">
                <select className="admin-package-select" value={selectedMaterialPackage} onChange={(event) => setSelectedMaterialPackage(event.target.value)}>
                  <option value="ALL">Semua Paket</option>
                  {materialPackages.map((item) => (
                    <option key={item.pid} value={String(item.pid)}>{item.name}</option>
                  ))}
                </select>

                <select className="admin-package-select" value={selectedMaterialStatus} onChange={(event) => setSelectedMaterialStatus(event.target.value)}>
                  <option value="ALL">Semua Status</option>
                  <option value="PUBLISHED">Terbit</option>
                  <option value="DRAFT">Draft</option>
                </select>

                <label className="admin-page-size-control" aria-label="Jumlah data per halaman">
                  <select
                    className="admin-page-size-select"
                    value={materialPageSize}
                    onChange={(event) => setMaterialPageSize(Number(event.target.value))}
                  >
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option} / halaman</option>
                    ))}
                  </select>
                </label>

                <button type="button" className="admin-package-reset" onClick={() => { setMaterialSearch(''); setSelectedMaterialPackage('ALL'); setSelectedMaterialStatus('ALL') }}>Reset</button>
              </div>
            </div>
          </section>

          {filteredRows.length ? (
            <section className="admin-card admin-package-table-card">
              {materialSubmitSuccess ? <div className="admin-package-banner success">{materialSubmitSuccess}</div> : null}
              <div className="admin-package-table-wrap">
                <table className="admin-user-table admin-material-table">
                  <thead>
                    <tr>
                      <th>Materi</th>
                      <th>Paket</th>
                      <th>File</th>
                      <th>Tanggal</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialPaginatedRows.map((row) => (
                      <tr key={row.pid}>
                        <td>
                          <div className="admin-package-cell">
                            <div className="admin-package-thumb blue"><span>PDF</span></div>
                            <div className="admin-package-name">
                              <strong>{row.judul}</strong>
                              <span>{row.deskripsi || 'Tidak ada deskripsi'}</span>
                            </div>
                          </div>
                        </td>
                        <td>{row.package_name}</td>
                        <td>
                          <div className="admin-material-file-cell">
                            <strong>{row.original_name}</strong>
                            <span>{row.file_size_label} • PDF</span>
                          </div>
                        </td>
                        <td>{formatAdminDate(row.created_at)}</td>
                        <td>
                          <span className={`admin-package-type-badge ${row.status_key === 'published' ? 'online' : 'tryout'}`}>
                            {row.status_key === 'published' ? '✓ ' : ''}{row.status}
                          </span>
                        </td>
                        <td>
                          <div className="admin-row-actions">
                            <a
                              className="admin-row-action"
                              title="Lihat file"
                              aria-label={`Lihat file ${row.judul}`}
                              href={`${BACKEND_URL}/api/admin/materials/${row.pid}/download`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              👁
                            </a>
                            <button
                              type="button"
                              className="admin-row-action admin-row-action-edit"
                              title="Edit materi"
                              aria-label={`Edit materi ${row.judul}`}
                              onClick={() => openEditMaterialModal(row)}
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              className="admin-row-action danger"
                              title="Hapus materi"
                              aria-label={`Hapus materi ${row.judul}`}
                              onClick={() => handleDeleteMaterial(row)}
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
                <p>Menampilkan {materialPaginatedRows.length} data dari {filteredRows.length} materi</p>
                <div className="admin-pagination">
                  <button type="button" className="admin-pagination-arrow" disabled={safeMaterialCurrentPage === 1} onClick={() => setMaterialCurrentPage((current) => Math.max(1, current - 1))}>‹</button>
                  {renderMaterialPaginationPages().map((page, index, array) => {
                    const previousPage = array[index - 1]
                    const shouldShowDots = previousPage && page - previousPage > 1

                    return (
                      <span key={page}>
                        {shouldShowDots ? <span className="admin-pagination-dots">…</span> : null}
                        <button type="button" className={`admin-pagination-page${page === safeMaterialCurrentPage ? ' active' : ''}`} onClick={() => setMaterialCurrentPage(page)}>{page}</button>
                      </span>
                    )
                  })}
                  <button type="button" className="admin-pagination-arrow" disabled={safeMaterialCurrentPage === totalMaterialPages} onClick={() => setMaterialCurrentPage((current) => Math.min(totalMaterialPages, current + 1))}>›</button>
                </div>
              </div>
            </section>
          ) : (
            <section className="admin-card admin-material-empty-card">
              {materialSubmitSuccess ? <div className="admin-package-banner success">{materialSubmitSuccess}</div> : null}
              <MaterialEmptyState
                title="Belum ada materi PDF"
                description="Upload materi pertama untuk paket tertentu agar user bisa melihatnya setelah transaksi paid."
                actionLabel="Upload Materi"
                onAction={openAddMaterialModal}
                accent="blue"
              />
            </section>
          )}

          <section className="admin-material-info-strip">
            {[
              { icon: '👁', title: 'Preview file', desc: 'Lihat isi materi sebelum didownload.' },
              { icon: '🛡️', title: 'Upload aman', desc: `Hanya file PDF dengan ukuran maks. ${maxUploadSizeMb}MB.` },
              { icon: '✎', title: 'Kelola mudah', desc: 'Edit, hapus, atau ubah status materi dengan cepat.' },
              { icon: '🔒', title: 'Akses terkontrol', desc: 'Materi terbit akan langsung dapat diakses user.' },
            ].map((item) => (
              <div className="admin-material-info-item" key={item.title}>
                <span className="admin-material-info-icon" aria-hidden="true">{item.icon}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </section>
        </main>
      </div>

      <AdminMaterialFormModal
        open={showMaterialModal}
        mode={materialModalMode}
        onCancel={closeMaterialModal}
        onSubmit={handleMaterialSubmit}
        form={materialForm}
        packages={materialPackages}
        onFieldChange={handleMaterialFieldChange}
        onFileChange={handleMaterialFileChange}
        maxUploadSizeMb={maxUploadSizeMb}
        loading={isSavingMaterial}
        error={materialSubmitError}
        title={materialModalMode === 'edit' ? 'Edit Materi' : 'Upload Materi'}
        submitLabel={materialModalMode === 'edit' ? 'Perbarui Materi' : 'Simpan Materi'}
        helpText={materialModalMode === 'edit' ? 'Ubah metadata atau ganti file PDF materi.' : 'Unggah file PDF per paket untuk ditampilkan ke user.'}
      />

      <AdminLogoutModal
        open={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
      />

      <ComingSoonModal open={Boolean(comingSoonLabel)} label={comingSoonLabel} onClose={() => setComingSoonLabel(null)} />
    </div>
  )
}
