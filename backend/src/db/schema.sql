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
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS mikrotik_profile VARCHAR(100);
ALTER TABLE plans ADD COLUMN IF NOT EXISTS radius_rate_limit VARCHAR(100);
ALTER TABLE routers ADD COLUMN IF NOT EXISTS auth_type VARCHAR(10) NOT NULL DEFAULT 'radius';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_to UUID REFERENCES users(id);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE company_admins ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

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
  file_path     TEXT NOT NULL,
  file_size     BIGINT DEFAULT 0,
  mime_type     VARCHAR(100),
  uploaded_by   UUID REFERENCES company_admins(id) ON DELETE SET NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_company ON documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
