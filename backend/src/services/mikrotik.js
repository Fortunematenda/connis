const net = require('net');
require('dotenv').config();

// ══════════════════════════════════════════════════════════════
// MikroTik RouterOS API Service — Custom TCP Client
// Raw socket implementation — fully handles RouterOS v7 !empty
// Zero dependency on node-routeros / routeros-client
// ══════════════════════════════════════════════════════════════

const DEFAULT_CFG = {
  host: process.env.MIKROTIK_HOST || '192.168.88.1',
  user: process.env.MIKROTIK_USER || 'admin',
  password: process.env.MIKROTIK_PASSWORD || '',
  port: parseInt(process.env.MIKROTIK_PORT, 10) || 8728,
  timeout: 30000, // ms
};

console.log(`[MIKROTIK] Default config: ${DEFAULT_CFG.host}:${DEFAULT_CFG.port} (user: ${DEFAULT_CFG.user})`);

// ── RouterOS API Protocol Encoding ─────────────────────────

function encodeLength(len) {
  if (len < 0x80) return Buffer.from([len]);
  if (len < 0x4000) {
    const b = Buffer.alloc(2);
    b.writeUInt16BE(len | 0x8000);
    return b;
  }
  if (len < 0x200000) {
    const b = Buffer.alloc(3);
    b[0] = ((len >> 16) & 0xFF) | 0xC0;
    b[1] = (len >> 8) & 0xFF;
    b[2] = len & 0xFF;
    return b;
  }
  if (len < 0x10000000) {
    const b = Buffer.alloc(4);
    b.writeUInt32BE(len | 0xE0000000);
    return b;
  }
  const b = Buffer.alloc(5);
  b[0] = 0xF0;
  b.writeUInt32BE(len, 1);
  return b;
}

function encodeWord(word) {
  const wb = Buffer.from(word, 'utf-8');
  return Buffer.concat([encodeLength(wb.length), wb]);
}

function encodeSentence(words) {
  const parts = words.map(w => encodeWord(w));
  parts.push(encodeLength(0)); // empty word = end of sentence
  return Buffer.concat(parts);
}

// ── Minimal RouterOS API Client ────────────────────────────

// Factory function to create a client with custom config (for routers controller)
const createMikroTikClient = (cfg) => new MikroTikClient(cfg);

class MikroTikClient {
  constructor(cfg) {
    this.cfg = { ...DEFAULT_CFG, ...cfg };
    this.socket = null;
    this.buffer = Buffer.alloc(0);
  }

