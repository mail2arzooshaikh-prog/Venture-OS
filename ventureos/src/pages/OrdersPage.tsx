import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Loader2, ShoppingCart } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { SAMPLE_ORDERS, SAMPLE_CLIENTS } from '../lib/sampleData'
import AppLayout from '../components/layout/AppLayout'
import Modal from '../components/ui/Modal'

interface Order {
  id: string
  order_number: string
  status: string
  total: number
  currency: string
  notes: string
  expected_date: string
  created_at: string
  clients?: { name: string } | null
}

const STATUSES = ['pending','confirmed','processing','shipped','delivered','cancelled']
const STATUS_COLORS: Record<string,string> = {
  pending:'status-badge-amber',confirmed:'status-badge-blue',processing:'status-badge-blue',
  shipped:'status-badge-violet',delivered:'status-badge-green',cancelled:'status-badge-gray'
}

function formatCurrency(n: number, cur = 'INR') {
  if (cur === 'INR') return `₹${n.toLocaleString('en-IN')}`
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n)
}

function formatDate(d: string) { return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' }

const OrdersPage: React.FC = () => {
  const { business, isDemoMode } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [form, setForm] = useState({ client_id: '', order_number: '', notes: '', total: '', expected_date: '', items: [{ description: '', quantity: 1, unit_price: 0 }] })

  const load = useCallback(async () => {
    if (!business?.id) return
    setLoading(true)

    if (!isSupabaseConfigured || isDemoMode) {
      const stored = localStorage.getItem('ventureos_demo_orders')
      if (stored) {
        try { setOrders(JSON.parse(stored)) } catch { setOrders(SAMPLE_ORDERS as unknown as Order[]) }
      } else {
        setOrders(SAMPLE_ORDERS as unknown as Order[])
      }
      setClients(SAMPLE_CLIENTS.map(c => ({ id: c.id, name: c.name })))
      setLoading(false)
      return
    }

    const [oRes, cRes] = await Promise.all([
      supabase.from('orders').select('*, clients(name)').eq('business_id', business.id).order('created_at', { ascending: false }),
      supabase.from('clients').select('id,name').eq('business_id', business.id),
    ])
    setLoading(false)
    setOrders(oRes.data || [])
    setClients(cRes.data || [])
  }, [business?.id, isDemoMode])

  useEffect(() => { load() }, [load])

  const filtered = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter)
  const cur = business?.currency || 'INR'

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { description: '', quantity: 1, unit_price: 0 }] }))
  const updateItem = (i: number, field: string, value: string | number) => setForm(f => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, [field]: value } : it) }))
  const subtotal = form.items.reduce((s, it) => s + it.quantity * it.unit_price, 0)

  const updateStatus = async (id: string, status: string) => {
    if (!isSupabaseConfigured || isDemoMode) {
      const updated = orders.map(o => o.id === id ? { ...o, status } : o)
      localStorage.setItem('ventureos_demo_orders', JSON.stringify(updated))
      setOrders(updated)
      return
    }
    await supabase.from('orders').update({ status }).eq('id', id)
    load()
  }

  const save = async () => {
    if (!business?.id || !form.order_number) return
    setSaving(true)

    if (!isSupabaseConfigured || isDemoMode) {
      const cliName = clients.find(c => c.id === form.client_id)?.name || null
      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        order_number: form.order_number,
        status: 'pending',
        total: subtotal,
        currency: cur,
        notes: form.notes,
        expected_date: form.expected_date || new Date().toISOString().slice(0, 10),
        created_at: new Date().toISOString(),
        clients: cliName ? { name: cliName } : null,
      }
      const updated = [newOrder, ...orders]
      localStorage.setItem('ventureos_demo_orders', JSON.stringify(updated))
      setOrders(updated)
      setSaving(false)
      setModalOpen(false)
      return
    }

    const { data: ord } = await supabase.from('orders').insert({
      business_id: business.id, client_id: form.client_id || null,
      order_number: form.order_number, status: 'pending',
      total: subtotal, currency: cur, notes: form.notes,
      expected_date: form.expected_date || null,
    }).select().single()
    if (ord) {
      const items = form.items.filter(it => it.description).map((it, i) => ({ order_id: ord.id, description: it.description, quantity: it.quantity, unit_price: it.unit_price, amount: it.quantity * it.unit_price, sort_order: i }))
      if (items.length) await supabase.from('order_items').insert(items)
      await supabase.from('activity_log').insert({ business_id: business.id, type: 'order_created', title: 'Order created', description: `Order ${form.order_number} created` })
    }
    setSaving(false)
    setModalOpen(false)
    load()
  }

  return (
    <AppLayout>
      <div style={{ padding: '1.5rem 2rem', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Orders</h1>
              {(!isSupabaseConfigured || isDemoMode) && (
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 12, background: 'rgba(79,140,255,0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(79,140,255,0.2)' }}>
                  Demo Data
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setForm({ client_id: '', order_number: `ORD-${Date.now().toString().slice(-5)}`, notes: '', total: '', expected_date: '', items: [{ description: '', quantity: 1, unit_price: 0 }] }); setModalOpen(true) }}><Plus size={18} /> New Order</button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {['all', ...STATUSES].map(s => (
            <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setStatusFilter(s)} style={{ textTransform: 'capitalize' }}>{s}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}><Loader2 size={24} className="spin" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <ShoppingCart size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No orders yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Track customer orders from placement to delivery.</p>
            <button className="btn btn-primary" onClick={() => setModalOpen(true)}><Plus size={16} /> New Order</button>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead><tr><th>Order #</th><th>Client</th><th>Date</th><th>Expected</th><th style={{ textAlign: 'right' }}>Total</th><th>Status</th><th>Update</th></tr></thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>{o.order_number}</td>
                    <td>{o.clients?.name || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{formatDate(o.created_at)}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{formatDate(o.expected_date)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(o.total || 0, cur)}</td>
                    <td><span className={`status-badge ${STATUS_COLORS[o.status] || 'status-badge-gray'}`} style={{ textTransform: 'capitalize' }}>{o.status}</span></td>
                    <td>
                      <select className="input" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', height: 32 }} value={o.status} onChange={e => updateStatus(o.id, e.target.value)}>
                        {STATUSES.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Order" size="lg"
          footer={<div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? <><Loader2 size={16} className="spin" />Saving…</> : 'Create Order'}</button>
          </div>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><label className="label">Order Number *</label><input className="input" value={form.order_number} onChange={e => setForm(f => ({ ...f, order_number: e.target.value }))} /></div>
              <div><label className="label">Client</label>
                <select className="input" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
                  <option value="">None</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label className="label">Expected Date</label><input className="input" type="date" value={form.expected_date} onChange={e => setForm(f => ({ ...f, expected_date: e.target.value }))} /></div>
            </div>
            <div>
              <label className="label">Items</label>
              {form.items.map((it, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 32px', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                  <input className="input" placeholder="Description" value={it.description} onChange={e => updateItem(i, 'description', e.target.value)} />
                  <input className="input" type="number" min="1" value={it.quantity} onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value) || 1)} />
                  <input className="input" type="number" min="0" value={it.unit_price} onChange={e => updateItem(i, 'unit_price', parseFloat(e.target.value) || 0)} />
                  <button className="btn btn-ghost btn-sm" onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))} style={{ color: 'var(--error)' }}>✕</button>
                </div>
              ))}
              <button className="btn btn-ghost btn-sm" onClick={addItem}><Plus size={14} /> Add item</button>
              <div style={{ textAlign: 'right', marginTop: '0.5rem', fontWeight: 700, color: 'var(--accent-blue)' }}>Total: {formatCurrency(subtotal, cur)}</div>
            </div>
            <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  )
}

export default OrdersPage
