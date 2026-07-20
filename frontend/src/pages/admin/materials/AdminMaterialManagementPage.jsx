import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { deleteMaterial, fetchAdminMaterialDetail, fetchAdminMaterials, saveMaterial } from '../../../api/materialsApi'
import AdminBrandBlock from '../../../components/layout/AdminBrandBlock'
import AdminLogoutModal from '../../../components/layout/AdminLogoutModal'
import AdminQuestionMenu from '../../../components/layout/AdminQuestionMenu'
import AdminSystemMenu from '../../../components/layout/AdminSystemMenu'
import AdminTopbar from '../../../components/layout/AdminTopbar'
import AdminUserMenu from '../../../components/layout/AdminUserMenu'
import MaterialEmptyState from '../../../components/shared/MaterialEmptyState'
import { getFriendlyFetchError } from '../../../utils/fetchError'
import { clearAuthUser, readStoredAdminSidebarState, readStoredUser, storeAdminSidebarState } from '../../../utils/storage'
import AdminMaterialFormModal from './AdminMaterialFormModal'

function createMaterialFormFromDetail(detail = {}) {
  return {
    package_id: detail.package_id !== undefined && detail.package_id !== null ? String(detail.package_id) : '',
    judul: detail.judul ?? '',
    deskripsi: detail.deskripsi ?? '',
    sort_order: detail.sort_order !== undefined && detail.sort_order !== null ? String(detail.sort_order) : '0',
    is_published: Boolean(detail.status_key ? detail.status_key === 'published' : detail.is_published !== false),
    file: null,
    file_label: detail.original_name ?? '',
  }
}

export default function AdminMaterialManagementPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => readStoredAdminSidebarState())
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [materialRows, setMaterialRows] = useState([])
  const [materialPackages, setMaterialPackages] = useState([])
  const [materialSummary, setMaterialSummary] = useState({ total_materi: 0, materi_terbit: 0, materi_draft: 0 })
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true)
  const [materialError, setMaterialError] = useState(null)
  const [materialSearch, setMaterialSearch] = useState('')
  const [selectedMaterialPackage, setSelectedMaterialPackage] = useState('ALL')
  const [selectedMaterialStatus, setSelectedMaterialStatus] = useState('ALL')
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [materialModalMode, setMaterialModalMode] = useState('create')
  const [editingMaterialPid, setEditingMaterialPid] = useState(null)
  const [isSavingMaterial, setIsSavingMaterial] = useState(false)
  const [materialSubmitError, setMaterialSubmitError] = useState(null)
  const [materialSubmitSuccess, setMaterialSubmitSuccess] = useState(null)
  const [materialForm, setMaterialForm] = useState(() => createMaterialFormFromDetail())
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

  const materialSummaryCards = [
    { label: 'Total Materi', value: String(materialSummary.total_materi ?? 0), delta: 'Semua materi', accent: 'blue', icon: '📄' },
    { label: 'Terbit', value: String(materialSummary.materi_terbit ?? 0), delta: 'Siap diakses user', accent: 'green', icon: '✅' },
    { label: 'Draft', value: String(materialSummary.materi_draft ?? 0), delta: 'Belum dipublikasikan', accent: 'orange', icon: '📝' },
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
    storeAdminSidebarState(isSidebarCollapsed)
  }, [isSidebarCollapsed])

  useEffect(() => () => {
    if (materialSuccessTimerRef.current) window.clearTimeout(materialSuccessTimerRef.current)
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

  const handleMaterialFileChange = (event) => {
    const file = event.target.files?.[0] ?? null
    setMaterialForm((current) => ({
      ...current,
      file,
      file_label: file?.name || current.file_label || '',
    }))
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

  return (
    <div className="admin-dashboard-page admin-material-page">
      <div className={`admin-dashboard-shell${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <aside className={`admin-sidebar${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
          <AdminBrandBlock isCollapsed={isSidebarCollapsed} />

          <div className="admin-sidebar-group-label">Main</div>
          <nav className="admin-sidebar-nav" aria-label="Navigasi admin">
            {adminMainMenu.map((item) => (
              <button key={item.label} type="button" className={`admin-sidebar-item${currentPath === item.href ? ' active' : ''}`} onClick={() => item.href !== '#' && navigate(item.href)}>
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
              <button type="button" className="admin-outline-action">⬇ Ekspor Data</button>
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
                <input type="search" placeholder="Cari materi..." value={materialSearch} onChange={(event) => setMaterialSearch(event.target.value)} />
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

                <button type="button" className="admin-user-filter-button admin-package-filter-button">Filter</button>
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
                      <th>Ukuran</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
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
                        <td>{row.original_name}</td>
                        <td>{row.file_size_label}</td>
                        <td><span className={`admin-package-type-badge ${row.status_key === 'published' ? 'online' : 'tryout'}`}>{row.status}</span></td>
                        <td>
                          <div className="admin-table-actions">
                            <button type="button" className="admin-table-action" onClick={() => openEditMaterialModal(row)}>Edit</button>
                            <button type="button" className="admin-table-action danger" onClick={() => handleDeleteMaterial(row)}>Hapus</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
        </main>
      </div>

      <AdminMaterialFormModal
        open={showMaterialModal}
        onCancel={closeMaterialModal}
        onSubmit={handleMaterialSubmit}
        form={materialForm}
        packages={materialPackages}
        onFieldChange={handleMaterialFieldChange}
        onFileChange={handleMaterialFileChange}
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
    </div>
  )
}
