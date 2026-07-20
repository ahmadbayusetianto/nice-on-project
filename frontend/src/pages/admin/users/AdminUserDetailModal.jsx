import { formatAdminDate } from '../../../utils/format'
import { getUserInitials } from '../../../utils/icons'

export default function AdminUserDetailModal({ open, user, loading = false, error = null, onCancel, onEdit }) {
  if (!open) return null

  const detail = user?.detail ?? {}
  const joinedLabel = user?.joined || formatAdminDate(user?.created_at, { hour: false })
  const name = detail.nama || user?.name || '-'
  const isActive = String(user?.status || '').toLowerCase() === 'aktif'

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onCancel}>
      <div className="admin-modal admin-user-detail-modal" role="dialog" aria-modal="true" aria-labelledby="adminUserDetailTitle" onClick={(event) => event.stopPropagation()}>
        <div className="admin-question-detail-header">
          <div className="admin-question-detail-title-block">
            <div className="admin-user-detail-avatar-wrap">
              <div className="admin-user-detail-avatar">{getUserInitials(name)}</div>
              <span className={`admin-user-detail-avatar-dot${isActive ? ' active' : ' inactive'}`} aria-hidden="true" />
            </div>
            <div>
              <h3 id="adminUserDetailTitle">Detail User</h3>
              <p>Informasi akun dan profil user secara lengkap.</p>
            </div>
          </div>
          <div className="admin-question-detail-header-actions">
            <button type="button" className="admin-outline-action admin-question-detail-edit" onClick={onEdit}>✎ Edit User</button>
            <button type="button" className="admin-question-close" aria-label="Tutup detail user" onClick={onCancel}>×</button>
          </div>
        </div>

        {loading ? <div className="admin-package-form-loading">Memuat detail user...</div> : null}
        {error ? <div className="admin-package-form-error">{error}</div> : null}

        <div className="admin-user-detail-panel">
          <div className="admin-user-detail-panel-top">
            <div>
              <strong className="admin-user-detail-name">{name}</strong>
              <div className="admin-user-detail-email">
                <span aria-hidden="true">✉</span>
                {user?.email || '-'}
              </div>
            </div>
            <span className={`admin-user-detail-status-pill${isActive ? ' active' : ' inactive'}`}>
              <i aria-hidden="true" />
              {user?.status || '-'}
            </span>
          </div>

          <hr className="admin-user-detail-divider" />

          <div className="admin-user-detail-stats">
            {[
              { label: 'Peran', value: user?.role || (Number(user?.is_admin ?? 0) === 1 ? 'Admin' : 'User'), icon: '🛡️' },
              { label: 'Kode User', value: user?.code || '-', icon: '🆔' },
              { label: 'Bergabung', value: joinedLabel || '-', icon: '📅' },
            ].map((item) => (
              <div className="admin-user-detail-stat" key={item.label}>
                <span className="admin-user-detail-stat-icon" aria-hidden="true">{item.icon}</span>
                <div>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              </div>
            ))}
          </div>

          <hr className="admin-user-detail-divider" />

          <div className="admin-user-detail-inline-row">
            <div className="admin-user-detail-inline-item">
              <span className="admin-user-detail-inline-icon" aria-hidden="true">📞</span>
              <div>
                <span>No HP</span>
                <strong className="link">{detail.nohp || user?.phone || '-'}</strong>
              </div>
            </div>
            <div className="admin-user-detail-inline-item">
              <span className="admin-user-detail-inline-icon" aria-hidden="true">🧑</span>
              <div>
                <span>Jenis Kelamin</span>
                <strong>{detail.gender || '-'}</strong>
              </div>
            </div>
          </div>

          <hr className="admin-user-detail-divider" />

          <div className="admin-user-detail-inline-row single">
            <div className="admin-user-detail-inline-item">
              <span className="admin-user-detail-inline-icon" aria-hidden="true">📍</span>
              <div>
                <span>Alamat</span>
                <strong>{detail.alamat || '-'}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-user-detail-reference-grid">
          <div className="admin-user-detail-stat standalone">
            <span className="admin-user-detail-stat-icon" aria-hidden="true">🔖</span>
            <div>
              <span>Referensi</span>
              <strong>{detail.refference || '-'}</strong>
            </div>
          </div>
          <div className="admin-user-detail-stat standalone orange">
            <span className="admin-user-detail-stat-icon" aria-hidden="true">🔖</span>
            <div>
              <span>Referensi Lain</span>
              <strong>{detail.reference_other || '-'}</strong>
            </div>
          </div>
        </div>

        <div className="admin-modal-actions admin-user-detail-actions">
          <button type="button" className="admin-modal-button primary" onClick={onCancel}>Tutup</button>
        </div>
      </div>
    </div>
  )
}
