export default function AdminUserFormModal({ open, mode = 'edit', title = 'Edit User', submitLabel = 'Simpan', helpText = 'Perbarui data akun dan profil user.', form, loading = false, error = null, onCancel, onSubmit, onFieldChange }) {
  if (!open) return null

  const isCreateMode = mode === 'create'

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onCancel}>
      <div className="admin-modal admin-user-form-modal" role="dialog" aria-modal="true" aria-labelledby="adminUserFormTitle" onClick={(event) => event.stopPropagation()}>
        <div className="admin-question-detail-header">
          <div className="admin-question-detail-title-block">
            <div className="admin-user-form-avatar-wrap">
              <div className="admin-user-form-avatar" aria-hidden="true">👤</div>
              <span className="admin-user-form-avatar-badge" aria-hidden="true">✎</span>
            </div>
            <div>
              <h3 id="adminUserFormTitle">{title}</h3>
              <p>{helpText}</p>
            </div>
          </div>
          <button type="button" className="admin-question-close" aria-label="Tutup form user" onClick={onCancel} disabled={loading}>×</button>
        </div>

        {loading ? <div className="admin-package-form-loading">Menyimpan data user...</div> : null}
        {error ? <div className="admin-package-form-error">{error}</div> : null}

        <form className="admin-package-form admin-user-form" onSubmit={onSubmit}>
          <div className="admin-package-form-grid">
            <label className="admin-package-field">
              <span><i className="admin-user-field-icon" aria-hidden="true">👤</i>Nama Lengkap</span>
              <input type="text" value={form.nama} onChange={(event) => onFieldChange('nama', event.target.value)} disabled={loading} />
            </label>

            <label className="admin-package-field">
              <span><i className="admin-user-field-icon" aria-hidden="true">✉</i>Email</span>
              <input type="email" value={form.email} onChange={(event) => onFieldChange('email', event.target.value)} disabled={loading} />
            </label>

            {isCreateMode ? (
              <label className="admin-package-field">
                <span><i className="admin-user-field-icon" aria-hidden="true">🔒</i>Password</span>
                <input type="password" value={form.password} onChange={(event) => onFieldChange('password', event.target.value)} disabled={loading} placeholder="Minimal 8 karakter" autoComplete="new-password" />
              </label>
            ) : null}

            <label className="admin-package-field">
              <span><i className="admin-user-field-icon" aria-hidden="true">📞</i>No HP</span>
              <input type="text" value={form.nohp} onChange={(event) => onFieldChange('nohp', event.target.value)} disabled={loading} />
            </label>

            <label className="admin-package-field">
              <span><i className="admin-user-field-icon" aria-hidden="true">◐</i>Status</span>
              <div className="admin-user-status-select-wrap">
                <span className={`admin-user-status-dot${form.status === 'active' ? ' active' : ' inactive'}`} aria-hidden="true" />
                <select value={form.status} onChange={(event) => onFieldChange('status', event.target.value)} disabled={loading}>
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>
            </label>

            <label className="admin-package-field">
              <span><i className="admin-user-field-icon" aria-hidden="true">🛡️</i>Peran</span>
              <select value={form.is_admin ? '1' : '0'} onChange={(event) => onFieldChange('is_admin', event.target.value === '1')} disabled={loading}>
                <option value="0">User</option>
                <option value="1">Admin</option>
              </select>
            </label>

            <label className="admin-package-field">
              <span><i className="admin-user-field-icon" aria-hidden="true">📅</i>TTL</span>
              <input type="text" value={form.ttl} onChange={(event) => onFieldChange('ttl', event.target.value)} disabled={loading} />
            </label>

            <label className="admin-package-field">
              <span><i className="admin-user-field-icon" aria-hidden="true">⚧</i>Jenis Kelamin</span>
              <select value={form.gender} onChange={(event) => onFieldChange('gender', event.target.value)} disabled={loading}>
                <option value="">-</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </label>

            <label className="admin-package-field">
              <span><i className="admin-user-field-icon" aria-hidden="true">🔖</i>Referensi</span>
              <input type="text" value={form.refference} onChange={(event) => onFieldChange('refference', event.target.value)} disabled={loading} />
            </label>

            <label className="admin-package-field">
              <span><i className="admin-user-field-icon" aria-hidden="true">🔖</i>Referensi Lain</span>
              <input type="text" value={form.reference_other} onChange={(event) => onFieldChange('reference_other', event.target.value)} disabled={loading} />
            </label>

            <label className="admin-package-field admin-package-field-full">
              <span><i className="admin-user-field-icon" aria-hidden="true">📍</i>Alamat</span>
              <textarea value={form.alamat} onChange={(event) => onFieldChange('alamat', event.target.value)} disabled={loading} rows={4} />
            </label>
          </div>

          <div className="admin-modal-actions admin-package-form-actions">
            <button type="button" className="admin-modal-button secondary" onClick={onCancel} disabled={loading}>✕ Batal</button>
            <button type="submit" className="admin-modal-button primary" disabled={loading}>{loading ? 'Menyimpan...' : `💾 ${submitLabel}`}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
