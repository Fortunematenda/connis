import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Ticket, Plus, X, Loader2, Search, RefreshCw, ChevronLeft, ChevronRight,
  AlertCircle, Clock, CheckCircle2, Hourglass, MessageCircle, Eye, Trash2,
  ArrowUpDown, Filter, LayoutGrid, List,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ticketsApi, customersApi, staffApi } from '../services/api';

const STATUS_META = {
  open: { label: 'New', color: 'text-blue-700 bg-blue-50 ring-blue-200/60', icon: AlertCircle, dot: 'bg-blue-500' },
  in_progress: { label: 'Work in Progress', color: 'text-amber-700 bg-amber-50 ring-amber-200/60', icon: Clock, dot: 'bg-amber-500' },
  waiting: { label: 'Waiting on Customer', color: 'text-purple-700 bg-purple-50 ring-purple-200/60', icon: Hourglass, dot: 'bg-purple-500' },
  resolved: { label: 'Resolved', color: 'text-emerald-700 bg-emerald-50 ring-emerald-200/60', icon: CheckCircle2, dot: 'bg-emerald-500' },
  closed: { label: 'Closed', color: 'text-gray-600 bg-gray-100 ring-gray-200/60', icon: CheckCircle2, dot: 'bg-gray-400' },
};

const PRIORITY_META = {
  low: { label: 'Low', color: 'text-emerald-700 bg-emerald-100' },
  medium: { label: 'Medium', color: 'text-amber-700 bg-amber-100' },
  high: { label: 'High', color: 'text-orange-700 bg-orange-100' },
  critical: { label: 'Urgent', color: 'text-red-700 bg-red-100' },
};

const fmtDate = (d) => d ? new Date(d).toLocaleString('en-GB', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
}) : '—';

