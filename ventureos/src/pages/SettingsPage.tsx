import React, { useState, useEffect } from 'react'
import { Loader2, CheckCircle2, AlertCircle, Server } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { checkHealth } from '../lib/api'
import { supabase } from '../lib/supabase'
import AppLayout from '../components/layout/AppLayout'

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD']
const CATEGORIES = ['freelancer','retail','agency','service','creator','startup','local','other']
const STAGES = ['idea','early','growing','established','scaling']

const SettingsPage: React.FC = () => {
  const { user, business, updateBusiness, signOut } = useAuth()
  const [tab, setTab] = useState<'profile'|'business'|'integrations'>('business')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [health, setHealth] = useState<{ gemini: boolean; supabase: boolean } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  // Business form
  const [biz, setBiz] = useState({ name: '', category: '', stage: '', currency: 'INR', description: '', website: '', phone: '', address: '' })
  // Profile form
  const [profileName, setProfileName] = useState('')
  const [profileEmail, setProfileEmail] = useState('')

  useEffect(() => {
    if (business) setBiz({ name: business.name || '', category: business.category || '', stage: business.stage || '', currency: business.currency || 'INR', description: '', website: '', phone: '', address: '' })
    if (user) { setProfileName(user.user_metadata?.full_name || ''); setProfileEmail(user.email || '') }
  }, [business, user])

  useEffect(() => {
    if (tab === 'integrations') {
      checkHealth().then(h => setHealth(h.services || null)).catch(() => setHealth(null))
    }
  }, [tab])

  const saveBusiness = async () => {
    setSaving(true); setError(null)
    const { error: err } = await updateBusiness(biz as Parameters<typeof updateBusiness>[0])
    setSaving(false)
    if (err) { setError(err.message) } else { setSaved(true); setTimeout(() => setSaved(false), 2500) }
  }

  const saveProfile = async () => {
    setSaving(true); setError(null)
    const { error: err } = await supabase.auth.updateUser({ data: { full_name: profileName } })
    setSaving(false)
    if (err) { setError(err.message) } else { setSaved(true); setTimeout(() => setSaved(false), 2500) }
  }

  const TABS = [{ v: 'business', l: 'Business' }, { v: 'profile', l: 'Profile' }, { v: 'integrations', l: 'Integrations' }] as const

  return (
    <AppLayout>
      <div style={{ padding: '1.5rem 2rem', maxWidth: 800, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Settings</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Manage your workspace and account</p>
        </div>

        {/* Tab nav */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0' }}>
          {TABS.map(t => (
            <button key={t.v} onClick={() => setTab(t.v)} style={{ padding: '0.625rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: tab === t.v ? 600 : 400, color: tab === t.v ? 'var(--accent-blue)' : 'var(--text-secondary)', borderBottom: `2px solid ${tab === t.v ? 'var(--accent-blue)' : 'transparent'}`, marginBottom: '-1px', transition: 'all 0.2s', fontSize: '0.9rem' }}>
              {t.l}
            </button>
          ))}
        </div>

        {error && <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--error)', marginBottom: '1rem', fontSize: '0.875rem' }}><AlertCircle size={16} />{error}</div>}
        {saved && <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--success)', marginBottom: '1rem', fontSize: '0.875rem' }}><CheckCircle2 size={16} />Saved successfully!</div>}

        {tab === 'business' && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontWeight: 600 }}>Business Details</h3>
            <div><label className="label">Business Name</label><input className="input" value={biz.name} onChange={e => setBiz(b => ({ ...b, name: e.target.value }))} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><label className="label">Category</label>
                <select className="input" value={biz.category} onChange={e => setBiz(b => ({ ...b, category: e.target.value }))} style={{ textTransform: 'capitalize' }}>
                  {CATEGORIES.map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}
                </select>
              </div>
              <div><label className="label">Stage</label>
                <select className="input" value={biz.stage} onChange={e => setBiz(b => ({ ...b, stage: e.target.value }))} style={{ textTransform: 'capitalize' }}>
                  {STAGES.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}
                </select>
              </div>
            </div>
            <div><label className="label">Currency</label>
              <select className="input" value={biz.currency} onChange={e => setBiz(b => ({ ...b, currency: e.target.value }))}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="label">Website</label><input className="input" type="url" value={biz.website} onChange={e => setBiz(b => ({ ...b, website: e.target.value }))} placeholder="https://…" /></div>
            <div><label className="label">Phone</label><input className="input" value={biz.phone} onChange={e => setBiz(b => ({ ...b, phone: e.target.value }))} /></div>
            <div><label className="label">Address</label><textarea className="input" rows={2} value={biz.address} onChange={e => setBiz(b => ({ ...b, address: e.target.value }))} /></div>
            <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={saveBusiness} disabled={saving}>
              {saving ? <><Loader2 size={16} className="spin" />Saving…</> : 'Save Changes'}
            </button>
          </div>
        )}

        {tab === 'profile' && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontWeight: 600 }}>Your Profile</h3>
            <div><label className="label">Full Name</label><input className="input" value={profileName} onChange={e => setProfileName(e.target.value)} /></div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={profileEmail} disabled style={{ opacity: 0.7, cursor: 'not-allowed' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.3rem' }}>Email cannot be changed here.</p>
            </div>
            <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={saveProfile} disabled={saving}>
              {saving ? <><Loader2 size={16} className="spin" />Saving…</> : 'Save Profile'}
            </button>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '0.5rem 0' }} />
            <div>
              <h4 style={{ fontWeight: 600, color: 'var(--error)', marginBottom: '0.75rem' }}>Sign Out</h4>
              <button className="btn btn-danger" onClick={signOut}>Sign out of VentureOS</button>
            </div>
          </div>
        )}

        {tab === 'integrations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card">
              <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Service Status</h3>
              {health === null ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}><Loader2 size={16} className="spin" />Checking…</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {[
                    { label: 'Supabase', key: 'supabase', desc: 'Database, auth, and file storage', ok: health.supabase },
                    { label: 'Gemini AI', key: 'gemini', desc: 'OCR document extraction and AI chat', ok: health.gemini },
                  ].map(s => (
                    <div key={s.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Server size={18} style={{ color: 'var(--text-secondary)' }} />
                        <div>
                          <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>{s.label}</p>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{s.desc}</p>
                        </div>
                      </div>
                      {s.ok ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--success)' }}><CheckCircle2 size={16} />Configured</span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--error)' }}><AlertCircle size={16} />Not configured</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h4 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Required Environment Variables</h4>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 2 }}>
                <div style={{ padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontFamily: 'var(--font-sans)' }}>Frontend (.env):</p>
                  VITE_SUPABASE_URL=...<br />
                  VITE_SUPABASE_ANON_KEY=...<br />
                  VITE_API_URL=http://localhost:3001<br />
                  <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0', fontFamily: 'var(--font-sans)' }}>Server (.env):</p>
                  SUPABASE_SERVICE_ROLE_KEY=...<br />
                  GEMINI_API_KEY=...
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default SettingsPage
