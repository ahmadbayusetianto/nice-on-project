import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import faviconImage from '../../favicon.png'
import niceonImage from '../../niceon.png'
import './App.css'

const DEFAULT_BACKEND_URL = import.meta.env.PROD ? 'https://api.niceon.id' : 'http://127.0.0.1:8000'
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_BACKEND_URL
const AUTH_STORAGE_KEY = 'niceon.auth.user'
const ADMIN_SIDEBAR_COLLAPSED_KEY = 'niceon.admin.sidebarCollapsed'
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

function readStoredUser() {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.sessionStorage.getItem(AUTH_STORAGE_KEY)
    if (raw) return JSON.parse(raw)

    const fallbackRaw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    return fallbackRaw ? JSON.parse(fallbackRaw) : null
  } catch {
    return null
  }
}

function storeAuthUser(user) {
  if (typeof window === 'undefined') return

  const value = JSON.stringify(user ?? null)

  try {
    window.sessionStorage.setItem(AUTH_STORAGE_KEY, value)
  } catch {
    // Ignore storage failures and keep the in-memory route state.
  }

  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, value)
  } catch {
    // Ignore storage failures and keep the in-memory route state.
  }
}

function clearAuthUser() {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
    // Ignore storage failures.
  }

  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
    // Ignore storage failures.
  }
}

