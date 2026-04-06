/**
 * Auth Strategy Factory
 * 
 * Cleanly separates RADIUS vs API (MikroTik direct) authentication logic.
 * Each strategy implements the same interface:
 *   - onUserCreate(userData, plan, routerConfig)  → called during lead conversion
 *   - onUserUpdate(username, updates, routerConfig) → called when customer is edited
 *   - onUserStatusChange(username, active, routerConfig) → enable/disable
 *   - onPlanChange(username, newPlan, routerConfig) → plan/profile change
 *   - onUserDelete(username, routerConfig) → remove PPP secret
 *   - buildPlanAttributes(plan) → returns plan-specific attributes for display
 */

const mikrotik = require('./mikrotik');
const radiusService = require('./radiusService');

// ── RADIUS Strategy ─────────────────────────────────────────
// RADIUS handles authentication — we provision users in the FreeRADIUS DB.
// The router's PPP auth is set to "radius", so FreeRADIUS authenticates users.
const radiusStrategy = {
  name: 'radius',

  async onUserCreate({ username, password, fullName, plan }) {
    // Provision user in FreeRADIUS database (radcheck + radreply + radusergroup)
    const rateLimit = plan.radius_rate_limit || `${plan.upload_speed}/${plan.download_speed}`;
    const groupname = plan.mikrotik_profile || plan.name;

    try {
      await radiusService.createUser(username, password, groupname, { rateLimit });
      console.log(`[AUTH:RADIUS] User "${username}" provisioned in RADIUS DB (rate: ${rateLimit})`);
      return { synced: true, method: 'radius', rateLimit, group: groupname };
    } catch (err) {
      console.error(`[AUTH:RADIUS] Failed to provision "${username}" in RADIUS: ${err.message}`);
      return { synced: false, method: 'radius', error: err.message };
    }
  },

  async onUserUpdate(username, updates, routerConfig) {
    // Update user in RADIUS DB (password or username)
    let currentUsername = username;
    if (updates.newUsername) {
      try {
        await radiusService.renameUser(username, updates.newUsername);
        console.log(`[AUTH:RADIUS] Username changed: "${username}" → "${updates.newUsername}"`);
        currentUsername = updates.newUsername;
      } catch (err) {
        console.error(`[AUTH:RADIUS] Username change failed: ${err.message}`);
        return { synced: false, method: 'radius', error: err.message };
      }
    }
    if (updates.password) {
      try {
        await radiusService.updatePassword(currentUsername, updates.password);
        console.log(`[AUTH:RADIUS] Password updated for "${currentUsername}"`);
      } catch (err) {
        console.error(`[AUTH:RADIUS] Password update failed: ${err.message}`);
        return { synced: false, method: 'radius', error: err.message };
      }
    }
    return { synced: true, method: 'radius' };
  },

  async onUserStatusChange(username, active, routerConfig) {
    // Enable/disable in RADIUS DB + disconnect active session if disabling
    try {
      if (active) {
        await radiusService.enableUser(username);
      } else {
        await radiusService.disableUser(username);
        // Also disconnect active session on the router
        if (routerConfig) {
          try {
            await mikrotik.disconnectSession(username, routerConfig);
            console.log(`[AUTH:RADIUS] Disconnected active session for "${username}"`);
          } catch (mkErr) {
            console.warn(`[AUTH:RADIUS] Failed to disconnect "${username}": ${mkErr.message}`);
          }
        }
      }
      return { synced: true, method: 'radius' };
    } catch (err) {
      console.error(`[AUTH:RADIUS] Status change failed for "${username}": ${err.message}`);
      return { synced: false, method: 'radius', error: err.message };
    }
  },

  async onPlanChange(username, newPlan, routerConfig) {
    // Update rate limit + group in RADIUS DB, then disconnect to force re-auth
    const rateLimit = newPlan.radius_rate_limit || `${newPlan.upload_speed}/${newPlan.download_speed}`;
    const groupname = newPlan.mikrotik_profile || newPlan.name;

    try {
      await radiusService.updateRateLimit(username, rateLimit);
      await radiusService.changeGroup(username, groupname);

      // Disconnect to force re-auth with new rate limit
      if (routerConfig) {
        try {
          await mikrotik.disconnectSession(username, routerConfig);
          console.log(`[AUTH:RADIUS] Disconnected "${username}" to apply new rate limit`);
        } catch (mkErr) {
          console.warn(`[AUTH:RADIUS] Disconnect failed for "${username}": ${mkErr.message}`);
        }
      }
      return { synced: true, method: 'radius', rateLimit, group: groupname };
    } catch (err) {
      console.error(`[AUTH:RADIUS] Plan change failed for "${username}": ${err.message}`);
      return { synced: false, method: 'radius', error: err.message };
    }
  },

  async onUserDelete(username, routerConfig) {
    // Remove from RADIUS DB + disconnect
    try {
      await radiusService.deleteUser(username);
      if (routerConfig) {
        try {
          await mikrotik.disconnectSession(username, routerConfig);
        } catch (mkErr) {
          console.warn(`[AUTH:RADIUS] Disconnect on delete failed: ${mkErr.message}`);
        }
      }
      return { synced: true, method: 'radius' };
    } catch (err) {
      console.error(`[AUTH:RADIUS] Delete failed for "${username}": ${err.message}`);
      return { synced: false, method: 'radius', error: err.message };
    }
  },

  buildPlanAttributes(plan) {
    return {
      rateLimit: plan.radius_rate_limit || `${plan.upload_speed}/${plan.download_speed}`,
      profile: null,
    };
  },
};

