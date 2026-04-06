import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  BarChart3, ArrowDown, ArrowUp, Loader2, Clock, Globe, Wifi, Calendar,
} from 'lucide-react';
import { portalApi } from '../../services/api';

const formatBytes = (bytes) => {
  const b = Number(bytes || 0);
  if (b === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—';

const fmtDuration = (start, stop) => {
  if (!start) return '—';
  const s = new Date(start);
  const e = stop ? new Date(stop) : new Date();
  const diff = Math.floor((e - s) / 1000);
  const dd = Math.floor(diff / 86400);
  const hh = Math.floor((diff % 86400) / 3600);
  const mm = Math.floor((diff % 3600) / 60);
  if (dd > 0) return `${dd}d ${hh}h ${mm}m`;
  if (hh > 0) return `${hh}h ${mm}m`;
  return `${mm}m`;
};

export default function PortalStatistics() {
  const { user } = useOutletContext();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalApi.getStatistics()
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-blue-500" />
      </div>
    );
  }

  const today = stats?.today || {};
  const month = stats?.month || {};
  const total = stats?.total || {};
  const sessions = stats?.recent_sessions || [];
  const daily = stats?.daily_usage || [];

  // Find max daily download for bar chart scaling
  const maxDaily = Math.max(...daily.map(d => Number(d.download)), 1);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Usage Statistics</h1>
        <p className="text-sm text-gray-400 mt-0.5">Your bandwidth usage and session history</p>
      </div>

      {/* Period Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Today */}
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider mb-3">
            <Calendar size={14} className="text-blue-500" /> Today
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <ArrowDown size={13} className="text-green-500" /> Download
              </div>
              <span className="text-sm font-bold text-gray-900">{formatBytes(today.today_download)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <ArrowUp size={13} className="text-blue-500" /> Upload
              </div>
              <span className="text-sm font-bold text-gray-900">{formatBytes(today.today_upload)}</span>
            </div>
            <div className="pt-1 border-t text-[11px] text-gray-400">
              {today.today_sessions || 0} sessions
            </div>
          </div>
        </div>

        {/* This Month */}
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider mb-3">
            <BarChart3 size={14} className="text-violet-500" /> This Month
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <ArrowDown size={13} className="text-green-500" /> Download
              </div>
              <span className="text-sm font-bold text-gray-900">{formatBytes(month.month_download)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <ArrowUp size={13} className="text-blue-500" /> Upload
              </div>
              <span className="text-sm font-bold text-gray-900">{formatBytes(month.month_upload)}</span>
            </div>
            <div className="pt-1 border-t text-[11px] text-gray-400">
              {month.month_sessions || 0} sessions
            </div>
          </div>
        </div>

        {/* All Time */}
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider mb-3">
            <Wifi size={14} className="text-emerald-500" /> All Time
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <ArrowDown size={13} className="text-green-500" /> Download
              </div>
              <span className="text-sm font-bold text-gray-900">{formatBytes(total.total_download)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <ArrowUp size={13} className="text-blue-500" /> Upload
              </div>
              <span className="text-sm font-bold text-gray-900">{formatBytes(total.total_upload)}</span>
            </div>
            <div className="pt-1 border-t text-[11px] text-gray-400">
              {total.total_sessions || 0} total sessions
            </div>
          </div>
        </div>
      </div>

      {/* Daily Usage Chart (last 30 days) */}
      {daily.length > 0 && (
        <div className="bg-white rounded-xl border p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Daily Usage (Last 30 Days)</h3>
          <div className="flex items-end gap-1 h-32">
            {daily.map((d, i) => {
              const pct = Math.max((Number(d.download) / maxDaily) * 100, 2);
              return (
                <div key={i} className="flex-1 flex flex-col items-center group relative">
                  <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-900 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap z-10">
                    {fmtDate(d.day)}: {formatBytes(d.download)} down / {formatBytes(d.upload)} up
                  </div>
                  <div
                    className="w-full bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-colors cursor-pointer min-h-[2px]"
                    style={{ height: `${pct}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-gray-400">
            <span>{daily.length > 0 ? fmtDate(daily[0].day) : ''}</span>
            <span>{daily.length > 0 ? fmtDate(daily[daily.length - 1].day) : ''}</span>
          </div>
          <div className="flex items-center gap-4 mt-3 text-[11px] text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500" /> Download</span>
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-3 border-b">
          <h3 className="text-sm font-semibold text-gray-800">Recent Sessions</h3>
        </div>
        {sessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider bg-gray-50/50 border-b">
                  <th className="px-5 py-2.5 font-medium">Started</th>
                  <th className="px-5 py-2.5 font-medium">Duration</th>
                  <th className="px-5 py-2.5 font-medium">IP Address</th>
                  <th className="px-5 py-2.5 font-medium">Download</th>
                  <th className="px-5 py-2.5 font-medium">Upload</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-gray-700">{fmtDateTime(s.start_time)}</td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1 text-gray-600">
                        <Clock size={12} className="text-gray-400" /> {fmtDuration(s.start_time, s.stop_time)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {s.framed_ip ? (
                        <span className="flex items-center gap-1 text-gray-600">
                          <Globe size={12} className="text-gray-400" />
                          <span className="font-mono text-xs">{s.framed_ip}</span>
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3 font-medium text-green-600">{formatBytes(s.download_bytes)}</td>
                    <td className="px-5 py-3 font-medium text-blue-600">{formatBytes(s.upload_bytes)}</td>
                    <td className="px-5 py-3">
                      {!s.stop_time ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200/60 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Active
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400">{s.terminate_cause || 'Closed'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <BarChart3 size={28} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No session data yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
