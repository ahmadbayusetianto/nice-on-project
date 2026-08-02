import { useState } from 'react'

const WEEKDAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const MONTH_LABELS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

function levelForCount(count) {
  if (count <= 0) return 0
  if (count === 1) return 1
  if (count === 2) return 2
  return 3
}

export default function ActivityCalendarGrid({ month, days, onPrevMonth, onNextMonth, isNextDisabled }) {
  const [hoverDate, setHoverDate] = useState(null)

  if (!days.length) return null

  const [year, monthIndex] = month.split('-').map((part) => Number(part))
  const monthLabel = `${MONTH_LABELS[monthIndex - 1]} ${year}`
  const firstWeekday = new Date(year, monthIndex - 1, 1).getDay()
  const leadingBlanks = Array.from({ length: firstWeekday })

  const hoveredDay = hoverDate ? days.find((d) => d.date === hoverDate) : null

  return (
    <div className="activity-calendar">
      <div className="activity-calendar-head">
        <button type="button" className="activity-calendar-nav" onClick={onPrevMonth} aria-label="Bulan sebelumnya">‹</button>
        <strong>{monthLabel}</strong>
        <button type="button" className="activity-calendar-nav" onClick={onNextMonth} disabled={isNextDisabled} aria-label="Bulan berikutnya">›</button>
      </div>

      <div className="activity-calendar-weekdays">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="activity-calendar-grid">
        {leadingBlanks.map((_, index) => (
          <span key={`blank-${index}`} className="activity-calendar-cell blank" aria-hidden="true" />
        ))}
        {days.map((day) => {
          const level = levelForCount(day.count)
          const dayNumber = Number(day.date.slice(-2))

          return (
            <button
              key={day.date}
              type="button"
              className={`activity-calendar-cell level-${level}`}
              onMouseEnter={() => setHoverDate(day.date)}
              onMouseLeave={() => setHoverDate(null)}
              onFocus={() => setHoverDate(day.date)}
              onBlur={() => setHoverDate(null)}
              aria-label={`${dayNumber} ${monthLabel}: ${day.count} aktivitas`}
            >
              {dayNumber}
            </button>
          )
        })}
      </div>

      <div className="activity-calendar-legend">
        <span>Sepi</span>
        {[0, 1, 2, 3].map((level) => (
          <span key={level} className={`activity-calendar-legend-swatch level-${level}`} aria-hidden="true" />
        ))}
        <span>Aktif</span>
      </div>

      {hoveredDay ? (
        <div className="activity-calendar-tooltip" role="status">
          <strong>{hoveredDay.count}</strong> aktivitas pada {Number(hoveredDay.date.slice(-2))} {monthLabel}
        </div>
      ) : null}
    </div>
  )
}
