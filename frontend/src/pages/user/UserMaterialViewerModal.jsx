export default function UserMaterialViewerModal({ open, material, src, onClose }) {
  if (!open || !material) return null

  return (
    <div className="admin-modal-backdrop user-material-viewer-backdrop" role="presentation" onClick={onClose}>
      <div className="admin-modal user-material-viewer-modal" role="dialog" aria-modal="true" aria-labelledby="userMaterialViewerTitle" onClick={(event) => event.stopPropagation()}>
        <div className="user-material-viewer-head">
          <div>
            <div className="dashboard-status-pill success">Materi PDF</div>
            <h3 id="userMaterialViewerTitle">{material.judul}</h3>
            <p>{material.package_name} · {material.file_size_label}</p>
          </div>
          <button type="button" className="admin-faq-close" aria-label="Tutup preview" onClick={onClose}>×</button>
        </div>
        <iframe title={material.judul} src={src} className="user-material-viewer-frame" />
      </div>
    </div>
  )
}