  connect() {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Connection timed out (${this.cfg.timeout / 1000}s)`));
        this.close();
      }, this.cfg.timeout);

      this.socket = net.createConnection({ host: this.cfg.host, port: this.cfg.port }, () => {
        clearTimeout(timer);
        resolve();
      });

      this.socket.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  close() {
    if (this.socket) {
      try { this.socket.destroy(); } catch {}
      this.socket = null;
    }
    this.buffer = Buffer.alloc(0);
  }

  // Send a sentence (array of words) and read the full response
  talk(words) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Command timed out: ${words[0]}`));
      }, this.cfg.timeout);

      this.buffer = Buffer.alloc(0);
      const sentences = [];
      let currentSentence = [];

      const onData = (chunk) => {
        this.buffer = Buffer.concat([this.buffer, chunk]);
        this._parseSentences(currentSentence, sentences);

        // Check if we got a terminal sentence
        for (const s of sentences) {
          if (s[0] === '!done' || s[0] === '!fatal') {
            clearTimeout(timer);
            this.socket.removeListener('data', onData);

            // Check for errors
            const trap = sentences.find(s => s[0] === '!trap');
            if (trap) {
              const msg = trap.find(w => w.startsWith('=message='));
              reject(new Error(msg ? msg.substring(9) : 'MikroTik command error'));
              return;
            }
            if (s[0] === '!fatal') {
              reject(new Error('MikroTik fatal: ' + (s[1] || 'unknown')));
              return;
            }

            // Return !re data sentences parsed as objects
            const data = sentences
              .filter(s => s[0] === '!re')
              .map(s => {
                const obj = {};
                for (let i = 1; i < s.length; i++) {
                  const w = s[i];
                  if (w.startsWith('=')) {
                    const eq = w.indexOf('=', 1);
                    if (eq !== -1) {
                      obj[w.substring(1, eq)] = w.substring(eq + 1);
                    }
                  }
                }
                return obj;
              });

            resolve(data);
            return;
          }
        }
        // Accumulate all sentences until !done arrives — do NOT clear
      };

      this.socket.on('data', onData);
      this.socket.write(encodeSentence(words));
    });
  }

  _parseSentences(current, output) {
    while (this.buffer.length > 0) {
      const { len, bytesRead } = this._readLength();
      if (len === null) break; // not enough data yet
      if (bytesRead + len > this.buffer.length) break; // word not fully received

      if (len === 0) {
        // End of sentence
        if (current.length > 0) {
          output.push([...current]);
          current.length = 0;
        }
      } else {
        const word = this.buffer.slice(bytesRead, bytesRead + len).toString('utf-8');
        // Skip !empty — RouterOS v7 sends this, it's harmless
        if (word !== '!empty') {
          current.push(word);
        }
      }
      this.buffer = this.buffer.slice(bytesRead + len);
    }
  }

  _readLength() {
    if (this.buffer.length === 0) return { len: null, bytesRead: 0 };
    const b0 = this.buffer[0];

    if ((b0 & 0x80) === 0) {
      return { len: b0, bytesRead: 1 };
    }
    if ((b0 & 0xC0) === 0x80) {
      if (this.buffer.length < 2) return { len: null, bytesRead: 0 };
      return { len: ((b0 & 0x3F) << 8) | this.buffer[1], bytesRead: 2 };
    }
    if ((b0 & 0xE0) === 0xC0) {
      if (this.buffer.length < 3) return { len: null, bytesRead: 0 };
      return { len: ((b0 & 0x1F) << 16) | (this.buffer[1] << 8) | this.buffer[2], bytesRead: 3 };
    }
    if ((b0 & 0xF0) === 0xE0) {
      if (this.buffer.length < 4) return { len: null, bytesRead: 0 };
      return { len: ((b0 & 0x0F) << 24) | (this.buffer[1] << 16) | (this.buffer[2] << 8) | this.buffer[3], bytesRead: 4 };
    }
    if (b0 === 0xF0) {
      if (this.buffer.length < 5) return { len: null, bytesRead: 0 };
      return { len: (this.buffer[1] << 24) | (this.buffer[2] << 16) | (this.buffer[3] << 8) | this.buffer[4], bytesRead: 5 };
    }
    return { len: null, bytesRead: 0 };
  }

  // Login using plain-text auth (RouterOS v6.43+)
  async login() {
    const result = await this.talk(['/login', `=name=${this.cfg.user}`, `=password=${this.cfg.password}`]);
    return result;
  }
}

// ── Connection wrapper (accepts optional routerConfig for multi-tenant) ──

const withConnection = async (callback, routerConfig) => {
  const client = new MikroTikClient(routerConfig);
  try {
    await client.connect();
    await client.login();
    return await callback(client);
  } finally {
    client.close();
  }
};

// ── PPPoE Secret Management ────────────────────────────────

const createPPPoESecret = async ({ username, password, profile, comment }, routerConfig) => {
  return withConnection(async (client) => {
    const existing = await client.talk(['/ppp/secret/print', `?name=${username}`]);
    if (existing.length > 0) {
      throw new Error(`PPPoE secret '${username}' already exists on MikroTik`);
    }

    const words = [
      '/ppp/secret/add',
      `=name=${username}`,
      `=password=${password}`,
      '=service=pppoe',
      `=profile=${profile || 'default'}`,
    ];
    if (comment) words.push(`=comment=${comment}`);

    await client.talk(words);
    console.log(`[MIKROTIK] PPPoE secret created: ${username} (profile: ${profile})`);
    return true;
  }, routerConfig);
};

const removePPPoESecret = async (username, routerConfig) => {
  return withConnection(async (client) => {
    const secrets = await client.talk(['/ppp/secret/print', `?name=${username}`]);
    if (secrets.length === 0) {
      console.log(`[MIKROTIK] PPPoE secret '${username}' not found — nothing to remove`);
      return null;
    }
    await client.talk(['/ppp/secret/remove', `=.id=${secrets[0]['.id']}`]);
    console.log(`[MIKROTIK] PPPoE secret removed: ${username}`);
    return true;
  }, routerConfig);
};

const updatePPPoESecret = async (username, updates, routerConfig) => {
  return withConnection(async (client) => {
    const secrets = await client.talk(['/ppp/secret/print', `?name=${username}`]);
    if (secrets.length === 0) {
      throw new Error(`PPPoE secret '${username}' not found on MikroTik`);
    }

    const words = ['/ppp/secret/set', `=.id=${secrets[0]['.id']}`];
    if (updates.password) words.push(`=password=${updates.password}`);
    if (updates.profile) words.push(`=profile=${updates.profile}`);
    if (updates.disabled !== undefined) words.push(`=disabled=${updates.disabled ? 'yes' : 'no'}`);
    if (updates.comment) words.push(`=comment=${updates.comment}`);

    await client.talk(words);
    console.log(`[MIKROTIK] PPPoE secret updated: ${username}`, updates);
    return true;
  }, routerConfig);
};

