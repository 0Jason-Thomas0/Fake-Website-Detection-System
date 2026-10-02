import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getHistory, deleteOne, clearAll } from '../api/client'
import RiskBadge from '../components/RiskBadge'

const PRED_FILTERS = [
  { value: '', label: 'All' },
  { value: 'Fake', label: 'Fake' },
  { value: 'Legitimate', label: 'Legitimate' },
]

const RISK_FILTERS = [
  { value: '', label: 'All risk' },
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
]

function chipStyle(active, danger) {
  return {
    padding: '6px 14px',
    borderRadius: 20,
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    background: active ? 'rgba(0,212,255,0.12)' : 'transparent',
    border: `1px solid ${active ? 'rgba(0,212,255,0.45)' : 'rgba(0,212,255,0.2)'}`,
    color: danger ? 'var(--red)' : active ? 'var(--cyan)' : 'var(--text-secondary)',
  }
}

export default function History() {
  const [searchParams, setSearchParams] = useSearchParams()
  const prediction = searchParams.get('prediction') || ''
  const risk = searchParams.get('risk') || ''
  const [records, setRecords] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next)
  }

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await getHistory({
        prediction: prediction || undefined,
        risk: risk || undefined,
      })
      setRecords(res.data)
      setError('')
    } catch {
      setError('Could not load history. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHistory() }, [prediction, risk])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      q ? records.filter(r =>
        r.url.toLowerCase().includes(q) ||
        r.prediction.toLowerCase().includes(q) ||
        r.risk_level.toLowerCase().includes(q)
      ) : records
    )
  }, [search, records])

  const handleDelete = async (id) => {
    try {
      await deleteOne(id)
      setRecords(prev => prev.filter(r => r.id !== id))
      showToast('Record deleted.')
    } catch {
      showToast('Failed to delete.', 'error')
    }
  }

  const handleClear = async () => {
    try {
      await clearAll()
      setRecords([])
      setConfirmClear(false)
      showToast('All history cleared.')
    } catch {
      showToast('Failed to clear history.', 'error')
    }
  }

  const FAKE = records.filter(r => r.prediction === 'Fake').length
  const LEGIT = records.length - FAKE

  return (
    <div style={{ paddingTop: 100, paddingBottom: 80, minHeight: '100vh' }}>
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 40 }}>
          <div>
            <div className="kicker">Saved scans</div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>
              History
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>Every classified URL on this machine, with filters.</p>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="btn-secondary" onClick={fetchHistory} id="refresh-history-btn">
              ↺ Refresh
            </button>
            {records.length > 0 && (
              <button className="btn-danger" onClick={() => setConfirmClear(true)} id="clear-history-btn">
                Clear all
              </button>
            )}
          </div>
        </div>

        {records.length > 0 && (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
            {[
              { label: 'Total Scans', value: records.length, color: 'var(--cyan)' },
              { label: 'Fake',        value: FAKE,           color: 'var(--red)' },
              { label: 'Legitimate',  value: LEGIT,          color: 'var(--green)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-card" style={{ padding: '16px 24px', display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 700, color }}>{value}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{label}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {PRED_FILTERS.map(f => (
            <button
              key={f.label}
              onClick={() => setFilter('prediction', f.value)}
              style={chipStyle(prediction === f.value, f.value === 'Fake')}
            >
              {f.label}
            </button>
          ))}
          <span style={{ width: 8 }} />
          {RISK_FILTERS.map(f => (
            <button
              key={f.label}
              onClick={() => setFilter('risk', f.value)}
              style={chipStyle(risk === f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 24 }}>
          <input
            id="history-search-input"
            className="url-input"
            type="text"
            placeholder="Search by URL, prediction, or risk level..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 500 }}
          />
        </div>

        {loading ? (
          <div className="flex-center" style={{ height: 300 }}>
            <div>
              <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Loading history...</p>
            </div>
          </div>
        ) : error ? (
          <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--red)', border: '1px solid rgba(255,51,102,0.2)' }}>
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card empty-state">
            <div className="kicker">Empty</div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
              {search || prediction || risk ? 'No results found' : 'No scan history yet'}
            </h3>
            <p>{search || prediction || risk ? 'Try a different filter or search term.' : 'Scan a URL from Home to start building history.'}</p>
          </div>
        ) : (
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>URL</th>
                    <th>Prediction</th>
                    <th>Confidence</th>
                    <th>Risk</th>
                    <th>Date & Time</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <tr key={row.id} className="fade-in-up" style={{ animationDelay: `${i * 0.03}s`, opacity: 0 }}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{row.id}</td>
                      <td style={{ maxWidth: 260 }}>
                        <Link
                          to={`/history/${row.id}`}
                          title={row.url}
                          style={{
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: 'var(--cyan)',
                            fontSize: '0.85rem',
                            maxWidth: 260,
                            textDecoration: 'none',
                          }}
                        >
                          {row.url}
                        </Link>
                      </td>
                      <td>
                        <span style={{
                          fontWeight: 700,
                          color: row.prediction === 'Fake' ? 'var(--red)' : 'var(--green)',
                          fontSize: '0.88rem',
                        }}>
                          {row.prediction}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 60, height: 6,
                            background: 'rgba(255,255,255,0.06)',
                            borderRadius: 3, overflow: 'hidden',
                          }}>
                            <div style={{
                              width: `${row.confidence}%`,
                              height: '100%',
                              background: row.prediction === 'Fake' ? 'var(--red)' : 'var(--green)',
                              borderRadius: 3,
                            }} />
                          </div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {row.confidence.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td><RiskBadge level={row.risk_level} /></td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {row.scan_date}<br />{row.scan_time}
                      </td>
                      <td>
                        <button
                          id={`delete-row-${row.id}`}
                          onClick={() => handleDelete(row.id)}
                          style={{
                            background: 'none',
                            border: '1px solid rgba(255,51,102,0.2)',
                            borderRadius: 6,
                            color: 'var(--red)',
                            padding: '5px 10px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            transition: 'all 0.2s',
                          }}
                        >
                          Del
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {confirmClear && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 24,
        }}>
          <div className="glass-card" style={{ padding: 36, maxWidth: 420, width: '100%', textAlign: 'center' }}>
            <div className="kicker">Confirm</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 12 }}>Clear All History?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: '0.9rem' }}>
              This will permanently delete all {records.length} scan records. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn-secondary" onClick={() => setConfirmClear(false)} id="cancel-clear-btn">Cancel</button>
              <button className="btn-danger" onClick={handleClear} id="confirm-clear-btn">Yes, Clear All</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