function readStoredAdminSidebarState() {
  if (typeof window === 'undefined') return false

  try {
    return window.localStorage.getItem(ADMIN_SIDEBAR_COLLAPSED_KEY) === 'true'
  } catch {
    return false
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function formatFileSize(bytes) {
  const value = Number(bytes || 0)
  if (value <= 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  let size = value
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${new Intl.NumberFormat('id-ID', { maximumFractionDigits: unitIndex === 0 ? 0 : 1 }).format(size)} ${units[unitIndex]}`
}

function formatAdminDate(value, options = {}) {
  if (!value) return '-'

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: options.hour === false ? undefined : '2-digit',
    minute: options.hour === false ? undefined : '2-digit',
    ...(options.hour === false ? { hour: undefined, minute: undefined } : {}),
  }).format(date)
}

function formatProfileJoinDate(value) {
  if (!value) return 'Belum tersedia'

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return 'Belum tersedia'

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatTryoutCountdown(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function formatReferenceDisplay(detail = {}) {
  const reference = String(detail.refference ?? '').trim()
  const referenceOther = String(detail.reference_other ?? '').trim()

  if (!reference) return 'Belum diisi'
  if (reference === 'Lainnya' && referenceOther) return `Lainnya: ${referenceOther}`

  return reference
}

function renderSocialBrandIcon(kind) {
  switch (kind) {
    case 'youtube':
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
          <rect x="3" y="10" width="42" height="28" rx="10" fill="currentColor" opacity="0.18" />
          <path d="M31 24.1 20 17.8v12.6l11-6.3Z" fill="currentColor" />
        </svg>
      )
    case 'instagram':
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
          <rect x="9" y="9" width="30" height="30" rx="9" fill="none" stroke="currentColor" strokeWidth="3.2" />
          <circle cx="24" cy="24" r="7.5" fill="none" stroke="currentColor" strokeWidth="3.2" />
          <circle cx="32.8" cy="15.2" r="2.2" fill="currentColor" />
        </svg>
      )
    case 'tiktok':
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
          <path d="M28 10.2c1.6 3.9 4.3 6.4 8.6 7.2v5.6c-2.7 0-5.1-.6-7.2-1.8v8.8c0 5.4-3.8 9.8-10.2 9.8-5.4 0-9.2-3.5-9.2-8.4s3.7-8.7 9.1-8.7c.8 0 1.7.1 2.5.3v5.6c-.7-.2-1.4-.4-2.2-.4-2.1 0-3.8 1.2-3.8 3.2 0 2.2 1.7 3.4 4.1 3.4 3.2 0 5.4-2.1 5.4-5.4V8h5.9c.1.7.2 1.4.3 2.2Z" fill="currentColor" />
        </svg>
      )
    case 'x':
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
          <path d="M12 11h7.7l8.6 11.4L37.9 11H42l-12.1 15.4L42 37H34.3l-9.1-12-9.5 12H6.9l12.8-16.2L12 11Z" fill="currentColor" />
        </svg>
      )
    default:
      return null
  }
}

function getFriendlyFetchError(error, fallbackMessage) {
  const message = error instanceof Error ? error.message : ''
  const normalized = message.toLowerCase()

  if (normalized.includes('failed to fetch') || normalized.includes('networkerror') || normalized.includes('load failed') || normalized.includes('fetch failed')) {
    return 'Backend tidak dapat dijangkau. Pastikan server Laravel berjalan di https://api.niceon.id.'
  }

  return message || fallbackMessage
}

const DEFAULT_FAQ_ITEMS = [
  { icon: '❓', label: 'Lorem ipsum dolor sit amet consectetur?', answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer hendrerit, tortor et feugiat mattis.' },
  { icon: '📘', label: 'Consectetur adipiscing elit sed do eiusmod?', answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer hendrerit, tortor et feugiat mattis.' },
  { icon: '💬', label: 'Tempor incididunt ut labore et dolore?', answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer hendrerit, tortor et feugiat mattis.' },
  { icon: '🎓', label: 'Magna aliqua ut enim ad minim veniam?', answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer hendrerit, tortor et feugiat mattis.' },
  { icon: '🧩', label: 'Quis nostrud exercitation ullamco laboris?', answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer hendrerit, tortor et feugiat mattis.' },
  { icon: '🛡️', label: 'Nisi ut aliquip ex ea commodo consequat?', answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer hendrerit, tortor et feugiat mattis.' },
]

function createPackageFormFromDetail(detail = {}) {
  return {
    kategori: detail.kategori ?? 'CPNS',
    formasi: detail.formasi ?? '',
    jadwal: detail.jadwal ?? '',
    nama_paket: detail.nama_paket ?? '',
    harga: detail.harga !== undefined && detail.harga !== null ? String(detail.harga) : '',
    ket: detail.ket ?? '',
  }
}

function createMaterialFormFromDetail(detail = {}) {
  return {
    package_id: detail.package_id !== undefined && detail.package_id !== null ? String(detail.package_id) : '',
    judul: detail.judul ?? '',
    deskripsi: detail.deskripsi ?? '',
    sort_order: detail.sort_order !== undefined && detail.sort_order !== null ? String(detail.sort_order) : '0',
    is_published: Boolean(detail.status_key ? detail.status_key === 'published' : detail.is_published !== false),
    file: null,
    file_label: detail.original_name ?? '',
  }
}

function createQuestionOptionForm(index = 0, option = {}) {
  return {
    key: option.id ?? `option-${Date.now()}-${index}`,
    choise: option.choise ?? '',
    answer: Boolean(option.answer),
    istext: option.istext !== undefined ? Boolean(option.istext) : true,
  }
}

function createQuestionFormFromDetail(detail = {}) {
  const normalizedType = String(detail.question_type ?? 'SKD').toUpperCase() === 'SINGLE'
    ? 'SKD'
    : String(detail.question_type ?? 'SKD').toUpperCase() === 'SKB'
      ? 'SKB'
      : 'SKD'

  const options = Array.isArray(detail.options) && detail.options.length
    ? detail.options.map((option, index) => createQuestionOptionForm(index, option))
    : [
      createQuestionOptionForm(0, { answer: true }),
      createQuestionOptionForm(1),
      createQuestionOptionForm(2),
      createQuestionOptionForm(3),
      createQuestionOptionForm(4),
    ]

  while (options.length < 5) {
    options.push(createQuestionOptionForm(options.length, { answer: options.length === 0 }))
  }

  if (!options.some((option) => option.answer) && options.length) {
    options[0].answer = true
  }

  return {
    question: detail.question ?? '',
    question_type: normalizedType,
    question_group: Number(detail.question_group ?? 1),
    istext: detail.istext !== undefined ? Boolean(detail.istext) : true,
    information: detail.information ?? '',
    pembahasan: detail.pembahasan ?? '',
    options,
  }
}

function normalizeQuestionOptions(options = []) {
  return options
    .map((option) => ({
      choise: String(option.choise ?? '').trim(),
      answer: Boolean(option.answer),
      istext: Boolean(option.istext),
    }))
    .filter((option) => option.choise !== '')
}

function formatQuestionGroupLabel(group) {
  switch (Number(group)) {
    case 1:
      return 'TWK'
    case 2:
      return 'TIU'
    case 3:
      return 'TKP'
    default:
      return 'Unknown'
  }
}

function formatQuestionTypeLabel(type) {
  const normalized = String(type || 'SKD').toUpperCase()
  if (normalized === 'SINGLE' || normalized === 'SKD') return 'SKD'
  if (normalized === 'SKB') return 'SKB'
  return normalized || '-'
}

function createParameterFormFromDetail(detail = {}) {
  return {
    kode: detail.kode ?? '',
    nama: detail.nama ?? '',
    kategori: detail.kategori ?? 'Aplikasi',
    nilai: detail.nilai ?? '',
    tipe: detail.tipe ?? 'text',
    deskripsi: detail.deskripsi ?? '',
    is_active: Boolean(detail.status_key ? detail.status_key === 'active' : detail.status !== 'Nonaktif'),
  }
}

function createFaqFormFromDetail(detail = {}) {
  return {
    kategori: detail.kategori ?? 'Umum',
    pertanyaan: detail.pertanyaan ?? '',
    jawaban: detail.jawaban ?? '',
    ikon: detail.ikon ?? '❓',
    urutan: detail.urutan !== undefined && detail.urutan !== null ? String(detail.urutan) : '0',
    is_active: Boolean(detail.status_key ? detail.status_key === 'active' : detail.status !== 'Nonaktif'),
  }
}

function sanitizeFaqHtml(input = '') {
  if (typeof window === 'undefined') return String(input ?? '')

  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${String(input ?? '')}</div>`, 'text/html')
  const root = doc.body.firstElementChild
  if (!root) return ''

  const blockedTags = new Set(['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta'])

  const walk = (node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node
      const tagName = element.tagName.toLowerCase()

      if (blockedTags.has(tagName)) {
        element.remove()
        return
      }

      Array.from(element.attributes).forEach((attribute) => {
        const name = attribute.name.toLowerCase()
        if (name.startsWith('on') || name === 'style') {
          element.removeAttribute(attribute.name)
        }

        if (tagName !== 'a' && (name === 'href' || name === 'target' || name === 'rel')) {
          element.removeAttribute(attribute.name)
        }
      })

      if (tagName === 'a') {
        const href = element.getAttribute('href') || '#'
        if (!/^https?:\/\//i.test(href) && !href.startsWith('#') && !href.startsWith('/')) {
          element.setAttribute('href', '#')
        }
        element.setAttribute('rel', 'noreferrer noopener')
        if (!element.getAttribute('target')) {
          element.setAttribute('target', '_blank')
        }
      }
    }

    Array.from(node.childNodes).forEach((child) => walk(child))
  }

  walk(root)
  return root.innerHTML
}

function stripFaqHtml(input = '') {
  return String(input ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseCurrencyToNumber(value) {
  const normalized = String(value ?? '')
    .replace(/[^\d]/g, '')
    .trim()

  return normalized ? Number(normalized) : ''
}

function formatParameterValue(detail = {}) {
  const type = String(detail.tipe ?? 'text')
  const value = String(detail.nilai ?? '')

  if (type === 'boolean') {
    return value === '1' || value.toLowerCase() === 'true' ? 'Aktif' : 'Nonaktif'
  }

  return value || '-'
}

function AdminTopbar({
  title,
  searchPlaceholder,
  currentDateLabel,
  displayName,
  profileRoleLabel = 'Super Admin',
  profileUser,
  onToggleSidebar,
  isSidebarCollapsed,
  showSearch = true,
  onHomeClick,
  onResumeProfile,
  onLogout,
}) {
  const profileMenuRef = useRef(null)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false)
      }
    }

    window.addEventListener('mousedown', handleOutsideClick)
    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('mousedown', handleOutsideClick)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const profileInitials = (displayName || 'AB')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'AB'

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-left">
        <button
          type="button"
          className="admin-menu-button"
          aria-label={isSidebarCollapsed ? 'Tampilkan menu' : 'Sembunyikan menu'}
          onClick={onToggleSidebar}
        >
          ☰
        </button>
        <h1>{title}</h1>
      </div>

      <div className="admin-topbar-right">
        <button type="button" className="admin-home-button" aria-label="Beranda" onClick={onHomeClick}>
          🏠
        </button>
        {showSearch ? (
          <label className="admin-search">
            <span aria-hidden="true">⌕</span>
            <input type="search" placeholder={searchPlaceholder} />
            <kbd>⌘K</kbd>
          </label>
        ) : null}

        <button type="button" className="admin-notification-button" aria-label="Notifikasi">
          🔔
          <span className="admin-notification-badge">3</span>
        </button>

        <button type="button" className="admin-date-chip">
          <span aria-hidden="true">📅</span>
          <span>{currentDateLabel}</span>
          <span aria-hidden="true">⌄</span>
        </button>

        <div className="dashboard-profile-menu-wrap admin-profile-menu-wrap" ref={profileMenuRef}>
          <button
            type="button"
            className="dashboard-profile-chip admin-profile-chip"
            aria-haspopup="menu"
            aria-expanded={isProfileMenuOpen}
            onClick={() => setIsProfileMenuOpen((current) => !current)}
          >
            <span className="dashboard-profile-avatar admin-profile-avatar">{profileInitials}</span>
            <span className="dashboard-profile-copy admin-profile-copy">
              <strong>{displayName}</strong>
              <span>{profileRoleLabel}</span>
            </span>
            <span aria-hidden="true">⌄</span>
          </button>

          {isProfileMenuOpen ? (
            <div className="dashboard-profile-dropdown" role="menu" aria-label="Menu akun admin">
              <button
                type="button"
                className="dashboard-profile-dropdown-item"
                role="menuitem"
                onClick={() => {
                  setIsProfileMenuOpen(false)
                  onResumeProfile?.(profileUser)
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
                  onLogout?.()
                }}
              >
                <span className="dashboard-profile-dropdown-label">Logout</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}

function AdminBrandBlock({ isCollapsed }) {
  return (
    <div className="admin-brand-block">
      <Link to="/" className="admin-brand-link" aria-label="Beranda Nice On">
        <div className="admin-brand-logo-shell">
          <img src={niceonImage} alt="Nice On" className="admin-brand-logo" />
        </div>
        <div className={`admin-brand-copy${isCollapsed ? ' collapsed' : ''}`}>
          <strong>Admin Panel</strong>
          <span>Learning Hub</span>
        </div>
      </Link>
    </div>
  )
}

function AdminSystemMenu({ currentPath, navigate }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(() => currentPath.startsWith('/dashboard-admin/settings'))

  const settingsItems = [
    { label: 'Parameter', href: '/dashboard-admin/settings/parameters' },
    { label: 'FAQ', href: '/dashboard-admin/settings/faqs' },
    { label: 'Kategori', href: '#' },
    { label: 'Metode Pembayaran', href: '#' },
    { label: 'Notifikasi', href: '#' },
  ]

  const systemItems = [
    { label: 'Admin', href: '#' },
    { label: 'Log Aktivitas', href: '#' },
  ]

  const isSettingsActive = currentPath.startsWith('/dashboard-admin/settings')

  return (
    <>
      <div className="admin-sidebar-group-label">System</div>
      <div className="admin-system-menu">
        <button
          type="button"
          className={`admin-system-parent${isSettingsOpen || isSettingsActive ? ' active' : ''}`}
          onClick={() => setIsSettingsOpen((current) => !current)}
          aria-expanded={isSettingsOpen}
        >
          <span className="admin-sidebar-icon" aria-hidden="true">P</span>
          <span>Pengaturan</span>
          <span className="admin-system-parent-indicator" aria-hidden="true">{isSettingsOpen ? '▴' : '▾'}</span>
        </button>

        {isSettingsOpen ? (
          <div className="admin-system-submenu" aria-label="Submenu pengaturan admin">
            {settingsItems.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`admin-system-subitem${currentPath === item.href ? ' active' : ''}`}
                onClick={() => item.href !== '#' && navigate(item.href)}
              >
                <span className="admin-system-subitem-icon" aria-hidden="true">•</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ) : null}

        <nav className="admin-sidebar-nav admin-system-nav" aria-label="Menu sistem admin">
          {systemItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`admin-sidebar-item${currentPath === item.href ? ' active' : ''}`}
              onClick={() => item.href !== '#' && navigate(item.href)}
            >
              <span className="admin-sidebar-icon" aria-hidden="true">{item.label.slice(0, 1)}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  )
}

function AdminUserMenu({ profileUser, displayName, onResumeProfile, onLogout }) {
  const profileInitials = (displayName || 'AD')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'AD'

  return (
    <div className="admin-user-menu-wrap">
      <div className="admin-sidebar-group-label">Akun</div>
      <div className="admin-sidebar-footer-card admin-user-menu-card">
        <div className="admin-sidebar-user">
          <div className="admin-sidebar-avatar admin-sidebar-avatar-admin" aria-hidden="true">{profileInitials}</div>
          <div className="admin-sidebar-user-copy">
            <strong>{displayName || 'Admin'}</strong>
            <span>{profileUser?.email || 'Akun admin'}</span>
          </div>
        </div>

        <button type="button" className="admin-sidebar-logout" onClick={onLogout}>
          <span aria-hidden="true">⎋</span>
          <span>Keluar Akun</span>
        </button>
      </div>
    </div>
  )
}

function UserSidebar({ currentPath, isCollapsed, onToggleCollapsed, navigate, user, displayName, isProfileComplete, onLogout }) {
  const profileInitials = (displayName || 'US')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'US'

  const sidebarItems = [
    { label: 'Dashboard', href: '/dashboard-user' },
    { label: 'Materi', href: '/dashboard-user/materials' },
    { label: 'Tryout', href: '/dashboard-user/tryout' },
    { label: 'Jadwal', href: '#' },
    { label: 'Bantuan', href: '#' },
  ]

  return (
    <aside className={`dashboard-sidebar dashboard-sidebar-v2${isCollapsed ? ' sidebar-collapsed' : ''}`}>
      <div className="dashboard-sidebar-brand-row">
        <div className="dashboard-brand-lockup">
          <Link to="/" className="dashboard-brand-link" aria-label="Beranda Nice On">
            <div className="dashboard-brand-logo-shell">
              <img src={niceonImage} alt="Nice On" className="dashboard-brand-logo" />
            </div>
          </Link>
        </div>

        <button
          type="button"
          className="dashboard-sidebar-collapse"
          aria-label={isCollapsed ? 'Tampilkan sidebar' : 'Sembunyikan sidebar'}
          onClick={onToggleCollapsed}
        >
          {isCollapsed ? '»' : '«'}
        </button>
      </div>

      <nav className="dashboard-nav" aria-label="Navigasi user">
        {sidebarItems.map((item) => (
          <button
            key={item.label}
            type="button"
            className={`dashboard-nav-item${currentPath === item.href || (item.label === 'Tryout' && currentPath.startsWith('/dashboard-user/tryout')) ? ' active' : ''}`}
            onClick={() => item.href !== '#' && navigate(item.href, { state: { user } })}
          >
            <span className="dashboard-nav-icon" aria-hidden="true">{item.label.slice(0, 1)}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="dashboard-sidebar-section-label">Akun</div>

      <div className="dashboard-account-card">
        <div className="dashboard-account-avatar">{profileInitials}</div>
        <div>
          <div className="dashboard-account-name">{displayName}</div>
          <div className="dashboard-account-meta">{user?.email ?? 'Belum tersedia'}</div>
        </div>
      </div>

      <button type="button" className="dashboard-upgrade-card" onClick={() => navigate('/complete-profile', { state: { registeredUser: user } })}>
        <strong>Tetap tingkatkan kemampuanmu!</strong>
        <p>{isProfileComplete ? 'Belajar rutin dan jaga ritme progresmu.' : 'Lengkapi profil untuk pengalaman belajar yang lebih personal.'}</p>
        <span className="dashboard-upgrade-cta">Lihat Progress</span>
      </button>

      <button type="button" className="dashboard-logout-button" onClick={onLogout} aria-label="Keluar Akun">
        <span aria-hidden="true">⎋</span>
        <span className="dashboard-button-label">Keluar Akun</span>
      </button>
    </aside>
  )
}

function AdminQuestionMenu({ currentPath, navigate }) {
  const isQuestionPage = currentPath.startsWith('/dashboard-admin/questions')

  return (
    <div className="admin-question-menu-wrap">
      <button
        type="button"
        className={`admin-question-parent${isQuestionPage ? ' active' : ''}`}
        onClick={() => navigate('/dashboard-admin/questions')}
        aria-label="Buka Bank Soal"
      >
        <span className="admin-sidebar-icon" aria-hidden="true">Q</span>
        <span className="admin-question-parent-label">Bank Soal</span>
        <span className="admin-system-parent-indicator" aria-hidden="true">›</span>
      </button>
    </div>
  )
}

function AdminLogoutModal({ open, onCancel, onConfirm, title = 'Keluar dari akun?', message = 'Pastikan semua pekerjaan sudah disimpan sebelum Anda logout.', confirmLabel = 'Ya, keluar' }) {
  if (!open) return null

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onCancel}>
      <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="adminLogoutTitle" onClick={(event) => event.stopPropagation()}>
        <div className="admin-modal-icon" aria-hidden="true">!</div>
        <h3 id="adminLogoutTitle">{title}</h3>
        <p>{message}</p>
        <div className="admin-modal-actions">
          <button type="button" className="admin-modal-button secondary" onClick={onCancel}>Batal</button>
          <button type="button" className="admin-modal-button primary" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

function AdminPackageFormModal({ open, onCancel, onSubmit, form, onFieldChange, loading, error, title = 'Tambah Paket', submitLabel = 'Simpan Paket', helpText = 'Isi data paket sesuai kolom yang tersedia di tabel paket.' }) {
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

function AdminParameterFormModal({ open, onCancel, onSubmit, form, onFieldChange, loading, error, title = 'Tambah Parameter', submitLabel = 'Simpan Parameter', helpText = 'Atur nilai parameter aplikasi yang dipakai oleh sistem.' }) {
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

function AdminFaqFormModal({ open, onCancel, onSubmit, form, onFieldChange, loading, error, title = 'Tambah FAQ', submitLabel = 'Simpan FAQ', helpText = 'Kelola pertanyaan dan jawaban yang tampil di landing page.' }) {
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

function PackageInfoModal({ open, packageData, onCancel }) {
  useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  if (!open || !packageData) return null

  const title = packageData.nama_paket || packageData.name || 'Keterangan Paket'
  const description = String(packageData.ket || packageData.desc || '').trim() || 'Belum ada keterangan.'

  return (
    <div className="package-info-backdrop" role="presentation" onClick={onCancel}>
      <div className="package-info-modal" role="dialog" aria-modal="true" aria-labelledby="packageInfoTitle" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="package-info-close" aria-label="Tutup keterangan paket" onClick={onCancel}>×</button>
        <div className="package-info-content">
          <div className="package-info-icon" aria-hidden="true">i</div>
          <div className="package-info-copy">
            <h3 id="packageInfoTitle">{title}</h3>
            <p className="package-info-text">{description}</p>
          </div>
        </div>
        <div className="package-info-footer">
          <button type="button" className="package-info-action" onClick={onCancel}>
            <span>Tutup</span>
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function MaintenanceModal({ open, onCancel }) {
  useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="package-info-backdrop" role="presentation" onClick={onCancel}>
      <div className="package-info-modal maintenance-modal" role="dialog" aria-modal="true" aria-labelledby="maintenanceTitle" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="package-info-close" aria-label="Tutup informasi" onClick={onCancel}>×</button>
        <div className="package-info-content maintenance-modal-content">
          <div className="package-info-icon maintenance-icon" aria-hidden="true">🛠️</div>
          <div className="package-info-copy">
            <h3 id="maintenanceTitle">Under maintenance</h3>
            <p className="package-info-text">Fitur ini sedang dalam perbaikan. Silakan coba lagi nanti.</p>
          </div>
        </div>
        <div className="package-info-footer">
          <button type="button" className="package-info-action" onClick={onCancel}>
            <span>Tutup</span>
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function AdminQuestionFormModal({
  open,
  onCancel,
  onSubmit,
  form,
  onFieldChange,
  onOptionChange,
  onAddOption,
  onRemoveOption,
  onSetCorrectOption,
  onResetForm,
  loading,
  error,
  title = 'Tambah Soal',
  submitLabel = 'Simpan Soal',
  helpText = 'Kelola soal CAT dengan opsi jawaban yang dapat ditambah atau dihapus secara dinamis.',
  mode = 'create',
}) {
  if (!open) return null

  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const questionCount = String(form.question || '').length
  const informationCount = String(form.information || '').length
  const pembahasanCount = String(form.pembahasan || '').length

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onCancel}>
      <div className="admin-modal admin-question-modal" role="dialog" aria-modal="true" aria-labelledby="adminQuestionTitle" onClick={(event) => event.stopPropagation()}>
        <div className="admin-question-modal-header">
          <div className="admin-question-title-block">
            <div className="admin-question-title-icon" aria-hidden="true">✎</div>
            <div className="admin-question-title-copy">
              <h3 id="adminQuestionTitle">{title}</h3>
              <p>{helpText}</p>
            </div>
          </div>
          <button type="button" className="admin-question-close" aria-label="Tutup form soal" onClick={onCancel} disabled={loading}>×</button>
        </div>

        {loading ? <div className="admin-package-form-loading">Memuat data soal...</div> : null}
        {error ? <div className="admin-package-form-error">{error}</div> : null}

        <form className="admin-question-form" id="adminQuestionForm" onSubmit={onSubmit}>
          <div className="admin-question-form-layout">
            <section className="admin-question-panel admin-question-panel-left">
              <div className="admin-question-panel-head">
                <div>
                  <h4>Informasi Soal</h4>
                  <p>Isi data utama soal sebelum menambahkan opsi jawaban.</p>
                </div>
              </div>

              <div className="admin-question-field-group">
                <label className="admin-question-field admin-question-field-full">
                  <span>Tulis pertanyaan <sup>*</sup></span>
                  <div className="admin-question-editor-shell">
                    <div className="admin-question-editor-toolbar" aria-hidden="true">
                      <span>B</span>
                      <span>I</span>
                      <span>U</span>
                      <span>≡</span>
                      <span>≣</span>
                      <span>↗</span>
                      <span>▢</span>
                      <span>Tx</span>
                    </div>
                    <textarea
                      value={form.question}
                      onChange={(event) => onFieldChange('question', event.target.value)}
                      placeholder={form.istext ? 'Ketik atau tempel pertanyaan di sini...' : 'Nama file gambar soal'}
                      disabled={loading}
                      rows={7}
                    />
                    <div className="admin-question-counter">{questionCount}/2000</div>
                  </div>
                </label>

                <div className="admin-question-field-row">
                  <label className="admin-question-field">
                    <span>Grup Soal <sup>*</sup></span>
                    <select value={form.question_group} onChange={(event) => onFieldChange('question_group', Number(event.target.value))} disabled={loading}>
                      <option value={1}>TWK</option>
                      <option value={2}>TIU</option>
                      <option value={3}>TKP</option>
                    </select>
                  </label>

                  <label className="admin-question-field">
                    <span>Tipe Soal <sup>*</sup></span>
                    <select value={form.question_type} onChange={(event) => onFieldChange('question_type', event.target.value)} disabled={loading}>
                      <option value="SKD">SKD</option>
                      <option value="SKB">SKB</option>
                    </select>
                  </label>
                </div>

                <label className="admin-question-field admin-question-field-full">
                  <span>Jenis Soal <sup>*</sup></span>
                  <div className="admin-question-jenis-toggle">
                    <button
                      type="button"
                      className={`admin-question-jenis-option${form.istext ? ' active' : ''}`}
                      onClick={() => onFieldChange('istext', true)}
                      disabled={loading}
                    >
                      <span aria-hidden="true">T</span>
                      <strong>Teks</strong>
                    </button>
                    <button
                      type="button"
                      className={`admin-question-jenis-option${!form.istext ? ' active' : ''}`}
                      onClick={() => onFieldChange('istext', false)}
                      disabled={loading}
                    >
                      <span aria-hidden="true">◫</span>
                      <strong>Gambar</strong>
                    </button>
                  </div>
                </label>

                <label className="admin-question-field admin-question-field-full">
                  <span>Informasi Tambahan (Opsional)</span>
                  <div className="admin-question-editor-shell compact">
                    <textarea
                      value={form.information}
                      onChange={(event) => onFieldChange('information', event.target.value)}
                      placeholder="Contoh: sumber, tingkat kesulitan, konteks, dll."
                      disabled={loading}
                      rows={4}
                    />
                    <div className="admin-question-counter">{informationCount}/500</div>
                  </div>
                </label>

                <label className="admin-question-field admin-question-field-full">
                  <span>Pembahasan (Opsional)</span>
                  <div className="admin-question-editor-shell">
                    <div className="admin-question-editor-toolbar" aria-hidden="true">
                      <span>B</span>
                      <span>I</span>
                      <span>U</span>
                      <span>≡</span>
                      <span>≣</span>
                      <span>↗</span>
                      <span>▢</span>
                      <span>&lt;/&gt;</span>
                    </div>
                    <textarea
                      value={form.pembahasan}
                      onChange={(event) => onFieldChange('pembahasan', event.target.value)}
                      placeholder="Tulis pembahasan soal..."
                      disabled={loading}
                      rows={7}
                    />
                    <div className="admin-question-counter">{pembahasanCount}/2000</div>
                  </div>
                </label>

                <div className="admin-question-status-row">
                  <span>Status Soal</span>
                  <div className="admin-question-status-toggle">
                    <button type="button" className="active" disabled={loading}>
                      <span className="admin-question-status-dot" />
                      Aktif
                    </button>
                    <button type="button" disabled={loading}>
                      <span className="admin-question-status-dot" />
                      Nonaktif
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="admin-question-panel admin-question-panel-right">
              <div className="admin-question-panel-head admin-question-panel-head-space">
                <div>
                  <h4>Opsi Jawaban</h4>
                  <p>Minimal 2 opsi, pilih 1 jawaban benar.</p>
                </div>
                <button type="button" className="admin-outline-action admin-question-add-option" onClick={onAddOption} disabled={loading}>＋ Tambah Opsi</button>
              </div>

              <div className="admin-question-options-list">
                {form.options.map((option, index) => (
                  <div className="admin-question-option-row rich" key={option.key}>
                    <div className="admin-question-option-badge">{optionLabels[index] || index + 1}</div>

                    <div className="admin-question-option-editor">
                      <div className="admin-question-option-toolbar" aria-hidden="true">
                        <span>B</span>
                        <span>I</span>
                        <span>U</span>
                        <span>≡</span>
                        <span>≣</span>
                      </div>
                      <textarea
                        value={option.choise}
                        onChange={(event) => onOptionChange(index, 'choise', event.target.value)}
                        placeholder={`Tulis opsi jawaban ${optionLabels[index] || index + 1}`}
                        disabled={loading}
                        rows={2}
                      />
                    </div>

                    <label className={`admin-question-option-correct${option.answer ? ' active' : ''}`}>
                      <input
                        type="radio"
                        name="correctOption"
                        checked={option.answer}
                        onChange={() => onSetCorrectOption(index)}
                        disabled={loading}
                      />
                      <span>Jawaban benar</span>
                    </label>

                    <button
                      type="button"
                      className="admin-question-option-remove"
                      onClick={() => onRemoveOption(index)}
                      disabled={loading || form.options.length <= 2}
                      title="Hapus opsi"
                      aria-label="Hapus opsi"
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>

              <div className="admin-question-upload-box" aria-label="Tambah gambar opsional">
                <div className="admin-question-upload-icon" aria-hidden="true">☁</div>
                <strong>Tambah gambar (opsional)</strong>
                <p>Format: JPG, PNG. Maks 2MB</p>
              </div>
            </section>
          </div>

          <div className="admin-question-modal-footer">
            <button type="button" className="admin-outline-action" onClick={() => onResetForm?.()} disabled={loading}>Reset</button>
            <button type="button" className="admin-modal-button secondary" onClick={onCancel} disabled={loading}>Batal</button>
            <button type="submit" className="admin-modal-button secondary admin-question-submit-alt" disabled={loading} value="save-add">Simpan & Tambah Lagi</button>
            <button type="submit" className="admin-modal-button primary" disabled={loading} value="save">{loading ? 'Menyimpan...' : submitLabel}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AdminQuestionDetailModal({ open, question, onCancel, onEdit, onDelete, onRestore }) {
  if (!open || !question) return null

  const isTrashed = Boolean(question.deleted_at)
  const detailCards = [
    { label: 'Grup Soal', value: question.question_group_label, tone: 'orange', icon: '📁' },
    { label: 'Tipe Soal', value: formatQuestionTypeLabel(question.question_type), tone: 'blue', icon: '🎯' },
    { label: 'Jenis Soal', value: question.istext ? 'Teks' : 'Gambar', tone: 'green', icon: 'T' },
    { label: 'Jumlah Opsi', value: String(question.options_count || (question.options || []).length || 0), tone: 'purple', icon: '≣' },
  ]

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="admin-modal admin-question-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="adminQuestionDetailTitle"
        onClick={(event) => event.stopPropagation()}
        >
        <div className="admin-question-detail-header">
          <div className="admin-question-detail-title-block">
            <div>
              <h3 id="adminQuestionDetailTitle">Detail Soal</h3>
              <p>Lihat detail informasi soal secara lengkap.</p>
            </div>
          </div>
          <div className="admin-question-detail-header-actions">
            <button type="button" className="admin-outline-action admin-question-detail-edit" onClick={onEdit}>✎ Edit Soal</button>
            {isTrashed ? (
              <button type="button" className="admin-primary-action admin-question-detail-restore" onClick={onRestore}>↺ Pulihkan</button>
            ) : (
              <button type="button" className="admin-danger-action admin-question-detail-delete" onClick={onDelete}>🗑 Hapus Soal</button>
            )}
            <button type="button" className="admin-question-close" aria-label="Tutup detail soal" onClick={onCancel}>×</button>
          </div>
        </div>
        <hr className="admin-question-detail-divider" />

        <div className="admin-question-detail-grid">
          {detailCards.map((card) => (
            <article className={`admin-question-detail-card ${card.tone}`} key={card.label}>
              <div className="admin-question-detail-card-icon" aria-hidden="true">{card.icon}</div>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </article>
          ))}
        </div>

        <div className="admin-question-detail-body">
          <div className="admin-question-detail-column left">
            <section className="admin-question-detail-section info-card">
              <div className="admin-question-detail-section-head">
                <span className="admin-question-detail-section-icon" aria-hidden="true">i</span>
                <h4>Informasi Tambahan</h4>
              </div>
              <p>{question.information || 'Tidak ada informasi tambahan.'}</p>
            </section>

            <section className="admin-question-detail-section question-card">
              <div className="admin-question-detail-section-head">
                <span className="admin-question-detail-section-icon question" aria-hidden="true">?</span>
                <h4>Pertanyaan</h4>
              </div>
              <p className="admin-question-detail-question">{question.question}</p>
            </section>

            <section className="admin-question-detail-section explanation-card">
              <div className="admin-question-detail-section-head">
                <span className="admin-question-detail-section-icon explanation" aria-hidden="true">📖</span>
                <h4>Pembahasan</h4>
              </div>
              <p>{question.pembahasan || 'Tidak ada pembahasan.'}</p>
            </section>
          </div>

          <div className="admin-question-detail-column right">
            <section className="admin-question-detail-section options-card admin-question-detail-section-options">
              <div className="admin-question-detail-section-head">
                <span className="admin-question-detail-section-icon options" aria-hidden="true">≣</span>
                <h4>Opsi Jawaban</h4>
              </div>
              <div className="admin-question-detail-options wide">
                {Array.from({ length: 5 }, (_, index) => {
                  const option = (question.options || [])[index] ?? null
                  const letter = String.fromCharCode(65 + index)

                  return (
                    <div
                      className={`admin-question-detail-option wide${option?.answer ? ' correct' : ''}${option ? '' : ' placeholder'}`}
                      key={option?.id ?? `empty-${index}`}
                    >
                      <span className="admin-question-detail-option-badge">{letter}</span>
                      <div className="admin-question-detail-option-copy wide">
                        <strong>{option?.choise || 'Belum ada opsi.'}</strong>
                      </div>
                      {option?.answer ? (
                        <span className="admin-question-detail-correct success" title="Jawaban benar" aria-label="Jawaban benar">✓</span>
                      ) : (
                        <span className="admin-question-detail-correct neutral" title="Bukan jawaban benar" aria-label="Bukan jawaban benar">○</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          </div>
        </div>

        <hr className="admin-question-detail-footer-divider" />

        <div className="admin-question-detail-footer">
          <div className="admin-question-detail-footer-meta">
            <article className="admin-question-detail-footer-card">
              <span>Dibuat oleh</span>
              <strong>{question.created_by_label || question.created_by_name || 'Admin'}</strong>
            </article>
            <article className="admin-question-detail-footer-card">
              <span>Dibuat pada</span>
              <strong>{formatAdminDate(question.created_at, { hour: false })}</strong>
            </article>
          </div>
          <button type="button" className="admin-modal-button secondary" onClick={onCancel}>Tutup</button>
        </div>
      </div>
    </div>
  )
}

function AdminQuestionManagementPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => readStoredAdminSidebarState())
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [questionRows, setQuestionRows] = useState([])
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true)
  const [questionError, setQuestionError] = useState(null)
  const [questionSearch, setQuestionSearch] = useState('')
  const [selectedQuestionGroup, setSelectedQuestionGroup] = useState('Semua Grup')
  const [selectedQuestionType, setSelectedQuestionType] = useState('Semua Tipe')
  const [selectedQuestionStatus, setSelectedQuestionStatus] = useState('Aktif')
  const [questionCurrentPage, setQuestionCurrentPage] = useState(1)
  const [questionPageSize, setQuestionPageSize] = useState(10)
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [showQuestionDetailModal, setShowQuestionDetailModal] = useState(false)
  const [questionDetail, setQuestionDetail] = useState(null)
  const [questionModalMode, setQuestionModalMode] = useState('create')
  const [editingQuestionId, setEditingQuestionId] = useState(null)
  const [questionSubmitError, setQuestionSubmitError] = useState(null)
  const [questionSubmitSuccess, setQuestionSubmitSuccess] = useState(null)
  const [isSavingQuestion, setIsSavingQuestion] = useState(false)
  const [questionForm, setQuestionForm] = useState(() => createQuestionFormFromDetail())
  const questionSuccessTimerRef = useRef(null)
  const storedUser = readStoredUser()
  const user = location.state?.user ?? storedUser

  if (!user || Number(user?.is_admin ?? 0) !== 1) {
    return <Navigate to="/login" replace state={{ from: '/dashboard-admin/questions' }} />
  }

  const currentPath = location.pathname
  const displayName = user?.email?.split('@')?.[0] || 'Admin'
  const currentDateLabel = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
    .format(new Date())
    .replace(/^./, (char) => char.toUpperCase())

  const adminMainMenu = [
    { label: 'Dashboard', href: '/dashboard-admin' },
    { label: 'User', href: '/dashboard-admin/users' },
    { label: 'Paket', href: '/dashboard-admin/packages' },
    { label: 'Materi', href: '/dashboard-admin/materials' },
    { label: 'Transaksi', href: '/dashboard-admin/transactions' },
    { label: 'Konten', href: '#' },
    { label: 'Laporan', href: '#' },
  ]

  const questionSummaryCards = [
    { label: 'Total Soal', value: String(questionRows.filter((row) => !row.deleted_at).length), delta: 'Soal aktif', accent: 'blue', icon: '📝' },
    { label: 'TWK', value: String(questionRows.filter((row) => !row.deleted_at && Number(row.question_group) === 1).length), delta: 'Grup 1', accent: 'green', icon: '🏛️' },
    { label: 'TIU', value: String(questionRows.filter((row) => !row.deleted_at && Number(row.question_group) === 2).length), delta: 'Grup 2', accent: 'purple', icon: '🧠' },
    { label: 'TKP', value: String(questionRows.filter((row) => !row.deleted_at && Number(row.question_group) === 3).length), delta: 'Grup 3', accent: 'orange', icon: '🤝' },
  ]

  const loadQuestions = async ({ cancelled = () => false, showLoading = true } = {}) => {
    if (showLoading) {
      setIsLoadingQuestions(true)
    }

    setQuestionError(null)

    try {
      const params = new URLSearchParams()
      if (questionSearch.trim()) params.set('search', questionSearch.trim())
      if (selectedQuestionGroup !== 'Semua Grup') params.set('group', selectedQuestionGroup)
      if (selectedQuestionType !== 'Semua Tipe') params.set('type', selectedQuestionType)
      if (selectedQuestionStatus !== 'Aktif') params.set('include_trashed', 'true')

      const response = await fetch(`${BACKEND_URL}/api/admin/questions${params.toString() ? `?${params.toString()}` : ''}`)
      const contentType = response.headers.get('content-type') || ''
      const rawBody = await response.text()
      const payload = contentType.includes('application/json') && rawBody ? JSON.parse(rawBody) : null

      if (!response.ok) {
        const message = payload?.message || rawBody?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || `Data soal gagal dimuat (HTTP ${response.status}).`
        throw new Error(message)
      }

      if (!cancelled()) {
        setQuestionRows(Array.isArray(payload?.data) ? payload.data : [])
      }
    } catch (error) {
      if (!cancelled()) {
        const message = getFriendlyFetchError(error, 'Data soal gagal dimuat.')
        setQuestionError(message.includes('<!DOCTYPE') ? 'Backend mengembalikan halaman HTML, periksa koneksi database/server.' : message)
      }
    } finally {
      if (showLoading && !cancelled()) {
        setIsLoadingQuestions(false)
      }
    }
  }

  useEffect(() => {
    let cancelled = false

    void loadQuestions({ cancelled: () => cancelled, showLoading: true })

    return () => {
      cancelled = true
    }
  }, [questionSearch, selectedQuestionGroup, selectedQuestionType, selectedQuestionStatus])

  const openAddQuestionModal = () => {
    if (questionSuccessTimerRef.current) {
      window.clearTimeout(questionSuccessTimerRef.current)
      questionSuccessTimerRef.current = null
    }

    setQuestionModalMode('create')
    setEditingQuestionId(null)
    setQuestionSubmitError(null)
    setQuestionSubmitSuccess(null)
    setQuestionForm(createQuestionFormFromDetail({
      question_group: selectedQuestionGroup !== 'Semua Grup' ? Number(selectedQuestionGroup) : 1,
      question_type: 'SKD',
      istext: true,
    }))
    setShowQuestionModal(true)
  }

  const resetQuestionForm = () => {
    setQuestionForm(createQuestionFormFromDetail({
      question_group: Number(questionForm.question_group) || (selectedQuestionGroup !== 'Semua Grup' ? Number(selectedQuestionGroup) : 1),
      question_type: 'SKD',
      istext: true,
    }))
    setQuestionSubmitError(null)
  }

  useEffect(() => {
    if (!location.state?.openQuestionModal) return

    openAddQuestionModal()
    navigate(location.pathname, { replace: true, state: { user } })
  }, [location.pathname, location.state, navigate, user])

  const openEditQuestionModal = async (row) => {
    if (questionSuccessTimerRef.current) {
      window.clearTimeout(questionSuccessTimerRef.current)
      questionSuccessTimerRef.current = null
    }

    setQuestionModalMode('edit')
    setEditingQuestionId(row?.id ?? null)
    setQuestionSubmitError(null)
    setQuestionSubmitSuccess(null)
    setQuestionForm(createQuestionFormFromDetail(row ?? {}))
    setShowQuestionModal(true)

    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/questions/${row?.id}`)
      const contentType = response.headers.get('content-type') || ''
      const rawBody = await response.text()
      const payload = contentType.includes('application/json') && rawBody ? JSON.parse(rawBody) : null

      if (!response.ok) {
        const message = payload?.message || rawBody?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || `Detail soal gagal dimuat (HTTP ${response.status}).`
        throw new Error(message)
      }

      setQuestionForm(createQuestionFormFromDetail(payload?.data ?? {}))
    } catch {
      // Keep modal usable even if detail fetch fails.
    }
  }

  const openQuestionDetailModal = (row) => {
    setQuestionDetail(row)
    setShowQuestionDetailModal(true)
  }

  const closeQuestionModal = () => {
    if (isSavingQuestion) return

    if (questionSuccessTimerRef.current) {
      window.clearTimeout(questionSuccessTimerRef.current)
      questionSuccessTimerRef.current = null
    }

    setShowQuestionModal(false)
    setQuestionSubmitError(null)
    setQuestionSubmitSuccess(null)
  }

  const handleQuestionFieldChange = (field, value) => {
    setQuestionForm((current) => ({
      ...current,
      [field]: field === 'question_group' ? Number(value) : value,
    }))
  }

  const handleQuestionOptionChange = (index, field, value) => {
    setQuestionForm((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => (
        optionIndex === index ? { ...option, [field]: value } : option
      )),
    }))
  }

  const handleQuestionAddOption = () => {
    setQuestionForm((current) => ({
      ...current,
      options: [...current.options, createQuestionOptionForm(current.options.length)],
    }))
  }

  const handleQuestionRemoveOption = (index) => {
    setQuestionForm((current) => {
      const nextOptions = current.options.filter((_, optionIndex) => optionIndex !== index)
      if (nextOptions.length < 2) return current
      if (!nextOptions.some((option) => option.answer) && nextOptions.length) {
        nextOptions[0] = { ...nextOptions[0], answer: true }
      }
      return { ...current, options: nextOptions }
    })
  }

  const handleQuestionSetCorrectOption = (index) => {
    setQuestionForm((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => ({
        ...option,
        answer: optionIndex === index,
      })),
    }))
  }

  const handleQuestionSubmit = async (event) => {
    event.preventDefault()
    const submitMode = String(event.nativeEvent?.submitter?.value || 'save')

    const normalizedOptions = normalizeQuestionOptions(questionForm.options)
    const isEditMode = questionModalMode === 'edit' && editingQuestionId !== null
    const shouldKeepOpenForAddMore = submitMode === 'save-add' && !isEditMode

    if (!questionForm.question.trim()) {
      setQuestionSubmitError('Isi soal wajib diisi.')
      return
    }

    if (normalizedOptions.length < 2) {
      setQuestionSubmitError('Minimal 2 opsi wajib diisi.')
      return
    }

    if (normalizedOptions.filter((option) => option.answer).length !== 1) {
      setQuestionSubmitError('Harus ada tepat 1 jawaban benar.')
      return
    }

    setIsSavingQuestion(true)
    setQuestionSubmitError(null)
    setQuestionSubmitSuccess(null)

    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/questions${isEditMode ? `/${editingQuestionId}` : ''}`, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          question: questionForm.question.trim(),
          question_type: questionForm.question_type,
          question_group: Number(questionForm.question_group),
          istext: Boolean(questionForm.istext),
          information: questionForm.information.trim(),
          pembahasan: questionForm.pembahasan.trim(),
          options: normalizedOptions,
        }),
      })

      const contentType = response.headers.get('content-type') || ''
      const rawBody = await response.text()
      const payload = contentType.includes('application/json') && rawBody ? JSON.parse(rawBody) : null

      if (!response.ok) {
        const message = payload?.message || rawBody?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || `Soal gagal disimpan (HTTP ${response.status}).`
        throw new Error(message)
      }

      setQuestionSubmitSuccess(isEditMode ? 'Soal berhasil diperbarui.' : 'Soal berhasil disimpan.')
      await loadQuestions({ cancelled: () => false, showLoading: false })

      if (questionSuccessTimerRef.current) {
        window.clearTimeout(questionSuccessTimerRef.current)
      }

      questionSuccessTimerRef.current = window.setTimeout(() => {
        setQuestionSubmitSuccess(null)
        questionSuccessTimerRef.current = null
      }, 2800)

      if (shouldKeepOpenForAddMore) {
        setQuestionForm(createQuestionFormFromDetail({
          question_group: Number(questionForm.question_group) || 1,
          question_type: 'SKD',
          istext: true,
        }))
        setShowQuestionModal(true)
        return
      }

      setShowQuestionModal(false)
      setEditingQuestionId(null)
      setQuestionForm(createQuestionFormFromDetail())
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Soal gagal disimpan.'
      setQuestionSubmitError(message)
    } finally {
      setIsSavingQuestion(false)
    }
  }

  const handleDeleteQuestion = async (row) => {
    if (!row?.id) return

    const confirmed = window.confirm(`Hapus soal ini? Soal akan disembunyikan dari daftar.`)
    if (!confirmed) return

    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/questions/${row.id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      })
      const contentType = response.headers.get('content-type') || ''
      const rawBody = await response.text()
      const payload = contentType.includes('application/json') && rawBody ? JSON.parse(rawBody) : null

      if (!response.ok) {
        const message = payload?.message || rawBody?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || `Soal gagal dihapus (HTTP ${response.status}).`
        throw new Error(message)
      }

      setShowQuestionDetailModal(false)
      setQuestionDetail(null)
      await loadQuestions({ cancelled: () => false, showLoading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Soal gagal dihapus.'
      setQuestionError(message)
    }
  }

  const handleRestoreQuestion = async (row) => {
    if (!row?.id) return

    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/questions/${row.id}/restore`, {
        method: 'PATCH',
        headers: { Accept: 'application/json' },
      })
      const contentType = response.headers.get('content-type') || ''
      const rawBody = await response.text()
      const payload = contentType.includes('application/json') && rawBody ? JSON.parse(rawBody) : null

      if (!response.ok) {
        const message = payload?.message || rawBody?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || `Soal gagal dipulihkan (HTTP ${response.status}).`
        throw new Error(message)
      }

      setShowQuestionDetailModal(false)
      setQuestionDetail(null)
      await loadQuestions({ cancelled: () => false, showLoading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Soal gagal dipulihkan.'
      setQuestionError(message)
    }
  }

  useEffect(() => {
    return () => {
      if (questionSuccessTimerRef.current) {
        window.clearTimeout(questionSuccessTimerRef.current)
      }
    }
  }, [])

  const visibleQuestionRows = questionRows.filter((row) => {
    const search = questionSearch.trim().toLowerCase()
    const status = row.deleted_at ? 'terhapus' : 'aktif'

    if (selectedQuestionStatus === 'Aktif' && status !== 'aktif') return false
    if (selectedQuestionStatus === 'Terhapus' && status !== 'terhapus') return false

    if (selectedQuestionGroup !== 'Semua Grup' && Number(row.question_group) !== Number(selectedQuestionGroup)) {
      return false
    }

    if (selectedQuestionType !== 'Semua Tipe' && String(row.question_type || '').toLowerCase() !== selectedQuestionType.toLowerCase()) {
      return false
    }

    if (!search) return true

    return [row.question, row.information, row.pembahasan, row.question_group_label]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search))
  })

  const totalQuestionPages = Math.max(1, Math.ceil(visibleQuestionRows.length / questionPageSize))
  const safeQuestionCurrentPage = Math.min(questionCurrentPage, totalQuestionPages)
  const questionStartIndex = (safeQuestionCurrentPage - 1) * questionPageSize
  const questionPaginatedRows = visibleQuestionRows.slice(questionStartIndex, questionStartIndex + questionPageSize)

  useEffect(() => {
    setQuestionCurrentPage(1)
  }, [questionSearch, selectedQuestionGroup, selectedQuestionType, selectedQuestionStatus, questionPageSize])

  useEffect(() => {
    if (questionCurrentPage > totalQuestionPages) {
      setQuestionCurrentPage(totalQuestionPages)
    }
  }, [questionCurrentPage, totalQuestionPages])

  const renderQuestionPaginationPages = () => {
    if (totalQuestionPages <= 1) return [1]

    const pages = new Set([1, totalQuestionPages, safeQuestionCurrentPage])
    if (safeQuestionCurrentPage > 1) pages.add(safeQuestionCurrentPage - 1)
    if (safeQuestionCurrentPage < totalQuestionPages) pages.add(safeQuestionCurrentPage + 1)

    return Array.from(pages).sort((a, b) => a - b)
  }

  const openQuestionDetailFromRow = (row) => {
    setQuestionDetail(row)
    setShowQuestionDetailModal(true)
  }

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    clearAuthUser()

    navigate('/login', { replace: true })
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(ADMIN_SIDEBAR_COLLAPSED_KEY, String(isSidebarCollapsed))
  }, [isSidebarCollapsed])

  return (
    <div className="admin-dashboard-page admin-question-page">
      <div className={`admin-dashboard-shell${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <aside className={`admin-sidebar${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
          <AdminBrandBlock isCollapsed={isSidebarCollapsed} />

          <div className="admin-sidebar-group-label">Main</div>
          <nav className="admin-sidebar-nav" aria-label="Navigasi admin">
            {adminMainMenu.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`admin-sidebar-item${currentPath === item.href ? ' active' : ''}`}
                onClick={() => item.href !== '#' && navigate(item.href)}
              >
                <span className="admin-sidebar-icon" aria-hidden="true">{item.label.slice(0, 1)}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <AdminQuestionMenu currentPath={currentPath} navigate={navigate} />

          <AdminSystemMenu currentPath={currentPath} navigate={navigate} />

          <AdminUserMenu profileUser={user} displayName={displayName} onResumeProfile={(activeUser) => navigate('/account-profile', { state: { user: activeUser } })} onLogout={handleLogout} />
        </aside>

        <main className="admin-main admin-question-main">
          <AdminTopbar
            title="Bank Soal"
            searchPlaceholder="Cari soal..."
            currentDateLabel={currentDateLabel}
            displayName={displayName}
            profileUser={user}
            profileRoleLabel="Super Admin"
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={() => setIsSidebarCollapsed((current) => !current)}
            showSearch={false}
            onHomeClick={() => navigate('/')}
            onResumeProfile={(activeUser) => navigate('/account-profile', { state: { user: activeUser } })}
            onLogout={handleLogout}
          />

          <section className="admin-question-hero">
            <div>
              <h2>Manajemen Soal</h2>
              <div className="admin-breadcrumb">
                Dashboard <span>›</span> Bank Soal
              </div>
            </div>

            <div className="admin-package-actions admin-question-actions">
              <button type="button" className="admin-outline-action">⬆ Export Soal</button>
              <button type="button" className="admin-outline-action" aria-label="Muat ulang data soal" onClick={() => { void loadQuestions({ cancelled: () => false, showLoading: true }) }}>↻</button>
              <button type="button" className="admin-primary-action" onClick={openAddQuestionModal}>＋ Tambah Soal</button>
            </div>
          </section>

          <section className="admin-summary-grid admin-question-summary-grid">
            {questionSummaryCards.map((card) => (
              <article className={`admin-summary-card ${card.accent}`} key={card.label}>
                <div className={`admin-summary-icon ${card.accent}`}>{card.icon}</div>
                <div className="admin-summary-copy">
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                  <p>{card.delta}</p>
                </div>
              </article>
            ))}
          </section>

          <section className="admin-card admin-question-filter-card">
            {questionError ? <div className="admin-user-message error">{questionError}</div> : null}
            {isLoadingQuestions ? <div className="admin-user-message">Memuat data soal...</div> : null}

            <div className="admin-package-filters admin-question-filters">
              <label className="admin-package-search">
                <span aria-hidden="true">⌕</span>
                <input type="search" placeholder="Cari soal..." value={questionSearch} onChange={(event) => setQuestionSearch(event.target.value)} />
              </label>

              <div className="admin-package-filter-group admin-question-filter-group">
                <select className="admin-package-select" value={selectedQuestionGroup} onChange={(event) => setSelectedQuestionGroup(event.target.value)}>
                  {['Semua Grup', '1', '2', '3'].map((option) => (
                    <option key={option} value={option}>
                      {option === 'Semua Grup' ? option : formatQuestionGroupLabel(option)}
                    </option>
                  ))}
                </select>

                <select className="admin-package-select" value={selectedQuestionType} onChange={(event) => setSelectedQuestionType(event.target.value)}>
                  {['Semua Tipe', 'SKD', 'SKB'].map((option) => (
                    <option key={option} value={option}>
                      {option === 'Semua Tipe' ? option : formatQuestionTypeLabel(option)}
                    </option>
                  ))}
                </select>

                <select className="admin-package-select" value={selectedQuestionStatus} onChange={(event) => setSelectedQuestionStatus(event.target.value)}>
                  {['Aktif', 'Terhapus', 'Semua Status'].map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>

                <button type="button" className="admin-user-filter-button admin-package-filter-button">Filter</button>
                <label className="admin-page-size-control" aria-label="Jumlah data per halaman">
                  <select
                    className="admin-page-size-select"
                    value={questionPageSize}
                    onChange={(event) => setQuestionPageSize(Number(event.target.value))}
                  >
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option} / halaman</option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="admin-package-reset"
                  onClick={() => {
                    setQuestionSearch('')
                    setSelectedQuestionGroup('Semua Grup')
                    setSelectedQuestionType('Semua Tipe')
                    setSelectedQuestionStatus('Aktif')
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          </section>

          <section className="admin-card admin-question-table-card">
            {questionSubmitSuccess ? <div className="admin-package-banner success">{questionSubmitSuccess}</div> : null}
            <div className="admin-user-table-wrap">
              <table className="admin-user-table admin-question-table">
                <thead>
                  <tr>
                    <th>Soal</th>
                    <th>Grup</th>
                    <th>Tipe</th>
                    <th>Jenis</th>
                    <th>Opsi</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {questionPaginatedRows.map((row, index) => (
                    <tr key={row.id}>
                      <td>
                        <div className="admin-user-cell admin-question-cell">
                          <div className={`admin-user-avatar admin-question-avatar ${row.deleted_at ? 'inactive' : 'active'}`}>{String(index + 1).padStart(2, '0')}</div>
                          <div>
                            <strong>{row.question}</strong>
                            <span>{row.information || row.pembahasan || '-'}</span>
                          </div>
                        </div>
                      </td>
                      <td><span className="admin-question-group-pill">{row.question_group_label}</span></td>
                      <td>{formatQuestionTypeLabel(row.question_type)}</td>
                      <td><span className="admin-question-kind-pill">{row.istext ? 'Teks' : 'Gambar'}</span></td>
                      <td>{row.options_count || 0}</td>
                      <td><span className={`admin-status-pill ${row.deleted_at ? 'cancelled' : 'success'}`}>{row.deleted_at ? 'Terhapus' : 'Aktif'}</span></td>
                      <td>
                        <div className="admin-row-actions admin-question-row-actions">
                          <button type="button" className="admin-row-action" title="Lihat soal" aria-label={`Lihat soal ${row.question}`} onClick={() => openQuestionDetailFromRow(row)}>👁</button>
                          <button
                            type="button"
                            className="admin-row-action admin-row-action-edit"
                            title="Edit soal"
                            aria-label={`Edit soal ${row.question}`}
                            onClick={() => {
                              void openEditQuestionModal(row)
                            }}
                          >
                            ✎
                          </button>
                          {row.deleted_at ? (
                            <button type="button" className="admin-row-action danger" title="Pulihkan soal" aria-label={`Pulihkan soal ${row.question}`} onClick={() => { void handleRestoreQuestion(row) }}>↺</button>
                          ) : (
                            <button type="button" className="admin-row-action danger" title="Hapus soal" aria-label={`Hapus soal ${row.question}`} onClick={() => { void handleDeleteQuestion(row) }}>🗑</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-package-footer admin-user-footer">
              <p>Menampilkan {questionPaginatedRows.length} data dari {visibleQuestionRows.length} soal</p>
              <div className="admin-pagination">
                <button type="button" className="admin-pagination-arrow" disabled={safeQuestionCurrentPage === 1} onClick={() => setQuestionCurrentPage((current) => Math.max(1, current - 1))}>‹</button>
                {renderQuestionPaginationPages().map((page, index, array) => {
                  const previousPage = array[index - 1]
                  const shouldShowDots = previousPage && page - previousPage > 1

                  return (
                    <span key={page}>
                      {shouldShowDots ? <span className="admin-pagination-dots">…</span> : null}
                      <button type="button" className={`admin-pagination-page${page === safeQuestionCurrentPage ? ' active' : ''}`} onClick={() => setQuestionCurrentPage(page)}>{page}</button>
                    </span>
                  )
                })}
                <button type="button" className="admin-pagination-arrow" disabled={safeQuestionCurrentPage === totalQuestionPages} onClick={() => setQuestionCurrentPage((current) => Math.min(totalQuestionPages, current + 1))}>›</button>
              </div>
            </div>
          </section>

          <AdminQuestionFormModal
            open={showQuestionModal}
            onCancel={closeQuestionModal}
            onSubmit={handleQuestionSubmit}
            form={questionForm}
            onFieldChange={handleQuestionFieldChange}
            onOptionChange={handleQuestionOptionChange}
            onAddOption={handleQuestionAddOption}
            onRemoveOption={handleQuestionRemoveOption}
            onSetCorrectOption={handleQuestionSetCorrectOption}
            onResetForm={resetQuestionForm}
            loading={isSavingQuestion}
            error={questionSubmitError}
            title={questionModalMode === 'edit' ? 'Edit Soal' : 'Tambah Soal'}
            submitLabel={questionModalMode === 'edit' ? 'Perbarui Soal' : 'Simpan Soal'}
            helpText={questionModalMode === 'edit' ? 'Ubah soal, opsi, dan jawaban benar lalu simpan perubahan.' : 'Isi soal, opsi jawaban, lalu pilih 1 jawaban benar.'}
            mode={questionModalMode}
          />

          <AdminQuestionDetailModal
            open={showQuestionDetailModal}
            question={questionDetail}
            onCancel={() => {
              setShowQuestionDetailModal(false)
              setQuestionDetail(null)
            }}
            onEdit={() => {
              const current = questionDetail
              setShowQuestionDetailModal(false)
              setQuestionDetail(null)
              if (current) {
                void openEditQuestionModal(current)
              }
            }}
            onDelete={() => {
              const current = questionDetail
              if (current) {
                void handleDeleteQuestion(current)
              }
            }}
            onRestore={() => {
              const current = questionDetail
              if (current) {
                void handleRestoreQuestion(current)
              }
            }}
          />

          <AdminLogoutModal
            open={showLogoutConfirm}
            onCancel={() => setShowLogoutConfirm(false)}
            onConfirm={confirmLogout}
          />
        </main>
      </div>
    </div>
  )
}

function AdminTransactionManagementPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => readStoredAdminSidebarState())
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [transactionRows, setTransactionRows] = useState([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true)
  const [transactionError, setTransactionError] = useState(null)
  const [transactionSearch, setTransactionSearch] = useState('')
  const [selectedTransactionStatus, setSelectedTransactionStatus] = useState('Semua Status')
  const [selectedTransactionProgram, setSelectedTransactionProgram] = useState('Semua Program')
  const [transactionCurrentPage, setTransactionCurrentPage] = useState(1)
  const [transactionPageSize, setTransactionPageSize] = useState(10)
  const [transactionSummary, setTransactionSummary] = useState({
    total_transaksi: 0,
    total_pendapatan: 0,
    transaksi_berhasil: 0,
    menunggu_pembayaran: 0,
    dibatalkan: 0,
  })
  const storedUser = readStoredUser()
  const user = location.state?.user ?? storedUser

  if (!user || Number(user?.is_admin ?? 0) !== 1) {
    return <Navigate to="/login" replace state={{ from: '/dashboard-admin/transactions' }} />
  }

  const currentPath = location.pathname
  const displayName = user?.email?.split('@')?.[0] || 'Admin'
  const currentDateLabel = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
    .format(new Date())
    .replace(/^./, (char) => char.toUpperCase())

  const adminMainMenu = [
    { label: 'Dashboard', href: '/dashboard-admin' },
    { label: 'User', href: '/dashboard-admin/users' },
    { label: 'Paket', href: '/dashboard-admin/packages' },
    { label: 'Materi', href: '/dashboard-admin/materials' },
    { label: 'Bank Soal', href: '/dashboard-admin/questions' },
    { label: 'Transaksi', href: '/dashboard-admin/transactions' },
    { label: 'Konten', href: '#' },
    { label: 'Laporan', href: '#' },
  ]

  const transactionSummaryCards = [
    { label: 'Total Transaksi', value: String(transactionSummary.total_transaksi ?? 0), delta: 'Semua transaksi', accent: 'blue', icon: '🧾' },
    { label: 'Total Pendapatan', value: formatCurrency(transactionSummary.total_pendapatan ?? 0), delta: 'Transaksi berhasil', accent: 'green', icon: '💳' },
    { label: 'Transaksi Berhasil', value: String(transactionSummary.transaksi_berhasil ?? 0), delta: 'Status paid', accent: 'purple', icon: '✅' },
    { label: 'Menunggu Pembayaran', value: String(transactionSummary.menunggu_pembayaran ?? 0), delta: 'Status pending', accent: 'orange', icon: '⏳' },
    { label: 'Dibatalkan', value: String(transactionSummary.dibatalkan ?? 0), delta: 'Status cancelled', accent: 'red', icon: '⛔' },
  ]

  const transactionStatusOptions = ['Semua Status', 'Berhasil', 'Menunggu', 'Dibatalkan']
  const transactionProgramOptions = ['Semua Program', 'CPNS', 'PPPK']

  const statusQueryMap = {
    Berhasil: 'paid',
    Menunggu: 'pending',
    Dibatalkan: 'cancelled',
  }

  const loadTransactions = async ({ cancelled = () => false, showLoading = true } = {}) => {
    if (showLoading) {
      setIsLoadingTransactions(true)
    }

    setTransactionError(null)

    try {
      const params = new URLSearchParams()
      if (transactionSearch.trim()) params.set('search', transactionSearch.trim())
      if (selectedTransactionStatus !== 'Semua Status') params.set('status', statusQueryMap[selectedTransactionStatus])
      if (selectedTransactionProgram !== 'Semua Program') params.set('program', selectedTransactionProgram)

      const response = await fetch(`${BACKEND_URL}/api/admin/transactions${params.toString() ? `?${params.toString()}` : ''}`)
      const contentType = response.headers.get('content-type') || ''
      const rawBody = await response.text()
      const payload = contentType.includes('application/json') && rawBody ? JSON.parse(rawBody) : null

      if (!response.ok) {
        const message = payload?.message || rawBody?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || `Data transaksi gagal dimuat (HTTP ${response.status}).`
        throw new Error(message)
      }

      if (!cancelled()) {
        setTransactionRows(Array.isArray(payload?.data) ? payload.data : [])
        setTransactionSummary(payload?.summary ?? {
          total_transaksi: 0,
          total_pendapatan: 0,
          transaksi_berhasil: 0,
          menunggu_pembayaran: 0,
          dibatalkan: 0,
        })
      }
      } catch (error) {
      if (!cancelled()) {
        const message = getFriendlyFetchError(error, 'Data transaksi gagal dimuat.')
        setTransactionError(message.includes('<!DOCTYPE') ? 'Backend mengembalikan halaman HTML, periksa koneksi database/server.' : message)
      }
    } finally {
      if (showLoading && !cancelled()) {
        setIsLoadingTransactions(false)
      }
    }
  }

  useEffect(() => {
    let cancelled = false

    void loadTransactions({ cancelled: () => cancelled, showLoading: true })

    return () => {
      cancelled = true
    }
  }, [transactionSearch, selectedTransactionStatus, selectedTransactionProgram])

  const visibleTransactionRows = transactionRows
  const totalTransactionPages = Math.max(1, Math.ceil(visibleTransactionRows.length / transactionPageSize))
  const safeTransactionCurrentPage = Math.min(transactionCurrentPage, totalTransactionPages)
  const transactionStartIndex = (safeTransactionCurrentPage - 1) * transactionPageSize
  const transactionPaginatedRows = visibleTransactionRows.slice(transactionStartIndex, transactionStartIndex + transactionPageSize)

  useEffect(() => {
    setTransactionCurrentPage(1)
  }, [transactionSearch, selectedTransactionStatus, selectedTransactionProgram, transactionPageSize])

  useEffect(() => {
    if (transactionCurrentPage > totalTransactionPages) {
      setTransactionCurrentPage(totalTransactionPages)
    }
  }, [transactionCurrentPage, totalTransactionPages])

  const renderTransactionPaginationPages = () => {
    if (totalTransactionPages <= 1) return [1]

    const pages = new Set([1, totalTransactionPages, safeTransactionCurrentPage])
    if (safeTransactionCurrentPage > 1) pages.add(safeTransactionCurrentPage - 1)
    if (safeTransactionCurrentPage < totalTransactionPages) pages.add(safeTransactionCurrentPage + 1)

    return Array.from(pages).sort((a, b) => a - b)
  }

  const transactionDateRangeLabel = (() => {
    if (!transactionRows.length) return 'Belum ada data'

    const dates = transactionRows
      .map((row) => new Date(row.transactionDateRaw || row.paidDateRaw || ''))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())

    if (!dates.length) return 'Belum ada data'

    return `${formatAdminDate(dates[0], { hour: false })} - ${formatAdminDate(dates[dates.length - 1], { hour: false })}`
  })()

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    clearAuthUser()

    navigate('/login', { replace: true })
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(ADMIN_SIDEBAR_COLLAPSED_KEY, String(isSidebarCollapsed))
  }, [isSidebarCollapsed])

  return (
    <div className="admin-dashboard-page admin-transaction-page">
      <div className={`admin-dashboard-shell${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <aside className={`admin-sidebar${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
          <AdminBrandBlock isCollapsed={isSidebarCollapsed} />

          <div className="admin-sidebar-group-label">Main</div>
          <nav className="admin-sidebar-nav" aria-label="Navigasi admin">
            {adminMainMenu.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`admin-sidebar-item${currentPath === item.href ? ' active' : ''}`}
                onClick={() => item.href !== '#' && navigate(item.href)}
              >
                <span className="admin-sidebar-icon" aria-hidden="true">{item.label.slice(0, 1)}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <AdminQuestionMenu currentPath={currentPath} navigate={navigate} />

          <AdminSystemMenu currentPath={currentPath} navigate={navigate} />

          <AdminUserMenu profileUser={user} displayName={displayName} onResumeProfile={(activeUser) => navigate('/account-profile', { state: { user: activeUser } })} onLogout={handleLogout} />
        </aside>

        <main className="admin-main admin-transaction-main">
          <AdminTopbar
            title="Transaksi"
            searchPlaceholder="Cari transaksi..."
            currentDateLabel={currentDateLabel}
            displayName={displayName}
            profileUser={user}
            profileRoleLabel="Super Admin"
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={() => setIsSidebarCollapsed((current) => !current)}
            showSearch={false}
            onHomeClick={() => navigate('/')}
            onResumeProfile={(activeUser) => navigate('/account-profile', { state: { user: activeUser } })}
            onLogout={handleLogout}
          />

          <section className="admin-transaction-hero">
            <div>
              <h2>Transaksi</h2>
              <p>Kelola semua transaksi yang tercatat di platform Nice On.</p>
            </div>

            <div className="admin-transaction-actions">
              <button type="button" className="admin-outline-action">Export Excel</button>
              <button type="button" className="admin-outline-action">Export PDF</button>
            </div>
          </section>

          <section className="admin-summary-grid admin-transaction-summary-grid">
            {transactionSummaryCards.map((card) => (
              <article className={`admin-summary-card ${card.accent}`} key={card.label}>
                <div className={`admin-summary-icon ${card.accent}`}>{card.icon}</div>
                <div className="admin-summary-copy">
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                  <p>{card.delta}</p>
                </div>
              </article>
            ))}
          </section>

          <section className="admin-card admin-transaction-filter-card">
            {transactionError ? <div className="admin-user-message error">{transactionError}</div> : null}
            {isLoadingTransactions ? <div className="admin-user-message">Memuat data transaksi...</div> : null}

            <div className="admin-transaction-filters">
              <label className="admin-user-search admin-transaction-search">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  placeholder="Cari nama, email, no. HP, atau invoice..."
                  value={transactionSearch}
                  onChange={(event) => setTransactionSearch(event.target.value)}
                />
              </label>

              <div className="admin-transaction-filter-group">
                <select value={selectedTransactionStatus} onChange={(event) => setSelectedTransactionStatus(event.target.value)} className="admin-package-select admin-transaction-select">
                  {transactionStatusOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>

                <select value={selectedTransactionProgram} onChange={(event) => setSelectedTransactionProgram(event.target.value)} className="admin-package-select admin-transaction-select">
                  {transactionProgramOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>

                <button type="button" className="admin-user-filter-button admin-transaction-filter-button">Filter</button>
                <label className="admin-page-size-control" aria-label="Jumlah data per halaman">
                  <select
                    className="admin-page-size-select"
                    value={transactionPageSize}
                    onChange={(event) => setTransactionPageSize(Number(event.target.value))}
                  >
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option} / halaman</option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="admin-package-reset"
                  onClick={() => {
                    setTransactionSearch('')
                    setSelectedTransactionStatus('Semua Status')
                    setSelectedTransactionProgram('Semua Program')
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          </section>

          <section className="admin-card admin-transaction-table-card">
            <div className="admin-transaction-table-head">
              <div>
                <h3>Daftar Transaksi</h3>
                <p>{transactionDateRangeLabel}</p>
              </div>
            </div>

            <div className="admin-transaction-table-wrap">
              <table className="admin-user-table admin-transaction-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Pelanggan</th>
                    <th>Paket</th>
                    <th>Program</th>
                    <th>Tgl Transaksi</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionPaginatedRows.map((row) => (
                    <tr key={row.pid}>
                      <td>
                        <strong className="admin-transaction-invoice">{row.invoice}</strong>
                      </td>
                      <td>
                        <div className="admin-user-cell admin-transaction-customer-cell">
                          <div className="admin-user-avatar">{row.customerName.slice(0, 1)}</div>
                          <div>
                            <strong>{row.customerName}</strong>
                            <span>{row.customerEmail}</span>
                            <span>{row.customerPhone}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="admin-transaction-package">
                          <strong>{row.packageName}</strong>
                          <span>{row.packageType}</span>
                        </div>
                      </td>
                      <td><span className="admin-transaction-program-pill">{row.program}</span></td>
                      <td>{row.transactionDate}</td>
                      <td><strong className="admin-transaction-total">{row.totalLabel}</strong></td>
                      <td><span className={`admin-transaction-status ${row.statusClass}`}>{row.status}</span></td>
                      <td>
                        <div className="admin-row-actions admin-transaction-row-actions">
                          <button type="button" className="admin-row-action">👁</button>
                          <button type="button" className="admin-row-action">🖨</button>
                          <button type="button" className="admin-row-action danger">⋮</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-user-footer admin-transaction-footer">
              <p>Menampilkan {transactionPaginatedRows.length} data dari {visibleTransactionRows.length} transaksi</p>
              <div className="admin-pagination">
                <button type="button" className="admin-pagination-arrow" disabled={safeTransactionCurrentPage === 1} onClick={() => setTransactionCurrentPage((current) => Math.max(1, current - 1))}>‹</button>
                {renderTransactionPaginationPages().map((page, index, array) => {
                  const previousPage = array[index - 1]
                  const shouldShowDots = previousPage && page - previousPage > 1

                  return (
                    <span key={page}>
                      {shouldShowDots ? <span className="admin-pagination-dots">…</span> : null}
                      <button type="button" className={`admin-pagination-page${page === safeTransactionCurrentPage ? ' active' : ''}`} onClick={() => setTransactionCurrentPage(page)}>{page}</button>
                    </span>
                  )
                })}
                <button type="button" className="admin-pagination-arrow" disabled={safeTransactionCurrentPage === totalTransactionPages} onClick={() => setTransactionCurrentPage((current) => Math.min(totalTransactionPages, current + 1))}>›</button>
              </div>
            </div>
          </section>

          <AdminLogoutModal
            open={showLogoutConfirm}
            onCancel={() => setShowLogoutConfirm(false)}
            onConfirm={confirmLogout}
          />
        </main>
      </div>
    </div>
  )
}

function HomePage() {
  const navigate = useNavigate()
  const heroCardRef = useRef(null)
  const [activeSlide, setActiveSlide] = useState(0)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [activeSection, setActiveSection] = useState('beranda')
  const [storedUser, setStoredUser] = useState(() => readStoredUser())
  const [packageRows, setPackageRows] = useState([])
  const [selectedProgram, setSelectedProgram] = useState('CPNS')
  const [packageLoading, setPackageLoading] = useState(true)
  const [packageError, setPackageError] = useState(null)
  const [activePackageInfo, setActivePackageInfo] = useState(null)
  const [activeMaintenance, setActiveMaintenance] = useState(false)
  const [faqRows, setFaqRows] = useState([])
  const [faqLoading, setFaqLoading] = useState(true)
  const isLoggedIn = Boolean(storedUser)
  const displayName = storedUser?.nama || storedUser?.name || storedUser?.email?.split('@')?.[0] || 'User'
  const authLabel = Number(storedUser?.is_admin ?? 0) === 1 ? 'Admin' : 'User'
  const dashboardPath = Number(storedUser?.is_admin ?? 0) === 1 ? '/dashboard-admin' : '/dashboard-user'
  const dashboardCtaLabel = Number(storedUser?.is_admin ?? 0) === 1 ? 'Masuk ke Dashboard Admin' : 'Masuk ke Dashboard User'
  const dashboardCtaClass = Number(storedUser?.is_admin ?? 0) === 1 ? 'pill main home-dashboard-cta admin' : 'pill main home-dashboard-cta user'
  const currentYear = new Date().getFullYear()

  const handleHomeLogout = () => {
    clearAuthUser()
    setStoredUser(null)
  }

  useEffect(() => {
    const syncAuth = () => setStoredUser(readStoredUser())

    window.addEventListener('storage', syncAuth)
    window.addEventListener('focus', syncAuth)
    document.addEventListener('visibilitychange', syncAuth)

    return () => {
      window.removeEventListener('storage', syncAuth)
      window.removeEventListener('focus', syncAuth)
      document.removeEventListener('visibilitychange', syncAuth)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadPackages = async () => {
      setPackageLoading(true)
      setPackageError(null)

      try {
        const response = await fetch(`${BACKEND_URL}/api/packages`)
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message || 'Data paket gagal dimuat.')
        }

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
  }, [])

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll('[data-nav-section]'))
    if (!sections.length) return undefined

    let rafId = 0
    const updateActiveSection = () => {
      const topbar = document.querySelector('.topbar')
      const offset = (topbar?.offsetHeight || 0) + 24

      const candidates = sections
        .map((section) => {
          const rect = section.getBoundingClientRect()
          return {
            id: section.id,
            top: rect.top - offset,
          }
        })
        .filter((entry) => entry.id)
        .sort((a, b) => a.top - b.top)

      const current = [...candidates].reverse().find((entry) => entry.top <= 0)
      const nextSection = current?.id || candidates[0]?.id || 'beranda'
      setActiveSection(nextSection)
    }

    const onScrollOrResize = () => {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(updateActiveSection)
    }

    const hash = window.location.hash.replace('#', '')
    if (hash) {
      setActiveSection(hash)
    }

    const handleHashChange = () => {
      const nextHash = window.location.hash.replace('#', '')
      if (nextHash) setActiveSection(nextHash)
    }

    updateActiveSection()
    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize)
    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
      window.removeEventListener('hashchange', handleHashChange)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  const heroSlides = [
    {
      badge: 'KELAS OFFLINE',
      title: 'Kelas Offline',
      subtitle: 'Soal pembahasan bersama mentor',
      tone: 'tone-one',
      features: [
        { icon: '👥', label: 'Diskusi' },
        { icon: '📘', label: 'Modul' },
        { icon: '📈', label: 'Progress' },
      ],
    },
    {
      badge: 'TRYOUT CAT',
      title: 'Tryout CAT',
      subtitle: 'Simulasi ujian dengan suasana real test',
      tone: 'tone-two',
      features: [
        { icon: '⏱', label: 'Timer' },
        { icon: '✅', label: 'Skor' },
        { icon: '🧠', label: 'Analisis' },
      ],
    },
    {
      badge: 'BELAJAR RUTIN',
      title: 'Belajar Rutin',
      subtitle: 'Jadwal terarah untuk menjaga konsistensi',
      tone: 'tone-three',
      features: [
        { icon: '🗓', label: 'Jadwal' },
        { icon: '🔔', label: 'Reminder' },
        { icon: '📚', label: 'Materi' },
      ],
    },
  ]

  const stats = [
    ['YT', '1.75Jt+', 'Subscribers', '↑ 12.5%'],
    ['IG', '742K+', 'Followers', '↑ 8.2%'],
    ['TT', '389K+', 'Followers', '↑ 15.3%'],
    ['X', '198K+', 'Followers', '↑ 10.1%'],
  ]

  const socialCards = [
    {
      key: 'youtube',
      platform: 'YouTube',
      initials: 'YT',
      description: 'Pembahasan soal CAT dan tips belajar gratis setiap hari.',
      tone: 'youtube',
      action: 'Kunjungi',
    },
    {
      key: 'instagram',
      platform: 'Instagram',
      initials: 'IG',
      description: 'Infografis, reminder jadwal, dan update seleksi terbaru.',
      tone: 'instagram',
      action: 'Follow',
      href: 'https://www.instagram.com/niceon_id/',
    },
    {
      key: 'tiktok',
      platform: 'TikTok',
      initials: 'TT',
      description: 'Tips singkat, trik cepat, dan highlight materi penting.',
      tone: 'tiktok',
      action: 'Ikuti',
    },
    {
      key: 'x',
      platform: 'X (Twitter)',
      initials: 'X',
      description: 'Update jadwal seleksi, info umum, dan pengumuman cepat.',
      tone: 'x',
      action: 'Follow',
    },
  ]

  const featureCards = [
    {
      icon: '🛡️',
      title: 'Konten Terpercaya',
      description: 'Disusun oleh tim ahli dan berpengalaman di bidangnya.',
      tone: 'blue',
    },
    {
      icon: '⭐',
      title: 'Update Berkala',
      description: 'Materi dan soal selalu diperbarui sesuai kebijakan terbaru.',
      tone: 'green',
    },
    {
      icon: '🎧',
      title: 'Dukungan Mentor',
      description: 'Konsultasi dan bantuan cepat dari mentor berpengalaman.',
      tone: 'violet',
    },
    {
      icon: '🔒',
      title: 'Akses Fleksibel',
      description: 'Belajar kapan saja, di mana saja melalui semua perangkat.',
      tone: 'orange',
    },
  ]

  const testimonials = [
    {
      initials: 'AR',
      name: 'Lorem Arian',
      role: 'Lolos instansi alumni',
      text: 'Materi sangat ringkas dan terarah. Simulasi CAT mirip dengan ujian asli, sangat membantu!',
      tone: 'sky',
      image: '/testimoni-1.png',
    },
    {
      initials: 'NS',
      name: 'Nadia S',
      role: 'Dokter umum peserta',
      text: 'UI enak dan mudah digunakan. Fitur evaluasi membantu saya memantau progres belajar.',
      tone: 'violet',
      image: '/testimoni-2.png',
    },
    {
      initials: 'RK',
      name: 'Raka K',
      role: 'Contecturer program',
      text: 'Mentornya responsif dan kelas intensifnya benar-benar berkualitas.',
      tone: 'mint',
      image: '/testimoni-3.png',
    },
  ]

  const normalizedSelectedProgram = selectedProgram.toUpperCase()
  const visiblePackageRows = packageRows.filter((item) => {
    if (normalizedSelectedProgram === 'ALL') return true
    return String(item.kategori || '').trim().toUpperCase() === normalizedSelectedProgram
  })

  const packageCards = visiblePackageRows.map((item, index) => {
    const kategori = String(item.kategori || 'Program').trim()
    const namaPaket = item.nama_paket || 'Nama Paket'
    const subtitle = item.formasi || item.jadwal || item.ket || 'Paket belajar terarah.'
    const note = item.jadwal ? `(Jadwal ${item.jadwal})` : '(Aktif)'
    const ketText = String(item.ket || '').replace(/\s+/g, ' ').trim()
    const bullets = [item.formasi, item.jadwal, ketText].filter(Boolean).slice(0, 2)
    const basePrice = Number(item.harga) || 0

    return {
      key: item.pid ?? `${kategori}-${index}`,
      title: namaPaket,
      subtitle,
      note,
      source: item,
      bullets: bullets.length ? bullets : [ketText || 'Paket belajar terarah.', 'Informasi paket tersedia di detail.'],
      newPrice: formatCurrency(basePrice),
      icon: kategori.toUpperCase() === 'PPPK' ? '🎯' : kategori.toUpperCase() === 'CPNS' ? '📋' : '📦',
      badge: kategori ? kategori.toUpperCase() : 'PROGRAM',
    }
  })

  useEffect(() => {
    if (!packageRows.length) return

    const availablePrograms = Array.from(new Set(packageRows.map((item) => String(item.kategori || '').trim().toUpperCase()).filter(Boolean)))
    if (!availablePrograms.length) return

    setSelectedProgram((current) => {
      const normalizedCurrent = current.toUpperCase()
      if (availablePrograms.includes(normalizedCurrent)) {
        return current
      }

      if (availablePrograms.includes('CPNS')) return 'CPNS'
      if (availablePrograms.includes('PPPK')) return 'PPPK'

      return current
    })
  }, [packageRows])

  const faqItems = faqRows.length
    ? faqRows.map((item) => ({
      icon: item.icon || '❓',
      label: item.pertanyaan,
      answer: stripFaqHtml(item.jawaban),
    }))
    : DEFAULT_FAQ_ITEMS.map((item) => ({
      ...item,
      answer: item.answer,
    }))

  const currentSlide = heroSlides[activeSlide]

  const cycleSlide = (direction) => {
    setActiveSlide((current) => {
      const next = current + direction
      if (next < 0) return heroSlides.length - 1
      return next % heroSlides.length
    })
  }

  useEffect(() => {
    const layers = Array.from(document.querySelectorAll('[data-parallax]'))
    if (!layers.length) return

    let rafId = 0

    const updateParallax = () => {
      const scrollY = window.scrollY || 0
      layers.forEach((layer) => {
        const speed = Number(layer.getAttribute('data-speed') || 0.12)
        layer.style.transform = `translate3d(0, ${scrollY * speed}px, 0)`
      })
      rafId = 0
    }

    const onScroll = () => {
      if (rafId) return
      rafId = window.requestAnimationFrame(updateParallax)
    }

    updateParallax()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafId) window.cancelAnimationFrame(rafId)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadFaqs = async () => {
      setFaqLoading(true)

      try {
        const response = await fetch(`${BACKEND_URL}/api/faqs`)
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message || 'Data FAQ gagal dimuat.')
        }

        if (!cancelled) {
          setFaqRows(Array.isArray(payload.data) ? payload.data : [])
        }
      } catch {
        if (!cancelled) {
          setFaqRows([])
        }
      } finally {
        if (!cancelled) {
          setFaqLoading(false)
        }
      }
    }

    void loadFaqs()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length)
    }, 3200)

    return () => window.clearInterval(timer)
  }, [heroSlides.length])

  useEffect(() => {
    const card = heroCardRef.current
    if (!card) return

    const media = window.matchMedia('(max-width: 980px)')
    if (media.matches) return

    const thumb = card.querySelector('.hero-card-visual')
    let rafId = 0

    const animate = (xRatio, yRatio) => {
      const rotateY = xRatio * 6
      const rotateX = -yRatio * 5
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`
      if (thumb) {
        thumb.style.transform = `translate(${xRatio * -8}px, ${yRatio * -6}px)`
      }
    }

    const onMove = (event) => {
      const rect = card.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width
      const y = (event.clientY - rect.top) / rect.height
      const xRatio = (x - 0.5) * 2
      const yRatio = (y - 0.5) * 2

      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => animate(xRatio, yRatio))
    }

    const reset = () => {
      card.style.transform = ''
      if (thumb) thumb.style.transform = ''
    }

    card.addEventListener('mousemove', onMove)
    card.addEventListener('mouseleave', reset)

    return () => {
      card.removeEventListener('mousemove', onMove)
      card.removeEventListener('mouseleave', reset)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div className="app">
      <header className="topbar">
        <div className="container topbar-inner">
          <div className="logo">
            <img src={niceonImage} alt="Nice On" className="logo-image" />
          </div>

          <nav className="menu">
            <a href="#beranda" className={activeSection === 'beranda' ? 'active' : ''}>Beranda</a>
            <a href="#paket" className={activeSection === 'paket' ? 'active' : ''}>Paket Belajar</a>
            <a href="#testimoni" className={activeSection === 'testimoni' ? 'active' : ''}>Testimoni</a>
            <a href="#social-media" className={activeSection === 'social-media' ? 'active' : ''}>Social Media</a>
            <a href="#faq" className={activeSection === 'faq' ? 'active' : ''}>FAQ</a>
          </nav>

          {isLoggedIn ? (
            <div className="auth auth-logged-in">
              <button type="button" className="home-user-chip home-user-chip-button" onClick={() => navigate(dashboardPath, { state: { user: storedUser } })}>
                <span className="home-user-avatar">{displayName.slice(0, 2).toUpperCase()}</span>
                <span className="home-user-copy">
                  <strong>{displayName}</strong>
                  <span>{authLabel} aktif</span>
                </span>
              </button>
              <button type="button" className="btn auth-logout" onClick={handleHomeLogout}>Logout</button>
            </div>
          ) : (
            <div className="auth">
              <Link className="btn" to="/login">Masuk</Link>
              <Link className="btn primary" to="/register">Daftar</Link>
            </div>
          )}
        </div>
      </header>

      <section className="hero container" id="beranda" data-nav-section data-parallax data-speed="-0.06">
        <div className="hero-copy">
          <div className="hero-badge">Dipakai ribuan pejuang ASN di seluruh Indonesia</div>
          <h1>Satu Langkah<br /><span>Menuju ASN</span></h1>
          <p>Persiapan yang tepat dapat mengubah keraguan menjadi keyakinan.</p>
          <p>Dengan pendekatan belajar yang terstruktur, latihan yang relevan, dan bimbingan yang responsif, kamu dapat fokus pada hal yang benar-benar penting: meningkatkan peluang kelulusan.</p>
          <ul className="hero-points">
            <li>Materi ringkas dan terarah</li>
            <li>Simulasi CAT sesuai ujian asli</li>
            <li>Evaluasi progres belajar</li>
            <li>Mentor responsif saat kamu butuh bantuan</li>
          </ul>
          <div className="hero-actions">
            {isLoggedIn ? (
              <button type="button" className={dashboardCtaClass} onClick={() => navigate(dashboardPath, { state: { user: storedUser } })}>
                {dashboardCtaLabel} <span aria-hidden="true">→</span>
              </button>
            ) : (
              <a href="#paket" className="pill main">Mulai Belajar Sekarang <span aria-hidden="true">→</span></a>
            )}
            <a href="#paket" className="pill">Lihat Paket Kelas</a>
          </div>
        </div>

        <div className="hero-card-wrap">
          <button type="button" className="hero-nav hero-nav-left" onClick={() => cycleSlide(-1)} aria-label="Slide sebelumnya">←</button>

          <div className="hero-card" data-parallax data-speed="-0.12" ref={heroCardRef}>
            <div className={`hero-card-visual ${currentSlide.tone}`}>
              <div className="hero-card-kicker">{currentSlide.badge}</div>
              <div className="hero-card-head">
                <h3>{currentSlide.title}</h3>
                <p>{currentSlide.subtitle}</p>
              </div>
              <div className="hero-card-features" aria-label="Fitur unggulan slide">
                {currentSlide.features.map((feature) => (
                  <div key={feature.label} className="hero-feature-tile">
                    <span aria-hidden="true">{feature.icon}</span>
                    <strong>{feature.label}</strong>
                  </div>
                ))}
              </div>
              <div className="hero-card-dots" aria-label="Pilihan slide">
                {heroSlides.map((slide, index) => (
                  <button
                    key={slide.title}
                    type="button"
                    className={`hero-dot${index === activeSlide ? ' is-active' : ''}`}
                    onClick={() => setActiveSlide(index)}
                    aria-label={`Slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="hero-card-body">
              <h3>Program Intensif SKD 2026</h3>
              <p>Targetkan nilai aman dengan jadwal belajar terarah, evaluasi progres rutin, dan bank soal terbaru.</p>
              <div className="hero-card-links">
                {[
                  'Jadwal Terarah',
                  'Evaluasi Rutin',
                  'Bank Soal Terbaru',
                ].map((label) => (
                  <span key={label} className="hero-card-link">{label}</span>
                ))}
              </div>
            </div>
          </div>

          <button type="button" className="hero-nav hero-nav-right" onClick={() => cycleSlide(1)} aria-label="Slide berikutnya">→</button>
        </div>
      </section>

      <section className="socials container" id="social-media" data-nav-section aria-label="Media Sosial NiceOn">
        <div className="hero-social-panel social-media-panel">
          <div className="hero-social-head">
            <h3>Dapatkan Tips &amp; Info Terbaru di Media Sosial NiceOn</h3>
            <p>Ribuan soal, tips belajar, dan informasi seleksi kami bagikan secara gratis melalui seluruh media sosial NiceOn.</p>
          </div>

          <div className="hero-social-grid">
            {socialCards.map((card) => (
              <article className={`hero-social-card ${card.tone}`} key={card.key}>
                <div className={`hero-social-logo ${card.tone}`} aria-hidden="true">
                  {renderSocialBrandIcon(card.tone)}
                </div>
                <div className="hero-social-copy">
                  <h4>{card.platform}</h4>
                  <p>{card.description}</p>
                </div>
                <a
                  href={card.href || '#'}
                  className={`hero-social-button ${card.tone}`}
                  aria-label={`Buka ${card.platform}`}
                  target={card.href ? '_blank' : undefined}
                  rel={card.href ? 'noreferrer' : undefined}
                >
                  {card.action} <span aria-hidden="true">→</span>
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="features container" aria-label="Keunggulan Nice On">
        <div className="features-grid">
          {featureCards.map((feature) => (
            <article className="feature-card" key={feature.title}>
              <div className={`feature-icon ${feature.tone}`} aria-hidden="true">
                {feature.icon}
              </div>
              <div className="feature-copy">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="testimonials container" id="testimoni" data-nav-section>
        <div className="testimonials-head testimonials-head-ref">
          <div className="testimonials-head-center">
            <div className="section-kicker testimonials-kicker">💬 KATA MEREKA</div>
            <h2 className="testimonials-title">Testimoni <span>Peserta</span></h2>
            <p className="testimonials-sub">Cerita nyata dari para pejuang yang telah merasakan manfaat belajar bersama NiceOn.</p>
            <a className="testimonials-link" href="#">Lihat semua testimoni →</a>
          </div>
        </div>

        <div className="testimonials-carousel testimonials-carousel-ref">
          <button type="button" className="carousel-nav testimonials-nav" aria-label="Testimoni sebelumnya">‹</button>

          <div className="testimonials-grid testimonials-grid-ref">
            {testimonials.map((item, index) => (
              <article className={`testimonial-card testimonial-card-ref${index === activeTestimonial ? ' is-active' : ''}`} key={item.name}>
                <div className="testimonial-top testimonial-top-ref">
                  <img src={item.image} alt={item.name} className={`avatar-ref avatar-photo ${item.tone}`} />
                  <div className="who">
                    <strong>{item.name}</strong>
                    <span>{item.role}</span>
                    <div className="testimonial-rating">
                      <span className="testimonial-stars">★★★★★</span>
                      <span className="testimonial-score">5.0</span>
                    </div>
                  </div>
                  <div className="testimonial-quote-top" aria-hidden="true">❝</div>
                </div>
                <p className="testimonial-text testimonial-text-ref">{item.text}</p>
                <div className="testimonial-quote-bottom" aria-hidden="true">❝</div>
              </article>
            ))}
          </div>

          <button type="button" className="carousel-nav testimonials-nav" aria-label="Testimoni berikutnya">›</button>
        </div>

        <div className="testimonials-dots" aria-label="Pagination testimoni">
          {testimonials.map((item, index) => (
            <button
              key={item.name}
              type="button"
              className={`testimonials-dot${index === activeTestimonial ? ' active' : ''}`}
              onClick={() => setActiveTestimonial(index)}
              aria-label={`Testimoni ${index + 1}`}
            />
          ))}
        </div>
      </section>

      <section className="package container" id="paket" data-nav-section>
        <div className="section-kicker package-kicker">PAKET BELAJAR</div>
        <h2 className="section-title package-heading">Paket Belajar Terbaik untukmu</h2>
        <p className="section-subtitle package-subtitle">Pilih program yang sesuai dengan tujuanmu dan mulai persiapan sekarang.</p>

        <div className="package-filter package-filter-ref">
          <label htmlFor="program">Program</label>
          <select id="program" name="program" value={selectedProgram} onChange={(event) => setSelectedProgram(event.target.value)}>
            <option>CPNS</option>
            <option>PPPK</option>
          </select>
        </div>

        {packageError ? <div className="package-status package-status-error">{packageError}</div> : null}
        {packageLoading ? <div className="package-status">Memuat paket belajar...</div> : null}

        {!packageLoading && !packageError && packageCards.length === 0 ? (
          <div className="package-status">Belum ada paket untuk program ini.</div>
        ) : null}

        <div className="package-grid package-grid-ref">
          {packageCards.map((card) => (
            <article className="course-card course-card-ref" key={card.key}>
              <div className="course-cover course-cover-ref">
                <div className="course-cover-badge">{card.badge || 'TRYOUT BUNDLE'}</div>
                <div className="course-cover-icon" aria-hidden="true">{card.icon}</div>
                <h3>{card.title}</h3>
              </div>
              <div className="course-body course-body-ref">
                <p className="course-sub"><strong>{card.subtitle}</strong></p>
                <p className="course-meta"><strong>{card.note}</strong></p>
                <ul className="course-list">
                  {card.bullets.map((bullet) => <li key={bullet}>✓ {bullet}</li>)}
                </ul>
                <div className="course-cta-row" aria-label={`Aksi paket ${card.title}`}>
                  <div className="course-action-group">
                    <button
                      type="button"
                      className="course-detail-link"
                      onClick={() => setActivePackageInfo(card.source)}
                      aria-label={`Lihat detail ${card.title}`}
                    >
                      <span className="course-detail-label">Detail</span>
                    </button>
                    <a
                      href="#"
                      className="course-cart-button"
                      onClick={(event) => {
                        event.preventDefault()
                        setActiveMaintenance(true)
                      }}
                      aria-label={`Buka paket ${card.title}`}
                      title="#"
                    >
                      <span aria-hidden="true">🛒</span>
                    </a>
                  </div>
                </div>
                <div className="course-price course-price-ref">
                  {/* Diskon dan harga lama belum ditampilkan sampai data tersedia di database. */}
                  <span className="new-price">{card.newPrice}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <PackageInfoModal
        open={Boolean(activePackageInfo)}
        packageData={activePackageInfo}
        onCancel={() => setActivePackageInfo(null)}
      />

      <MaintenanceModal
        open={activeMaintenance}
        onCancel={() => setActiveMaintenance(false)}
      />

      <section className="faq-wrap" id="faq" data-nav-section>
        <div className="container faq faq-inner">
          <div className="faq-content">
            <div className="section-kicker faq-kicker">FAQ</div>
            <h2 className="faq-title">Pertanyaan yang Sering Ditanyakan</h2>
            <p className="faq-subtitle">Temukan jawaban cepat untuk pertanyaan yang paling sering diajukan.</p>

            <div className="faq-grid faq-grid-ref">
              {faqItems.map((item) => (
                <details className="faq-item faq-item-ref" key={item.label}>
                  <summary>
                    <span className="faq-summary-left">
                      <span className="faq-icon-badge" aria-hidden="true">{item.icon}</span>
                      <span>{item.label}</span>
                    </span>
                  </summary>
                  <div className="faq-answer">{item.answer}</div>
                </details>
              ))}
              {faqLoading ? <div className="faq-loading-note">Memuat FAQ...</div> : null}
            </div>
          </div>

          <aside className="faq-help-card" aria-label="Bantuan FAQ">
            <div className="faq-help-illustration">
              <img src="/study.png" alt="Ilustrasi bantuan" className="faq-help-image" />
            </div>
            <h3>Masih ada pertanyaan lain?</h3>
            <p>Tim kami siap membantu Anda kapan saja.</p>
            <a
              href="mailto:nicecendekia@gmail.com?subject=Halo%20Nice%20Cendekia&body=Halo%20Tim%20Nice%20Cendekia%2C%0A%0ASaya%20ingin%20bertanya%20mengenai..."
              className="faq-help-button"
            >
              Hubungi Kami <span aria-hidden="true">🎧</span>
            </a>
          </aside>
        </div>
      </section>

      <footer className="site-footer" aria-label="Footer Nice On">
        <div className="container site-footer-inner">
          <div className="site-footer-copy">© {currentYear} Nice On. All rights reserved.</div>
        </div>
      </footer>

    </div>
  )
}

function AuthPage({ title, cta, secondary, secondaryLink }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>{title}</h1>
        <p>{secondary}</p>
        <input placeholder="Email" />
        <input placeholder="Password" type="password" />
        {title === 'Daftar Akun' && <input placeholder="Konfirmasi Password" type="password" />}
        <button>{cta}</button>
        <p className="auth-switch">{secondaryLink.text} <Link to={secondaryLink.to}>{secondaryLink.link}</Link></p>
        <Link to="/" className="back-home">Kembali ke Beranda</Link>
      </div>
    </div>
  )
}

function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitMessage, setSubmitMessage] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = (field) => (event) => {
    const value = event.target.value
    setForm((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleLoginSubmit = async (event) => {
    event.preventDefault()

    setIsSubmitting(true)
    setFieldErrors({})
    setSubmitMessage(null)

    try {
      const response = await fetch(`${BACKEND_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        setFieldErrors(payload.errors ?? {})
        setSubmitMessage({ type: 'error', text: payload.message ?? 'Login gagal.' })
        return
      }

      setSubmitMessage({ type: 'success', text: payload.message ?? 'Login berhasil.' })
      storeAuthUser(payload.data ?? null)

      const isAdmin = Number(payload.data?.is_admin ?? 0) === 1
      if (isAdmin) {
        navigate('/dashboard-admin', {
          replace: true,
          state: {
            user: payload.data ?? null,
          },
        })
        return
      }

      navigate('/dashboard-user', {
        replace: true,
        state: {
          user: payload.data ?? null,
        },
      })
    } catch {
      setSubmitMessage({ type: 'error', text: 'Tidak bisa terhubung ke server login.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page auth-page-blue auth-page-split">
      <section className="auth-visual">
        <div className="brand-stage">
          <div className="brand-stage-badge">NICE ON LEARNING HUB</div>
          <div className="login-hero-art">
            <img src={niceonImage} alt="Nice On" className="login-hero-image" />
          </div>
          <div className="login-brand-copy">
            <p className="login-brand-kicker">Platform belajar yang fokus, terarah, dan siap tempur.</p>
            <h2>Belajar tenang. Nembak skor lebih tajam.</h2>
            <p className="login-brand-lead">Satu ruang belajar untuk tryout, evaluasi progres, dan ritme latihan yang terasa jelas dari awal sampai hari ujian.</p>
          </div>
          <div className="brand-proof-grid" aria-label="Keunggulan utama">
            <span className="brand-proof">Tryout Real CAT</span>
            <span className="brand-proof">Mentor Aktif</span>
            <span className="brand-proof">Evaluasi Cepat</span>
          </div>
        </div>
        <div className="visual-card">
          <div className="visual-badge">TRYOUT</div>
          <h2>Belajar Lebih Cerdas<br /><span>Prestasi Mengesankan</span></h2>
          <p className="visual-card-copy">Bangun konsistensi belajar dengan simulasi, umpan balik, dan target yang terasa nyata.</p>
        </div>
      </section>

      <section className="auth-form-side">
        <div className="login-card">
          <h1>Selamat Datang<br />Kembali!</h1>
          <p className="register-sub">Mulailah mengerjakan tryoutmu!</p>

          <form className="register-form" onSubmit={(event) => void handleLoginSubmit(event)}>
            <label htmlFor="loginEmail">Email</label>
            <input id="loginEmail" type="email" placeholder="nama@email.com" value={form.email} onChange={updateField('email')} />
            {fieldErrors.email ? <div className="field-error">{fieldErrors.email[0]}</div> : null}

            <label htmlFor="loginPassword">Password</label>
            <div className="password-wrap">
              <input id="loginPassword" type={showPassword ? 'text' : 'password'} placeholder="Masukkan password" value={form.password} onChange={updateField('password')} />
              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
            {fieldErrors.password ? <div className="field-error">{fieldErrors.password[0]}</div> : null}

            <Link to="/forgot-password" className="forgot-link">Lupa Password?</Link>

            {submitMessage ? <div className={`submit-message ${submitMessage.type}`}>{submitMessage.text}</div> : null}

            <button type="submit" className="register-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Memproses...' : 'Masuk'}
            </button>

            <div className="divider">ATAU</div>

            <button type="button" className="google-btn">Sign in with Google</button>
            <Link to="/register" className="alt-auth-btn">Belum Punya Akun? Daftar Sekarang!</Link>

            <div className="auth-bottom-links">
              <a href="#">Tentang Kami</a>
              <a href="#">Syarat dan Ketentuan</a>
              <a href="#">Kebijakan Privasi</a>
            </div>
            <Link to="/" className="back-home">Kembali ke Beranda</Link>
          </form>
        </div>
      </section>
    </div>
  )
}

function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    captchaAnswer: '',
  })
  const [captchaChallenge, setCaptchaChallenge] = useState(null)
  const [captchaLoading, setCaptchaLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const updateField = (field) => (event) => {
    const value = event.target.value

    setForm((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
  }

  const loadCaptcha = async () => {
    setCaptchaLoading(true)

    try {
      const response = await fetch(`${BACKEND_URL}/api/captcha`)
      if (!response.ok) {
        throw new Error('Failed to load captcha')
      }

      const payload = await response.json()
      setCaptchaChallenge(payload)
    } catch {
      setCaptchaChallenge(null)
    } finally {
      setCaptchaLoading(false)
    }
  }

  useEffect(() => {
    void loadCaptcha()
  }, [])

  const handleRegisterSubmit = async (event) => {
    event.preventDefault()

    setIsSubmitting(true)
    setSubmitMessage(null)
    setFieldErrors({})

    try {
      const response = await fetch(`${BACKEND_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          password_confirmation: form.confirmPassword,
          captchaToken: captchaChallenge?.token ?? '',
          captchaAnswer: form.captchaAnswer,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        setFieldErrors(payload.errors ?? {})
        setSubmitMessage({ type: 'error', text: payload.message ?? 'Pendaftaran gagal.' })
        setForm((current) => ({ ...current, captchaAnswer: '' }))
        await loadCaptcha()
        return
      }

      setSubmitMessage({ type: 'success', text: payload.message ?? 'Akun berhasil dibuat.' })
      setForm({
        email: '',
        password: '',
        confirmPassword: '',
        captchaAnswer: '',
      })
      await loadCaptcha()
      navigate('/complete-profile', {
        state: {
          registeredUser: payload.data ?? null,
        },
      })
    } catch {
      setSubmitMessage({ type: 'error', text: 'Tidak bisa terhubung ke server register.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page auth-page-blue auth-page-split register-page-split">
      <section className="auth-visual register-visual">
        <div className="brand-stage register-brand-stage">
          <div className="brand-stage-badge">NICE ON LEARNING HUB</div>
          <div className="login-hero-art register-hero-art">
            <img src={niceonImage} alt="Nice On" className="login-hero-image" />
          </div>
          <div className="login-brand-copy register-brand-copy">
            <p className="login-brand-kicker">Start Your Nice On Journey</p>
            <h2>Siapkan akunmu. Belajar lebih terarah setiap hari</h2>
            <p className="login-brand-lead">Gabung ke ruang belajar yang menyatukan tryout, evaluasi progres, dan pendampingan yang terasa rapi sejak awal.</p>
          </div>
          <div className="brand-proof-grid" aria-label="Keunggulan register">
            <span className="brand-proof">Akses Cepat</span>
            <span className="brand-proof">Progres Tercatat</span>
            <span className="brand-proof">Belajar Terarah</span>
          </div>
        </div>
      </section>

      <section className="auth-form-side register-form-side">
        <div className="register-card">
          <div className="auth-secondary-logo" aria-label="Nice On">NICE ON</div>
          <h1>Daftar Akun</h1>
          <p className="register-sub">Buat akun dulu, lengkapi profil setelah pendaftaran berhasil.</p>

          <form className="register-form" onSubmit={(event) => void handleRegisterSubmit(event)}>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" placeholder="nama@email.com" value={form.email} onChange={updateField('email')} />
            {fieldErrors.email ? <div className="field-error">{fieldErrors.email[0]}</div> : null}

            <label htmlFor="password">Password</label>
            <div className="password-wrap">
              <input id="password" type={showPassword ? 'text' : 'password'} placeholder="Masukkan password" value={form.password} onChange={updateField('password')} />
              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
            {fieldErrors.password ? <div className="field-error">{fieldErrors.password[0]}</div> : null}

            <label htmlFor="confirmPassword">Konfirmasi Password</label>
            <div className="password-wrap">
              <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="Ulangi password" value={form.confirmPassword} onChange={updateField('confirmPassword')} />
              <button
                type="button"
                className="password-toggle"
                aria-label={showConfirmPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                aria-pressed={showConfirmPassword}
                onClick={() => setShowConfirmPassword((current) => !current)}
              >
                {showConfirmPassword ? '🙈' : '👁'}
              </button>
            </div>
            {fieldErrors.password_confirmation ? <div className="field-error">{fieldErrors.password_confirmation[0]}</div> : null}

            <div className="register-note">
              Setelah akun dibuat, kamu akan diarahkan untuk melengkapi profil seperti nama, no. HP, alamat, dan data pribadi lainnya.
            </div>

            <label htmlFor="captchaAnswer">Captcha</label>
            <div className="captcha-box">
              <div className="captcha-dummy">
                {captchaChallenge ? (
                  <img src={captchaChallenge.image} alt="Captcha code" className="captcha-image" />
                ) : (
                  <div className="captcha-fallback">Captcha belum tersedia</div>
                )}
                <button type="button" className="captcha-refresh" onClick={() => void loadCaptcha()} disabled={captchaLoading}>
                  {captchaLoading ? 'Memuat...' : 'Muat Ulang'}
                </button>
              </div>
              <input
                id="captchaAnswer"
                type="text"
                placeholder="Ketik kode captcha"
                autoComplete="off"
                value={form.captchaAnswer}
                onChange={(event) => {
                  const value = event.target.value.toUpperCase()
                  setForm((current) => ({ ...current, captchaAnswer: value }))
                  setFieldErrors((current) => ({ ...current, captcha_answer: undefined }))
                }}
              />
              {fieldErrors.captcha_answer ? <div className="field-error">{fieldErrors.captcha_answer[0]}</div> : null}
              {captchaChallenge?.token ? <input type="hidden" name="captchaToken" value={captchaChallenge.token} readOnly /> : null}
            </div>

            {submitMessage ? <div className={`submit-message ${submitMessage.type}`}>{submitMessage.text}</div> : null}

            <button type="submit" className="register-btn" disabled={isSubmitting || captchaLoading}>
              {isSubmitting ? 'Memproses...' : 'Daftar'}
            </button>

            <p className="register-switch">
              Sudah pernah daftar? <Link to="/login">Login di sini</Link>
            </p>
            <Link to="/" className="back-home">Kembali ke Beranda</Link>
          </form>
        </div>
      </section>
    </div>
  )
}

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()

    setIsSubmitting(true)
    setSubmitMessage(null)

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 700))
      setSubmitMessage({ type: 'success', text: 'Jika email terdaftar, tautan reset password akan dikirim ke email tersebut.' })
      setEmail('')
    } catch {
      setSubmitMessage({ type: 'error', text: 'Tidak bisa memproses permintaan saat ini.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page auth-page-blue auth-page-split forgot-page-split">
      <section className="auth-visual forgot-visual">
        <div className="brand-stage forgot-brand-stage">
          <div className="brand-stage-badge">NICE ON LEARNING HUB</div>
          <div className="login-hero-art forgot-hero-art">
            <img src={niceonImage} alt="Nice On" className="login-hero-image" />
          </div>
          <div className="login-brand-copy forgot-brand-copy">
            <p className="login-brand-kicker">Bantuan akses akun</p>
            <h2>Reset password lebih cepat, aman, dan terarah.</h2>
            <p className="login-brand-lead">Masukkan email akunmu untuk menerima tautan reset password dan lanjut belajar kembali tanpa hambatan.</p>
          </div>
          <div className="brand-proof-grid" aria-label="Keunggulan reset password">
            <span className="brand-proof">Proses Cepat</span>
            <span className="brand-proof">Aman</span>
            <span className="brand-proof">Mudah Dipahami</span>
          </div>
        </div>
      </section>

      <section className="auth-form-side forgot-form-side">
        <div className="register-card forgot-card">
          <div className="auth-secondary-logo" aria-label="Nice On">NICE ON</div>
          <h1>Lupa Password?</h1>
          <p className="register-sub">Masukkan email yang terdaftar untuk menerima tautan reset password.</p>

          <form className="register-form" onSubmit={(event) => void handleSubmit(event)}>
            <label htmlFor="forgotEmail">Email</label>
            <input
              id="forgotEmail"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <div className="register-note">
              Jika email cocok dengan akun kamu, kami akan mengirimkan instruksi untuk membuat password baru.
            </div>

            {submitMessage ? <div className={`submit-message ${submitMessage.type}`}>{submitMessage.text}</div> : null}

            <button type="submit" className="register-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Mengirim...' : 'Kirim Link Reset'}
            </button>

            <Link to="/login" className="alt-auth-btn">Kembali ke Login</Link>
            <Link to="/" className="back-home">Kembali ke Beranda</Link>
          </form>
        </div>
      </section>
    </div>
  )
}

function CompleteProfilePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const registeredUser = location.state?.registeredUser
  const [form, setForm] = useState({
    nama: '',
    ttl: '',
    gender: '',
    nohp: '',
    alamat: '',
    refference: '',
    referenceOther: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitMessage, setSubmitMessage] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const onboardingSteps = [
    { number: '1', label: 'Buat Akun', state: 'complete' },
    { number: '2', label: 'Lengkapi Profil', state: 'current' },
    { number: '3', label: 'Mulai Belajar', state: 'pending' },
  ]
  const referenceOptions = ['Instagram', 'Teman', 'Google', 'TikTok', 'YouTube', 'Sekolah/Kampus', 'Lainnya']
  const completedOnboardingSteps = onboardingSteps.filter((step) => step.state === 'complete').length
  const profileProgress = Math.round((completedOnboardingSteps / onboardingSteps.length) * 100)

  const sanitizePhoneNumber = (value) => {
    const normalized = String(value ?? '').replace(/[^0-9+]/g, '')
    if (!normalized.includes('+')) return normalized

    const leadingPlus = normalized.startsWith('+') ? '+' : ''
    const digitsOnly = normalized.slice(leadingPlus ? 1 : 0).replace(/\+/g, '')
    return `${leadingPlus}${digitsOnly}`
  }

  const updateField = (field) => (event) => {
    const value = event.target.value
    setForm((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleCompleteProfileSubmit = async (event) => {
    event.preventDefault()

    if (!registeredUser?.pid) {
      setSubmitMessage({ type: 'error', text: 'Data akun tidak ditemukan. Ulangi proses register terlebih dahulu.' })
      return
    }

    setIsSubmitting(true)
    setFieldErrors({})
    setSubmitMessage(null)

    try {
      const response = await fetch(`${BACKEND_URL}/api/complete-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          pid_user: registeredUser.pid,
          nama: form.nama,
          ttl: form.ttl,
          gender: form.gender,
          nohp: form.nohp,
          alamat: form.alamat,
          refference: form.refference,
          reference_other: form.refference === 'Lainnya' ? form.referenceOther : '',
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        setFieldErrors(payload.errors ?? {})
        setSubmitMessage({ type: 'error', text: payload.message ?? 'Profil gagal disimpan.' })
        return
      }

      setSubmitMessage({ type: 'success', text: payload.message ?? 'Profil berhasil disimpan.' })
      window.setTimeout(() => {
        navigate('/login')
      }, 900)
    } catch {
      setSubmitMessage({ type: 'error', text: 'Tidak bisa terhubung ke server profil.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page auth-page-blue onboarding-page complete-profile-page">
      <div className="complete-profile-shell">
        <header className="complete-profile-hero onboarding-surface-card">
          <div className="complete-profile-hero-copy">
            <div className="onboarding-success-pill complete-profile-badge">Almost there</div>
            <h1>Bagus, akunmu sudah siap. Tinggal lengkapi profil untuk lanjut belajar.</h1>
            <p>Kami siapkan langkah onboarding yang lebih rapi supaya pengalaman belajarmu terasa lebih personal dan terarah.</p>

            <div className="complete-profile-stepper" aria-label="Progress onboarding">
              {onboardingSteps.map((step) => (
                <div key={step.label} className={`complete-profile-step is-${step.state}`}>
                  <span>{step.state === 'complete' ? '✓' : step.number}</span>
                  <strong>{step.label}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="complete-profile-progress-wrap" aria-label="Progress selesai 25 persen">
            <div className="complete-profile-progress-ring" style={{ '--progress-angle': `${profileProgress * 3.6}deg` }}>
              <div className="complete-profile-progress-inner">
                <strong>{profileProgress}%</strong>
                <span>Selesai</span>
              </div>
            </div>
          </div>
        </header>

        <div className="complete-profile-grid">
          <aside className="onboarding-summary-panel onboarding-summary-surface complete-profile-side-card">
            <img src={niceonImage} alt="Nice On" className="onboarding-stage-logo" />
            <p className="onboarding-stage-kicker">Next Step</p>
            <h2>Lengkapi identitas dasar agar pengalaman belajar lebih pas.</h2>

            <div className="onboarding-summary-grid complete-profile-summary-grid">
              <div className="onboarding-summary-card">
                <span>Email Terdaftar</span>
                <strong>{registeredUser?.email ?? 'Belum tersedia'}</strong>
              </div>
              <div className="onboarding-summary-card">
                <span>Status Akun</span>
                <strong>Onboarding aktif</strong>
              </div>
              <div className="onboarding-summary-card">
                <span>Target Tahap Ini</span>
                <strong>Profil dasar selesai</strong>
              </div>
            </div>

            <div className="onboarding-bullet-card complete-profile-benefits-card">
              <strong>Setelah profil selesai</strong>
              <ul>
                <li>Data akun jadi lebih lengkap dan siap dipakai</li>
                <li>Onboarding kamu terasa lebih terarah</li>
                <li>Tahap masuk ke belajar jadi lebih mulus</li>
              </ul>
            </div>
          </aside>

          <section className="register-card complete-profile-card onboarding-form-card onboarding-form-surface">
            <div className="auth-secondary-logo onboarding-mini-brand" aria-label="Nice On">NICE ON</div>
            <p className="complete-profile-kicker">Lengkapi Profil</p>
            <h2 className="complete-profile-title">Informasi tentang dirimu</h2>
            <p className="register-sub complete-profile-sub">Isi data dasar dengan benar agar pengalaman belajar bisa disesuaikan lebih optimal.</p>

            <div className="submit-message success onboarding-account-banner complete-profile-banner">
              <strong>Akun onboarding aktif.</strong> {registeredUser ? <>Email <strong>{registeredUser.email}</strong> sudah tercatat dengan ID <strong>{registeredUser.pid}</strong>.</> : 'Lanjutkan dengan melengkapi profil dasar.'}
            </div>

            <form className="register-form complete-profile-form" onSubmit={(event) => void handleCompleteProfileSubmit(event)}>
              <div className="complete-profile-fields">
                <div className="complete-profile-field full">
                  <label htmlFor="profileName">Nama Lengkap</label>
                  <input id="profileName" type="text" placeholder="Masukkan nama lengkap" value={form.nama} onChange={updateField('nama')} />
                  {fieldErrors.nama ? <div className="field-error">{fieldErrors.nama[0]}</div> : null}
                </div>

                <div className="complete-profile-field full">
                  <label htmlFor="profileTtl">Tempat, Tanggal Lahir</label>
                  <input id="profileTtl" type="text" placeholder="Contoh: Jakarta, 01 Januari 2000" value={form.ttl} onChange={updateField('ttl')} />
                  {fieldErrors.ttl ? <div className="field-error">{fieldErrors.ttl[0]}</div> : null}
                </div>

                <div className="complete-profile-field">
                  <label htmlFor="profileGender">Jenis Kelamin</label>
                  <select id="profileGender" value={form.gender} onChange={updateField('gender')}>
                    <option value="" disabled>Pilih jenis kelamin</option>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                  {fieldErrors.gender ? <div className="field-error">{fieldErrors.gender[0]}</div> : null}
                </div>

                <div className="complete-profile-field">
                  <label htmlFor="profilePhone">No. HP</label>
                  <input
                    id="profilePhone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="08xxxxxxxxxx"
                    value={form.nohp}
                    onChange={(event) => {
                      const value = sanitizePhoneNumber(event.target.value)
                      setForm((current) => ({ ...current, nohp: value }))
                      setFieldErrors((current) => ({ ...current, nohp: undefined }))
                    }}
                  />
                  {fieldErrors.nohp ? <div className="field-error">{fieldErrors.nohp[0]}</div> : null}
                </div>

                <div className="complete-profile-field full">
                  <label htmlFor="profileAddress">Alamat</label>
                  <textarea id="profileAddress" placeholder="Masukkan alamat lengkap" value={form.alamat} onChange={updateField('alamat')}></textarea>
                  {fieldErrors.alamat ? <div className="field-error">{fieldErrors.alamat[0]}</div> : null}
                </div>

                <div className="complete-profile-field full">
                  <label htmlFor="profileReference">Referensi (Opsional)</label>
                  <select
                    id="profileReference"
                    value={form.refference}
                    onChange={(event) => {
                      const value = event.target.value
                      setForm((current) => ({
                        ...current,
                        refference: value,
                        referenceOther: value === 'Lainnya' ? current.referenceOther : '',
                      }))
                      setFieldErrors((current) => ({
                        ...current,
                        refference: undefined,
                        reference_other: undefined,
                      }))
                    }}
                  >
                    <option value="">Pilih referensi</option>
                    {referenceOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {fieldErrors.refference ? <div className="field-error">{fieldErrors.refference[0]}</div> : null}
                </div>

                {form.refference === 'Lainnya' ? (
                  <div className="complete-profile-field full">
                    <label htmlFor="profileReferenceOther">Referensi Lainnya</label>
                    <input
                      id="profileReferenceOther"
                      type="text"
                      placeholder="Tulis referensi lainnya"
                      value={form.referenceOther}
                      onChange={(event) => {
                        const value = event.target.value
                        setForm((current) => ({ ...current, referenceOther: value }))
                        setFieldErrors((current) => ({ ...current, reference_other: undefined }))
                      }}
                    />
                    {fieldErrors.reference_other ? <div className="field-error">{fieldErrors.reference_other[0]}</div> : null}
                  </div>
                ) : null}

                {fieldErrors.pid_user ? <div className="field-error complete-profile-error full">{fieldErrors.pid_user[0]}</div> : null}

                {submitMessage ? <div className={`submit-message ${submitMessage.type} complete-profile-submit full`}>{submitMessage.text}</div> : null}
              </div>

              <button type="submit" className="register-btn complete-profile-btn" disabled={isSubmitting}>
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan dan Lanjut'}</span>
                <span className="complete-profile-btn-arrow" aria-hidden="true">→</span>
              </button>

              <div className="onboarding-footer-note complete-profile-security-note">Data kamu aman. Kami tidak akan membagikan informasi pribadimu ke pihak lain.</div>

              <Link to="/login" className="back-home complete-profile-back-link">Lanjut ke Login</Link>
            </form>
          </section>
        </div>

        <div className="complete-profile-footer">
          <strong>Langkah 2 dari 3</strong>
          <div className="complete-profile-dots" aria-hidden="true">
            <span className="is-active"></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  )
}

function AccountProfileEditModal({ open, onClose, profile }) {
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

function AccountProfilePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const storedUser = readStoredUser()
  const user = location.state?.user ?? storedUser
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef(null)
  const [profile, setProfile] = useState(user ? { ...user, detail: null } : null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(Boolean(user))
  const [profileError, setProfileError] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

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
    if (!user?.pid) {
      setIsLoadingProfile(false)
      return
    }

    let isMounted = true

    const loadProfile = async () => {
      setIsLoadingProfile(true)
      setProfileError(null)

      try {
        const response = await fetch(`${BACKEND_URL}/api/account-profile/${user.pid}`)
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message || 'Profil gagal dimuat.')
        }

        if (isMounted) {
          setProfile((current) => ({
            ...current,
            ...payload.data,
            detail: payload.data?.detail ?? null,
          }))
        }
      } catch (error) {
        if (isMounted) {
          setProfileError(error instanceof Error ? error.message : 'Profil gagal dimuat.')
        }
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false)
        }
      }
    }

    void loadProfile()

    return () => {
      isMounted = false
    }
  }, [user?.pid])

  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/account-profile' }} />
  }

  const activeProfile = profile ?? user
  const detail = activeProfile?.detail ?? {}
  const displayName = detail.nama || activeProfile?.nama || activeProfile?.name || activeProfile?.email?.split('@')?.[0] || 'User'
  const username = activeProfile?.email ? `@${activeProfile.email.split('@')[0]}` : '@user'
  const emailLabel = activeProfile?.email || 'Belum tersedia'
  const backDashboardPath = Number(activeProfile?.is_admin ?? user?.is_admin ?? 0) === 1 ? '/dashboard-admin' : '/dashboard-user'
  const genderLabel = detail.gender === 'L' ? 'Laki-laki' : detail.gender === 'P' ? 'Perempuan' : 'Belum diisi'
  const formattedBirthDate = detail.ttl || 'Belum diisi'

  const currentPath = location.pathname
  const adminMainMenu = [
    { label: 'Dashboard', href: '/dashboard-admin' },
    { label: 'User', href: '/dashboard-admin/users' },
    { label: 'Paket', href: '/dashboard-admin/packages' },
    { label: 'Materi', href: '/dashboard-admin/materials' },
    { label: 'Transaksi', href: '/dashboard-admin/transactions' },
    { label: 'Konten', href: '#' },
    { label: 'Laporan', href: '#' },
  ]
  const isAdminProfile = Number(activeProfile?.is_admin ?? user?.is_admin ?? 0) === 1
  const profileJoinedAt = formatProfileJoinDate(activeProfile?.created_at ?? user?.created_at)
  const roleLabel = isAdminProfile ? 'Super Admin' : 'User'
  const bioText = String(detail.alamat ?? '').trim()
  const personalInfoItems = [
    ['Nama Lengkap', displayName],
    ['Tempat, Tanggal Lahir', formattedBirthDate],
    ['Jenis Kelamin', genderLabel],
    ['No. HP', detail.nohp || '-'],
    ['Alamat', detail.alamat || '-'],
    ['Referensi', formatReferenceDisplay(detail)],
  ]

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    clearAuthUser()

    navigate('/login', { replace: true })
  }

  return (
    <div className={`${isAdminProfile ? 'admin-dashboard-page' : 'dashboard-page dashboard-page-v2'} account-profile-page`}>
      <div className={`${isAdminProfile ? 'admin-dashboard-shell' : 'dashboard-shell dashboard-shell-v2'}${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        {isAdminProfile ? (
          <aside className={`admin-sidebar${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
            <AdminBrandBlock isCollapsed={isSidebarCollapsed} />

            <div className="admin-sidebar-group-label">Main</div>
            <nav className="admin-sidebar-nav" aria-label="Navigasi admin">
              {adminMainMenu.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={`admin-sidebar-item${currentPath === item.href ? ' active' : ''}`}
                  onClick={() => item.href !== '#' && navigate(item.href)}
                >
                  <span className="admin-sidebar-icon" aria-hidden="true">{item.label.slice(0, 1)}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <AdminQuestionMenu currentPath={currentPath} navigate={navigate} />

            <AdminSystemMenu currentPath={currentPath} navigate={navigate} />

            <AdminUserMenu
              profileUser={activeProfile}
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
            user={activeProfile}
            displayName={displayName}
            isProfileComplete={activeProfile?.profile_completed !== false}
            onLogout={handleLogout}
          />
        )}

        <main className={`${isAdminProfile ? 'admin-main' : 'dashboard-main dashboard-main-v2'} account-profile-main`}>
          <div className="account-profile-shell">
            <header className="dashboard-topbar account-profile-topbar">
              <div className="dashboard-topbar-left account-profile-topbar-left">
                <button
                  type="button"
                  className="dashboard-menu-button"
                  aria-label={isSidebarCollapsed ? 'Buka navigasi' : 'Sembunyikan navigasi'}
                  onClick={() => setIsSidebarCollapsed((current) => !current)}
                >
                  ☰
                </button>
                <div className="account-profile-breadcrumb">
                  <span>Dashboard</span>
                  <span aria-hidden="true">›</span>
                  <span>{isAdminProfile ? 'Admin' : 'User'}</span>
                  <span aria-hidden="true">›</span>
                  <strong>Profil</strong>
                </div>
              </div>

              <div className="dashboard-topbar-right account-profile-topbar-right">
                <label className="account-profile-topbar-search">
                  <span aria-hidden="true">⌕</span>
                  <input type="search" placeholder="Cari sesuatu..." />
                  <kbd>⌘K</kbd>
                </label>
                <button type="button" className="dashboard-notification-button" aria-label="Notifikasi">
                  🔔<span className="dashboard-notification-dot" />
                </button>
                <div className="dashboard-profile-menu-wrap" ref={profileMenuRef}>
                  <button
                    type="button"
                    className="dashboard-profile-chip"
                    aria-haspopup="menu"
                    aria-expanded={isProfileMenuOpen}
                    onClick={() => setIsProfileMenuOpen((current) => !current)}
                  >
                    <span className="dashboard-profile-avatar">{displayName.slice(0, 2).toUpperCase()}</span>
                    <span>{displayName}</span>
                    <span aria-hidden="true">⌄</span>
                  </button>

                  {isProfileMenuOpen ? (
                    <div className="dashboard-profile-dropdown" role="menu" aria-label="Menu akun">
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

            {profileError ? <div className="account-profile-alert error">{profileError}</div> : null}
            {isLoadingProfile ? <div className="account-profile-alert">Memuat data profil...</div> : null}

            <section className="account-profile-hero-card">
              <div className="account-profile-cover">
                <div className="account-profile-avatar-frame">
                  <div className="account-profile-avatar-circle" aria-hidden="true">
                    <span>{displayName.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <span className="account-profile-avatar-camera" aria-hidden="true">📷</span>
                </div>
              </div>

              <div className="account-profile-hero-content">
                <div className="account-profile-title-block">
                  <div className="account-profile-title-line">
                    <h1>{displayName}</h1>
                    <span className="account-profile-role-badge">{roleLabel}</span>
                  </div>
                  <div className="account-profile-hero-meta">
                    <span>{username}</span>
                    <span>{emailLabel}</span>
                    <span>Bergabung {profileJoinedAt}</span>
                  </div>
                </div>

                <button type="button" className="account-profile-hero-edit" onClick={() => setShowEditModal(true)}>
                  Edit Profil
                </button>
              </div>
            </section>

            <section className="account-profile-grid-layout">
              <div className="account-profile-column">
                <article className="account-profile-card">
                  <div className="account-profile-card-head">
                    <div className="account-profile-card-title">
                      <span className="account-profile-card-icon" aria-hidden="true">👤</span>
                      <h2>Informasi Pribadi</h2>
                    </div>
                    <button type="button" className="account-profile-edit-button" onClick={() => setShowEditModal(true)}>Edit</button>
                  </div>
                  <div className="account-profile-card-body">
                    {personalInfoItems.map(([label, value]) => (
                      <div className="account-profile-row" key={label}>
                        <span className="account-profile-row-label">{label}</span>
                        <strong className="account-profile-row-value">{value}</strong>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="account-profile-card account-profile-empty-card">
                  <div className="account-profile-card-head">
                    <div className="account-profile-card-title">
                      <span className="account-profile-card-icon" aria-hidden="true">💼</span>
                      <h2>Job Roles</h2>
                    </div>
                  </div>
                  <div className="account-profile-empty-state account-profile-job-empty">
                    <div className="account-profile-empty-icon" aria-hidden="true">💼</div>
                    <strong>Belum ada job role</strong>
                    <p>Mohon pilih minimal satu job role untuk akun ini.</p>
                    <button type="button" className="account-profile-empty-action">Kelola Job Role</button>
                  </div>
                </article>
              </div>

              <div className="account-profile-column">
                <article className="account-profile-card">
                  <div className="account-profile-card-head">
                    <div className="account-profile-card-title">
                      <span className="account-profile-card-icon" aria-hidden="true">📝</span>
                      <h2>Biografi</h2>
                    </div>
                    <button type="button" className="account-profile-edit-button" onClick={() => setShowEditModal(true)}>Edit</button>
                  </div>
                  <div className="account-profile-card-body">
                    {bioText ? (
                      <div className="account-profile-bio-box">
                        <p>{bioText}</p>
                      </div>
                    ) : (
                      <div className="account-profile-empty-state account-profile-bio-empty">
                        <div className="account-profile-empty-icon" aria-hidden="true">📝</div>
                        <strong>Belum ada biografi</strong>
                        <p>Tambahkan biografi untuk memperkenalkan diri Anda.</p>
                        <button type="button" className="account-profile-empty-action" onClick={() => setShowEditModal(true)}>Tambah Biografi</button>
                      </div>
                    )}
                  </div>
                </article>

                <article className="account-profile-card account-profile-empty-card">
                  <div className="account-profile-card-head">
                    <div className="account-profile-card-title">
                      <span className="account-profile-card-icon" aria-hidden="true">🕘</span>
                      <h2>Riwayat Aktivitas</h2>
                    </div>
                  </div>
                  <div className="account-profile-empty-state account-profile-history-empty">
                    <div className="account-profile-empty-icon account-profile-history-icon" aria-hidden="true">🧾</div>
                    <strong>Tidak ada riwayat aktivitas</strong>
                    <p>Riwayat aktivitas akan tampil setelah aktivitas tersedia.</p>
                  </div>
                </article>
              </div>
            </section>

            <div className="account-profile-footer-actions">
              <button type="button" className="dashboard-secondary-action" onClick={() => navigate(backDashboardPath, { state: { user: activeProfile } })}>
                Kembali ke Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>

      <AccountProfileEditModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        profile={activeProfile}
      />

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

function DashboardUserPage() {
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

function DashboardUserPageV2() {
  const location = useLocation()
  const navigate = useNavigate()
  const storedUser = readStoredUser()
  const user = location.state?.user ?? storedUser
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef(null)

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

  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/dashboard-user' }} />
  }

  const currentPath = location.pathname
  const displayName = user?.nama || user?.name || user?.email?.split('@')?.[0] || 'User'
  const isProfileComplete = user?.profile_completed !== false
  const initials = displayName.slice(0, 2).toUpperCase()

  const sidebarItems = [
    { label: 'Dashboard', href: '/dashboard-user' },
    { label: 'Materi', href: '/dashboard-user/materials' },
    { label: 'Tryout', href: '/dashboard-user/tryout' },
    { label: 'Jadwal', href: '#' },
    { label: 'Bantuan', href: '#' },
  ]

  const stats = [
    ['Progress', isProfileComplete ? '100%' : '0%', isProfileComplete ? 'Profil siap dipakai' : 'Profil belum lengkap'],
    ['Tryout Hari Ini', '0', 'Belum ada aktivitas'],
    ['Target Mingguan', '7 sesi', 'Siap ditetapkan'],
    ['Streak Belajar', '3 hari', 'Pertahankan konsistensi!'],
  ]

  const quickActions = [
    { label: 'Materi', desc: 'Buka materi belajar', href: '/dashboard-user/materials' },
    { label: 'Tryout', desc: 'Kerjakan tryout', href: '/dashboard-user/tryout' },
    { label: 'Jadwal', desc: 'Lihat jadwal kelas', href: '#' },
    { label: 'Bantuan', desc: 'Butuh bantuan?', href: '#' },
  ]

  const nextSteps = [
    isProfileComplete ? 'Mulai dari materi atau tryout yang tersedia.' : 'Lengkapi profil dasar agar akun lebih lengkap.',
    'Masuk ke dashboard belajar dan pilih program yang sesuai.',
    'Pantau progres dari riwayat sesi berikutnya.',
  ]

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    clearAuthUser()

    navigate('/login', { replace: true })
  }

  return (
    <div className="dashboard-page dashboard-page-v2">
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

        <main className="dashboard-main dashboard-main-v2">
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
              <p>Selamat datang kembali, <strong>{displayName}</strong>! 👋</p>
            </div>

            <div className="dashboard-topbar-right">
              <button type="button" className="dashboard-home-button" aria-label="Beranda" onClick={() => navigate('/')}>
                🏠
              </button>
              <button type="button" className="dashboard-notification-button" aria-label="Notifikasi">
                🔔<span className="dashboard-notification-dot" />
              </button>
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

          <section className="dashboard-hero-card dashboard-hero-card--light">
            <div className="dashboard-hero-copy">
              <div className="dashboard-status-pill success">Login Berhasil</div>
              <h1>Dashboard siap menemani belajarmu.</h1>
              <p>
                Dari sini kamu bisa melanjutkan profil, mengecek progres, atau langsung masuk ke sesi belajar berikutnya.
              </p>
              <div className="dashboard-hero-actions">
                <button type="button" className="dashboard-primary-action" onClick={() => navigate('/')}>
                  Mulai Belajar <span aria-hidden="true">→</span>
                </button>
                <button type="button" className="dashboard-secondary-action" onClick={() => navigate('/login')}>
                  Ganti Akun <span aria-hidden="true">↻</span>
                </button>
              </div>
            </div>

            <div className="dashboard-hero-visual dashboard-hero-visual-image" aria-hidden="true">
              <img src="/study.png" alt="Ilustrasi belajar" className="dashboard-study-image" />
            </div>
          </section>

          <section className="dashboard-stats-grid">
            {stats.map(([label, value, desc], index) => (
              <article className="dashboard-stat-card" key={label}>
                <div className="dashboard-stat-badge">{label.slice(0, 1)}</div>
                <div className="dashboard-stat-label">{label}</div>
                <strong>{value}</strong>
                <p>{desc}</p>
                <span className={`dashboard-stat-bar bar-${index + 1}`} />
              </article>
            ))}
          </section>

          <section className="dashboard-panels-grid">
            <article className="dashboard-panel-card dashboard-next-steps-card">
              <div className="dashboard-panel-head">
                <h3>Langkah Berikutnya</h3>
                <span>{isProfileComplete ? 'SIAP' : 'PERLU DILENGKAPI'}</span>
              </div>
              <ol className="dashboard-step-list">
                {nextSteps.map((step, index) => (
                  <li key={step}>
                    <span>{index + 1}</span>
                    <p>{step}</p>
                    <span aria-hidden="true">›</span>
                  </li>
                ))}
              </ol>
            </article>

            <article className="dashboard-panel-card dashboard-quick-access-card">
              <div className="dashboard-panel-head">
                <h3>Akses Cepat</h3>
                <span>SHORTCUT</span>
              </div>
              <div className="dashboard-quick-grid">
                {quickActions.map((item) => (
                  <button key={item.label} type="button" className="dashboard-quick-tile" onClick={() => item.href !== '#' && navigate(item.href, { state: { user } })}>
                    <div className="dashboard-quick-tile-icon">{item.label.slice(0, 1)}</div>
                    <div className="dashboard-quick-tile-copy">
                      <strong>{item.label}</strong>
                      <span>{item.desc}</span>
                    </div>
                    <span aria-hidden="true">→</span>
                  </button>
                ))}
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

function UserTryoutPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const profileMenuRef = useRef(null)
  const storedUser = readStoredUser()
  const user = location.state?.user ?? storedUser

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [packageRows, setPackageRows] = useState([])
  const [packageLoading, setPackageLoading] = useState(true)
  const [packageError, setPackageError] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedTryoutType, setSelectedTryoutType] = useState('SKD')
  const [tryoutData, setTryoutData] = useState(null)
  const [tryoutLoading, setTryoutLoading] = useState(true)
  const [tryoutError, setTryoutError] = useState(null)
  const [answerMap, setAnswerMap] = useState({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [isStarting, setIsStarting] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)
  const [resultData, setResultData] = useState(null)

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
        const response = await fetch(`${BACKEND_URL}/api/packages`)
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message || 'Data paket gagal dimuat.')
        }

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
  }, [])

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
        const response = await fetch(`${BACKEND_URL}/api/tryout/current?user_id=${user.pid}`)
        const contentType = response.headers.get('content-type') || ''
        const rawBody = await response.text()
        const payload = contentType.includes('application/json') && rawBody ? JSON.parse(rawBody) : null

        if (!response.ok) {
          throw new Error(payload?.message || 'Sesi tryout gagal dimuat.')
        }

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
  }, [user?.pid])

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
  }, [tryoutData])

  useEffect(() => {
    if (!tryoutData || tryoutData.session?.is_finished) {
      setRemainingSeconds(0)
      return undefined
    }

    const durationMinutes = Number(tryoutData.settings?.duration_minutes || 100)
    const expiresAtRaw = tryoutData.settings?.expires_at || null
    const startedAt = new Date(tryoutData.session.created_at).getTime()
    const expiresAt = expiresAtRaw ? new Date(expiresAtRaw).getTime() : startedAt + (durationMinutes * 60 * 1000)

    const updateTimer = () => {
      const nextRemaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
      setRemainingSeconds(nextRemaining)
    }

    updateTimer()
    const timer = window.setInterval(updateTimer, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [tryoutData, isFinishing])

  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/dashboard-user/tryout' }} />
  }

  const currentPath = location.pathname
  const displayName = user?.nama || user?.name || user?.email?.split('@')?.[0] || 'User'
  const initials = displayName.slice(0, 2).toUpperCase()
  const isProfileComplete = user?.profile_completed !== false

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
    if (selectedCategory === 'ALL') return true
    return String(item.kategori || '').trim().toUpperCase() === selectedCategory
  })

  const currentQuestions = tryoutData?.questions || []
  const currentQuestion = currentQuestions[currentQuestionIndex] || currentQuestions[0] || null
  const answeredCount = currentQuestions.filter((question) => answerMap[String(question.id)]).length
  const progressPercent = currentQuestions.length ? Math.round((answeredCount / currentQuestions.length) * 100) : 0

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    clearAuthUser()

    navigate('/login', { replace: true })
  }

  const startTryout = async (packageRow) => {
    if (!packageRow?.pid || !user?.pid) return

    setIsStarting(true)
    setTryoutError(null)

    try {
      const response = await fetch(`${BACKEND_URL}/api/tryout/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          user_id: user.pid,
          package_id: packageRow.pid,
          jenis_tryout: selectedTryoutType,
        }),
      })

      const contentType = response.headers.get('content-type') || ''
      const rawBody = await response.text()
      const payload = contentType.includes('application/json') && rawBody ? JSON.parse(rawBody) : null

      if (!response.ok) {
        throw new Error(payload?.message || 'Tryout gagal dimulai.')
      }

      setTryoutLoading(false)
      setTryoutData(payload?.data ?? null)
      setResultData(payload?.data?.session?.is_finished ? payload.data : null)
    } catch (error) {
      setTryoutError(error instanceof Error ? error.message : 'Tryout gagal dimulai.')
      setTryoutLoading(false)
    } finally {
      setIsStarting(false)
    }
  }

  const saveAnswer = async (questionId, optionId) => {
    if (!tryoutData?.session?.id || !user?.pid) return

    setAnswerMap((current) => ({
      ...current,
      [String(questionId)]: String(optionId),
    }))

    try {
      const response = await fetch(`${BACKEND_URL}/api/tryout/${tryoutData.session.id}/answer`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          user_id: user.pid,
          question_id: questionId,
          option_id: optionId,
        }),
      })

      const contentType = response.headers.get('content-type') || ''
      const rawBody = await response.text()
      const payload = contentType.includes('application/json') && rawBody ? JSON.parse(rawBody) : null

      if (!response.ok) {
        throw new Error(payload?.message || 'Jawaban gagal disimpan.')
      }
    } catch (error) {
      setTryoutError(error instanceof Error ? error.message : 'Jawaban gagal disimpan.')
    }
  }

  const finishTryout = async () => {
    if (!tryoutData?.session?.id || !user?.pid || isFinishing) return

    setIsFinishing(true)
    setTryoutError(null)

    try {
      const response = await fetch(`${BACKEND_URL}/api/tryout/${tryoutData.session.id}/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ user_id: user.pid }),
      })

      const contentType = response.headers.get('content-type') || ''
      const rawBody = await response.text()
      const payload = contentType.includes('application/json') && rawBody ? JSON.parse(rawBody) : null

      if (!response.ok) {
        throw new Error(payload?.message || 'Tryout gagal diselesaikan.')
      }

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

  return (
    <div className="dashboard-page dashboard-page-v2 user-tryout-page">
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
              <p>Simulasi Tryout <strong>{displayName}</strong></p>
            </div>

            <div className="dashboard-topbar-right">
              <button type="button" className="dashboard-home-button" aria-label="Beranda" onClick={() => navigate('/dashboard-user', { state: { user } })}>
                🏠
              </button>
              <button type="button" className="dashboard-notification-button" aria-label="Notifikasi">
                🔔<span className="dashboard-notification-dot" />
              </button>
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
                    <span>Sisa Waktu</span>
                    <strong>{formatTryoutCountdown(remainingSeconds)}</strong>
                  </article>
                  <article>
                    <span>Terjawab</span>
                    <strong>{answeredCount}/{currentQuestions.length}</strong>
                  </article>
                  <article>
                    <span>Progress</span>
                    <strong>{progressPercent}%</strong>
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
                    <button type="button" className="dashboard-card-link" onClick={() => void finishTryout()} disabled={isFinishing}>
                      {isFinishing ? 'Menutup...' : 'Selesai Ujian'}
                    </button>
                  </div>

                  {currentQuestion ? (
                    <div className="user-tryout-question-body">
                      {currentQuestion.information ? <p className="user-tryout-question-info">{currentQuestion.information}</p> : null}
                      <div className="user-tryout-question-text">{currentQuestion.question}</div>

                      <div className="user-tryout-option-list">
                        {currentQuestion.options.map((option, index) => {
                          const selected = String(answerMap[String(currentQuestion.id)] || '') === String(option.id)
                          return (
                            <button
                              key={option.id ?? `${currentQuestion.id}-${index}`}
                              type="button"
                              className={`user-tryout-option${selected ? ' selected' : ''}`}
                              onClick={() => {
                                void saveAnswer(currentQuestion.id, option.id)
                              }}
                            >
                              <span className="user-tryout-option-badge">{String.fromCharCode(65 + index)}</span>
                              <span className="user-tryout-option-text">{option.choise}</span>
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
                      disabled={currentQuestionIndex <= 0}
                    >
                      Soal Sebelumnya
                    </button>
                    <button
                      type="button"
                      className="dashboard-primary-action"
                      onClick={() => setCurrentQuestionIndex((current) => Math.min(currentQuestions.length - 1, current + 1))}
                      disabled={currentQuestionIndex >= currentQuestions.length - 1}
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
                      <div><span>Sisa</span><strong>{formatTryoutCountdown(remainingSeconds)}</strong></div>
                    </div>
                    <button type="button" className="dashboard-primary-action user-tryout-finish-button" onClick={() => void finishTryout()} disabled={isFinishing}>
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
                <div className="user-tryout-result-grid">
                  <div><span>TWK</span><strong>{resultData.session.score_twk}</strong></div>
                  <div><span>TIU</span><strong>{resultData.session.score_tiu}</strong></div>
                  <div><span>TKP</span><strong>{resultData.session.score_tkp}</strong></div>
                  <div><span>Total</span><strong>{resultData.session.score_total}</strong></div>
                </div>
              </article>

              <article className="dashboard-panel-card">
                <div className="dashboard-panel-head">
                  <h3>Review Jawaban</h3>
                  <span>{resultData.questions.length} SOAL</span>
                </div>
                <div className="user-tryout-review-list">
                  {resultData.questions.map((question, index) => (
                    <button
                      key={question.id}
                      type="button"
                      className={`user-tryout-review-item${question.is_correct ? ' correct' : ' wrong'}`}
                      onClick={() => setCurrentQuestionIndex(index)}
                    >
                      <span>{index + 1}</span>
                      <div>
                        <strong>{question.question}</strong>
                        <p>{question.question_group_label}</p>
                      </div>
                      <em>{question.is_correct ? 'Benar' : 'Salah'}</em>
                    </button>
                  ))}
                </div>
                <div className="user-tryout-result-actions">
                  <button type="button" className="dashboard-secondary-action" onClick={() => { setTryoutData(null); setResultData(null); setAnswerMap({}); setCurrentQuestionIndex(0); }}>
                    Kembali ke Paket
                  </button>
                  <button type="button" className="dashboard-primary-action" onClick={() => navigate('/dashboard-user', { state: { user } })}>
                    Ke Dashboard
                  </button>
                </div>
              </article>
            </section>
          ) : null}

          {!tryoutData && !tryoutLoading ? (
            <>
              <section className="user-tryout-hero-card">
                <div>
                  <div className="dashboard-status-pill success">Simulasi Tryout</div>
                  <h2>Latihan CAT dengan alur yang mendekati ujian asli.</h2>
                  <p>Pilih paket tryout, mulai sesi, dan kerjakan soal dengan timer yang berjalan otomatis.</p>
                </div>
                <div className="user-tryout-hero-stats">
                  {quickStats.map(([label, value]) => (
                    <article key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </article>
                  ))}
                </div>
              </section>

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

              <section className="user-tryout-package-grid">
                {packageLoading ? <div className="dashboard-alert">Memuat paket tryout...</div> : null}
                {filteredPackages.map((item) => (
                  <article className="user-tryout-package-card" key={item.pid}>
                    <div className="user-tryout-package-badge">{String(item.kategori || 'PROGRAM').toUpperCase()}</div>
                    <h3>{item.nama_paket}</h3>
                    <p>{item.formasi || item.jadwal || item.ket || 'Paket tryout siap dikerjakan.'}</p>
                    <div className="user-tryout-package-meta">
                      <span>{item.jadwal || 'Jadwal fleksibel'}</span>
                      <strong>{formatCurrency(item.harga)}</strong>
                    </div>
                    <button type="button" className="dashboard-primary-action" onClick={() => void startTryout(item)} disabled={isStarting}>
                      {isStarting ? 'Memulai...' : `Mulai ${selectedTryoutType}`}
                    </button>
                  </article>
                ))}
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

function AdminDashboardPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => readStoredAdminSidebarState())
  const [dashboardSummary, setDashboardSummary] = useState({
    total_user: 0,
    total_transaksi: 0,
    total_pendapatan: 0,
    total_paket: 0,
  })
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const storedUser = readStoredUser()
  const user = location.state?.user ?? storedUser
  const currentPath = location.pathname

  if (!user || Number(user?.is_admin ?? 0) !== 1) {
    return <Navigate to="/login" replace state={{ from: '/dashboard-admin' }} />
  }

  const displayName = user?.email?.split('@')?.[0] || 'Admin'
  const summaryCards = [
    { label: 'Total User', value: String(dashboardSummary.total_user ?? 0), delta: 'Data dari tbl_user', accent: 'blue', icon: '👥' },
    { label: 'Total Transaksi', value: String(dashboardSummary.total_transaksi ?? 0), delta: 'Data dari tbl_transaksi', accent: 'green', icon: '🛒' },
    { label: 'Total Pendapatan', value: formatCurrency(dashboardSummary.total_pendapatan ?? 0), delta: 'Transaksi berstatus paid', accent: 'orange', icon: '💳' },
    { label: 'Total Paket', value: String(dashboardSummary.total_paket ?? 0), delta: 'Data dari tbl_paket', accent: 'purple', icon: '📦' },
  ]
  const activityItems = [
    { icon: '👤', title: 'User baru mendaftar', subtitle: 'Budi Santoso', time: '10 menit lalu', tone: 'blue' },
    { icon: '✅', title: 'Transaksi berhasil', subtitle: 'INV-202505-1289', time: '35 menit lalu', tone: 'green' },
    { icon: '📦', title: 'Paket baru ditambahkan', subtitle: 'Paket Intensif CPNS', time: '1 jam lalu', tone: 'purple' },
    { icon: '📝', title: 'Konten baru diterbitkan', subtitle: 'Tips Belajar Efektif', time: '2 jam lalu', tone: 'blue' },
    { icon: '👤', title: 'Admin mengupdate data user', subtitle: 'Siti Aminah', time: '3 jam lalu', tone: 'orange' },
  ]
  const topPackages = [
    ['Paket Intensif CPNS', '128 transaksi'],
    ['Paket PPPK Guru', '96 transaksi'],
    ['Paket Kedinasan', '64 transaksi'],
    ['Paket Tryout Premium', '32 transaksi'],
    ['Paket Belajar Mandiri', '28 transaksi'],
  ]
  const systemStatus = [
    ['Server', 'Online'],
    ['Database', 'Online'],
    ['Mail Service', 'Online'],
    ['Storage', 'Online'],
    ['Backup', 'Aktif'],
  ]
  const currentDateLabel = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
    .format(new Date())
    .replace(/^./, (char) => char.toUpperCase())

  const adminMainMenu = [
    { label: 'Dashboard', href: '/dashboard-admin' },
    { label: 'User', href: '/dashboard-admin/users' },
    { label: 'Paket', href: '/dashboard-admin/packages' },
    { label: 'Materi', href: '/dashboard-admin/materials' },
    { label: 'Bank Soal', href: '/dashboard-admin/questions' },
    { label: 'Transaksi', href: '/dashboard-admin/transactions' },
    { label: 'Konten', href: '#' },
    { label: 'Laporan', href: '#' },
  ]
  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    clearAuthUser()

    navigate('/login', { replace: true })
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(ADMIN_SIDEBAR_COLLAPSED_KEY, String(isSidebarCollapsed))
  }, [isSidebarCollapsed])

  useEffect(() => {
    let cancelled = false

    const loadSummary = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/admin/dashboard-summary`)
        if (!response.ok) return

        const payload = await response.json()
        const nextSummary = payload?.data

        if (!cancelled && nextSummary) {
          setDashboardSummary({
            total_user: Number(nextSummary.total_user ?? 0),
            total_transaksi: Number(nextSummary.total_transaksi ?? 0),
            total_pendapatan: Number(nextSummary.total_pendapatan ?? 0),
            total_paket: Number(nextSummary.total_paket ?? 0),
          })
        }
      } catch {
        // Keep fallback value.
      }
    }

    void loadSummary()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="admin-dashboard-page">
      <div className={`admin-dashboard-shell${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <aside className={`admin-sidebar${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
          <AdminBrandBlock isCollapsed={isSidebarCollapsed} />

          <div className="admin-sidebar-group-label">Main</div>
          <nav className="admin-sidebar-nav" aria-label="Navigasi admin">
            {adminMainMenu.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`admin-sidebar-item${currentPath === item.href ? ' active' : ''}`}
                onClick={() => item.href !== '#' && navigate(item.href)}
              >
                <span className="admin-sidebar-icon" aria-hidden="true">{item.label.slice(0, 1)}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <AdminQuestionMenu currentPath={currentPath} navigate={navigate} />

          <AdminSystemMenu currentPath={currentPath} navigate={navigate} />

          <AdminUserMenu profileUser={user} displayName={displayName} onResumeProfile={(activeUser) => navigate('/account-profile', { state: { user: activeUser } })} onLogout={handleLogout} />
        </aside>

        <main className="admin-main">
          <AdminTopbar
            title="Dashboard Admin"
            searchPlaceholder="Cari sesuatu..."
            currentDateLabel={currentDateLabel}
            displayName={displayName}
            profileUser={user}
            profileRoleLabel="Super Admin"
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={() => setIsSidebarCollapsed((current) => !current)}
            onHomeClick={() => navigate('/')}
            onResumeProfile={(activeUser) => navigate('/account-profile', { state: { user: activeUser } })}
            onLogout={handleLogout}
          />

          <section className="admin-hero-row">
            <div>
              <h2>Selamat datang kembali, Ahmad Bayu! 👋</h2>
              <p>Berikut ringkasan performa platform hari ini.</p>
            </div>

            <button type="button" className="admin-range-chip">
              <span aria-hidden="true">📅</span>
              <span>19 Mei 2025 - 26 Mei 2025</span>
              <span aria-hidden="true">⌄</span>
            </button>
          </section>

          <section className="admin-summary-grid">
            {summaryCards.map((card) => (
              <article className={`admin-summary-card ${card.accent}`} key={card.label}>
                <div className={`admin-summary-icon ${card.accent}`}>{card.icon}</div>
                <div className="admin-summary-copy">
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                  <p>{card.delta}</p>
                </div>
              </article>
            ))}
          </section>

          <section className="admin-content-grid">
            <article className="admin-card admin-chart-card">
              <div className="admin-card-head">
                <h3>Grafik Pendapatan</h3>
                <button type="button" className="admin-card-chip">7 Hari Terakhir <span aria-hidden="true">⌄</span></button>
              </div>

              <div className="admin-chart-wrap">
                <svg viewBox="0 0 720 240" className="admin-chart-svg" aria-hidden="true" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="incomeLine" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stopColor="#1d64ff" />
                      <stop offset="100%" stopColor="#2e7bff" />
                    </linearGradient>
                    <linearGradient id="incomeFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="rgba(29,100,255,0.20)" />
                      <stop offset="100%" stopColor="rgba(29,100,255,0.02)" />
                    </linearGradient>
                  </defs>
                  <path d="M40 172 C90 170, 116 156, 160 132 S248 100, 292 114 S380 158, 430 98 S520 56, 580 110 S660 150, 680 146 L680 218 L40 218 Z" fill="url(#incomeFill)" />
                  <path d="M40 172 C90 170, 116 156, 160 132 S248 100, 292 114 S380 158, 430 98 S520 56, 580 110 S660 150, 680 146" fill="none" stroke="url(#incomeLine)" strokeWidth="4" strokeLinecap="round" />
                  <path d="M40 198 C90 188, 116 184, 160 150 S248 128, 292 136 S380 166, 430 138 S520 146, 580 136 S660 154, 680 160" fill="none" stroke="#b8c7ff" strokeWidth="3" strokeDasharray="4 8" strokeLinecap="round" opacity="0.9" />
                  {[40, 160, 292, 430, 580, 680].map((x, index) => (
                    <circle key={x} cx={x} cy={[172, 132, 114, 98, 110, 146][index]} r="6" fill="#fff" stroke="#1d64ff" strokeWidth="3" />
                  ))}
                </svg>

                <div className="admin-chart-legend">
                  <span><i className="legend-primary" /> Pendapatan</span>
                  <span><i className="legend-secondary" /> Minggu Lalu</span>
                </div>
              </div>
            </article>

            <article className="admin-card admin-activity-card">
              <div className="admin-card-head">
                <h3>Aktivitas Terbaru</h3>
                <button type="button" className="admin-card-link">Lihat semua</button>
              </div>

              <div className="admin-activity-list">
                {activityItems.map((item) => (
                  <div className="admin-activity-item" key={`${item.title}-${item.subtitle}`}>
                    <div className={`admin-activity-icon ${item.tone}`}>{item.icon}</div>
                    <div className="admin-activity-copy">
                      <strong>{item.title}</strong>
                      <span>{item.subtitle}</span>
                    </div>
                    <div className="admin-activity-time">{item.time}</div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="admin-bottom-grid">
            <article className="admin-card admin-donut-card">
              <h3>Distribusi User</h3>
              <div className="admin-donut-wrap">
                <div className="admin-donut" aria-hidden="true">
                  <div className="admin-donut-center">
                    <strong>1.248</strong>
                    <span>Total User</span>
                  </div>
                </div>

                <div className="admin-donut-legend">
                  <div><i className="dot green" /> Active <span>876 (70.2%)</span></div>
                  <div><i className="dot yellow" /> Inactive <span>234 (18.8%)</span></div>
                  <div><i className="dot purple" /> Pending <span>138 (11.0%)</span></div>
                </div>
              </div>
            </article>

            <article className="admin-card admin-packages-card">
              <div className="admin-card-head">
                <h3>Top Paket Terlaris</h3>
                <button type="button" className="admin-card-link">Lihat semua</button>
              </div>

              <div className="admin-rank-list">
                {topPackages.map(([name, count], index) => (
                  <div className="admin-rank-item" key={name}>
                    <div className="admin-rank-number">{index + 1}</div>
                    <div className="admin-rank-name">{name}</div>
                    <div className="admin-rank-count">{count}</div>
                  </div>
                ))}
              </div>
            </article>

            <article className="admin-card admin-status-card">
              <h3>Status Sistem</h3>
              <div className="admin-status-list">
                {systemStatus.map(([name, status]) => (
                  <div className="admin-status-item" key={name}>
                    <div className="admin-status-name">{name}</div>
                    <span className="admin-status-pill">{status}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <AdminLogoutModal
            open={showLogoutConfirm}
            onCancel={() => setShowLogoutConfirm(false)}
            onConfirm={confirmLogout}
          />
        </main>
      </div>
    </div>
  )
}

function AdminUserManagementPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => readStoredAdminSidebarState())
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [userRows, setUserRows] = useState([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [userError, setUserError] = useState(null)
  const [userSearch, setUserSearch] = useState('')
  const [userSummary, setUserSummary] = useState({ total_user: 0, user_aktif: 0, user_nonaktif: 0, admin: 0 })
  const [userCurrentPage, setUserCurrentPage] = useState(1)
  const [userPageSize, setUserPageSize] = useState(10)
  const [showRoleToggleConfirm, setShowRoleToggleConfirm] = useState(false)
  const [roleToggleTarget, setRoleToggleTarget] = useState(null)
  const [isTogglingRole, setIsTogglingRole] = useState(false)
  const [roleToggleError, setRoleToggleError] = useState(null)
  const storedUser = readStoredUser()
  const user = location.state?.user ?? storedUser

  if (!user || Number(user?.is_admin ?? 0) !== 1) {
    return <Navigate to="/login" replace state={{ from: '/dashboard-admin/users' }} />
  }

  const currentPath = location.pathname
  const displayName = user?.email?.split('@')?.[0] || 'Admin'
  const currentDateLabel = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
    .format(new Date())
    .replace(/^./, (char) => char.toUpperCase())

  const adminMainMenu = [
    { label: 'Dashboard', href: '/dashboard-admin' },
    { label: 'User', href: '/dashboard-admin/users' },
    { label: 'Paket', href: '/dashboard-admin/packages' },
    { label: 'Materi', href: '/dashboard-admin/materials' },
    { label: 'Bank Soal', href: '/dashboard-admin/questions' },
    { label: 'Transaksi', href: '/dashboard-admin/transactions' },
    { label: 'Konten', href: '#' },
    { label: 'Laporan', href: '#' },
  ]

  useEffect(() => {
    let cancelled = false

    const loadUsers = async () => {
      setIsLoadingUsers(true)
      setUserError(null)

      try {
        const response = await fetch(`${BACKEND_URL}/api/admin/users`)
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message || 'Data user gagal dimuat.')
        }

        if (!cancelled) {
          setUserRows(Array.isArray(payload.data) ? payload.data : [])
          setUserSummary(payload.summary ?? { total_user: 0, user_aktif: 0, user_nonaktif: 0, admin: 0 })
        }
      } catch (error) {
        if (!cancelled) {
          setUserError(error instanceof Error ? error.message : 'Data user gagal dimuat.')
        }
      } finally {
        if (!cancelled) {
          setIsLoadingUsers(false)
        }
      }
    }

    void loadUsers()

    return () => {
      cancelled = true
    }
  }, [])

  const visibleUserRows = userRows.filter((row) => {
    const normalizedSearch = userSearch.trim().toLowerCase()
    if (!normalizedSearch) return true

    return [row.name, row.email, row.phone, row.role, row.status, row.code]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch))
  })

  const totalUserPages = Math.max(1, Math.ceil(visibleUserRows.length / userPageSize))
  const safeUserCurrentPage = Math.min(userCurrentPage, totalUserPages)
  const userStartIndex = (safeUserCurrentPage - 1) * userPageSize
  const userPaginatedRows = visibleUserRows.slice(userStartIndex, userStartIndex + userPageSize)

  useEffect(() => {
    setUserCurrentPage(1)
  }, [userSearch, userPageSize])

  useEffect(() => {
    if (userCurrentPage > totalUserPages) {
      setUserCurrentPage(totalUserPages)
    }
  }, [userCurrentPage, totalUserPages])

  const renderUserPaginationPages = () => {
    if (totalUserPages <= 1) return [1]

    const pages = new Set([1, totalUserPages, safeUserCurrentPage])
    if (safeUserCurrentPage > 1) pages.add(safeUserCurrentPage - 1)
    if (safeUserCurrentPage < totalUserPages) pages.add(safeUserCurrentPage + 1)

    return Array.from(pages).sort((a, b) => a - b)
  }

  const userSummaryCards = [
    { label: 'Total User', value: String(userSummary.total_user ?? userRows.length), delta: 'Data dari tbl_user', accent: 'blue', icon: '👥' },
    { label: 'User Aktif', value: String(userSummary.user_aktif ?? 0), delta: 'Status aktif', accent: 'green', icon: '✅' },
    { label: 'User Nonaktif', value: String(userSummary.user_nonaktif ?? 0), delta: 'Status nonaktif', accent: 'orange', icon: '👤' },
    { label: 'Admin', value: String(userSummary.admin ?? 0), delta: 'Role admin', accent: 'purple', icon: '🛡️' },
  ]

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    clearAuthUser()

    navigate('/login', { replace: true })
  }

  const openRoleToggleConfirm = (row) => {
    if (!row || Number(row.pid) === Number(user?.pid)) return

    setRoleToggleError(null)
    setRoleToggleTarget(row)
    setShowRoleToggleConfirm(true)
  }

  const confirmRoleToggle = async () => {
    if (!roleToggleTarget) return

    setIsTogglingRole(true)
    setRoleToggleError(null)

    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/users/${roleToggleTarget.pid}/toggle-role`, {
        method: 'PATCH',
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || 'Peran user gagal diperbarui.')
      }

      const updatedRow = payload.data ?? null

      if (updatedRow) {
        setUserRows((currentRows) => currentRows.map((row) => (row.pid === updatedRow.pid ? { ...row, ...updatedRow } : row)))
        setUserSummary((currentSummary) => ({
          ...currentSummary,
          admin: updatedRow.role === 'Admin'
            ? Number(currentSummary.admin ?? 0) + 1
            : Math.max(0, Number(currentSummary.admin ?? 0) - 1),
        }))
      }

      setShowRoleToggleConfirm(false)
      setRoleToggleTarget(null)
    } catch (error) {
      setRoleToggleError(error instanceof Error ? error.message : 'Peran user gagal diperbarui.')
    } finally {
      setIsTogglingRole(false)
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(ADMIN_SIDEBAR_COLLAPSED_KEY, String(isSidebarCollapsed))
  }, [isSidebarCollapsed])

  return (
    <div className="admin-dashboard-page admin-user-page">
      <div className={`admin-dashboard-shell${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <aside className={`admin-sidebar${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
          <AdminBrandBlock isCollapsed={isSidebarCollapsed} />

          <div className="admin-sidebar-group-label">Main</div>
          <nav className="admin-sidebar-nav" aria-label="Navigasi admin">
            {adminMainMenu.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`admin-sidebar-item${currentPath === item.href ? ' active' : ''}`}
                onClick={() => item.href !== '#' && navigate(item.href)}
              >
                <span className="admin-sidebar-icon" aria-hidden="true">{item.label.slice(0, 1)}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <AdminQuestionMenu currentPath={currentPath} navigate={navigate} />

          <AdminSystemMenu currentPath={currentPath} navigate={navigate} />

          <AdminUserMenu profileUser={user} displayName={displayName} onResumeProfile={(activeUser) => navigate('/account-profile', { state: { user: activeUser } })} onLogout={handleLogout} />
        </aside>

        <main className="admin-main admin-user-main">
          <AdminTopbar
            title="Manajemen User"
            searchPlaceholder="Cari user..."
            currentDateLabel={currentDateLabel}
            displayName={displayName}
            profileUser={user}
            profileRoleLabel="Super Admin"
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={() => setIsSidebarCollapsed((current) => !current)}
            onHomeClick={() => navigate('/')}
            onResumeProfile={(activeUser) => navigate('/account-profile', { state: { user: activeUser } })}
            onLogout={handleLogout}
          />

          <section className="admin-user-toolbar">
            <div />
            <div className="admin-user-actions">
              <button type="button" className="admin-outline-action">Export</button>
              <button type="button" className="admin-primary-action">+ Tambah User</button>
            </div>
          </section>

          <section className="admin-summary-grid admin-user-summary-grid">
            {userSummaryCards.map((card) => (
              <article className={`admin-summary-card ${card.accent}`} key={card.label}>
                <div className={`admin-summary-icon ${card.accent}`}>{card.icon}</div>
                <div className="admin-summary-copy">
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                  <p>{card.delta}</p>
                </div>
              </article>
            ))}
          </section>

          <section className="admin-card admin-user-table-card">
            {userError ? <div className="admin-user-message error">{userError}</div> : null}
            {isLoadingUsers ? <div className="admin-user-message">Memuat data user...</div> : null}

            <div className="admin-user-filters">
              <label className="admin-user-search">
                <span aria-hidden="true">⌕</span>
                <input type="search" placeholder="Cari berdasarkan nama, email, atau no HP..." value={userSearch} onChange={(event) => setUserSearch(event.target.value)} />
              </label>

              <div className="admin-user-filter-group">
                <button type="button" className="admin-user-filter-pill">Semua Status <span aria-hidden="true">⌄</span></button>
                <button type="button" className="admin-user-filter-pill">Semua Peran <span aria-hidden="true">⌄</span></button>
                <button type="button" className="admin-user-filter-button">Filter</button>
                <label className="admin-page-size-control" aria-label="Jumlah data per halaman">
                  <select
                    className="admin-page-size-select"
                    value={userPageSize}
                    onChange={(event) => setUserPageSize(Number(event.target.value))}
                  >
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option} / halaman</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="admin-user-table-wrap">
              <table className="admin-user-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>No HP</th>
                    <th>Peran</th>
                    <th>Status</th>
                    <th>Bergabung</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {userPaginatedRows.map((row) => (
                    <tr key={row.pid}>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-user-avatar">{row.name.slice(0, 1)}</div>
                          <div>
                            <strong>{row.name}</strong>
                            <span>{row.code}</span>
                          </div>
                        </div>
                      </td>
                      <td>{row.email}</td>
                      <td>{row.phone}</td>
                      <td><span className={`admin-role-badge ${row.role.toLowerCase()}`}>{row.role}</span></td>
                      <td><span className={`admin-status-pill ${row.status.toLowerCase()}`}>{row.status}</span></td>
                      <td>{row.joined}</td>
                      <td>
                        <div className="admin-row-actions">
                          <button type="button" className="admin-row-action">👁</button>
                          <button
                            type="button"
                            className="admin-row-action admin-row-action-role"
                            title={Number(row.pid) === Number(user?.pid) ? 'Akun Anda' : row.role === 'Admin' ? 'Jadikan User' : 'Jadikan Admin'}
                            aria-label={Number(row.pid) === Number(user?.pid) ? `Akun Anda ${row.name}` : row.role === 'Admin' ? `Jadikan user ${row.name}` : `Jadikan admin ${row.name}`}
                            disabled={Number(row.pid) === Number(user?.pid)}
                            onClick={() => openRoleToggleConfirm(row)}
                          >
                            ↺<span>{row.role === 'Admin' ? 'User' : 'Admin'}</span>
                          </button>
                          <button type="button" className="admin-row-action danger">🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-user-footer">
              <p>Menampilkan {userPaginatedRows.length} data dari {visibleUserRows.length} user</p>
              <div className="admin-pagination">
                <button type="button" className="admin-pagination-arrow" disabled={safeUserCurrentPage === 1} onClick={() => setUserCurrentPage((current) => Math.max(1, current - 1))}>‹</button>
                {renderUserPaginationPages().map((page, index, array) => {
                  const previousPage = array[index - 1]
                  const shouldShowDots = previousPage && page - previousPage > 1

                  return (
                    <span key={page}>
                      {shouldShowDots ? <span className="admin-pagination-dots">…</span> : null}
                      <button type="button" className={`admin-pagination-page${page === safeUserCurrentPage ? ' active' : ''}`} onClick={() => setUserCurrentPage(page)}>{page}</button>
                    </span>
                  )
                })}
                <button type="button" className="admin-pagination-arrow" disabled={safeUserCurrentPage === totalUserPages} onClick={() => setUserCurrentPage((current) => Math.min(totalUserPages, current + 1))}>›</button>
              </div>
            </div>
          </section>

          <AdminLogoutModal
            open={showLogoutConfirm}
            onCancel={() => setShowLogoutConfirm(false)}
            onConfirm={confirmLogout}
          />

          <AdminLogoutModal
            open={showRoleToggleConfirm}
            onCancel={() => {
              setShowRoleToggleConfirm(false)
              setRoleToggleTarget(null)
              setRoleToggleError(null)
            }}
            onConfirm={confirmRoleToggle}
            title={roleToggleTarget ? `Ubah peran ${roleToggleTarget.name}?` : 'Ubah peran user?'}
            message={roleToggleError || (roleToggleTarget
              ? `Peran ${roleToggleTarget.name} akan diubah dari ${roleToggleTarget.role} menjadi ${roleToggleTarget.role === 'Admin' ? 'User' : 'Admin'}.`
              : 'Konfirmasi perubahan peran user.')}
            confirmLabel={isTogglingRole ? 'Memproses...' : 'Ya, ubah'}
          />
        </main>
      </div>
    </div>
  )
}

function AdminPackageManagementPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => readStoredAdminSidebarState())
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [packageRows, setPackageRows] = useState([])
  const [isLoadingPackages, setIsLoadingPackages] = useState(true)
  const [packageError, setPackageError] = useState(null)
  const [packageSearch, setPackageSearch] = useState('')
  const [selectedProgram, setSelectedProgram] = useState('Semua Program')
  const [selectedStatus, setSelectedStatus] = useState('Semua Status')
  const [packageCurrentPage, setPackageCurrentPage] = useState(1)
  const [packagePageSize, setPackagePageSize] = useState(10)
  const [showAddPackageModal, setShowAddPackageModal] = useState(false)
  const [isSavingPackage, setIsSavingPackage] = useState(false)
  const [packageSubmitError, setPackageSubmitError] = useState(null)
  const [packageSubmitSuccess, setPackageSubmitSuccess] = useState(null)
  const [packageModalMode, setPackageModalMode] = useState('create')
  const [editingPackagePid, setEditingPackagePid] = useState(null)
  const [packageForm, setPackageForm] = useState({
    kategori: 'CPNS',
    formasi: '',
    jadwal: '',
    nama_paket: '',
    harga: '',
    ket: '',
  })
  const [packageSummary, setPackageSummary] = useState({ total_paket: 0, paket_aktif: 0, paket_nonaktif: 0, total_penjualan: 0 })
  const packageSuccessTimerRef = useRef(null)
  const storedUser = readStoredUser()
  const user = location.state?.user ?? storedUser

  if (!user || Number(user?.is_admin ?? 0) !== 1) {
    return <Navigate to="/login" replace state={{ from: '/dashboard-admin/packages' }} />
  }

  const currentPath = location.pathname
  const displayName = user?.email?.split('@')?.[0] || 'Admin'
  const currentDateLabel = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
    .format(new Date())
    .replace(/^./, (char) => char.toUpperCase())

  const adminMainMenu = [
    { label: 'Dashboard', href: '/dashboard-admin' },
    { label: 'User', href: '/dashboard-admin/users' },
    { label: 'Paket', href: '/dashboard-admin/packages' },
    { label: 'Materi', href: '/dashboard-admin/materials' },
    { label: 'Bank Soal', href: '/dashboard-admin/questions' },
    { label: 'Transaksi', href: '/dashboard-admin/transactions' },
    { label: 'Konten', href: '#' },
    { label: 'Laporan', href: '#' },
  ]

  const packageSummaryCards = [
    { label: 'Total Paket', value: String(packageSummary.total_paket ?? 0), delta: 'Semua paket tersedia', accent: 'blue', icon: '📦' },
    { label: 'Paket Aktif', value: String(packageSummary.paket_aktif ?? 0), delta: 'Paket sedang aktif', accent: 'green', icon: '🏷️' },
    { label: 'Paket Nonaktif', value: String(packageSummary.paket_nonaktif ?? 0), delta: 'Paket tidak aktif', accent: 'orange', icon: '⏱️' },
    { label: 'Total Penjualan', value: formatCurrency(packageSummary.total_penjualan ?? 0), delta: 'Akumulasi harga paket', accent: 'purple', icon: '🛒' },
  ]

  const packageFilters = [
    { key: 'program', placeholder: 'Semua Program', value: selectedProgram, options: ['Semua Program', 'CPNS', 'PPPK'] },
    { key: 'status', placeholder: 'Semua Status', value: selectedStatus, options: ['Semua Status', 'Aktif', 'Nonaktif'] },
  ]

  const loadPackages = async ({ cancelled = () => false, showLoading = true } = {}) => {
    if (showLoading) {
      setIsLoadingPackages(true)
    }

    setPackageError(null)

    try {
      const params = new URLSearchParams()
      if (selectedProgram !== 'Semua Program') params.set('kategori', selectedProgram)

      const response = await fetch(`${BACKEND_URL}/api/admin/packages${params.toString() ? `?${params.toString()}` : ''}`)
      const contentType = response.headers.get('content-type') || ''
      const rawBody = await response.text()
      const payload = contentType.includes('application/json') && rawBody ? JSON.parse(rawBody) : null

      if (!response.ok) {
        const message = payload?.message || rawBody?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || `Data paket gagal dimuat (HTTP ${response.status}).`
        throw new Error(message)
      }

      if (!cancelled()) {
        setPackageRows(Array.isArray(payload?.data) ? payload.data : [])
        setPackageSummary(payload?.summary ?? { total_paket: 0, paket_aktif: 0, paket_nonaktif: 0, total_penjualan: 0 })
      }
      } catch (error) {
      if (!cancelled()) {
        const message = getFriendlyFetchError(error, 'Data paket gagal dimuat.')
        setPackageError(message.includes('<!DOCTYPE') ? 'Backend mengembalikan halaman HTML, periksa koneksi database/server.' : message)
      }
    } finally {
      if (showLoading && !cancelled()) {
        setIsLoadingPackages(false)
      }
    }
  }

  useEffect(() => {
    let cancelled = false

    void loadPackages({ cancelled: () => cancelled, showLoading: true })

    return () => {
      cancelled = true
    }
  }, [selectedProgram])

  const openAddPackageModal = () => {
    if (packageSuccessTimerRef.current) {
      window.clearTimeout(packageSuccessTimerRef.current)
      packageSuccessTimerRef.current = null
    }

    setPackageModalMode('create')
    setEditingPackagePid(null)
    setPackageSubmitError(null)
    setPackageSubmitSuccess(null)
    setPackageForm({
      kategori: 'CPNS',
      formasi: '',
      jadwal: '',
      nama_paket: '',
      harga: '',
      ket: '',
    })
    setShowAddPackageModal(true)
  }

  const openEditPackageModal = async (row) => {
    if (packageSuccessTimerRef.current) {
      window.clearTimeout(packageSuccessTimerRef.current)
      packageSuccessTimerRef.current = null
    }

    setPackageModalMode('edit')
    setEditingPackagePid(row?.pid ?? null)
    setPackageSubmitError(null)
    setPackageSubmitSuccess(null)
    setShowAddPackageModal(true)
    setPackageForm({
      kategori: row?.program || 'CPNS',
      formasi: row?.type || '',
      jadwal: '',
      nama_paket: row?.name || '',
      harga: parseCurrencyToNumber(row?.price),
      ket: row?.desc || '',
    })

    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/packages/${row?.pid}`)
      const contentType = response.headers.get('content-type') || ''
      const rawBody = await response.text()
      const payload = contentType.includes('application/json') && rawBody ? JSON.parse(rawBody) : null

      if (!response.ok) {
        const message = payload?.message || rawBody?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || `Detail paket gagal dimuat (HTTP ${response.status}).`
        throw new Error(message)
      }

      setPackageForm(createPackageFormFromDetail(payload?.data ?? {}))
    } catch (error) {
      // Keep the modal usable even if detail fetch fails.
    } finally {
      // Keep modal responsive; detail fetch is optional.
    }
  }

  const closeAddPackageModal = () => {
    if (isSavingPackage) return

    if (packageSuccessTimerRef.current) {
      window.clearTimeout(packageSuccessTimerRef.current)
      packageSuccessTimerRef.current = null
    }

    setShowAddPackageModal(false)
    setPackageSubmitError(null)
    setPackageSubmitSuccess(null)
  }

  const handlePackageFieldChange = (field, value) => {
    setPackageForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handlePackageSubmit = async (event) => {
    event.preventDefault()

    if (!packageForm.kategori.trim() || !packageForm.nama_paket.trim() || String(packageForm.harga).trim() === '') {
      setPackageSubmitError('Kategori, nama paket, dan harga wajib diisi.')
      return
    }

    setIsSavingPackage(true)
    setPackageSubmitError(null)
    setPackageSubmitSuccess(null)

    try {
      const isEditMode = packageModalMode === 'edit' && editingPackagePid !== null
      const response = await fetch(`${BACKEND_URL}/api/admin/packages${isEditMode ? `/${editingPackagePid}` : ''}`, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          kategori: packageForm.kategori.trim(),
          formasi: packageForm.formasi.trim(),
          jadwal: packageForm.jadwal.trim(),
          nama_paket: packageForm.nama_paket.trim(),
          harga: Number(packageForm.harga),
          ket: packageForm.ket.trim(),
        }),
      })

      const contentType = response.headers.get('content-type') || ''
      const rawBody = await response.text()
      const payload = contentType.includes('application/json') && rawBody ? JSON.parse(rawBody) : null

      if (!response.ok) {
        const message = payload?.message || rawBody?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || `Paket gagal disimpan (HTTP ${response.status}).`
        throw new Error(message)
      }

      setPackageSubmitSuccess(isEditMode ? 'Data paket berhasil diperbarui.' : 'Data paket berhasil disimpan.')
      setShowAddPackageModal(false)
      setEditingPackagePid(null)
      setPackageForm({
        kategori: 'CPNS',
        formasi: '',
        jadwal: '',
        nama_paket: '',
        harga: '',
        ket: '',
      })

      await loadPackages({ cancelled: () => false, showLoading: false })

      if (packageSuccessTimerRef.current) {
        window.clearTimeout(packageSuccessTimerRef.current)
      }

      packageSuccessTimerRef.current = window.setTimeout(() => {
        setPackageSubmitSuccess(null)
        packageSuccessTimerRef.current = null
      }, 2800)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Paket gagal disimpan.'
      setPackageSubmitError(message)
    } finally {
      setIsSavingPackage(false)
    }
  }

  const handleDeletePackage = async (row) => {
    if (!row?.pid) return

    const confirmed = window.confirm(`Hapus paket ${row.name}? Paket akan disembunyikan dari daftar.`)
    if (!confirmed) return

    setPackageError(null)

    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/packages/${row.pid}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      })

      const contentType = response.headers.get('content-type') || ''
      const rawBody = await response.text()
      const payload = contentType.includes('application/json') && rawBody ? JSON.parse(rawBody) : null

      if (!response.ok) {
        const message = payload?.message || rawBody?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || `Paket gagal dihapus (HTTP ${response.status}).`
        throw new Error(message)
      }

      await loadPackages({ cancelled: () => false, showLoading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Paket gagal dihapus.'
      setPackageError(message)
    }
  }

  useEffect(() => {
    return () => {
      if (packageSuccessTimerRef.current) {
        window.clearTimeout(packageSuccessTimerRef.current)
      }
    }
  }, [])

  const visiblePackageRows = packageRows.filter((row) => {
    const search = packageSearch.trim().toLowerCase()
    if (selectedStatus !== 'Semua Status' && String(row.status || '').toLowerCase() !== selectedStatus.toLowerCase()) {
      return false
    }

    if (!search) return true

    return [row.name, row.program, row.type, row.price, row.status, row.desc]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search))
  })

  const totalPackagePages = Math.max(1, Math.ceil(visiblePackageRows.length / packagePageSize))
  const safePackageCurrentPage = Math.min(packageCurrentPage, totalPackagePages)
  const packageStartIndex = (safePackageCurrentPage - 1) * packagePageSize
  const packagePaginatedRows = visiblePackageRows.slice(packageStartIndex, packageStartIndex + packagePageSize)

  useEffect(() => {
    setPackageCurrentPage(1)
  }, [packageSearch, selectedProgram, selectedStatus, packagePageSize])

  useEffect(() => {
    if (packageCurrentPage > totalPackagePages) {
      setPackageCurrentPage(totalPackagePages)
    }
  }, [packageCurrentPage, totalPackagePages])

  const renderPackagePaginationPages = () => {
    if (totalPackagePages <= 1) return [1]

    const pages = new Set([1, totalPackagePages, safePackageCurrentPage])
    if (safePackageCurrentPage > 1) pages.add(safePackageCurrentPage - 1)
    if (safePackageCurrentPage < totalPackagePages) pages.add(safePackageCurrentPage + 1)

    return Array.from(pages).sort((a, b) => a - b)
  }

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    clearAuthUser()

    navigate('/login', { replace: true })
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(ADMIN_SIDEBAR_COLLAPSED_KEY, String(isSidebarCollapsed))
  }, [isSidebarCollapsed])

  return (
    <div className="admin-dashboard-page admin-package-page">
      <div className={`admin-dashboard-shell${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <aside className={`admin-sidebar${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
          <AdminBrandBlock isCollapsed={isSidebarCollapsed} />

          <div className="admin-sidebar-group-label">Main</div>
          <nav className="admin-sidebar-nav" aria-label="Navigasi admin">
            {adminMainMenu.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`admin-sidebar-item${currentPath === item.href ? ' active' : ''}`}
                onClick={() => item.href !== '#' && navigate(item.href)}
              >
                <span className="admin-sidebar-icon" aria-hidden="true">{item.label.slice(0, 1)}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <AdminQuestionMenu currentPath={currentPath} navigate={navigate} />

          <AdminSystemMenu currentPath={currentPath} navigate={navigate} />

          <AdminUserMenu profileUser={user} displayName={displayName} onResumeProfile={(activeUser) => navigate('/account-profile', { state: { user: activeUser } })} onLogout={handleLogout} />
        </aside>

        <main className="admin-main admin-package-main">
          <AdminTopbar
            title="Paket Belajar"
            searchPlaceholder="Cari paket..."
            currentDateLabel={currentDateLabel}
            displayName={displayName}
            profileUser={user}
            profileRoleLabel="Super Admin"
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={() => setIsSidebarCollapsed((current) => !current)}
            showSearch={false}
            onHomeClick={() => navigate('/')}
            onResumeProfile={(activeUser) => navigate('/account-profile', { state: { user: activeUser } })}
            onLogout={handleLogout}
          />

          <section className="admin-package-hero">
            <div>
              <h2>Paket Belajar</h2>
              <div className="admin-breadcrumb">
                Dashboard <span>›</span> Paket
              </div>
            </div>

            <div className="admin-package-actions">
              <button type="button" className="admin-outline-action">⬇ Ekspor Data</button>
              <button type="button" className="admin-primary-action" onClick={openAddPackageModal}>＋ Tambah Paket</button>
            </div>
          </section>

          <section className="admin-summary-grid admin-package-summary-grid">
            {packageSummaryCards.map((card) => (
              <article className={`admin-summary-card ${card.accent}`} key={card.label}>
                <div className={`admin-summary-icon ${card.accent}`}>{card.icon}</div>
                <div className="admin-summary-copy">
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                  <p>{card.delta}</p>
                </div>
              </article>
            ))}
          </section>

          <section className="admin-card admin-package-filter-card">
            {packageError ? <div className="admin-user-message error">{packageError}</div> : null}
            {isLoadingPackages ? <div className="admin-user-message">Memuat data paket...</div> : null}

            <div className="admin-package-filters">
              <label className="admin-package-search">
                <span aria-hidden="true">⌕</span>
                <input type="search" placeholder="Cari paket..." value={packageSearch} onChange={(event) => setPackageSearch(event.target.value)} />
              </label>

              <div className="admin-package-filter-group">
                {packageFilters.map((filter) => (
                  <select
                    key={filter.key}
                    className="admin-package-select"
                    value={filter.value}
                    onChange={(event) => {
                      if (filter.key === 'program') {
                        setSelectedProgram(event.target.value)
                      } else {
                        setSelectedStatus(event.target.value)
                      }
                    }}
                  >
                    {filter.options.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                ))}

                <button type="button" className="admin-user-filter-button admin-package-filter-button">Filter</button>
                <label className="admin-page-size-control" aria-label="Jumlah data per halaman">
                  <select
                    className="admin-page-size-select"
                    value={packagePageSize}
                    onChange={(event) => setPackagePageSize(Number(event.target.value))}
                  >
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option} / halaman</option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="admin-package-reset"
                  onClick={() => {
                    setPackageSearch('')
                    setSelectedProgram('Semua Program')
                    setSelectedStatus('Semua Status')
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          </section>

          <section className="admin-card admin-package-table-card">
            {packageSubmitSuccess ? <div className="admin-package-banner success">{packageSubmitSuccess}</div> : null}
            <div className="admin-package-table-wrap">
              <table className="admin-user-table admin-package-table">
                <thead>
                  <tr>
                    <th>Paket</th>
                    <th>Program</th>
                    <th>Tipe</th>
                    <th>Harga</th>
                    <th>Diskon</th>
                    <th>Harga Akhir</th>
                    <th>Status</th>
                    <th>Terjual</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {packagePaginatedRows.map((row) => (
                    <tr key={row.pid}>
                      <td>
                        <div className="admin-package-cell">
                          <div className={`admin-package-thumb ${row.tone}`}>
                            <span>{row.thumb}</span>
                          </div>
                          <div className="admin-package-name">
                            <strong>{row.name}</strong>
                            <span>{row.desc}</span>
                          </div>
                        </div>
                      </td>
                      <td>{row.program}</td>
                      <td><span className={`admin-package-type-badge ${row.typeClass}`}>{row.type}</span></td>
                      <td>{row.price}</td>
                      <td><span className="admin-package-discount-pill">{row.discount}</span></td>
                      <td><strong className="admin-package-final-price">{row.finalPrice}</strong></td>
                      <td><span className={`admin-status-pill ${row.statusClass}`}>{row.status}</span></td>
                      <td>{row.sold}</td>
                      <td>
                        <div className="admin-row-actions admin-package-row-actions">
                          <button type="button" className="admin-row-action" title="Lihat paket" aria-label={`Lihat paket ${row.name}`}>👁</button>
                          <button
                            type="button"
                            className="admin-row-action admin-row-action-edit"
                            title="Edit paket"
                            aria-label={`Edit paket ${row.name}`}
                            onClick={() => {
                              void openEditPackageModal(row)
                            }}
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            className="admin-row-action danger"
                            title="Hapus paket"
                            aria-label={`Hapus paket ${row.name}`}
                            onClick={() => {
                              void handleDeletePackage(row)
                            }}
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-package-footer admin-user-footer">
              <p>Menampilkan {packagePaginatedRows.length} data dari {visiblePackageRows.length} paket</p>
              <div className="admin-pagination">
                <button type="button" className="admin-pagination-arrow" disabled={safePackageCurrentPage === 1} onClick={() => setPackageCurrentPage((current) => Math.max(1, current - 1))}>‹</button>
                {renderPackagePaginationPages().map((page, index, array) => {
                  const previousPage = array[index - 1]
                  const shouldShowDots = previousPage && page - previousPage > 1

                  return (
                    <span key={page}>
                      {shouldShowDots ? <span className="admin-pagination-dots">…</span> : null}
                      <button type="button" className={`admin-pagination-page${page === safePackageCurrentPage ? ' active' : ''}`} onClick={() => setPackageCurrentPage(page)}>{page}</button>
                    </span>
                  )
                })}
                <button type="button" className="admin-pagination-arrow" disabled={safePackageCurrentPage === totalPackagePages} onClick={() => setPackageCurrentPage((current) => Math.min(totalPackagePages, current + 1))}>›</button>
              </div>
            </div>
          </section>

          <AdminPackageFormModal
            open={showAddPackageModal}
            onCancel={closeAddPackageModal}
            onSubmit={handlePackageSubmit}
            form={packageForm}
            onFieldChange={handlePackageFieldChange}
            loading={isSavingPackage}
            error={packageSubmitError}
            title={packageModalMode === 'edit' ? 'Edit Paket' : 'Tambah Paket'}
            submitLabel={packageModalMode === 'edit' ? 'Perbarui Paket' : 'Simpan Paket'}
            helpText={packageModalMode === 'edit' ? 'Ubah data paket lalu simpan perubahan.' : 'Isi data paket sesuai kolom yang tersedia di tabel paket.'}
          />

          <AdminLogoutModal
            open={showLogoutConfirm}
            onCancel={() => setShowLogoutConfirm(false)}
            onConfirm={confirmLogout}
          />
        </main>
      </div>
    </div>
  )
}

function AdminSettingsParameterPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => readStoredAdminSidebarState())
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [parameterRows, setParameterRows] = useState([])
  const [parameterCategories, setParameterCategories] = useState([])
  const [isLoadingParameters, setIsLoadingParameters] = useState(true)
  const [parameterError, setParameterError] = useState(null)
  const [parameterSearch, setParameterSearch] = useState('')
  const [selectedParameterCategory, setSelectedParameterCategory] = useState('Semua Kategori')
  const [selectedParameterStatus, setSelectedParameterStatus] = useState('Semua Status')
  const [parameterCurrentPage, setParameterCurrentPage] = useState(1)
  const [parameterPageSize, setParameterPageSize] = useState(10)
  const [showParameterModal, setShowParameterModal] = useState(false)
  const [isSavingParameter, setIsSavingParameter] = useState(false)
  const [parameterSubmitError, setParameterSubmitError] = useState(null)
  const [parameterSubmitSuccess, setParameterSubmitSuccess] = useState(null)
  const [parameterModalMode, setParameterModalMode] = useState('create')
  const [editingParameterPid, setEditingParameterPid] = useState(null)
  const [parameterForm, setParameterForm] = useState({
    kode: '',
    nama: '',
    kategori: 'Aplikasi',
    nilai: '',
    tipe: 'text',
    deskripsi: '',
    is_active: true,
  })
  const [parameterSummary, setParameterSummary] = useState({ total_parameter: 0, parameter_aktif: 0, parameter_nonaktif: 0 })
  const parameterSuccessTimerRef = useRef(null)
  const storedUser = readStoredUser()
  const user = location.state?.user ?? storedUser

  if (!user || Number(user?.is_admin ?? 0) !== 1) {
    return <Navigate to="/login" replace state={{ from: '/dashboard-admin/settings/parameters' }} />
  }

  const currentPath = location.pathname
  const displayName = user?.email?.split('@')?.[0] || 'Admin'
  const currentDateLabel = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
    .format(new Date())
    .replace(/^./, (char) => char.toUpperCase())

  const adminMainMenu = [
    { label: 'Dashboard', href: '/dashboard-admin' },
    { label: 'User', href: '/dashboard-admin/users' },
    { label: 'Paket', href: '/dashboard-admin/packages' },
    { label: 'Materi', href: '/dashboard-admin/materials' },
    { label: 'Bank Soal', href: '/dashboard-admin/questions' },
    { label: 'Transaksi', href: '/dashboard-admin/transactions' },
    { label: 'Konten', href: '#' },
    { label: 'Laporan', href: '#' },
  ]

  const parameterSummaryCards = [
    { label: 'Total Parameter', value: String(parameterSummary.total_parameter ?? 0), delta: 'Semua parameter', accent: 'blue', icon: '⚙' },
    { label: 'Parameter Aktif', value: String(parameterSummary.parameter_aktif ?? 0), delta: 'Parameter yang dipakai sistem', accent: 'green', icon: '✅' },
    { label: 'Parameter Nonaktif', value: String(parameterSummary.parameter_nonaktif ?? 0), delta: 'Parameter sementara dimatikan', accent: 'orange', icon: '⏸' },
    { label: 'Kategori Tersedia', value: String(Math.max(0, parameterCategories.length - 1)), delta: 'Filter kategori', accent: 'purple', icon: '🗂' },
  ]

  const loadParameters = async ({ cancelled = () => false, showLoading = true } = {}) => {
    if (showLoading) {
      setIsLoadingParameters(true)
    }

    setParameterError(null)

    try {
      const params = new URLSearchParams()
      if (parameterSearch.trim()) params.set('search', parameterSearch.trim())
      if (selectedParameterCategory !== 'Semua Kategori') params.set('category', selectedParameterCategory)
      if (selectedParameterStatus !== 'Semua Status') params.set('status', selectedParameterStatus)

      const response = await fetch(`${BACKEND_URL}/api/admin/parameters${params.toString() ? `?${params.toString()}` : ''}`)
      const contentType = response.headers.get('content-type') || ''
      const rawBody = await response.text()
      const payload = contentType.includes('application/json') && rawBody ? JSON.parse(rawBody) : null

      if (!response.ok) {
        const message = payload?.message || rawBody?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || `Data parameter gagal dimuat (HTTP ${response.status}).`
        throw new Error(message)
      }

      if (!cancelled()) {
        setParameterRows(Array.isArray(payload?.data) ? payload.data : [])
        setParameterSummary(payload?.summary ?? { total_parameter: 0, parameter_aktif: 0, parameter_nonaktif: 0 })
        setParameterCategories(['Semua Kategori', ...(Array.isArray(payload?.categories) ? payload.categories : [])])
      }
    } catch (error) {
      if (!cancelled()) {
        const message = getFriendlyFetchError(error, 'Data parameter gagal dimuat.')
        setParameterError(message.includes('<!DOCTYPE') ? 'Backend mengembalikan halaman HTML, periksa koneksi database/server.' : message)
      }
    } finally {
      if (showLoading && !cancelled()) {
        setIsLoadingParameters(false)
      }
    }
  }

  useEffect(() => {
    let cancelled = false

    void loadParameters({ cancelled: () => cancelled, showLoading: true })

    return () => {
      cancelled = true
    }
  }, [parameterSearch, selectedParameterCategory, selectedParameterStatus])

  const openAddParameterModal = () => {
    if (parameterSuccessTimerRef.current) {
      window.clearTimeout(parameterSuccessTimerRef.current)
      parameterSuccessTimerRef.current = null
    }

    setParameterModalMode('create')
    setEditingParameterPid(null)
    setParameterSubmitError(null)
    setParameterSubmitSuccess(null)
    setParameterForm({
      kode: '',
      nama: '',
      kategori: selectedParameterCategory !== 'Semua Kategori' ? selectedParameterCategory : 'Aplikasi',
      nilai: '',
      tipe: 'text',
      deskripsi: '',
      is_active: true,
    })
    setShowParameterModal(true)
  }

  const openEditParameterModal = async (row) => {
    if (parameterSuccessTimerRef.current) {
      window.clearTimeout(parameterSuccessTimerRef.current)
      parameterSuccessTimerRef.current = null
    }

    setParameterModalMode('edit')
    setEditingParameterPid(row?.pid ?? null)
    setParameterSubmitError(null)
    setParameterSubmitSuccess(null)
    setShowParameterModal(true)
    setParameterForm({
      kode: row?.kode || '',
      nama: row?.nama || '',
      kategori: row?.kategori || 'Aplikasi',
      nilai: row?.nilai || '',
      tipe: row?.tipe || 'text',
      deskripsi: row?.deskripsi || '',
      is_active: (row?.status_key || 'active') === 'active',
    })

    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/parameters/${row?.pid}`)
      const contentType = response.headers.get('content-type') || ''
      const rawBody = await response.text()
      const payload = contentType.includes('application/json') && rawBody ? JSON.parse(rawBody) : null

      if (!response.ok) {
        const message = payload?.message || rawBody?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || `Detail parameter gagal dimuat (HTTP ${response.status}).`
        throw new Error(message)
      }

      setParameterForm(createParameterFormFromDetail(payload?.data ?? {}))
    } catch {
      // Keep the modal usable even if detail fetch fails.
    }
  }

  const closeParameterModal = () => {
    if (isSavingParameter) return

    if (parameterSuccessTimerRef.current) {
      window.clearTimeout(parameterSuccessTimerRef.current)
      parameterSuccessTimerRef.current = null
    }

    setShowParameterModal(false)
    setParameterSubmitError(null)
    setParameterSubmitSuccess(null)
  }

  const handleParameterFieldChange = (field, value) => {
    setParameterForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleParameterSubmit = async (event) => {
    event.preventDefault()

    if (!parameterForm.kode.trim() || !parameterForm.nama.trim() || !parameterForm.nilai.trim()) {
      setParameterSubmitError('Kode, nama, dan nilai wajib diisi.')
      return
    }

    setIsSavingParameter(true)
    setParameterSubmitError(null)
    setParameterSubmitSuccess(null)

    try {
      const isEditMode = parameterModalMode === 'edit' && editingParameterPid !== null
      const response = await fetch(`${BACKEND_URL}/api/admin/parameters${isEditMode ? `/${editingParameterPid}` : ''}`, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          kode: parameterForm.kode.trim(),
          nama: parameterForm.nama.trim(),
          kategori: parameterForm.kategori.trim(),
          nilai: parameterForm.nilai.trim(),
          tipe: parameterForm.tipe,
          deskripsi: parameterForm.deskripsi.trim(),
          is_active: Boolean(parameterForm.is_active),
        }),
      })

      const contentType = response.headers.get('content-type') || ''
      const rawBody = await response.text()
      const payload = contentType.includes('application/json') && rawBody ? JSON.parse(rawBody) : null

      if (!response.ok) {
        const message = payload?.message || rawBody?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || `Parameter gagal disimpan (HTTP ${response.status}).`
        throw new Error(message)
      }

      setParameterSubmitSuccess(isEditMode ? 'Parameter berhasil diperbarui.' : 'Parameter berhasil disimpan.')
      setShowParameterModal(false)
      setEditingParameterPid(null)
      setParameterForm({
        kode: '',
        nama: '',
        kategori: 'Aplikasi',
        nilai: '',
        tipe: 'text',
        deskripsi: '',
        is_active: true,
      })

      await loadParameters({ cancelled: () => false, showLoading: false })

      if (parameterSuccessTimerRef.current) {
        window.clearTimeout(parameterSuccessTimerRef.current)
      }

      parameterSuccessTimerRef.current = window.setTimeout(() => {
        setParameterSubmitSuccess(null)
        parameterSuccessTimerRef.current = null
      }, 2800)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Parameter gagal disimpan.'
      setParameterSubmitError(message)
    } finally {
      setIsSavingParameter(false)
    }
  }

  useEffect(() => {
    return () => {
      if (parameterSuccessTimerRef.current) {
        window.clearTimeout(parameterSuccessTimerRef.current)
      }
    }
  }, [])

  const visibleParameterRows = parameterRows

  const totalParameterPages = Math.max(1, Math.ceil(visibleParameterRows.length / parameterPageSize))
  const safeParameterCurrentPage = Math.min(parameterCurrentPage, totalParameterPages)
  const parameterStartIndex = (safeParameterCurrentPage - 1) * parameterPageSize
  const parameterPaginatedRows = visibleParameterRows.slice(parameterStartIndex, parameterStartIndex + parameterPageSize)

  useEffect(() => {
    setParameterCurrentPage(1)
  }, [parameterSearch, selectedParameterCategory, selectedParameterStatus, parameterPageSize])

  useEffect(() => {
    if (parameterCurrentPage > totalParameterPages) {
      setParameterCurrentPage(totalParameterPages)
    }
  }, [parameterCurrentPage, totalParameterPages])

  const renderParameterPaginationPages = () => {
    if (totalParameterPages <= 1) return [1]

    const pages = new Set([1, totalParameterPages, safeParameterCurrentPage])
    if (safeParameterCurrentPage > 1) pages.add(safeParameterCurrentPage - 1)
    if (safeParameterCurrentPage < totalParameterPages) pages.add(safeParameterCurrentPage + 1)

    return Array.from(pages).sort((a, b) => a - b)
  }

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    clearAuthUser()

    navigate('/login', { replace: true })
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(ADMIN_SIDEBAR_COLLAPSED_KEY, String(isSidebarCollapsed))
  }, [isSidebarCollapsed])

  return (
    <div className="admin-dashboard-page admin-parameter-page">
      <div className={`admin-dashboard-shell${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <aside className={`admin-sidebar${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
          <AdminBrandBlock isCollapsed={isSidebarCollapsed} />

          <div className="admin-sidebar-group-label">Main</div>
          <nav className="admin-sidebar-nav" aria-label="Navigasi admin">
            {adminMainMenu.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`admin-sidebar-item${currentPath === item.href ? ' active' : ''}`}
                onClick={() => item.href !== '#' && navigate(item.href)}
              >
                <span className="admin-sidebar-icon" aria-hidden="true">{item.label.slice(0, 1)}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <AdminQuestionMenu currentPath={currentPath} navigate={navigate} />

          <AdminSystemMenu currentPath={currentPath} navigate={navigate} />

          <AdminUserMenu profileUser={user} displayName={displayName} onResumeProfile={(activeUser) => navigate('/account-profile', { state: { user: activeUser } })} onLogout={handleLogout} />
        </aside>

        <main className="admin-main admin-parameter-main">
          <AdminTopbar
            title="Parameter"
            searchPlaceholder="Cari parameter..."
            currentDateLabel={currentDateLabel}
            displayName={displayName}
            profileUser={user}
            profileRoleLabel="Super Admin"
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={() => setIsSidebarCollapsed((current) => !current)}
            onHomeClick={() => navigate('/')}
            onResumeProfile={(activeUser) => navigate('/account-profile', { state: { user: activeUser } })}
            onLogout={handleLogout}
          />

          <section className="admin-hero-row admin-parameter-hero">
            <div>
              <h2>Daftar Parameter</h2>
              <div className="admin-breadcrumb">
                Dashboard <span>›</span> Pengaturan <span>›</span> Parameter
              </div>
            </div>

            <div className="admin-package-actions admin-parameter-actions">
              <button type="button" className="admin-outline-action">⬇ Ekspor Data</button>
              <button type="button" className="admin-primary-action" onClick={openAddParameterModal}>＋ Tambah Parameter</button>
            </div>
          </section>

          <section className="admin-summary-grid admin-parameter-summary-grid">
            {parameterSummaryCards.map((card) => (
              <article className={`admin-summary-card ${card.accent}`} key={card.label}>
                <div className={`admin-summary-icon ${card.accent}`}>{card.icon}</div>
                <div className="admin-summary-copy">
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                  <p>{card.delta}</p>
                </div>
              </article>
            ))}
          </section>

          <section className="admin-card admin-parameter-filter-card">
            {parameterError ? <div className="admin-user-message error">{parameterError}</div> : null}
            {isLoadingParameters ? <div className="admin-user-message">Memuat data parameter...</div> : null}

            <div className="admin-package-filters admin-parameter-filters">
              <label className="admin-package-search">
                <span aria-hidden="true">⌕</span>
                <input type="search" placeholder="Cari parameter..." value={parameterSearch} onChange={(event) => setParameterSearch(event.target.value)} />
              </label>

              <div className="admin-package-filter-group admin-parameter-filter-group">
                <select className="admin-package-select" value={selectedParameterCategory} onChange={(event) => setSelectedParameterCategory(event.target.value)}>
                  {(parameterCategories.length ? parameterCategories : ['Semua Kategori']).map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>

                <select className="admin-package-select" value={selectedParameterStatus} onChange={(event) => setSelectedParameterStatus(event.target.value)}>
                  {['Semua Status', 'Aktif', 'Nonaktif'].map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>

                <button type="button" className="admin-user-filter-button admin-package-filter-button">Filter</button>
                <label className="admin-page-size-control" aria-label="Jumlah data per halaman">
                  <select
                    className="admin-page-size-select"
                    value={parameterPageSize}
                    onChange={(event) => setParameterPageSize(Number(event.target.value))}
                  >
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option} / halaman</option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="admin-package-reset"
                  onClick={() => {
                    setParameterSearch('')
                    setSelectedParameterCategory('Semua Kategori')
                    setSelectedParameterStatus('Semua Status')
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          </section>

          <section className="admin-card admin-parameter-table-card">
            {parameterSubmitSuccess ? <div className="admin-package-banner success">{parameterSubmitSuccess}</div> : null}
            <div className="admin-user-table-wrap">
              <table className="admin-user-table admin-parameter-table">
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Kode</th>
                    <th>Kategori</th>
                    <th>Nilai</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {parameterPaginatedRows.map((row) => (
                    <tr key={row.pid}>
                      <td>
                        <div className="admin-user-cell admin-parameter-cell">
                          <div className={`admin-user-avatar admin-parameter-avatar ${row.status_key === 'active' ? 'active' : 'inactive'}`}>{row.nama.slice(0, 1)}</div>
                          <div>
                            <strong>{row.nama}</strong>
                            <span>{row.deskripsi || '-'}</span>
                          </div>
                        </div>
                      </td>
                      <td><code className="admin-parameter-code">{row.kode}</code></td>
                      <td><span className="admin-parameter-category-pill">{row.kategori}</span></td>
                      <td>{formatParameterValue(row)}</td>
                      <td><span className={`admin-status-pill ${row.status_key === 'active' ? 'success' : 'cancelled'}`}>{row.status}</span></td>
                      <td>
                        <div className="admin-row-actions admin-package-row-actions">
                          <button type="button" className="admin-row-action" title="Lihat parameter" aria-label={`Lihat parameter ${row.nama}`}>👁</button>
                          <button
                            type="button"
                            className="admin-row-action admin-row-action-edit"
                            title="Edit parameter"
                            aria-label={`Edit parameter ${row.nama}`}
                            onClick={() => {
                              void openEditParameterModal(row)
                            }}
                          >
                            ✎
                          </button>
                          <button type="button" className="admin-row-action danger" title="Hapus parameter" aria-label={`Hapus parameter ${row.nama}`}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-package-footer admin-user-footer">
              <p>Menampilkan {parameterPaginatedRows.length} data dari {visibleParameterRows.length} parameter</p>
              <div className="admin-pagination">
                <button type="button" className="admin-pagination-arrow" disabled={safeParameterCurrentPage === 1} onClick={() => setParameterCurrentPage((current) => Math.max(1, current - 1))}>‹</button>
                {renderParameterPaginationPages().map((page, index, array) => {
                  const previousPage = array[index - 1]
                  const shouldShowDots = previousPage && page - previousPage > 1

                  return (
                    <span key={page}>
                      {shouldShowDots ? <span className="admin-pagination-dots">…</span> : null}
                      <button type="button" className={`admin-pagination-page${page === safeParameterCurrentPage ? ' active' : ''}`} onClick={() => setParameterCurrentPage(page)}>{page}</button>
                    </span>
                  )
                })}
                <button type="button" className="admin-pagination-arrow" disabled={safeParameterCurrentPage === totalParameterPages} onClick={() => setParameterCurrentPage((current) => Math.min(totalParameterPages, current + 1))}>›</button>
              </div>
            </div>
          </section>

          <AdminParameterFormModal
            open={showParameterModal}
            onCancel={closeParameterModal}
            onSubmit={handleParameterSubmit}
            form={parameterForm}
            onFieldChange={handleParameterFieldChange}
            loading={isSavingParameter}
            error={parameterSubmitError}
            title={parameterModalMode === 'edit' ? 'Edit Parameter' : 'Tambah Parameter'}
            submitLabel={parameterModalMode === 'edit' ? 'Perbarui Parameter' : 'Simpan Parameter'}
            helpText={parameterModalMode === 'edit' ? 'Ubah data parameter lalu simpan perubahan.' : 'Isi parameter baru untuk pengaturan aplikasi.'}
          />

          <AdminLogoutModal
            open={showLogoutConfirm}
            onCancel={() => setShowLogoutConfirm(false)}
            onConfirm={confirmLogout}
          />
        </main>
      </div>
    </div>
  )
}

function AdminSettingsFaqPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => readStoredAdminSidebarState())
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [faqRows, setFaqRows] = useState([])
  const [faqCategories, setFaqCategories] = useState([])
  const [isLoadingFaqs, setIsLoadingFaqs] = useState(true)
  const [faqError, setFaqError] = useState(null)
  const [faqSearch, setFaqSearch] = useState('')
  const [selectedFaqCategory, setSelectedFaqCategory] = useState('Semua Kategori')
  const [selectedFaqStatus, setSelectedFaqStatus] = useState('Semua Status')
  const [faqCurrentPage, setFaqCurrentPage] = useState(1)
  const [faqPageSize, setFaqPageSize] = useState(10)
  const [showFaqModal, setShowFaqModal] = useState(false)
  const [isSavingFaq, setIsSavingFaq] = useState(false)
  const [faqSubmitError, setFaqSubmitError] = useState(null)
  const [faqSubmitSuccess, setFaqSubmitSuccess] = useState(null)
  const [faqModalMode, setFaqModalMode] = useState('create')
  const [editingFaqPid, setEditingFaqPid] = useState(null)
  const [faqForm, setFaqForm] = useState({
    kategori: 'Umum',
    pertanyaan: '',
    jawaban: '',
    ikon: '❓',
    urutan: '0',
    is_active: true,
  })
  const [faqSummary, setFaqSummary] = useState({ total_faq: 0, faq_aktif: 0, faq_nonaktif: 0 })
  const faqSuccessTimerRef = useRef(null)
  const storedUser = readStoredUser()
  const user = location.state?.user ?? storedUser

  if (!user || Number(user?.is_admin ?? 0) !== 1) {
    return <Navigate to="/login" replace state={{ from: '/dashboard-admin/settings/faqs' }} />
  }

  const currentPath = location.pathname
  const displayName = user?.email?.split('@')?.[0] || 'Admin'
  const currentDateLabel = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
    .format(new Date())
    .replace(/^./, (char) => char.toUpperCase())

  const adminMainMenu = [
    { label: 'Dashboard', href: '/dashboard-admin' },
    { label: 'User', href: '/dashboard-admin/users' },
    { label: 'Paket', href: '/dashboard-admin/packages' },
    { label: 'Materi', href: '/dashboard-admin/materials' },
    { label: 'Transaksi', href: '/dashboard-admin/transactions' },
    { label: 'Konten', href: '#' },
    { label: 'Laporan', href: '#' },
  ]

  const faqSummaryCards = [
    { label: 'Total FAQ', value: String(faqSummary.total_faq ?? 0), delta: 'Semua pertanyaan', accent: 'blue', icon: '❓' },
    { label: 'FAQ Aktif', value: String(faqSummary.faq_aktif ?? 0), delta: 'Tampil di landing page', accent: 'green', icon: '✅' },
    { label: 'FAQ Nonaktif', value: String(faqSummary.faq_nonaktif ?? 0), delta: 'Disembunyikan sementara', accent: 'orange', icon: '⏸' },
    { label: 'Kategori', value: String(Math.max(0, faqCategories.length - 1)), delta: 'Filter kategori', accent: 'purple', icon: '🗂' },
  ]

  const loadFaqs = async ({ cancelled = () => false, showLoading = true } = {}) => {
    if (showLoading) {
      setIsLoadingFaqs(true)
    }

    setFaqError(null)

    try {
      const params = new URLSearchParams()
      if (faqSearch.trim()) params.set('search', faqSearch.trim())
      if (selectedFaqCategory !== 'Semua Kategori') params.set('category', selectedFaqCategory)
      if (selectedFaqStatus !== 'Semua Status') params.set('status', selectedFaqStatus)

      const response = await fetch(`${BACKEND_URL}/api/admin/faqs${params.toString() ? `?${params.toString()}` : ''}`)
      const contentType = response.headers.get('content-type') || ''
      const rawBody = await response.text()
      const payload = contentType.includes('application/json') && rawBody ? JSON.parse(rawBody) : null

      if (!response.ok) {
        const message = payload?.message || rawBody?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || `Data FAQ gagal dimuat (HTTP ${response.status}).`
        throw new Error(message)
      }

      if (!cancelled()) {
        setFaqRows(Array.isArray(payload?.data) ? payload.data : [])
        setFaqSummary(payload?.summary ?? { total_faq: 0, faq_aktif: 0, faq_nonaktif: 0 })
        setFaqCategories(['Semua Kategori', ...(Array.isArray(payload?.categories) ? payload.categories : [])])
      }
    } catch (error) {
      if (!cancelled()) {
        const message = getFriendlyFetchError(error, 'Data FAQ gagal dimuat.')
        setFaqError(message.includes('<!DOCTYPE') ? 'Backend mengembalikan halaman HTML, periksa koneksi database/server.' : message)
      }
    } finally {
      if (showLoading && !cancelled()) {
        setIsLoadingFaqs(false)
      }
    }
  }

  useEffect(() => {
    let cancelled = false

    void loadFaqs({ cancelled: () => cancelled, showLoading: true })

    return () => {
      cancelled = true
    }
  }, [faqSearch, selectedFaqCategory, selectedFaqStatus])

  const openAddFaqModal = () => {
    if (faqSuccessTimerRef.current) {
      window.clearTimeout(faqSuccessTimerRef.current)
      faqSuccessTimerRef.current = null
    }

    setFaqModalMode('create')
    setEditingFaqPid(null)
    setFaqSubmitError(null)
    setFaqSubmitSuccess(null)
    setFaqForm({
      kategori: selectedFaqCategory !== 'Semua Kategori' ? selectedFaqCategory : 'Umum',
      pertanyaan: '',
      jawaban: '',
      ikon: '❓',
      urutan: String(faqRows.length + 1),
      is_active: true,
    })
    setShowFaqModal(true)
  }

  const openEditFaqModal = async (row) => {
    if (faqSuccessTimerRef.current) {
      window.clearTimeout(faqSuccessTimerRef.current)
      faqSuccessTimerRef.current = null
    }

    setFaqModalMode('edit')
    setEditingFaqPid(row?.pid ?? null)
    setFaqSubmitError(null)
    setFaqSubmitSuccess(null)
    setShowFaqModal(true)
    setFaqForm({
      kategori: row?.kategori || 'Umum',
      pertanyaan: row?.pertanyaan || '',
      jawaban: row?.jawaban || '',
      ikon: row?.ikon || '❓',
      urutan: String(row?.urutan ?? 0),
      is_active: (row?.status_key || 'active') === 'active',
    })

    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/faqs/${row?.pid}`)
      const contentType = response.headers.get('content-type') || ''
      const rawBody = await response.text()
      const payload = contentType.includes('application/json') && rawBody ? JSON.parse(rawBody) : null

      if (!response.ok) {
        const message = payload?.message || rawBody?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || `Detail FAQ gagal dimuat (HTTP ${response.status}).`
        throw new Error(message)
      }

      setFaqForm(createFaqFormFromDetail(payload?.data ?? {}))
    } catch {
      // Keep the modal usable even if detail fetch fails.
    }
  }

  const closeFaqModal = () => {
    if (isSavingFaq) return

    if (faqSuccessTimerRef.current) {
      window.clearTimeout(faqSuccessTimerRef.current)
      faqSuccessTimerRef.current = null
    }

    setShowFaqModal(false)
    setFaqSubmitError(null)
    setFaqSubmitSuccess(null)
  }

  const handleFaqFieldChange = (field, value) => {
    setFaqForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleFaqSubmit = async (event) => {
    event.preventDefault()

    if (!faqForm.kategori.trim() || !faqForm.pertanyaan.trim() || !faqForm.jawaban.trim()) {
      setFaqSubmitError('Kategori, pertanyaan, dan jawaban wajib diisi.')
      return
    }

    setIsSavingFaq(true)
    setFaqSubmitError(null)
    setFaqSubmitSuccess(null)

    try {
      const isEditMode = faqModalMode === 'edit' && editingFaqPid !== null
      const response = await fetch(`${BACKEND_URL}/api/admin/faqs${isEditMode ? `/${editingFaqPid}` : ''}`, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          kategori: faqForm.kategori.trim(),
          pertanyaan: faqForm.pertanyaan.trim(),
          jawaban: faqForm.jawaban.trim(),
          ikon: faqForm.ikon.trim(),
          urutan: Number(faqForm.urutan) || 0,
          is_active: Boolean(faqForm.is_active),
        }),
      })

      const contentType = response.headers.get('content-type') || ''
      const rawBody = await response.text()
      const payload = contentType.includes('application/json') && rawBody ? JSON.parse(rawBody) : null

      if (!response.ok) {
        const message = payload?.message || rawBody?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || `FAQ gagal disimpan (HTTP ${response.status}).`
        throw new Error(message)
      }

      setFaqSubmitSuccess(isEditMode ? 'FAQ berhasil diperbarui.' : 'FAQ berhasil disimpan.')
      setShowFaqModal(false)
      setEditingFaqPid(null)
      setFaqForm({
        kategori: 'Umum',
        pertanyaan: '',
        jawaban: '',
        ikon: '❓',
        urutan: '0',
        is_active: true,
      })

      await loadFaqs({ cancelled: () => false, showLoading: false })

      if (faqSuccessTimerRef.current) {
        window.clearTimeout(faqSuccessTimerRef.current)
      }

      faqSuccessTimerRef.current = window.setTimeout(() => {
        setFaqSubmitSuccess(null)
        faqSuccessTimerRef.current = null
      }, 2800)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'FAQ gagal disimpan.'
      setFaqSubmitError(message)
    } finally {
      setIsSavingFaq(false)
    }
  }

  const handleDeleteFaq = async (row) => {
    if (!window.confirm(`Hapus FAQ "${row?.pertanyaan || ''}"?`)) return

    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/faqs/${row?.pid}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      })
      const contentType = response.headers.get('content-type') || ''
      const rawBody = await response.text()
      const payload = contentType.includes('application/json') && rawBody ? JSON.parse(rawBody) : null

      if (!response.ok) {
        const message = payload?.message || rawBody?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || `FAQ gagal dihapus (HTTP ${response.status}).`
        throw new Error(message)
      }

      await loadFaqs({ cancelled: () => false, showLoading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'FAQ gagal dihapus.'
      setFaqError(message)
    }
  }

  const handleToggleFaqStatus = async (row) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/faqs/${row?.pid}/toggle`, {
        method: 'PATCH',
        headers: { Accept: 'application/json' },
      })
      const contentType = response.headers.get('content-type') || ''
      const rawBody = await response.text()
      const payload = contentType.includes('application/json') && rawBody ? JSON.parse(rawBody) : null

      if (!response.ok) {
        const message = payload?.message || rawBody?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || `Status FAQ gagal diperbarui (HTTP ${response.status}).`
        throw new Error(message)
      }

      await loadFaqs({ cancelled: () => false, showLoading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Status FAQ gagal diperbarui.'
      setFaqError(message)
    }
  }

  useEffect(() => {
    return () => {
      if (faqSuccessTimerRef.current) {
        window.clearTimeout(faqSuccessTimerRef.current)
      }
    }
  }, [])

  const visibleFaqRows = faqRows
  const totalFaqPages = Math.max(1, Math.ceil(visibleFaqRows.length / faqPageSize))
  const safeFaqCurrentPage = Math.min(faqCurrentPage, totalFaqPages)
  const faqStartIndex = (safeFaqCurrentPage - 1) * faqPageSize
  const faqPaginatedRows = visibleFaqRows.slice(faqStartIndex, faqStartIndex + faqPageSize)

  useEffect(() => {
    setFaqCurrentPage(1)
  }, [faqSearch, selectedFaqCategory, selectedFaqStatus, faqPageSize])

  useEffect(() => {
    if (faqCurrentPage > totalFaqPages) {
      setFaqCurrentPage(totalFaqPages)
    }
  }, [faqCurrentPage, totalFaqPages])

  const renderFaqPaginationPages = () => {
    if (totalFaqPages <= 1) return [1]

    const pages = new Set([1, totalFaqPages, safeFaqCurrentPage])
    if (safeFaqCurrentPage > 1) pages.add(safeFaqCurrentPage - 1)
    if (safeFaqCurrentPage < totalFaqPages) pages.add(safeFaqCurrentPage + 1)

    return Array.from(pages).sort((a, b) => a - b)
  }

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    clearAuthUser()

    navigate('/login', { replace: true })
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(ADMIN_SIDEBAR_COLLAPSED_KEY, String(isSidebarCollapsed))
  }, [isSidebarCollapsed])

  return (
    <div className="admin-dashboard-page admin-faq-page">
      <div className={`admin-dashboard-shell${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <aside className={`admin-sidebar${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
          <AdminBrandBlock isCollapsed={isSidebarCollapsed} />

          <div className="admin-sidebar-group-label">Main</div>
          <nav className="admin-sidebar-nav" aria-label="Navigasi admin">
            {adminMainMenu.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`admin-sidebar-item${currentPath === item.href ? ' active' : ''}`}
                onClick={() => item.href !== '#' && navigate(item.href)}
              >
                <span className="admin-sidebar-icon" aria-hidden="true">{item.label.slice(0, 1)}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <AdminSystemMenu currentPath={currentPath} navigate={navigate} />

          <AdminUserMenu profileUser={user} displayName={displayName} onResumeProfile={(activeUser) => navigate('/account-profile', { state: { user: activeUser } })} onLogout={handleLogout} />
        </aside>

        <main className="admin-main admin-faq-main">
          <AdminTopbar
            title="FAQ"
            searchPlaceholder="Cari FAQ..."
            currentDateLabel={currentDateLabel}
            displayName={displayName}
            profileUser={user}
            profileRoleLabel="Super Admin"
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={() => setIsSidebarCollapsed((current) => !current)}
            onHomeClick={() => navigate('/')}
            onResumeProfile={(activeUser) => navigate('/account-profile', { state: { user: activeUser } })}
            onLogout={handleLogout}
          />

          <section className="admin-hero-row admin-faq-hero">
            <div>
              <h2>Daftar FAQ</h2>
              <div className="admin-breadcrumb">
                Dashboard <span>›</span> Pengaturan <span>›</span> FAQ
              </div>
            </div>

            <div className="admin-package-actions admin-faq-actions">
              <button type="button" className="admin-outline-action">⬇ Ekspor Data</button>
              <button type="button" className="admin-primary-action" onClick={openAddFaqModal}>＋ Tambah FAQ</button>
            </div>
          </section>

          <section className="admin-summary-grid admin-faq-summary-grid">
            {faqSummaryCards.map((card) => (
              <article className={`admin-summary-card ${card.accent}`} key={card.label}>
                <div className={`admin-summary-icon ${card.accent}`}>{card.icon}</div>
                <div className="admin-summary-copy">
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                  <p>{card.delta}</p>
                </div>
              </article>
            ))}
          </section>

          <section className="admin-card admin-faq-filter-card">
            {faqError ? <div className="admin-user-message error">{faqError}</div> : null}
            {isLoadingFaqs ? <div className="admin-user-message">Memuat data FAQ...</div> : null}

            <div className="admin-package-filters admin-faq-filters">
              <label className="admin-package-search">
                <span aria-hidden="true">⌕</span>
                <input type="search" placeholder="Cari FAQ..." value={faqSearch} onChange={(event) => setFaqSearch(event.target.value)} />
              </label>

              <div className="admin-package-filter-group admin-faq-filter-group">
                <select className="admin-package-select" value={selectedFaqCategory} onChange={(event) => setSelectedFaqCategory(event.target.value)}>
                  {(faqCategories.length ? faqCategories : ['Semua Kategori']).map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>

                <select className="admin-package-select" value={selectedFaqStatus} onChange={(event) => setSelectedFaqStatus(event.target.value)}>
                  {['Semua Status', 'Aktif', 'Nonaktif'].map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>

                <button type="button" className="admin-user-filter-button admin-package-filter-button">Filter</button>
                <label className="admin-page-size-control" aria-label="Jumlah data per halaman">
                  <select
                    className="admin-page-size-select"
                    value={faqPageSize}
                    onChange={(event) => setFaqPageSize(Number(event.target.value))}
                  >
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option} / halaman</option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="admin-package-reset"
                  onClick={() => {
                    setFaqSearch('')
                    setSelectedFaqCategory('Semua Kategori')
                    setSelectedFaqStatus('Semua Status')
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          </section>

          <section className="admin-card admin-faq-table-card">
            {faqSubmitSuccess ? <div className="admin-package-banner success">{faqSubmitSuccess}</div> : null}
            <div className="admin-user-table-wrap">
              <table className="admin-user-table admin-faq-table">
                <thead>
                  <tr>
                    <th>FAQ</th>
                    <th>Kategori</th>
                    <th>Urutan</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {faqPaginatedRows.map((row) => (
                    <tr key={row.pid}>
                      <td>
                        <div className="admin-user-cell admin-faq-cell">
                          <div className={`admin-user-avatar admin-parameter-avatar ${row.status_key === 'active' ? 'active' : 'inactive'}`}>{row.ikon || '❓'}</div>
                          <div>
                            <strong>{row.pertanyaan}</strong>
                            <span>{String(row.jawaban || '-').slice(0, 120)}{String(row.jawaban || '').length > 120 ? '...' : ''}</span>
                          </div>
                        </div>
                      </td>
                      <td><span className="admin-parameter-category-pill">{row.kategori}</span></td>
                      <td><span className="admin-faq-order-pill">#{row.urutan}</span></td>
                      <td>
                        <button
                          type="button"
                          className={`admin-faq-status-toggle${row.status_key === 'active' ? ' active' : ''}`}
                          onClick={() => { void handleToggleFaqStatus(row) }}
                          aria-pressed={row.status_key === 'active'}
                          aria-label={`Ubah status FAQ ${row.pertanyaan}`}
                        >
                          <span className="admin-faq-status-track" aria-hidden="true">
                            <span className="admin-faq-status-thumb" />
                          </span>
                          <span>{row.status_key === 'active' ? 'Aktif' : 'Nonaktif'}</span>
                        </button>
                      </td>
                      <td>
                        <div className="admin-row-actions admin-package-row-actions">
                          <button
                            type="button"
                            className="admin-row-action admin-row-action-edit"
                            title="Edit FAQ"
                            aria-label={`Edit FAQ ${row.pertanyaan}`}
                            onClick={() => {
                              void openEditFaqModal(row)
                            }}
                          >
                            ✎
                          </button>
                          <button type="button" className="admin-row-action danger" title="Hapus FAQ" aria-label={`Hapus FAQ ${row.pertanyaan}`} onClick={() => { void handleDeleteFaq(row) }}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-package-footer admin-user-footer">
              <p>Menampilkan {faqPaginatedRows.length} data dari {visibleFaqRows.length} FAQ</p>
              <div className="admin-pagination">
                <button type="button" className="admin-pagination-arrow" disabled={safeFaqCurrentPage === 1} onClick={() => setFaqCurrentPage((current) => Math.max(1, current - 1))}>‹</button>
                {renderFaqPaginationPages().map((page, index, array) => {
                  const previousPage = array[index - 1]
                  const shouldShowDots = previousPage && page - previousPage > 1

                  return (
                    <span key={page}>
                      {shouldShowDots ? <span className="admin-pagination-dots">…</span> : null}
                      <button type="button" className={`admin-pagination-page${page === safeFaqCurrentPage ? ' active' : ''}`} onClick={() => setFaqCurrentPage(page)}>{page}</button>
                    </span>
                  )
                })}
                <button type="button" className="admin-pagination-arrow" disabled={safeFaqCurrentPage === totalFaqPages} onClick={() => setFaqCurrentPage((current) => Math.min(totalFaqPages, current + 1))}>›</button>
              </div>
            </div>
          </section>

          <AdminFaqFormModal
            open={showFaqModal}
            onCancel={closeFaqModal}
            onSubmit={handleFaqSubmit}
            form={faqForm}
            onFieldChange={handleFaqFieldChange}
            loading={isSavingFaq}
            error={faqSubmitError}
            title={faqModalMode === 'edit' ? 'Edit FAQ' : 'Tambah FAQ'}
            submitLabel={faqModalMode === 'edit' ? 'Perbarui FAQ' : 'Simpan FAQ'}
            helpText={faqModalMode === 'edit' ? 'Ubah data FAQ lalu simpan perubahan.' : 'Isi pertanyaan dan jawaban FAQ untuk ditampilkan di landing page.'}
          />

          <AdminLogoutModal
            open={showLogoutConfirm}
            onCancel={() => setShowLogoutConfirm(false)}
            onConfirm={confirmLogout}
          />
        </main>
      </div>
    </div>
  )
}

function AdminMaterialFormModal({ open, onCancel, onSubmit, form, packages, onFieldChange, onFileChange, loading, error, title = 'Upload Materi', submitLabel = 'Simpan Materi', helpText = 'Unggah PDF per paket dan atur status publikasi materi.' }) {
  if (!open) return null

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onCancel}>
      <div className="admin-modal admin-material-modal" role="dialog" aria-modal="true" aria-labelledby="adminMaterialTitle" onClick={(event) => event.stopPropagation()}>
        <div className="admin-modal-icon" aria-hidden="true">📄</div>
        <h3 id="adminMaterialTitle">{title}</h3>
        <p>{helpText}</p>

        <form className="admin-package-form admin-material-form" onSubmit={onSubmit}>
          {error ? <div className="admin-package-form-error">{error}</div> : null}

          <div className="admin-package-form-grid admin-material-form-grid">
            <label className="admin-package-field">
              <span>Paket</span>
              <select value={form.package_id} onChange={(event) => onFieldChange('package_id', event.target.value)} disabled={loading}>
                <option value="">Pilih paket</option>
                {packages.map((item) => (
                  <option key={item.pid} value={item.pid}>{item.name} ({item.kategori})</option>
                ))}
              </select>
            </label>

            <label className="admin-package-field">
              <span>Urutan</span>
              <input type="number" min="0" step="1" value={form.sort_order} onChange={(event) => onFieldChange('sort_order', event.target.value)} placeholder="0" disabled={loading} />
            </label>

            <label className="admin-package-field admin-package-field-full">
              <span>Judul Materi</span>
              <input type="text" value={form.judul} onChange={(event) => onFieldChange('judul', event.target.value)} placeholder="Contoh: Materi TWK Dasar" disabled={loading} />
            </label>

            <label className="admin-package-field admin-package-field-full">
              <span>Deskripsi</span>
              <textarea value={form.deskripsi} onChange={(event) => onFieldChange('deskripsi', event.target.value)} placeholder="Penjelasan singkat materi" disabled={loading}></textarea>
            </label>

            <label className="admin-package-field admin-package-field-full">
              <span>File PDF</span>
              <input type="file" accept="application/pdf,.pdf" onChange={onFileChange} disabled={loading} />
              <small className="admin-material-file-note">{form.file_label || 'Belum ada file dipilih'}</small>
            </label>

            <label className="admin-package-field admin-package-field-full admin-material-toggle-field">
              <span>Status Publikasi</span>
              <button type="button" className={`admin-parameter-toggle${form.is_published ? ' active' : ''}`} onClick={() => onFieldChange('is_published', !form.is_published)} disabled={loading}>
                <span className="admin-parameter-toggle-track" aria-hidden="true"><span className="admin-parameter-toggle-thumb" /></span>
                <span>{form.is_published ? 'Terbit' : 'Draft'}</span>
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

function UserMaterialViewerModal({ open, material, src, onClose }) {
  if (!open || !material) return null

  return (
    <div className="admin-modal-backdrop user-material-viewer-backdrop" role="presentation" onClick={onClose}>
      <div className="admin-modal user-material-viewer-modal" role="dialog" aria-modal="true" aria-labelledby="userMaterialViewerTitle" onClick={(event) => event.stopPropagation()}>
        <div className="user-material-viewer-head">
          <div>
            <div className="dashboard-status-pill success">Materi PDF</div>
            <h3 id="userMaterialViewerTitle">{material.judul}</h3>
            <p>{material.package_name} · {material.file_size_label}</p>
          </div>
          <button type="button" className="admin-faq-close" aria-label="Tutup preview" onClick={onClose}>×</button>
        </div>
        <iframe title={material.judul} src={src} className="user-material-viewer-frame" />
      </div>
    </div>
  )
}

function MaterialEmptyState({ title, description, actionLabel, onAction, accent = 'blue' }) {
  return (
    <div className={`material-empty-state ${accent}`}>
      <div className="material-empty-icon" aria-hidden="true">📄</div>
      <div className="material-empty-copy">
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      {actionLabel ? (
        <button type="button" className="dashboard-primary-action material-empty-action" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}

function AdminMaterialManagementPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => readStoredAdminSidebarState())
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [materialRows, setMaterialRows] = useState([])
  const [materialPackages, setMaterialPackages] = useState([])
  const [materialSummary, setMaterialSummary] = useState({ total_materi: 0, materi_terbit: 0, materi_draft: 0 })
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true)
  const [materialError, setMaterialError] = useState(null)
  const [materialSearch, setMaterialSearch] = useState('')
  const [selectedMaterialPackage, setSelectedMaterialPackage] = useState('ALL')
  const [selectedMaterialStatus, setSelectedMaterialStatus] = useState('ALL')
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [materialModalMode, setMaterialModalMode] = useState('create')
  const [editingMaterialPid, setEditingMaterialPid] = useState(null)
  const [isSavingMaterial, setIsSavingMaterial] = useState(false)
  const [materialSubmitError, setMaterialSubmitError] = useState(null)
  const [materialSubmitSuccess, setMaterialSubmitSuccess] = useState(null)
  const [materialForm, setMaterialForm] = useState(() => createMaterialFormFromDetail())
  const materialSuccessTimerRef = useRef(null)
  const storedUser = readStoredUser()
  const user = location.state?.user ?? storedUser

  if (!user || Number(user?.is_admin ?? 0) !== 1) {
    return <Navigate to="/login" replace state={{ from: '/dashboard-admin/materials' }} />
  }

  const currentPath = location.pathname
  const displayName = user?.email?.split('@')?.[0] || 'Admin'
  const currentDateLabel = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date()).replace(/^./, (char) => char.toUpperCase())

  const adminMainMenu = [
    { label: 'Dashboard', href: '/dashboard-admin' },
    { label: 'User', href: '/dashboard-admin/users' },
    { label: 'Paket', href: '/dashboard-admin/packages' },
    { label: 'Materi', href: '/dashboard-admin/materials' },
    { label: 'Bank Soal', href: '/dashboard-admin/questions' },
    { label: 'Transaksi', href: '/dashboard-admin/transactions' },
    { label: 'Konten', href: '#' },
    { label: 'Laporan', href: '#' },
  ]

  const materialSummaryCards = [
    { label: 'Total Materi', value: String(materialSummary.total_materi ?? 0), delta: 'Semua materi', accent: 'blue', icon: '📄' },
    { label: 'Terbit', value: String(materialSummary.materi_terbit ?? 0), delta: 'Siap diakses user', accent: 'green', icon: '✅' },
    { label: 'Draft', value: String(materialSummary.materi_draft ?? 0), delta: 'Belum dipublikasikan', accent: 'orange', icon: '📝' },
  ]

  const loadMaterials = async ({ cancelled = () => false, showLoading = true } = {}) => {
    if (showLoading) setIsLoadingMaterials(true)
    setMaterialError(null)

    try {
      const params = new URLSearchParams()
      if (materialSearch.trim()) params.set('search', materialSearch.trim())
      if (selectedMaterialPackage !== 'ALL') params.set('package_id', selectedMaterialPackage)
      if (selectedMaterialStatus !== 'ALL') params.set('status', selectedMaterialStatus)

      const response = await fetch(`${BACKEND_URL}/api/admin/materials${params.toString() ? `?${params.toString()}` : ''}`)
      const contentType = response.headers.get('content-type') || ''
      const rawBody = await response.text()
      const payload = contentType.includes('application/json') && rawBody ? JSON.parse(rawBody) : null

      if (!response.ok) {
        const message = payload?.message || rawBody?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || `Data materi gagal dimuat (HTTP ${response.status}).`
        throw new Error(message)
      }

      if (!cancelled()) {
        setMaterialRows(Array.isArray(payload?.data) ? payload.data : [])
        setMaterialPackages(Array.isArray(payload?.packages) ? payload.packages : [])
        setMaterialSummary(payload?.summary ?? { total_materi: 0, materi_terbit: 0, materi_draft: 0 })
      }
    } catch (error) {
      if (!cancelled()) {
        const message = getFriendlyFetchError(error, 'Data materi gagal dimuat.')
        setMaterialError(message.includes('<!DOCTYPE') ? 'Backend mengembalikan halaman HTML, periksa koneksi database/server.' : message)
      }
    } finally {
      if (showLoading && !cancelled()) setIsLoadingMaterials(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    void loadMaterials({ cancelled: () => cancelled, showLoading: true })
    return () => { cancelled = true }
  }, [materialSearch, selectedMaterialPackage, selectedMaterialStatus])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(ADMIN_SIDEBAR_COLLAPSED_KEY, String(isSidebarCollapsed))
  }, [isSidebarCollapsed])

  useEffect(() => () => {
    if (materialSuccessTimerRef.current) window.clearTimeout(materialSuccessTimerRef.current)
  }, [])

  const openAddMaterialModal = () => {
    if (materialSuccessTimerRef.current) {
      window.clearTimeout(materialSuccessTimerRef.current)
      materialSuccessTimerRef.current = null
    }

    setMaterialModalMode('create')
    setEditingMaterialPid(null)
    setMaterialSubmitError(null)
    setMaterialSubmitSuccess(null)
    setMaterialForm(createMaterialFormFromDetail({ package_id: selectedMaterialPackage !== 'ALL' ? selectedMaterialPackage : '' }))
    setShowMaterialModal(true)
  }

  const openEditMaterialModal = async (row) => {
    if (materialSuccessTimerRef.current) {
      window.clearTimeout(materialSuccessTimerRef.current)
      materialSuccessTimerRef.current = null
    }

    setMaterialModalMode('edit')
    setEditingMaterialPid(row?.pid ?? null)
    setMaterialSubmitError(null)
    setMaterialSubmitSuccess(null)
    setShowMaterialModal(true)
    setMaterialForm(createMaterialFormFromDetail(row ?? {}))

    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/materials/${row?.pid}`)
      const contentType = response.headers.get('content-type') || ''
      const rawBody = await response.text()
      const payload = contentType.includes('application/json') && rawBody ? JSON.parse(rawBody) : null
      if (!response.ok) {
        const message = payload?.message || rawBody?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || `Detail materi gagal dimuat (HTTP ${response.status}).`
        throw new Error(message)
      }
      setMaterialForm(createMaterialFormFromDetail(payload?.data ?? {}))
    } catch {
      // Keep modal usable even if detail fetch fails.
    }
  }

  const closeMaterialModal = () => {
    if (isSavingMaterial) return
    if (materialSuccessTimerRef.current) {
      window.clearTimeout(materialSuccessTimerRef.current)
      materialSuccessTimerRef.current = null
    }
    setShowMaterialModal(false)
    setMaterialSubmitError(null)
    setMaterialSubmitSuccess(null)
  }

  const handleMaterialFieldChange = (field, value) => {
    setMaterialForm((current) => ({ ...current, [field]: value }))
  }

  const handleMaterialFileChange = (event) => {
    const file = event.target.files?.[0] ?? null
    setMaterialForm((current) => ({
      ...current,
      file,
      file_label: file?.name || current.file_label || '',
    }))
  }

  const handleMaterialSubmit = async (event) => {
    event.preventDefault()

    if (!materialForm.package_id || !materialForm.judul.trim()) {
      setMaterialSubmitError('Paket dan judul materi wajib diisi.')
      return
    }

    if (materialModalMode === 'create' && !materialForm.file) {
      setMaterialSubmitError('File PDF wajib diunggah.')
      return
    }

    setIsSavingMaterial(true)
    setMaterialSubmitError(null)
    setMaterialSubmitSuccess(null)

    try {
      const isEditMode = materialModalMode === 'edit' && editingMaterialPid !== null
      const formData = new FormData()
      if (isEditMode) {
        formData.append('_method', 'PUT')
      }
      formData.append('package_id', materialForm.package_id)
      formData.append('judul', materialForm.judul.trim())
      formData.append('deskripsi', materialForm.deskripsi.trim())
      formData.append('sort_order', String(materialForm.sort_order || 0))
      formData.append('is_published', materialForm.is_published ? '1' : '0')
      if (materialForm.file instanceof File) {
        formData.append('file', materialForm.file)
      }

      const response = await fetch(`${BACKEND_URL}/api/admin/materials${isEditMode ? `/${editingMaterialPid}` : ''}`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      })

      const contentType = response.headers.get('content-type') || ''
      const rawBody = await response.text()
      const payload = contentType.includes('application/json') && rawBody ? JSON.parse(rawBody) : null

      if (!response.ok) {
        const message = payload?.message || rawBody?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || `Materi gagal disimpan (HTTP ${response.status}).`
        throw new Error(message)
      }

      setMaterialSubmitSuccess(isEditMode ? 'Materi berhasil diperbarui.' : 'Materi berhasil diunggah.')
      setShowMaterialModal(false)
      setEditingMaterialPid(null)
      setMaterialForm(createMaterialFormFromDetail())

      await loadMaterials({ cancelled: () => false, showLoading: false })

      if (materialSuccessTimerRef.current) window.clearTimeout(materialSuccessTimerRef.current)
      materialSuccessTimerRef.current = window.setTimeout(() => {
        setMaterialSubmitSuccess(null)
        materialSuccessTimerRef.current = null
      }, 2800)
    } catch (error) {
      setMaterialSubmitError(error instanceof Error ? error.message : 'Materi gagal disimpan.')
    } finally {
      setIsSavingMaterial(false)
    }
  }

  const handleDeleteMaterial = async (row) => {
    if (!row?.pid) return
    if (!window.confirm(`Hapus materi ${row.judul}? File PDF akan dihapus dari penyimpanan.`)) return

    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/materials/${row.pid}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      })
      const contentType = response.headers.get('content-type') || ''
      const rawBody = await response.text()
      const payload = contentType.includes('application/json') && rawBody ? JSON.parse(rawBody) : null
      if (!response.ok) {
        const message = payload?.message || rawBody?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || `Materi gagal dihapus (HTTP ${response.status}).`
        throw new Error(message)
      }
      await loadMaterials({ cancelled: () => false, showLoading: false })
    } catch (error) {
      setMaterialError(error instanceof Error ? error.message : 'Materi gagal dihapus.')
    }
  }

  const handleLogout = () => setShowLogoutConfirm(true)
  const confirmLogout = () => { clearAuthUser(); navigate('/login', { replace: true }) }

  const filteredRows = materialRows

  return (
    <div className="admin-dashboard-page admin-material-page">
      <div className={`admin-dashboard-shell${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <aside className={`admin-sidebar${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
          <AdminBrandBlock isCollapsed={isSidebarCollapsed} />

          <div className="admin-sidebar-group-label">Main</div>
          <nav className="admin-sidebar-nav" aria-label="Navigasi admin">
            {adminMainMenu.map((item) => (
              <button key={item.label} type="button" className={`admin-sidebar-item${currentPath === item.href ? ' active' : ''}`} onClick={() => item.href !== '#' && navigate(item.href)}>
                <span className="admin-sidebar-icon" aria-hidden="true">{item.label.slice(0, 1)}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <AdminQuestionMenu currentPath={currentPath} navigate={navigate} />
          <AdminSystemMenu currentPath={currentPath} navigate={navigate} />

          <AdminUserMenu profileUser={user} displayName={displayName} onResumeProfile={(activeUser) => navigate('/account-profile', { state: { user: activeUser } })} onLogout={handleLogout} />
        </aside>

        <main className="admin-main admin-material-main">
          <AdminTopbar
            title="Materi PDF"
            searchPlaceholder="Cari materi..."
            currentDateLabel={currentDateLabel}
            displayName={displayName}
            profileUser={user}
            profileRoleLabel="Super Admin"
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={() => setIsSidebarCollapsed((current) => !current)}
            showSearch={false}
            onHomeClick={() => navigate('/')}
            onResumeProfile={(activeUser) => navigate('/account-profile', { state: { user: activeUser } })}
            onLogout={handleLogout}
          />

          <section className="admin-package-hero">
            <div>
              <h2>Materi PDF</h2>
              <div className="admin-breadcrumb">
                Dashboard <span>›</span> Materi
              </div>
            </div>

            <div className="admin-package-actions">
              <button type="button" className="admin-outline-action">⬇ Ekspor Data</button>
              <button type="button" className="admin-primary-action" onClick={openAddMaterialModal}>＋ Upload Materi</button>
            </div>
          </section>

          <section className="admin-summary-grid admin-package-summary-grid">
            {materialSummaryCards.map((card) => (
              <article className={`admin-summary-card ${card.accent}`} key={card.label}>
                <div className={`admin-summary-icon ${card.accent}`}>{card.icon}</div>
                <div className="admin-summary-copy">
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                  <p>{card.delta}</p>
                </div>
              </article>
            ))}
          </section>

          <section className="admin-card admin-package-filter-card">
            {materialError ? <div className="admin-user-message error">{materialError}</div> : null}
            {isLoadingMaterials ? <div className="admin-user-message">Memuat data materi...</div> : null}

            <div className="admin-package-filters">
              <label className="admin-package-search">
                <span aria-hidden="true">⌕</span>
                <input type="search" placeholder="Cari materi..." value={materialSearch} onChange={(event) => setMaterialSearch(event.target.value)} />
              </label>

              <div className="admin-package-filter-group">
                <select className="admin-package-select" value={selectedMaterialPackage} onChange={(event) => setSelectedMaterialPackage(event.target.value)}>
                  <option value="ALL">Semua Paket</option>
                  {materialPackages.map((item) => (
                    <option key={item.pid} value={String(item.pid)}>{item.name}</option>
                  ))}
                </select>

                <select className="admin-package-select" value={selectedMaterialStatus} onChange={(event) => setSelectedMaterialStatus(event.target.value)}>
                  <option value="ALL">Semua Status</option>
                  <option value="PUBLISHED">Terbit</option>
                  <option value="DRAFT">Draft</option>
                </select>

                <button type="button" className="admin-user-filter-button admin-package-filter-button">Filter</button>
                <button type="button" className="admin-package-reset" onClick={() => { setMaterialSearch(''); setSelectedMaterialPackage('ALL'); setSelectedMaterialStatus('ALL') }}>Reset</button>
              </div>
            </div>
          </section>

          {filteredRows.length ? (
            <section className="admin-card admin-package-table-card">
              {materialSubmitSuccess ? <div className="admin-package-banner success">{materialSubmitSuccess}</div> : null}
              <div className="admin-package-table-wrap">
                <table className="admin-user-table admin-material-table">
                  <thead>
                    <tr>
                      <th>Materi</th>
                      <th>Paket</th>
                      <th>File</th>
                      <th>Ukuran</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <tr key={row.pid}>
                        <td>
                          <div className="admin-package-cell">
                            <div className="admin-package-thumb blue"><span>PDF</span></div>
                            <div className="admin-package-name">
                              <strong>{row.judul}</strong>
                              <span>{row.deskripsi || 'Tidak ada deskripsi'}</span>
                            </div>
                          </div>
                        </td>
                        <td>{row.package_name}</td>
                        <td>{row.original_name}</td>
                        <td>{row.file_size_label}</td>
                        <td><span className={`admin-package-type-badge ${row.status_key === 'published' ? 'online' : 'tryout'}`}>{row.status}</span></td>
                        <td>
                          <div className="admin-table-actions">
                            <button type="button" className="admin-table-action" onClick={() => openEditMaterialModal(row)}>Edit</button>
                            <button type="button" className="admin-table-action danger" onClick={() => handleDeleteMaterial(row)}>Hapus</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : (
            <section className="admin-card admin-material-empty-card">
              {materialSubmitSuccess ? <div className="admin-package-banner success">{materialSubmitSuccess}</div> : null}
              <MaterialEmptyState
                title="Belum ada materi PDF"
                description="Upload materi pertama untuk paket tertentu agar user bisa melihatnya setelah transaksi paid."
                actionLabel="Upload Materi"
                onAction={openAddMaterialModal}
                accent="blue"
              />
            </section>
          )}
        </main>
      </div>

      <AdminMaterialFormModal
        open={showMaterialModal}
        onCancel={closeMaterialModal}
        onSubmit={handleMaterialSubmit}
        form={materialForm}
        packages={materialPackages}
        onFieldChange={handleMaterialFieldChange}
        onFileChange={handleMaterialFileChange}
        loading={isSavingMaterial}
        error={materialSubmitError}
        title={materialModalMode === 'edit' ? 'Edit Materi' : 'Upload Materi'}
        submitLabel={materialModalMode === 'edit' ? 'Perbarui Materi' : 'Simpan Materi'}
        helpText={materialModalMode === 'edit' ? 'Ubah metadata atau ganti file PDF materi.' : 'Unggah file PDF per paket untuk ditampilkan ke user.'}
      />

      <AdminLogoutModal
        open={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
      />
    </div>
  )
}

function UserMaterialsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const profileMenuRef = useRef(null)
  const storedUser = readStoredUser()
  const user = location.state?.user ?? storedUser

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [materialRows, setMaterialRows] = useState([])
  const [materialPackages, setMaterialPackages] = useState([])
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true)
  const [materialError, setMaterialError] = useState(null)
  const [selectedMaterialPackage, setSelectedMaterialPackage] = useState('ALL')
  const [materialSearch, setMaterialSearch] = useState('')
  const [previewMaterial, setPreviewMaterial] = useState(null)

  useEffect(() => {
    const handleDocumentPointerDown = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false)
      }
    }

    const handleDocumentKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false)
        setPreviewMaterial(null)
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
    if (!user?.pid) {
      setIsLoadingMaterials(false)
      return
    }

    let cancelled = false

    const loadMaterials = async () => {
      setIsLoadingMaterials(true)
      setMaterialError(null)

      try {
        const params = new URLSearchParams({ user_id: String(user.pid) })
        if (materialSearch.trim()) params.set('search', materialSearch.trim())
        if (selectedMaterialPackage !== 'ALL') params.set('package_id', selectedMaterialPackage)

        const response = await fetch(`${BACKEND_URL}/api/materials?${params.toString()}`)
        const contentType = response.headers.get('content-type') || ''
        const rawBody = await response.text()
        const payload = contentType.includes('application/json') && rawBody ? JSON.parse(rawBody) : null

        if (!response.ok) {
          const message = payload?.message || rawBody?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || `Data materi gagal dimuat (HTTP ${response.status}).`
          throw new Error(message)
        }

        if (!cancelled) {
          setMaterialRows(Array.isArray(payload?.data) ? payload.data : [])
          setMaterialPackages(Array.isArray(payload?.packages) ? payload.packages : [])
        }
      } catch (error) {
        if (!cancelled) setMaterialError(getFriendlyFetchError(error, 'Data materi gagal dimuat.'))
      } finally {
        if (!cancelled) setIsLoadingMaterials(false)
      }
    }

    void loadMaterials()

    return () => { cancelled = true }
  }, [user?.pid, materialSearch, selectedMaterialPackage])

  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/dashboard-user/materials' }} />
  }

  const currentPath = location.pathname
  const displayName = user?.nama || user?.name || user?.email?.split('@')?.[0] || 'User'
  const initials = displayName.slice(0, 2).toUpperCase()
  const isProfileComplete = user?.profile_completed !== false

  const handleLogout = () => setShowLogoutConfirm(true)
  const confirmLogout = () => { clearAuthUser(); navigate('/login', { replace: true }) }

  const filteredRows = materialRows
  const previewSrc = previewMaterial ? `${BACKEND_URL}/api/materials/${previewMaterial.pid}/view?user_id=${user.pid}` : ''

  return (
    <div className="dashboard-page dashboard-page-v2 user-material-page">
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

        <main className="dashboard-main dashboard-main-v2 user-material-main">
          <header className="dashboard-topbar">
            <div className="dashboard-topbar-left">
              <button type="button" className="dashboard-menu-button" aria-label={isSidebarCollapsed ? 'Buka navigasi' : 'Sembunyikan navigasi'} onClick={() => setIsSidebarCollapsed((current) => !current)}>☰</button>
              <p>Materi Belajar <strong>{displayName}</strong></p>
            </div>

            <div className="dashboard-topbar-right">
              <button type="button" className="dashboard-home-button" aria-label="Beranda" onClick={() => navigate('/dashboard-user', { state: { user } })}>🏠</button>
              <button type="button" className="dashboard-notification-button" aria-label="Notifikasi">🔔<span className="dashboard-notification-dot" /></button>
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

          {materialError ? <div className="dashboard-alert error">{materialError}</div> : null}
          {isLoadingMaterials ? <div className="dashboard-alert">Memuat materi...</div> : null}

          <section className="user-tryout-hero-card user-material-hero-card">
            <div>
              <div className="dashboard-status-pill success">Akses Materi</div>
              <h2>Materi PDF yang sesuai paketmu.</h2>
              <p>Materi yang tampil hanya untuk paket yang sudah kamu beli dan bisa dibuka langsung di browser saat login.</p>
            </div>

            <div className="user-tryout-hero-stats">
              <article>
                <span>Materi Aktif</span>
                <strong>{materialRows.length}</strong>
              </article>
              <article>
                <span>Paket Terakses</span>
                <strong>{materialPackages.length}</strong>
              </article>
              <article>
                <span>Status</span>
                <strong>View Only</strong>
              </article>
            </div>
          </section>

          <section className="admin-card admin-package-filter-card">
            <div className="admin-package-filters">
              <label className="admin-package-search">
                <span aria-hidden="true">⌕</span>
                <input type="search" placeholder="Cari materi..." value={materialSearch} onChange={(event) => setMaterialSearch(event.target.value)} />
              </label>

              <div className="admin-package-filter-group">
                <select className="admin-package-select" value={selectedMaterialPackage} onChange={(event) => setSelectedMaterialPackage(event.target.value)}>
                  <option value="ALL">Semua Paket</option>
                  {materialPackages.map((item) => (
                    <option key={item.pid} value={String(item.pid)}>{item.name}</option>
                  ))}
                </select>

                <button type="button" className="admin-user-filter-button admin-package-filter-button">Filter</button>
                <button type="button" className="admin-package-reset" onClick={() => { setMaterialSearch(''); setSelectedMaterialPackage('ALL') }}>Reset</button>
              </div>
            </div>
          </section>

          <section className="user-material-grid">
            {filteredRows.length ? (
              filteredRows.map((row) => (
                <article className="user-material-card" key={row.pid}>
                  <div className="user-material-card-head">
                    <span className="user-tryout-package-badge">{row.package_name}</span>
                    <span className={`admin-package-type-badge ${row.status_key === 'published' ? 'online' : 'tryout'}`}>{row.status}</span>
                  </div>
                  <h3>{row.judul}</h3>
                  <p>{row.deskripsi || 'Tidak ada deskripsi materi.'}</p>
                  <div className="user-material-meta">
                    <span>{row.file_size_label}</span>
                    <span>{row.original_name}</span>
                  </div>
                  <button type="button" className="dashboard-primary-action user-material-open-button" onClick={() => setPreviewMaterial(row)}>
                    Lihat Materi
                  </button>
                </article>
              ))
            ) : (
              <MaterialEmptyState
                title="Belum ada materi yang bisa diakses"
                description="Materi akan muncul setelah kamu membeli paket yang sesuai."
                actionLabel="Kembali ke Dashboard"
                onAction={() => navigate('/dashboard-user', { state: { user } })}
                accent="green"
              />
            )}
          </section>
        </main>
      </div>

      <UserMaterialViewerModal
        open={Boolean(previewMaterial)}
        material={previewMaterial}
        src={previewSrc}
        onClose={() => setPreviewMaterial(null)}
      />

      <AdminLogoutModal
        open={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Keluar dari akun user?"
        message="Pastikan materi yang sedang dibuka sudah selesai dibaca sebelum logout."
        confirmLabel="Ya, keluar"
      />
    </div>
  )
}

function App() {
  useEffect(() => {
    document.title = 'Nice On'

    const faviconLink = document.querySelector('link[rel="icon"]') || document.createElement('link')

    faviconLink.setAttribute('rel', 'icon')
    faviconLink.setAttribute('type', 'image/png')
    faviconLink.setAttribute('href', faviconImage)

    if (!faviconLink.parentNode) {
      document.head.appendChild(faviconLink)
    }
  }, [])

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/login"
        element={<LoginPage />}
      />
      <Route
        path="/forgot-password"
        element={<ForgotPasswordPage />}
      />
      <Route
        path="/register"
        element={<RegisterPage />}
      />
      <Route
        path="/complete-profile"
        element={<CompleteProfilePage />}
      />
      <Route
        path="/account-profile"
        element={<AccountProfilePage />}
      />
      <Route
        path="/dashboard-user"
        element={<DashboardUserPageV2 />}
      />
      <Route
        path="/dashboard-user/tryout"
        element={<UserTryoutPage />}
      />
      <Route
        path="/dashboard-user/materials"
        element={<UserMaterialsPage />}
      />
      <Route
        path="/dashboard-admin"
        element={<AdminDashboardPage />}
      />
      <Route
        path="/dashboard-admin/users"
        element={<AdminUserManagementPage />}
      />
      <Route
        path="/dashboard-admin/packages"
        element={<AdminPackageManagementPage />}
      />
      <Route
        path="/dashboard-admin/materials"
        element={<AdminMaterialManagementPage />}
      />
      <Route
        path="/dashboard-admin/questions"
        element={<AdminQuestionManagementPage />}
      />
      <Route
        path="/dashboard-admin/transactions"
        element={<AdminTransactionManagementPage />}
      />
      <Route
        path="/dashboard-admin/settings"
        element={<Navigate to="/dashboard-admin/settings/parameters" replace />}
      />
      <Route
        path="/dashboard-admin/settings/parameters"
        element={<AdminSettingsParameterPage />}
      />
      <Route
        path="/dashboard-admin/settings/faqs"
        element={<AdminSettingsFaqPage />}
      />
    </Routes>
  )
}

export default App
