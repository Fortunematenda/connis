import { useState, useEffect, useCallback } from 'react';
import {
  Router, Wifi, WifiOff, Plus, Trash2, TestTube, Pencil, X, Check,
  Loader2, Globe, Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { routersApi } from '../services/api';

const inputCls = 'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm';

export default function NetworkPage() {
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

  useEffect(() => { fetchRouters(true); }, [fetchRouters]);

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
      name: router.name, ip_address: router.ip_address, username: router.username,
      password: '', port: String(router.port), auth_type: router.auth_type || 'radius', is_default: router.is_default,
    });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({}); };

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

  const connectedCount = routers.filter(r => testResults[r.id]?.connected).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Globe size={24} />
            Network
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage your MikroTik routers and network configuration</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-amber-500/90 text-white px-4 py-2.5 rounded-xl hover:bg-amber-600 flex items-center gap-2 text-sm font-medium transition shadow-sm">
          <Plus size={16} /> Add Router
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider mb-1"><Router size={14} /> Total Routers</div>
          <p className="text-2xl font-bold text-gray-900">{routers.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider mb-1"><Wifi size={14} className="text-green-500" /> Online</div>
          <p className="text-2xl font-bold text-green-600">{connectedCount}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider mb-1"><WifiOff size={14} className="text-red-400" /> Offline</div>
          <p className="text-2xl font-bold text-red-500">{routers.length - connectedCount}</p>
        </div>
      </div>

      {/* Add Router Form */}
      {showForm && (
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Add New Router</h3>
          <form onSubmit={handleAddRouter} className="space-y-4">
            {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <select value={form.auth_type} onChange={(e) => setForm({ ...form, auth_type: e.target.value })} className={inputCls}>
                  <option value="radius">RADIUS (Recommended)</option>
                  <option value="api">API (Direct PPP Management)</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {form.auth_type === 'radius' ? 'RADIUS handles PPPoE auth. Users are not created on the router.' : 'PPPoE secrets are created directly on the router via API.'}
                </p>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} className="rounded" />
                  Set as default router
                </label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={saving}
                className="bg-amber-500/90 text-white px-5 py-2 rounded-lg hover:bg-amber-600 disabled:opacity-50 text-sm font-medium transition">
                {saving ? 'Saving...' : 'Save Router'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="bg-gray-100 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-200 text-sm transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Router List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : routers.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Router size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">No routers configured yet</p>
          <p className="text-sm text-gray-400 mt-1">Add your MikroTik router to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {routers.map((router) => {
            const result = testResults[router.id];
            const isEditing = editingId === router.id;
            return (
              <div key={router.id} className={`bg-white rounded-xl border overflow-hidden transition-all ${
                result?.connected ? 'border-green-200' : result && !result.connected ? 'border-red-200' : ''
              }`}>
                {/* Status bar */}
                {result && (
                  <div className={`px-5 py-2 text-xs font-medium flex items-center gap-2 ${
                    result.connected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                  }`}>
                    {result.connected ? (
                      <><Wifi size={12} /> Connected — {result.identity} (v{result.version}) — Uptime: {result.uptime}</>
                    ) : (
                      <><WifiOff size={12} /> Offline{result.error ? ` — ${result.error}` : ''}</>
                    )}
                  </div>
                )}
                {testing[router.id] && !result && (
                  <div className="px-5 py-2 text-xs font-medium flex items-center gap-2 bg-blue-50 text-blue-600">
                    <Loader2 size={12} className="animate-spin" /> Testing connection...
                  </div>
                )}

                <div className="p-5">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Router Name</label>
                          <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={inputCls} required />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">IP Address</label>
                          <input type="text" value={editForm.ip_address} onChange={(e) => setEditForm({ ...editForm, ip_address: e.target.value })} className={inputCls} required />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Username</label>
                          <input type="text" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Password (leave blank to keep)</label>
                          <input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} className={inputCls} placeholder="Unchanged" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">API Port</label>
                          <input type="number" value={editForm.port} onChange={(e) => setEditForm({ ...editForm, port: e.target.value })} className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Authentication Mode</label>
                          <select value={editForm.auth_type} onChange={(e) => setEditForm({ ...editForm, auth_type: e.target.value })} className={inputCls}>
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
                          className="bg-amber-500/90 text-white px-4 py-2 rounded-lg hover:bg-amber-600 disabled:opacity-50 text-sm font-medium flex items-center gap-1.5 transition">
                          <Check size={14} /> {editSaving ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={cancelEdit}
                          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm flex items-center gap-1.5 transition">
                          <X size={14} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-800">{router.name}</span>
                          {router.is_default && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">DEFAULT</span>}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            router.auth_type === 'radius' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {router.auth_type === 'radius' ? 'RADIUS' : 'API'}
                          </span>
                          {result?.connected && <span className="w-2.5 h-2.5 rounded-full bg-green-500" title="Connected" />}
                          {result && !result.connected && <span className="w-2.5 h-2.5 rounded-full bg-red-500" title="Offline" />}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{router.ip_address}:{router.port} (user: {router.username})</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => testConnection(router.id)} disabled={testing[router.id]}
                          className="bg-green-50 text-green-700 px-3 py-2 rounded-lg hover:bg-green-100 text-sm flex items-center gap-1.5 transition disabled:opacity-50">
                          {testing[router.id] ? <Loader2 size={14} className="animate-spin" /> : <TestTube size={14} />}
                          {testing[router.id] ? 'Testing...' : 'Test'}
                        </button>
                        <button onClick={() => startEdit(router)}
                          className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 text-sm flex items-center gap-1.5 transition">
                          <Pencil size={14} /> Edit
                        </button>
                        <button onClick={() => handleDelete(router.id, router.name)}
                          className="bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 text-sm flex items-center gap-1.5 transition">
                          <Trash2 size={14} /> Delete
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
  );
}
