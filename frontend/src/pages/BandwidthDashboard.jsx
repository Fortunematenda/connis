import { useState, useEffect, useCallback, memo, useMemo, useRef, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, ArrowUpCircle, ArrowDownCircle, Loader2,
  Shield, ShieldOff, RefreshCw, Settings, ChevronDown,
  ChevronUp, Users, Clock, X, Download, Upload, Wifi,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from 'recharts';
import toast from 'react-hot-toast';
import { bandwidthApi } from '../services/api';

// ── Utilities ──────────────────────────────────────────────────
const fmtBytes = (b) => {
  const n = Number(b) || 0;
  if (n <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(n) / Math.log(k)), sizes.length - 1);
  return parseFloat((n / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
const fmtGB = (b) => {
  const n = Number(b) || 0;
  if (n <= 0) return '0';
  return (n / 1073741824).toFixed(2);
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
const fmtTime = (t) => {
  if (!t) return '';
  return new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const RANGES = [
  { key: '1h', label: 'Last 1 Hour' },
  { key: '24h', label: 'Last 24 Hours' },
  { key: '7d', label: 'Last 7 Days' },
];

// ── Main Dashboard ─────────────────────────────────────────────
export default function BandwidthDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [aggregate, setAggregate] = useState({ series: [], today_upload_bytes: 0, today_download_bytes: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('online');
  const [range, setRange] = useState('1h');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [expandedUser, setExpandedUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [liveRes, aggRes] = await Promise.all([
        bandwidthApi.getLive(),
        bandwidthApi.getAggregate(range),
      ]);
      setUsers(liveRes.data || []);
      setAggregate(aggRes.data || { series: [], today_upload_bytes: 0, today_download_bytes: 0 });
    } catch { /* ignore */ }
    setLoading(false);
    setRefreshing(false);
  }, [range]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-refresh every 10s
  useEffect(() => {
    const timer = setInterval(() => fetchAll(true), 10000);
    return () => clearInterval(timer);
  }, [fetchAll]);

  // Re-fetch aggregate when range changes
  useEffect(() => {
    bandwidthApi.getAggregate(range).then(r => setAggregate(r.data || aggregate)).catch(() => {});
  }, [range]);

  const fetchSettings = async () => {
    try { const res = await bandwidthApi.getSettings(); setSettings(res.data); } catch {}
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
      fetchAll(true);
    } catch (err) { toast.error(err.message || 'Failed'); }
  };
  const handleUnthrottle = async (userId, username) => {
    try {
      await bandwidthApi.unthrottle(userId);
      toast.success(`${username} restored`);
      fetchAll(true);
    } catch (err) { toast.error(err.message || 'Failed'); }
  };
  const toggleExpand = async (userId) => {
    if (expandedUser === userId) { setExpandedUser(null); return; }
    setExpandedUser(userId);
    setHistoryLoading(true);
    try { const res = await bandwidthApi.getHistory(userId); setHistory(res.data || []); }
    catch { setHistory([]); }
    setHistoryLoading(false);
  };

  const filtered = useMemo(() => {
    if (tab === 'online') return users.filter(u => u.is_online);
    if (tab === 'flagged') return users.filter(u => u.is_flagged);
    return users;
  }, [users, tab]);

  const onlineCount = useMemo(() => users.filter(u => u.is_online).length, [users]);
  const flaggedCount = useMemo(() => users.filter(u => u.is_flagged).length, [users]);
  const currentDown = useMemo(() => users.reduce((s, u) => s + (u.is_online ? u.current_download_mbps : 0), 0), [users]);
  const currentUp = useMemo(() => users.reduce((s, u) => s + (u.is_online ? u.current_upload_mbps : 0), 0), [users]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bandwidth Monitor</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Real-time network usage &bull; Auto-refreshes every 10s
            {refreshing && <Loader2 size={10} className="inline ml-1.5 animate-spin" />}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchAll(true)} disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border rounded-lg hover:bg-gray-50 transition">
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => { setSettingsOpen(true); fetchSettings(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border rounded-lg hover:bg-gray-50 transition">
            <Settings size={13} /> Settings
          </button>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard icon={<Download size={18} />} label="Total Download Today"
          value={`${fmtGB(aggregate.today_download_bytes)} GB`} color="blue" />
        <KpiCard icon={<Upload size={18} />} label="Total Upload Today"
          value={`${fmtGB(aggregate.today_upload_bytes)} GB`} color="purple" />
        <KpiCard icon={<ArrowDownCircle size={18} />} label="Current Download"
          value={`${currentDown.toFixed(1)} Mbps`} color="sky" />
        <KpiCard icon={<ArrowUpCircle size={18} />} label="Current Upload"
          value={`${currentUp.toFixed(1)} Mbps`} color="rose" />
        <KpiCard icon={<Users size={18} />} label="Active Users"
          value={onlineCount} sub={`${flaggedCount} flagged`} color="emerald" />
      </div>

      {/* ── Live Marquee Chart ────────────────────────────────── */}
      <AggregateLiveChart uploadMbps={currentUp} downloadMbps={currentDown} />

      {/* ── Historical Chart ───────────────────────────────────── */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-800">Network Bandwidth</h2>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            {RANGES.map(r => (
              <button key={r.key} onClick={() => setRange(r.key)}
                className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-all ${
                  range === r.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>{r.label}</button>
            ))}
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={aggregate.series} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gdDown" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gdUp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="timestamp" tickFormatter={fmtTime} tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={v => `${v}`} unit=" Mbps" />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="download" stroke="#3b82f6" strokeWidth={2}
                fill="url(#gdDown)" name="Download" />
              <Area type="monotone" dataKey="upload" stroke="#8b5cf6" strokeWidth={2}
                fill="url(#gdUp)" name="Upload" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {aggregate.series.length === 0 && (
          <p className="text-center text-xs text-gray-400 -mt-32 relative z-10">
            Collecting data... Chart will populate after a few monitor cycles.
          </p>
        )}
      </div>

      {/* ── Tabs + User Table ────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'all', label: `All (${users.length})` },
            { key: 'online', label: `Online (${onlineCount})` },
            { key: 'flagged', label: `Flagged (${flaggedCount})` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>{t.label}</button>
          ))}
        </div>
        <p className="text-[10px] text-gray-400">{filtered.length} users</p>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] text-gray-500 uppercase tracking-wider border-b bg-gray-50/60">
                <th className="pl-4 pr-2 py-2.5 w-10">#</th>
                <th className="px-3 py-2.5">Client</th>
                <th className="px-3 py-2.5">Username</th>
                <th className="px-3 py-2.5">Plan</th>
                <th className="px-3 py-2.5 text-right">↑ Upload</th>
                <th className="px-3 py-2.5 text-right">↓ Download</th>
                <th className="px-3 py-2.5 text-right">Total (GB)</th>
                <th className="px-3 py-2.5 text-right">Session</th>
                <th className="px-3 py-2.5 text-center">Status</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan="10" className="px-4 py-12 text-center text-gray-400">No users in this view</td></tr>
              ) : filtered.map((u, idx) => (
                <UserRow key={u.id} user={u} seq={idx + 1}
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

// ── Chart Tooltip ──────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{label ? fmtTime(label) : ''}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold">{(p.value || 0).toFixed(2)} Mbps</span>
        </p>
      ))}
    </div>
  );
}

// ── KPI Card ───────────────────────────────────────────────────
const KpiCard = memo(function KpiCard({ icon, label, value, sub, color }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    sky: 'from-sky-500 to-cyan-600',
    rose: 'from-rose-500 to-pink-600',
    emerald: 'from-emerald-500 to-teal-600',
  };
  const bgLight = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    sky: 'bg-sky-50 text-sky-600',
    rose: 'bg-rose-50 text-rose-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };
  return (
    <div className="bg-white rounded-xl border p-3.5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg ${bgLight[color]}`}>{icon}</div>
      </div>
      <p className="text-lg font-bold text-gray-900 mt-2 leading-tight">{value}</p>
      {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
      <p className="text-[10px] font-medium text-gray-500 mt-0.5">{label}</p>
    </div>
  );
});

// ── User Row ───────────────────────────────────────────────────
const UserRow = memo(function UserRow({ user: u, seq, expanded, onToggle, onThrottle, onUnthrottle, onNavigate, history, historyLoading }) {
  const uploadColor = u.current_upload_mbps > 1.5 ? 'text-red-600 font-bold' :
    u.current_upload_mbps < 1 ? 'text-emerald-600' : 'text-amber-600';
  const totalGB = ((Number(u.upload_bytes) + Number(u.download_bytes)) / 1073741824).toFixed(2);

  return (
    <>
      <tr className={`hover:bg-gray-50/70 transition-colors ${u.is_flagged ? 'bg-red-50/40' : ''}`}>
        <td className="pl-4 pr-2 py-2.5 text-[10px] text-gray-400 font-mono">{seq}</td>
        <td className="px-3 py-2.5">
          <button onClick={onNavigate} className="text-sm font-medium text-gray-900 hover:text-indigo-600 truncate block max-w-[140px]">
            {u.full_name || u.username}
          </button>
        </td>
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${u.is_online ? 'bg-emerald-500' : 'bg-gray-300'}`} />
            <span className="text-xs text-gray-500 font-mono truncate max-w-[100px]">{u.username}</span>
          </div>
        </td>
        <td className="px-3 py-2.5 text-xs text-gray-600">{u.plan_name || '—'}</td>
        <td className={`px-3 py-2.5 text-right text-xs ${u.is_online ? uploadColor : 'text-gray-300'}`}>
          {u.is_online ? fmtMbps(u.current_upload_mbps) : '—'}
        </td>
        <td className="px-3 py-2.5 text-right text-xs text-blue-600">
          {u.is_online ? fmtMbps(u.current_download_mbps) : '—'}
        </td>
        <td className="px-3 py-2.5 text-right text-xs text-gray-600">
          {u.is_online ? totalGB : '—'}
        </td>
        <td className="px-3 py-2.5 text-right text-[11px] text-gray-500">
          {u.is_online ? (
            <span className="flex items-center gap-1 justify-end"><Clock size={10} />{fmtUptime(u.session_seconds)}</span>
          ) : '—'}
        </td>
        <td className="px-3 py-2.5 text-center">
          {u.is_flagged ? (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full whitespace-nowrap">
              <AlertTriangle size={9} /> Throttled
            </span>
          ) : u.is_online ? (
            <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">Normal</span>
          ) : (
            <span className="text-[9px] font-bold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Offline</span>
          )}
        </td>
        <td className="px-3 py-2.5 text-right">
          <div className="flex items-center gap-0.5 justify-end">
            {u.is_flagged ? (
              <button onClick={onUnthrottle} title="Restore speed"
                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"><ShieldOff size={14} /></button>
            ) : u.is_online ? (
              <button onClick={onThrottle} title="Throttle user"
                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"><Shield size={14} /></button>
            ) : null}
            <button onClick={onToggle} title="Usage chart"
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan="10" className="p-0">
            <ExpandedRow history={history} loading={historyLoading} username={u.username} />
          </td>
        </tr>
      )}
    </>
  );
});

// ── Expanded Row with Mini Chart ───────────────────────────────
function ExpandedRow({ history, loading, username }) {
  if (loading) {
    return <div className="flex justify-center py-6 bg-gray-50/60"><Loader2 size={16} className="animate-spin text-gray-400" /></div>;
  }
  if (!history.length) {
    return <div className="py-6 text-center text-xs text-gray-400 bg-gray-50/60">No usage data recorded yet for {username}</div>;
  }

  const chartData = [...history].reverse().slice(-30).map(h => ({
    time: fmtTime(h.sampled_at),
    upload: parseFloat(h.upload_rate) || 0,
    download: parseFloat(h.download_rate) || 0,
  }));

  return (
    <div className="bg-gray-50/60 border-t px-4 py-3">
      <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">
        {username} &mdash; Upload vs Download (last 30 samples)
      </p>
      <div className="h-36 bg-white rounded-lg border p-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id={`muD-${username}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id={`muU-${username}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false}
              tickFormatter={v => `${v} Mbps`} />
            <Tooltip content={<MiniTooltip />} />
            <Area type="monotone" dataKey="download" stroke="#3b82f6" strokeWidth={1.5}
              fill={`url(#muD-${username})`} name="Download" />
            <Area type="monotone" dataKey="upload" stroke="#ef4444" strokeWidth={1.5}
              fill={`url(#muU-${username})`} name="Upload" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MiniTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white rounded px-2 py-1.5 text-[10px] shadow-lg">
      {payload.map((p, i) => (
        <p key={i}><span style={{ color: p.color }}>{p.name}</span>: {(p.value || 0).toFixed(2)} Mbps</p>
      ))}
    </div>
  );
}

// ── Settings Modal ─────────────────────────────────────────────
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

// ── Aggregate Live Marquee Chart ───────────────────────────────
const AGG_H = 280;
const AGG_PAD = { top: 20, right: 16, bottom: 40, left: 72 };
const AGG_DURATIONS = [
  { ms: 60000, label: '1 min' },
  { ms: 120000, label: '2 min' },
  { ms: 300000, label: '5 min' },
];

function aggFmtBps(mbps) {
  if (!mbps || mbps <= 0) return '0 Mbps';
  if (mbps >= 1000) return (mbps / 1000).toFixed(2) + ' Gbps';
  return mbps.toFixed(2) + ' Mbps';
}
function aggFmtTime(ts) {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function aggNiceMax(val) {
  if (val <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(val)));
  return Math.ceil(val / exp) * exp;
}

function AggregateLiveChart({ uploadMbps, downloadMbps }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const dataRef = useRef([]);
  const durationRef = useRef(120000);
  const animRef = useRef(null);
  const [duration, setDuration] = useState(120000);
  const [rates, setRates] = useState({ upload: 0, download: 0 });

  durationRef.current = duration;

  // Push new data point whenever rates change
  useEffect(() => {
    const now = Date.now();
    const up = Number(uploadMbps) || 0;
    const down = Number(downloadMbps) || 0;
    if (up > 0 || down > 0) {
      dataRef.current.push({ time: now, upload: up, download: down });
      const cutoff = now - 600000;
      dataRef.current = dataRef.current.filter(p => p.time > cutoff);
    }
    setRates({ upload: up, download: down });
  }, [uploadMbps, downloadMbps]);

  // Pre-seed with zeros
  useEffect(() => {
    const now = Date.now();
    const seed = [];
    for (let t = now - 600000; t <= now; t += 10000) {
      seed.push({ time: t, upload: 0, download: 0 });
    }
    dataRef.current = seed;
  }, []);

  // Canvas draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      const container = containerRef.current;
      if (!container) { animRef.current = requestAnimationFrame(draw); return; }

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = rect.width;
      const h = AGG_H;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cw = w - AGG_PAD.left - AGG_PAD.right;
      const ch = h - AGG_PAD.top - AGG_PAD.bottom;
      ctx.clearRect(0, 0, w, h);

      const now = Date.now();
      const dur = durationRef.current;
      const tStart = now - dur;
      const tEnd = now;
      const pts = dataRef.current.filter(p => p.time >= tStart && p.time <= tEnd);

      let maxVal = 0;
      pts.forEach(p => { maxVal = Math.max(maxVal, p.upload, p.download); });
      maxVal = aggNiceMax(maxVal);

      // Horizontal grid
      ctx.strokeStyle = '#f0f0f0';
      ctx.lineWidth = 1;
      const gridRows = 5;
      for (let i = 0; i <= gridRows; i++) {
        const y = AGG_PAD.top + (ch / gridRows) * i;
        ctx.beginPath();
        ctx.moveTo(AGG_PAD.left, y);
        ctx.lineTo(AGG_PAD.left + cw, y);
        ctx.stroke();
      }

      // Vertical grid
      const tickInterval = dur <= 60000 ? 10000 : dur <= 120000 ? 20000 : 30000;
      const firstTick = Math.ceil(tStart / tickInterval) * tickInterval;
      ctx.strokeStyle = '#f5f5f5';
      for (let t = firstTick; t <= tEnd; t += tickInterval) {
        const x = AGG_PAD.left + ((t - tStart) / (tEnd - tStart)) * cw;
        ctx.beginPath();
        ctx.moveTo(x, AGG_PAD.top);
        ctx.lineTo(x, AGG_PAD.top + ch);
        ctx.stroke();
      }

      // Y-axis labels
      ctx.fillStyle = '#9ca3af';
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (let i = 0; i <= gridRows; i++) {
        const y = AGG_PAD.top + (ch / gridRows) * i;
        const val = maxVal * (1 - i / gridRows);
        ctx.fillText(aggFmtBps(val), AGG_PAD.left - 8, y);
      }

      // X-axis labels
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (let t = firstTick; t <= tEnd; t += tickInterval) {
        const x = AGG_PAD.left + ((t - tStart) / (tEnd - tStart)) * cw;
        ctx.fillText(aggFmtTime(t), x, AGG_PAD.top + ch + 6);
      }

      // Draw filled area with smooth bezier
      function drawArea(data, key, strokeColor, fillColor) {
        if (data.length < 2) return;
        const toX = (t) => AGG_PAD.left + ((t - tStart) / (tEnd - tStart)) * cw;
        const toY = (v) => AGG_PAD.top + ch - (v / maxVal) * ch;

        ctx.beginPath();
        ctx.moveTo(toX(data[0].time), AGG_PAD.top + ch);
        for (let i = 0; i < data.length; i++) {
          const x = toX(data[i].time);
          const y = toY(data[i][key]);
          if (i === 0) ctx.lineTo(x, y);
          else {
            const prev = data[i - 1];
            const px = toX(prev.time);
            const py = toY(prev[key]);
            const cpx = (px + x) / 2;
            ctx.bezierCurveTo(cpx, py, cpx, y, x, y);
          }
        }
        ctx.lineTo(toX(data[data.length - 1].time), AGG_PAD.top + ch);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();

        ctx.beginPath();
        for (let i = 0; i < data.length; i++) {
          const x = toX(data[i].time);
          const y = toY(data[i][key]);
          if (i === 0) ctx.moveTo(x, y);
          else {
            const prev = data[i - 1];
            const px = toX(prev.time);
            const py = toY(prev[key]);
            const cpx = (px + x) / 2;
            ctx.bezierCurveTo(cpx, py, cpx, y, x, y);
          }
        }
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      drawArea(pts, 'upload', '#c084fc', 'rgba(192,132,252,0.2)');
      drawArea(pts, 'download', '#60a5fa', 'rgba(96,165,250,0.2)');

      // Axes
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(AGG_PAD.left, AGG_PAD.top);
      ctx.lineTo(AGG_PAD.left, AGG_PAD.top + ch);
      ctx.lineTo(AGG_PAD.left + cw, AGG_PAD.top + ch);
      ctx.stroke();

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b bg-gray-50/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wifi size={16} className="text-blue-500" />
          <h4 className="text-[13px] font-semibold text-gray-800">Live Network Bandwidth</h4>
        </div>
        <select value={duration} onChange={e => setDuration(Number(e.target.value))}
          className="h-[30px] px-2 text-xs border border-gray-300 rounded bg-white text-gray-700 outline-none focus:border-blue-400 cursor-pointer">
          {AGG_DURATIONS.map(opt => (
            <option key={opt.ms} value={opt.ms}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="relative" ref={containerRef} style={{ height: AGG_H }}>
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      </div>
      <div className="border-t py-2.5 text-center">
        <div className="flex items-center justify-center gap-5 mb-1">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-2 rounded-sm inline-block" style={{ backgroundColor: '#c084fc' }} /> Upload
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-2 rounded-sm inline-block" style={{ backgroundColor: '#60a5fa' }} /> Download
          </span>
        </div>
        <p className="text-sm font-bold text-gray-700">
          {aggFmtBps(rates.upload)} / {aggFmtBps(rates.download)}
        </p>
      </div>
    </div>
  );
}
