-- ============================================================
-- FreeRADIUS PostgreSQL Schema
-- Standard tables for FreeRADIUS SQL module
-- ============================================================

-- radcheck: Per-user check attributes (username + password)
CREATE TABLE IF NOT EXISTS radcheck (
  id          SERIAL PRIMARY KEY,
  username    VARCHAR(64) NOT NULL DEFAULT '',
  attribute   VARCHAR(64) NOT NULL DEFAULT '',
  op          VARCHAR(2) NOT NULL DEFAULT ':=',
  value       VARCHAR(253) NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS radcheck_username ON radcheck(username);

-- radreply: Per-user reply attributes (rate limits, IP, etc.)
CREATE TABLE IF NOT EXISTS radreply (
  id          SERIAL PRIMARY KEY,
  username    VARCHAR(64) NOT NULL DEFAULT '',
  attribute   VARCHAR(64) NOT NULL DEFAULT '',
  op          VARCHAR(2) NOT NULL DEFAULT ':=',
  value       VARCHAR(253) NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS radreply_username ON radreply(username);

-- radusergroup: User-to-group mapping (links users to plans)
CREATE TABLE IF NOT EXISTS radusergroup (
  id          SERIAL PRIMARY KEY,
  username    VARCHAR(64) NOT NULL DEFAULT '',
  groupname   VARCHAR(64) NOT NULL DEFAULT '',
  priority    INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS radusergroup_username ON radusergroup(username);

-- radgroupcheck: Per-group check attributes
CREATE TABLE IF NOT EXISTS radgroupcheck (
  id          SERIAL PRIMARY KEY,
  groupname   VARCHAR(64) NOT NULL DEFAULT '',
  attribute   VARCHAR(64) NOT NULL DEFAULT '',
  op          VARCHAR(2) NOT NULL DEFAULT ':=',
  value       VARCHAR(253) NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS radgroupcheck_groupname ON radgroupcheck(groupname);

-- radgroupreply: Per-group reply attributes (plan rate limits)
CREATE TABLE IF NOT EXISTS radgroupreply (
  id          SERIAL PRIMARY KEY,
  groupname   VARCHAR(64) NOT NULL DEFAULT '',
  attribute   VARCHAR(64) NOT NULL DEFAULT '',
  op          VARCHAR(2) NOT NULL DEFAULT ':=',
  value       VARCHAR(253) NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS radgroupreply_groupname ON radgroupreply(groupname);

-- radacct: Accounting data (session tracking)
CREATE TABLE IF NOT EXISTS radacct (
  radacctid             BIGSERIAL PRIMARY KEY,
  acctsessionid         VARCHAR(64) NOT NULL DEFAULT '',
  acctuniqueid          VARCHAR(32) NOT NULL DEFAULT '',
  username              VARCHAR(64) NOT NULL DEFAULT '',
  realm                 VARCHAR(64) DEFAULT '',
  nasipaddress          VARCHAR(15) NOT NULL DEFAULT '',
  nasportid             VARCHAR(32) DEFAULT NULL,
  nasporttype           VARCHAR(32) DEFAULT NULL,
  acctstarttime         TIMESTAMP DEFAULT NULL,
  acctupdatetime        TIMESTAMP DEFAULT NULL,
  acctstoptime          TIMESTAMP DEFAULT NULL,
  acctinterval          INTEGER DEFAULT NULL,
  acctsessiontime       INTEGER DEFAULT NULL,
  acctauthentic         VARCHAR(32) DEFAULT NULL,
  connectinfo_start     VARCHAR(128) DEFAULT NULL,
  connectinfo_stop      VARCHAR(128) DEFAULT NULL,
  acctinputoctets       BIGINT DEFAULT NULL,
  acctoutputoctets      BIGINT DEFAULT NULL,
  calledstationid       VARCHAR(50) NOT NULL DEFAULT '',
  callingstationid      VARCHAR(50) NOT NULL DEFAULT '',
  acctterminatecause    VARCHAR(32) NOT NULL DEFAULT '',
  servicetype           VARCHAR(32) DEFAULT NULL,
  framedprotocol         VARCHAR(32) DEFAULT NULL,
  framedipaddress       VARCHAR(15) NOT NULL DEFAULT '',
  framedipv6address     VARCHAR(45) NOT NULL DEFAULT '',
  framedipv6prefix      VARCHAR(45) NOT NULL DEFAULT '',
  framedinterfaceid     VARCHAR(44) NOT NULL DEFAULT '',
  delegatedipv6prefix   VARCHAR(45) NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS radacct_active_sessions ON radacct(acctstoptime, nasipaddress, acctstarttime);
CREATE INDEX IF NOT EXISTS radacct_username ON radacct(username);
CREATE INDEX IF NOT EXISTS radacct_acctuniqueid ON radacct(acctuniqueid);
CREATE INDEX IF NOT EXISTS radacct_acctsessionid ON radacct(acctsessionid);
CREATE INDEX IF NOT EXISTS radacct_start_time ON radacct(acctstarttime);

-- radpostauth: Post-authentication logging
CREATE TABLE IF NOT EXISTS radpostauth (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(64) NOT NULL DEFAULT '',
  pass          VARCHAR(64) NOT NULL DEFAULT '',
  reply         VARCHAR(32) NOT NULL DEFAULT '',
  authdate      TIMESTAMP NOT NULL DEFAULT NOW(),
  class         VARCHAR(64) DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS radpostauth_username ON radpostauth(username);

-- nas: Network Access Server (router) table
CREATE TABLE IF NOT EXISTS nas (
  id            SERIAL PRIMARY KEY,
  nasname       VARCHAR(128) NOT NULL,
  shortname     VARCHAR(32),
  type          VARCHAR(30) DEFAULT 'other',
  ports         INTEGER,
  secret        VARCHAR(60) NOT NULL DEFAULT 'secret',
  server        VARCHAR(64),
  community     VARCHAR(50),
  description   VARCHAR(200) DEFAULT 'RADIUS Client'
);
CREATE INDEX IF NOT EXISTS nas_nasname ON nas(nasname);
