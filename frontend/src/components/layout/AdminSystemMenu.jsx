import { useState } from 'react'

export default function AdminSystemMenu({ currentPath, navigate }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(() => currentPath.startsWith('/dashboard-admin/settings'))

  const settingsItems = [
    { label: 'Parameter', href: '/dashboard-admin/settings/parameters' },
    { label: 'FAQ', href: '/dashboard-admin/settings/faqs' },
    { label: 'Testimoni', href: '/dashboard-admin/settings/testimonials' },
    { label: 'Kategori', href: '#' },
    { label: 'Notifikasi', href: '#' },
  ]

  const systemItems = [
    { label: 'Admin', href: '#' },
    { label: 'Log Aktivitas', href: '#' },
  ]

  const isSettingsActive = currentPath.startsWith('/dashboard-admin/settings')

  return (
    <>
      <div className="admin-sidebar-group-label">System</div>
      <div className="admin-system-menu">
        <button
          type="button"
          className={`admin-system-parent${isSettingsOpen || isSettingsActive ? ' active' : ''}`}
          onClick={() => setIsSettingsOpen((current) => !current)}
          aria-expanded={isSettingsOpen}
        >
          <span className="admin-sidebar-icon" aria-hidden="true">P</span>
          <span>Pengaturan</span>
          <span className="admin-system-parent-indicator" aria-hidden="true">{isSettingsOpen ? '▴' : '▾'}</span>
        </button>

        {isSettingsOpen ? (
          <div className="admin-system-submenu" aria-label="Submenu pengaturan admin">
            {settingsItems.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`admin-system-subitem${currentPath === item.href ? ' active' : ''}`}
                onClick={() => item.href !== '#' && navigate(item.href)}
              >
                <span className="admin-system-subitem-icon" aria-hidden="true">•</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ) : null}

        <nav className="admin-sidebar-nav admin-system-nav" aria-label="Menu sistem admin">
          {systemItems.map((item) => (
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
      </div>
    </>
  )
}
