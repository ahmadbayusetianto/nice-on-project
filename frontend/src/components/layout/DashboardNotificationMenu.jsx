import { useEffect, useRef, useState } from 'react'

export default function DashboardNotificationMenu({
  items,
  onItemClick,
  onMarkItemRead,
  onMarkAllRead,
  className = '',
  ariaLabel = 'Notifikasi',
  buttonClassName = 'dashboard-notification-button',
  badgeClassName = 'dashboard-notification-badge',
}) {
  const menuRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [seenIds, setSeenIds] = useState(() => new Set(items.filter((item) => item.read).map((item) => item.id)))

  useEffect(() => {
    setSeenIds((current) => {
      const next = new Set()
      items.forEach((item) => {
        if (current.has(item.id) || item.read) {
          next.add(item.id)
        }
      })
      return next
    })
  }, [items])

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const unreadCount = items.reduce((count, item) => count + ((seenIds.has(item.id) || item.read) ? 0 : 1), 0)

  const handleItemClick = (item) => {
    setSeenIds((current) => {
      const next = new Set(current)
      next.add(item.id)
      return next
    })
    setIsOpen(false)
    onMarkItemRead?.(item)
    onItemClick?.(item)
  }

  const handleMarkAllRead = () => {
    setSeenIds(new Set(items.map((item) => item.id)))
    onMarkAllRead?.()
  }

  return (
    <div className={`dashboard-notification-menu-wrap ${className}`.trim()} ref={menuRef}>
      <button
        type="button"
        className={buttonClassName}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        🔔
        {unreadCount > 0 ? <span className={badgeClassName}>{unreadCount}</span> : null}
      </button>

      {isOpen ? (
        <div className="dashboard-notification-dropdown" role="menu" aria-label="Daftar notifikasi">
          <div className="dashboard-notification-header">
            <div>
              <strong>Notifikasi</strong>
              <span>{unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua notifikasi sudah dibaca'}</span>
            </div>
            {unreadCount > 0 ? (
              <button type="button" className="dashboard-notification-mark-read" onClick={handleMarkAllRead}>
                Tandai semua
              </button>
            ) : null}
          </div>

          <div className="dashboard-notification-list">
            {items.length ? items.map((item) => {
              const isRead = seenIds.has(item.id) || item.read

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`dashboard-notification-item${isRead ? ' read' : ''}`}
                  role="menuitem"
                  onClick={() => handleItemClick(item)}
                >
                  <span className={`dashboard-notification-item-icon ${item.accent || 'blue'}`} aria-hidden="true">
                    {item.icon || '🔔'}
                  </span>
                  <div className="dashboard-notification-item-copy">
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </div>
                  <span className="dashboard-notification-item-time">{item.time || ''}</span>
                </button>
              )
            }) : (
              <div className="dashboard-notification-empty">Tidak ada notifikasi.</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
