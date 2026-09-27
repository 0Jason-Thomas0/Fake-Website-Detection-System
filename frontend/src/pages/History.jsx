import { useState, useEffect } from 'react'
import { getHistory, deleteOne, clearAll } from '../api/client'
import RiskBadge from '../components/RiskBadge'

export default function History() {
  const [records, setRecords] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await getHistory()
      setRecords(res.data)
      setFiltered(res.data)
    } catch {
      setError('Could not load history. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHistory() }, [])

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
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 40 }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', marginBottom: 16,
              background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)',
              borderRadius: 100, fontSize: '0.78rem', fontWeight: 600,
              color: 'var(--cyan)', letterSpacing: 2, textTransform: 'uppercase',
            }}>
              📋 Prediction History
            </div>
            <h1 style={{ fontFamily: 'Orbitron, monospace', fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>
              Scan <span className="gradient-text">History</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>All previously scanned URLs and their AI predictions.</p>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="btn-secondary" onClick={fetchHistory} id="refresh-history-btn">
              ↺ Refresh
            </button>
            {records.length > 0 && (
              <button className="btn-danger" onClick={() => setConfirmClear(true)} id="clear-history-btn">
                🗑 Clear All
              </button>
            )}
          </div>
        </div>

        {/* Stats Strip */}
        {records.length > 0 && (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
            {[
              { label: 'Total Scans', value: records.length, color: 'var(--cyan)' },
              { label: 'Fake',        value: FAKE,           color: 'var(--red)' },
              { label: 'Legitimate',  value: LEGIT,          color: 'var(--green)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-card" style={{ padding: '16px 24px', display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.4rem', fontWeight: 700, color }}>{value}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
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

        {/* Table */}
        {loading ? (
          <div className="flex-center" style={{ height: 300 }}>
            <div>
              <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Loading history...</p>
            </div>
          </div>
        ) : error ? (
          <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--red)', border: '1px solid rgba(255,51,102,0.2)' }}>
            ⚠ {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card empty-state">
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>📋</div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
              {search ? 'No results found' : 'No scan history yet'}
            </h3>
            <p>{search ? 'Try a different search term.' : 'Go to the Detection page to scan your first URL.'}</p>
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
                        <div style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: 'var(--text-primary)',
                          fontSize: '0.85rem',
                          maxWidth: 260,
                        }} title={row.url}>
                          {row.url}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontWeight: 700,
                          color: row.prediction === 'Fake' ? 'var(--red)' : 'var(--green)',
                          fontSize: '0.88rem',
                        }}>
                          {row.prediction === 'Fake' ? '⚠ Fake' : '✓ Legitimate'}
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
                          🗑
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

      {/* Confirm Clear Modal */}
      {confirmClear && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 24,
        }}>
          <div className="glass-card" style={{ padding: 36, maxWidth: 420, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
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

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✓' : '⚠'} {toast.msg}
        </div>
      )}
    </div>
  )
}
