import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare, Plus, X, Loader2, Search, RefreshCw, Calendar, ChevronLeft, ChevronRight,
  Clock, CheckCircle2, Circle, Trash2, Eye, LayoutGrid, List, Users, BarChart3, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { tasksApi, customersApi, staffApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const STATUS_META = {
  todo: { label: 'To Do', color: 'text-blue-700 bg-blue-50 ring-blue-200/60', dot: 'bg-blue-500' },
  in_progress: { label: 'In Progress', color: 'text-amber-700 bg-amber-50 ring-amber-200/60', dot: 'bg-amber-500' },
  done: { label: 'Done', color: 'text-emerald-700 bg-emerald-50 ring-emerald-200/60', dot: 'bg-emerald-500' },
};

const PRIORITY_META = {
  low: { label: 'Low', color: 'text-gray-600 bg-gray-100' },
  medium: { label: 'Medium', color: 'text-amber-700 bg-amber-100' },
  high: { label: 'High', color: 'text-red-700 bg-red-100' },
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-GB', {
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
  return `${Math.floor(hrs / 24)}d ago`;
};

const isOverdue = (d, status) => d && status !== 'done' && new Date(d) < new Date();

export default function TasksPage() {
  const { admin } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAssigned, setFilterAssigned] = useState('all');
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'list'
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', user_id: '', assigned_to: '', due_date: '' });
  const [selectedTask, setSelectedTask] = useState(null);
  const [detail, setDetail] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, cRes, sRes] = await Promise.all([tasksApi.getAll(), customersApi.getAll(), staffApi.getAll()]);
      setTasks(tRes.data);
      setCustomers(cRes.data);
      setStaff(sRes.data || []);
    } catch (err) { if (!err.isSubscriptionError) toast.error('Failed to load tasks'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const loadDetail = async (id) => {
    try {
      const res = await tasksApi.getById(id);
      setDetail(res.data);
      setSelectedTask(id);
    } catch (err) { if (!err.isSubscriptionError) toast.error('Failed to load task'); }
  };

  const handleCreate = async () => {
    if (!form.title.trim()) return toast.error('Title is required');
    try {
      await tasksApi.create(form);
      toast.success('Task created');
      setShowCreate(false);
      setForm({ title: '', description: '', priority: 'medium', user_id: '', assigned_to: '', due_date: '' });
      fetchData();
    } catch (e) { toast.error(e.message); }
  };

  const handleStatusChange = async (id, status) => {
    try { await tasksApi.update(id, { status }); toast.success('Updated'); fetchData(); }
    catch (e) { toast.error(e.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await tasksApi.remove(id);
      toast.success('Deleted');
      setSelectedTask(null);
      setDetail(null);
      fetchData();
    } catch (e) { toast.error(e.message); }
  };

  // Counts
  const counts = { all: tasks.length };
  Object.keys(STATUS_META).forEach(k => { counts[k] = 0; });
  tasks.forEach(t => { counts[t.status] = (counts[t.status] || 0) + 1; });

  // Assignment breakdown
  const assignmentMap = {};
  tasks.forEach(t => {
    const name = t.assigned_name || 'Not assigned';
    assignmentMap[name] = (assignmentMap[name] || 0) + 1;
  });
  const assignments = Object.entries(assignmentMap).sort((a, b) => b[1] - a[1]);

  // My tasks (assigned to current admin)
  const myTasks = tasks.filter(t => t.status !== 'done').slice(0, 10);
  const overdueTasks = tasks.filter(t => isOverdue(t.due_date, t.status));

  // Filter + paginate
  const filtered = tasks
    .filter(t => filterStatus === 'all' || t.status === filterStatus)
    .filter(t => filterAssigned === 'all' || (t.assigned_name || 'Not assigned') === filterAssigned)
    .filter(t => {
      if (!search) return true;
      const q = search.toLowerCase();
      return t.title?.toLowerCase().includes(q) || t.customer_name?.toLowerCase().includes(q) || t.assigned_name?.toLowerCase().includes(q);
    });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  // ── DETAIL VIEW ──
  if (detail && selectedTask) {
    return (
      <div className="space-y-4">
        <button onClick={() => { setSelectedTask(null); setDetail(null); }}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
          <ChevronLeft size={16} /> Back to Tasks
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main */}
          <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm">
            <div className="px-5 py-4 border-b">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-900">{detail.title}</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Created {fmtDateTime(detail.created_at)} {detail.created_by_name && <span>by <span className="font-medium text-gray-600">{detail.created_by_name}</span></span>}
                  </p>
                </div>
                <button onClick={() => handleDelete(detail.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 size={16} />
                </button>
              </div>
              {detail.description && <p className="text-sm text-gray-600 mt-3 leading-relaxed whitespace-pre-wrap">{detail.description}</p>}
            </div>

            {/* Timeline */}
            <div className="px-5 py-4 space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Timeline</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-xs">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-gray-500">Created</span>
                  <span className="text-gray-800 font-medium">{fmtDateTime(detail.created_at)}</span>
                </div>
                {detail.due_date && (
                  <div className="flex items-center gap-3 text-xs">
                    <span className={`w-2 h-2 rounded-full ${isOverdue(detail.due_date, detail.status) ? 'bg-red-500' : 'bg-amber-500'}`} />
                    <span className="text-gray-500">Due</span>
                    <span className={`font-medium ${isOverdue(detail.due_date, detail.status) ? 'text-red-600' : 'text-gray-800'}`}>{fmtDate(detail.due_date)}</span>
                    {isOverdue(detail.due_date, detail.status) && <span className="text-red-500 font-semibold">OVERDUE</span>}
                  </div>
                )}
                {detail.completed_at && (
                  <div className="flex items-center gap-3 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-gray-500">Completed</span>
                    <span className="text-gray-800 font-medium">{fmtDateTime(detail.completed_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Side panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Task Details</h3>

              <div>
                <label className="text-[11px] text-gray-400 font-medium">Status</label>
                <select value={detail.status} onChange={(e) => { handleStatusChange(detail.id, e.target.value); loadDetail(detail.id); }}
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
              </div>

              <div>
                <label className="text-[11px] text-gray-400 font-medium">Assigned To</label>
                <p className="text-sm text-gray-800 mt-1">{detail.assigned_name || 'Unassigned'}</p>
              </div>

              <div>
                <label className="text-[11px] text-gray-400 font-medium">Created By</label>
                <p className="text-sm text-gray-800 mt-1">{detail.created_by_name || '—'}</p>
              </div>

              {detail.due_date && (
                <div>
                  <label className="text-[11px] text-gray-400 font-medium">Due Date</label>
                  <p className={`text-sm mt-1 font-medium ${isOverdue(detail.due_date, detail.status) ? 'text-red-600' : 'text-gray-800'}`}>
                    {fmtDate(detail.due_date)}
                  </p>
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <span>Scheduling</span> <span>/</span> <span className="text-gray-600 font-medium">{view === 'dashboard' ? 'Dashboard' : 'Tasks'}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{view === 'dashboard' ? 'Scheduling Dashboard' : 'All Tasks'}</h1>
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
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-amber-500/90 rounded-lg hover:bg-amber-600 shadow-sm">
            <Plus size={14} /> Add Task
          </button>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-start justify-end" onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="bg-white shadow-xl w-full max-w-md h-full overflow-y-auto p-4 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Add Task</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} className="text-gray-400" /></button>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Title *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Task title" className="w-full px-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Details..." rows={3}
                className="w-full px-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Assigned To</label>
                <select value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white">
                  <option value="">Unassigned</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Priority</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white">
                  {Object.entries(PRIORITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
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
                <label className="text-xs font-medium text-gray-500 mb-1 block">Due Date</label>
                <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">Cancel</button>
              <button onClick={handleCreate} className="px-5 py-2 bg-amber-500/90 text-white text-sm font-medium rounded-lg hover:bg-amber-600">Save</button>
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
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white rounded-xl border shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckSquare size={16} className="text-gray-400" />
                    <span className="text-xs font-medium text-gray-500">Total Tasks</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
                </div>
                {Object.entries(STATUS_META).map(([key, meta]) => (
                  <button key={key} onClick={() => { setFilterStatus(key); setView('list'); }}
                    className="bg-white rounded-xl border shadow-sm p-4 text-left hover:shadow-md transition-shadow group">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                      <span className="text-xs font-medium text-gray-500">{meta.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{counts[key] || 0}</p>
                    <p className="text-[11px] text-blue-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">View →</p>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* My Tasks (2/3 width) */}
                <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800">My Tasks</h3>
                    <button onClick={() => setView('list')} className="text-xs text-blue-600 hover:underline">View all</button>
                  </div>
                  {myTasks.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-10">No pending tasks</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-[11px] text-gray-500 uppercase tracking-wider border-b bg-gray-50/50">
                            <th className="pl-4 pr-2 py-2.5 font-medium w-12">ID</th>
                            <th className="px-3 py-2.5 font-medium">Title</th>
                            <th className="px-3 py-2.5 font-medium w-16">P</th>
                            <th className="px-3 py-2.5 font-medium">Status</th>
                            <th className="px-3 py-2.5 font-medium">Assigned To</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myTasks.map((t, idx) => (
                            <tr key={t.id} onClick={() => loadDetail(t.id)} className="border-b last:border-0 hover:bg-blue-50/30 transition-colors cursor-pointer">
                              <td className="pl-4 pr-2 py-2.5 text-xs font-mono text-gray-400">{idx + 1}</td>
                              <td className="px-3 py-2.5">
                                <p className="font-medium text-blue-700 truncate max-w-xs">{t.title}</p>
                                {t.customer_name && <p className="text-[11px] text-gray-400 truncate">{t.customer_name}</p>}
                              </td>
                              <td className="px-3 py-2.5">
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${PRIORITY_META[t.priority]?.color || ''}`}>
                                  {t.priority?.[0]?.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-3 py-2.5">
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_META[t.status]?.color || 'bg-gray-100'}`}>
                                  {STATUS_META[t.status]?.label || t.status}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-xs text-gray-600">{t.assigned_name || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {/* Pagination indicator */}
                  <div className="px-4 py-2 border-t text-[11px] text-gray-400">
                    Showing 1 to {myTasks.length} of {tasks.filter(t => t.status !== 'done').length} entries
                  </div>
                </div>

                {/* Right sidebar: Assignment + Overdue */}
                <div className="space-y-5">
                  {/* All assigned tasks */}
                  <div className="bg-white rounded-xl border shadow-sm p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <Users size={14} className="text-gray-400" /> All Assigned Tasks
                    </h3>
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-3 text-[11px] text-gray-500 uppercase tracking-wider font-medium pb-1 border-b">
                        <span>Assigned to</span>
                        <span className="text-center">Amount</span>
                        <span className="text-right">% from all</span>
                      </div>
                      {assignments.map(([name, count]) => {
                        const pct = Math.round(count / tasks.length * 100);
                        return (
                          <div key={name} className="space-y-1">
                            <div className="grid grid-cols-3 text-xs items-center">
                              <span className="text-blue-600 font-medium truncate">{name}</span>
                              <span className="text-center text-gray-800 font-semibold">{count}</span>
                              <span className="text-right text-gray-400">{pct}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Overdue */}
                  {overdueTasks.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
                      <h3 className="text-sm font-semibold text-red-700 flex items-center gap-2">
                        <AlertTriangle size={14} /> Overdue ({overdueTasks.length})
                      </h3>
                      {overdueTasks.slice(0, 5).map(t => (
                        <div key={t.id} onClick={() => loadDetail(t.id)} className="text-xs text-red-600 cursor-pointer hover:underline">
                          <span className="font-medium">{t.title}</span>
                          <span className="text-red-400"> — due {fmtDate(t.due_date)}</span>
                        </div>
                      ))}
                    </div>
                  )}
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
                    <option value="all">All Status ({tasks.length})</option>
                    {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label} ({counts[k] || 0})</option>)}
                  </select>
                  <select value={filterAssigned} onChange={(e) => { setFilterAssigned(e.target.value); setPage(1); }}
                    className="px-3 py-2 border rounded-lg text-sm bg-white">
                    <option value="all">All Staff</option>
                    {assignments.map(([name]) => <option key={name} value={name}>{name}</option>)}
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
                    placeholder="Search..." className="pl-9 pr-4 py-2 border rounded-lg text-sm w-full sm:w-56 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <CheckSquare size={32} className="text-gray-300 mb-3" />
                  <p className="text-sm text-gray-400">No tasks found</p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[11px] text-gray-500 uppercase tracking-wider border-b bg-gray-50/50">
                          <th className="pl-4 pr-2 py-3 font-medium w-12">ID</th>
                          <th className="px-3 py-3 font-medium">Title</th>
                          <th className="px-3 py-3 font-medium">Status</th>
                          <th className="px-3 py-3 font-medium">Priority</th>
                          <th className="px-3 py-3 font-medium">Customer</th>
                          <th className="px-3 py-3 font-medium">Assigned To</th>
                          <th className="px-3 py-3 font-medium">Created By</th>
                          <th className="px-3 py-3 font-medium">Due Date</th>
                          <th className="px-3 py-3 font-medium">Created</th>
                          <th className="px-3 py-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginated.map((t, idx) => (
                          <tr key={t.id} onClick={() => loadDetail(t.id)} className={`border-b last:border-0 hover:bg-blue-50/30 transition-colors cursor-pointer ${isOverdue(t.due_date, t.status) ? 'bg-red-50/30' : ''}`}>
                            <td className="pl-4 pr-2 py-3 text-xs font-mono text-gray-400">{(page - 1) * perPage + idx + 1}</td>
                            <td className="px-3 py-3">
                              <button onClick={() => loadDetail(t.id)} className="text-left">
                                <p className="font-medium text-blue-700 hover:underline">{t.title}</p>
                                {t.description && <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[200px]">{t.description}</p>}
                              </button>
                            </td>
                            <td className="px-3 py-3">
                              <select value={t.status} onChange={(e) => handleStatusChange(t.id, e.target.value)}
                                className={`text-[11px] font-medium px-2 py-1 rounded-full cursor-pointer border-0 ${STATUS_META[t.status]?.color || 'bg-gray-100'}`}>
                                {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                              </select>
                            </td>
                            <td className="px-3 py-3">
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${PRIORITY_META[t.priority]?.color || ''}`}>
                                {PRIORITY_META[t.priority]?.label || t.priority}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              {t.customer_name ? (
                                <span className="text-sm text-blue-600 cursor-pointer hover:underline" onClick={() => t.user_id && navigate(`/customers/${t.user_id}`)}>
                                  {t.customer_name}
                                </span>
                              ) : <span className="text-gray-400">—</span>}
                            </td>
                            <td className="px-3 py-3 text-sm text-gray-600">{t.assigned_name || <span className="text-gray-400">—</span>}</td>
                            <td className="px-3 py-3 text-sm text-gray-600">{t.created_by_name || <span className="text-gray-400">—</span>}</td>
                            <td className="px-3 py-3 text-xs">
                              {t.due_date ? (
                                <span className={`flex items-center gap-1 ${isOverdue(t.due_date, t.status) ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                                  <Calendar size={12} /> {fmtDate(t.due_date)}
                                </span>
                              ) : <span className="text-gray-400">—</span>}
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-500">{fmtDateTime(t.created_at)}</td>
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
                  {/* Mobile cards */}
                  <div className="md:hidden divide-y">
                    {paginated.map((t) => (
                      <button key={t.id} onClick={() => loadDetail(t.id)}
                        className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors ${isOverdue(t.due_date, t.status) ? 'bg-red-50/30' : ''}`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_META[t.status]?.dot || 'bg-gray-400'}`} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">{t.title}</p>
                              <p className="text-[11px] text-gray-400">
                                {t.assigned_name || 'Unassigned'}{t.customer_name ? ` · ${t.customer_name}` : ''}{t.due_date ? ` · ${fmtDate(t.due_date)}` : ''}
                              </p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${PRIORITY_META[t.priority]?.color || ''}`}>
                            {PRIORITY_META[t.priority]?.label || t.priority}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t text-sm">
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
                            className={`px-3 py-1.5 border rounded text-xs ${p === page ? 'bg-amber-500/90 text-white border-amber-500' : 'hover:bg-gray-50'}`}>
                            {p}
                          </button>
                        );
                      })}
                      <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages || totalPages === 0}
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
