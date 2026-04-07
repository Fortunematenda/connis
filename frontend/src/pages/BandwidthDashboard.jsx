import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, AlertTriangle, ArrowUpCircle, ArrowDownCircle, Loader2,
  Shield, ShieldOff, RefreshCw, Settings, Wifi, WifiOff, ChevronDown,
  ChevronUp, Zap, Users, Clock, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { bandwidthApi } from '../services/api';

const fmtBytes = (b) => {
  const n = Number(b) || 0;
  if (n <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(n) / Math.log(k)), sizes.length - 1);
  return parseFloat((n / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
const fmtMbps = (v) => (parseFloat(v) || 0).toFixed(2) + ' Mbps';
const fmtUptime = (s) => {
  if (!s) return '—';
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};
const fmtDate = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

export default function BandwidthDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('all'); // all, online, flagged
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [expandedUser, setExpandedUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await bandwidthApi.getLive();
      setUsers(res.data || []);
    } catch { /* ignore */ }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 30s
  useEffect(() => {
    const timer = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(timer);
  }, [fetchData]);

  const fetchSettings = async () => {
    try {
      const res = await bandwidthApi.getSettings();
      setSettings(res.data);
    } catch {}
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await bandwidthApi.updateSettings(settings);
      toast.success('Settings saved');
      setSettingsOpen(false);
    } catch (err) { toast.error(err.message || 'Failed to save'); }
    setSavingSettings(false);
  };

  const handleThrottle = async (userId, username) => {
    if (!confirm(`Throttle user "${username}"? They will be disconnected and reconnect with reduced speeds.`)) return;
    try {
      await bandwidthApi.throttle(userId, 'Manual throttle by admin');
      toast.success(`${username} throttled`);
      fetchData(true);
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const handleUnthrottle = async (userId, username) => {
    try {
      await bandwidthApi.unthrottle(userId);
      toast.success(`${username} restored`);
      fetchData(true);
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const toggleExpand = async (userId) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
      return;
    }
    setExpandedUser(userId);
    setHistoryLoading(true);
    try {
      const res = await bandwidthApi.getHistory(userId);
      setHistory(res.data || []);
    } catch { setHistory([]); }
    setHistoryLoading(false);
  };

  const filtered = tab === 'all' ? users
    : tab === 'online' ? users.filter(u => u.is_online)
    : users.filter(u => u.is_flagged);

  const onlineCount = users.filter(u => u.is_online).length;
  const flaggedCount = users.filter(u => u.is_flagged).length;
  const topUploader = users.find(u => u.is_online && u.current_upload_mbps > 0);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-indigo-500" /></div>;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bandwidth Control</h1>
          <p className="text-sm text-gray-400 mt-0.5">Live usage monitoring, abuse detection & throttling</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchData(true)} disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border rounded-lg hover:bg-gray-50">
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => { setSettingsOpen(true); fetchSettings(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border rounded-lg hover:bg-gray-50">
            <Settings size={13} /> Settings
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={<Users size={20} />} label="Total Users" value={users.length} color="indigo" />
        <SummaryCard icon={<Wifi size={20} />} label="Online Now" value={onlineCount} color="emerald" />
        <SummaryCard icon={<AlertTriangle size={20} />} label="Flagged" value={flaggedCount} color="red" />
        <SummaryCard icon={<Zap size={20} />} label="Top Upload" value={topUploader ? fmtMbps(topUploader.current_upload_mbps) : '—'} sub={topUploader?.username || ''} color="amber" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {[
          { key: 'all', label: `All (${users.length})` },
          { key: 'online', label: `Online (${onlineCount})` },
          { key: 'flagged', label: `Flagged (${flaggedCount})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] text-gray-500 uppercase tracking-wider border-b bg-gray-50/50">
                <th className="px-4 py-3">User</th>
                <th className="px-3 py-3">Plan</th>
                <th className="px-3 py-3">Rate Limit</th>
                <th className="px-3 py-3 text-right">↑ Upload</th>
                <th className="px-3 py-3 text-right">↓ Download</th>
                <th className="px-3 py-3 text-right">Session</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr><td colSpan="8" className="px-4 py-12 text-center text-gray-400">No users in this view</td></tr>
              ) : filtered.map(u => (
                <UserRow key={u.id} user={u}
                  expanded={expandedUser === u.id}
                  onToggle={() => toggleExpand(u.id)}
                  onThrottle={() => handleThrottle(u.id, u.username)}
                  onUnthrottle={() => handleUnthrottle(u.id, u.username)}
                  onNavigate={() => navigate(`/customers/${u.id}`)}
                  history={expandedUser === u.id ? history : []}
                  historyLoading={historyLoading && expandedUser === u.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settings Modal */}
      {settingsOpen && settings && (
        <SettingsModal settings={settings} setSettings={setSettings}
          onSave={saveSettings} saving={savingSettings}
          onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, sub, color }) {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <div className="bg-white rounded-2xl border p-4">
      <div className={`p-2 rounded-lg w-fit ${colorMap[color]}`}>{icon}</div>
      <p className="text-xl font-bold text-gray-900 mt-2">{value}</p>
      {sub && <p className="text-[10px] text-gray-400 truncate">{sub}</p>}
      <p className="text-[11px] font-medium text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function UserRow({ user: u, expanded, onToggle, onThrottle, onUnthrottle, onNavigate, history, historyLoading }) {
  const uploadHigh = u.current_upload_mbps > 1.5;

  return (
    <>
      <tr className={`hover:bg-gray-50/50 ${u.is_flagged ? 'bg-red-50/30' : ''}`}>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full shrink-0 ${u.is_online ? 'bg-emerald-500' : 'bg-gray-300'}`} />
            <div className="min-w-0">
              <button onClick={onNavigate} className="text-sm font-medium text-gray-900 hover:text-indigo-600 truncate block">{u.full_name || u.username}</button>
              <p className="text-[10px] text-gray-400 truncate">{u.username}</p>
            </div>
          </div>
        </td>
        <td className="px-3 py-3 text-xs text-gray-600">{u.plan_name || '—'}</td>
        <td className="px-3 py-3">
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${u.is_flagged ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
            {u.rate_limit}
          </span>
        </td>
        <td className={`px-3 py-3 text-right text-xs font-semibold ${uploadHigh ? 'text-red-600' : 'text-gray-700'}`}>
          {u.is_online ? fmtMbps(u.current_upload_mbps) : '—'}
        </td>
        <td className="px-3 py-3 text-right text-xs text-gray-600">
          {u.is_online ? fmtMbps(u.current_download_mbps) : '—'}
        </td>
        <td className="px-3 py-3 text-right text-[11px] text-gray-500">
          {u.is_online ? (
            <span className="flex items-center gap-1 justify-end"><Clock size={10} />{fmtUptime(u.session_seconds)}</span>
          ) : '—'}
        </td>
        <td className="px-3 py-3">
          {u.is_flagged ? (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
              <AlertTriangle size={9} /> Throttled
            </span>
          ) : u.is_online ? (
            <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">Normal</span>
          ) : (
            <span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Offline</span>
          )}
        </td>
        <td className="px-3 py-3 text-right">
          <div className="flex items-center gap-1 justify-end">
            {u.is_flagged ? (
              <button onClick={onUnthrottle} title="Restore"
                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"><ShieldOff size={14} /></button>
            ) : u.is_online ? (
              <button onClick={onThrottle} title="Throttle"
                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"><Shield size={14} /></button>
            ) : null}
            <button onClick={onToggle} title="Usage history"
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan="8" className="px-4 py-3 bg-gray-50/50">
            {historyLoading ? (
              <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-gray-400" /></div>
            ) : history.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-gray-500 uppercase">Recent Usage Samples (last 24h)</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  {history.slice(0, 20).map((h, i) => (
                    <div key={i} className="bg-white border rounded-lg p-2">
                      <p className="text-gray-400">{fmtDate(h.sampled_at)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-0.5 text-red-500"><ArrowUpCircle size={10} />{fmtMbps(h.upload_rate)}</span>
                        <span className="flex items-center gap-0.5 text-blue-500"><ArrowDownCircle size={10} />{fmtMbps(h.download_rate)}</span>
                      </div>
                      <p className="text-gray-300 mt-0.5">↑{fmtBytes(h.upload_bytes)} ↓{fmtBytes(h.download_bytes)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">No usage data recorded yet</p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function SettingsModal({ settings, setSettings, onSave, saving, onClose }) {
  const update = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-base font-semibold text-gray-900">Bandwidth Monitor Settings</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <Field label="Upload Threshold (Mbps)" sub="Flag users when upload exceeds this">
            <input type="number" step="0.1" min="0.1" value={settings.upload_threshold_mbps || ''}
              onChange={e => update('upload_threshold_mbps', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg text-sm" />
          </Field>
          <Field label="Sustained Minutes" sub="How long upload must be high before flagging">
            <input type="number" min="1" value={settings.sustained_minutes || ''}
              onChange={e => update('sustained_minutes', parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg text-sm" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Throttled Download">
              <input type="text" value={settings.throttle_download || ''}
                onChange={e => update('throttle_download', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="5M" />
            </Field>
            <Field label="Throttled Upload">
              <input type="text" value={settings.throttle_upload || ''}
                onChange={e => update('throttle_upload', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="1M" />
            </Field>
          </div>
          <Field label="Auto-Recovery" sub="Automatically restore users when usage normalizes">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={settings.auto_recover || false}
                onChange={e => update('auto_recover', e.target.checked)}
                className="rounded border-gray-300" />
              <span className="text-sm text-gray-700">Enabled</span>
            </label>
          </Field>
          {settings.auto_recover && (
            <Field label="Recovery Minutes" sub="Minutes of normal usage before auto-restore">
              <input type="number" min="1" value={settings.recover_minutes || ''}
                onChange={e => update('recover_minutes', parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </Field>
          )}
          <Field label="Monitor Enabled">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={settings.enabled || false}
                onChange={e => update('enabled', e.target.checked)}
                className="rounded border-gray-300" />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </Field>
        </div>
        <div className="px-5 py-3 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button onClick={onSave} disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, sub, children }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-700">{label}</label>
      {sub && <p className="text-[10px] text-gray-400 mb-1">{sub}</p>}
      {children}
    </div>
  );
}
