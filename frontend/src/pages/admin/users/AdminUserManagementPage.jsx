import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import './AdminUserManagementPage.css'
import { fetchUserDetail, fetchUsers, saveUser, toggleUserRole } from '../../../api/adminUsersApi'
import AdminBrandBlock from '../../../components/layout/AdminBrandBlock'
import AdminLogoutModal from '../../../components/layout/AdminLogoutModal'
import AdminQuestionMenu from '../../../components/layout/AdminQuestionMenu'
import AdminSystemMenu from '../../../components/layout/AdminSystemMenu'
import AdminTopbar from '../../../components/layout/AdminTopbar'
import AdminUserMenu from '../../../components/layout/AdminUserMenu'
import { PAGE_SIZE_OPTIONS } from '../../../utils/format'
import { clearAuthUser, readStoredAdminSidebarState, readStoredUser, storeAdminSidebarState } from '../../../utils/storage'
import AdminUserDetailModal from './AdminUserDetailModal'
import AdminUserFormModal from './AdminUserFormModal'

function createUserFormFromDetail(detail = {}) {
  const nestedDetail = detail.detail ?? {}

  return {
    pid: detail.pid ?? null,
    email: detail.email ?? '',
    password: '',
    nama: nestedDetail.nama ?? detail.name ?? '',
    ttl: nestedDetail.ttl ?? '',
    gender: nestedDetail.gender ?? '',
    nohp: nestedDetail.nohp ?? detail.phone ?? '',
    alamat: nestedDetail.alamat ?? '',
    refference: nestedDetail.refference ?? '',
    reference_other: nestedDetail.reference_other ?? '',
    status: String(detail.status_key ?? (String(detail.status || '').toLowerCase() === 'aktif' ? 'active' : 'inactive')).toLowerCase() === 'inactive' ? 'inactive' : 'active',
    is_admin: Boolean(Number(detail.is_admin ?? (String(detail.role || '').toLowerCase() === 'admin' ? 1 : 0))),
  }
}

