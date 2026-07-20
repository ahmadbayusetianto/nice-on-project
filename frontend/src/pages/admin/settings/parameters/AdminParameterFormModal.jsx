export default function AdminParameterFormModal({ open, onCancel, onSubmit, form, onFieldChange, loading, error, title = 'Tambah Parameter', submitLabel = 'Simpan Parameter', helpText = 'Atur nilai parameter aplikasi yang dipakai oleh sistem.' }) {
  if (!open) return null

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onCancel}>
      <div className="admin-modal admin-parameter-modal" role="dialog" aria-modal="true" aria-labelledby="adminParameterTitle" onClick={(event) => event.stopPropagation()}>
        <div className="admin-modal-icon" aria-hidden="true">⚙</div>
        <h3 id="adminParameterTitle">{title}</h3>
        <p>{helpText}</p>
        {loading ? <div className="admin-package-form-loading">Memuat data parameter...</div> : null}

        <form className="admin-package-form admin-parameter-form" onSubmit={onSubmit}>
          {error ? <div className="admin-package-form-error">{error}</div> : null}

          <div className="admin-package-form-grid admin-parameter-form-grid">
            <label className="admin-package-field">
              <span>Kode</span>
              <input type="text" value={form.kode} onChange={(event) => onFieldChange('kode', event.target.value)} placeholder="Contoh: app.name" disabled={loading} />
            </label>

            <label className="admin-package-field">
              <span>Nama</span>
              <input type="text" value={form.nama} onChange={(event) => onFieldChange('nama', event.target.value)} placeholder="Contoh: Nama Aplikasi" disabled={loading} />
            </label>

            <label className="admin-package-field">
              <span>Kategori</span>
              <input type="text" value={form.kategori} onChange={(event) => onFieldChange('kategori', event.target.value)} placeholder="Contoh: Aplikasi" disabled={loading} />
            </label>

            <label className="admin-package-field">
              <span>Tipe</span>
              <select value={form.tipe} onChange={(event) => onFieldChange('tipe', event.target.value)} disabled={loading}>
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="select">Select</option>
              </select>
            </label>

            <label className="admin-package-field admin-package-field-full">
              <span>Nilai</span>
              <input type="text" value={form.nilai} onChange={(event) => onFieldChange('nilai', event.target.value)} placeholder="Contoh: Nice On Learning Hub" disabled={loading} />
            </label>

            <label className="admin-package-field admin-package-field-full">
              <span>Deskripsi</span>
              <textarea value={form.deskripsi} onChange={(event) => onFieldChange('deskripsi', event.target.value)} placeholder="Penjelasan singkat parameter" disabled={loading}></textarea>
            </label>

            <label className="admin-package-field admin-package-field-full admin-parameter-toggle-field">
              <span>Status Aktif</span>
              <button
                type="button"
                className={`admin-parameter-toggle${form.is_active ? ' active' : ''}`}
                onClick={() => onFieldChange('is_active', !form.is_active)}
                disabled={loading}
              >
                <span className="admin-parameter-toggle-track" aria-hidden="true">
                  <span className="admin-parameter-toggle-thumb" />
                </span>
                <span>{form.is_active ? 'Aktif' : 'Nonaktif'}</span>
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
