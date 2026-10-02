import { useEffect, useState } from 'react'

/**
 * ConfidenceBar — Animated progress bar showing prediction confidence
 * Props:
 *   confidence (number 0-100)
 *   prediction ("Fake" | "Legitimate")
 */
export default function ConfidenceBar({ confidence, prediction }) {
  const [width, setWidth] = useState(0)
  const isFake = prediction === 'Fake'

  useEffect(() => {
    // Animate on mount
    const t = setTimeout(() => setWidth(confidence), 100)
    return () => clearTimeout(t)
  }, [confidence])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase' }}>
          Confidence
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          fontSize: '1.1rem',
          color: isFake ? 'var(--red)' : 'var(--green)',
        }}>
          {confidence.toFixed(1)}%
        </span>
      </div>
      <div className="confidence-bar-track">
        <div
          className={`confidence-bar-fill ${isFake ? 'fake' : 'legit'}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>
  )
}
