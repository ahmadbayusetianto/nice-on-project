export default function PurchaseBlockedModal({ open, onClose }) {
  if (!open) return null

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="purchaseBlockedTitle" onClick={(event) => event.stopPropagation()}>
        <div className="admin-modal-icon" aria-hidden="true">!</div>
        <h3 id="purchaseBlockedTitle">Khusus Akun User</h3>
        <p>Akun admin tidak dapat membeli paket. Gunakan akun user untuk membeli paket ini.</p>
        <div className="admin-modal-actions">
          <button type="button" className="admin-modal-button primary" onClick={onClose}>Mengerti</button>
        </div>
      </div>
    </div>
  )
}
