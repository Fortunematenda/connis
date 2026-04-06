-- ============================================================
-- CONNIS ISP Management Platform — Multi-Tenant SaaS Schema
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 0. COMPANIES — SaaS tenants (ISP companies)
-- ============================================================
CREATE TABLE IF NOT EXISTS companies (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                VARCHAR(200) NOT NULL,
  email               VARCHAR(200) UNIQUE NOT NULL,
  phone               VARCHAR(50),
  address             TEXT,
  subscription_status VARCHAR(20) DEFAULT 'active',  -- active, trial, expired, cancelled
  subscription_plan   VARCHAR(50) DEFAULT 'trial',   -- trial, starter, pro, enterprise
  expires_at          TIMESTAMP DEFAULT (NOW() + INTERVAL '14 days'),
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 0b. COMPANY_ADMINS — login accounts for company staff
-- ============================================================
CREATE TABLE IF NOT EXISTS company_admins (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email         VARCHAR(200) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(200),
  phone         VARCHAR(50),
  role          VARCHAR(30) DEFAULT 'admin',  -- owner, admin, support, accounts, technician
  active        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_admins_company ON company_admins(company_id);

-- ============================================================
-- 0c. ROUTERS — MikroTik routers per company
-- ============================================================
CREATE TABLE IF NOT EXISTS routers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name          VARCHAR(100) NOT NULL,
  ip_address    VARCHAR(100) NOT NULL,
  username      VARCHAR(100) NOT NULL DEFAULT 'admin',
  password_enc  TEXT NOT NULL,                  -- encrypted password
  port          INTEGER NOT NULL DEFAULT 8728,
  auth_type     VARCHAR(10) NOT NULL DEFAULT 'radius',  -- 'radius' or 'api'
  is_default    BOOLEAN DEFAULT FALSE,
  active        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routers_company ON routers(company_id);

-- ============================================================
-- MIGRATION: Add columns to existing tables BEFORE indexes
-- (must run before CREATE INDEX on these columns)
-- ============================================================
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bank_details TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS mikrotik_profile VARCHAR(100);
ALTER TABLE plans ADD COLUMN IF NOT EXISTS radius_rate_limit VARCHAR(100);
ALTER TABLE routers ADD COLUMN IF NOT EXISTS auth_type VARCHAR(10) NOT NULL DEFAULT 'radius';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_to UUID REFERENCES users(id);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
ALTER TABLE company_admins ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES company_admins(id) ON DELETE SET NULL;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS billing_type VARCHAR(20) DEFAULT 'postpaid';
ALTER TABLE ticket_comments ADD COLUMN IF NOT EXISTS is_customer BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_url VARCHAR(500);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_delivered BOOLEAN DEFAULT FALSE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS category VARCHAR(30) DEFAULT 'manual';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reference VARCHAR(200);

-- ============================================================
-- 11. TRANSACTIONS — balance credits / debits per customer
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount        NUMERIC(12, 2) NOT NULL,
  type          VARCHAR(10) NOT NULL CHECK (type IN ('credit', 'debit')),
  category      VARCHAR(30) DEFAULT 'manual',  -- manual, voucher, payment, subscription, adjustment, refund
  description   TEXT,
  reference     VARCHAR(200),                  -- external ref (voucher code, payment ref, invoice #)
  created_by    UUID REFERENCES company_admins(id) ON DELETE SET NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_company ON transactions(company_id);

-- ============================================================
-- 12. VOUCHERS — prepaid voucher codes per company
-- ============================================================
CREATE TABLE IF NOT EXISTS vouchers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code          VARCHAR(20) NOT NULL,
  amount        NUMERIC(12, 2) NOT NULL,
  is_used       BOOLEAN DEFAULT FALSE,
  used_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  used_at       TIMESTAMP,
  created_by    UUID REFERENCES company_admins(id) ON DELETE SET NULL,
  created_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, code)
);

CREATE INDEX IF NOT EXISTS idx_vouchers_company ON vouchers(company_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);

-- ============================================================
-- 13. NOTIFICATIONS — admin notifications per company
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type          VARCHAR(50) NOT NULL,
  title         VARCHAR(300) NOT NULL,
  body          TEXT,
  link          VARCHAR(500),
  is_read       BOOLEAN DEFAULT FALSE,
  ref_id        UUID,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_company ON notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(company_id, is_read) WHERE is_read = FALSE;

-- ============================================================
-- 14. MESSAGES — chat messages between admin and customers
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticket_id     UUID REFERENCES tickets(id) ON DELETE SET NULL,
  content       TEXT NOT NULL,
  sender_type   VARCHAR(10) NOT NULL CHECK (sender_type IN ('admin', 'customer')),
  sender_id     UUID,
  is_read       BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_company ON messages(company_id);
CREATE INDEX IF NOT EXISTS idx_messages_ticket ON messages(ticket_id);

-- ============================================================
-- 1. USERS — ISP subscribers / customers (per company)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID REFERENCES companies(id) ON DELETE CASCADE,
  username      VARCHAR(100) NOT NULL,
  password      VARCHAR(255) NOT NULL,
  full_name     VARCHAR(200),
  email         VARCHAR(200),
  phone         VARCHAR(50),
  address       TEXT,
  balance       NUMERIC(12, 2) DEFAULT 0.00,
  active        BOOLEAN DEFAULT TRUE,
  created_by    UUID REFERENCES company_admins(id) ON DELETE SET NULL,
  seq_id        INTEGER,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, username),
  UNIQUE(company_id, seq_id)
);

CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);

-- ============================================================
-- 2. PLANS — internet service packages (per company)
-- ============================================================
CREATE TABLE IF NOT EXISTS plans (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID REFERENCES companies(id) ON DELETE CASCADE,
  name          VARCHAR(100) NOT NULL,
  download_speed VARCHAR(20) NOT NULL,
  upload_speed  VARCHAR(20) NOT NULL,
  price         NUMERIC(12, 2) NOT NULL,
  mikrotik_profile VARCHAR(100),
  radius_rate_limit VARCHAR(100),
  description   TEXT,
  active        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, name)
);

CREATE INDEX IF NOT EXISTS idx_plans_company ON plans(company_id);

-- ============================================================
-- 3. USER_PLANS — links users to their subscribed plan
-- ============================================================
CREATE TABLE IF NOT EXISTS user_plans (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id       UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  start_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date      DATE,
  active        BOOLEAN DEFAULT TRUE,
  changed_by    UUID REFERENCES company_admins(id) ON DELETE SET NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_plans_user ON user_plans(user_id);

-- ============================================================
-- 4. SESSIONS — PPPoE session tracking (per company)
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nas_ip          VARCHAR(45),
  framed_ip       VARCHAR(45),
  session_id      VARCHAR(100),
  start_time      TIMESTAMP DEFAULT NOW(),
  stop_time       TIMESTAMP,
  upload_bytes    BIGINT DEFAULT 0,
  download_bytes  BIGINT DEFAULT 0,
  terminate_cause VARCHAR(100),
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(stop_time) WHERE stop_time IS NULL;

-- ============================================================
-- 5. LEADS — sales pipeline (per company)
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID REFERENCES companies(id) ON DELETE CASCADE,
  full_name     VARCHAR(200) NOT NULL,
  phone         VARCHAR(50),
  email         VARCHAR(200),
  address       TEXT,
  status        VARCHAR(30) DEFAULT 'new',
  notes         TEXT,
  converted_to  UUID REFERENCES users(id),
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_company ON leads(company_id);

-- ============================================================
-- 6. LEAD_COMMENTS — admin comments per lead
-- ============================================================
CREATE TABLE IF NOT EXISTS lead_comments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id       UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  author        VARCHAR(200) DEFAULT 'Admin',
  content       TEXT NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_comments_lead ON lead_comments(lead_id);

-- ============================================================
-- 7. PAYMENTS — billing transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount        NUMERIC(12, 2) NOT NULL,
  method        VARCHAR(50) DEFAULT 'manual',
  reference     VARCHAR(200),
  notes         TEXT,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);

-- ============================================================
-- 8. TICKETS — support tickets per customer
-- ============================================================
CREATE TABLE IF NOT EXISTS tickets (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  subject       VARCHAR(300) NOT NULL,
  description   TEXT,
  status        VARCHAR(30) DEFAULT 'open',       -- open, in_progress, waiting, resolved, closed
  priority      VARCHAR(20) DEFAULT 'medium',     -- low, medium, high, critical
  assigned_to   UUID REFERENCES company_admins(id) ON DELETE SET NULL,
  created_by    UUID REFERENCES company_admins(id) ON DELETE SET NULL,
  closed_at     TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_company ON tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

-- ============================================================
-- 8b. TICKET_COMMENTS — messages on a ticket
-- ============================================================
CREATE TABLE IF NOT EXISTS ticket_comments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id     UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author_id     UUID REFERENCES company_admins(id) ON DELETE SET NULL,
  author_name   VARCHAR(200),
  content       TEXT NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket ON ticket_comments(ticket_id);

-- ============================================================
-- 9. TASKS — internal tasks / to-dos per company
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  ticket_id     UUID REFERENCES tickets(id) ON DELETE SET NULL,
  title         VARCHAR(300) NOT NULL,
  description   TEXT,
  status        VARCHAR(30) DEFAULT 'todo',       -- todo, in_progress, done
  priority      VARCHAR(20) DEFAULT 'medium',     -- low, medium, high
  assigned_to   UUID REFERENCES company_admins(id) ON DELETE SET NULL,
  due_date      DATE,
  created_by    UUID REFERENCES company_admins(id) ON DELETE SET NULL,
  completed_at  TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_company ON tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- ============================================================
-- 10. DOCUMENTS — file attachments per customer
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  ticket_id     UUID REFERENCES tickets(id) ON DELETE SET NULL,
  name          VARCHAR(300) NOT NULL,
  description   TEXT,
  file_path     TEXT NOT NULL,
  file_size     BIGINT DEFAULT 0,
  mime_type     VARCHAR(100),
  uploaded_by   UUID REFERENCES company_admins(id) ON DELETE SET NULL,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

ALTER TABLE documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_documents_company ON documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);

