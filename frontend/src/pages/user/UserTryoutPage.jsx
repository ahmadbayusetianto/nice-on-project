import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import './UserTryoutPage.css'
import { fetchPackages } from '../../api/homeApi'
import { fetchCurrentTryout, finishTryout as finishTryoutRequest, saveTryoutAnswer, startTryout as startTryoutRequest } from '../../api/tryoutApi'
import AdminBrandBlock from '../../components/layout/AdminBrandBlock'
import AdminLogoutModal from '../../components/layout/AdminLogoutModal'
import AdminQuestionMenu from '../../components/layout/AdminQuestionMenu'
import AdminSystemMenu from '../../components/layout/AdminSystemMenu'
import AdminUserMenu from '../../components/layout/AdminUserMenu'
import DashboardNotificationMenu from '../../components/layout/DashboardNotificationMenu'
import UserSidebar from '../../components/layout/UserSidebar'
import MaterialEmptyState from '../../components/shared/MaterialEmptyState'
import RichText from '../../components/shared/RichText'
import { getFriendlyFetchError } from '../../utils/fetchError'
import { formatCurrency, formatTryoutCountdown } from '../../utils/format'
import { clearAuthUser, readStoredSandboxAdminMode, readStoredUser } from '../../utils/storage'

export default function UserTryoutPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const profileMenuRef = useRef(null)
  const autoFinishTriggeredRef = useRef(false)
  const timerTimeoutRef = useRef(null)
  const searchParams = new URLSearchParams(location.search)
  const isSandboxMode = searchParams.get('sandbox') === '1'
  const storedUser = readStoredUser()
  const user = location.state?.user ?? storedUser
  const isSandboxAdminMode = isSandboxMode && (searchParams.get('sandbox_admin') === '1' || location.state?.sandboxAdmin === true || readStoredSandboxAdminMode() || Number(user?.is_admin ?? 0) === 1)

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [packageRows, setPackageRows] = useState([])
  const [packageLoading, setPackageLoading] = useState(true)
  const [packageError, setPackageError] = useState(null)
  const [packageSearch, setPackageSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedTryoutType, setSelectedTryoutType] = useState('SKD')
  const [packageLayout, setPackageLayout] = useState('grid')
  const [tryoutData, setTryoutData] = useState(null)
  const [tryoutLoading, setTryoutLoading] = useState(true)
  const [tryoutError, setTryoutError] = useState(null)
  const [answerMap, setAnswerMap] = useState({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [timerReady, setTimerReady] = useState(false)
  const [startingPackageId, setStartingPackageId] = useState(null)
  const [isFinishing, setIsFinishing] = useState(false)
  const [resultData, setResultData] = useState(null)
  const [expandedReviewIds, setExpandedReviewIds] = useState(() => new Set())

  const toggleReviewExpanded = (questionId) => {
    setExpandedReviewIds((current) => {
      const next = new Set(current)
      if (next.has(questionId)) {
        next.delete(questionId)
      } else {
        next.add(questionId)
      }
      return next
    })
  }

  useEffect(() => {
    const handleDocumentPointerDown = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false)
      }
    }

    const handleDocumentKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handleDocumentPointerDown)
    document.addEventListener('keydown', handleDocumentKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handleDocumentPointerDown)
      document.removeEventListener('keydown', handleDocumentKeyDown)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadPackages = async () => {
      setPackageLoading(true)
      setPackageError(null)

      try {
        const payload = await fetchPackages(isSandboxAdminMode ? {} : { userId: user?.pid })

        if (!cancelled) {
          setPackageRows(Array.isArray(payload.data) ? payload.data : [])
        }
      } catch (error) {
        if (!cancelled) {
          setPackageError(getFriendlyFetchError(error, 'Data paket gagal dimuat.'))
        }
      } finally {
        if (!cancelled) {
          setPackageLoading(false)
        }
      }
    }

    void loadPackages()

    return () => {
      cancelled = true
    }
  }, [user?.pid, isSandboxAdminMode])

  useEffect(() => {
    if (!user?.pid) {
      setTryoutLoading(false)
      return
    }

    let cancelled = false

    const loadCurrentTryout = async () => {
      setTryoutLoading(true)
      setTryoutError(null)

      try {
        const payload = await fetchCurrentTryout({ userId: user.pid, includeDraft: isSandboxMode })

        if (!cancelled) {
          setTryoutData(payload?.data ?? null)
          setResultData(payload?.data?.session?.is_finished ? payload.data : null)
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Sesi tryout gagal dimuat.'
          setTryoutError(message.includes('Tidak ada sesi tryout aktif') ? null : message)
          setTryoutData(null)
          setResultData(null)
        }
      } finally {
        if (!cancelled) {
          setTryoutLoading(false)
        }
      }
    }

    void loadCurrentTryout()

    return () => {
      cancelled = true
    }
  }, [user?.pid, isSandboxMode])

  useEffect(() => {
    if (!tryoutData) return

    const nextAnswers = {}
    tryoutData.questions.forEach((question) => {
      if (question.selected_option_id) {
        nextAnswers[String(question.id)] = String(question.selected_option_id)
      }
    })

    setAnswerMap(nextAnswers)
    const firstUnansweredIndex = tryoutData.questions.findIndex((question) => !question.selected_option_id)
    setCurrentQuestionIndex(firstUnansweredIndex >= 0 ? firstUnansweredIndex : 0)
    setResultData(tryoutData.session?.is_finished ? tryoutData : null)
    autoFinishTriggeredRef.current = Boolean(tryoutData.session?.is_finished)
    setTimerReady(false)
  }, [tryoutData])

  useEffect(() => {
    if (!tryoutData || tryoutData.session?.is_finished) {
      setRemainingSeconds(0)
      setTimerReady(false)
      return undefined
    }

    if (timerTimeoutRef.current) {
      window.clearTimeout(timerTimeoutRef.current)
      timerTimeoutRef.current = null
    }

    const durationMinutes = Number(tryoutData.settings?.duration_minutes || 100)
    const expiresAtTimestamp = Number(tryoutData.session?.expires_at_timestamp || 0)
    const startedAtTimestamp = Number(tryoutData.session?.started_at_timestamp || 0)
    const createdAtTimestamp = Number(new Date(tryoutData.session.created_at).getTime())
    const expiresAt = Number.isFinite(expiresAtTimestamp) && expiresAtTimestamp > 0
      ? expiresAtTimestamp * 1000
      : (Number.isFinite(startedAtTimestamp) && startedAtTimestamp > 0
        ? startedAtTimestamp * 1000 + (durationMinutes * 60 * 1000)
        : (Number.isFinite(createdAtTimestamp) ? createdAtTimestamp + (durationMinutes * 60 * 1000) : NaN))

    const updateTimer = () => {
      if (!Number.isFinite(expiresAt)) {
        setRemainingSeconds(0)
        return
      }

      const remainingMs = Math.max(0, expiresAt - Date.now())
      setRemainingSeconds(Math.ceil(remainingMs / 1000))

      if (remainingMs <= 0) {
        return
      }

      const nextDelay = Math.max(50, 1000 - (Date.now() % 1000))
      timerTimeoutRef.current = window.setTimeout(updateTimer, nextDelay)
    }

    updateTimer()
    setTimerReady(true)

    return () => {
      if (timerTimeoutRef.current) {
        window.clearTimeout(timerTimeoutRef.current)
        timerTimeoutRef.current = null
      }
    }
  }, [tryoutData, isFinishing])

  useEffect(() => {
    if (!tryoutData || tryoutData.session?.is_finished || !timerReady) return
    if (remainingSeconds > 0) return
    if (isFinishing || autoFinishTriggeredRef.current) return

    autoFinishTriggeredRef.current = true
    void finishTryoutSession()
  }, [remainingSeconds, tryoutData, isFinishing, timerReady])

  if (!user) {
    return <Navigate to="/login" replace state={{ from: `/dashboard-user/tryout${isSandboxMode ? '?sandbox=1' : ''}` }} />
  }

  const currentPath = location.pathname
  const isAdminSandbox = isSandboxAdminMode
  const adminSidebarPath = isAdminSandbox ? '/dashboard-admin/questions?tab=tryout' : currentPath
  const tryoutDashboardPath = isAdminSandbox ? '/dashboard-admin' : '/dashboard-user'
  const tryoutDashboardLabel = isAdminSandbox ? 'Ke Dashboard Admin' : 'Ke Dashboard'
  const displayName = user?.nama || user?.name || user?.email?.split('@')?.[0] || 'User'
  const initials = displayName.slice(0, 2).toUpperCase()
  const isProfileComplete = user?.profile_completed !== false

  const adminMainMenu = [
    { label: 'Dashboard', href: '/dashboard-admin' },
    { label: 'User', href: '/dashboard-admin/users' },
    { label: 'Paket', href: '/dashboard-admin/packages' },
    { label: 'Materi', href: '/dashboard-admin/materials' },
    { label: 'Transaksi', href: '/dashboard-admin/transactions' },
    { label: 'Konten', href: '#' },
    { label: 'Laporan', href: '#' },
  ]

  const sidebarItems = [
    { label: 'Dashboard', href: '/dashboard-user' },
    { label: 'Materi', href: '#' },
    { label: 'Tryout', href: '/dashboard-user/tryout' },
    { label: 'Jadwal', href: '#' },
    { label: 'Bantuan', href: '#' },
  ]

  const quickStats = [
    ['Paket Aktif', String(packageRows.length)],
    ['Sesi Berjalan', tryoutData ? '1' : '0'],
    ['Jawaban Tersimpan', tryoutData ? String(Object.keys(answerMap).length) : '0'],
  ]

  const filteredPackages = packageRows.filter((item) => {
    const search = packageSearch.trim().toLowerCase()
    const matchesCategory = String(item.kategori || '').trim().toUpperCase() === selectedCategory
    if (selectedCategory !== 'ALL' && !matchesCategory) return false

    if (!search) return true

    return [item.nama_paket, item.kategori, item.formasi, item.jadwal, item.ket]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search))
  })

  const packageStats = [
    { label: 'Paket Aktif', value: String(filteredPackages.length), description: 'Paket tersedia', icon: '📦', tone: 'blue' },
    { label: 'Sesi Berjalan', value: tryoutData ? '1' : '0', description: 'Sesi aktif', icon: '⏱️', tone: 'orange' },
    { label: 'Jawaban Tersimpan', value: tryoutData ? String(Object.keys(answerMap).length) : '0', description: 'Belum disubmit', icon: '✅', tone: 'green' },
  ]

  const currentQuestions = tryoutData?.questions || []
  const currentQuestion = currentQuestions[currentQuestionIndex] || currentQuestions[0] || null
  const answeredCount = currentQuestions.filter((question) => answerMap[String(question.id)]).length
  const progressPercent = currentQuestions.length ? Math.round((answeredCount / currentQuestions.length) * 100) : 0
  const isTryoutExpired = Boolean(tryoutData && !tryoutData.session?.is_finished && remainingSeconds <= 0)

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    clearAuthUser()

    navigate('/login', { replace: true })
  }

  const startTryoutSession = async (packageRow) => {
    if (!packageRow?.pid || !user?.pid) return

    setStartingPackageId(packageRow.pid)
    setTryoutError(null)

    try {
      const payload = await startTryoutRequest({
        userId: user.pid,
        packageId: packageRow.pid,
        jenisTryout: selectedTryoutType,
      })

      setTryoutLoading(false)
      setTryoutData(payload?.data ?? null)
      setResultData(payload?.data?.session?.is_finished ? payload.data : null)
    } catch (error) {
      setTryoutError(error instanceof Error ? error.message : 'Tryout gagal dimulai.')
      setTryoutLoading(false)
    } finally {
      setStartingPackageId(null)
    }
  }

  const saveAnswer = async (questionId, optionId) => {
    if (!tryoutData?.session?.id || !user?.pid) return
    if (tryoutData?.session?.is_finished || remainingSeconds <= 0 || isFinishing) return

    setAnswerMap((current) => ({
      ...current,
      [String(questionId)]: String(optionId),
    }))

    try {
      await saveTryoutAnswer({
        sessionId: tryoutData.session.id,
        userId: user.pid,
        questionId,
        optionId,
      })
    } catch (error) {
      setTryoutError(error instanceof Error ? error.message : 'Jawaban gagal disimpan.')
    }
  }

  const finishTryoutSession = async () => {
    if (!tryoutData?.session?.id || !user?.pid || isFinishing) return

    setIsFinishing(true)
    setTryoutError(null)

    try {
      const payload = await finishTryoutRequest({ sessionId: tryoutData.session.id, userId: user.pid })

      setTryoutData(payload?.data ?? null)
      setResultData(payload?.data ?? null)
      setRemainingSeconds(0)
    } catch (error) {
      setTryoutError(error instanceof Error ? error.message : 'Tryout gagal diselesaikan.')
    } finally {
      setIsFinishing(false)
    }
  }

  const questionStatus = (question) => {
    const selected = answerMap[String(question.id)]
    if (selected) return 'sudah'
    return 'belum'
  }

  const tryoutNotifications = [
    {
      id: 'tryout-session',
      title: 'Sesi tryout aktif',
      description: 'Jawaban tersimpan otomatis selama sesi berlangsung.',
      time: 'Baru',
      icon: '⏱️',
      accent: 'blue',
      href: '/dashboard-user/tryout',
    },
    {
      id: 'tryout-result',
      title: 'Hasil evaluasi',
      description: 'Lihat hasil tryout setelah sesi selesai.',
      time: 'Segera',
      icon: '📈',
      accent: 'green',
      href: '/dashboard-user',
    },
  ]

  return (
    <div className="dashboard-page dashboard-page-v2 user-tryout-page">
      <div className={`dashboard-shell dashboard-shell-v2${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        {isAdminSandbox ? (
          <aside className={`admin-sidebar${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
            <div className="dashboard-sidebar-brand-row">
              <AdminBrandBlock isCollapsed={isSidebarCollapsed} />
              <button
                type="button"
                className="dashboard-sidebar-collapse"
                aria-label={isSidebarCollapsed ? 'Tampilkan sidebar' : 'Sembunyikan sidebar'}
                onClick={() => setIsSidebarCollapsed((current) => !current)}
              >
                {isSidebarCollapsed ? '»' : '«'}
              </button>
            </div>

            <div className="admin-sidebar-group-label">Main</div>
            <nav className="admin-sidebar-nav" aria-label="Navigasi admin sandbox">
              {adminMainMenu.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={`admin-sidebar-item${adminSidebarPath === item.href ? ' active' : ''}`}
                  onClick={() => item.href !== '#' && navigate(item.href, { state: { user } })}
                >
                  <span className="admin-sidebar-icon" aria-hidden="true">{item.label.slice(0, 1)}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <AdminQuestionMenu currentPath={adminSidebarPath} navigate={navigate} />
            <AdminSystemMenu currentPath={adminSidebarPath} navigate={navigate} />
            <AdminUserMenu
              profileUser={user}
              displayName={displayName}
              onResumeProfile={(activeUser) => navigate('/account-profile', { state: { user: activeUser } })}
              onLogout={handleLogout}
            />
          </aside>
        ) : (
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
        )}

        <main className="dashboard-main dashboard-main-v2 user-tryout-main">
          <header className="dashboard-topbar">
            <div className="dashboard-topbar-left">
              <button
                type="button"
                className="dashboard-menu-button"
                aria-label={isSidebarCollapsed ? 'Buka navigasi' : 'Sembunyikan navigasi'}
                onClick={() => setIsSidebarCollapsed((current) => !current)}
              >
                ☰
              </button>
              <p>Simulasi Tryout <strong>{displayName}</strong>{isSandboxMode ? <span className="user-tryout-sandbox-pill">Sandbox</span> : null}</p>
            </div>

            <div className="dashboard-topbar-right">
              <button type="button" className="dashboard-home-button" aria-label="Beranda" onClick={() => navigate(tryoutDashboardPath, { state: { user } })}>
                🏠
              </button>
              <DashboardNotificationMenu items={tryoutNotifications} onItemClick={(item) => navigate(item.href, { state: { user } })} />
              <div className="dashboard-profile-menu-wrap" ref={profileMenuRef}>
                <button
                  type="button"
                  className="dashboard-profile-chip"
                  aria-haspopup="menu"
                  aria-expanded={isProfileMenuOpen}
                  onClick={() => setIsProfileMenuOpen((current) => !current)}
                >
                  <span className="dashboard-profile-avatar">{initials}</span>
                  <span>{displayName}</span>
                  <span aria-hidden="true">⌄</span>
                </button>

                {isProfileMenuOpen ? (
                  <div className="dashboard-profile-dropdown" role="menu" aria-label="Menu akun">
                    <button
                      type="button"
                      className="dashboard-profile-dropdown-item"
                      role="menuitem"
                      onClick={() => {
                        setIsProfileMenuOpen(false)
                        navigate('/account-profile', { state: { user } })
                      }}
                    >
                      <span className="dashboard-profile-dropdown-label">Resume Profile</span>
                    </button>
                    <button
                      type="button"
                      className="dashboard-profile-dropdown-item danger"
                      role="menuitem"
                      onClick={() => {
                        setIsProfileMenuOpen(false)
                        handleLogout()
                      }}
                    >
                      <span className="dashboard-profile-dropdown-label">Logout</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          {tryoutError ? <div className="dashboard-alert error">{tryoutError}</div> : null}
          {packageError ? <div className="dashboard-alert error">{packageError}</div> : null}
          {tryoutLoading ? <div className="dashboard-alert">Memuat sesi tryout...</div> : null}

          {tryoutData && !tryoutData.session?.is_finished ? (
            <section className="user-tryout-active-shell">
              <div className="user-tryout-active-summary">
                <div>
                  <div className="user-tryout-kicker">Sedang Mengerjakan</div>
                  <h2>{tryoutData.session.package_name}</h2>
                  <p>{tryoutData.session.package_category || 'Tryout CAT'} · {tryoutData.session.package_formasi || 'Simulasi ujian'}</p>
                </div>

                <div className="user-tryout-meta-cards">
                  <article>
                    <span>Jenis Tryout</span>
                    <strong>{tryoutData.session.jenis_tryout || 'SKD'}</strong>
                  </article>
                  <article>
                    <span>Progress</span>
                    <strong>{progressPercent}%</strong>
                  </article>
                  <article>
                    <span>Sisa Waktu</span>
                    <strong>{formatTryoutCountdown(remainingSeconds)}</strong>
                  </article>
                  <article>
                    <span>Soal</span>
                    <strong>{answeredCount}/{currentQuestions.length}</strong>
                  </article>
                </div>
              </div>

              <section className="user-tryout-exam-layout">
                <article className="user-tryout-question-card dashboard-panel-card">
                  <div className="dashboard-panel-head">
                    <div>
                      <h3>Soal {currentQuestionIndex + 1}</h3>
                      <span>{currentQuestion?.question_group_label || '-'}</span>
                    </div>
                    <button type="button" className="dashboard-card-link" onClick={() => void finishTryoutSession()} disabled={isFinishing}>
                      {isFinishing ? 'Menutup...' : 'Selesai Ujian'}
                    </button>
                  </div>

                  {currentQuestion ? (
                    <div className="user-tryout-question-body">
                      {currentQuestion.information ? <p className="user-tryout-question-info">{currentQuestion.information}</p> : null}
                      {currentQuestion.image_url ? (
                        <img className="user-tryout-question-image" src={currentQuestion.image_url} alt="Gambar soal" />
                      ) : null}
                      {currentQuestion.istext ? (
                        <div className="user-tryout-question-text"><RichText text={currentQuestion.question} /></div>
                      ) : null}

                      <div className={`user-tryout-option-list${currentQuestion.options?.length && !currentQuestion.options[0].istext ? ' image-mode' : ''}`}>
                        {currentQuestion.options.map((option, index) => {
                          const selected = String(answerMap[String(currentQuestion.id)] || '') === String(option.id)
                          return (
                            <button
                              key={option.id ?? `${currentQuestion.id}-${index}`}
                              type="button"
                              className={`user-tryout-option${selected ? ' selected' : ''}`}
                              disabled={isFinishing || isTryoutExpired}
                              onClick={() => {
                                void saveAnswer(currentQuestion.id, option.id)
                              }}
                            >
                              <span className="user-tryout-option-badge">{String.fromCharCode(65 + index)}</span>
                              {!option.istext && option.image_url ? (
                                <img className="user-tryout-option-image" src={option.image_url} alt={`Gambar opsi ${String.fromCharCode(65 + index)}`} />
                              ) : (
                                <span className="user-tryout-option-text"><RichText text={option.choise} /></span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="dashboard-alert">Belum ada soal pada sesi ini.</div>
                  )}

                  <div className="user-tryout-question-nav-actions">
                    <button
                      type="button"
                      className="dashboard-secondary-action"
                      onClick={() => setCurrentQuestionIndex((current) => Math.max(0, current - 1))}
                      disabled={currentQuestionIndex <= 0 || isTryoutExpired || isFinishing}
                    >
                      Soal Sebelumnya
                    </button>
                    <button
                      type="button"
                      className="dashboard-primary-action"
                      onClick={() => setCurrentQuestionIndex((current) => Math.min(currentQuestions.length - 1, current + 1))}
                      disabled={currentQuestionIndex >= currentQuestions.length - 1 || isTryoutExpired || isFinishing}
                    >
                      Soal Berikutnya
                    </button>
                  </div>
                </article>

                <aside className="user-tryout-side-panel">
                  <article className="dashboard-panel-card">
                    <div className="dashboard-panel-head">
                      <h3>Navigasi Soal</h3>
                      <span>{currentQuestions.length} SOAL</span>
                    </div>
                    <div className="user-tryout-question-grid">
                      {currentQuestions.map((question, index) => {
                        const answered = questionStatus(question) === 'sudah'
                        const active = index === currentQuestionIndex
                        return (
                          <button
                            key={question.id}
                            type="button"
                            className={`user-tryout-question-chip${active ? ' active' : ''}${answered ? ' answered' : ' unanswered'}`}
                            onClick={() => setCurrentQuestionIndex(index)}
                          >
                            {index + 1}
                          </button>
                        )
                      })}
                    </div>
                  </article>

                  <article className="dashboard-panel-card">
                    <div className="dashboard-panel-head">
                      <h3>Ringkasan</h3>
                      <span>STATUS</span>
                    </div>
                    <div className="user-tryout-summary-list">
                      <div><span>Paket</span><strong>{tryoutData.session.package_name}</strong></div>
                      <div><span>Durasi</span><strong>{tryoutData.settings.duration_minutes} menit</strong></div>
                      <div><span>Jawaban</span><strong>{answeredCount}</strong></div>
                    </div>
                    <button type="button" className="dashboard-primary-action user-tryout-finish-button" onClick={() => void finishTryoutSession()} disabled={isFinishing}>
                      {isFinishing ? 'Menutup...' : 'Kumpulkan Jawaban'}
                    </button>
                  </article>
                </aside>
              </section>
            </section>
          ) : null}

          {resultData && resultData.session?.is_finished ? (
            <section className="user-tryout-result-shell">
              <article className="dashboard-panel-card user-tryout-result-hero">
                <div className="dashboard-panel-head">
                  <h3>Hasil Tryout</h3>
                  <span>Selesai</span>
                </div>
                <div className="user-tryout-score-grid">
                  {[
                    { label: 'TWK', value: resultData.session.score_twk, icon: '🏛️', accent: 'green' },
                    { label: 'TIU', value: resultData.session.score_tiu, icon: '🧠', accent: 'purple' },
                    { label: 'TKP', value: resultData.session.score_tkp, icon: '🤝', accent: 'orange' },
                    { label: 'Total', value: resultData.session.score_total, icon: '🏆', accent: 'total' },
                  ].map((card) => (
                    <div className={`user-tryout-score-card ${card.accent}`} key={card.label}>
                      <div className="user-tryout-score-icon" aria-hidden="true">{card.icon}</div>
                      <div className="user-tryout-score-copy">
                        <span>{card.label}</span>
                        <strong>{card.value}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="dashboard-panel-card">
                <div className="dashboard-panel-head">
                  <h3>Review Jawaban</h3>
                  <span>{resultData.questions.length} SOAL</span>
                </div>
                <div className="user-tryout-review-list">
                  {resultData.questions.map((question, index) => {
                    const isTkpQuestion = Number(question.question_group) === 3
                    const statusClass = isTkpQuestion ? 'tkp' : (question.is_correct ? 'correct' : 'wrong')
                    const statusLabel = isTkpQuestion ? `Nilai ${question.score_obtained ?? 0}` : (question.is_correct ? 'Benar' : 'Salah')
                    const isExpanded = !isTkpQuestion && expandedReviewIds.has(question.id)
                    const correctOptionIndex = question.options.findIndex((option) => option.id === question.correct_option_id)
                    const correctOption = correctOptionIndex >= 0 ? question.options[correctOptionIndex] : null
                    const correctOptionLetter = correctOptionIndex >= 0 ? String.fromCharCode(65 + correctOptionIndex) : null

                    return (
                      <div className={`user-tryout-review-item ${statusClass}${isExpanded ? ' expanded' : ''}`} key={question.id}>
                        <button
                          type="button"
                          className="user-tryout-review-item-head"
                          aria-expanded={isExpanded}
                          disabled={isTkpQuestion}
                          onClick={() => toggleReviewExpanded(question.id)}
                        >
                          <span>{index + 1}</span>
                          <div>
                            <strong>
                              {question.istext ? <RichText text={question.question} /> : (
                                <span className="user-tryout-review-image-chip">🖼 Soal Bergambar</span>
                              )}
                            </strong>
                            <p>{question.question_group_label}</p>
                          </div>
                          <em>{statusLabel}</em>
                          {isTkpQuestion ? null : <i className="user-tryout-review-chevron" aria-hidden="true">⌄</i>}
                        </button>

                        {isExpanded ? (
                          <div className="user-tryout-review-pembahasan">
                            {question.image_url ? (
                              <div className="user-tryout-review-image-wrap">
                                <strong>Soal</strong>
                                <img className="user-tryout-review-image" src={question.image_url} alt={`Gambar soal ${index + 1}`} />
                              </div>
                            ) : null}
                            <strong>Jawaban Benar</strong>
                            {correctOption ? (
                              !correctOption.istext && correctOption.image_url ? (
                                <div className="user-tryout-review-answer-image-wrap">
                                  <span className="user-tryout-review-answer-letter">Opsi {correctOptionLetter}</span>
                                  <img className="user-tryout-review-answer-image" src={correctOption.image_url} alt={`Gambar jawaban benar opsi ${correctOptionLetter}`} />
                                </div>
                              ) : (
                                <p>{correctOptionLetter}. <RichText text={correctOption.choise} /></p>
                              )
                            ) : (
                              <p>Jawaban benar tidak tersedia untuk soal ini.</p>
                            )}
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
                <div className="user-tryout-result-actions">
                  {isAdminSandbox ? null : (
                    <button type="button" className="dashboard-secondary-action" onClick={() => { setTryoutData(null); setResultData(null); setAnswerMap({}); setCurrentQuestionIndex(0); }}>
                      Kembali ke Paket
                    </button>
                  )}
                  <button type="button" className="dashboard-primary-action" onClick={() => navigate(tryoutDashboardPath, { state: { user } })}>
                    {tryoutDashboardLabel}
                  </button>
                </div>
              </article>
            </section>
          ) : null}

          {!tryoutData && !tryoutLoading ? (
            <>
              <section className="user-tryout-hero-card user-tryout-hero-card-ref">
                <div className="user-tryout-hero-copy">
                  <div className="dashboard-status-pill success user-tryout-hero-pill">Simulasi Tryout</div>
                  <h2>Latihan CAT dengan alur yang mendekati ujian asli.</h2>
                  <p>Pilih paket tryout, mulai sesi, dan kerjakan soal dengan timer yang berjalan otomatis.</p>

                  <div className="user-tryout-hero-stats user-tryout-hero-stats-ref">
                    {packageStats.map((item) => (
                      <article className={`user-tryout-stat-card ${item.tone}`} key={item.label}>
                        <span className={`user-tryout-stat-icon ${item.tone}`} aria-hidden="true">{item.icon}</span>
                        <div>
                          <strong>{item.label}</strong>
                          <b>{item.value}</b>
                          <small>{item.description}</small>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="user-tryout-hero-art" aria-hidden="true">
                  <div className="user-tryout-art-cloud one" />
                  <div className="user-tryout-art-cloud two" />
                  <div className="user-tryout-art-monitor">
                    <span className="line" />
                    <span className="line short" />
                    <span className="line tiny" />
                    <i className="dot" />
                  </div>
                  <div className="user-tryout-art-base" />
                  <div className="user-tryout-art-clock">
                    <span className="hand hour" />
                    <span className="hand minute" />
                  </div>
                </div>
              </section>

              <section className="user-tryout-toolbar">
                <div className="user-tryout-toolbar-left">
                  <section className="user-tryout-filter-row">
                    {['ALL', 'CPNS', 'PPPK'].map((category) => (
                      <button
                        key={category}
                        type="button"
                        className={`user-tryout-filter-pill${selectedCategory === category ? ' active' : ''}`}
                        onClick={() => setSelectedCategory(category)}
                      >
                        {category === 'ALL' ? 'Semua Paket' : category}
                      </button>
                    ))}
                  </section>

                  <section className="user-tryout-type-row" aria-label="Pilih jenis tryout">
                    {['SKD', 'SKB'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={`user-tryout-type-pill${selectedTryoutType === type ? ' active' : ''}`}
                        onClick={() => setSelectedTryoutType(type)}
                      >
                        {type}
                      </button>
                    ))}
                  </section>
                </div>

                <div className="user-tryout-toolbar-right">
                  <label className="user-tryout-search">
                    <span aria-hidden="true">⌕</span>
                    <input
                      type="search"
                      placeholder="Cari paket tryout..."
                      value={packageSearch}
                      onChange={(event) => setPackageSearch(event.target.value)}
                    />
                  </label>

                  <div className="user-tryout-layout-toggle" role="group" aria-label="Ubah tampilan paket">
                    <button
                      type="button"
                      className={packageLayout === 'grid' ? 'active' : ''}
                      onClick={() => setPackageLayout('grid')}
                      aria-pressed={packageLayout === 'grid'}
                    >
                      ⊞
                    </button>
                    <button
                      type="button"
                      className={packageLayout === 'list' ? 'active' : ''}
                      onClick={() => setPackageLayout('list')}
                      aria-pressed={packageLayout === 'list'}
                    >
                      ☰
                    </button>
                  </div>
                </div>
              </section>

              {!packageLoading && packageRows.length === 0 ? (
                <MaterialEmptyState
                  title="Belum ada paket tryout yang bisa diakses"
                  description="Tryout akan muncul di sini setelah kamu membeli dan pembayaran paketnya berhasil dikonfirmasi."
                  actionLabel="Kembali ke Dashboard"
                  onAction={() => navigate('/dashboard-user', { state: { user } })}
                  accent="blue"
                />
              ) : null}

              <section className={`user-tryout-package-grid${packageLayout === 'list' ? ' list-view' : ''}`}>
                {packageLoading ? <div className="dashboard-alert">Memuat paket tryout...</div> : null}
                {!packageLoading && packageRows.length > 0 && filteredPackages.length === 0 ? (
                  <div className="dashboard-alert">Tidak ada paket yang cocok dengan pencarian/filter saat ini.</div>
                ) : null}
                {filteredPackages.map((item) => (
                  <article className="user-tryout-package-card" key={item.pid}>
                    <div className="user-tryout-package-card-head">
                      <div className="user-tryout-package-badge">{String(item.kategori || 'PROGRAM').toUpperCase()}</div>
                      <button type="button" className="user-tryout-bookmark" aria-label="Simpan paket">🔖</button>
                    </div>
                    <h3>{item.nama_paket}</h3>
                    <p>{item.formasi || item.jadwal || item.ket || 'Paket tryout siap dikerjakan.'}</p>
                    <div className="user-tryout-package-meta-grid">
                      <div>
                        <span>Jenis</span>
                        <strong>{item.kategori || '-'}</strong>
                      </div>
                      <div>
                        <span>Jadwal</span>
                        <strong>{item.jadwal || 'Fleksibel'}</strong>
                      </div>
                      <div>
                        <span>Level</span>
                        <strong>{item.formasi || 'Dasar'}</strong>
                      </div>
                    </div>
                    <div className="user-tryout-package-action-row">
                      <strong>{formatCurrency(item.harga)}</strong>
                      <button
                        type="button"
                        className="dashboard-primary-action user-tryout-start-button"
                        onClick={() => void startTryoutSession(item)}
                        disabled={startingPackageId !== null && startingPackageId !== item.pid}
                      >
                        {startingPackageId === item.pid ? 'Memulai...' : `Mulai ${selectedTryoutType}`}
                      </button>
                    </div>
                  </article>
                ))}
              </section>

              <section className="user-tryout-info-banner">
                <div className="user-tryout-info-banner-copy">
                  <div className="user-tryout-info-icon" aria-hidden="true">i</div>
                  <div>
                    <strong>Informasi</strong>
                    <p>Tryout akan berjalan dengan timer otomatis dan tidak dapat dijeda. Pastikan koneksi internet stabil sebelum memulai.</p>
                  </div>
                </div>
                <div className="user-tryout-info-banner-art" aria-hidden="true" />
              </section>
            </>
          ) : null}

          <AdminLogoutModal
            open={showLogoutConfirm}
            onCancel={() => setShowLogoutConfirm(false)}
            onConfirm={confirmLogout}
            title="Keluar dari akun user?"
            message="Pastikan progres atau jawaban yang sedang dikerjakan sudah tersimpan sebelum Anda logout."
            confirmLabel="Ya, keluar"
          />
        </main>
      </div>
    </div>
  )

}
