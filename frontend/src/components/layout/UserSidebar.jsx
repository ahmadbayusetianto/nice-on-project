import { Fragment, useState } from 'react'
import { Link } from 'react-router-dom'
import niceonImage from '../../../../niceon.png'
import ComingSoonModal from './ComingSoonModal'
import './UserSidebar.css'

export default function UserSidebar({ currentPath, isCollapsed, onToggleCollapsed, navigate, user, displayName, onLogout }) {
  const [comingSoonLabel, setComingSoonLabel] = useState(null)

  const profileInitials = (displayName || 'US')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'US'

  const sidebarItems = [
    { label: 'Dashboard', href: '/dashboard-user' },
    { label: 'Materi', href: '/dashboard-user/materials' },
    { label: 'Tryout', href: '/dashboard-user/tryout' },
    { label: 'Jadwal', href: '#' },
    { label: 'Bantuan', href: '/dashboard-user/bantuan' },
  ]

  return (
    <Fragment>
      <aside className={`dashboard-sidebar dashboard-sidebar-v2${isCollapsed ? ' sidebar-collapsed' : ''}`}>
        <div className="dashboard-sidebar-brand-row">
          <div className="dashboard-brand-lockup">
            <Link to="/" className="dashboard-brand-link" aria-label="Beranda Nice On">
              <div className="dashboard-brand-logo-shell">
                <img src={niceonImage} alt="Nice On" className="dashboard-brand-logo" />
              </div>
            </Link>
          </div>

          <button
            type="button"
            className="dashboard-sidebar-collapse"
            aria-label={isCollapsed ? 'Tampilkan sidebar' : 'Sembunyikan sidebar'}
            onClick={onToggleCollapsed}
          >
            {isCollapsed ? '»' : '«'}
          </button>
        </div>

        <nav className="dashboard-nav" aria-label="Navigasi user">
          {sidebarItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`dashboard-nav-item${currentPath === item.href || (item.label === 'Tryout' && currentPath.startsWith('/dashboard-user/tryout')) ? ' active' : ''}`}
              onClick={() => (item.href === '#' ? setComingSoonLabel(item.label) : navigate(item.href, { state: { user } }))}
            >
              <span className="dashboard-nav-icon" aria-hidden="true">{item.label.slice(0, 1)}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="dashboard-sidebar-section-label">Akun</div>

        <div className="dashboard-account-card">
          <div className="dashboard-account-avatar">{profileInitials}</div>
          <div>
            <div className="dashboard-account-name">{displayName}</div>
            <div className="dashboard-account-meta">{user?.email ?? 'Belum tersedia'}</div>
          </div>
        </div>

        <button type="button" className="dashboard-upgrade-card" onClick={() => navigate('/dashboard-user/progress', { state: { user } })}>
          <strong>Tetap tingkatkan kemampuanmu!</strong>
          <p>Pantau tren skor, streak belajar, dan riwayat tryoutmu di halaman Progress.</p>
          <span className="dashboard-upgrade-cta">Lihat Progress</span>
        </button>

        <button type="button" className="dashboard-logout-button" onClick={onLogout} aria-label="Keluar Akun">
          <span aria-hidden="true">⎋</span>
          <span className="dashboard-button-label">Keluar Akun</span>
        </button>
      </aside>

      <ComingSoonModal open={Boolean(comingSoonLabel)} label={comingSoonLabel} onClose={() => setComingSoonLabel(null)} />
    </Fragment>
  )
}
