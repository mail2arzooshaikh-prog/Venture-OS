import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Loader2, FileText, CheckCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { SAMPLE_INVOICES, SAMPLE_CLIENTS } from '../lib/sampleData'
import AppLayout from '../components/layout/AppLayout'
import Modal from '../components/ui/Modal'

interface Invoice {
  id: string
  invoice_number: string
  status: string
  total: number
  paid_amount: number
  issue_date: string
  due_date: string
  currency: string
  notes: string
  client_id: string | null
  clients?: { name: string } | null
}

interface Client { id: string; name: string }

const STATUS_COLORS: Record<string, string> = {
  draft: 'status-badge-gray', sent: 'status-badge-blue', viewed: 'status-badge-blue',
  paid: 'status-badge-green', overdue: 'status-badge-red', cancelled: 'status-badge-gray'
}

function formatCurrency(n: number, cur = 'INR') {
  if (cur === 'INR') return `₹${n.toLocaleString('en-IN')}`
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n)
}

function formatDate(d: string) { return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' }

const InvoicesPage: React.FC = () => {
  const { business, isDemoMode } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [markPaidId, setMarkPaidId] = useState<string | null>(null)
  const [form, setForm] = useState({ client_id: '', invoice_number: '', issue_date: new Date().toISOString().slice(0, 10), due_date: '', notes: '', items: [{ description: '', quantity: 1, unit_price: 0 }] })

  const load = useCallback(async () => {
    if (!business?.id) return
    setLoading(true)

    if (!isSupabaseConfigured || isDemoMode) {
      const storedInv = localStorage.getItem('ventureos_demo_invoices')
      if (storedInv) {
        try { setInvoices(JSON.parse(storedInv)) } catch { setInvoices(SAMPLE_INVOICES as unknown as Invoice[]) }
      } else {
        setInvoices(SAMPLE_INVOICES as unknown as Invoice[])
      }

      const storedCli = localStorage.getItem('ventureos_demo_clients')
      if (storedCli) {
        try { setClients(JSON.parse(storedCli)) } catch { setClients(SAMPLE_CLIENTS as unknown as Client[]) }
      } else {
        setClients(SAMPLE_CLIENTS as unknown as Client[])
      }

      setLoading(false)
      return
    }

    const [invRes, cliRes] = await Promise.all([
      supabase.from('invoices').select('*, clients(name)').eq('business_id', business.id).order('created_at', { ascending: false }),
      supabase.from('clients').select('id,name').eq('business_id', business.id),
    ])
    setLoading(false)
    setInvoices(invRes.data || [])
    setClients(cliRes.data || [])
  }, [business?.id, isDemoMode])

  useEffect(() => { load() }, [load])

  const filtered = invoices.filter(i => {
    const matchFilter = filter === 'all' || i.status === filter
    const q = search.toLowerCase()
    const matchSearch = !q || i.invoice_number?.toLowerCase().includes(q) || i.clients?.name?.toLowerCase().includes(q)
    return matchFilter && matchSearch
  })

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { description: '', quantity: 1, unit_price: 0 }] }))
  const removeItem = (i: number) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))
  const updateItem = (i: number, field: string, value: string | number) => setForm(f => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, [field]: value } : it) }))
  const subtotal = form.items.reduce((s, it) => s + it.quantity * it.unit_price, 0)

  const save = async () => {
    if (!business?.id) return
    if (!form.invoice_number.trim()) return
    setSaving(true)

    if (!isSupabaseConfigured || isDemoMode) {
      const clientName = clients.find(c => c.id === form.client_id)?.name || 'Direct Client'
      const newInv: Invoice = {
        id: `inv-${Date.now()}`,
        invoice_number: form.invoice_number,
        status: 'draft',
        issue_date: form.issue_date,
        due_date: form.due_date || new Date().toISOString().slice(0, 10),
        total: subtotal,
        paid_amount: 0,
        currency: business.currency || 'INR',
        notes: form.notes,
        client_id: form.client_id || null,
        clients: { name: clientName },
      }
      const updated = [newInv, ...invoices]
      localStorage.setItem('ventureos_demo_invoices', JSON.stringify(updated))
      setInvoices(updated)
      setSaving(false)
      setModalOpen(false)
      return
    }

    const { data: inv, error } = await supabase.from('invoices').insert({
      business_id: business.id, client_id: form.client_id || null,
      invoice_number: form.invoice_number, status: 'draft',
      issue_date: form.issue_date, due_date: form.due_date || null,
      subtotal, total: subtotal, currency: business.currency || 'INR', notes: form.notes,
    }).select().single()
    if (!error && inv) {
      const items = form.items.filter(it => it.description).map((it, i) => ({ invoice_id: inv.id, description: it.description, quantity: it.quantity, unit_price: it.unit_price, amount: it.quantity * it.unit_price, sort_order: i }))
      if (items.length) await supabase.from('invoice_items').insert(items)
      await supabase.from('activity_log').insert({ business_id: business.id, type: 'invoice_created', title: 'Invoice created', description: `Invoice ${form.invoice_number} created` })
    }
    setSaving(false)
    setModalOpen(false)
    load()
  }

  const markPaid = async () => {
    if (!markPaidId) return
    if (!isSupabaseConfigured || isDemoMode) {
      const updated = invoices.map(i => i.id === markPaidId ? { ...i, status: 'paid', paid_amount: i.total, paid_date: new Date().toISOString().slice(0, 10) } : i)
      localStorage.setItem('ventureos_demo_invoices', JSON.stringify(updated))
      setInvoices(updated)
      setMarkPaidId(null)
      return
    }
    await supabase.from('invoices').update({ status: 'paid', paid_amount: invoices.find(i => i.id === markPaidId)?.total || 0, paid_date: new Date().toISOString().slice(0, 10) }).eq('id', markPaidId)
    setMarkPaidId(null)
    load()
  }

  const cur = business?.currency || 'INR'
  const STATUSES = ['all', 'draft', 'sent', 'paid', 'overdue']

  return (
    <AppLayout>
      <div style={{ padding: '1.5rem 2rem', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Invoices</h1>
              {(!isSupabaseConfigured || isDemoMode) && (
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 12, background: 'rgba(79,140,255,0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(79,140,255,0.2)' }}>
                  Demo Data
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setForm({ client_id: '', invoice_number: `INV-${Date.now().toString().slice(-5)}`, issue_date: new Date().toISOString().slice(0, 10), due_date: '', notes: '', items: [{ description: '', quantity: 1, unit_price: 0 }] }); setModalOpen(true) }}><Plus size={18} /> New Invoice</button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {STATUSES.map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`} style={{ textTransform: 'capitalize' }}>{s}</button>
          ))}
          <div style={{ position: 'relative', marginLeft: 'auto' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" style={{ paddingLeft: '2.25rem', height: 36 }} placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}><Loader2 size={24} className="spin" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <FileText size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No invoices{filter !== 'all' ? ` with status: ${filter}` : ' yet'}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Create your first invoice to start tracking payments.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>{inv.invoice_number}</td>
                    <td>{inv.clients?.name || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{formatDate(inv.issue_date)}</td>
                    <td style={{ color: inv.status === 'overdue' ? 'var(--error)' : 'var(--text-secondary)', fontSize: '0.875rem' }}>{formatDate(inv.due_date)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(inv.total || 0, cur)}</td>
                    <td><span className={`status-badge ${STATUS_COLORS[inv.status] || 'status-badge-gray'}`} style={{ textTransform: 'capitalize' }}>{inv.status}</span></td>
                    <td>
                      {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => setMarkPaidId(inv.id)} title="Mark as paid"><CheckCircle size={14} style={{ color: 'var(--success)' }} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create Invoice Modal */}
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Invoice" size="lg"
          footer={<div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? <><Loader2 size={16} className="spin" /> Saving…</> : 'Create Invoice'}</button>
          </div>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="label">Invoice Number *</label>
                <input className="input" value={form.invoice_number} onChange={e => setForm(f => ({ ...f, invoice_number: e.target.value }))} />
              </div>
              <div>
                <label className="label">Client</label>
                <select className="input" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
                  <option value="">No client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Issue Date</label>
                <input className="input" type="date" value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} />
              </div>
              <div>
                <label className="label">Due Date</label>
                <input className="input" type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">Line Items</label>
              {form.items.map((it, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 32px', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                  <input className="input" placeholder="Description" value={it.description} onChange={e => updateItem(i, 'description', e.target.value)} />
                  <input className="input" type="number" min="1" placeholder="Qty" value={it.quantity} onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value) || 1)} />
                  <input className="input" type="number" min="0" placeholder="Price" value={it.unit_price} onChange={e => updateItem(i, 'unit_price', parseFloat(e.target.value) || 0)} />
                  <button className="btn btn-ghost btn-sm" onClick={() => removeItem(i)} style={{ color: 'var(--error)' }}>✕</button>
                </div>
              ))}
              <button className="btn btn-ghost btn-sm" onClick={addItem}><Plus size={14} /> Add item</button>
              <div style={{ textAlign: 'right', marginTop: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)' }}>Total: {formatCurrency(subtotal, cur)}</div>
            </div>
            <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Payment terms, notes…" /></div>
          </div>
        </Modal>

        {/* Mark paid confirmation */}
        <Modal isOpen={!!markPaidId} onClose={() => setMarkPaidId(null)} title="Mark as Paid" size="sm"
          footer={<div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setMarkPaidId(null)}>Cancel</button>
            <button className="btn btn-primary" style={{ background: 'var(--success)' }} onClick={markPaid}>Mark Paid</button>
          </div>}>
          <p style={{ color: 'var(--text-secondary)' }}>Confirm this invoice has been paid in full?</p>
        </Modal>
      </div>
    </AppLayout>
  )
}

export default InvoicesPage
