// Centralized API service — all backend calls go through here
// All protected routes include JWT Bearer token from localStorage
const API_BASE = '/api';

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    // Auto-logout on 401
    if (response.status === 401) {
      localStorage.removeItem('connis_token');
      localStorage.removeItem('connis_admin');
      localStorage.removeItem('connis_company');
      window.location.href = '/login';
    }
    throw new Error(data.error || data.errors?.[0]?.message || 'Request failed');
  }
  return data;
};

// Authenticated fetch — injects JWT token header
const authFetch = (url, options = {}) => {
  const token = localStorage.getItem('connis_token');
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
};

// ── Auth API (public — no token needed) ────────────────────

export const authApi = {
  register: async (data) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  getMe: async () => {
    const res = await authFetch(`${API_BASE}/auth/me`);
    return handleResponse(res);
  },
};

// ── Leads API ──────────────────────────────────────────────

export const leadsApi = {
  getAll: async () => {
    const res = await authFetch(`${API_BASE}/leads`);
    return handleResponse(res);
  },

  create: async (leadData) => {
    const res = await authFetch(`${API_BASE}/leads/create`, {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
    return handleResponse(res);
  },

  updateStatus: async (id, status) => {
    const res = await authFetch(`${API_BASE}/leads/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  getComments: async (id) => {
    const res = await authFetch(`${API_BASE}/leads/${id}/comments`);
    return handleResponse(res);
  },

  addComment: async (id, content) => {
    const res = await authFetch(`${API_BASE}/leads/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    return handleResponse(res);
  },

  convert: async (id, data) => {
    const res = await authFetch(`${API_BASE}/leads/${id}/convert`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
};

// ── Users API ──────────────────────────────────────────────

export const usersApi = {
  getAll: async () => {
    const res = await authFetch(`${API_BASE}/users`);
    return handleResponse(res);
  },

  getStatus: async (forceRefresh = false) => {
    const url = forceRefresh ? `${API_BASE}/users/status?refresh=true` : `${API_BASE}/users/status`;
    const res = await authFetch(url);
    return handleResponse(res);
  },

  create: async (userData) => {
    const res = await authFetch(`${API_BASE}/users/create`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },
};

// ── Customers API ──────────────────────────────────────────

export const customersApi = {
  getAll: async (status) => {
    const url = status ? `${API_BASE}/customers?status=${status}` : `${API_BASE}/customers`;
    const res = await authFetch(url);
    return handleResponse(res);
  },

  getById: async (id) => {
    const res = await authFetch(`${API_BASE}/customers/${id}`);
    return handleResponse(res);
  },

  update: async (id, data) => {
    const res = await authFetch(`${API_BASE}/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  changePlan: async (id, { plan_id, start_date, end_date }) => {
    const res = await authFetch(`${API_BASE}/customers/${id}/plan`, {
      method: 'PUT',
      body: JSON.stringify({ plan_id, start_date: start_date || undefined, end_date: end_date || undefined }),
    });
    return handleResponse(res);
  },

  getLiveBandwidth: async (id) => {
    const res = await authFetch(`${API_BASE}/customers/${id}/bandwidth`);
    return handleResponse(res);
  },

  getStatistics: async (id, period = 'month') => {
    const res = await authFetch(`${API_BASE}/customers/${id}/statistics?period=${period}`);
    return handleResponse(res);
  },

  cancelPendingPlan: async (id) => {
    const res = await authFetch(`${API_BASE}/customers/${id}/plan/pending`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  remove: async (id) => {
    const res = await authFetch(`${API_BASE}/customers/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },
};

// ── Routers API ──────────────────────────────────────────

export const routersApi = {
  getAll: async () => {
    const res = await authFetch(`${API_BASE}/routers`);
    return handleResponse(res);
  },

  add: async (data) => {
    const res = await authFetch(`${API_BASE}/routers`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  update: async (id, data) => {
    const res = await authFetch(`${API_BASE}/routers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  remove: async (id) => {
    const res = await authFetch(`${API_BASE}/routers/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  testConnection: async (id) => {
    const res = await authFetch(`${API_BASE}/routers/${id}/test`, { method: 'POST' });
    return handleResponse(res);
  },
};

// ── Staff API ────────────────────────────────────────────

export const staffApi = {
  getAll: async () => {
    const res = await authFetch(`${API_BASE}/staff`);
    return handleResponse(res);
  },

  create: async (data) => {
    const res = await authFetch(`${API_BASE}/staff`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  update: async (id, data) => {
    const res = await authFetch(`${API_BASE}/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  remove: async (id) => {
    const res = await authFetch(`${API_BASE}/staff/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },
};

// ── MikroTik API ─────────────────────────────────────────

export const mikrotikApi = {
  getStatus: async () => {
    const res = await authFetch(`${API_BASE}/mikrotik/status`);
    return handleResponse(res);
  },

  getSessions: async () => {
    const res = await authFetch(`${API_BASE}/mikrotik/sessions`);
    return handleResponse(res);
  },

  getSecrets: async () => {
    const res = await authFetch(`${API_BASE}/mikrotik/secrets`);
    return handleResponse(res);
  },

  getProfiles: async () => {
    const res = await authFetch(`${API_BASE}/mikrotik/profiles`);
    return handleResponse(res);
  },

  disconnect: async (username) => {
    const res = await authFetch(`${API_BASE}/mikrotik/disconnect/${username}`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  syncCustomers: async () => {
    const res = await authFetch(`${API_BASE}/mikrotik/sync-customers`, {
      method: 'POST',
    });
    return handleResponse(res);
  },
};

// ── Plans API ──────────────────────────────────────────────

export const plansApi = {
  getAll: async () => {
    const res = await authFetch(`${API_BASE}/plans`);
    return handleResponse(res);
  },

  create: async (planData) => {
    const res = await authFetch(`${API_BASE}/plans/create`, {
      method: 'POST',
      body: JSON.stringify(planData),
    });
    return handleResponse(res);
  },

  update: async (id, data) => {
    const res = await authFetch(`${API_BASE}/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  remove: async (id) => {
    const res = await authFetch(`${API_BASE}/plans/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },
};

// ── Dashboard API ───────────────────────────────────────────

export const dashboardApi = {
  getStats: async (period = 'month') => {
    const res = await authFetch(`${API_BASE}/dashboard/stats?period=${period}`);
    return handleResponse(res);
  },
};

// ── Tickets API ─────────────────────────────────────────────

export const ticketsApi = {
  getAll: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const res = await authFetch(`${API_BASE}/tickets${qs ? '?' + qs : ''}`);
    return handleResponse(res);
  },
  getById: async (id) => {
    const res = await authFetch(`${API_BASE}/tickets/${id}`);
    return handleResponse(res);
  },
  create: async (data) => {
    const res = await authFetch(`${API_BASE}/tickets`, { method: 'POST', body: JSON.stringify(data) });
    return handleResponse(res);
  },
  update: async (id, data) => {
    const res = await authFetch(`${API_BASE}/tickets/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    return handleResponse(res);
  },
  addComment: async (id, content) => {
    const res = await authFetch(`${API_BASE}/tickets/${id}/comments`, { method: 'POST', body: JSON.stringify({ content }) });
    return handleResponse(res);
  },
  remove: async (id) => {
    const res = await authFetch(`${API_BASE}/tickets/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },
};

// ── Tasks API ───────────────────────────────────────────────

export const tasksApi = {
  getAll: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const res = await authFetch(`${API_BASE}/tasks${qs ? '?' + qs : ''}`);
    return handleResponse(res);
  },
  getById: async (id) => {
    const res = await authFetch(`${API_BASE}/tasks/${id}`);
    return handleResponse(res);
  },
  create: async (data) => {
    const res = await authFetch(`${API_BASE}/tasks`, { method: 'POST', body: JSON.stringify(data) });
    return handleResponse(res);
  },
  update: async (id, data) => {
    const res = await authFetch(`${API_BASE}/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    return handleResponse(res);
  },
  remove: async (id) => {
    const res = await authFetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },
};

// ── Documents API ───────────────────────────────────────────

export const documentsApi = {
  getAll: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const res = await authFetch(`${API_BASE}/documents${qs ? '?' + qs : ''}`);
    return handleResponse(res);
  },
  upload: async (formData) => {
    const token = localStorage.getItem('connis_token');
    const res = await fetch(`${API_BASE}/documents`, {
      method: 'POST',
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      body: formData,
    });
    return handleResponse(res);
  },
  download: (id) => {
    const token = localStorage.getItem('connis_token');
    return `${API_BASE}/documents/${id}/download?token=${token}`;
  },
  remove: async (id) => {
    const res = await authFetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  update: async (id, data) => {
    const res = await authFetch(`${API_BASE}/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
};

// ── Vouchers API (admin) ──────────────────────────────────────

export const vouchersApi = {
  getAll: async (used) => {
    const qs = used !== undefined ? `?used=${used}` : '';
    const res = await authFetch(`${API_BASE}/vouchers${qs}`);
    return handleResponse(res);
  },
  generate: async (amount, count = 1) => {
    const res = await authFetch(`${API_BASE}/vouchers/generate`, {
      method: 'POST', body: JSON.stringify({ amount, count }),
    });
    return handleResponse(res);
  },
  redeem: async (code, user_id) => {
    const res = await authFetch(`${API_BASE}/vouchers/redeem`, {
      method: 'POST', body: JSON.stringify({ code, user_id }),
    });
    return handleResponse(res);
  },
  remove: async (id) => {
    const res = await authFetch(`${API_BASE}/vouchers/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },
};

// ── Transactions API (admin) ──────────────────────────────────

export const transactionsApi = {
  getAll: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const res = await authFetch(`${API_BASE}/transactions${qs ? '?' + qs : ''}`);
    return handleResponse(res);
  },
  credit: async (user_id, amount, description) => {
    const res = await authFetch(`${API_BASE}/transactions/credit`, {
      method: 'POST', body: JSON.stringify({ user_id, amount, description }),
    });
    return handleResponse(res);
  },
  debit: async (user_id, amount, description) => {
    const res = await authFetch(`${API_BASE}/transactions/debit`, {
      method: 'POST', body: JSON.stringify({ user_id, amount, description }),
    });
    return handleResponse(res);
  },
};

// ── Portal API (customer self-service) ────────────────────────

const portalFetch = (url, options = {}) => {
  const token = localStorage.getItem('connis_portal_token');
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
};

const handlePortalResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('connis_portal_token');
      localStorage.removeItem('connis_portal_user');
      window.location.href = '/portal/login';
    }
    throw new Error(data.error || 'Request failed');
  }
  return data;
};

// ── Notifications (admin) ──
export const notificationsApi = {
  getAll: async (limit = 30, unreadOnly = false) => {
    const res = await authFetch(`${API_BASE}/notifications?limit=${limit}${unreadOnly ? '&unread_only=true' : ''}`);
    return handleResponse(res);
  },
  getUnreadCount: async () => {
    const res = await authFetch(`${API_BASE}/notifications/unread-count`);
    return handleResponse(res);
  },
  markRead: async (id) => {
    const res = await authFetch(`${API_BASE}/notifications/${id}/read`, { method: 'PUT' });
    return handleResponse(res);
  },
  markAllRead: async () => {
    const res = await authFetch(`${API_BASE}/notifications/read-all`, { method: 'PUT' });
    return handleResponse(res);
  },
};

// ── Messages / Chat (admin) ──
export const messagesApi = {
  getConversations: async () => {
    const res = await authFetch(`${API_BASE}/messages/conversations`);
    return handleResponse(res);
  },
  getMessages: async (userId, limit = 50) => {
    const res = await authFetch(`${API_BASE}/messages/${userId}?limit=${limit}`);
    return handleResponse(res);
  },
  send: async (userId, content, ticketId) => {
    const res = await authFetch(`${API_BASE}/messages/${userId}`, {
      method: 'POST', body: JSON.stringify({ content, ticket_id: ticketId }),
    });
    return handleResponse(res);
  },
  getUnreadCount: async () => {
    const res = await authFetch(`${API_BASE}/messages/unread-count`);
    return handleResponse(res);
  },
};

export const portalApi = {
  login: async (username, password) => {
    const res = await fetch(`${API_BASE}/portal/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return handlePortalResponse(res);
  },
  getMe: async () => {
    const res = await portalFetch(`${API_BASE}/portal/me`);
    return handlePortalResponse(res);
  },
  getTransactions: async (limit = 50, offset = 0) => {
    const res = await portalFetch(`${API_BASE}/portal/transactions?limit=${limit}&offset=${offset}`);
    return handlePortalResponse(res);
  },
  redeemVoucher: async (code) => {
    const res = await portalFetch(`${API_BASE}/portal/redeem`, {
      method: 'POST', body: JSON.stringify({ code }),
    });
    return handlePortalResponse(res);
  },
  getTickets: async () => {
    const res = await portalFetch(`${API_BASE}/portal/tickets`);
    return handlePortalResponse(res);
  },
  createTicket: async (subject, description, priority = 'medium') => {
    const res = await portalFetch(`${API_BASE}/portal/tickets`, {
      method: 'POST', body: JSON.stringify({ subject, description, priority }),
    });
    return handlePortalResponse(res);
  },
  getTicket: async (id) => {
    const res = await portalFetch(`${API_BASE}/portal/tickets/${id}`);
    return handlePortalResponse(res);
  },
  addTicketComment: async (id, content) => {
    const res = await portalFetch(`${API_BASE}/portal/tickets/${id}/comments`, {
      method: 'POST', body: JSON.stringify({ content }),
    });
    return handlePortalResponse(res);
  },
  getStatistics: async () => {
    const res = await portalFetch(`${API_BASE}/portal/statistics`);
    return handlePortalResponse(res);
  },
  getMessages: async () => {
    const res = await portalFetch(`${API_BASE}/portal/messages`);
    return handlePortalResponse(res);
  },
  sendMessage: async (content, ticketId, attachmentUrl) => {
    const res = await portalFetch(`${API_BASE}/portal/messages`, {
      method: 'POST', body: JSON.stringify({ content, ticket_id: ticketId, attachment_url: attachmentUrl }),
    });
    return handlePortalResponse(res);
  },
  uploadFile: async (file) => {
    const token = localStorage.getItem('connis_portal_token');
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/portal/upload`, {
      method: 'POST',
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      body: formData,
    });
    return handlePortalResponse(res);
  },
  getUnreadMessages: async () => {
    const res = await portalFetch(`${API_BASE}/portal/messages/unread-count`);
    return handlePortalResponse(res);
  },
};
