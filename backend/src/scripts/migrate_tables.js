const pool = require('../config/db');

const sql = `
CREATE TABLE IF NOT EXISTS tickets (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  subject       VARCHAR(300) NOT NULL,
  description   TEXT,
  status        VARCHAR(30) DEFAULT 'open',
  priority      VARCHAR(20) DEFAULT 'medium',
  assigned_to   UUID REFERENCES company_admins(id) ON DELETE SET NULL,
  created_by    UUID REFERENCES company_admins(id) ON DELETE SET NULL,
  closed_at     TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tickets_company ON tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

CREATE TABLE IF NOT EXISTS ticket_comments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id     UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author_id     UUID REFERENCES company_admins(id) ON DELETE SET NULL,
  author_name   VARCHAR(200),
  content       TEXT NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket ON ticket_comments(ticket_id);

CREATE TABLE IF NOT EXISTS tasks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  ticket_id     UUID REFERENCES tickets(id) ON DELETE SET NULL,
  title         VARCHAR(300) NOT NULL,
  description   TEXT,
  status        VARCHAR(30) DEFAULT 'todo',
  priority      VARCHAR(20) DEFAULT 'medium',
  assigned_to   UUID REFERENCES company_admins(id) ON DELETE SET NULL,
  due_date      DATE,
  created_by    UUID REFERENCES company_admins(id) ON DELETE SET NULL,
  completed_at  TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tasks_company ON tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

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
`;

pool.query(sql)
  .then(() => { console.log('All tables created successfully'); pool.end(); })
  .catch(e => { console.error('Migration failed:', e.message); pool.end(); });
