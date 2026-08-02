import { useMemo, useRef, useState } from 'react'
import { formatAdminDate } from '../../utils/format'

const WIDTH = 640
const HEIGHT = 220
const PADDING_LEFT = 40
const PADDING_RIGHT = 16
const PADDING_TOP = 20
const PADDING_BOTTOM = 28

function niceMax(value) {
  if (value <= 0) return 10
  const magnitude = 10 ** Math.floor(Math.log10(value))
  return Math.ceil((value * 1.15) / magnitude) * magnitude
}

export default function ScoreTrendChart({ points }) {
  const svgRef = useRef(null)
  const [hoverIndex, setHoverIndex] = useState(null)

  const plotWidth = WIDTH - PADDING_LEFT - PADDING_RIGHT
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM
  const maxValue = useMemo(() => niceMax(Math.max(...points.map((p) => p.value), 0)), [points])

  const xFor = (index) => (points.length <= 1 ? PADDING_LEFT + plotWidth / 2 : PADDING_LEFT + (index / (points.length - 1)) * plotWidth)
  const yFor = (value) => PADDING_TOP + plotHeight - (value / maxValue) * plotHeight

  const linePath = points.map((p, index) => `${index === 0 ? 'M' : 'L'} ${xFor(index)} ${yFor(p.value)}`).join(' ')
  const gridLines = [0, 0.25, 0.5, 0.75, 1]
  const lastIndex = points.length - 1

  const handlePointerMove = (event) => {
    if (!svgRef.current || points.length === 0) return
    const rect = svgRef.current.getBoundingClientRect()
    const relativeX = ((event.clientX - rect.left) / rect.width) * WIDTH
    let nearest = 0
    let nearestDistance = Infinity
    points.forEach((_, index) => {
      const distance = Math.abs(xFor(index) - relativeX)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearest = index
      }
    })
    setHoverIndex(nearest)
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null

  return (
    <div className="score-trend-chart">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="score-trend-svg"
        role="img"
        aria-label="Grafik tren skor tryout"
        onMouseMove={handlePointerMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {gridLines.map((fraction) => {
          const y = PADDING_TOP + plotHeight * (1 - fraction)
          return (
            <g key={fraction}>
              <line x1={PADDING_LEFT} x2={WIDTH - PADDING_RIGHT} y1={y} y2={y} className="score-trend-gridline" />
              <text x={PADDING_LEFT - 8} y={y + 4} className="score-trend-axis-label" textAnchor="end">
                {Math.round(maxValue * fraction)}
              </text>
            </g>
          )
        })}

        {points.length > 1 ? <path d={linePath} className="score-trend-line" /> : null}

        {points.map((p, index) => (
          <circle
            key={p.finishAt || index}
            cx={xFor(index)}
            cy={yFor(p.value)}
            r={4}
            className={`score-trend-dot${hoverIndex === index ? ' active' : ''}`}
          />
        ))}

        {lastIndex >= 0 ? (
          <text x={xFor(lastIndex)} y={yFor(points[lastIndex].value) - 12} className="score-trend-endpoint-label" textAnchor="middle">
            {points[lastIndex].value}
          </text>
        ) : null}

        {hoverIndex !== null ? (
          <line
            x1={xFor(hoverIndex)}
            x2={xFor(hoverIndex)}
            y1={PADDING_TOP}
            y2={PADDING_TOP + plotHeight}
            className="score-trend-crosshair"
          />
        ) : null}
      </svg>

      {hovered ? (
        <div
          className="score-trend-tooltip"
          style={{ left: `${(xFor(hoverIndex) / WIDTH) * 100}%` }}
        >
          <strong>{hovered.value}</strong>
          <span>{formatAdminDate(hovered.finishAt, { hour: false })}</span>
        </div>
      ) : null}
    </div>
  )
}
