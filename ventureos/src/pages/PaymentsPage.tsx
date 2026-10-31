import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Loader2, CreditCard } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { SAMPLE_PAYMENTS, SAMPLE_INVOICES, SAMPLE_CLIENTS } from '../lib/sampleData'
import AppLayout from '../components/layout/AppLayout'
import Modal from '../components/ui/Modal'

interface Payment {
  id: string
  amount: number
  currency: string
  method: string
  reference: string
  payment_date: string
  notes: string
  invoices?: { invoice_number: string } | null
  clients?: { name: string } | null
}

const METHODS = ['cash','bank_transfer','upi','card','cheque','other']

function formatCurrency(n: number, cur = 'INR') {
  if (cur === 'INR') return `₹${n.toLocaleString('en-IN')}`
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n)
}

function formatDate(d: string) { return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' }

const PaymentsPage: React.FC = () => {
  const { business, isDemoMode } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [invoices, setInvoices] = useState<{ id: string; invoice_number: string }[]>([])
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({ amount: '', method: 'upi', invoice_id: '', client_id: '', reference: '', payment_date: new Date().toISOString().slice(0,10), notes: '' })

  const load = useCallback(async () => {
    if (!business?.id) return
    setLoading(true)

    if (!isSupabaseConfigured || isDemoMode) {
      const stored = localStorage.getItem('ventureos_demo_payments')
      if (stored) {
        try { setPayments(JSON.parse(stored)) } catch { setPayments(SAMPLE_PAYMENTS as Payment[]) }
      } else {
        setPayments(SAMPLE_PAYMENTS as Payment[])
      }

      setInvoices(SAMPLE_INVOICES.map(i => ({ id: i.id, invoice_number: i.invoice_number })))
      setClients(SAMPLE_CLIENTS.map(c => ({ id: c.id, name: c.name })))
      setLoading(false)
      return
    }

    const [pRes, iRes, cRes] = await Promise.all([
      supabase.from('payments').select('*, invoices(invoice_number), clients(name)').eq('business_id', business.id).order('payment_date', { ascending: false }),
      supabase.from('invoices').select('id,invoice_number').eq('business_id', business.id).neq('status','paid'),
      supabase.from('clients').select('id,name').eq('business_id', business.id),
    ])
    setLoading(false)
    setPayments(pRes.data || [])
    setInvoices(iRes.data || [])
    setClients(cRes.data || [])
  }, [business?.id, isDemoMode])

  useEffect(() => { load() }, [load])

  const total = payments.reduce((s, p) => s + (p.amount || 0), 0)

  const cur = business?.currency || 'INR'

  const save = async () => {
    if (!business?.id || !form.amount) return
    setSaving(true)

    if (!isSupabaseConfigured || isDemoMode) {
      const invNum = invoices.find(i => i.id === form.invoice_id)?.invoice_number || 'Direct'
      const cliName = clients.find(c => c.id === form.client_id)?.name || 'Direct Client'
      const newPay: Payment = {
        id: `pay-${Date.now()}`,
        amount: parseFloat(form.amount),
        currency: cur,
        method: form.method,
        reference: form.reference,
        payment_date: form.payment_date,
        notes: form.notes,
        invoices: { invoice_number: invNum },
        clients: { name: cliName },
      }
      const updated = [newPay, ...payments]
      localStorage.setItem('ventureos_demo_payments', JSON.stringify(updated))
      setPayments(updated)
      setSaving(false)
      setModalOpen(false)
      setForm({ amount: '', method: 'upi', invoice_id: '', client_id: '', reference: '', payment_date: new Date().toISOString().slice(0,10), notes: '' })
      return
    }

    await supabase.from('payments').insert({
      business_id: business.id, amount: parseFloat(form.amount), method: form.method,
      invoice_id: form.invoice_id || null, client_id: form.client_id || null,
      reference: form.reference, payment_date: form.payment_date, notes: form.notes, currency: cur
    })
    if (form.invoice_id) {
      const inv = invoices.find(i => i.id === form.invoice_id)
      if (inv) await supabase.from('invoices').update({ status: 'paid', paid_amount: parseFloat(form.amount), paid_date: form.payment_date }).eq('id', form.invoice_id)
    }
    await supabase.from('activity_log').insert({ business_id: business.id, type: 'payment_recorded', title: 'Payment recorded', description: `${formatCurrency(parseFloat(form.amount), cur)} received via ${form.method}` })
    setSaving(false)
    setModalOpen(false)
    setForm({ amount: '', method: 'upi', invoice_id: '', client_id: '', reference: '', payment_date: new Date().toISOString().slice(0,10), notes: '' })
    load()
  }

  return (
    <AppLayout>
      <div style={{ padding: '1.5rem 2rem', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Payments</h1>
              {(!isSupabaseConfigured || isDemoMode) && (
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 12, background: 'rgba(79,140,255,0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(79,140,255,0.2)' }}>
                  Demo Data
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total recorded: {formatCurrency(total, cur)}</p>
          </div>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}><Plus size={18} /> Record Payment</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}><Loader2 size={24} className="spin" /></div>
        ) : payments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <CreditCard size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No payments recorded</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Record payments when clients pay their invoices.</p>
            <button className="btn btn-primary" onClick={() => setModalOpen(true)}><Plus size={16} /> Record Payment</button>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead><tr><th>Date</th><th>Client</th><th>Invoice</th><th>Method</th><th>Reference</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{formatDate(p.payment_date)}</td>
                    <td>{p.clients?.name || '—'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-blue)' }}>{p.invoices?.invoice_number || '—'}</td>
                    <td><span className="status-badge status-badge-blue" style={{ textTransform: 'capitalize' }}>{p.method?.replace('_', ' ')}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{p.reference || '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(p.amount || 0, cur)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Record Payment" size="md"
          footer={<div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? <><Loader2 size={16} className="spin" />Saving…</> : 'Record Payment'}</button>
          </div>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><label className="label">Amount *</label><input className="input" type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" /></div>
              <div><label className="label">Date</label><input className="input" type="date" value={form.payment_date} onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))} /></div>
            </div>
            <div><label className="label">Payment Method</label>
              <select className="input" value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
                {METHODS.map(m => <option key={m} value={m} style={{ textTransform: 'capitalize' }}>{m.replace('_',' ')}</option>)}
              </select>
            </div>
            <div><label className="label">Invoice (optional)</label>
              <select className="input" value={form.invoice_id} onChange={e => setForm(f => ({ ...f, invoice_id: e.target.value }))}>
                <option value="">None</option>
                {invoices.map(i => <option key={i.id} value={i.id}>{i.invoice_number}</option>)}
              </select>
            </div>
            <div><label className="label">Client (optional)</label>
              <select className="input" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
                <option value="">None</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label className="label">Reference / Transaction ID</label><input className="input" value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} placeholder="UPI ref, bank transfer ID…" /></div>
            <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  )
}

export default PaymentsPage
