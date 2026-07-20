import { useEffect } from 'react'

export default function MaintenanceModal({ open, onCancel }) {
  useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="package-info-backdrop" role="presentation" onClick={onCancel}>
      <div className="package-info-modal maintenance-modal" role="dialog" aria-modal="true" aria-labelledby="maintenanceTitle" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="package-info-close" aria-label="Tutup informasi" onClick={onCancel}>×</button>
        <div className="package-info-content maintenance-modal-content">
          <div className="package-info-icon maintenance-icon" aria-hidden="true">🛠️</div>
          <div className="package-info-copy">
            <h3 id="maintenanceTitle">Under maintenance</h3>
            <p className="package-info-text">Fitur ini sedang dalam perbaikan. Silakan coba lagi nanti.</p>
          </div>
        </div>
        <div className="package-info-footer">
          <button type="button" className="package-info-action" onClick={onCancel}>
            <span>Tutup</span>
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>
    </div>
  )
}
