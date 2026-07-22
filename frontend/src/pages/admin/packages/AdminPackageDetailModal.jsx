import { formatAdminDate, formatCurrency } from '../../../utils/format'

export default function AdminPackageDetailModal({ open, pkg, loading = false, error = null, onCancel, onEdit }) {
  if (!open) return null

  const name = pkg?.nama_paket || pkg?.name || '-'
  const kategori = pkg?.kategori || pkg?.program || '-'
  const isBundling = (pkg?.tipe_paket || 'tunggal') === 'bundling'

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onCancel}>
      <div className="admin-modal admin-user-detail-modal" role="dialog" aria-modal="true" aria-labelledby="adminPackageDetailTitle" onClick={(event) => event.stopPropagation()}>
        <div className="admin-question-detail-header">
          <div className="admin-question-detail-title-block">
            <div>
              <h3 id="adminPackageDetailTitle">Detail Paket</h3>
              <p>Informasi lengkap paket belajar.</p>
            </div>
          </div>
          <div className="admin-question-detail-header-actions">
            <button type="button" className="admin-outline-action admin-question-detail-edit" onClick={onEdit}>✎ Edit Paket</button>
            <button type="button" className="admin-question-close" aria-label="Tutup detail paket" onClick={onCancel}>×</button>
          </div>
        </div>

        {loading ? <div className="admin-package-form-loading">Memuat detail paket...</div> : null}
        {error ? <div className="admin-package-form-error">{error}</div> : null}

        <div className="admin-user-detail-panel">
          <div className="admin-user-detail-panel-top">
            <div>
              <strong className="admin-user-detail-name">{name}</strong>
              <div className="admin-user-detail-email">
                <span aria-hidden="true">🏷️</span>
                {kategori}
              </div>
            </div>
            <span className={`admin-package-type-badge ${isBundling ? 'online' : 'tryout'}`}>{isBundling ? 'Bundling' : 'Tunggal'}</span>
          </div>

          <hr className="admin-user-detail-divider" />

          <div className="admin-user-detail-stats">
            {[
              { label: 'Harga', value: formatCurrency(pkg?.harga ?? 0), icon: '💰' },
              { label: 'Formasi', value: pkg?.formasi || '-', icon: '🗂️' },
              { label: 'Jadwal', value: pkg?.jadwal || '-', icon: '📅' },
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

          {pkg?.bundling_nama ? (
            <>
              <div className="admin-user-detail-inline-row single">
                <div className="admin-user-detail-inline-item">
                  <span className="admin-user-detail-inline-icon" aria-hidden="true">📦</span>
                  <div>
                    <span>Bagian dari Bundling</span>
                    <strong>{pkg.bundling_nama}</strong>
                  </div>
                </div>
              </div>

              <hr className="admin-user-detail-divider" />
            </>
          ) : null}

          <div className="admin-user-detail-inline-row single">
            <div className="admin-user-detail-inline-item">
              <span className="admin-user-detail-inline-icon" aria-hidden="true">📝</span>
              <div>
                <span>Keterangan</span>
                <strong>{pkg?.ket || '-'}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-user-detail-reference-grid">
          <div className="admin-user-detail-stat standalone">
            <span className="admin-user-detail-stat-icon" aria-hidden="true">🕒</span>
            <div>
              <span>Dibuat pada</span>
              <strong>{formatAdminDate(pkg?.created_at, { hour: false })}</strong>
            </div>
          </div>
          <div className="admin-user-detail-stat standalone orange">
            <span className="admin-user-detail-stat-icon" aria-hidden="true">🕒</span>
            <div>
              <span>Terakhir diperbarui</span>
              <strong>{pkg?.updated_at ? formatAdminDate(pkg.updated_at, { hour: false }) : '-'}</strong>
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
