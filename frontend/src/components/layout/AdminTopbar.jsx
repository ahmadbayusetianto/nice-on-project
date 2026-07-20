import { useEffect, useRef, useState } from 'react'
import { fetchAdminNotifications, markAllNotificationsRead, markNotificationRead } from '../../api/notificationsApi'
import DashboardNotificationMenu from './DashboardNotificationMenu'

export default function AdminTopbar({
  title,
  subtitle,
  showTitle = true,
  showSubtitle = true,
  searchPlaceholder,
  currentDateLabel,
  displayName,
  profileRoleLabel = 'Super Admin',
  profileUser,
  onToggleSidebar,
  isSidebarCollapsed,
  showSearch = true,
  onHomeClick,
  onResumeProfile,
  onLogout,
  notificationItems = [],
  onNotificationItemClick,
}) {
  const profileMenuRef = useRef(null)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [notificationItemsState, setNotificationItemsState] = useState(null)

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false)
      }
    }

    window.addEventListener('mousedown', handleOutsideClick)
    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('mousedown', handleOutsideClick)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const adminUserId = Number(profileUser?.pid || 0)
    if (!adminUserId) {
      setNotificationItemsState([])
      return undefined
    }

    let cancelled = false

    const loadNotifications = async () => {
      try {
        const payload = await fetchAdminNotifications(adminUserId, 8)

        if (!cancelled) {
          const normalizedItems = Array.isArray(payload?.data)
            ? payload.data.map((item) => ({
                id: item.id,
                title: item.title || 'Notifikasi',
                description: item.message || '',
                time: item.created_at_human || '',
                icon: item.icon || '🔔',
                accent: item.type?.includes('tryout') ? 'green' : item.type?.includes('material') ? 'orange' : item.type?.includes('user') ? 'purple' : 'blue',
                href: item.url || '/dashboard-admin',
                read: Boolean(item.is_read),
              }))
            : []

          setNotificationItemsState(normalizedItems)
        }
      } catch {
        if (!cancelled) setNotificationItemsState([])
      }
    }

    void loadNotifications()
    const timer = window.setInterval(() => { void loadNotifications() }, 60000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [profileUser?.pid])

  const profileInitials = (displayName || 'AB')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'AB'

  const fallbackNotifications = [
    {
      id: 'admin-dashboard',
      title: 'Ringkasan admin',
      description: 'Lihat status platform dan aktivitas terbaru.',
      time: 'Baru',
      icon: '📊',
      accent: 'blue',
      href: '/dashboard-admin',
    },
    {
      id: 'admin-questions',
      title: 'Bank soal',
      description: 'Ada pembaruan pada data soal atau opsi.',
      time: '10 mnt',
      icon: '✎',
      accent: 'green',
      href: '/dashboard-admin/questions',
    },
    {
      id: 'admin-settings',
      title: 'Pengaturan sistem',
      description: 'Cek parameter dan FAQ yang baru diperbarui.',
      time: 'Hari ini',
      icon: '⚙️',
      accent: 'purple',
      href: '/dashboard-admin/settings/parameters',
    },
  ]

  const resolvedNotifications = notificationItemsState === null ? notificationItems : notificationItemsState

  const handleMarkNotificationRead = async (item) => {
    const adminUserId = Number(profileUser?.pid || 0)
    if (!adminUserId || !item?.id) return

    try {
      await markNotificationRead(adminUserId, item.id)
    } catch {
      // Keep local state; backend will retry on next refresh.
    }
  }

  const handleMarkAllNotificationsRead = async () => {
    const adminUserId = Number(profileUser?.pid || 0)
    if (!adminUserId) return

    try {
      await markAllNotificationsRead(adminUserId)
    } catch {
      // Keep local state; backend will retry on next refresh.
    }
  }

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-left">
        <button
          type="button"
          className="admin-menu-button"
          aria-label={isSidebarCollapsed ? 'Tampilkan menu' : 'Sembunyikan menu'}
          onClick={onToggleSidebar}
        >
          ☰
        </button>
        {showTitle ? (
          <div className="admin-topbar-title-copy">
            <h1>{title}</h1>
            {showSubtitle && subtitle ? <p className="admin-topbar-subtitle">{subtitle}</p> : null}
          </div>
        ) : null}
      </div>

      <div className="admin-topbar-right">
        <button type="button" className="admin-home-button" aria-label="Beranda" onClick={onHomeClick}>
          🏠
        </button>
        {showSearch ? (
          <label className="admin-search">
            <span aria-hidden="true">⌕</span>
            <input type="search" placeholder={searchPlaceholder} />
            <kbd>⌘K</kbd>
          </label>
        ) : null}

        <DashboardNotificationMenu
          items={resolvedNotifications}
          onItemClick={onNotificationItemClick}
          onMarkItemRead={handleMarkNotificationRead}
          onMarkAllRead={handleMarkAllNotificationsRead}
          ariaLabel="Notifikasi admin"
          className="admin-notification-menu-wrap"
          buttonClassName="admin-notification-button"
          badgeClassName="admin-notification-badge"
        />

        <button type="button" className="admin-date-chip">
          <span aria-hidden="true">📅</span>
          <span>{currentDateLabel}</span>
        </button>

        <div className="dashboard-profile-menu-wrap admin-profile-menu-wrap" ref={profileMenuRef}>
          <button
            type="button"
            className="dashboard-profile-chip admin-profile-chip"
            aria-haspopup="menu"
            aria-expanded={isProfileMenuOpen}
            onClick={() => setIsProfileMenuOpen((current) => !current)}
          >
            <span className="dashboard-profile-avatar admin-profile-avatar">{profileInitials}</span>
            <span className="dashboard-profile-copy admin-profile-copy">
              <strong>{displayName}</strong>
              <span>{profileRoleLabel}</span>
            </span>
            <span className="admin-profile-chip-chevron" aria-hidden="true">⌄</span>
          </button>

          {isProfileMenuOpen ? (
            <div className="dashboard-profile-dropdown" role="menu" aria-label="Menu akun admin">
              <button
                type="button"
                className="dashboard-profile-dropdown-item"
                role="menuitem"
                onClick={() => {
                  setIsProfileMenuOpen(false)
                  onResumeProfile?.(profileUser)
                }}
              >
                <span className="dashboard-profile-dropdown-label">Resume Profile</span>
              </button>
              <button
                type="button"
                className="dashboard-profile-dropdown-item danger"
                role="menuitem"
                onClick={() => {
                  setIsProfileMenuOpen(false)
                  onLogout?.()
                }}
              >
                <span className="dashboard-profile-dropdown-label">Logout</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
