export function renderSocialBrandIcon(kind) {
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

export function getUserInitials(name) {
  const cleaned = String(name || '').replace(/[^a-zA-Z\s]/g, ' ').trim()
  if (!cleaned) return '?'

  const parts = cleaned.split(/\s+/).filter(Boolean)
  const initials = parts.slice(0, 2).map((part) => part[0]).join('')
  return initials.toUpperCase() || '?'
}
