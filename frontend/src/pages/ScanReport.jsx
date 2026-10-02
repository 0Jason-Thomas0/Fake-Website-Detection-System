import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { compareModels, getHistory, getModelInfo, getScan, predictUrl, whatIfUrl } from '../api/client'
import ConfidenceBar from '../components/ConfidenceBar'
import RiskBadge from '../components/RiskBadge'

const FEATURE_LABELS = {
  url_length: 'URL Length',
  domain_length: 'Domain Length',
  num_dots: 'Dot Count',
  num_hyphens: 'Hyphen Count',
  num_digits: 'Digit Count',
  num_slashes: 'Slash Count',
  num_subdomains: 'Subdomain Count',
  has_https: 'HTTPS Enabled',
  has_ip: 'IP Address in URL',
  has_at: '"@" Symbol Present',
  has_hyphen_domain: 'Hyphen in Domain',
  suspicious_keyword_count: 'Suspicious Keywords',
  prefix_suffix: 'Prefix-Suffix in Domain',
}

const FEATURE_ORDER = Object.keys(FEATURE_LABELS)

function hostOf(raw) {
  try { return new URL(raw).hostname.replace(/^www\./, '') } catch { return '' }
}

function formatFeat(key, value) {
  if (typeof value !== 'number') return '—'
  if (key.startsWith('has_') || key === 'prefix_suffix') return value === 1 ? 'Yes' : 'No'
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

function leanToward(value, fakeMean, legitMean) {
  if (value == null || fakeMean == null || legitMean == null) return 'neutral'
  const gap = Math.abs(fakeMean - legitMean)
  const df = Math.abs(value - fakeMean)
  const dl = Math.abs(value - legitMean)
  if (gap < 0.05 || Math.abs(df - dl) < gap * 0.12) return 'neutral'
  return df < dl ? 'Fake' : 'Legitimate'
}

export default function ScanReport() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [scan, setScan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rescaning, setRescanning] = useState(false)
  const [baselines, setBaselines] = useState(null)
  const [vote, setVote] = useState(null)
  const [whatIf, setWhatIf] = useState(null)
  const [similar, setSimilar] = useState([])

  useEffect(() => {
    setLoading(true)
    setError('')
    setVote(null)
    setWhatIf(null)
    setSimilar([])
    getScan(id)
      .then(res => setScan(res.data))
      .catch(() => setError('Scan not found.'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!scan?.url) return
    getModelInfo()
      .then(res => setBaselines(res.data.baselines || null))
      .catch(() => setBaselines(null))
    compareModels(scan.url)
      .then(res => setVote(res.data.models || []))
      .catch(() => setVote([]))
    whatIfUrl(scan.url)
      .then(res => setWhatIf(res.data))
      .catch(() => setWhatIf({ variants: [] }))
    getHistory({ limit: 40 })
      .then(res => {
        const host = hostOf(scan.url)
        const rows = (res.data || []).filter(r =>
          String(r.id) !== String(scan.id) && host && hostOf(r.url) === host
        )
        setSimilar(rows.slice(0, 5))
      })
      .catch(() => setSimilar([]))
  }, [scan])

  const handleRescan = async () => {
    if (!scan?.url) return
    setRescanning(true)
    try {
      const res = await predictUrl(scan.url)
      if (res.data?.id) navigate(`/history/${res.data.id}`)
    } catch {
      setError('Re-scan failed. Is the backend running?')
    } finally {
      setRescanning(false)
    }
  }

  const copyUrl = async () => {
    if (!scan?.url) return
    try { await navigator.clipboard.writeText(scan.url) } catch { /* ignore */ }
  }

  const rows = useMemo(() => {
    if (!scan?.features) return []
    return FEATURE_ORDER.filter(k => k in scan.features).map(key => {
      const value = scan.features[key]
      const fake = baselines?.fake?.[key]
      const legit = baselines?.legitimate?.[key]
      return {
        key,
        value,
        fake,
        legit,
        lean: leanToward(value, fake, legit),
      }
    })
  }, [scan, baselines])

  if (loading) {
    return (
      <div style={{ paddingTop: 120, minHeight: '100vh' }} className="flex-center">
        <div>
          <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Building report...</p>
        </div>
      </div>
    )
  }

  if (error || !scan) {
    return (
      <div style={{ paddingTop: 120, paddingBottom: 80, minHeight: '100vh' }}>
        <div className="container" style={{ maxWidth: 720, textAlign: 'center' }}>
          <div className="glass-card" style={{ padding: 40, color: 'var(--red)' }}>
            {error || 'Scan not found.'}
          </div>
          <Link to="/history" style={{ color: 'var(--cyan)', display: 'inline-block', marginTop: 20 }}>
            ← Back to history
          </Link>
        </div>
      </div>
    )
  }

  const isFake = scan.prediction === 'Fake'
  const winner = vote?.length
    ? [...vote].sort((a, b) => b.confidence - a.confidence)[0]
    : null
  const fakeVotes = vote?.filter(m => m.prediction === 'Fake').length || 0

  return (
    <div style={{ paddingTop: 100, paddingBottom: 80, minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: 960 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <Link to="/history" style={{ color: 'var(--cyan)', textDecoration: 'none', fontWeight: 600 }}>
            ← History
          </Link>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={copyUrl}>Copy URL</button>
            <button className="btn-primary" onClick={handleRescan} disabled={rescaning}>
              {rescaning ? 'Re-scanning...' : 'Re-scan'}
            </button>
          </div>
        </div>

        <div
          className={`glass-card ${isFake ? 'glow-red' : 'glow-green'}`}
          style={{
            padding: 28,
            marginBottom: 20,
            border: `1px solid ${isFake ? 'rgba(255,51,102,0.3)' : 'rgba(0,255,136,0.3)'}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
            <div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.45rem',
                fontWeight: 800,
                color: isFake ? 'var(--red)' : 'var(--green)',
                marginBottom: 8,
              }}>
                {isFake ? 'FAKE WEBSITE' : 'LEGITIMATE WEBSITE'}
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <RiskBadge level={scan.risk_level} />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  {scan.model_used || 'Unknown model'} · {scan.scan_date} {scan.scan_time}
                </span>
              </div>
            </div>
          </div>
          <ConfidenceBar confidence={scan.confidence} prediction={scan.prediction} />
          <p style={{ marginTop: 16, color: 'var(--text-secondary)', wordBreak: 'break-all', fontSize: '0.92rem' }}>
            {scan.url}
          </p>
          {(scan.reasons || []).length > 0 && (
            <div style={{ marginTop: 18 }}>
              {(scan.reasons || []).map((reason, i) => (
                <div key={i} className={`reason-item ${isFake ? 'danger' : 'safe'}`}>
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
          <h3 style={{ fontSize: '0.8rem', letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
            Why this verdict
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>
            This URL vs the average Fake and Legitimate sample in the training set. Rows that lean with the verdict are highlighted.
          </p>
          {!scan.features ? (
            <div>
              <p style={{ color: 'var(--yellow)', marginBottom: 12 }}>
                Features were not stored for this older scan.
              </p>
              <button className="btn-primary" onClick={handleRescan} disabled={rescaning}>
                Re-scan to capture features
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>This URL</th>
                    <th>Typical Fake</th>
                    <th>Typical Legit</th>
                    <th>Leans</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => {
                    const match = row.lean === scan.prediction
                    return (
                      <tr key={row.key} style={{ background: match ? 'rgba(0,212,255,0.06)' : 'transparent' }}>
                        <td>{FEATURE_LABELS[row.key]}</td>
                        <td style={{ fontWeight: 700, color: 'var(--cyan)' }}>{formatFeat(row.key, row.value)}</td>
                        <td>{row.fake == null ? '—' : formatFeat(row.key, row.fake)}</td>
                        <td>{row.legit == null ? '—' : formatFeat(row.key, row.legit)}</td>
                        <td style={{
                          fontWeight: 700,
                          color: row.lean === 'Fake' ? 'var(--red)' : row.lean === 'Legitimate' ? 'var(--green)' : 'var(--text-muted)',
                        }}>
                          {row.lean === 'neutral' ? '—' : row.lean}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
          <h3 style={{ fontSize: '0.8rem', letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
            What-if
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>
            Same model, edited URL only — nothing is fetched and these do not write to history.
          </p>
          {!whatIf ? (
            <p style={{ color: 'var(--text-muted)' }}>Scoring alternatives…</p>
          ) : (whatIf.variants || []).length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No useful edits for this URL.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              {whatIf.variants.map(v => (
                <div key={v.label} className="feature-chip" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8, padding: 16 }}>
                  <div style={{ fontWeight: 700 }}>{v.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{v.url}</div>
                  <div style={{
                    fontWeight: 800,
                    color: v.prediction === 'Fake' ? 'var(--red)' : 'var(--green)',
                  }}>
                    {v.prediction} · {Number(v.confidence).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: v.changed ? 'var(--yellow)' : 'var(--text-muted)' }}>
                    {v.changed ? 'Verdict flips' : 'Verdict stays the same'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
          <h3 style={{ fontSize: '0.8rem', letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
            Model vote
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>
            {vote?.length
              ? `${fakeVotes}/${vote.length} models say Fake${winner ? ` · highest confidence: ${winner.name}` : ''}`
              : 'Scoring RF, DT, and LR…'}
          </p>
          {vote?.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {vote.map(model => {
                const top = winner && model.name === winner.name
                return (
                  <div
                    key={model.name}
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      border: top ? '1px solid var(--cyan)' : '1px solid var(--border)',
                    }}
                  >
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 6 }}>{model.name}</div>
                    <div style={{
                      fontWeight: 800,
                      color: model.prediction === 'Fake' ? 'var(--red)' : 'var(--green)',
                    }}>
                      {model.prediction}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                      {Number(model.confidence).toFixed(1)}% confidence
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="glass-card" style={{ padding: 28 }}>
          <h3 style={{ fontSize: '0.8rem', letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
            Similar past scans
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>
            Other saved scans on the same host.
          </p>
          {similar.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No earlier scans for this host.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>URL</th>
                    <th>Prediction</th>
                    <th>Confidence</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {similar.map(row => (
                    <tr key={row.id}>
                      <td>
                        <Link to={`/history/${row.id}`} style={{ color: 'var(--cyan)', textDecoration: 'none' }}>
                          {row.url}
                        </Link>
                      </td>
                      <td style={{ color: row.prediction === 'Fake' ? 'var(--red)' : 'var(--green)', fontWeight: 700 }}>
                        {row.prediction}
                      </td>
                      <td>{Number(row.confidence).toFixed(1)}%</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {row.scan_date} {row.scan_time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
