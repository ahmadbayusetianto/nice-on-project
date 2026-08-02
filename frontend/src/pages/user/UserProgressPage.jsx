import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { fetchActivityCalendar, fetchTryoutHistory } from '../../api/accountProfileApi'
import AdminLogoutModal from '../../components/layout/AdminLogoutModal'
import DashboardNotificationMenu from '../../components/layout/DashboardNotificationMenu'
import UserSidebar from '../../components/layout/UserSidebar'
import MaterialEmptyState from '../../components/shared/MaterialEmptyState'
import { formatAdminDate } from '../../utils/format'
import { clearAuthUser, readStoredUser } from '../../utils/storage'
import ActivityCalendarGrid from './ActivityCalendarGrid'
import ScoreBreakdownChart from './ScoreBreakdownChart'
import ScoreTrendChart from './ScoreTrendChart'
import './UserProgressPage.css'

function comboKey(session) {
  return `${session.package_id ?? 'none'}|${session.jenis_tryout}`
}

function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function UserProgressPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const profileMenuRef = useRef(null)
  const storedUser = readStoredUser()
  const user = location.state?.user ?? storedUser

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

  const [sessions, setSessions] = useState([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [historyError, setHistoryError] = useState(null)
  const [selectedCombo, setSelectedCombo] = useState(null)

  const [calendarMonth, setCalendarMonth] = useState(currentMonthKey)
  const [calendarDays, setCalendarDays] = useState([])
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(true)

  useEffect(() => {
    const handleDocumentPointerDown = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false)
      }
    }
    const handleDocumentKeyDown = (event) => {
      if (event.key === 'Escape') setIsProfileMenuOpen(false)
    }
    document.addEventListener('pointerdown', handleDocumentPointerDown)
    document.addEventListener('keydown', handleDocumentKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handleDocumentPointerDown)
      document.removeEventListener('keydown', handleDocumentKeyDown)
    }
  }, [])

  useEffect(() => {
    if (!user?.pid) {
      setIsLoadingHistory(false)
      return
    }

    let cancelled = false

    const loadHistory = async () => {
      setIsLoadingHistory(true)
      setHistoryError(null)

      try {
        const payload = await fetchTryoutHistory(user.pid)
        if (cancelled) return

        const rows = Array.isArray(payload?.data) ? payload.data : []
        setSessions(rows)

        const finished = rows.filter((row) => row.is_finished)
        if (finished.length) {
          const latest = finished.reduce((a, b) => (new Date(a.finish_at) > new Date(b.finish_at) ? a : b))
          setSelectedCombo(comboKey(latest))
        }
      } catch (error) {
        if (!cancelled) setHistoryError(error instanceof Error ? error.message : 'Riwayat tryout gagal dimuat.')
      } finally {
        if (!cancelled) setIsLoadingHistory(false)
      }
    }

    void loadHistory()
    return () => { cancelled = true }
  }, [user?.pid])

  useEffect(() => {
    if (!user?.pid) {
      setIsLoadingCalendar(false)
      return
    }

    let cancelled = false

    const loadCalendar = async () => {
      setIsLoadingCalendar(true)

      try {
        const payload = await fetchActivityCalendar(user.pid, calendarMonth)
        if (!cancelled) setCalendarDays(Array.isArray(payload?.data?.days) ? payload.data.days : [])
      } catch {
        if (!cancelled) setCalendarDays([])
      } finally {
        if (!cancelled) setIsLoadingCalendar(false)
      }
    }

    void loadCalendar()
    return () => { cancelled = true }
  }, [user?.pid, calendarMonth])

  const comboOptions = useMemo(() => {
    const map = new Map()
    sessions.filter((s) => s.is_finished).forEach((session) => {
      const key = comboKey(session)
      if (!map.has(key)) {
        map.set(key, { key, label: `${session.nama_paket} — ${session.jenis_tryout}` })
      }
    })
    return Array.from(map.values())
  }, [sessions])

  const comboSessions = useMemo(() => {
    if (!selectedCombo) return []
    return sessions
      .filter((s) => s.is_finished && comboKey(s) === selectedCombo)
      .sort((a, b) => new Date(a.finish_at) - new Date(b.finish_at))
  }, [sessions, selectedCombo])

  const isSkdCombo = comboSessions.length > 0 && comboSessions[0].jenis_tryout === 'SKD'

  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/dashboard-user/progress' }} />
  }

  const currentPath = location.pathname
  const displayName = user?.nama || user?.name || user?.email?.split('@')?.[0] || 'User'
  const initials = displayName.slice(0, 2).toUpperCase()
  const isProfileComplete = user?.profile_completed !== false

  const handleLogout = () => setShowLogoutConfirm(true)
  const confirmLogout = () => { clearAuthUser(); navigate('/login', { replace: true }) }

  const progressNotifications = [
    {
      id: 'progress-trend',
      title: 'Tren skor tersedia',
      description: 'Pantau perkembangan skor tryout kamu dari waktu ke waktu.',
      time: 'Baru',
      icon: '📈',
      accent: 'blue',
      href: '/dashboard-user/progress',
    },
  ]

  const monthIsCurrent = calendarMonth === currentMonthKey()

  return (
    <div className="dashboard-page dashboard-page-v2 user-progress-page">
      <div className={`dashboard-shell dashboard-shell-v2${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <UserSidebar
          currentPath={currentPath}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapsed={() => setIsSidebarCollapsed((current) => !current)}
          navigate={navigate}
          user={user}
          displayName={displayName}
          isProfileComplete={isProfileComplete}
          onLogout={handleLogout}
        />

        <main className="dashboard-main dashboard-main-v2 user-progress-main">
          <header className="dashboard-topbar">
            <div className="dashboard-topbar-left">
              <button type="button" className="dashboard-menu-button" aria-label={isSidebarCollapsed ? 'Buka navigasi' : 'Sembunyikan navigasi'} onClick={() => setIsSidebarCollapsed((current) => !current)}>☰</button>
              <p>Progress Belajar <strong>{displayName}</strong></p>
            </div>

            <div className="dashboard-topbar-right">
              <button type="button" className="dashboard-home-button" aria-label="Beranda" onClick={() => navigate('/dashboard-user', { state: { user } })}>🏠</button>
              <DashboardNotificationMenu items={progressNotifications} onItemClick={(item) => navigate(item.href, { state: { user } })} />
              <div className="dashboard-profile-menu-wrap" ref={profileMenuRef}>
                <button type="button" className="dashboard-profile-chip" aria-haspopup="menu" aria-expanded={isProfileMenuOpen} onClick={() => setIsProfileMenuOpen((current) => !current)}>
                  <span className="dashboard-profile-avatar">{initials}</span>
                  <span>{displayName}</span>
                  <span aria-hidden="true">⌄</span>
                </button>

                {isProfileMenuOpen ? (
                  <div className="dashboard-profile-dropdown" role="menu" aria-label="Menu akun">
                    <button type="button" className="dashboard-profile-dropdown-item" role="menuitem" onClick={() => { setIsProfileMenuOpen(false); navigate('/account-profile', { state: { user } }) }}>
                      <span className="dashboard-profile-dropdown-label">Resume Profile</span>
                    </button>
                    <button type="button" className="dashboard-profile-dropdown-item danger" role="menuitem" onClick={() => { setIsProfileMenuOpen(false); handleLogout() }}>
                      <span className="dashboard-profile-dropdown-label">Logout</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <section className="user-tryout-hero-card user-progress-hero-card">
            <div>
              <div className="dashboard-status-pill success">Progress Belajar</div>
              <h2>Detail & riwayat lengkap belajarmu.</h2>
              <p>Lihat tren skor, kekuatan per komponen, kalender aktivitas, dan seluruh riwayat tryout kamu di satu tempat.</p>
            </div>
          </section>

          {historyError ? <div className="dashboard-alert error">{historyError}</div> : null}
          {isLoadingHistory ? <div className="dashboard-alert">Memuat riwayat tryout...</div> : null}

          {!isLoadingHistory && !historyError ? (
            comboOptions.length ? (
              <section className="user-progress-panel">
                <div className="user-progress-panel-head">
                  <h3>Tren Skor</h3>
                  <select
                    className="user-progress-combo-select"
                    value={selectedCombo || ''}
                    onChange={(event) => setSelectedCombo(event.target.value)}
                  >
                    {comboOptions.map((option) => (
                      <option key={option.key} value={option.key}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <ScoreTrendChart
                  points={comboSessions.map((s) => ({ value: s.skor_total, finishAt: s.finish_at }))}
                />

                {isSkdCombo ? (
                  <>
                    <div className="user-progress-panel-head user-progress-panel-head-sub">
                      <h3>Breakdown TWK / TIU / TKP</h3>
                    </div>
                    <ScoreBreakdownChart
                      sessions={comboSessions.map((s) => ({ id: s.id, twk: s.skor_twk, tiu: s.skor_tiu, tkp: s.skor_tkp, finishAt: s.finish_at }))}
                    />
                  </>
                ) : (
                  <p className="user-progress-note">Breakdown TWK/TIU/TKP hanya tersedia untuk tryout jenis SKD. Paket/jenis yang dipilih saat ini adalah SKB, jadi hanya skor total yang ditampilkan.</p>
                )}
              </section>
            ) : (
              <MaterialEmptyState
                title="Belum ada tryout yang diselesaikan"
                description="Tren skor akan muncul setelah kamu menyelesaikan minimal satu sesi tryout."
                actionLabel="Mulai Tryout"
                onAction={() => navigate('/dashboard-user/tryout', { state: { user } })}
                accent="blue"
              />
            )
          ) : null}

          <section className="user-progress-panel">
            <div className="user-progress-panel-head">
              <h3>Kalender Aktivitas</h3>
            </div>
            {isLoadingCalendar ? (
              <div className="dashboard-alert">Memuat kalender...</div>
            ) : (
              <ActivityCalendarGrid
                month={calendarMonth}
                days={calendarDays}
                isNextDisabled={monthIsCurrent}
                onPrevMonth={() => {
                  const [y, m] = calendarMonth.split('-').map(Number)
                  const prev = new Date(y, m - 2, 1)
                  setCalendarMonth(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`)
                }}
                onNextMonth={() => {
                  if (monthIsCurrent) return
                  const [y, m] = calendarMonth.split('-').map(Number)
                  const next = new Date(y, m, 1)
                  setCalendarMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`)
                }}
              />
            )}
          </section>

          <section className="user-progress-panel">
            <div className="user-progress-panel-head">
              <h3>Riwayat Sesi Tryout</h3>
            </div>

            {sessions.length ? (
              <div className="user-progress-table-wrap">
                <table className="user-progress-table">
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Paket</th>
                      <th>Jenis</th>
                      <th>Skor</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => (
                      <tr key={session.id}>
                        <td>{formatAdminDate(session.created_at)}</td>
                        <td>{session.nama_paket}</td>
                        <td>{session.jenis_tryout}</td>
                        <td>{session.is_finished ? session.skor_total : '-'}</td>
                        <td>
                          <span className={`user-progress-status-badge${session.is_finished ? ' finished' : ''}`}>
                            {session.is_finished ? 'Selesai' : 'Belum Selesai'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : !isLoadingHistory ? (
              <MaterialEmptyState
                title="Belum ada riwayat tryout"
                description="Riwayat sesi tryout kamu akan muncul di sini."
                actionLabel="Mulai Tryout"
                onAction={() => navigate('/dashboard-user/tryout', { state: { user } })}
                accent="blue"
              />
            ) : null}
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
