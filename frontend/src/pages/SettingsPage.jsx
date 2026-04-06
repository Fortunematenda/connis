import { useState, useEffect, useCallback } from 'react';
import { Settings, Router, Wifi, WifiOff, Plus, Trash2, TestTube, Building2, Pencil, X, Check, Loader2, FileText, Activity, AlertTriangle, UserCheck, XCircle, Terminal, Filter, Download, RefreshCw, ChevronRight, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { routersApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const LOGS_API_URL = '/api/logs';

// Mock data for system logs
const MOCK_LOGS = [
  { id: 1, timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), level: 'info', category: 'auth', message: 'Admin user admin@connis.co.za logged in successfully', details: 'IP: 196.214.55.172', user: 'admin@connis.co.za' },
  { id: 2, timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), level: 'warning', category: 'auth', message: 'Failed login attempt', details: 'IP: 192.168.1.100, Username: unknown_user', user: null },
  { id: 3, timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), level: 'error', category: 'system', message: 'MikroTik API connection timeout', details: 'Router: Main Tower Router, Error: Connection timeout after 5000ms', user: null },
  { id: 4, timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), level: 'info', category: 'customer', message: 'Customer account created', details: 'Customer: John Doe, ID: #001', user: 'admin@connis.co.za' },
  { id: 5, timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), level: 'info', category: 'customer', message: 'Plan change applied', details: 'Customer: Jane Smith, Plan: pppoe-10M -> pppoe-20M', user: 'admin@connis.co.za' },
  { id: 6, timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(), level: 'warning', category: 'radius', message: 'RADIUS accounting delay detected', details: 'Queue size: 145, Processing delay: 3.2s', user: null },
  { id: 7, timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), level: 'error', category: 'database', message: 'Database connection pool exhausted', details: 'Active connections: 20/20, Waiting queries: 8', user: null },
  { id: 8, timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), level: 'info', category: 'system', message: 'Automated backup completed', details: 'Backup size: 2.4MB, Duration: 12s', user: 'system' },
  { id: 9, timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), level: 'warning', category: 'customer', message: 'Low balance alert triggered', details: 'Customer: Mike Johnson, Balance: R-45.50', user: null },
  { id: 10, timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(), level: 'info', category: 'auth', message: 'User password changed', details: 'User: admin@connis.co.za', user: 'admin@connis.co.za' },
];

