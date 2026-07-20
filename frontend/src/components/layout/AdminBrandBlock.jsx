import { Link } from 'react-router-dom'
import niceonImage from '../../../../niceon.png'

export default function AdminBrandBlock({ isCollapsed }) {
  return (
    <div className="admin-brand-block">
      <Link to="/" className="admin-brand-link" aria-label="Beranda Nice On">
        <div className="admin-brand-logo-shell">
          <img src={niceonImage} alt="Nice On" className="admin-brand-logo" />
        </div>
        <div className={`admin-brand-copy${isCollapsed ? ' collapsed' : ''}`}>
          <strong>Admin Panel</strong>
          <span>Learning Hub</span>
        </div>
      </Link>
    </div>
  )
}
