import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts';
import {
  Activity, Loader2, Info,
} from 'lucide-react';
import { customersApi } from '../services/api';

// ── Helpers ──
function fmtBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i > 1 ? 2 : 0) + ' ' + units[i];
}

function fmtMB(bytes) {
  if (!bytes || bytes === 0) return '0.00';
  return (bytes / 1048576).toFixed(2);
}

function fmtDuration(seconds) {
  if (!seconds) return '0s';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function fmtOnlineTime(seconds) {
  if (!seconds) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ── Chart Tooltip ──
function UsageTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur border rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <div className="flex items-center gap-1.5 text-amber-600">
        <span className="w-2 h-2 rounded-sm bg-amber-400 inline-block" />
        Download: <strong>{fmtBytes(payload.find(p => p.dataKey === 'download')?.value || 0)}</strong>
      </div>
      <div className="flex items-center gap-1.5 text-blue-500">
        <span className="w-2 h-2 rounded-sm bg-blue-400 inline-block" />
        Upload: <strong>{fmtBytes(payload.find(p => p.dataKey === 'upload')?.value || 0)}</strong>
      </div>
    </div>
  );
}

// ── Main Component ──
export default function CustomerStatistics({ customerId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customersApi.getStatistics(customerId, 'month');
      setStats(res.data);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // Build chart data: all days of current month, fill gaps with 0
  const chartData = useMemo(() => {
    if (!stats) return [];
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const usageMap = {};
    (stats.daily_usage || []).forEach(d => {
      // Use date string directly from backend - don't convert to UTC
      const key = d.date;
      usageMap[key] = d;
    });

    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const label = `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
      const d = usageMap[dateStr];
      days.push({
        label,
        download: d ? d.download : 0,
        upload: d ? d.upload : 0,
      });
    }
    return days;
  }, [stats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 size={24} className="animate-spin text-blue-500" />
      </div>
    );
  }

  const hasData = stats && (stats.summary.sessions > 0 || stats.daily_usage.length > 0);

  return (
    <div className="space-y-5">
      {/* ── Usage by day chart ── */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info size={15} className="text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-800">Usage by day</h3>
          </div>
        </div>
        <div className="px-5 pt-3 pb-2">
          {hasData && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 10, right: 5, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9, fill: '#9ca3af' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  tickFormatter={v => fmtBytes(v)}
                  width={60}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip content={<UsageTooltip />} />
                <Legend
                  iconType="square"
                  iconSize={10}
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  formatter={(value) => value === 'download' ? 'Download peak' : 'Upload peak'}
                />
                <Bar dataKey="download" name="download" stackId="bw" fill="#f6c87a" />
                <Bar dataKey="upload" name="upload" stackId="bw" fill="#7db8f0" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState text="No bandwidth data for this month" />
          )}
        </div>
      </div>

      {/* ── FUP Statistics table ── */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center gap-2">
          <Info size={15} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-800">FUP Statistics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider bg-gray-50/50 border-b">
                <th className="px-5 py-3 font-medium w-24"></th>
                <th className="px-5 py-3 font-medium">Traffic / Bonus Download MB</th>
                <th className="px-5 py-3 font-medium">Traffic / Bonus Upload MB</th>
                <th className="px-5 py-3 font-medium">Online time</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Day', data: stats?.fup?.day },
                { label: 'Week', data: stats?.fup?.week },
                { label: 'Month', data: stats?.fup?.month },
              ].map(row => (
                <tr key={row.label} className="border-b last:border-0 hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-medium text-gray-700">{row.label}</td>
                  <td className="px-5 py-3 text-gray-600">{fmtMB(row.data?.upload || 0)} / 0.00</td>
                  <td className="px-5 py-3 text-gray-600">{fmtMB(row.data?.download || 0)} / 0.00</td>
                  <td className="px-5 py-3 text-gray-600">{fmtOnlineTime(row.data?.online_time || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Recent sessions table ── */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Recent Sessions</h3>
        </div>
        {stats?.recent_sessions?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider bg-gray-50/50 border-b">
                  <th className="px-4 py-3 font-medium">Started</th>
                  <th className="px-4 py-3 font-medium">Ended</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 font-medium">IP Address</th>
                  <th className="px-4 py-3 font-medium">Tower</th>
                  <th className="px-4 py-3 font-medium">Download</th>
                  <th className="px-4 py-3 font-medium">Upload</th>
                  <th className="px-4 py-3 font-medium">Cause</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_sessions.map((s, i) => (
                  <tr key={s.id || i} className="border-b last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 text-gray-700">{fmtTime(s.start)}</td>
                    <td className="px-4 py-2.5 text-gray-500">{s.stop ? fmtTime(s.stop) : <span className="text-emerald-600 font-medium">Active</span>}</td>
                    <td className="px-4 py-2.5 text-gray-700">{fmtDuration(s.duration)}</td>
                    <td className="px-4 py-2.5">
                      {s.ip ? <span className="text-xs font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{s.ip}</span> : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      {s.nas_ip ? <span className="text-xs font-mono text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded">{s.nas_ip}</span> : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-blue-600 font-medium">{fmtBytes(s.download)}</td>
                    <td className="px-4 py-2.5 text-emerald-600 font-medium">{fmtBytes(s.upload)}</td>
                    <td className="px-4 py-2.5">
                      {s.terminate_cause ? (
                        <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                          s.terminate_cause === 'User-Request' ? 'text-gray-600 bg-gray-100' :
                          s.terminate_cause === 'Admin-Reset' ? 'text-amber-700 bg-amber-50' :
                          s.terminate_cause === 'Session-Timeout' ? 'text-blue-600 bg-blue-50' :
                          'text-red-600 bg-red-50'
                        }`}>
                          {s.terminate_cause}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState text="No session history available" />
        )}
      </div>

      {/* ── All-time stats ── */}
      {stats?.all_time.sessions > 0 && (
        <div className="bg-gray-50 rounded-xl border p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">All-Time Summary</h3>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
            <span>Total Download: <strong className="text-gray-800">{fmtBytes(stats.all_time.download)}</strong></span>
            <span>Total Upload: <strong className="text-gray-800">{fmtBytes(stats.all_time.upload)}</strong></span>
            <span>Total Online: <strong className="text-gray-800">{fmtDuration(stats.all_time.session_time)}</strong></span>
            <span>Sessions: <strong className="text-gray-800">{stats.all_time.sessions}</strong></span>
            {stats.all_time.first_session && <span>First: <strong className="text-gray-800">{fmtDate(stats.all_time.first_session)}</strong></span>}
            {stats.all_time.last_session && <span>Last: <strong className="text-gray-800">{fmtDate(stats.all_time.last_session)}</strong></span>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──

function EmptyState({ text }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Activity size={28} className="text-gray-300 mb-2" />
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
}
