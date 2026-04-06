# FreeRADIUS Setup Guide for CONNIS

This guide sets up FreeRADIUS on your VPS with PostgreSQL backend.
CONNIS provisions users into the `radius` database — FreeRADIUS reads from it.

---

## 1. Install FreeRADIUS

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y freeradius freeradius-postgresql freeradius-utils
```

---

## 2. Configure PostgreSQL Module

Edit the SQL module config:

```bash
sudo nano /etc/freeradius/3.0/mods-available/sql
```

Replace/update with:

```
sql {
    driver = "rlm_sql_postgresql"
    dialect = "postgresql"

    server = "localhost"
    port = 5432
    login = "postgres"
    password = "YOUR_DB_PASSWORD"
    radius_db = "radius"

    # Table names (standard)
    authcheck_table = "radcheck"
    authreply_table = "radreply"
    groupcheck_table = "radgroupcheck"
    groupreply_table = "radgroupreply"
    usergroup_table = "radusergroup"
    acct_table1 = "radacct"
    acct_table2 = "radacct"
    postauth_table = "radpostauth"

    read_clients = yes
    client_table = "nas"

    # Connection pool
    pool {
        start = 5
        min = 4
        max = 10
        spare = 3
        uses = 0
        lifetime = 0
        idle_timeout = 60
    }
}
```

---

## 3. Enable the SQL Module

```bash
cd /etc/freeradius/3.0/mods-enabled/
sudo ln -sf ../mods-available/sql sql
```

---

## 4. Configure Sites to Use SQL

### Default site (authentication):

```bash
sudo nano /etc/freeradius/3.0/sites-available/default
```

In the `authorize` section, **uncomment** or add:
```
authorize {
    preprocess
    sql          # <-- uncomment this line
    pap
}
```

In the `authenticate` section, ensure:
```
authenticate {
    Auth-Type PAP {
        pap
    }
}
```

In the `accounting` section, uncomment:
```
accounting {
    sql          # <-- uncomment this line
}
```

In the `post-auth` section, uncomment:
```
post-auth {
    sql          # <-- uncomment this line
}
```

### Inner-tunnel (optional, for EAP):

```bash
sudo nano /etc/freeradius/3.0/sites-available/inner-tunnel
```

Same changes — uncomment `sql` in authorize, accounting, post-auth.

---

## 5. Configure MikroTik as RADIUS Client

### Option A: Via NAS table (CONNIS manages it)

CONNIS can register your router in the `nas` table automatically.
FreeRADIUS reads clients from the database when `read_clients = yes` is set.

### Option B: Via clients.conf (manual)

```bash
sudo nano /etc/freeradius/3.0/clients.conf
```

Add your MikroTik router:

```
client mikrotik-core {
    ipaddr = 102.222.12.129
    secret = YOUR_RADIUS_SECRET
    shortname = Core_Router
    nastype = mikrotik
}
```

---

## 6. Configure MikroTik to Use RADIUS

On your MikroTik router (via Winbox or terminal):

```
# Add RADIUS server
/radius add service=ppp address=YOUR_VPS_IP secret=YOUR_RADIUS_SECRET

# Enable RADIUS for PPP
/ppp aaa set use-radius=yes accounting=yes
```

Replace:
- `YOUR_VPS_IP` = IP address of your VPS running FreeRADIUS
- `YOUR_RADIUS_SECRET` = shared secret (same as in clients.conf or nas table)

---

## 7. Open Firewall Ports

```bash
# Allow RADIUS auth (1812) and accounting (1813) from your MikroTik
sudo ufw allow from 102.222.12.129 to any port 1812 proto udp
sudo ufw allow from 102.222.12.129 to any port 1813 proto udp
```

---

## 8. Test FreeRADIUS

### Start in debug mode:

```bash
sudo systemctl stop freeradius
sudo freeradius -X
```

### Test authentication (from the VPS):

```bash
radtest testuser testpass 127.0.0.1 0 testing123
```

You should see `Access-Accept` if the user exists in radcheck.

### Test with a CONNIS user:

1. Create a customer in CONNIS (convert a lead)
2. Check the RADIUS DB:
   ```bash
   psql -U postgres -d radius -c "SELECT * FROM radcheck;"
   ```
3. Test auth:
   ```bash
   radtest username password 127.0.0.1 0 testing123
   ```

---

## 9. Start FreeRADIUS as Service

```bash
sudo systemctl enable freeradius
sudo systemctl start freeradius
sudo systemctl status freeradius
```

---

## 10. How It All Works Together

```
Customer CPE → PPPoE → MikroTik Router
                            ↓
                     RADIUS Request (port 1812)
                            ↓
                     FreeRADIUS (VPS)
                            ↓
                     PostgreSQL (radius DB)
                            ↓
                     radcheck: Cleartext-Password ✓
                     radreply: Mikrotik-Rate-Limit → 5M/10M
                            ↓
                     Access-Accept + Rate Limit
                            ↓
                     MikroTik applies rate limit
                            ↓
                     Customer is online! ✅
```

### CONNIS Flow:
```
Lead → Convert → CONNIS creates user in:
  1. connis DB (users table)
  2. radius DB (radcheck + radreply + radusergroup)
  → Customer connects via PPPoE → FreeRADIUS authenticates → Online
```

---

## Troubleshooting

| Issue | Fix |
|---|---|
| `Access-Reject` | Check radcheck: `SELECT * FROM radcheck WHERE username='xxx'` |
| No RADIUS response | Check firewall, FreeRADIUS running, MikroTik RADIUS config |
| Rate limit not applied | Check radreply: `SELECT * FROM radreply WHERE username='xxx'` |
| Auth-Type Reject | User is disabled in CONNIS (radcheck has Auth-Type := Reject) |
