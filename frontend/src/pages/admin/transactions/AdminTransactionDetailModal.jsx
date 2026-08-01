export default function AdminTransactionDetailModal({ open, transaction, onCancel }) {
  if (!open) return null

  const row = transaction ?? {}

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onCancel}>
      <div className="admin-modal admin-user-detail-modal" role="dialog" aria-modal="true" aria-labelledby="adminTransactionDetailTitle" onClick={(event) => event.stopPropagation()}>
        <div className="admin-question-detail-header">
          <div className="admin-question-detail-title-block">
            <div>
              <h3 id="adminTransactionDetailTitle">Detail Transaksi</h3>
              <p>Informasi lengkap transaksi.</p>
            </div>
          </div>
          <div className="admin-question-detail-header-actions">
            <button type="button" className="admin-question-close" aria-label="Tutup detail transaksi" onClick={onCancel}>×</button>
          </div>
        </div>

        <div className="admin-user-detail-panel">
          <div className="admin-user-detail-panel-top">
            <div>
              <strong className="admin-user-detail-name">{row.invoice || '-'}</strong>
              <div className="admin-user-detail-email">
                <span aria-hidden="true">👤</span>
                {row.customerName || '-'}
              </div>
            </div>
            <span className={`admin-transaction-status ${row.statusClass || ''}`}>{row.status || '-'}</span>
          </div>

          <hr className="admin-user-detail-divider" />

          <div className="admin-user-detail-stats">
            {[
              { label: 'Total', value: row.totalLabel || '-', icon: '💳' },
              { label: 'Program', value: row.program || '-', icon: '🎯' },
              { label: 'Tipe Paket', value: row.packageType || '-', icon: '🗂️' },
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
              <span className="admin-user-detail-inline-icon" aria-hidden="true">📦</span>
              <div>
                <span>Paket</span>
                <strong>{row.packageName || '-'}</strong>
              </div>
            </div>
            <div className="admin-user-detail-inline-item">
              <span className="admin-user-detail-inline-icon" aria-hidden="true">📞</span>
              <div>
                <span>No. HP</span>
                <strong>{row.customerPhone || '-'}</strong>
              </div>
            </div>
          </div>

          <hr className="admin-user-detail-divider" />

          <div className="admin-user-detail-inline-row single">
            <div className="admin-user-detail-inline-item">
              <span className="admin-user-detail-inline-icon" aria-hidden="true">✉</span>
              <div>
                <span>Email</span>
                <strong>{row.customerEmail || '-'}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-user-detail-reference-grid">
          <div className="admin-user-detail-stat standalone">
            <span className="admin-user-detail-stat-icon" aria-hidden="true">🕒</span>
            <div>
              <span>Tanggal Transaksi</span>
              <strong>{row.transactionDate || '-'}</strong>
            </div>
          </div>
          <div className="admin-user-detail-stat standalone orange">
            <span className="admin-user-detail-stat-icon" aria-hidden="true">🕒</span>
            <div>
              <span>Tanggal Dibayar</span>
              <strong>{row.paidDate || '-'}</strong>
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
