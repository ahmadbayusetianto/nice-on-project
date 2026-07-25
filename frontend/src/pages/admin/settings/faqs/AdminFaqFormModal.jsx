import { useEffect, useRef } from 'react'
import './AdminFaqFormModal.css'

export default function AdminFaqFormModal({ open, onCancel, onSubmit, form, onFieldChange, loading, error, title = 'Tambah FAQ', submitLabel = 'Simpan FAQ', helpText = 'Kelola pertanyaan dan jawaban yang tampil di landing page.' }) {
  const editorRef = useRef(null)

  useEffect(() => {
    if (!open || !editorRef.current) return

    const nextHtml = form.jawaban || ''
    if (editorRef.current.innerHTML !== nextHtml) {
      editorRef.current.innerHTML = nextHtml
    }
  }, [open, form.jawaban])

  const runEditorCommand = (command, value = null) => {
    if (loading) return
    editorRef.current?.focus()

    if (command === 'createLink') {
      const href = window.prompt('Masukkan URL link:', 'https://')
      if (!href) return
      document.execCommand(command, false, href)
    } else {
      document.execCommand(command, false, value)
    }

    onFieldChange('jawaban', editorRef.current?.innerHTML || '')
  }

  const handleEditorInput = () => {
    onFieldChange('jawaban', editorRef.current?.innerHTML || '')
  }

  if (!open) return null

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onCancel}>
      <div className="admin-modal admin-faq-modal" role="dialog" aria-modal="true" aria-labelledby="adminFaqTitle" onClick={(event) => event.stopPropagation()}>
        <div className="admin-faq-modal-header">
          <div>
            <h3 id="adminFaqTitle">{title}</h3>
            <p>{helpText}</p>
          </div>
          <button type="button" className="admin-faq-close" aria-label="Tutup modal FAQ" onClick={onCancel} disabled={loading}>×</button>
        </div>
        {loading ? <div className="admin-package-form-loading">Memuat data FAQ...</div> : null}

        <form className="admin-package-form admin-parameter-form" onSubmit={onSubmit}>
          {error ? <div className="admin-package-form-error">{error}</div> : null}

          <div className="admin-package-form-grid admin-parameter-form-grid">
            <label className="admin-package-field">
              <span>Kategori</span>
              <select value={form.kategori} onChange={(event) => onFieldChange('kategori', event.target.value)} disabled={loading}>
                {['Umum', 'Program', 'Pendaftaran', 'Pembayaran', 'Akun', 'Teknis'].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="admin-package-field">
              <span>Icon (Opsional)</span>
              <select value={form.ikon} onChange={(event) => onFieldChange('ikon', event.target.value)} disabled={loading}>
                {['❓', '📘', '💬', '🎓', '🧩', '🛡️', '⭐', '🔥', '✅', '⚡'].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="admin-package-field admin-package-field-full">
              <span>Pertanyaan</span>
              <input type="text" value={form.pertanyaan} onChange={(event) => onFieldChange('pertanyaan', event.target.value)} placeholder="Lorem ipsum dolor sit amet consectetur?" disabled={loading} />
            </label>

            <label className="admin-package-field admin-package-field-full">
              <span>Jawaban</span>
              <div className="admin-faq-editor-shell">
                <div className="admin-faq-toolbar" role="toolbar" aria-label="Toolbar editor FAQ">
                  <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand('bold')} disabled={loading} aria-label="Bold"><strong>B</strong></button>
                  <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand('italic')} disabled={loading} aria-label="Italic"><em>I</em></button>
                  <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand('underline')} disabled={loading} aria-label="Underline"><u>U</u></button>
                  <span className="admin-faq-toolbar-sep" aria-hidden="true" />
                  <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand('insertUnorderedList')} disabled={loading} aria-label="Bullet list">• List</button>
                  <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand('insertOrderedList')} disabled={loading} aria-label="Numbered list">1. List</button>
                  <span className="admin-faq-toolbar-sep" aria-hidden="true" />
                  <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand('createLink')} disabled={loading} aria-label="Link">Link</button>
                  <span className="admin-faq-toolbar-sep" aria-hidden="true" />
                  <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand('justifyLeft')} disabled={loading} aria-label="Rata kiri">⟸</button>
                  <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand('justifyCenter')} disabled={loading} aria-label="Rata tengah">≡</button>
                  <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand('justifyRight')} disabled={loading} aria-label="Rata kanan">⟹</button>
                </div>
                <div
                  ref={editorRef}
                  className="admin-faq-editor"
                  contentEditable={!loading}
                  suppressContentEditableWarning
                  onInput={handleEditorInput}
                  onBlur={handleEditorInput}
                  data-placeholder="Tulis jawaban FAQ di sini..."
                />
              </div>
            </label>

            <label className="admin-package-field">
              <span>Urutan</span>
              <input type="number" min="0" value={form.urutan} onChange={(event) => onFieldChange('urutan', event.target.value)} placeholder="0" disabled={loading} />
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
