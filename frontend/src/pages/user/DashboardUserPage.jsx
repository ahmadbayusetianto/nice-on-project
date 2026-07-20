// Not referenced by any <Route> in App.jsx — /dashboard-user renders
// DashboardUserPageV2 instead. Kept as-is during the modularization move;
// verify with the team before deleting.
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import AdminLogoutModal from '../../components/layout/AdminLogoutModal'
import { clearAuthUser, readStoredUser } from '../../utils/storage'

export default function DashboardUserPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const storedUser = readStoredUser()
  const user = location.state?.user ?? storedUser

  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/dashboard-user' }} />
  }

  const displayName = user?.nama || user?.name || user?.email?.split('@')?.[0] || 'User'
  const isProfileComplete = user?.profile_completed !== false

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    clearAuthUser()

    navigate('/login', { replace: true })
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <aside className="dashboard-sidebar">
          <div className="dashboard-brand">NICE ON</div>
          <div className="dashboard-sidebar-heading">
            <h1>Dashboard User</h1>
            <p className="dashboard-user-name">{displayName}</p>
          </div>
          <p>
            {isProfileComplete
              ? 'Kamu berhasil login dan siap mulai belajar.'
              : 'Kamu berhasil login. Lanjutkan melengkapi profil agar pengalaman belajar lebih personal.'}
          </p>

          <div className="dashboard-status-card">
            <span>Mode Akses</span>
            <strong>Dashboard User</strong>
          </div>

          <div className="dashboard-status-card">
            <span>Status Akun</span>
            <strong>{user?.status ?? 'active'}</strong>
          </div>

          <div className="dashboard-status-card">
            <span>Email</span>
            <strong>{user?.email ?? 'Belum tersedia'}</strong>
          </div>

          <div className="dashboard-actions">
            {!isProfileComplete ? (
              <button
                type="button"
                className="register-btn"
                onClick={() => navigate('/complete-profile', { state: { registeredUser: user } })}
              >
                Lanjut Lengkapi Profil
              </button>
            ) : (
              <button type="button" className="register-btn" onClick={() => navigate('/')}>
                Mulai Belajar
              </button>
            )}
            <button type="button" className="dashboard-logout-button" onClick={handleLogout}>
              Keluar Akun
            </button>
          </div>
        </aside>

        <main className="dashboard-main">
          <section className="dashboard-hero-card">
            <div className="dashboard-hero-topline">
              <div className="onboarding-success-pill">Login Berhasil</div>
              <div className="dashboard-hero-meta">Selamat datang kembali</div>
            </div>
            <h2>Dashboard user yang lebih rapi dan fokus.</h2>
            <p>
              Dari sini kamu bisa melanjutkan profil, mengecek progres, atau langsung masuk ke sesi belajar berikutnya.
            </p>
            <div className="dashboard-hero-actions">
              {!isProfileComplete ? (
                <button
                  type="button"
                  className="dashboard-primary-action"
                  onClick={() => navigate('/complete-profile', { state: { registeredUser: user } })}
                >
                  Lengkapi Profil
                </button>
              ) : (
                <button type="button" className="dashboard-primary-action" onClick={() => navigate('/')}>
                  Mulai Belajar
                </button>
              )}
              <button type="button" className="dashboard-secondary-action" onClick={() => navigate('/login')}>
                Ganti Akun
              </button>
            </div>
          </section>

          <section className="dashboard-grid">
            {[
              ['Progress', isProfileComplete ? '100%' : '0%', isProfileComplete ? 'Profil siap dipakai' : 'Profil awal belum diselesaikan'],
              ['Tryout Hari Ini', '0', 'Belum ada aktivitas'],
              ['Target Mingguan', '7 sesi', 'Siap ditetapkan'],
            ].map(([label, value, desc]) => (
              <article className="dashboard-metric" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <p>{desc}</p>
              </article>
            ))}
          </section>

          <section className="dashboard-lower-grid">
            <article className="dashboard-panel-card">
              <div className="dashboard-panel-head">
                <h3>Langkah Berikutnya</h3>
                <span>{isProfileComplete ? 'Siap' : 'Perlu dilengkapi'}</span>
              </div>
              <ol className="dashboard-steps">
                <li>{isProfileComplete ? 'Mulai dari materi atau tryout yang tersedia.' : 'Lengkapi profil dasar agar akun lebih lengkap.'}</li>
                <li>Masuk ke dashboard belajar dan pilih program yang sesuai.</li>
                <li>Pantau progres dari riwayat sesi berikutnya.</li>
              </ol>
            </article>

            <article className="dashboard-panel-card">
              <div className="dashboard-panel-head">
                <h3>Akses Cepat</h3>
                <span>Shortcut</span>
              </div>
              <div className="dashboard-quick-actions">
                <button type="button" className="dashboard-quick-button">Materi</button>
                <button type="button" className="dashboard-quick-button">Tryout</button>
                <button type="button" className="dashboard-quick-button">Jadwal</button>
                <button type="button" className="dashboard-quick-button">Bantuan</button>
              </div>
            </article>
          </section>
        </main>
      </div>
      <AdminLogoutModal
        open={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Keluar dari akun user?"
        message="Pastikan progres atau aktivitas yang sedang berjalan sudah disimpan sebelum Anda logout."
        confirmLabel="Ya, keluar"
      />
    </div>
  )
}