const SettingsPage = () => {
  const { company } = useAuth();
  const [routers, setRouters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [testing, setTesting] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [form, setForm] = useState({ name: '', ip_address: '', username: 'admin', password: '', port: '8728', auth_type: 'radius', is_default: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // System Logs state
  const [logs, setLogs] = useState(MOCK_LOGS);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilter, setLogFilter] = useState('all');
  const [logLevelFilter, setLogLevelFilter] = useState('all');
  const [expandedLog, setExpandedLog] = useState(null);

  const testConnection = useCallback(async (id) => {
    setTesting((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await routersApi.testConnection(id);
      setTestResults((prev) => ({ ...prev, [id]: res.data }));
    } catch (err) {
      setTestResults((prev) => ({ ...prev, [id]: { connected: false, error: err.message } }));
    } finally {
      setTesting((prev) => ({ ...prev, [id]: false }));
    }
  }, []);

  const fetchRouters = useCallback(async (autoTest = false) => {
    try {
      const res = await routersApi.getAll();
      setRouters(res.data);
      if (autoTest && res.data.length > 0) {
        res.data.forEach((r) => testConnection(r.id));
      }
    } catch (err) {
      console.error('Failed to load routers:', err);
    } finally {
      setLoading(false);
    }
  }, [testConnection]);

  useEffect(() => {
    fetchRouters(true);
  }, [fetchRouters]);

  const handleAddRouter = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await routersApi.add({ ...form, port: parseInt(form.port) });
      toast.success('Router added');
      setForm({ name: '', ip_address: '', username: 'admin', password: '', port: '8728', auth_type: 'radius', is_default: true });
      setShowForm(false);
      fetchRouters(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete router "${name}"?`)) return;
    try {
      await routersApi.remove(id);
      toast.success('Router deleted');
      setTestResults((prev) => { const n = { ...prev }; delete n[id]; return n; });
      fetchRouters(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const startEdit = (router) => {
    setEditingId(router.id);
    setEditForm({
      name: router.name,
      ip_address: router.ip_address,
      username: router.username,
      password: '',
      port: String(router.port),
      auth_type: router.auth_type || 'radius',
      is_default: router.is_default,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    setEditSaving(true);
    try {
      const payload = { ...editForm, port: parseInt(editForm.port) };
      if (!payload.password) delete payload.password;
      await routersApi.update(editingId, payload);
      toast.success('Router updated');
      setEditingId(null);
      fetchRouters(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEditSaving(false);
    }
  };

  // System Logs helper functions
  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setLogs(MOCK_LOGS);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const getFilteredLogs = () => {
    return logs.filter(log => {
      const categoryMatch = logFilter === 'all' || log.category === logFilter;
      const levelMatch = logLevelFilter === 'all' || log.level === logLevelFilter;
      return categoryMatch && levelMatch;
    });
  };

  const getLogLevelColor = (level) => {
    switch (level) {
      case 'error': return 'bg-red-100 text-red-700 border-red-200';
      case 'warning': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'info': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getLogLevelIcon = (level) => {
    switch (level) {
      case 'error': return <XCircle size={14} className="text-red-600" />;
      case 'warning': return <AlertTriangle size={14} className="text-amber-600" />;
      case 'info': return <Activity size={14} className="text-blue-600" />;
      default: return <FileText size={14} className="text-gray-600" />;
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'auth': return <UserCheck size={14} />;
      case 'system': return <Terminal size={14} />;
      case 'customer': return <User size={14} />;
      case 'radius': return <Activity size={14} />;
      case 'database': return <FileText size={14} />;
      default: return <FileText size={14} />;
    }
  };

  const exportLogs = () => {
    const filtered = getFilteredLogs();
    const csvContent = [
      ['Timestamp', 'Level', 'Category', 'Message', 'User', 'Details'].join(','),
      ...filtered.map(log => [
        log.timestamp,
        log.level,
        log.category,
        '"' + log.message.replace(/"/g, '""') + '"',
        log.user || '',
        '"' + (log.details || '').replace(/"/g, '""') + '"'
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Logs exported to CSV');
  };

  const inputCls = 'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm';

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Settings size={24} />
        Settings
      </h1>

      {/* Company Profile */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <Building2 size={20} />
          Company Profile
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span className="text-sm text-gray-500">Company Name</span>
            <p className="font-medium">{company?.name}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Subscription</span>
            <p className="font-medium">
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                company?.subscription_status === 'active' || company?.subscription_status === 'trial'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {company?.subscription_status?.toUpperCase()}
              </span>
              {' '}
              <span className="text-gray-500">({company?.subscription_plan})</span>
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Expires</span>
            <p className="font-medium">{company?.expires_at ? new Date(company.expires_at).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Router Configuration */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Router size={20} />
            MikroTik Routers
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium transition"
          >
            <Plus size={16} />
            Add Router
          </button>
        </div>

        {/* Add Router Form */}
        {showForm && (
          <form onSubmit={handleAddRouter} className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
            {error && <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Router Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputCls} placeholder="e.g. Main Tower Router" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                <input type="text" value={form.ip_address} onChange={(e) => setForm({ ...form, ip_address: e.target.value })}
                  className={inputCls} placeholder="192.168.88.1" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className={inputCls} placeholder="admin" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={inputCls} placeholder="Router password" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Port</label>
                <input type="number" value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })}
                  className={inputCls} placeholder="8728" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Authentication Mode</label>
                <select value={form.auth_type} onChange={(e) => setForm({ ...form, auth_type: e.target.value })}
                  className={inputCls}>
                  <option value="radius">RADIUS (Recommended)</option>
                  <option value="api">API (Direct PPP Management)</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {form.auth_type === 'radius'
                    ? 'RADIUS handles PPPoE auth. Users are not created on the router.'
                    : 'PPPoE secrets are created directly on the router via API.'}
                </p>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} className="rounded" />
                  Set as default router
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition">
                {saving ? 'Saving...' : 'Save Router'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm transition">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Router List */}
        {loading ? (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : routers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Router size={40} className="mx-auto mb-2 opacity-50" />
            <p>No routers configured yet.</p>
            <p className="text-sm">Add your MikroTik router to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {routers.map((router) => {
              const result = testResults[router.id];
              const isEditing = editingId === router.id;

              return (
                <div key={router.id} className={`border rounded-lg overflow-hidden ${
                  result?.connected ? 'border-green-200' : result && !result.connected ? 'border-red-200' : 'border-gray-200'
                }`}>
                  {/* Status bar */}
                  {result && (
                    <div className={`px-4 py-1.5 text-xs font-medium flex items-center gap-1.5 ${
                      result.connected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                    }`}>
                      {result.connected ? (
                        <>
                          <Wifi size={12} />
                          Connected — {result.identity} (v{result.version}) — Uptime: {result.uptime}
                        </>
                      ) : (
                        <>
                          <WifiOff size={12} />
                          Offline{result.error ? ` — ${result.error}` : ''}
                        </>
                      )}
                    </div>
                  )}
                  {testing[router.id] && !result && (
                    <div className="px-4 py-1.5 text-xs font-medium flex items-center gap-1.5 bg-blue-50 text-blue-600">
                      <Loader2 size={12} className="animate-spin" />
                      Testing connection...
                    </div>
                  )}

                  {/* Router info / edit mode */}
                  <div className="p-4">
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Router Name</label>
                            <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className={inputCls} required />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">IP Address</label>
                            <input type="text" value={editForm.ip_address} onChange={(e) => setEditForm({ ...editForm, ip_address: e.target.value })}
                              className={inputCls} required />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Username</label>
                            <input type="text" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                              className={inputCls} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Password (leave blank to keep)</label>
                            <input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                              className={inputCls} placeholder="Unchanged" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">API Port</label>
                            <input type="number" value={editForm.port} onChange={(e) => setEditForm({ ...editForm, port: e.target.value })}
                              className={inputCls} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Authentication Mode</label>
                            <select value={editForm.auth_type} onChange={(e) => setEditForm({ ...editForm, auth_type: e.target.value })}
                              className={inputCls}>
                              <option value="radius">RADIUS (Recommended)</option>
                              <option value="api">API (Direct PPP Management)</option>
                            </select>
                          </div>
                          <div className="flex items-end">
                            <label className="flex items-center gap-2 text-sm">
                              <input type="checkbox" checked={editForm.is_default} onChange={(e) => setEditForm({ ...editForm, is_default: e.target.checked })} className="rounded" />
                              Default router
                            </label>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={saveEdit} disabled={editSaving}
                            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium flex items-center gap-1 transition">
                            <Check size={14} />
                            {editSaving ? 'Saving...' : 'Save'}
                          </button>
                          <button onClick={cancelEdit}
                            className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-300 text-sm flex items-center gap-1 transition">
                            <X size={14} />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800">{router.name}</span>
                            {router.is_default && (
                              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-medium">DEFAULT</span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                              router.auth_type === 'radius' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {router.auth_type === 'radius' ? 'RADIUS' : 'API'}
                            </span>
                            {result?.connected && (
                              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" title="Connected" />
                            )}
                            {result && !result.connected && (
                              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" title="Offline" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {router.ip_address}:{router.port} (user: {router.username})
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => testConnection(router.id)} disabled={testing[router.id]}
                            className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 text-sm flex items-center gap-1 transition disabled:opacity-50">
                            {testing[router.id] ? <Loader2 size={14} className="animate-spin" /> : <TestTube size={14} />}
                            {testing[router.id] ? 'Testing...' : 'Test'}
                          </button>
                          <button onClick={() => startEdit(router)}
                            className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 text-sm flex items-center gap-1 transition">
                            <Pencil size={14} />
                            Edit
                          </button>
                          <button onClick={() => handleDelete(router.id, router.name)}
                            className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 text-sm flex items-center gap-1 transition">
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* System Logs */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Terminal size={20} className="text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">System Logs</h2>
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">
              {getFilteredLogs().length} entries
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <select 
              value={logFilter} 
              onChange={(e) => setLogFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Categories</option>
              <option value="auth">Authentication</option>
              <option value="customer">Customer</option>
              <option value="system">System</option>
              <option value="radius">RADIUS</option>
              <option value="database">Database</option>
            </select>

            <select 
              value={logLevelFilter} 
              onChange={(e) => setLogLevelFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Levels</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>

            <button 
              onClick={fetchLogs}
              disabled={logsLoading}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw size={14} className={logsLoading ? 'animate-spin' : ''} />
              Refresh
            </button>

            <button 
              onClick={exportLogs}
              className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition flex items-center gap-1.5"
            >
              <Download size={14} />
              Export
            </button>
          </div>
        </div>

        {/* Log Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-red-50 border border-red-100 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-red-600 text-xs font-medium mb-1">
              <XCircle size={12} />
              Errors
            </div>
            <p className="text-xl font-bold text-red-700">{logs.filter(l => l.level === 'error').length}</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-amber-600 text-xs font-medium mb-1">
              <AlertTriangle size={12} />
              Warnings
            </div>
            <p className="text-xl font-bold text-amber-700">{logs.filter(l => l.level === 'warning').length}</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-blue-600 text-xs font-medium mb-1">
              <Activity size={12} />
              Info
            </div>
            <p className="text-xl font-bold text-blue-700">{logs.filter(l => l.level === 'info').length}</p>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-gray-600 text-xs font-medium mb-1">
              <FileText size={12} />
              Total
            </div>
            <p className="text-xl font-bold text-gray-700">{logs.length}</p>
          </div>
        </div>

        {/* Logs Table */}
        {logsLoading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Loader2 size={24} className="animate-spin" />
            <span className="ml-2">Loading logs...</span>
          </div>
        ) : getFilteredLogs().length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FileText size={40} className="mx-auto mb-2 opacity-50" />
            <p>No logs found matching your filters.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {getFilteredLogs().map((log) => (
              <div 
                key={log.id} 
                className={`border rounded-lg overflow-hidden transition-all ${
                  expandedLog === log.id ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div 
                  className="p-3 cursor-pointer"
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${getLogLevelColor(log.level).split(' ')[0]}`}>
                      {getLogLevelIcon(log.level)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${getLogLevelColor(log.level)}`}>
                          {log.level.toUpperCase()}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {getCategoryIcon(log.category)}
                          {log.category}
                        </span>
                        {log.user && (
                          <span className="text-xs text-gray-400">
                            by {log.user}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-800 mt-1 font-medium">{log.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(log.timestamp).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </p>
                    </div>
                    
                    <div className="text-gray-400">
                      {expandedLog === log.id ? <X size={16} /> : <ChevronRight size={16} />}
                    </div>
                  </div>
                </div>
                
                {expandedLog === log.id && (
                  <div className="px-3 pb-3 pt-0">
                    <div className="bg-gray-50 rounded-lg p-3 mt-2 border border-gray-100">
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Details</h4>
                      <p className="text-sm text-gray-700 font-mono">{log.details}</p>
                      {log.user && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <span className="text-xs text-gray-500">User: </span>
                          <span className="text-sm text-gray-700">{log.user}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
