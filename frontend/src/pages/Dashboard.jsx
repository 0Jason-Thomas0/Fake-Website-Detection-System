import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getStats } from '../api/client'
import RiskBadge from '../components/RiskBadge'

const RISK_COLORS = {
  Low: 'var(--green)',
  Medium: 'var(--yellow)',
  High: 'var(--red)',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStats()
      .then(res => setStats(res.data))
      .catch(() => setError('Could not load dashboard stats. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  const cards = [
    { label: 'Total Scans', value: stats?.total ?? 0, color: 'var(--cyan)' },
    { label: 'Fake', value: stats?.fake ?? 0, color: 'var(--red)' },
    { label: 'Legitimate', value: stats?.legit ?? 0, color: 'var(--green)' },
    { label: 'High-risk', value: stats?.by_risk?.High ?? 0, color: 'var(--yellow)' },
  ]

  const riskTotal = stats?.total || 0
  const riskMix = ['Low', 'Medium', 'High'].map(level => ({
    level,
    count: stats?.by_risk?.[level] || 0,
    pct: riskTotal ? Math.round(((stats?.by_risk?.[level] || 0) / riskTotal) * 100) : 0,
  }))

  return (
    <div style={{ paddingTop: 100, paddingBottom: 80, minHeight: '100vh' }}>
      <div className="container">
        <div style={{ marginBottom: 40 }}>
          <div className="kicker">Live overview</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>
            Scan dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Volume, verdict mix, and the last ten scans stored on this machine.
          </p>
        </div>

        {loading ? (
          <div className="flex-center" style={{ height: 240 }}>
            <div>
              <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Loading stats...</p>
            </div>
          </div>
        ) : error ? (
          <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--red)' }}>
            {error}
          </div>
        ) : (
          <>
            <div className="grid-4" style={{ marginBottom: 28 }}>
              {cards.map(card => (
                <div key={card.label} className="glass-card stat-card">
                  <div className="stat-value" style={{ color: card.color }}>{card.value}</div>
                  <div className="stat-label">{card.label}</div>
                </div>
              ))}
            </div>

            <div className="glass-card" style={{ padding: 28, marginBottom: 28 }}>
              <h3 style={{ fontSize: '0.8rem', letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 18 }}>
                Risk mix
              </h3>
              {riskTotal === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No risk data yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {riskMix.map(({ level, count, pct }) => (
                    <div key={level}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                        <span>{level}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{count} · {pct}%</span>
                      </div>
                      <div style={{ height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 6, overflow: 'hidden' }}>
                        <div style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: RISK_COLORS[level],
                          borderRadius: 6,
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!riskTotal ? (
              <div className="glass-card empty-state">
                <div className="kicker">Empty</div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                  No scans yet
                </h3>
                <p style={{ marginBottom: 24 }}>Analyze a URL to seed the dashboard.</p>
                <button className="btn-primary" onClick={() => navigate('/detect')}>
                  Scan a URL →
                </button>
              </div>
            ) : (
              <div className="glass-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <h3 style={{ fontSize: '0.8rem', letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Recent scans
                  </h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>URL</th>
                        <th>Prediction</th>
                        <th>Confidence</th>
                        <th>Risk</th>
                        <th>When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(stats.last_scans || []).map(row => (
                        <tr key={row.id}>
                          <td style={{ maxWidth: 280 }}>
                            <Link
                              to={`/history/${row.id}`}
                              style={{
                                color: 'var(--cyan)',
                                textDecoration: 'none',
                                display: 'block',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {row.url}
                            </Link>
                          </td>
                          <td style={{
                            fontWeight: 700,
                            color: row.prediction === 'Fake' ? 'var(--red)' : 'var(--green)',
                          }}>
                            {row.prediction}
                          </td>
                          <td>{Number(row.confidence).toFixed(1)}%</td>
                          <td><RiskBadge level={row.risk_level} /></td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {row.scan_date} {row.scan_time}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
