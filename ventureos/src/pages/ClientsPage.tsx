import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Edit2, Trash2, Mail, Phone, Loader2, AlertCircle, Users } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { SAMPLE_CLIENTS } from '../lib/sampleData'
import AppLayout from '../components/layout/AppLayout'
import Modal from '../components/ui/Modal'

interface Client {
  id: string
  name: string
  email: string
  phone: string
  company: string
  notes: string
  total_billed: number
  total_paid: number
  is_active: boolean
  created_at: string
}

const EMPTY: Partial<Client> = { name: '', email: '', phone: '', company: '', notes: '', is_active: true }

function formatCurrency(n: number, cur = 'INR') {
  if (cur === 'INR') return `₹${n.toLocaleString('en-IN')}`
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n)
}

const ClientsPage: React.FC = () => {
  const { business, isDemoMode } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [filtered, setFiltered] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editClient, setEditClient] = useState<Partial<Client>>(EMPTY)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!business?.id) return
    setLoading(true)

    if (!isSupabaseConfigured || isDemoMode) {
      const stored = localStorage.getItem('ventureos_demo_clients')
      if (stored) {
        try { setClients(JSON.parse(stored)) } catch { setClients(SAMPLE_CLIENTS as Client[]) }
      } else {
        setClients(SAMPLE_CLIENTS as Client[])
      }
      setLoading(false)
      return
    }

    const { data, error } = await supabase.from('clients').select('*').eq('business_id', business.id).order('created_at', { ascending: false })
    setLoading(false)
    if (error) { setError(error.message); return }
    setClients(data || [])
  }, [business?.id, isDemoMode])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(clients.filter(c => c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q)))
  }, [search, clients])

  const openCreate = () => { setEditClient(EMPTY); setModalOpen(true) }
  const openEdit = (c: Client) => { setEditClient(c); setModalOpen(true) }

  const save = async () => {
    if (!business?.id) return
    if (!editClient.name?.trim()) { setError('Client name is required.'); return }
    setSaving(true)
    setError(null)

    if (!isSupabaseConfigured || isDemoMode) {
      let updated: Client[]
      if (editClient.id) {
        updated = clients.map(c => c.id === editClient.id ? { ...c, ...editClient } as Client : c)
      } else {
        const newC: Client = {
          ...EMPTY,
          ...editClient,
          id: `c-${Date.now()}`,
          business_id: business.id,
          total_billed: 0,
          total_paid: 0,
          is_active: editClient.is_active ?? true,
          created_at: new Date().toISOString(),
        } as Client
        updated = [newC, ...clients]
      }
      localStorage.setItem('ventureos_demo_clients', JSON.stringify(updated))
      setClients(updated)
      setSaving(false)
      setModalOpen(false)
      return
    }

    const payload = { ...editClient, business_id: business.id }
    let err
    if (editClient.id) {
      const res = await supabase.from('clients').update(payload).eq('id', editClient.id)
      err = res.error
    } else {
      const res = await supabase.from('clients').insert(payload)
      err = res.error
      if (!err) await supabase.from('activity_log').insert({ business_id: business.id, type: 'client_created', title: 'Client added', description: `${editClient.name} added as a client` })
    }
    setSaving(false)
    if (err) { setError(err.message); return }
    setModalOpen(false)
    load()
  }

  const doDelete = async (id: string) => {
    if (!isSupabaseConfigured || isDemoMode) {
      const updated = clients.filter(c => c.id !== id)
      localStorage.setItem('ventureos_demo_clients', JSON.stringify(updated))
      setClients(updated)
      setDeleteId(null)
      return
    }
    await supabase.from('clients').delete().eq('id', id)
    setDeleteId(null)
    load()
  }

  const cur = business?.currency || 'INR'

  return (
    <AppLayout>
      <div style={{ padding: '1.5rem 2rem', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Clients</h1>
              {(!isSupabaseConfigured || isDemoMode) && (
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 12, background: 'rgba(79,140,255,0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(79,140,255,0.2)' }}>
                  Demo Data
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{clients.length} total client{clients.length !== 1 ? 's' : ''}</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={18} /> Add Client</button>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ position: 'relative', maxWidth: 360 }}>
            <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" style={{ paddingLeft: '2.5rem' }} placeholder="Search clients…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1rem', color: 'var(--error)', fontSize: '0.875rem' }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}><Loader2 size={24} className="spin" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <Users size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{search ? 'No clients match your search' : 'No clients yet'}</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>Add your first client to get started.</p>
            {!search && <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Client</button>}
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Company</th>
                  <th style={{ textAlign: 'right' }}>Billed</th>
                  <th style={{ textAlign: 'right' }}>Paid</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {c.email && <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}><Mail size={12} />{c.email}</span>}
                        {c.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}><Phone size={12} />{c.phone}</span>}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{c.company || '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>{formatCurrency(c.total_billed || 0, cur)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--success)' }}>{formatCurrency(c.total_paid || 0, cur)}</td>
                    <td><span className={`status-badge ${c.is_active ? 'status-badge-green' : 'status-badge-gray'}`}>{c.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}><Edit2 size={14} /></button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setDeleteId(c.id)} style={{ color: 'var(--error)' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create/Edit Modal */}
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editClient.id ? 'Edit Client' : 'Add Client'} size="md"
          footer={<div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? <><Loader2 size={16} className="spin" /> Saving…</> : 'Save Client'}</button>
          </div>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && <div style={{ color: 'var(--error)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><AlertCircle size={14} />{error}</div>}
            <div><label className="label">Name *</label><input className="input" value={editClient.name || ''} onChange={e => setEditClient(p => ({ ...p, name: e.target.value }))} placeholder="Client name" /></div>
            <div><label className="label">Email</label><input className="input" type="email" value={editClient.email || ''} onChange={e => setEditClient(p => ({ ...p, email: e.target.value }))} placeholder="client@example.com" /></div>
            <div><label className="label">Phone</label><input className="input" value={editClient.phone || ''} onChange={e => setEditClient(p => ({ ...p, phone: e.target.value }))} placeholder="+1 234 567 8900" /></div>
            <div><label className="label">Company</label><input className="input" value={editClient.company || ''} onChange={e => setEditClient(p => ({ ...p, company: e.target.value }))} placeholder="Company name" /></div>
            <div><label className="label">Notes</label><textarea className="input" rows={3} value={editClient.notes || ''} onChange={e => setEditClient(p => ({ ...p, notes: e.target.value }))} placeholder="Any notes…" /></div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={editClient.is_active ?? true} onChange={e => setEditClient(p => ({ ...p, is_active: e.target.checked }))} style={{ accentColor: 'var(--accent-blue)' }} />
              Active client
            </label>
          </div>
        </Modal>

        {/* Delete confirmation */}
        <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Client" size="sm"
          footer={<div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={() => deleteId && doDelete(deleteId)}>Delete</button>
          </div>}>
          <p style={{ color: 'var(--text-secondary)' }}>Are you sure you want to delete this client? This action cannot be undone.</p>
        </Modal>
      </div>
    </AppLayout>
  )
}

export default ClientsPage