// ── API Strategy ────────────────────────────────────────────
// Direct MikroTik API — we create/manage PPP secrets on the router.
const apiStrategy = {
  name: 'api',

  async onUserCreate({ username, password, fullName, plan }, routerConfig) {
    const mikrotikProfile = plan.mikrotik_profile || plan.name;
    try {
      await mikrotik.createPPPoESecret({
        username,
        password,
        profile: mikrotikProfile,
        comment: `CONNIS: ${fullName} | Plan: ${plan.name}`,
      }, routerConfig);
      console.log(`[AUTH:API] PPPoE secret created on router: ${username}`);
      return { synced: true, method: 'api', profile: mikrotikProfile };
    } catch (err) {
      if (err.message.includes('already exists')) {
        throw err; // Re-throw duplicates
      }
      console.warn(`[AUTH:API] PPPoE creation failed (router unreachable): ${err.message}`);
      return { synced: false, method: 'api', error: err.message };
    }
  },

  async onUserUpdate(username, updates, routerConfig) {
    if (!routerConfig) return { synced: false, method: 'api', error: 'No router config' };
    // Update PPP secret (password or username) on MikroTik
    try {
      if (updates.newUsername || updates.password) {
        const updateData = {};
        if (updates.newUsername) updateData.name = updates.newUsername;
        if (updates.password) updateData.password = updates.password;
        await mikrotik.updatePPPoESecret(username, updateData, routerConfig);
        console.log(`[AUTH:API] PPP secret updated for "${username}"`);
        return { synced: true, method: 'api' };
      }
      return { synced: true, method: 'api', message: 'No changes' };
    } catch (err) {
      console.warn(`[AUTH:API] Update failed for "${username}": ${err.message}`);
      return { synced: false, method: 'api', error: err.message };
    }
  },

  async onUserStatusChange(username, active, routerConfig) {
    if (!routerConfig) return { synced: false, method: 'api', error: 'No router config' };
    try {
      await mikrotik.setPPPoESecretStatus(username, active, routerConfig);
      if (!active) {
        await mikrotik.disconnectSession(username, routerConfig);
      }
      console.log(`[AUTH:API] PPPoE secret ${active ? 'enabled' : 'disabled'}: ${username}`);
      return { synced: true, method: 'api' };
    } catch (err) {
      console.warn(`[AUTH:API] Status change failed for "${username}": ${err.message}`);
      return { synced: false, method: 'api', error: err.message };
    }
  },

  async onPlanChange(username, newPlan, routerConfig) {
    if (!routerConfig) return { synced: false, method: 'api', error: 'No router config' };
    const mikrotikProfile = newPlan.mikrotik_profile || newPlan.name;
    try {
      await mikrotik.updatePPPoESecret(username, { profile: mikrotikProfile }, routerConfig);
      console.log(`[AUTH:API] Profile updated: ${username} → ${mikrotikProfile}`);
      return { synced: true, method: 'api', profile: mikrotikProfile };
    } catch (err) {
      console.warn(`[AUTH:API] Profile update failed for "${username}": ${err.message}`);
      return { synced: false, method: 'api', error: err.message };
    }
  },

  async onUserDelete(username, routerConfig) {
    if (!routerConfig) return { synced: false, method: 'api', error: 'No router config' };
    try {
      await mikrotik.removePPPoESecret(username, routerConfig);
      console.log(`[AUTH:API] PPPoE secret removed: ${username}`);
      return { synced: true, method: 'api' };
    } catch (err) {
      console.warn(`[AUTH:API] Secret removal failed for "${username}": ${err.message}`);
      return { synced: false, method: 'api', error: err.message };
    }
  },

  buildPlanAttributes(plan) {
    return {
      rateLimit: null,
      profile: plan.mikrotik_profile || plan.name,
    };
  },
};

// ── Factory ─────────────────────────────────────────────────
const strategies = { radius: radiusStrategy, api: apiStrategy };

const getStrategy = (authType) => {
  const strategy = strategies[authType];
  if (!strategy) {
    throw new Error(`Unknown auth_type: "${authType}". Must be "radius" or "api".`);
  }
  return strategy;
};

module.exports = { getStrategy, radiusStrategy, apiStrategy };
