import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Archive, FileText, Receipt, User, ShoppingCart, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { SAMPLE_DOCUMENTS } from '../lib/sampleData'
import AppLayout from '../components/layout/AppLayout'

interface Doc {
  id: string
  type: string
  original_filename: string
  confidence: number
  review_status: string
  created_at: string
  extracted_data: Record<string, unknown>
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  invoice: <FileText size={20} />, receipt: <Receipt size={20} />,
  business_card: <User size={20} />, order: <ShoppingCart size={20} />,
  contract: <FileText size={20} />, other: <Archive size={20} />,
}

const TYPE_COLORS: Record<string, string> = {
  invoice: 'status-badge-blue', receipt: 'status-badge-amber',
  business_card: 'status-badge-violet', order: 'status-badge-cyan',
  contract: 'status-badge-gray', other: 'status-badge-gray',
}

function formatDate(d: string) { return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' }

const DocumentVaultPage: React.FC = () => {
  const { business, isDemoMode } = useAuth()
  const navigate = useNavigate()
  const [docs, setDocs] = useState<Doc[]>([])
  const [typeFilter, setTypeFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!business?.id) return
    setLoading(true)

    if (!isSupabaseConfigured || isDemoMode) {
      const stored = localStorage.getItem('ventureos_demo_documents')
      if (stored) {
        try { setDocs(JSON.parse(stored)) } catch { setDocs(SAMPLE_DOCUMENTS as unknown as Doc[]) }
      } else {
        setDocs(SAMPLE_DOCUMENTS as unknown as Doc[])
      }
      setLoading(false)
      return
    }

    const { data } = await supabase.from('documents').select('*').eq('business_id', business.id).order('created_at', { ascending: false })
    setLoading(false)
    setDocs(data || [])
  }, [business?.id, isDemoMode])

  useEffect(() => { load() }, [load])

  const filtered = typeFilter === 'all' ? docs : docs.filter(d => d.type === typeFilter)
  const types = ['all', 'invoice', 'receipt', 'business_card', 'order', 'contract', 'other']

  return (
    <AppLayout>
      <div style={{ padding: '1.5rem 2rem', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Document Vault</h1>
              {(!isSupabaseConfigured || isDemoMode) && (
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 12, background: 'rgba(79,140,255,0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(79,140,255,0.2)' }}>
                  Demo Data
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{docs.length} document{docs.length !== 1 ? 's' : ''} stored</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/vision')}><Camera size={18} /> Scan Document</button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {types.map(t => (
            <button key={t} className={`btn btn-sm ${typeFilter === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTypeFilter(t)} style={{ textTransform: 'capitalize' }}>{t.replace('_', ' ')}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}><Loader2 size={24} className="spin" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
            <Archive size={52} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No documents yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Scan invoices, receipts, business cards and more with Venture Vision.</p>
            <button className="btn btn-primary" onClick={() => navigate('/vision')}><Camera size={16} /> Open Venture Vision</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '1rem' }}>
            {filtered.map(doc => (
              <div key={doc.id} className="card card-hover" style={{ cursor: 'default' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(79,140,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)' }}>
                    {TYPE_ICONS[doc.type] || <Archive size={20} />}
                  </div>
                  <span className={`status-badge ${TYPE_COLORS[doc.type] || 'status-badge-gray'}`} style={{ textTransform: 'capitalize' }}>{doc.type.replace('_', ' ')}</span>
                </div>
                <p style={{ fontWeight: 500, marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.9rem' }}>
                  {doc.original_filename || 'Document'}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{formatDate(doc.created_at)}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {doc.confidence > 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{Math.round(doc.confidence * 100)}% confident</span>
                  )}
                  <span className={`status-badge ${doc.review_status === 'confirmed' ? 'status-badge-green' : 'status-badge-gray'}`} style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
                    {doc.review_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default DocumentVaultPage
