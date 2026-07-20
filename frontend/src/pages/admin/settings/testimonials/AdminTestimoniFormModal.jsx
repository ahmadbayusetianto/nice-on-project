import QuestionImageUploadField from '../../../../components/shared/QuestionImageUploadField'

export default function AdminTestimoniFormModal({ open, onCancel, onSubmit, form, onFieldChange, loading, error, title = 'Tambah Testimoni', submitLabel = 'Simpan Testimoni', helpText = 'Kelola testimoni yang tampil di landing page.' }) {
  if (!open) return null

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onCancel}>
      <div className="admin-modal admin-faq-modal" role="dialog" aria-modal="true" aria-labelledby="adminTestimoniTitle" onClick={(event) => event.stopPropagation()}>
        <div className="admin-faq-modal-header">
          <div>
            <h3 id="adminTestimoniTitle">{title}</h3>
            <p>{helpText}</p>
          </div>
          <button type="button" className="admin-faq-close" aria-label="Tutup modal testimoni" onClick={onCancel} disabled={loading}>×</button>
        </div>
        {loading ? <div className="admin-package-form-loading">Memuat data testimoni...</div> : null}

        <form className="admin-package-form admin-parameter-form" onSubmit={onSubmit}>
          {error ? <div className="admin-package-form-error">{error}</div> : null}

          <div className="admin-package-form-grid admin-parameter-form-grid">
            <label className="admin-package-field">
              <span>Nama</span>
              <input type="text" value={form.nama} onChange={(event) => onFieldChange('nama', event.target.value)} placeholder="Nama peserta" disabled={loading} />
            </label>

            <label className="admin-package-field">
              <span>Jabatan / Peran (Opsional)</span>
              <input type="text" value={form.jabatan} onChange={(event) => onFieldChange('jabatan', event.target.value)} placeholder="Lolos instansi alumni" disabled={loading} />
            </label>

            <label className="admin-package-field admin-package-field-full">
              <span>Isi Testimoni</span>
              <textarea value={form.isi} onChange={(event) => onFieldChange('isi', event.target.value)} placeholder="Tulis testimoni di sini..." disabled={loading} rows={5} />
            </label>

            <label className="admin-package-field">
              <span>Rating</span>
              <select value={form.rating} onChange={(event) => onFieldChange('rating', event.target.value)} disabled={loading}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>{value} Bintang</option>
                ))}
              </select>
            </label>

            <label className="admin-package-field">
              <span>Urutan</span>
              <input type="number" min="0" value={form.urutan} onChange={(event) => onFieldChange('urutan', event.target.value)} placeholder="0" disabled={loading} />
            </label>

            <label className="admin-package-field admin-package-field-full">
              <span>Foto</span>
              <QuestionImageUploadField
                label="Tambah foto testimoni"
                preview={form.foto_preview}
                existingImageUrl={form.existing_foto_url}
                onSelectFile={(file) => {
                  onFieldChange('foto', file)
                  onFieldChange('foto_preview', URL.createObjectURL(file))
                }}
                onClear={() => {
                  onFieldChange('foto', null)
                  onFieldChange('foto_preview', null)
                  onFieldChange('existing_foto_path', null)
                  onFieldChange('existing_foto_url', null)
                }}
                disabled={loading}
              />
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
