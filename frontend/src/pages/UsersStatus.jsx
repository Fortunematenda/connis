import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Wifi, WifiOff, RefreshCw, Monitor, Clock, Globe } from 'lucide-react';
import { usersApi } from '../services/api';

const POLL_INTERVAL = 15000; // 15s — server caches sessions for 30s

export default function UsersStatus() {
  const [data, setData] = useState({ data: [], count: 0, online: 0, offline: 0, routerOnline: false, lastUpdate: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  const fetchStatus = useCallback(async (silent = false, force = false) => {
    try {
      if (!silent) setLoading(true);
      if (force) setRefreshing(true);
      const res = await usersApi.getStatus(force);
      if (mountedRef.current) setData(res);
    } catch (err) {
      console.error('Failed to fetch user status:', err);
      // On error, keep existing data (no flicker)
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchStatus();
    intervalRef.current = setInterval(() => fetchStatus(true), POLL_INTERVAL);
    return () => {
      mountedRef.current = false;
      clearInterval(intervalRef.current);
    };
  }, [fetchStatus]);

  const lastUpdateStr = data.lastUpdate
    ? new Date(data.lastUpdate).toLocaleTimeString()
    : '—';

  const filtered = data.data.filter((u) => {
    if (filter === 'online' && !u.online) return false;
    if (filter === 'offline' && u.online) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        u.username?.toLowerCase().includes(q) ||
        u.full_name?.toLowerCase().includes(q) ||
        u.ip?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Monitor size={24} />
            User Status
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Live PPPoE session monitoring — cached, refreshes every 15s
          </p>
        </div>
        <div className="flex items-center gap-3 self-start">
          <span className="text-xs text-gray-400">Updated: {lastUpdateStr}</span>
          <button
            onClick={() => fetchStatus(false, true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Force Refresh'}
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500 font-medium">Total Users</p>
          <p className="text-2xl font-bold text-gray-900">{data.count}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-green-600 font-medium flex items-center gap-1"><Wifi size={12} /> Online</p>
          <p className="text-2xl font-bold text-green-600">{data.online}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-red-500 font-medium flex items-center gap-1"><WifiOff size={12} /> Offline</p>
          <p className="text-2xl font-bold text-red-500">{data.offline}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500 font-medium">Router</p>
          <p className={`text-sm font-semibold ${data.routerOnline ? 'text-green-600' : 'text-red-500'}`}>
            {data.routerOnline ? 'Connected' : 'Offline'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search username, name, or IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {[
            { key: 'all', label: 'All' },
            { key: 'online', label: 'Online' },
            { key: 'offline', label: 'Offline' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                filter === f.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Username</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">IP Address</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Uptime</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Plan</th>
              </tr>
            </thead>
            <tbody>
              {loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
                    Loading status...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50/50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          user.online ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]' : 'bg-red-400'
                        }`} />
                        <span className={`text-xs font-medium ${user.online ? 'text-green-700' : 'text-red-500'}`}>
                          {user.online ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-medium text-gray-900">{user.username}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-600">
                      {user.full_name || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {user.ip ? (
                        <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded flex items-center gap-1 w-fit">
                          <Globe size={11} />
                          {user.ip}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {user.uptime ? (
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                          <Clock size={11} className="text-gray-400" />
                          {user.uptime}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {user.plan_name ? (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                          {user.plan_name}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
