import { useState } from 'react'
import { formatAdminDate } from '../../utils/format'

const SERIES = [
  { key: 'twk', label: 'TWK', color: '#2a78d6' },
  { key: 'tiu', label: 'TIU', color: '#eb6834' },
  { key: 'tkp', label: 'TKP', color: '#1baf7a' },
]

const WIDTH = 640
const HEIGHT = 220
const PADDING_LEFT = 40
const PADDING_RIGHT = 16
const PADDING_TOP = 20
const PADDING_BOTTOM = 28
const BAR_MAX_THICKNESS = 20
const BAR_GAP = 2

function niceMax(value) {
  if (value <= 0) return 10
  const magnitude = 10 ** Math.floor(Math.log10(value))
  return Math.ceil((value * 1.15) / magnitude) * magnitude
}

export default function ScoreBreakdownChart({ sessions }) {
  const [hoverKey, setHoverKey] = useState(null)

  const plotWidth = WIDTH - PADDING_LEFT - PADDING_RIGHT
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM
  const maxValue = niceMax(Math.max(...sessions.flatMap((s) => [s.twk, s.tiu, s.tkp]), 0))
  const groupWidth = plotWidth / sessions.length
  const barWidth = Math.min(BAR_MAX_THICKNESS, (groupWidth - BAR_GAP * (SERIES.length + 1)) / SERIES.length)
  const gridLines = [0, 0.25, 0.5, 0.75, 1]
  const lastIndex = sessions.length - 1

  return (
    <div className="score-breakdown-chart">
      <div className="score-breakdown-legend">
        {SERIES.map((series) => (
          <span key={series.key} className="score-breakdown-legend-item">
            <span className="score-breakdown-legend-swatch" style={{ background: series.color }} aria-hidden="true" />
            {series.label}
          </span>
        ))}
      </div>

      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="score-breakdown-svg" role="img" aria-label="Grafik breakdown TWK, TIU, TKP">
        {gridLines.map((fraction) => {
          const y = PADDING_TOP + plotHeight * (1 - fraction)
          return (
            <g key={fraction}>
              <line x1={PADDING_LEFT} x2={WIDTH - PADDING_RIGHT} y1={y} y2={y} className="score-breakdown-gridline" />
              <text x={PADDING_LEFT - 8} y={y + 4} className="score-breakdown-axis-label" textAnchor="end">
                {Math.round(maxValue * fraction)}
              </text>
            </g>
          )
        })}

        {sessions.map((session, groupIndex) => {
          const groupStartX = PADDING_LEFT + groupIndex * groupWidth
          const groupContentWidth = barWidth * SERIES.length + BAR_GAP * (SERIES.length - 1)
          const groupOffset = (groupWidth - groupContentWidth) / 2

          return (
            <g key={session.id}>
              {SERIES.map((series, seriesIndex) => {
                const value = session[series.key]
                const barHeight = (value / maxValue) * plotHeight
                const x = groupStartX + groupOffset + seriesIndex * (barWidth + BAR_GAP)
                const y = PADDING_TOP + plotHeight - barHeight
                const hitKey = `${session.id}-${series.key}`
                const isHovered = hoverKey === hitKey

                return (
                  <g key={series.key}>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={Math.max(barHeight, 1)}
                      rx={3}
                      fill={series.color}
                      opacity={isHovered ? 1 : 0.88}
                      onMouseEnter={() => setHoverKey(hitKey)}
                      onMouseLeave={() => setHoverKey(null)}
                    />
                    {groupIndex === lastIndex ? (
                      <text x={x + barWidth / 2} y={y - 6} className="score-breakdown-value-label" textAnchor="middle">
                        {value}
                      </text>
                    ) : null}
                  </g>
                )
              })}

              <text x={groupStartX + groupWidth / 2} y={HEIGHT - 8} className="score-breakdown-axis-label" textAnchor="middle">
                {formatAdminDate(session.finishAt, { hour: false }).replace(/\s\d{4}$/, '')}
              </text>
            </g>
          )
        })}
      </svg>

      {hoverKey ? (() => {
        const [sessionId, seriesKey] = hoverKey.split('-')
        const session = sessions.find((s) => String(s.id) === sessionId)
        const series = SERIES.find((s) => s.key === seriesKey)
        if (!session || !series) return null
        return (
          <div className="score-breakdown-tooltip">
            <span className="score-breakdown-tooltip-key" style={{ background: series.color }} aria-hidden="true" />
            <strong>{session[series.key]}</strong>
            <span>{series.label} · {formatAdminDate(session.finishAt, { hour: false })}</span>
          </div>
        )
      })() : null}
    </div>
  )
}
