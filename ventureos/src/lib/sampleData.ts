/**
 * sampleData.ts
 * Realistic sample business data for VentureOS demo workspace.
 * Used when Supabase is not configured or demo mode is active.
 */

export interface SampleClient {
  id: string
  business_id: string
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

export interface SampleInvoice {
  id: string
  business_id: string
  client_id: string
  invoice_number: string
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled'
  issue_date: string
  due_date: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  discount: number
  total: number
  currency: string
  notes: string
  paid_amount: number
  paid_date: string | null
  created_at: string
  clients?: { name: string }
}

export interface SampleExpense {
  id: string
  business_id: string
  category: string
  description: string
  amount: number
  currency: string
  vendor: string
  expense_date: string
  notes: string
  created_at: string
}

export interface SamplePayment {
  id: string
  business_id: string
  amount: number
  currency: string
  method: string
  reference: string
  payment_date: string
  notes: string
  invoices?: { invoice_number: string }
  clients?: { name: string }
}

export interface SampleTask {
  id: string
  business_id: string
  client_id: string | null
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date: string
  completed_at: string | null
  clients?: { name: string }
  created_at: string
}

export interface SampleOrder {
  id: string
  business_id: string
  client_id: string | null
  order_number: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total: number
  currency: string
  notes: string
  expected_date: string
  created_at: string
  clients?: { name: string }
}

export interface SampleDocument {
  id: string
  business_id: string
  type: string
  original_filename: string
  storage_path: string | null
  confidence: number
  review_status: string
  created_at: string
  extracted_data: Record<string, unknown>
}

export interface SampleActivity {
  id: string
  business_id: string
  type: string
  title: string
  description: string
  created_at: string
}

// -----------------------------------------------------------------------------
// Seed Data
// -----------------------------------------------------------------------------

export const SAMPLE_CLIENTS: SampleClient[] = [
  {
    id: 'c-1',
    business_id: 'demo-biz-id-001',
    name: 'Sarah Jenkins',
    email: 'sarah@zenithcorp.io',
    phone: '+91 98765 43210',
    company: 'Zenith Innovations',
    notes: 'Key enterprise retainer client. Quarterly product design sprint.',
    total_billed: 450000,
    total_paid: 450000,
    is_active: true,
    created_at: '2026-06-15T10:00:00Z',
  },
  {
    id: 'c-2',
    business_id: 'demo-biz-id-001',
    name: 'Rajesh Sharma',
    email: 'r.sharma@hyperionlabs.tech',
    phone: '+91 98112 34567',
    company: 'Hyperion Labs',
    notes: 'Cloud migration and AI analytics consulting contract.',
    total_billed: 380000,
    total_paid: 250000,
    is_active: true,
    created_at: '2026-07-20T14:30:00Z',
  },
  {
    id: 'c-3',
    business_id: 'demo-biz-id-001',
    name: 'Elena Rostova',
    email: 'elena@pulsedigital.co',
    phone: '+44 7911 123456',
    company: 'Pulse Digital Agency',
    notes: 'Brand design system and website engineering.',
    total_billed: 220000,
    total_paid: 220000,
    is_active: true,
    created_at: '2026-08-05T09:15:00Z',
  },
  {
    id: 'c-4',
    business_id: 'demo-biz-id-001',
    name: 'David Chen',
    email: 'david@vertexfin.com',
    phone: '+65 6789 0123',
    company: 'Vertex Financial Services',
    notes: 'Fintech compliance and automated reporting dashboard.',
    total_billed: 580000,
    total_paid: 400000,
    is_active: true,
    created_at: '2026-08-18T16:00:00Z',
  },
  {
    id: 'c-5',
    business_id: 'demo-biz-id-001',
    name: 'Aanya Patel',
    email: 'aanya@luminatehealth.in',
    phone: '+91 97234 56789',
    company: 'Luminate Health Systems',
    notes: 'Telemedicine web platform upgrade.',
    total_billed: 310000,
    total_paid: 0,
    is_active: true,
    created_at: '2026-09-02T11:45:00Z',
  },
  {
    id: 'c-6',
    business_id: 'demo-biz-id-001',
    name: 'Marcus Vance',
    email: 'marcus@aeroventure.com',
    phone: '+1 415 555 2671',
    company: 'AeroVentures',
    notes: 'Seed-stage advisory and pitch deck design.',
    total_billed: 175000,
    total_paid: 175000,
    is_active: true,
    created_at: '2026-09-14T08:30:00Z',
  },
]

export const SAMPLE_INVOICES: SampleInvoice[] = [
  {
    id: 'inv-1',
    business_id: 'demo-biz-id-001',
    client_id: 'c-1',
    invoice_number: 'INV-2026-001',
    status: 'paid',
    issue_date: '2026-08-01',
    due_date: '2026-08-15',
    subtotal: 250000,
    tax_rate: 18,
    tax_amount: 45000,
    discount: 0,
    total: 295000,
    currency: 'INR',
    notes: 'Q3 Enterprise Design System milestone 1',
    paid_amount: 295000,
    paid_date: '2026-08-14',
    created_at: '2026-08-01T10:00:00Z',
    clients: { name: 'Sarah Jenkins (Zenith Innovations)' },
  },
  {
    id: 'inv-2',
    business_id: 'demo-biz-id-001',
    client_id: 'c-2',
    invoice_number: 'INV-2026-002',
    status: 'paid',
    issue_date: '2026-08-20',
    due_date: '2026-09-05',
    subtotal: 210000,
    tax_rate: 18,
    tax_amount: 37800,
    discount: 0,
    total: 247800,
    currency: 'INR',
    notes: 'Cloud data pipeline architecture review',
    paid_amount: 247800,
    paid_date: '2026-09-02',
    created_at: '2026-08-20T11:00:00Z',
    clients: { name: 'Rajesh Sharma (Hyperion Labs)' },
  },
  {
    id: 'inv-3',
    business_id: 'demo-biz-id-001',
    client_id: 'c-3',
    invoice_number: 'INV-2026-003',
    status: 'paid',
    issue_date: '2026-09-01',
    due_date: '2026-09-15',
    subtotal: 185000,
    tax_rate: 18,
    tax_amount: 33300,
    discount: 0,
    total: 218300,
    currency: 'INR',
    notes: 'Agency branding assets and marketing kit',
    paid_amount: 218300,
    paid_date: '2026-09-12',
    created_at: '2026-09-01T09:30:00Z',
    clients: { name: 'Elena Rostova (Pulse Digital)' },
  },
  {
    id: 'inv-4',
    business_id: 'demo-biz-id-001',
    client_id: 'c-4',
    invoice_number: 'INV-2026-004',
    status: 'sent',
    issue_date: '2026-10-01',
    due_date: '2026-10-25',
    subtotal: 320000,
    tax_rate: 18,
    tax_amount: 57600,
    discount: 0,
    total: 377600,
    currency: 'INR',
    notes: 'Fintech compliance platform Phase 2',
    paid_amount: 0,
    paid_date: null,
    created_at: '2026-10-01T15:00:00Z',
    clients: { name: 'David Chen (Vertex Financial)' },
  },
  {
    id: 'inv-5',
    business_id: 'demo-biz-id-001',
    client_id: 'c-5',
    invoice_number: 'INV-2026-005',
    status: 'overdue',
    issue_date: '2026-09-15',
    due_date: '2026-10-05',
    subtotal: 260000,
    tax_rate: 18,
    tax_amount: 46800,
    discount: 0,
    total: 306800,
    currency: 'INR',
    notes: 'Telemedicine web platform upgrade deposit',
    paid_amount: 0,
    paid_date: null,
    created_at: '2026-09-15T12:00:00Z',
    clients: { name: 'Aanya Patel (Luminate Health)' },
  },
  {
    id: 'inv-6',
    business_id: 'demo-biz-id-001',
    client_id: 'c-6',
    invoice_number: 'INV-2026-006',
    status: 'draft',
    issue_date: '2026-10-18',
    due_date: '2026-11-02',
    subtotal: 145000,
    tax_rate: 18,
    tax_amount: 26100,
    discount: 0,
    total: 171100,
    currency: 'INR',
    notes: 'Pitch deck design sprint & investor collateral',
    paid_amount: 0,
    paid_date: null,
    created_at: '2026-10-18T16:20:00Z',
    clients: { name: 'Marcus Vance (AeroVentures)' },
  },
]

export const SAMPLE_EXPENSES: SampleExpense[] = [
  {
    id: 'exp-1',
    business_id: 'demo-biz-id-001',
    category: 'software',
    description: 'AWS Cloud Hosting & Lambda',
    amount: 32500,
    currency: 'INR',
    vendor: 'Amazon Web Services',
    expense_date: '2026-10-02',
    notes: 'Production infrastructure and database backups',
    created_at: '2026-10-02T10:00:00Z',
  },
  {
    id: 'exp-2',
    business_id: 'demo-biz-id-001',
    category: 'software',
    description: 'Figma Enterprise Organization',
    amount: 14800,
    currency: 'INR',
    vendor: 'Figma Inc.',
    expense_date: '2026-10-05',
    notes: 'Design team annual licenses',
    created_at: '2026-10-05T11:00:00Z',
  },
  {
    id: 'exp-3',
    business_id: 'demo-biz-id-001',
    category: 'marketing',
    description: 'LinkedIn Ads & Founder Content Promotion',
    amount: 45000,
    currency: 'INR',
    vendor: 'LinkedIn',
    expense_date: '2026-10-10',
    notes: 'B2B lead generation campaign for enterprise clients',
    created_at: '2026-10-10T14:00:00Z',
  },
  {
    id: 'exp-4',
    business_id: 'demo-biz-id-001',
    category: 'equipment',
    description: 'Dell UltraSharp 32" 4K Monitor',
    amount: 58900,
    currency: 'INR',
    vendor: 'Dell India',
    expense_date: '2026-10-12',
    notes: 'Workstation upgrade for senior designer',
    created_at: '2026-10-12T16:30:00Z',
  },
  {
    id: 'exp-5',
    business_id: 'demo-biz-id-001',
    category: 'travel',
    description: 'Bengaluru Tech Summit Client Meetings',
    amount: 24300,
    currency: 'INR',
    vendor: 'IndiGo Airlines',
    expense_date: '2026-10-15',
    notes: 'Flights and hotel for client partnership discussions',
    created_at: '2026-10-15T09:00:00Z',
  },
  {
    id: 'exp-6',
    business_id: 'demo-biz-id-001',
    category: 'office',
    description: 'Coworking Space Dedicated Desks',
    amount: 42000,
    currency: 'INR',
    vendor: 'WeWork Galaxy',
    expense_date: '2026-10-01',
    notes: 'Monthly team workspace in Bengaluru',
    created_at: '2026-10-01T08:00:00Z',
  },
]

export const SAMPLE_PAYMENTS: SamplePayment[] = [
  {
    id: 'pay-1',
    business_id: 'demo-biz-id-001',
    amount: 295000,
    currency: 'INR',
    method: 'bank_transfer',
    reference: 'HDFC-NEFT-984321',
    payment_date: '2026-08-14',
    notes: 'Payment received for INV-2026-001',
    invoices: { invoice_number: 'INV-2026-001' },
    clients: { name: 'Sarah Jenkins (Zenith)' },
  },
  {
    id: 'pay-2',
    business_id: 'demo-biz-id-001',
    amount: 247800,
    currency: 'INR',
    method: 'upi',
    reference: 'UPI/329487219/hyperion',
    payment_date: '2026-09-02',
    notes: 'Payment received for INV-2026-002',
    invoices: { invoice_number: 'INV-2026-002' },
    clients: { name: 'Rajesh Sharma (Hyperion)' },
  },
  {
    id: 'pay-3',
    business_id: 'demo-biz-id-001',
    amount: 218300,
    currency: 'INR',
    method: 'bank_transfer',
    reference: 'BARC-WIRE-44129',
    payment_date: '2026-09-12',
    notes: 'Payment received for INV-2026-003',
    invoices: { invoice_number: 'INV-2026-003' },
    clients: { name: 'Elena Rostova (Pulse)' },
  },
]

export const SAMPLE_TASKS: SampleTask[] = [
  {
    id: 'tsk-1',
    business_id: 'demo-biz-id-001',
    client_id: 'c-4',
    title: 'Finalize Vertex compliance report architecture',
    description: 'Ensure automated PDF report generator aligns with MAS security standards.',
    status: 'in_progress',
    priority: 'urgent',
    due_date: '2026-10-24',
    completed_at: null,
    clients: { name: 'Vertex Financial Services' },
    created_at: '2026-10-18T10:00:00Z',
  },
  {
    id: 'tsk-2',
    business_id: 'demo-biz-id-001',
    client_id: 'c-5',
    title: 'Follow up on Luminate Health invoice #005',
    description: 'Call Aanya Patel regarding invoice past due date.',
    status: 'todo',
    priority: 'high',
    due_date: '2026-10-23',
    completed_at: null,
    clients: { name: 'Luminate Health Systems' },
    created_at: '2026-10-19T14:00:00Z',
  },
  {
    id: 'tsk-3',
    business_id: 'demo-biz-id-001',
    client_id: 'c-6',
    title: 'Ship AeroVentures pitch deck revision 3',
    description: 'Incorporate founder feedback on financial unit economics slides.',
    status: 'in_progress',
    priority: 'medium',
    due_date: '2026-10-26',
    completed_at: null,
    clients: { name: 'AeroVentures' },
    created_at: '2026-10-20T09:00:00Z',
  },
  {
    id: 'tsk-4',
    business_id: 'demo-biz-id-001',
    client_id: 'c-1',
    title: 'Q3 Retainer retrospective & roadmap signoff',
    description: 'Review design system adoption metrics with Sarah Jenkins.',
    status: 'done',
    priority: 'medium',
    due_date: '2026-10-15',
    completed_at: '2026-10-15T17:00:00Z',
    clients: { name: 'Zenith Innovations' },
    created_at: '2026-10-10T11:00:00Z',
  },
]

export const SAMPLE_ORDERS: SampleOrder[] = [
  {
    id: 'ord-1',
    business_id: 'demo-biz-id-001',
    client_id: 'c-1',
    order_number: 'ORD-2026-101',
    status: 'processing',
    total: 185000,
    currency: 'INR',
    notes: 'Custom UI component library distribution package',
    expected_date: '2026-10-28',
    created_at: '2026-10-15T11:00:00Z',
    clients: { name: 'Zenith Innovations' },
  },
  {
    id: 'ord-2',
    business_id: 'demo-biz-id-001',
    client_id: 'c-3',
    order_number: 'ORD-2026-102',
    status: 'delivered',
    total: 95000,
    currency: 'INR',
    notes: 'Physical brand guidelines books & swag box',
    expected_date: '2026-10-10',
    created_at: '2026-10-02T14:30:00Z',
    clients: { name: 'Pulse Digital Agency' },
  },
]

export const SAMPLE_DOCUMENTS: SampleDocument[] = [
  {
    id: 'doc-1',
    business_id: 'demo-biz-id-001',
    type: 'invoice',
    original_filename: 'AWS_Billing_October.pdf',
    storage_path: null,
    confidence: 0.96,
    review_status: 'confirmed',
    created_at: '2026-10-02T10:05:00Z',
    extracted_data: { vendor: 'Amazon Web Services', amount: 32500, date: '2026-10-02' },
  },
  {
    id: 'doc-2',
    business_id: 'demo-biz-id-001',
    type: 'receipt',
    original_filename: 'Dell_UltraSharp_Receipt.jpg',
    storage_path: null,
    confidence: 0.94,
    review_status: 'confirmed',
    created_at: '2026-10-12T16:35:00Z',
    extracted_data: { vendor: 'Dell India', amount: 58900, date: '2026-10-12' },
  },
  {
    id: 'doc-3',
    business_id: 'demo-biz-id-001',
    type: 'business_card',
    original_filename: 'Marcus_Vance_AeroVentures.jpg',
    storage_path: null,
    confidence: 0.98,
    review_status: 'confirmed',
    created_at: '2026-09-14T08:35:00Z',
    extracted_data: { contactName: 'Marcus Vance', company: 'AeroVentures', contactEmail: 'marcus@aeroventure.com' },
  },
]

export const SAMPLE_ACTIVITY: SampleActivity[] = [
  {
    id: 'act-1',
    business_id: 'demo-biz-id-001',
    type: 'invoice_created',
    title: 'Invoice INV-2026-006 generated',
    description: 'Draft invoice for Marcus Vance (AeroVentures) for ₹1,71,100',
    created_at: '2026-10-18T16:20:00Z',
  },
  {
    id: 'act-2',
    business_id: 'demo-biz-id-001',
    type: 'expense_added',
    title: 'Travel expense logged',
    description: 'IndiGo Airlines — ₹24,300 for Bengaluru client meetings',
    created_at: '2026-10-15T09:05:00Z',
  },
  {
    id: 'act-3',
    business_id: 'demo-biz-id-001',
    type: 'task_completed',
    title: 'Task marked complete',
    description: 'Q3 Retainer retrospective & roadmap signoff with Zenith Innovations',
    created_at: '2026-10-15T17:00:00Z',
  },
  {
    id: 'act-4',
    business_id: 'demo-biz-id-001',
    type: 'document_scanned',
    title: 'Hardware receipt captured via Venture Vision',
    description: 'Receipt for Dell UltraSharp 32" Monitor parsed with 94% confidence',
    created_at: '2026-10-12T16:35:00Z',
  },
  {
    id: 'act-5',
    business_id: 'demo-biz-id-001',
    type: 'payment_recorded',
    title: 'Payment received via Wire',
    description: '₹2,18,300 received from Elena Rostova (Pulse Digital)',
    created_at: '2026-09-12T14:20:00Z',
  },
]
