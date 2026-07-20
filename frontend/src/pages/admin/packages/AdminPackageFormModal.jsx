export default function AdminPackageFormModal({ open, onCancel, onSubmit, form, onFieldChange, loading, error, title = 'Tambah Paket', submitLabel = 'Simpan Paket', helpText = 'Isi data paket sesuai kolom yang tersedia di tabel paket.' }) {
  if (!open) return null

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onCancel}>
      <div className="admin-modal admin-package-modal" role="dialog" aria-modal="true" aria-labelledby="adminPackageTitle" onClick={(event) => event.stopPropagation()}>
        <div className="admin-modal-icon" aria-hidden="true">📦</div>
        <h3 id="adminPackageTitle">{title}</h3>
        <p>{helpText}</p>
        {loading ? <div className="admin-package-form-loading">Memuat data paket...</div> : null}

        <form className="admin-package-form" onSubmit={onSubmit}>
          {error ? <div className="admin-package-form-error">{error}</div> : null}

          <div className="admin-package-form-grid">
            <label className="admin-package-field">
              <span>Kategori</span>
               <select value={form.kategori} onChange={(event) => onFieldChange('kategori', event.target.value)} disabled={loading}>
                <option value="CPNS">CPNS</option>
                <option value="PPPK">PPPK</option>
              </select>
            </label>

            <label className="admin-package-field">
              <span>Nama Paket</span>
              <input type="text" value={form.nama_paket} onChange={(event) => onFieldChange('nama_paket', event.target.value)} placeholder="Contoh: Paket Premium CPNS" disabled={loading} />
            </label>

            <label className="admin-package-field">
              <span>Formasi</span>
              <input type="text" value={form.formasi} onChange={(event) => onFieldChange('formasi', event.target.value)} placeholder="Contoh: Online / Offline" disabled={loading} />
            </label>

            <label className="admin-package-field">
              <span>Jadwal</span>
              <input type="text" value={form.jadwal} onChange={(event) => onFieldChange('jadwal', event.target.value)} placeholder="Contoh: Batch 1 - Mei 2026" disabled={loading} />
            </label>

            <label className="admin-package-field admin-package-field-full">
              <span>Harga</span>
              <input type="number" min="0" step="1" value={form.harga} onChange={(event) => onFieldChange('harga', event.target.value)} placeholder="Contoh: 250000" disabled={loading} />
            </label>

            <label className="admin-package-field admin-package-field-full">
              <span>Keterangan</span>
              <textarea value={form.ket} onChange={(event) => onFieldChange('ket', event.target.value)} placeholder="Deskripsi singkat paket" disabled={loading}></textarea>
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
