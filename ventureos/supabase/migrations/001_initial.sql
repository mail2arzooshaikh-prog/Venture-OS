-- ============================================================
-- VentureOS · Initial Database Migration
-- ============================================================

-- ─────────────────────────────────────────
-- 1. Extensions
-- ─────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
-- 2. Enum Types
-- ─────────────────────────────────────────
CREATE TYPE business_category AS ENUM (
  'freelancer','retail','agency','service','creator','startup','local','other'
);

CREATE TYPE business_stage AS ENUM (
  'idea','early','growing','established','scaling'
);

CREATE TYPE invoice_status AS ENUM (
  'draft','sent','viewed','paid','overdue','cancelled'
);

CREATE TYPE payment_method AS ENUM (
  'cash','bank_transfer','upi','card','cheque','other'
);

CREATE TYPE expense_category AS ENUM (
  'office','travel','software','marketing','utilities','salaries','equipment','food','other'
);

CREATE TYPE task_status AS ENUM (
  'todo','in_progress','done','cancelled'
);

CREATE TYPE task_priority AS ENUM (
  'low','medium','high','urgent'
);

CREATE TYPE order_status AS ENUM (
  'pending','confirmed','processing','shipped','delivered','cancelled'
);

CREATE TYPE document_type AS ENUM (
  'invoice','receipt','business_card','order','contract','other'
);

CREATE TYPE activity_type AS ENUM (
  'client_created','invoice_created','payment_recorded','expense_added',
  'document_scanned','task_completed','order_created','ai_query','login'
);

-- ─────────────────────────────────────────
-- 3. Table: businesses
-- ─────────────────────────────────────────
CREATE TABLE businesses (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name                 TEXT NOT NULL DEFAULT '',
  category             business_category DEFAULT 'other',
  stage                business_stage DEFAULT 'early',
  currency             TEXT DEFAULT 'INR',
  primary_goal         TEXT DEFAULT '',
  logo_url             TEXT,
  description          TEXT,
  website              TEXT,
  phone                TEXT,
  address              TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 4. Table: clients
-- ─────────────────────────────────────────
CREATE TABLE clients (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id  UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name         TEXT NOT NULL,
  email        TEXT,
  phone        TEXT,
  company      TEXT,
  address      TEXT,
  notes        TEXT,
  tags         TEXT[] DEFAULT '{}',
  avatar_url   TEXT,
  total_billed NUMERIC(12,2) DEFAULT 0,
  total_paid   NUMERIC(12,2) DEFAULT 0,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 5. Table: invoices
-- ─────────────────────────────────────────
CREATE TABLE invoices (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id    UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  client_id      UUID REFERENCES clients(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  status         invoice_status DEFAULT 'draft',
  issue_date     DATE DEFAULT CURRENT_DATE,
  due_date       DATE,
  subtotal       NUMERIC(12,2) DEFAULT 0,
  tax_rate       NUMERIC(5,2) DEFAULT 0,
  tax_amount     NUMERIC(12,2) DEFAULT 0,
  discount       NUMERIC(12,2) DEFAULT 0,
  total          NUMERIC(12,2) DEFAULT 0,
  currency       TEXT DEFAULT 'INR',
  notes          TEXT,
  terms          TEXT,
  paid_amount    NUMERIC(12,2) DEFAULT 0,
  paid_date      DATE,
  document_id    UUID,          -- FK to documents added after documents table exists
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, invoice_number)
);

-- ─────────────────────────────────────────
-- 6. Table: invoice_items
-- ─────────────────────────────────────────
CREATE TABLE invoice_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id  UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  quantity    NUMERIC(10,2) DEFAULT 1,
  unit_price  NUMERIC(12,2) DEFAULT 0,
  amount      NUMERIC(12,2) DEFAULT 0,
  sort_order  INTEGER DEFAULT 0
);

-- ─────────────────────────────────────────
-- 7. Table: payments
-- ─────────────────────────────────────────
CREATE TABLE payments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id  UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  invoice_id   UUID REFERENCES invoices(id) ON DELETE SET NULL,
  client_id    UUID REFERENCES clients(id) ON DELETE SET NULL,
  amount       NUMERIC(12,2) NOT NULL,
  currency     TEXT DEFAULT 'INR',
  method       payment_method DEFAULT 'other',
  reference    TEXT,
  notes        TEXT,
  payment_date DATE DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 8. Table: expenses
-- ─────────────────────────────────────────
CREATE TABLE expenses (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id  UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  category     expense_category DEFAULT 'other',
  description  TEXT NOT NULL,
  amount       NUMERIC(12,2) NOT NULL,
  currency     TEXT DEFAULT 'INR',
  vendor       TEXT,
  receipt_url  TEXT,
  document_id  UUID,           -- FK to documents added after documents table exists
  expense_date DATE DEFAULT CURRENT_DATE,
  is_billable  BOOLEAN DEFAULT FALSE,
  client_id    UUID REFERENCES clients(id) ON DELETE SET NULL,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 9. Table: orders
-- ─────────────────────────────────────────
CREATE TABLE orders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id      UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  client_id        UUID REFERENCES clients(id) ON DELETE SET NULL,
  order_number     TEXT NOT NULL,
  status           order_status DEFAULT 'pending',
  total            NUMERIC(12,2) DEFAULT 0,
  currency         TEXT DEFAULT 'INR',
  notes            TEXT,
  delivery_address TEXT,
  expected_date    DATE,
  document_id      UUID,       -- FK to documents added after documents table exists
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, order_number)
);

