export default function ComingSoonModal({ open, label, onClose }) {
  if (!open) return null

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="comingSoonTitle" onClick={(event) => event.stopPropagation()}>
        <div className="admin-modal-icon" aria-hidden="true">🚧</div>
        <h3 id="comingSoonTitle">{label} Segera Hadir</h3>
        <p>Fitur ini sedang kami siapkan dan akan segera bisa digunakan. Terima kasih atas kesabarannya!</p>
        <div className="admin-modal-actions">
          <button type="button" className="admin-modal-button primary" onClick={onClose}>Oke, Mengerti</button>
        </div>
      </div>
    </div>
  )
}
