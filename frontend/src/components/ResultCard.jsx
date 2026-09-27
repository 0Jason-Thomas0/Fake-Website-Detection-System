import { useState } from 'react'
import RiskBadge from './RiskBadge'
import ConfidenceBar from './ConfidenceBar'

/**
 * ResultCard — Full prediction result display
 * Props: result = { prediction, confidence, risk, reasons, features, model_used }
 */
export default function ResultCard({ result }) {
  const [showFeatures, setShowFeatures] = useState(false)

  if (!result) return null

  const { prediction, confidence, risk, reasons, features, model_used } = result
  const isFake = prediction === 'Fake'

  const FEATURE_LABELS = {
    url_length:              'URL Length',
    domain_length:           'Domain Length',
    num_dots:                'Dot Count',
    num_hyphens:             'Hyphen Count',
    num_digits:              'Digit Count',
    num_slashes:             'Slash Count',
    num_subdomains:          'Subdomain Count',
    has_https:               'HTTPS Enabled',
    has_ip:                  'IP Address in URL',
    has_at:                  '"@" Symbol Present',
    has_hyphen_domain:       'Hyphen in Domain',
    suspicious_keyword_count:'Suspicious Keywords',
    prefix_suffix:           'Prefix-Suffix in Domain',
  }

  return (
    <div
      className={`glass-card fade-in-up ${isFake ? 'glow-red' : 'glow-green'}`}
      style={{
        border: `1px solid ${isFake ? 'rgba(255,51,102,0.3)' : 'rgba(0,255,136,0.3)'}`,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '28px 32px',
        background: isFake
          ? 'linear-gradient(135deg, rgba(255,51,102,0.08), rgba(255,51,102,0.02))'
          : 'linear-gradient(135deg, rgba(0,255,136,0.08), rgba(0,255,136,0.02))',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Icon */}
          <div style={{
            width: 64, height: 64,
            borderRadius: '50%',
            background: isFake
              ? 'radial-gradient(circle, rgba(255,51,102,0.2), rgba(255,51,102,0.05))'
              : 'radial-gradient(circle, rgba(0,255,136,0.2), rgba(0,255,136,0.05))',
            border: `2px solid ${isFake ? 'rgba(255,51,102,0.5)' : 'rgba(0,255,136,0.5)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem',
          }}>
            {isFake ? '⚠' : '✓'}
          </div>
          <div>
            <div style={{
              fontFamily: 'Orbitron, monospace',
              fontSize: '1.6rem',
              fontWeight: 700,
              color: isFake ? 'var(--red)' : 'var(--green)',
              marginBottom: 4,
            }}>
              {isFake ? 'FAKE WEBSITE' : 'LEGITIMATE WEBSITE'}
            </div>
            <span className={isFake ? 'badge badge-fake' : 'badge badge-legit'}>
              {prediction}
            </span>
          </div>
        </div>
        <RiskBadge level={risk} />
      </div>

      {/* Body */}
      <div style={{ padding: '28px 32px' }}>
        {/* Confidence Bar */}
        <div style={{ marginBottom: 32 }}>
          <ConfidenceBar confidence={confidence} prediction={prediction} />
        </div>

        {/* Model Used */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 24, fontSize: '0.82rem', color: 'var(--text-muted)',
        }}>
          <span>🤖</span>
          <span>Model: <strong style={{ color: 'var(--cyan)' }}>{model_used}</strong></span>
        </div>

        {/* Risk Reasons */}
        <div style={{ marginBottom: 28 }}>
          <h4 style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: 12,
          }}>
            {isFake ? '⚠ Detected Risk Factors' : '✓ Safety Analysis'}
          </h4>
          {reasons.map((reason, i) => (
            <div key={i} className={`reason-item ${isFake ? 'danger' : 'safe'} fade-in-up`}
              style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>
                {isFake ? '⚡' : '✓'}
              </span>
              <span>{reason}</span>
            </div>
          ))}
        </div>

        {/* Feature Toggle */}
        <button
          className="btn-secondary"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => setShowFeatures(!showFeatures)}
        >
          {showFeatures ? '▲ Hide Technical Features' : '▼ View Extracted Features'}
        </button>

        {/* Feature Details */}
        {showFeatures && features && (
          <div style={{ marginTop: 20 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 8,
            }}>
              {Object.entries(features).map(([key, value]) => (
                <div key={key} className="feature-chip">
                  <span className="feat-name">{FEATURE_LABELS[key] || key}</span>
                  <span className="feat-value" style={{
                    color: (key === 'has_ip' || key === 'has_at') && value === 1
                      ? 'var(--red)'
                      : key === 'has_https' && value === 1
                      ? 'var(--green)'
                      : 'var(--cyan)',
                  }}>
                    {typeof value === 'number' && (key.startsWith('has_') || key === 'prefix_suffix')
                      ? value === 1 ? 'Yes' : 'No'
                      : value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
