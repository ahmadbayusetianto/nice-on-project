import { formatReferenceDisplay } from '../../utils/format'

export default function AccountProfileEditModal({ open, onClose, profile }) {
  if (!open) return null

  const detail = profile?.detail ?? {}

  return (
    <div className="account-profile-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="account-profile-modal" role="dialog" aria-modal="true" aria-labelledby="accountProfileEditTitle" onClick={(event) => event.stopPropagation()}>
        <div className="account-profile-modal-head">
          <div>
            <p className="account-profile-modal-kicker">Edit Profile</p>
            <h3 id="accountProfileEditTitle">Form edit belum diaktifkan</h3>
          </div>
          <button type="button" className="account-profile-modal-close" onClick={onClose} aria-label="Tutup">×</button>
        </div>

        <p className="account-profile-modal-note">
          Untuk sementara ini modal hanya menampilkan data yang sudah tersimpan. Logika simpan/update akan ditambahkan nanti.
        </p>

        <div className="account-profile-modal-grid">
          {[
            ['Nama', detail.nama || 'Belum diisi'],
            ['Tanggal Lahir', detail.ttl || 'Belum diisi'],
            ['Jenis Kelamin', detail.gender === 'L' ? 'Laki-laki' : detail.gender === 'P' ? 'Perempuan' : 'Belum diisi'],
            ['No. HP', detail.nohp || 'Belum diisi'],
            ['Alamat', detail.alamat || 'Belum diisi'],
            ['Referensi', formatReferenceDisplay(detail)],
          ].map(([label, value]) => (
            <label className="account-profile-field" key={label}>
              <span>{label}</span>
              <input type="text" value={value} readOnly />
            </label>
          ))}
        </div>

        <div className="account-profile-modal-actions">
          <button type="button" className="dashboard-secondary-action" onClick={onClose}>Tutup</button>
          <button type="button" className="register-btn" disabled>Simpan (nanti)</button>
        </div>
      </div>
    </div>
  )
}