const fmtRelative = (d) => {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

export default function TicketsPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [view, setView] = useState('list'); // 'dashboard' | 'list'
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detail, setDetail] = useState(null);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '', priority: 'medium', user_id: '', assigned_to: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, cRes, sRes] = await Promise.all([
        ticketsApi.getAll(), customersApi.getAll(), staffApi.getAll()
      ]);
      setTickets(tRes.data);
      setCustomers(cRes.data);
      setStaff(sRes.data || []);
    } catch { toast.error('Failed to load tickets'); }
    setLoading(false);
  }, []);

  const { id: urlTicketId } = useParams();

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-load ticket detail if navigated via URL /tickets/:id
  useEffect(() => {
    if (urlTicketId && !loading) {
      loadDetail(urlTicketId);
    }
  }, [urlTicketId, loading]);

  const loadDetail = async (id) => {
    try {
      const res = await ticketsApi.getById(id);
      setDetail(res.data);
      setSelectedTicket(id);
    } catch { toast.error('Failed to load ticket'); }
  };

  const handleCreate = async () => {
    if (!form.subject.trim()) return toast.error('Subject is required');
    try {
      await ticketsApi.create(form);
      toast.success('Ticket created');
      setShowCreate(false);
      setForm({ subject: '', description: '', priority: 'medium', user_id: '', assigned_to: '' });
      fetchData();
    } catch (e) { toast.error(e.message); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await ticketsApi.update(id, { status });
      toast.success('Status updated');
      fetchData();
      if (detail?.id === id) loadDetail(id);
    } catch (e) { toast.error(e.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this ticket?')) return;
    try {
      await ticketsApi.remove(id);
      toast.success('Deleted');
      setSelectedTicket(null);
      setDetail(null);
      fetchData();
    } catch (e) { toast.error(e.message); }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    setSending(true);
    try {
      await ticketsApi.addComment(selectedTicket, comment);
      setComment('');
      loadDetail(selectedTicket);
    } catch (e) { toast.error(e.message); }
    setSending(false);
  };

  // Status counts
  const counts = {};
  Object.keys(STATUS_META).forEach(k => { counts[k] = 0; });
  tickets.forEach(t => { counts[t.status] = (counts[t.status] || 0) + 1; });

  // Filtered + paginated
  const filtered = tickets
    .filter(t => filterStatus === 'all' || t.status === filterStatus)
    .filter(t => filterPriority === 'all' || t.priority === filterPriority)
    .filter(t => {
      if (!search) return true;
      const q = search.toLowerCase();
      return t.subject?.toLowerCase().includes(q) || t.customer_name?.toLowerCase().includes(q) || t.created_by_name?.toLowerCase().includes(q);
    });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  // ── DETAIL SLIDE-OVER ──
  if (detail && selectedTicket) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => { setSelectedTicket(null); setDetail(null); }}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
            <ChevronLeft size={16} /> Back to Tickets
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main ticket */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border shadow-sm">
              <div className="px-5 py-4 border-b">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-gray-900">{detail.subject}</h2>
                    <p className="text-xs text-gray-400 mt-1">
                      Created {fmtDate(detail.created_at)} {detail.created_by_name && <span>by <span className="font-medium text-gray-600">{detail.created_by_name}</span></span>}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(detail.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
                {detail.description && <p className="text-sm text-gray-600 mt-3 leading-relaxed">{detail.description}</p>}
              </div>

              {/* Comments thread */}
              <div className="px-5 py-4 space-y-3 max-h-[400px] overflow-y-auto">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity &amp; Comments</h3>
                {detail.comments?.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-8">No comments yet. Start the conversation below.</p>
                )}
                {detail.comments?.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold flex-shrink-0">
                      {(c.author_name || 'A')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-700">{c.author_name || 'Admin'}</span>
                        <span className="text-[10px] text-gray-400">{fmtRelative(c.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add comment */}
              <div className="px-5 py-3 border-t">
                <div className="flex gap-2">
                  <input value={comment} onChange={(e) => setComment(e.target.value)}
                    placeholder="Write a comment..." onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                    className="flex-1 px-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                  <button onClick={handleComment} disabled={sending || !comment.trim()}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                    <MessageCircle size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Side panel - ticket details */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ticket Details</h3>

              <div>
                <label className="text-[11px] text-gray-400 font-medium">Status</label>
                <select value={detail.status} onChange={(e) => handleStatusChange(detail.id, e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white">
                  {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-gray-400 font-medium">Priority</label>
                <div className="mt-1">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${PRIORITY_META[detail.priority]?.color || ''}`}>
                    {PRIORITY_META[detail.priority]?.label || detail.priority}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-gray-400 font-medium">Customer</label>
                <p className="text-sm text-gray-800 mt-1">{detail.customer_name || '—'}</p>
                {detail.customer_username && <p className="text-[11px] text-gray-400">{detail.customer_username}</p>}
              </div>

              <div>
                <label className="text-[11px] text-gray-400 font-medium">Assigned To</label>
                <p className="text-sm text-gray-800 mt-1">{detail.assigned_name || 'Unassigned'}</p>
              </div>

              <div>
                <label className="text-[11px] text-gray-400 font-medium">Created By</label>
                <p className="text-sm text-gray-800 mt-1">{detail.created_by_name || '—'}</p>
              </div>

              {detail.closed_at && (
                <div>
                  <label className="text-[11px] text-gray-400 font-medium">Closed At</label>
                  <p className="text-sm text-gray-800 mt-1">{fmtDate(detail.closed_at)}</p>
                </div>
              )}
            </div>

            {detail.user_id && (
              <button onClick={() => navigate(`/customers/${detail.user_id}`)}
                className="w-full px-4 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                View Customer Profile
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN VIEW ──
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <span>Tickets</span> <span>/</span> <span className="text-gray-600 font-medium">{view === 'dashboard' ? 'Dashboard' : 'List'}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{view === 'dashboard' ? 'Tickets Dashboard' : 'All Tickets'}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setView('dashboard')}
              className={`p-1.5 rounded-md transition-colors ${view === 'dashboard' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}>
              <LayoutGrid size={16} />
            </button>
            <button onClick={() => setView('list')}
              className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}>
              <List size={16} />
            </button>
          </div>
          <button onClick={fetchData} disabled={loading}
            className="p-2 text-gray-400 bg-white border rounded-lg hover:bg-gray-50 shadow-sm">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm">
            <Plus size={14} /> Create Ticket
          </button>
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-start justify-center pt-20" onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Create Ticket</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} className="text-gray-400" /></button>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Subject *</label>
              <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Brief description of the issue" className="w-full px-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detailed description..." rows={4}
                className="w-full px-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Customer</label>
                <select value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white">
                  <option value="">Select customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.full_name || c.username}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Assigned To</label>
                <select value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white">
                  <option value="">Unassigned</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Priority</label>
              <div className="flex gap-2">
                {Object.entries(PRIORITY_META).map(([k, v]) => (
                  <button key={k} onClick={() => setForm({ ...form, priority: k })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${form.priority === k ? v.color + ' ring-2 ring-offset-1 ring-current' : 'text-gray-500 bg-gray-50 hover:bg-gray-100'}`}>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">Cancel</button>
              <button onClick={handleCreate} className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">Create Ticket</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-blue-500" /></div>
      ) : (
        <>
          {/* ── DASHBOARD VIEW ── */}
          {view === 'dashboard' && (
            <div className="space-y-5">
              {/* Status cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {Object.entries(STATUS_META).map(([key, meta]) => {
                  const Icon = meta.icon;
                  return (
                    <button key={key} onClick={() => { setFilterStatus(key); setView('list'); }}
                      className="bg-white rounded-xl border shadow-sm p-4 text-left hover:shadow-md transition-shadow group">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                        <span className="text-xs font-medium text-gray-500">{meta.label}</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{counts[key] || 0}</p>
                      <p className="text-[11px] text-blue-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">View →</p>
                    </button>
                  );
                })}
              </div>

              {/* Recent + Activity grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Recent tickets */}
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800">Recent Tickets</h3>
                    <button onClick={() => setView('list')} className="text-xs text-blue-600 hover:underline">View all</button>
                  </div>
                  <div className="divide-y">
                    {tickets.slice(0, 8).map(t => (
                      <div key={t.id} onClick={() => loadDetail(t.id)}
                        className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_META[t.status]?.dot || 'bg-gray-400'}`} />
                            <p className="text-sm font-medium text-gray-900 truncate">{t.subject}</p>
                          </div>
                          <p className="text-[11px] text-gray-400 ml-3.5">{t.customer_name || 'No customer'} · {fmtRelative(t.created_at)}</p>
                        </div>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ml-3 ${PRIORITY_META[t.priority]?.color || ''}`}>
                          {PRIORITY_META[t.priority]?.label || t.priority}
                        </span>
                      </div>
                    ))}
                    {tickets.length === 0 && <p className="text-sm text-gray-400 text-center py-10">No tickets yet</p>}
                  </div>
                </div>

                {/* Ticket distribution */}
                <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-800">Ticket Distribution</h3>
                  {Object.entries(STATUS_META).map(([key, meta]) => {
                    const pct = tickets.length ? Math.round((counts[key] || 0) / tickets.length * 100) : 0;
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">{meta.label}</span>
                          <span className="font-semibold text-gray-800">{counts[key] || 0} <span className="font-normal text-gray-400">({pct}%)</span></span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${meta.dot} transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-700">Total</span>
                      <span className="font-bold text-gray-900">{tickets.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── LIST VIEW ── */}
          {view === 'list' && (
            <div className="bg-white rounded-xl border shadow-sm">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b">
                <div className="flex items-center gap-2">
                  <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                    className="px-3 py-2 border rounded-lg text-sm bg-white">
                    <option value="all">All Status ({tickets.length})</option>
                    {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label} ({counts[k] || 0})</option>)}
                  </select>
                  <select value={filterPriority} onChange={(e) => { setFilterPriority(e.target.value); setPage(1); }}
                    className="px-3 py-2 border rounded-lg text-sm bg-white">
                    <option value="all">All Priority</option>
                    {Object.entries(PRIORITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                    className="px-3 py-2 border rounded-lg text-sm bg-white">
                    <option value={15}>15 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>
                </div>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search..." className="pl-9 pr-4 py-2 border rounded-lg text-sm w-56 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                </div>
              </div>

              {/* Table */}
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Ticket size={32} className="text-gray-300 mb-3" />
                  <p className="text-sm text-gray-400">No tickets found</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[11px] text-gray-500 uppercase tracking-wider border-b bg-gray-50/50">
                          <th className="pl-4 pr-2 py-3 font-medium w-14">ID</th>
                          <th className="px-3 py-3 font-medium">Subject</th>
                          <th className="px-3 py-3 font-medium">Customer</th>
                          <th className="px-3 py-3 font-medium">Priority</th>
                          <th className="px-3 py-3 font-medium">Status</th>
                          <th className="px-3 py-3 font-medium">Assigned To</th>
                          <th className="px-3 py-3 font-medium">Created By</th>
                          <th className="px-3 py-3 font-medium">Date</th>
                          <th className="px-3 py-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginated.map((t, idx) => (
                          <tr key={t.id} className="border-b last:border-0 hover:bg-blue-50/30 transition-colors">
                            <td className="pl-4 pr-2 py-3 text-xs font-mono text-gray-400">
                              {(page - 1) * perPage + idx + 1}
                            </td>
                            <td className="px-3 py-3">
                              <button onClick={() => loadDetail(t.id)} className="text-left hover:text-blue-600">
                                <p className="font-medium text-blue-700 hover:underline">{t.subject}</p>
                                <span className={`inline-block mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded ${STATUS_META[t.status]?.color || 'bg-gray-100'}`}>
                                  {STATUS_META[t.status]?.label || t.status}
                                </span>
                              </button>
                            </td>
                            <td className="px-3 py-3">
                              {t.customer_name ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold flex items-center justify-center">
                                    {t.customer_name[0]?.toUpperCase()}
                                  </div>
                                  <span className="text-sm text-gray-800">{t.customer_name}</span>
                                </div>
                              ) : <span className="text-gray-400">—</span>}
                            </td>
                            <td className="px-3 py-3">
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${PRIORITY_META[t.priority]?.color || ''}`}>
                                {PRIORITY_META[t.priority]?.label || t.priority}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <select value={t.status} onChange={(e) => handleStatusChange(t.id, e.target.value)}
                                className="text-xs border rounded px-2 py-1 bg-white cursor-pointer">
                                {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                              </select>
                            </td>
                            <td className="px-3 py-3 text-sm text-gray-600">{t.assigned_name || <span className="text-gray-400">—</span>}</td>
                            <td className="px-3 py-3 text-sm text-gray-600">{t.created_by_name || <span className="text-gray-400">—</span>}</td>
                            <td className="px-3 py-3 text-xs text-gray-500">{fmtDate(t.created_at)}</td>
                            <td className="px-3 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => loadDetail(t.id)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="View">
                                  <Eye size={14} />
                                </button>
                                <button onClick={() => handleDelete(t.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
                    <p className="text-xs text-gray-500">
                      Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, filtered.length)} of {filtered.length} entries
                    </p>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                        className="px-2.5 py-1.5 border rounded text-xs hover:bg-gray-50 disabled:opacity-40">
                        <ChevronLeft size={14} />
                      </button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const p = page <= 3 ? i + 1 : page + i - 2;
                        if (p < 1 || p > totalPages) return null;
                        return (
                          <button key={p} onClick={() => setPage(p)}
                            className={`px-3 py-1.5 border rounded text-xs ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50'}`}>
                            {p}
                          </button>
                        );
                      })}
                      <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                        className="px-2.5 py-1.5 border rounded text-xs hover:bg-gray-50 disabled:opacity-40">
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
