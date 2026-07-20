import { useEffect } from 'react'

export default function PackageInfoModal({ open, packageData, onCancel }) {
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

  if (!open || !packageData) return null

  const title = packageData.nama_paket || packageData.name || 'Keterangan Paket'
  const description = String(packageData.ket || packageData.desc || '').trim() || 'Belum ada keterangan.'

  return (
    <div className="package-info-backdrop" role="presentation" onClick={onCancel}>
      <div className="package-info-modal" role="dialog" aria-modal="true" aria-labelledby="packageInfoTitle" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="package-info-close" aria-label="Tutup keterangan paket" onClick={onCancel}>×</button>
        <div className="package-info-content">
          <div className="package-info-icon" aria-hidden="true">i</div>
          <div className="package-info-copy">
            <h3 id="packageInfoTitle">{title}</h3>
            <p className="package-info-text">{description}</p>
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
