export default function AdminMaterialFormModal({ open, onCancel, onSubmit, form, packages, onFieldChange, onFileChange, loading, error, title = 'Upload Materi', submitLabel = 'Simpan Materi', helpText = 'Unggah PDF per paket dan atur status publikasi materi.' }) {
  if (!open) return null

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onCancel}>
      <div className="admin-modal admin-material-modal" role="dialog" aria-modal="true" aria-labelledby="adminMaterialTitle" onClick={(event) => event.stopPropagation()}>
        <div className="admin-modal-icon" aria-hidden="true">📄</div>
        <h3 id="adminMaterialTitle">{title}</h3>
        <p>{helpText}</p>

        <form className="admin-package-form admin-material-form" onSubmit={onSubmit}>
          {error ? <div className="admin-package-form-error">{error}</div> : null}

          <div className="admin-package-form-grid admin-material-form-grid">
            <label className="admin-package-field">
              <span>Paket</span>
              <select value={form.package_id} onChange={(event) => onFieldChange('package_id', event.target.value)} disabled={loading}>
                <option value="">Pilih paket</option>
                {packages.map((item) => (
                  <option key={item.pid} value={item.pid}>{item.name} ({item.kategori})</option>
                ))}
              </select>
            </label>

            <label className="admin-package-field">
              <span>Urutan</span>
              <input type="number" min="0" step="1" value={form.sort_order} onChange={(event) => onFieldChange('sort_order', event.target.value)} placeholder="0" disabled={loading} />
            </label>

            <label className="admin-package-field admin-package-field-full">
              <span>Judul Materi</span>
              <input type="text" value={form.judul} onChange={(event) => onFieldChange('judul', event.target.value)} placeholder="Contoh: Materi TWK Dasar" disabled={loading} />
            </label>

            <label className="admin-package-field admin-package-field-full">
              <span>Deskripsi</span>
              <textarea value={form.deskripsi} onChange={(event) => onFieldChange('deskripsi', event.target.value)} placeholder="Penjelasan singkat materi" disabled={loading}></textarea>
            </label>

            <label className="admin-package-field admin-package-field-full">
              <span>File PDF</span>
              <input type="file" accept="application/pdf,.pdf" onChange={onFileChange} disabled={loading} />
              <small className="admin-material-file-note">{form.file_label || 'Belum ada file dipilih'}</small>
            </label>

            <label className="admin-package-field admin-package-field-full admin-material-toggle-field">
              <span>Status Publikasi</span>
              <button type="button" className={`admin-parameter-toggle${form.is_published ? ' active' : ''}`} onClick={() => onFieldChange('is_published', !form.is_published)} disabled={loading}>
                <span className="admin-parameter-toggle-track" aria-hidden="true"><span className="admin-parameter-toggle-thumb" /></span>
                <span>{form.is_published ? 'Terbit' : 'Draft'}</span>
              </button>
            </label>
          </div>

          <div className="admin-modal-actions admin-package-form-actions">
            <button type="button" className="admin-modal-button secondary" onClick={onCancel} disabled={loading}>Batal</button>
            <button type="submit" className="admin-modal-button primary" disabled={loading}>{loading ? 'Menyimpan...' : submitLabel}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
