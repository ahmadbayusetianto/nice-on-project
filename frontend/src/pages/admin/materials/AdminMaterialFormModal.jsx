import { useRef, useState } from 'react'
import { formatFileSize } from '../../../utils/format'
import './AdminMaterialManagementPage.css'

export default function AdminMaterialFormModal({
  open,
  mode = 'create',
  onCancel,
  onSubmit,
  form,
  packages,
  onFieldChange,
  onFileChange,
  maxUploadSizeMb = 5,
  loading,
  error,
  title = 'Upload Materi',
  submitLabel = 'Simpan Materi',
  helpText = 'Unggah PDF per paket dan atur status publikasi materi.',
}) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)

  if (!open) return null

  const isEditMode = mode === 'edit'
  const sortOrderValue = Number(form.sort_order) || 0
  const hasNewFile = form.file instanceof File
  const hasExistingFile = !hasNewFile && Boolean(form.original_file_label)

  const handleDragOver = (event) => {
    event.preventDefault()
    if (!loading) setIsDragOver(true)
  }

  const handleDragLeave = (event) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragOver(false)
    if (loading) return

    const file = event.dataTransfer.files?.[0] ?? null
    if (file) onFileChange(file)
  }

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onCancel}>
      <div className="admin-modal admin-package-modal admin-material-modal" role="dialog" aria-modal="true" aria-labelledby="adminMaterialTitle" onClick={(event) => event.stopPropagation()}>
        <div className="admin-material-modal-head">
          <div className="admin-modal-icon" aria-hidden="true">📄</div>
          <div>
            <h3 id="adminMaterialTitle">{title}</h3>
            <p>{helpText}</p>
          </div>
        </div>

        <div className="admin-material-info-banner">
          <span aria-hidden="true">ℹ</span>
          File yang diunggah akan digunakan sebagai materi yang dapat diakses user.
        </div>

        <form className="admin-package-form admin-material-form" onSubmit={onSubmit}>
          {error ? <div className="admin-package-form-error">{error}</div> : null}

          <div className="admin-package-form-grid admin-material-form-grid">
            <label className="admin-package-field">
              <span>Paket <em className="admin-material-required">*</em></span>
              <select value={form.package_id} onChange={(event) => onFieldChange('package_id', event.target.value)} disabled={loading} required>
                <option value="">Pilih paket</option>
                {packages.map((item) => (
                  <option key={item.pid} value={item.pid}>{item.name} ({item.kategori})</option>
                ))}
              </select>
            </label>

            <label className="admin-package-field">
              <span>Urutan</span>
              <div className="admin-material-stepper">
                <button
                  type="button"
                  className="admin-material-stepper-button"
                  onClick={() => onFieldChange('sort_order', String(Math.max(0, sortOrderValue - 1)))}
                  disabled={loading || sortOrderValue <= 0}
                  aria-label="Kurangi urutan"
                >
                  −
                </button>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="admin-material-stepper-input"
                  value={form.sort_order}
                  onChange={(event) => onFieldChange('sort_order', event.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="admin-material-stepper-button"
                  onClick={() => onFieldChange('sort_order', String(sortOrderValue + 1))}
                  disabled={loading}
                  aria-label="Tambah urutan"
                >
                  +
                </button>
              </div>
              <small className="admin-package-field-hint">Semakin kecil urutan, semakin awal ditampilkan.</small>
            </label>

            <label className="admin-package-field admin-package-field-full">
              <span>
                Judul Materi <em className="admin-material-required">*</em>
                <em className="admin-material-counter">{form.judul.length}/200</em>
              </span>
              <input
                type="text"
                value={form.judul}
                onChange={(event) => onFieldChange('judul', event.target.value)}
                placeholder="Contoh: Materi TWK Dasar"
                maxLength={200}
                disabled={loading}
                required
              />
            </label>

            <label className="admin-package-field admin-package-field-full">
              <span>
                Deskripsi
                <em className="admin-material-counter">{form.deskripsi.length} karakter</em>
              </span>
              <textarea
                value={form.deskripsi}
                onChange={(event) => onFieldChange('deskripsi', event.target.value)}
                placeholder="Penjelasan singkat materi (opsional)"
                disabled={loading}
              />
            </label>

            <label className="admin-package-field admin-package-field-full">
              <span>File PDF {!isEditMode ? <em className="admin-material-required">*</em> : null}</span>

              <div
                className={`admin-material-dropzone${isDragOver ? ' drag-over' : ''}${hasNewFile ? ' has-file' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !loading && fileInputRef.current?.click()}
              >
                <span className="admin-material-dropzone-icon" aria-hidden="true">⬆</span>
                <strong>Drag &amp; drop file PDF di sini</strong>
                <span>atau klik untuk memilih file</span>
                <small>Format: PDF • Maks. ukuran: {maxUploadSizeMb}MB</small>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
                  disabled={loading}
                  hidden
                />
              </div>

              {hasNewFile ? (
                <div className="admin-material-file-card">
                  <span className="admin-material-file-icon" aria-hidden="true">📄</span>
                  <div className="admin-material-file-meta">
                    <strong>{form.file.name}</strong>
                    <span>{formatFileSize(form.file.size)}</span>
                  </div>
                  <span className="admin-material-file-status" aria-hidden="true">✓</span>
                  <button type="button" className="admin-material-file-remove" onClick={() => onFileChange(null)} disabled={loading} aria-label="Hapus file terpilih">×</button>
                </div>
              ) : null}

              {hasExistingFile ? (
                <div className="admin-material-file-card existing">
                  <span className="admin-material-file-icon" aria-hidden="true">📄</span>
                  <div className="admin-material-file-meta">
                    <strong>{form.original_file_label}</strong>
                    <span>{form.original_file_size_label || 'File saat ini'}</span>
                  </div>
                </div>
              ) : null}

              {isEditMode ? <small className="admin-package-field-hint">Kosongkan untuk tetap menggunakan file saat ini, atau pilih file baru untuk menggantinya.</small> : null}
            </label>

            <label className="admin-package-field admin-package-field-full admin-material-toggle-field">
              <span>Status Publikasi</span>
              <button type="button" className={`admin-parameter-toggle${form.is_published ? ' active' : ''}`} onClick={() => onFieldChange('is_published', !form.is_published)} disabled={loading}>
                <span className="admin-parameter-toggle-track" aria-hidden="true"><span className="admin-parameter-toggle-thumb" /></span>
                <span>{form.is_published ? 'Terbit' : 'Draft'}</span>
              </button>
              <small className="admin-package-field-hint">Jika aktif, materi akan langsung dapat diakses user.</small>
            </label>
          </div>

          <div className="admin-modal-actions admin-package-form-actions admin-material-form-actions">
            <small className="admin-material-required-note"><em className="admin-material-required">*</em> Wajib diisi</small>
            <div className="admin-material-form-buttons">
              <button type="button" className="admin-modal-button secondary" onClick={onCancel} disabled={loading}>Batal</button>
              <button type="submit" className="admin-modal-button primary" disabled={loading}>{loading ? 'Menyimpan...' : `💾 ${submitLabel}`}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
