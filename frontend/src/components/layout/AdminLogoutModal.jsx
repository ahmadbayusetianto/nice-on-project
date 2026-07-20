export default function AdminLogoutModal({ open, onCancel, onConfirm, title = 'Keluar dari akun?', message = 'Pastikan semua pekerjaan sudah disimpan sebelum Anda logout.', confirmLabel = 'Ya, keluar' }) {
  if (!open) return null

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onCancel}>
      <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="adminLogoutTitle" onClick={(event) => event.stopPropagation()}>
        <div className="admin-modal-icon" aria-hidden="true">!</div>
        <h3 id="adminLogoutTitle">{title}</h3>
        <p>{message}</p>
        <div className="admin-modal-actions">
          <button type="button" className="admin-modal-button secondary" onClick={onCancel}>Batal</button>
          <button type="button" className="admin-modal-button primary" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