export default function AdminUserManagementPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => readStoredAdminSidebarState())
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [userRows, setUserRows] = useState([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [userError, setUserError] = useState(null)
  const [userSearch, setUserSearch] = useState('')
  const [selectedUserStatus, setSelectedUserStatus] = useState('Semua Status')
  const [selectedUserRole, setSelectedUserRole] = useState('Semua Peran')
  const [userSummary, setUserSummary] = useState({ total_user: 0, user_aktif: 0, user_nonaktif: 0, admin: 0 })
  const [userCurrentPage, setUserCurrentPage] = useState(1)
  const [userPageSize, setUserPageSize] = useState(10)
  const [showRoleToggleConfirm, setShowRoleToggleConfirm] = useState(false)
  const [roleToggleTarget, setRoleToggleTarget] = useState(null)
  const [isTogglingRole, setIsTogglingRole] = useState(false)
  const [roleToggleError, setRoleToggleError] = useState(null)
  const [showUserDetailModal, setShowUserDetailModal] = useState(false)
  const [userDetail, setUserDetail] = useState(null)
  const [isLoadingUserDetail, setIsLoadingUserDetail] = useState(false)
  const [userDetailError, setUserDetailError] = useState(null)
  const [showUserFormModal, setShowUserFormModal] = useState(false)
  const [editingUserPid, setEditingUserPid] = useState(null)
  const [userForm, setUserForm] = useState(() => createUserFormFromDetail())
  const [isSavingUser, setIsSavingUser] = useState(false)
  const [userFormError, setUserFormError] = useState(null)
  const storedUser = readStoredUser()
  const user = location.state?.user ?? storedUser

  if (!user || Number(user?.is_admin ?? 0) !== 1) {
    return <Navigate to="/login" replace state={{ from: '/dashboard-admin/users' }} />
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

  const loadUsers = async ({ cancelled = () => false, showLoading = true } = {}) => {
    if (showLoading) {
      setIsLoadingUsers(true)
    }

    setUserError(null)

    try {
      const payload = await fetchUsers()

      if (!cancelled()) {
        setUserRows(Array.isArray(payload.data) ? payload.data : [])
        setUserSummary(payload.summary ?? { total_user: 0, user_aktif: 0, user_nonaktif: 0, admin: 0 })
      }
    } catch (error) {
      if (!cancelled()) {
        setUserError(error instanceof Error ? error.message : 'Data user gagal dimuat.')
      }
    } finally {
      if (showLoading && !cancelled()) {
        setIsLoadingUsers(false)
      }
    }
  }

  useEffect(() => {
    let cancelled = false

    void loadUsers()

    return () => {
      cancelled = true
    }
  }, [])

  const visibleUserRows = userRows.filter((row) => {
    const normalizedSearch = userSearch.trim().toLowerCase()
    const matchesSearch = !normalizedSearch || [row.name, row.email, row.phone, row.role, row.status, row.code]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch))

    const matchesStatus = selectedUserStatus === 'Semua Status' || String(row.status || '').toLowerCase() === selectedUserStatus.toLowerCase()
    const matchesRole = selectedUserRole === 'Semua Peran' || String(row.role || '').toLowerCase() === selectedUserRole.toLowerCase()

    return matchesSearch && matchesStatus && matchesRole
  })

  const totalUserPages = Math.max(1, Math.ceil(visibleUserRows.length / userPageSize))
  const safeUserCurrentPage = Math.min(userCurrentPage, totalUserPages)
  const userStartIndex = (safeUserCurrentPage - 1) * userPageSize
  const userPaginatedRows = visibleUserRows.slice(userStartIndex, userStartIndex + userPageSize)

  useEffect(() => {
    setUserCurrentPage(1)
  }, [userSearch, userPageSize, selectedUserStatus, selectedUserRole])

  useEffect(() => {
    if (userCurrentPage > totalUserPages) {
      setUserCurrentPage(totalUserPages)
    }
  }, [userCurrentPage, totalUserPages])

  const renderUserPaginationPages = () => {
    if (totalUserPages <= 1) return [1]

    const pages = new Set([1, totalUserPages, safeUserCurrentPage])
    if (safeUserCurrentPage > 1) pages.add(safeUserCurrentPage - 1)
    if (safeUserCurrentPage < totalUserPages) pages.add(safeUserCurrentPage + 1)

    return Array.from(pages).sort((a, b) => a - b)
  }

  const userSummaryCards = [
    { label: 'Total User', value: String(userSummary.total_user ?? userRows.length), delta: 'Data dari tbl_user', accent: 'blue', icon: '👥' },
    { label: 'User Aktif', value: String(userSummary.user_aktif ?? 0), delta: 'Status aktif', accent: 'green', icon: '✅' },
    { label: 'User Nonaktif', value: String(userSummary.user_nonaktif ?? 0), delta: 'Status nonaktif', accent: 'orange', icon: '👤' },
    { label: 'Admin', value: String(userSummary.admin ?? 0), delta: 'Role admin', accent: 'purple', icon: '🛡️' },
  ]

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    clearAuthUser()

    navigate('/login', { replace: true })
  }

  const openRoleToggleConfirm = (row) => {
    if (!row || Number(row.pid) === Number(user?.pid)) return

    setRoleToggleError(null)
    setRoleToggleTarget(row)
    setShowRoleToggleConfirm(true)
  }

  const confirmRoleToggle = async () => {
    if (!roleToggleTarget) return

    setIsTogglingRole(true)
    setRoleToggleError(null)

    try {
      const payload = await toggleUserRole(roleToggleTarget.pid)
      const updatedRow = payload.data ?? null

      if (updatedRow) {
        setUserRows((currentRows) => currentRows.map((row) => (row.pid === updatedRow.pid ? { ...row, ...updatedRow } : row)))
        setUserSummary((currentSummary) => ({
          ...currentSummary,
          admin: updatedRow.role === 'Admin'
            ? Number(currentSummary.admin ?? 0) + 1
            : Math.max(0, Number(currentSummary.admin ?? 0) - 1),
        }))
      }

      setShowRoleToggleConfirm(false)
      setRoleToggleTarget(null)
    } catch (error) {
      setRoleToggleError(error instanceof Error ? error.message : 'Peran user gagal diperbarui.')
    } finally {
      setIsTogglingRole(false)
    }
  }

  const openUserDetailModal = async (row) => {
    if (!row?.pid) return

    setShowUserDetailModal(true)
    setUserDetail({ ...row })
    setUserDetailError(null)
    setIsLoadingUserDetail(true)

    try {
      const payload = await fetchUserDetail(row.pid)
      setUserDetail(payload.data ?? null)
    } catch (error) {
      setUserDetailError(error instanceof Error ? error.message : 'Detail user gagal dimuat.')
    } finally {
      setIsLoadingUserDetail(false)
    }
  }

  const openEditUserModal = async (row) => {
    if (!row?.pid) return

    setEditingUserPid(row.pid)
    setUserFormError(null)
    setIsSavingUser(false)
    setShowUserFormModal(true)
    setUserForm(createUserFormFromDetail(row))

    try {
      const payload = await fetchUserDetail(row.pid)
      setUserForm(createUserFormFromDetail(payload.data ?? row))
    } catch {
      // Keep edit modal usable with current row data.
    }
  }

  const closeUserDetailModal = () => {
    setShowUserDetailModal(false)
    setUserDetail(null)
    setUserDetailError(null)
  }

  const closeUserFormModal = () => {
    if (isSavingUser) return

    setShowUserFormModal(false)
    setEditingUserPid(null)
    setUserFormError(null)
  }

  const handleUserFieldChange = (field, value) => {
    setUserForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const openAddUserModal = () => {
    setEditingUserPid(null)
    setUserFormError(null)
    setIsSavingUser(false)
    setUserForm(createUserFormFromDetail())
    setShowUserFormModal(true)
  }

  const handleUserSubmit = async (event) => {
    event.preventDefault()

    const isCreateMode = !editingUserPid

    if (isCreateMode && String(userForm.password || '').length < 8) {
      setUserFormError('Password minimal 8 karakter.')
      return
    }

    setIsSavingUser(true)
    setUserFormError(null)

    try {
      const payloadBody = {
        email: String(userForm.email || '').trim(),
        status: userForm.status,
        is_admin: Boolean(userForm.is_admin),
        nama: String(userForm.nama || '').trim(),
        ttl: String(userForm.ttl || '').trim(),
        gender: userForm.gender,
        nohp: String(userForm.nohp || '').trim(),
        alamat: String(userForm.alamat || '').trim(),
        refference: String(userForm.refference || '').trim(),
        reference_other: String(userForm.reference_other || '').trim(),
      }

      if (isCreateMode) {
        payloadBody.password = String(userForm.password || '')
      }

      await saveUser(payloadBody, { isCreateMode, pid: editingUserPid })

      await loadUsers({ cancelled: () => false, showLoading: false })
      setShowUserFormModal(false)
      setEditingUserPid(null)
      setUserForm(createUserFormFromDetail())
    } catch (error) {
      setUserFormError(error instanceof Error ? error.message : 'User gagal disimpan.')
    } finally {
      setIsSavingUser(false)
    }
  }

  useEffect(() => {
    storeAdminSidebarState(isSidebarCollapsed)
  }, [isSidebarCollapsed])

  const handleExportUsers = () => {
    if (!visibleUserRows.length) return

    const headers = ['Kode', 'Nama', 'Email', 'No HP', 'Peran', 'Status', 'Bergabung']
    const escapeCsvValue = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const csvRows = visibleUserRows.map((row) => [row.code, row.name, row.email, row.phone, row.role, row.status, row.joined]
      .map(escapeCsvValue)
      .join(','))
    const csvContent = [headers.map(escapeCsvValue).join(','), ...csvRows].join('\r\n')

    const blob = new Blob([String.fromCharCode(0xfeff), csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `data-user-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="admin-dashboard-page admin-user-page">
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

        <main className="admin-main admin-user-main">
          <AdminTopbar
            title="Manajemen User"
            subtitle="Kelola data pengguna yang terdaftar dalam sistem."
            showTitle={false}
            searchPlaceholder="Cari user..."
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

          <section className="admin-package-hero admin-user-hero">
            <div>
              <h2>Manajemen User</h2>
              <div className="admin-breadcrumb">
                Dashboard <span>›</span> User
              </div>
            </div>

            <div className="admin-package-actions admin-user-actions">
              <button type="button" className="admin-outline-action" onClick={handleExportUsers} disabled={!visibleUserRows.length}>⬇ Export</button>
              <button type="button" className="admin-primary-action" onClick={openAddUserModal}>＋ Tambah User</button>
            </div>
          </section>

          <section className="admin-summary-grid admin-user-summary-grid">
            {userSummaryCards.map((card) => (
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

          <section className="admin-card admin-user-table-card">
            {userError ? <div className="admin-user-message error">{userError}</div> : null}
            {isLoadingUsers ? <div className="admin-user-message">Memuat data user...</div> : null}

            <div className="admin-user-filters">
              <label className="admin-user-search">
                <span aria-hidden="true">⌕</span>
                <input type="search" placeholder="Cari berdasarkan nama, email, atau no HP..." value={userSearch} onChange={(event) => setUserSearch(event.target.value)} />
              </label>

              <div className="admin-user-filter-group">
                <select
                  className="admin-user-filter-pill"
                  aria-label="Filter status user"
                  value={selectedUserStatus}
                  onChange={(event) => setSelectedUserStatus(event.target.value)}
                >
                  {['Semua Status', 'Aktif', 'Nonaktif'].map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <select
                  className="admin-user-filter-pill"
                  aria-label="Filter peran user"
                  value={selectedUserRole}
                  onChange={(event) => setSelectedUserRole(event.target.value)}
                >
                  {['Semua Peran', 'Admin', 'User'].map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="admin-user-filter-button"
                  onClick={() => { void loadUsers({ cancelled: () => false, showLoading: true }) }}
                  title="Muat ulang data user dari server dengan filter yang aktif"
                >
                  Filter
                </button>
                <label className="admin-page-size-control" aria-label="Jumlah data per halaman">
                  <select
                    className="admin-page-size-select"
                    value={userPageSize}
                    onChange={(event) => setUserPageSize(Number(event.target.value))}
                  >
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option} / halaman</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="admin-user-table-wrap">
                <table className="admin-user-table">
                  <thead>
                    <tr>
                      <th>User</th>
                    <th>Email</th>
                    <th>No HP</th>
                    <th>Peran</th>
                    <th>Status</th>
                    <th>Bergabung</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userPaginatedRows.length ? userPaginatedRows.map((row) => (
                      <tr key={row.pid}>
                        <td>
                          <div className="admin-user-cell">
                            <div className="admin-user-avatar">{row.name.slice(0, 1)}</div>
                            <div>
                              <strong>{row.name}</strong>
                              <span>{row.code}</span>
                            </div>
                          </div>
                        </td>
                        <td>{row.email}</td>
                        <td>{row.phone}</td>
                        <td><span className={`admin-role-badge ${row.role.toLowerCase()}`}>{row.role}</span></td>
                        <td><span className={`admin-status-pill ${row.status.toLowerCase()}`}>{row.status}</span></td>
                        <td>{row.joined}</td>
                        <td>
                          <div className="admin-row-actions">
                            <button type="button" className="admin-row-action" title="Lihat detail user" aria-label={`Lihat detail ${row.name}`} onClick={() => { void openUserDetailModal(row) }}>👁</button>
                            <button type="button" className="admin-row-action admin-row-action-edit" title="Edit user" aria-label={`Edit ${row.name}`} onClick={() => { void openEditUserModal(row) }}>✎</button>
                            <button
                              type="button"
                              className="admin-row-action admin-row-action-role"
                              title={Number(row.pid) === Number(user?.pid) ? 'Akun Anda' : row.role === 'Admin' ? 'Jadikan User' : 'Jadikan Admin'}
                              aria-label={Number(row.pid) === Number(user?.pid) ? `Akun Anda ${row.name}` : row.role === 'Admin' ? `Jadikan user ${row.name}` : `Jadikan admin ${row.name}`}
                              disabled={Number(row.pid) === Number(user?.pid)}
                              onClick={() => openRoleToggleConfirm(row)}
                            >
                              ↺<span>{row.role === 'Admin' ? 'User' : 'Admin'}</span>
                            </button>
                            <button type="button" className="admin-row-action danger">🗑</button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr className="admin-user-empty-row">
                        <td colSpan={7}>
                          <div className="admin-user-empty-state">
                            <div className="admin-user-empty-icon" aria-hidden="true">👤</div>
                            <div className="admin-user-empty-copy">
                              <strong>Belum ada data user</strong>
                              <p>Data user akan tampil di sini setelah ditambahkan atau dimuat dari server.</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            <div className="admin-user-footer">
              <p>Menampilkan {userPaginatedRows.length} data dari {visibleUserRows.length} user</p>
              <div className="admin-pagination">
                <button type="button" className="admin-pagination-arrow" disabled={safeUserCurrentPage === 1} onClick={() => setUserCurrentPage((current) => Math.max(1, current - 1))}>‹</button>
                {renderUserPaginationPages().map((page, index, array) => {
                  const previousPage = array[index - 1]
                  const shouldShowDots = previousPage && page - previousPage > 1

                  return (
                    <span key={page}>
                      {shouldShowDots ? <span className="admin-pagination-dots">…</span> : null}
                      <button type="button" className={`admin-pagination-page${page === safeUserCurrentPage ? ' active' : ''}`} onClick={() => setUserCurrentPage(page)}>{page}</button>
                    </span>
                  )
                })}
                <button type="button" className="admin-pagination-arrow" disabled={safeUserCurrentPage === totalUserPages} onClick={() => setUserCurrentPage((current) => Math.min(totalUserPages, current + 1))}>›</button>
              </div>
            </div>
          </section>

          <AdminLogoutModal
            open={showLogoutConfirm}
            onCancel={() => setShowLogoutConfirm(false)}
            onConfirm={confirmLogout}
          />

          <AdminLogoutModal
            open={showRoleToggleConfirm}
            onCancel={() => {
              setShowRoleToggleConfirm(false)
              setRoleToggleTarget(null)
              setRoleToggleError(null)
            }}
            onConfirm={confirmRoleToggle}
            title={roleToggleTarget ? `Ubah peran ${roleToggleTarget.name}?` : 'Ubah peran user?'}
            message={roleToggleError || (roleToggleTarget
              ? `Peran ${roleToggleTarget.name} akan diubah dari ${roleToggleTarget.role} menjadi ${roleToggleTarget.role === 'Admin' ? 'User' : 'Admin'}.`
              : 'Konfirmasi perubahan peran user.')}
            confirmLabel={isTogglingRole ? 'Memproses...' : 'Ya, ubah'}
          />

          <AdminUserDetailModal
            open={showUserDetailModal}
            user={userDetail}
            loading={isLoadingUserDetail}
            error={userDetailError}
            onCancel={closeUserDetailModal}
            onEdit={() => {
              if (userDetail?.pid) {
                void openEditUserModal(userDetail)
              }
            }}
          />

          <AdminUserFormModal
            open={showUserFormModal}
            mode={editingUserPid ? 'edit' : 'create'}
            title={editingUserPid ? 'Edit User' : 'Tambah User'}
            submitLabel={editingUserPid ? 'Simpan Perubahan' : 'Simpan User'}
            helpText={editingUserPid ? 'Perbarui data akun, status, peran, dan profil user.' : 'Isi data akun, status, peran, dan profil user baru.'}
            form={userForm}
            loading={isSavingUser}
            error={userFormError}
            onCancel={closeUserFormModal}
            onSubmit={handleUserSubmit}
            onFieldChange={handleUserFieldChange}
          />
        </main>
      </div>
    </div>
  )
}
