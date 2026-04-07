import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search, RefreshCw, Users, ChevronRight, Eye, Wallet, WifiOff, SlidersHorizontal, Plus, UserPlus, Columns3, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { customersApi, usersApi, mikrotikApi } from '../services/api';

// ── Main Customers Page ─────────────────────────────────────

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'online', label: 'Online' },
  { key: 'offline', label: 'Offline' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'low_balance', label: 'Low Balance' },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [onlineMap, setOnlineMap] = useState({});
  const [ipMap, setIpMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(() => {
    try { return localStorage.getItem('connis_cust_filter') || 'all'; } catch { return 'all'; }
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [perPage, setPerPage] = useState(50);
  const [page, setPage] = useState(1);
  const [sortCol, setSortCol] = useState('full_name');
  const [sortDir, setSortDir] = useState('asc');
  const [colMenuOpen, setColMenuOpen] = useState(false);
  const [visibleCols, setVisibleCols] = useState(() => {
    try { const s = localStorage.getItem('connis_cust_cols'); if (s) return JSON.parse(s); } catch {}
    return { id: true, customer: true, status: true, pppoe: true, phone: true, email: true, address: false, ip: true, plan: true, balance: true };
  });
  const navigate = useNavigate();

  const ALL_COLS = [
    { key: 'id', label: 'ID' },
    { key: 'customer', label: 'Customer' },
    { key: 'status', label: 'Status' },
    { key: 'pppoe', label: 'PPPoE' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'address', label: 'Address' },
    { key: 'ip', label: 'IP' },
    { key: 'plan', label: 'Plan' },
    { key: 'balance', label: 'Balance' },
  ];

  const toggleCol = (key) => {
    setVisibleCols(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('connis_cust_cols', JSON.stringify(next));
      return next;
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [custRes, statusRes] = await Promise.all([customersApi.getAll(), usersApi.getStatus()]);
      setCustomers(custRes.data);
      const oMap = {};
      const iMap = {};
      (statusRes.data || []).forEach(u => {
        if (u.online) { oMap[u.username] = true; }
        if (u.ip) { iMap[u.username] = u.ip; }
      });
      setOnlineMap(oMap);
      setIpMap(iMap);
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDisconnect = async (e, username) => {
    e.stopPropagation();
    if (!confirm(`Disconnect ${username}?`)) return;
    try {
      await mikrotikApi.disconnect(username);
      toast.success(`${username} disconnected`);
      setTimeout(fetchData, 1500);
    } catch (err) { toast.error(err.message || 'Disconnect failed'); }
  };

  // Counts for summary
  const counts = useMemo(() => {
    let online = 0, offline = 0, blocked = 0, lowBal = 0;
    customers.forEach(c => {
      if (!c.active) { blocked++; return; }
      if (onlineMap[c.username]) online++;
      else offline++;
      if (parseFloat(c.balance || 0) < 10) lowBal++;
    });
    return { total: customers.length, online, offline, blocked, lowBal };
  }, [customers, onlineMap]);

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

  // Filter
  const filtered = searched.filter(c => {
    if (filter === 'online') return c.active && onlineMap[c.username];
    if (filter === 'offline') return c.active && !onlineMap[c.username];
    if (filter === 'blocked') return !c.active;
    if (filter === 'low_balance') return parseFloat(c.balance || 0) < 10;
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let va = a[sortCol] ?? '';
    let vb = b[sortCol] ?? '';
    if (sortCol === 'balance') { va = parseFloat(a.balance || 0); vb = parseFloat(b.balance || 0); }
    else if (sortCol === 'created_at') { va = new Date(a.created_at).getTime(); vb = new Date(b.created_at).getTime(); }
    else if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb || '').toLowerCase(); }
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
    return <span className="ml-0.5 text-amber-500 text-[10px]">{sortDir === 'asc' ? '▲' : '▼'}</span>;
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
  const fmtBal = (v) => 'R' + parseFloat(v || 0).toFixed(2);

  const getStatus = (c) => {
    if (!c.active) return { label: 'Blocked', color: 'bg-red-500', textColor: 'text-red-600', dot: 'bg-red-500', badge: 'bg-red-50 text-red-700 ring-1 ring-red-200/60' };
    if (onlineMap[c.username]) return { label: 'Online', color: 'bg-emerald-500', textColor: 'text-emerald-600', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60' };
    return { label: 'Offline', color: 'bg-gray-400', textColor: 'text-gray-500', dot: 'bg-gray-300', badge: 'bg-gray-100 text-gray-600' };
  };

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Customers</h1>
          <p className="text-xs text-gray-500 mt-0.5">{counts.total} total · {counts.online} online</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-sm text-gray-600 bg-white border rounded-xl hover:bg-gray-50 active:scale-95 disabled:opacity-50 shadow-sm transition-all">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button onClick={() => navigate('/leads')}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-white bg-amber-500/90 rounded-xl hover:bg-amber-600 active:scale-95 shadow-sm transition-all">
            <UserPlus size={14} />
            <span className="hidden sm:inline">Add Customer</span>
          </button>
        </div>
      </div>

      {/* ── Search + Filters ── */}
      <div className="bg-white rounded-2xl border shadow-sm">
        <div className="px-4 py-3 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, phone, email, address..."
              className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm bg-gray-50/50 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 focus:bg-white outline-none transition-all"
            />
          </div>
          {/* Filter tabs — desktop: inline, mobile: dropdown */}
          <div className="flex items-center gap-2">
            {/* Mobile filter button */}
            <div className="relative md:hidden">
              <button onClick={() => setFilterOpen(!filterOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all active:scale-95 ${
                  filter !== 'all' ? 'bg-amber-500/90 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-200'
                }`}>
                <SlidersHorizontal size={14} />
                {filter !== 'all' ? FILTERS.find(f => f.key === filter)?.label : 'Filter'}
              </button>
              {filterOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
                  <div className="absolute left-0 top-full mt-1 z-50 bg-white rounded-xl border shadow-lg py-1 w-44">
                    {FILTERS.map(f => {
                      const count = f.key === 'all' ? sorted.length :
                        f.key === 'online' ? counts.online :
                        f.key === 'offline' ? counts.offline :
                        f.key === 'blocked' ? counts.blocked : counts.lowBal;
                      return (
                        <button key={f.key}
                          onClick={() => { setFilter(f.key); localStorage.setItem('connis_cust_filter', f.key); setPage(1); setFilterOpen(false); }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm transition-colors ${
                            filter === f.key ? 'bg-amber-50 text-amber-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                          }`}>
                          <span>{f.label}</span>
                          <span className="text-[11px] text-gray-400">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            {/* Desktop filter tabs */}
            <div className="hidden md:flex items-center gap-1.5">
              {FILTERS.map(f => {
                const count = f.key === 'all' ? sorted.length :
                  f.key === 'online' ? counts.online :
                  f.key === 'offline' ? counts.offline :
                  f.key === 'blocked' ? counts.blocked : counts.lowBal;
                return (
                  <button key={f.key}
                    onClick={() => { setFilter(f.key); localStorage.setItem('connis_cust_filter', f.key); setPage(1); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all active:scale-95 ${
                      filter === f.key
                        ? 'bg-amber-500/90 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                    {f.label}
                    <span className={`text-[10px] px-1 py-0.5 rounded-md ${
                      filter === f.key ? 'bg-white/20' : 'bg-gray-200/80'
                    }`}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={24} className="animate-spin text-amber-500" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <Users size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">{customers.length === 0 ? 'No customers yet. Convert a lead to get started.' : 'No results found.'}</p>
          </div>
        ) : (
          <>
          {/* ── Column toggle ── */}
          <div className="hidden md:flex items-center justify-end px-4 py-2 border-t relative">
            <button onClick={() => setColMenuOpen(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              <Columns3 size={14} /> Columns
            </button>
            {colMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setColMenuOpen(false)} />
                <div className="absolute right-4 top-full mt-1 z-50 bg-white rounded-xl border shadow-lg py-1 w-48">
                  {ALL_COLS.map(col => (
                    <button key={col.key} onClick={() => toggleCol(col.key)}
                      className="w-full flex items-center justify-between px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <span>{col.label}</span>
                      {visibleCols[col.key] && <Check size={14} className="text-amber-500" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── Desktop table ── */}
          <div className="hidden md:block overflow-x-auto border-t">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] text-gray-500 uppercase tracking-wider border-b bg-gray-50/50">
                  {visibleCols.id && <th className="pl-5 pr-2 py-3 font-medium w-16 cursor-pointer" onClick={() => handleSort('seq_id')}>ID <SortArrow col="seq_id" /></th>}
                  {visibleCols.customer && <th className="px-3 py-3 font-medium cursor-pointer" onClick={() => handleSort('full_name')}>Customer <SortArrow col="full_name" /></th>}
                  {visibleCols.status && <th className="px-3 py-3 font-medium w-24 cursor-pointer" onClick={() => handleSort('active')}>Status <SortArrow col="active" /></th>}
                  {visibleCols.pppoe && <th className="px-3 py-3 font-medium cursor-pointer" onClick={() => handleSort('username')}>PPPoE <SortArrow col="username" /></th>}
                  {visibleCols.phone && <th className="px-3 py-3 font-medium">Phone</th>}
                  {visibleCols.email && <th className="px-3 py-3 font-medium cursor-pointer" onClick={() => handleSort('email')}>Email <SortArrow col="email" /></th>}
                  {visibleCols.address && <th className="px-3 py-3 font-medium">Address</th>}
                  {visibleCols.ip && <th className="px-3 py-3 font-medium">IP</th>}
                  {visibleCols.plan && <th className="px-3 py-3 font-medium cursor-pointer" onClick={() => handleSort('plan_name')}>Plan <SortArrow col="plan_name" /></th>}
                  {visibleCols.balance && <th className="px-3 py-3 font-medium cursor-pointer" onClick={() => handleSort('balance')}>Balance <SortArrow col="balance" /></th>}
                </tr>
              </thead>
              <tbody>
                {paginated.map((c) => {
                  const st = getStatus(c);
                  const bal = parseFloat(c.balance || 0);
                  const isLowBal = bal < 10 && c.active;
                  const isOnline = onlineMap[c.username];
                  return (
                    <tr key={c.id}
                      onClick={() => navigate(`/customers/${c.id}`)}
                      className="border-b last:border-0 cursor-pointer transition-colors hover:bg-amber-50/30 group"
                    >
                      {visibleCols.id && (
                        <td className="pl-5 pr-2 py-3 text-xs font-mono text-gray-400">
                          {String(c.seq_id || 0).padStart(3, '0')}
                        </td>
                      )}
                      {visibleCols.customer && (
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                              !c.active ? 'bg-red-400' : isOnline ? 'bg-emerald-500' : 'bg-gray-400'
                            }`}>
                              {(c.full_name || c.username || '?')[0].toUpperCase()}
                            </div>
                            <p className="font-medium text-gray-900 group-hover:text-amber-700 transition-colors truncate">{c.full_name || c.username}</p>
                          </div>
                        </td>
                      )}
                      {visibleCols.status && (
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${st.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot} ${st.label === 'Online' ? 'animate-pulse' : ''}`} />
                            {st.label}
                          </span>
                        </td>
                      )}
                      {visibleCols.pppoe && (
                        <td className="px-3 py-3">
                          <span className="text-sm text-gray-600 font-mono">{c.username || '—'}</span>
                        </td>
                      )}
                      {visibleCols.phone && (
                        <td className="px-3 py-3 text-sm text-gray-600">{c.phone || '—'}</td>
                      )}
                      {visibleCols.email && (
                        <td className="px-3 py-3">
                          <span className="text-sm text-gray-600 truncate block max-w-[200px]">{c.email || '—'}</span>
                        </td>
                      )}
                      {visibleCols.address && (
                        <td className="px-3 py-3">
                          <p className="text-sm text-gray-600 truncate max-w-[200px]">{c.address || '—'}</p>
                        </td>
                      )}
                      {visibleCols.ip && (
                        <td className="px-3 py-3">
                          <span className="text-xs font-mono text-gray-500">{ipMap[c.username] || '—'}</span>
                        </td>
                      )}
                      {visibleCols.plan && (
                        <td className="px-3 py-3">
                          {c.plan_name ? (
                            <div>
                              <p className="text-sm text-gray-800">{c.plan_name}</p>
                              <p className="text-[11px] text-gray-400">{c.download_speed}/{c.upload_speed}</p>
                            </div>
                          ) : (
                            <span className="text-xs italic text-gray-400">No plan</span>
                          )}
                        </td>
                      )}
                      {visibleCols.balance && (
                        <td className="px-3 py-3">
                          <span className={`font-semibold text-sm ${isLowBal ? 'text-amber-600' : bal < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                            {fmtBal(c.balance)}
                          </span>
                          {isLowBal && <p className="text-[10px] text-amber-500">Low</p>}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Mobile cards ── */}
          <div className="md:hidden border-t">
            <div className="divide-y">
              {paginated.map((c) => {
                const st = getStatus(c);
                const bal = parseFloat(c.balance || 0);
                const isLowBal = bal < 10 && c.active;
                const isOnline = onlineMap[c.username];
                return (
                  <div key={c.id}
                    onClick={() => navigate(`/customers/${c.id}`)}
                    className="px-4 py-3.5 active:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          !c.active ? 'bg-red-400' : isOnline ? 'bg-emerald-500' : 'bg-gray-400'
                        }`}>
                          {(c.full_name || c.username || '?')[0].toUpperCase()}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${st.color}`} />
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900 truncate">{c.full_name || c.username}</p>
                          <span className={`text-xs font-bold shrink-0 ${isLowBal ? 'text-amber-600' : bal < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                            {fmtBal(c.balance)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${st.textColor}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot} ${st.label === 'Online' ? 'animate-pulse' : ''}`} />
                            {st.label}
                          </span>
                          {c.plan_name && (
                            <span className="text-[10px] text-gray-400">· {c.plan_name}</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          </>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t text-sm">
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-xs">
                {(page - 1) * perPage + 1}–{Math.min(page * perPage, sorted.length)} of {sorted.length}
              </span>
              <select value={perPage} onChange={(e) => { setPerPage(+e.target.value); setPage(1); }}
                className="text-xs border rounded-lg px-2 py-1 bg-white text-gray-600">
                {[25, 50, 100].map(n => <option key={n} value={n}>{n}/page</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={page === 1}
                className="px-2 py-1.5 rounded-lg border text-xs hover:bg-gray-50 disabled:opacity-25 transition-colors">«</button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-2 py-1.5 rounded-lg border text-xs hover:bg-gray-50 disabled:opacity-25 transition-colors">‹</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p;
                if (totalPages <= 5) p = i + 1;
                else if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
                      p === page ? 'bg-amber-500/90 text-white border-amber-500' : 'hover:bg-gray-50'
                    }`}>{p}</button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-2 py-1.5 rounded-lg border text-xs hover:bg-gray-50 disabled:opacity-25 transition-colors">›</button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                className="px-2 py-1.5 rounded-lg border text-xs hover:bg-gray-50 disabled:opacity-25 transition-colors">»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