-- ─────────────────────────────────────────
-- 10. Table: order_items
-- ─────────────────────────────────────────
CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  quantity    NUMERIC(10,2) DEFAULT 1,
  unit_price  NUMERIC(12,2) DEFAULT 0,
  amount      NUMERIC(12,2) DEFAULT 0,
  sort_order  INTEGER DEFAULT 0
);

-- ─────────────────────────────────────────
-- 11. Table: tasks
-- ─────────────────────────────────────────
CREATE TABLE tasks (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id  UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  client_id    UUID REFERENCES clients(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  status       task_status DEFAULT 'todo',
  priority     task_priority DEFAULT 'medium',
  due_date     DATE,
  completed_at TIMESTAMPTZ,
  tags         TEXT[] DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 12. Table: documents
-- ─────────────────────────────────────────
CREATE TABLE documents (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id       UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  type              document_type DEFAULT 'other',
  original_filename TEXT,
  storage_path      TEXT,
  file_size         INTEGER,
  mime_type         TEXT,
  extracted_data    JSONB DEFAULT '{}',
  confidence        NUMERIC(3,2),
  review_status     TEXT DEFAULT 'pending',
  processed_at      TIMESTAMPTZ,
  linked_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  linked_expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  linked_order_id   UUID REFERENCES orders(id) ON DELETE SET NULL,
  linked_client_id  UUID REFERENCES clients(id) ON DELETE SET NULL,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- Deferred FK: document_id columns now that documents exists
-- ─────────────────────────────────────────
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_document
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL;

ALTER TABLE expenses ADD CONSTRAINT fk_expenses_document
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL;

ALTER TABLE orders ADD CONSTRAINT fk_orders_document
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────
-- 13. Table: activity_log
-- ─────────────────────────────────────────
CREATE TABLE activity_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  type        activity_type NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  metadata    JSONB DEFAULT '{}',
  entity_type TEXT,
  entity_id   UUID,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 14. Indexes
-- ─────────────────────────────────────────

-- clients
CREATE INDEX idx_clients_business_id ON clients(business_id);
CREATE INDEX idx_clients_email       ON clients(email);

-- invoices
CREATE INDEX idx_invoices_business_id ON invoices(business_id);
CREATE INDEX idx_invoices_client_id   ON invoices(client_id);
CREATE INDEX idx_invoices_status      ON invoices(status);
CREATE INDEX idx_invoices_due_date    ON invoices(due_date);

-- payments
CREATE INDEX idx_payments_business_id  ON payments(business_id);
CREATE INDEX idx_payments_invoice_id   ON payments(invoice_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);

-- expenses
CREATE INDEX idx_expenses_business_id  ON expenses(business_id);
CREATE INDEX idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category     ON expenses(category);

-- tasks
CREATE INDEX idx_tasks_business_id ON tasks(business_id);
CREATE INDEX idx_tasks_status      ON tasks(status);
CREATE INDEX idx_tasks_due_date    ON tasks(due_date);

-- orders
CREATE INDEX idx_orders_business_id ON orders(business_id);
CREATE INDEX idx_orders_status      ON orders(status);

-- documents
CREATE INDEX idx_documents_business_id ON documents(business_id);
CREATE INDEX idx_documents_type        ON documents(type);

-- activity_log
CREATE INDEX idx_activity_log_business_id  ON activity_log(business_id);
CREATE INDEX idx_activity_log_created_at   ON activity_log(created_at DESC);

-- ─────────────────────────────────────────
-- 15. Enable Row Level Security
-- ─────────────────────────────────────────
ALTER TABLE businesses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients      ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices     ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents    ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────
-- 16. RLS Helper Function
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_user_business_id()
RETURNS UUID AS $$
  SELECT id FROM businesses WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ─────────────────────────────────────────
-- RLS Policies: businesses
-- ─────────────────────────────────────────
CREATE POLICY "businesses_select" ON businesses
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "businesses_insert" ON businesses
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "businesses_update" ON businesses
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "businesses_delete" ON businesses
  FOR DELETE USING (user_id = auth.uid());

-- ─────────────────────────────────────────
-- RLS Policies: clients
-- ─────────────────────────────────────────
CREATE POLICY "clients_select" ON clients
  FOR SELECT USING (business_id = get_user_business_id());

CREATE POLICY "clients_insert" ON clients
  FOR INSERT WITH CHECK (business_id = get_user_business_id());

CREATE POLICY "clients_update" ON clients
  FOR UPDATE USING (business_id = get_user_business_id());

CREATE POLICY "clients_delete" ON clients
  FOR DELETE USING (business_id = get_user_business_id());

-- ─────────────────────────────────────────
-- RLS Policies: invoices
-- ─────────────────────────────────────────
CREATE POLICY "invoices_select" ON invoices
  FOR SELECT USING (business_id = get_user_business_id());

CREATE POLICY "invoices_insert" ON invoices
  FOR INSERT WITH CHECK (business_id = get_user_business_id());

CREATE POLICY "invoices_update" ON invoices
  FOR UPDATE USING (business_id = get_user_business_id());

CREATE POLICY "invoices_delete" ON invoices
  FOR DELETE USING (business_id = get_user_business_id());

-- ─────────────────────────────────────────
-- RLS Policies: invoice_items
-- (joined through invoices → business_id)
-- ─────────────────────────────────────────
CREATE POLICY "invoice_items_select" ON invoice_items
  FOR SELECT USING (
    invoice_id IN (SELECT id FROM invoices WHERE business_id = get_user_business_id())
  );

CREATE POLICY "invoice_items_insert" ON invoice_items
  FOR INSERT WITH CHECK (
    invoice_id IN (SELECT id FROM invoices WHERE business_id = get_user_business_id())
  );

CREATE POLICY "invoice_items_update" ON invoice_items
  FOR UPDATE USING (
    invoice_id IN (SELECT id FROM invoices WHERE business_id = get_user_business_id())
  );

CREATE POLICY "invoice_items_delete" ON invoice_items
  FOR DELETE USING (
    invoice_id IN (SELECT id FROM invoices WHERE business_id = get_user_business_id())
  );

-- ─────────────────────────────────────────
-- RLS Policies: payments
-- ─────────────────────────────────────────
CREATE POLICY "payments_select" ON payments
  FOR SELECT USING (business_id = get_user_business_id());

CREATE POLICY "payments_insert" ON payments
  FOR INSERT WITH CHECK (business_id = get_user_business_id());

CREATE POLICY "payments_update" ON payments
  FOR UPDATE USING (business_id = get_user_business_id());

CREATE POLICY "payments_delete" ON payments
  FOR DELETE USING (business_id = get_user_business_id());

-- ─────────────────────────────────────────
-- RLS Policies: expenses
-- ─────────────────────────────────────────
CREATE POLICY "expenses_select" ON expenses
  FOR SELECT USING (business_id = get_user_business_id());

CREATE POLICY "expenses_insert" ON expenses
  FOR INSERT WITH CHECK (business_id = get_user_business_id());

CREATE POLICY "expenses_update" ON expenses
  FOR UPDATE USING (business_id = get_user_business_id());

CREATE POLICY "expenses_delete" ON expenses
  FOR DELETE USING (business_id = get_user_business_id());

-- ─────────────────────────────────────────
-- RLS Policies: orders
-- ─────────────────────────────────────────
CREATE POLICY "orders_select" ON orders
  FOR SELECT USING (business_id = get_user_business_id());

CREATE POLICY "orders_insert" ON orders
  FOR INSERT WITH CHECK (business_id = get_user_business_id());

CREATE POLICY "orders_update" ON orders
  FOR UPDATE USING (business_id = get_user_business_id());

CREATE POLICY "orders_delete" ON orders
  FOR DELETE USING (business_id = get_user_business_id());

-- ─────────────────────────────────────────
-- RLS Policies: order_items
-- (joined through orders → business_id)
-- ─────────────────────────────────────────
CREATE POLICY "order_items_select" ON order_items
  FOR SELECT USING (
    order_id IN (SELECT id FROM orders WHERE business_id = get_user_business_id())
  );

CREATE POLICY "order_items_insert" ON order_items
  FOR INSERT WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE business_id = get_user_business_id())
  );

CREATE POLICY "order_items_update" ON order_items
  FOR UPDATE USING (
    order_id IN (SELECT id FROM orders WHERE business_id = get_user_business_id())
  );

CREATE POLICY "order_items_delete" ON order_items
  FOR DELETE USING (
    order_id IN (SELECT id FROM orders WHERE business_id = get_user_business_id())
  );

-- ─────────────────────────────────────────
-- RLS Policies: tasks
-- ─────────────────────────────────────────
CREATE POLICY "tasks_select" ON tasks
  FOR SELECT USING (business_id = get_user_business_id());

CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT WITH CHECK (business_id = get_user_business_id());

CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE USING (business_id = get_user_business_id());

CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE USING (business_id = get_user_business_id());

-- ─────────────────────────────────────────
-- RLS Policies: documents
-- ─────────────────────────────────────────
CREATE POLICY "documents_select" ON documents
  FOR SELECT USING (business_id = get_user_business_id());

CREATE POLICY "documents_insert" ON documents
  FOR INSERT WITH CHECK (business_id = get_user_business_id());

CREATE POLICY "documents_update" ON documents
  FOR UPDATE USING (business_id = get_user_business_id());

CREATE POLICY "documents_delete" ON documents
  FOR DELETE USING (business_id = get_user_business_id());

-- ─────────────────────────────────────────
-- RLS Policies: activity_log
-- ─────────────────────────────────────────
CREATE POLICY "activity_log_select" ON activity_log
  FOR SELECT USING (business_id = get_user_business_id());

CREATE POLICY "activity_log_insert" ON activity_log
  FOR INSERT WITH CHECK (business_id = get_user_business_id());

CREATE POLICY "activity_log_update" ON activity_log
  FOR UPDATE USING (business_id = get_user_business_id());

CREATE POLICY "activity_log_delete" ON activity_log
  FOR DELETE USING (business_id = get_user_business_id());

-- ─────────────────────────────────────────
-- 17. Auto-update updated_at trigger
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────
-- 18. Auto-create business row on user signup
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO businesses (user_id, name, onboarding_completed)
  VALUES (NEW.id, '', FALSE)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
