import './AdminUserMenu.css'

export default function AdminUserMenu({ profileUser, displayName, onResumeProfile, onLogout }) {
  const profileInitials = (displayName || 'AD')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'AD'

  return (
    <div className="admin-user-menu-wrap">
      <div className="admin-sidebar-group-label">Akun</div>
      <div className="admin-sidebar-footer-card admin-user-menu-card">
        <div className="admin-sidebar-user">
          <div className="admin-sidebar-avatar admin-sidebar-avatar-admin" aria-hidden="true">{profileInitials}</div>
          <div className="admin-sidebar-user-copy">
            <strong>{displayName || 'Admin'}</strong>
            <span>{profileUser?.email || 'Akun admin'}</span>
            <span className="admin-sidebar-user-status">
              <span className="admin-sidebar-user-status-dot" aria-hidden="true" />
              Online
            </span>
          </div>
        </div>

        <button type="button" className="admin-sidebar-logout" onClick={onLogout}>
          <span aria-hidden="true">⎋</span>
          <span>Keluar Akun</span>
        </button>
      </div>
    </div>
  )
}
