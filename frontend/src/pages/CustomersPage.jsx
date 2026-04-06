import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { customersApi, usersApi } from '../services/api';

// ── Main Customers Page ─────────────────────────────────────

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [onlineMap, setOnlineMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState(50);
  const [page, setPage] = useState(1);
  const [sortCol, setSortCol] = useState('full_name');
  const [sortDir, setSortDir] = useState('asc');
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [custRes, statusRes] = await Promise.all([customersApi.getAll(), usersApi.getStatus()]);
      setCustomers(custRes.data);
      const map = {};
      (statusRes.data || []).forEach(u => { if (u.online) map[u.username] = true; });
      setOnlineMap(map);
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Search
  const searched = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.full_name?.toLowerCase().includes(q) ||
      c.username?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.address?.toLowerCase().includes(q) ||
      c.plan_name?.toLowerCase().includes(q)
    );
  });

  // Sort
  const sorted = [...searched].sort((a, b) => {
    let va = a[sortCol] ?? '';
    let vb = b[sortCol] ?? '';
    if (sortCol === 'created_at') { va = new Date(a.created_at).getTime(); vb = new Date(b.created_at).getTime(); }
    if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb || '').toLowerCase(); }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sorted.length / perPage) || 1;
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  const handleSort = (col) => {
    setSortDir(sortCol === col && sortDir === 'asc' ? 'desc' : 'asc');
    setSortCol(col);
    setPage(1);
  };

  const SortArrow = ({ col }) => {
    if (sortCol !== col) return <span className="ml-0.5 text-gray-300 text-[10px]">&#8597;</span>;
    return <span className="ml-0.5 text-blue-500 text-[10px]">{sortDir === 'asc' ? '▲' : '▼'}</span>;
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Customers</h1>
          <p className="text-xs text-gray-400 mt-0.5">{customers.length} total</p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 text-sm text-gray-600 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 shadow-sm">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border shadow-sm">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            Show
            <select value={perPage} onChange={(e) => { setPerPage(+e.target.value); setPage(1); }}
              className="px-2 py-1 border rounded text-sm bg-white">
              {[25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            entries
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search customers..."
              className="pl-9 pr-4 py-2 border rounded-lg text-sm w-60 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={24} className="animate-spin text-blue-500" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="px-4 py-16 text-center text-gray-400 text-sm">
            {customers.length === 0 ? 'No customers yet. Convert a lead to get started.' : 'No results found.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b bg-gray-50/50">
                  <th className="pl-4 pr-2 py-3 font-medium w-14">ID</th>
                  <th className="px-3 py-3 font-medium w-20">Connection</th>
                  <th className="px-3 py-3 font-medium cursor-pointer" onClick={() => handleSort('full_name')}>
                    Customer <SortArrow col="full_name" />
                  </th>
                  <th className="px-3 py-3 font-medium">Address</th>
                  <th className="px-3 py-3 font-medium cursor-pointer" onClick={() => handleSort('plan_name')}>
                    Plan <SortArrow col="plan_name" />
                  </th>
                  <th className="px-3 py-3 font-medium cursor-pointer" onClick={() => handleSort('balance')}>
                    Balance <SortArrow col="balance" />
                  </th>
                  <th className="px-3 py-3 font-medium">Phone</th>
                  <th className="px-3 py-3 font-medium cursor-pointer" onClick={() => handleSort('active')}>
                    Status <SortArrow col="active" />
                  </th>
                  <th className="px-3 py-3 font-medium cursor-pointer" onClick={() => handleSort('created_at')}>
                    Added <SortArrow col="created_at" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((c, idx) => {
                  const isOnline = onlineMap[c.username];
                  const isBlocked = !c.active;
                  const rowStyle = isBlocked
                    ? { backgroundColor: '#eb3b2f10' } // 10 = ~6% opacity
                    : isOnline
                      ? { backgroundColor: '#8ad19030' } // 30 = ~19% opacity
                      : {};
                  const rowHoverClass = isBlocked
                    ? 'hover:bg-red-100'
                    : isOnline
                      ? 'hover:bg-green-50'
                      : 'hover:bg-gray-50/50';
                  return (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/customers/${c.id}`)}
                      style={rowStyle}
                      className={`border-b last:border-0 cursor-pointer transition-colors group ${rowHoverClass}`}
                    >
                    <td className="pl-4 pr-2 py-3 text-xs font-mono text-gray-400">
                      {String(c.seq_id || 0).padStart(3, '0')}
                    </td>
                    <td className="px-3 py-3">
                      {onlineMap[c.username] ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />Online
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
                          <span className="w-2 h-2 rounded-full bg-gray-300" />Offline
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                        {c.full_name || c.username}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{c.email || ''}</div>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">{c.address || '—'}</td>
                    <td className="px-3 py-3">
                      {c.plan_name ? (
                        <div>
                          <div className="text-sm text-gray-800">{c.plan_name}</div>
                          <div className="text-[11px] text-gray-400">{c.download_speed}/{c.upload_speed}</div>
                        </div>
                      ) : (
                        <span className="text-xs italic text-gray-400">No plan</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`font-medium text-sm ${parseFloat(c.balance) >= 0 ? 'text-gray-700' : 'text-red-600'}`}>
                        R{parseFloat(c.balance || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">{c.phone || '—'}</td>
                    <td className="px-3 py-3">
                      {c.active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200/60 px-2 py-0.5 rounded-full">Active</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 bg-red-50 ring-1 ring-red-200/60 px-2 py-0.5 rounded-full">Disabled</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {fmtDate(c.created_at)}
                    </td>
                  </tr>
                );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
            <span className="text-gray-400 text-xs">
              {(page - 1) * perPage + 1}–{Math.min(page * perPage, sorted.length)} of {sorted.length}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={page === 1}
                className="px-2 py-1 rounded border text-xs hover:bg-gray-50 disabled:opacity-25">«</button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-2 py-1 rounded border text-xs hover:bg-gray-50 disabled:opacity-25">‹</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p;
                if (totalPages <= 5) p = i + 1;
                else if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`px-2.5 py-1 rounded border text-xs ${
                      p === page ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50'
                    }`}>{p}</button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-2 py-1 rounded border text-xs hover:bg-gray-50 disabled:opacity-25">›</button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                className="px-2 py-1 rounded border text-xs hover:bg-gray-50 disabled:opacity-25">»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
