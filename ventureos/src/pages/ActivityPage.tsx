import React, { useState, useEffect, useCallback } from 'react'
import { Loader2, Clock, Users, FileText, Receipt, Camera, CheckSquare, ShoppingCart, Brain } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { SAMPLE_ACTIVITY } from '../lib/sampleData'
import AppLayout from '../components/layout/AppLayout'

interface ActivityEntry {
  id: string
  type: string
  title: string
  description: string
  created_at: string
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  client_created: <Users size={16} />,
  invoice_created: <FileText size={16} />,
  payment_recorded: <Receipt size={16} />,
  expense_added: <Receipt size={16} />,
  document_scanned: <Camera size={16} />,
  task_completed: <CheckSquare size={16} />,
  order_created: <ShoppingCart size={16} />,
  ai_query: <Brain size={16} />,
  login: <Clock size={16} />,
}

const TYPE_COLORS: Record<string, string> = {
  client_created: 'var(--accent-blue)', invoice_created: 'var(--accent-cyan)',
  payment_recorded: 'var(--success)', expense_added: 'var(--warning)',
  document_scanned: 'var(--accent-violet)', task_completed: 'var(--success)',
  order_created: 'var(--accent-blue)', ai_query: 'var(--accent-violet)', login: 'var(--text-muted)',
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`
  const d = Math.floor(h / 24)
  return `${d} day${d > 1 ? 's' : ''} ago`
}

function formatFullDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function groupByDate(entries: ActivityEntry[]): Record<string, ActivityEntry[]> {
  return entries.reduce((acc, entry) => {
    const date = entry.created_at.slice(0, 10)
    if (!acc[date]) acc[date] = []
    acc[date].push(entry)
    return acc
  }, {} as Record<string, ActivityEntry[]>)
}

const ActivityPage: React.FC = () => {
  const { business, isDemoMode } = useAuth()
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const PAGE_SIZE = 20

  const load = useCallback(async (reset = false) => {
    if (!business?.id) return
    setLoading(true)

    if (!isSupabaseConfigured || isDemoMode) {
      const stored = localStorage.getItem('ventureos_demo_activity')
      let list = SAMPLE_ACTIVITY as ActivityEntry[]
      if (stored) {
        try { list = JSON.parse(stored) } catch { /* ignore */ }
      }
      setEntries(list)
      setHasMore(false)
      setLoading(false)
      return
    }

    const currentPage = reset ? 0 : page
    const from = currentPage * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    const { data } = await supabase.from('activity_log').select('*').eq('business_id', business.id).order('created_at', { ascending: false }).range(from, to)
    setLoading(false)
    const newEntries = data || []
    if (reset) { setEntries(newEntries); setPage(1) } else { setEntries(prev => [...prev, ...newEntries]); setPage(p => p + 1) }
    setHasMore(newEntries.length === PAGE_SIZE)
  }, [business?.id, page, isDemoMode])

  useEffect(() => { load(true) }, [business?.id])

  const filtered = typeFilter === 'all' ? entries : entries.filter(e => e.type === typeFilter)
  const grouped = groupByDate(filtered)
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  const TYPE_OPTIONS = ['all', 'client_created', 'invoice_created', 'payment_recorded', 'expense_added', 'document_scanned', 'task_completed', 'order_created']

  return (
    <AppLayout>
      <div style={{ padding: '1.5rem 2rem', maxWidth: 800, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Activity</h1>
            {(!isSupabaseConfigured || isDemoMode) && (
              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 12, background: 'rgba(79,140,255,0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(79,140,255,0.2)' }}>
                Demo Data
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Everything that's happened in your workspace</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {TYPE_OPTIONS.map(t => (
            <button key={t} className={`btn btn-sm ${typeFilter === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTypeFilter(t)} style={{ textTransform: 'capitalize', fontSize: '0.8rem' }}>
              {t.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {loading && entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}><Loader2 size={24} className="spin" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <Clock size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No activity yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Activity will appear here as you use VentureOS.</p>
          </div>
        ) : (
          <>
            {dates.map(date => (
              <div key={date} style={{ marginBottom: '2rem' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.875rem' }}>
                  {formatFullDate(date + 'T00:00:00')}
                </p>
                <div style={{ position: 'relative', paddingLeft: '2rem', borderLeft: '2px solid var(--border-subtle)' }}>
                  {grouped[date].map((entry, i) => (
                    <div key={entry.id} style={{ position: 'relative', marginBottom: i < grouped[date].length - 1 ? '1.25rem' : 0 }}>
                      {/* Timeline dot */}
                      <div style={{ position: 'absolute', left: '-2.75rem', top: 6, width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-card)', border: `2px solid ${TYPE_COLORS[entry.type] || 'var(--border-medium)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TYPE_COLORS[entry.type] || 'var(--text-muted)' }}>
                        {TYPE_ICONS[entry.type] || <Clock size={14} />}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.1rem' }}>
                          <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>{entry.title}</p>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: 'auto', whiteSpace: 'nowrap' }}>{timeAgo(entry.created_at)}</span>
                        </div>
                        {entry.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{entry.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button className="btn btn-ghost" onClick={() => load()} disabled={loading}>
                  {loading ? <><Loader2 size={16} className="spin" /> Loading…</> : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}

export default ActivityPage
