import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Loader2, Receipt } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { SAMPLE_EXPENSES } from '../lib/sampleData'
import AppLayout from '../components/layout/AppLayout'
import Modal from '../components/ui/Modal'

interface Expense {
  id: string
  description: string
  amount: number
  currency: string
  category: string
  vendor: string
  expense_date: string
  notes: string
}

const CATEGORIES = ['office','travel','software','marketing','utilities','salaries','equipment','food','other']

const CATEGORY_COLORS: Record<string,string> = {
  office:'status-badge-blue',travel:'status-badge-violet',software:'status-badge-cyan',
  marketing:'status-badge-amber',utilities:'status-badge-gray',salaries:'status-badge-green',
  equipment:'status-badge-blue',food:'status-badge-amber',other:'status-badge-gray'
}

function formatCurrency(n: number, cur = 'INR') {
  if (cur === 'INR') return `₹${n.toLocaleString('en-IN')}`
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n)
}

function formatDate(d: string) { return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' }

const ExpensesPage: React.FC = () => {
  const { business, isDemoMode } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [catFilter, setCatFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '', category: 'other', vendor: '', expense_date: new Date().toISOString().slice(0,10), notes: '' })

  const load = useCallback(async () => {
    if (!business?.id) return
    setLoading(true)

    if (!isSupabaseConfigured || isDemoMode) {
      const stored = localStorage.getItem('ventureos_demo_expenses')
      if (stored) {
        try { setExpenses(JSON.parse(stored)) } catch { setExpenses(SAMPLE_EXPENSES as Expense[]) }
      } else {
        setExpenses(SAMPLE_EXPENSES as Expense[])
      }
      setLoading(false)
      return
    }

    const { data } = await supabase.from('expenses').select('*').eq('business_id', business.id).order('expense_date', { ascending: false })
    setLoading(false)
    setExpenses(data || [])
  }, [business?.id, isDemoMode])

  useEffect(() => { load() }, [load])

  const filtered = catFilter === 'all' ? expenses : expenses.filter(e => e.category === catFilter)
  const total = filtered.reduce((s, e) => s + (e.amount || 0), 0)
  const cur = business?.currency || 'INR'

  const save = async () => {
    if (!business?.id || !form.description || !form.amount) return
    setSaving(true)

    if (!isSupabaseConfigured || isDemoMode) {
      const newE: Expense = {
        id: `exp-${Date.now()}`,
        description: form.description,
        amount: parseFloat(form.amount),
        currency: cur,
        category: form.category,
        vendor: form.vendor,
        expense_date: form.expense_date,
        notes: form.notes,
      }
      const updated = [newE, ...expenses]
      localStorage.setItem('ventureos_demo_expenses', JSON.stringify(updated))
      setExpenses(updated)
      setSaving(false)
      setModalOpen(false)
      setForm({ description: '', amount: '', category: 'other', vendor: '', expense_date: new Date().toISOString().slice(0,10), notes: '' })
      return
    }

    await supabase.from('expenses').insert({ business_id: business.id, description: form.description, amount: parseFloat(form.amount), category: form.category, vendor: form.vendor, expense_date: form.expense_date, notes: form.notes, currency: cur })
    await supabase.from('activity_log').insert({ business_id: business.id, type: 'expense_added', title: 'Expense logged', description: `${form.description} — ${formatCurrency(parseFloat(form.amount), cur)}` })
    setSaving(false)
    setModalOpen(false)
    setForm({ description: '', amount: '', category: 'other', vendor: '', expense_date: new Date().toISOString().slice(0,10), notes: '' })
    load()
  }

  return (
    <AppLayout>
      <div style={{ padding: '1.5rem 2rem', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Expenses</h1>
              {(!isSupabaseConfigured || isDemoMode) && (
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 12, background: 'rgba(79,140,255,0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(79,140,255,0.2)' }}>
                  Demo Data
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total: {formatCurrency(total, cur)}</p>
          </div>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}><Plus size={18} /> Log Expense</button>
        </div>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {['all', ...CATEGORIES].map(c => (
            <button key={c} className={`btn btn-sm ${catFilter === c ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCatFilter(c)} style={{ textTransform: 'capitalize' }}>{c}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}><Loader2 size={24} className="spin" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <Receipt size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No expenses yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Log your business expenses to track spending.</p>
            <button className="btn btn-primary" onClick={() => setModalOpen(true)}><Plus size={16} /> Log Expense</button>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Vendor</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id}>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>{formatDate(e.expense_date)}</td>
                    <td><span className={`status-badge ${CATEGORY_COLORS[e.category] || 'status-badge-gray'}`} style={{ textTransform: 'capitalize' }}>{e.category}</span></td>
                    <td style={{ fontWeight: 500 }}>{e.description}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{e.vendor || '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(e.amount || 0, cur)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Log Expense" size="md"
          footer={<div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? <><Loader2 size={16} className="spin" /> Saving…</> : 'Save Expense'}</button>
          </div>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div><label className="label">Description *</label><input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What was this expense for?" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><label className="label">Amount *</label><input className="input" type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" /></div>
              <div><label className="label">Date</label><input className="input" type="date" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><label className="label">Category</label>
                <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ textTransform: 'capitalize' }}>
                  {CATEGORIES.map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}
                </select>
              </div>
              <div><label className="label">Vendor</label><input className="input" value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} placeholder="Vendor name" /></div>
            </div>
            <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any additional notes…" /></div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  )
}

export default ExpensesPage