-- ============================================================
-- 15. INVOICES — customer invoices (auto + manual)
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invoice_number  VARCHAR(50) NOT NULL,
  status          VARCHAR(20) DEFAULT 'paid',        -- draft, issued, paid, cancelled, overdue
  type            VARCHAR(30) DEFAULT 'subscription', -- subscription, once_off, credit_note, proforma
  subtotal        NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax             NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total           NUMERIC(12, 2) NOT NULL DEFAULT 0,
  amount_paid     NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency        VARCHAR(10) DEFAULT 'ZAR',
  notes           TEXT,
  due_date        DATE,
  paid_at         TIMESTAMP,
  period_start    DATE,                              -- billing period start
  period_end      DATE,                              -- billing period end
  transaction_id  UUID REFERENCES transactions(id) ON DELETE SET NULL,
  created_by      UUID REFERENCES company_admins(id) ON DELETE SET NULL,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_invoices_company ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- ============================================================
-- 15b. INVOICE_ITEMS — line items on an invoice
-- ============================================================
CREATE TABLE IF NOT EXISTS invoice_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description     TEXT NOT NULL,
  quantity         NUMERIC(10, 2) NOT NULL DEFAULT 1,
  unit_price      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total           NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

-- ============================================================
-- 16. BILLABLE_ITEMS — reusable service/product items for invoices & quotes
-- ============================================================
CREATE TABLE IF NOT EXISTS billable_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            VARCHAR(200) NOT NULL,
  description     TEXT,
  price           NUMERIC(12, 2) NOT NULL DEFAULT 0,
  type            VARCHAR(30) DEFAULT 'service',      -- service, product, once_off, recurring
  taxable         BOOLEAN DEFAULT FALSE,
  active          BOOLEAN DEFAULT TRUE,
  plan_id         UUID REFERENCES plans(id) ON DELETE SET NULL,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billable_items_company ON billable_items(company_id);

-- ============================================================
-- 17. QUOTES — proforma quotes for customers
-- ============================================================
CREATE TABLE IF NOT EXISTS quotes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  quote_number    VARCHAR(50) NOT NULL,
  status          VARCHAR(20) DEFAULT 'draft',        -- draft, sent, accepted, rejected, expired, converted
  subtotal        NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax             NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total           NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency        VARCHAR(10) DEFAULT 'ZAR',
  notes           TEXT,
  valid_until     DATE,
  customer_name   VARCHAR(200),                       -- for quotes to non-customers (leads)
  customer_email  VARCHAR(200),
  customer_phone  VARCHAR(50),
  customer_address TEXT,
  converted_to    UUID REFERENCES invoices(id) ON DELETE SET NULL,
  lead_id         UUID REFERENCES leads(id) ON DELETE SET NULL,
  created_by      UUID REFERENCES company_admins(id) ON DELETE SET NULL,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, quote_number)
);

CREATE INDEX IF NOT EXISTS idx_quotes_company ON quotes(company_id);
CREATE INDEX IF NOT EXISTS idx_quotes_user ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);

-- ============================================================
-- 16b. QUOTE_ITEMS — line items on a quote
-- ============================================================
CREATE TABLE IF NOT EXISTS quote_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id        UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  item_id         UUID REFERENCES billable_items(id) ON DELETE SET NULL,
  description     TEXT NOT NULL,
  quantity        NUMERIC(10, 2) NOT NULL DEFAULT 1,
  unit_price      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total           NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_items_quote ON quote_items(quote_id);

-- ============================================================
-- 17. CREDIT_NOTES — credit notes / refunds
-- ============================================================
CREATE TABLE IF NOT EXISTS credit_notes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credit_number   VARCHAR(50) NOT NULL,
  status          VARCHAR(20) DEFAULT 'issued',       -- draft, issued, applied, cancelled
  subtotal        NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax             NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total           NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency        VARCHAR(10) DEFAULT 'ZAR',
  notes           TEXT,
  invoice_id      UUID REFERENCES invoices(id) ON DELETE SET NULL,
  transaction_id  UUID REFERENCES transactions(id) ON DELETE SET NULL,
  created_by      UUID REFERENCES company_admins(id) ON DELETE SET NULL,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, credit_number)
);

CREATE INDEX IF NOT EXISTS idx_credit_notes_company ON credit_notes(company_id);
CREATE INDEX IF NOT EXISTS idx_credit_notes_user ON credit_notes(user_id);

-- ============================================================
-- 17b. CREDIT_NOTE_ITEMS — line items on a credit note
-- ============================================================
CREATE TABLE IF NOT EXISTS credit_note_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credit_note_id  UUID NOT NULL REFERENCES credit_notes(id) ON DELETE CASCADE,
  description     TEXT NOT NULL,
  quantity        NUMERIC(10, 2) NOT NULL DEFAULT 1,
  unit_price      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total           NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_note_items_cn ON credit_note_items(credit_note_id);