const setPPPoESecretStatus = async (username, enabled, routerConfig) => {
  return withConnection(async (client) => {
    const secrets = await client.talk(['/ppp/secret/print', `?name=${username}`]);
    if (secrets.length === 0) {
      throw new Error(`PPPoE secret '${username}' not found on MikroTik`);
    }
    const id = secrets[0]['.id'];
    const cmd = enabled ? '/ppp/secret/enable' : '/ppp/secret/disable';
    await client.talk([cmd, `=.id=${id}`]);
    console.log(`[MIKROTIK] PPPoE secret ${enabled ? 'enabled' : 'disabled'}: ${username}`);
    return true;
  }, routerConfig);
};

const getPPPoESecrets = async (routerConfig) => {
  return withConnection(async (client) => {
    return await client.talk(['/ppp/secret/print']);
  }, routerConfig);
};

const getPPPoESecret = async (username, routerConfig) => {
  return withConnection(async (client) => {
    const secrets = await client.talk(['/ppp/secret/print', `?name=${username}`]);
    return secrets.length > 0 ? secrets[0] : null;
  }, routerConfig);
};

// ── PPPoE Active Sessions ──────────────────────────────────

const getActiveSessions = async (routerConfig) => {
  return withConnection(async (client) => {
    return await client.talk(['/ppp/active/print']);
  }, routerConfig);
};

const disconnectSession = async (username, routerConfig) => {
  return withConnection(async (client) => {
    const sessions = await client.talk(['/ppp/active/print', `?name=${username}`]);
    if (sessions.length === 0) return null;
    await client.talk(['/ppp/active/remove', `=.id=${sessions[0]['.id']}`]);
    console.log(`[MIKROTIK] Active session disconnected: ${username}`);
    return true;
  }, routerConfig);
};

// ── PPPoE Profiles ─────────────────────────────────────────

const getProfiles = async (routerConfig) => {
  return withConnection(async (client) => {
    return await client.talk(['/ppp/profile/print']);
  }, routerConfig);
};

const createProfile = async ({ name, rateLimit, comment }, routerConfig) => {
  return withConnection(async (client) => {
    const existing = await client.talk(['/ppp/profile/print', `?name=${name}`]);
    if (existing.length > 0) {
      throw new Error(`Profile '${name}' already exists on MikroTik`);
    }
    const words = ['/ppp/profile/add', `=name=${name}`, `=rate-limit=${rateLimit}`];
    if (comment) words.push(`=comment=${comment}`);
    await client.talk(words);
    console.log(`[MIKROTIK] Profile created: ${name} (rate-limit: ${rateLimit})`);
    return true;
  }, routerConfig);
};

// ── Interface Traffic (for live bandwidth) ────────────────

const getInterfaceTraffic = async (username, routerConfig) => {
  return withConnection(async (client) => {
    // PPPoE interfaces are named <pppoe-USERNAME>
    const ifaces = await client.talk(['/interface/print', `?name=<pppoe-${username}>`]);
    if (ifaces.length === 0) return null;
    const iface = ifaces[0];
    return {
      name: iface.name,
      txBytes: Number(iface['tx-byte'] || 0),
      rxBytes: Number(iface['rx-byte'] || 0),
      txPackets: Number(iface['tx-packet'] || 0),
      rxPackets: Number(iface['rx-packet'] || 0),
      running: iface.running === 'true',
      timestamp: Date.now(),
    };
  }, routerConfig);
};

// ── Connection Test ────────────────────────────────────────

const testConnection = async (routerConfig) => {
  return withConnection(async (client) => {
    const identity = await client.talk(['/system/identity/print']);
    const resources = await client.talk(['/system/resource/print']);

    return {
      connected: true,
      identity: identity[0]?.name || 'Unknown',
      uptime: resources[0]?.uptime || 'Unknown',
      version: resources[0]?.version || 'Unknown',
      cpu: resources[0]?.['cpu-load'] || 'Unknown',
      freeMemory: resources[0]?.['free-memory'] || 'Unknown',
      totalMemory: resources[0]?.['total-memory'] || 'Unknown',
    };
  }, routerConfig);
};

module.exports = {
  MikroTikClient,
  createMikroTikClient,
  createPPPoESecret,
  removePPPoESecret,
  updatePPPoESecret,
  setPPPoESecretStatus,
  getPPPoESecrets,
  getPPPoESecret,
  getActiveSessions,
  disconnectSession,
  getProfiles,
  createProfile,
  getInterfaceTraffic,
  testConnection,
};
