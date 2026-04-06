import { useState, useEffect, useMemo } from 'react';
import { Plus, Loader2, Pencil, Trash2, X, Check, Shield, RefreshCw, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { staffApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ROLE_LABELS = {
  owner: 'Owner',
  admin: 'Admin',
  support: 'Support',
  accounts: 'Accounts',
  technician: 'Technician',
};

const ASSIGNABLE_ROLES = ['admin', 'support', 'accounts', 'technician'];

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none';

export default function StaffPage() {
  const { admin: currentAdmin } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', full_name: '', phone: '', role: 'support' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Table controls
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const fetchStaff = async () => {
    try {
      const res = await staffApi.getAll();
      setStaff(res.data);
    } catch (err) {
      toast.error('Failed to load staff: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  // Filtering + sorting + pagination
  const filtered = useMemo(() => {
    let list = [...staff];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((m) =>
        m.email?.toLowerCase().includes(q) ||
        m.full_name?.toLowerCase().includes(q) ||
        m.phone?.toLowerCase().includes(q) ||
        m.role?.toLowerCase().includes(q)
      );
    }
    if (sortCol) {
      list.sort((a, b) => {
        const av = (a[sortCol] || '').toString().toLowerCase();
        const bv = (b[sortCol] || '').toString().toLowerCase();
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return list;
  }, [staff, search, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const startIdx = (safePage - 1) * pageSize + 1;
  const endIdx = Math.min(safePage * pageSize, filtered.length);

  const toggleSort = (col) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  // CRUD handlers
  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await staffApi.create(form);
      toast.success('Staff member added');
      setForm({ email: '', password: '', full_name: '', phone: '', role: 'support' });
      setShowModal(false);
      fetchStaff();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (member) => {
    setEditingId(member.id);
    setEditForm({ full_name: member.full_name || '', phone: member.phone || '', role: member.role, password: '' });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({}); };

  const saveEdit = async () => {
    setEditSaving(true);
    try {
      const payload = { ...editForm };
      if (!payload.password) delete payload.password;
      await staffApi.update(editingId, payload);
      toast.success('Staff updated');
      setEditingId(null);
      fetchStaff();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const handleToggleActive = async (member) => {
    try {
      await staffApi.update(member.id, { active: !member.active });
      toast.success(member.active ? 'Staff deactivated' : 'Staff activated');
      fetchStaff();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (member) => {
    if (!window.confirm(`Remove "${member.full_name || member.email}" from staff?`)) return;
    try {
      await staffApi.remove(member.id);
      toast.success('Staff removed');
      fetchStaff();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const SortHeader = ({ col, children }) => (
    <th
      className="px-4 py-3 font-semibold text-xs text-blue-600 uppercase tracking-wide cursor-pointer select-none hover:bg-gray-100 transition"
      onClick={() => toggleSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <ArrowUpDown size={12} className={sortCol === col ? 'text-blue-600' : 'text-gray-300'} />
      </span>
    </th>
  );

  return (
    <div>
      {/* Breadcrumb header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-blue-500 font-medium mb-0.5">Administration /</p>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Shield size={22} className="text-gray-700" />
            Administrators
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm">
            <Plus size={16} />
            Add
          </button>
          <button onClick={() => { setLoading(true); fetchStaff(); }}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition" title="Refresh">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-xl border shadow-sm">
        {/* Toolbar: entries + search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 border-b">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span>entries</span>
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-8 pr-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/80">
                  <SortHeader col="email">Admin Login</SortHeader>
                  <SortHeader col="full_name">Full Name</SortHeader>
                  <SortHeader col="role">Role</SortHeader>
                  <SortHeader col="phone">Phone</SortHeader>
                  <th className="px-4 py-3 font-semibold text-xs text-blue-600 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 font-semibold text-xs text-blue-600 uppercase tracking-wide text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      {search ? 'No results found.' : 'No administrators yet. Click "Add" to create one.'}
                    </td>
                  </tr>
                ) : (
                  paged.map((member) => {
                    const isEditing = editingId === member.id;
                    const isOwner = member.role === 'owner';
                    const isSelf = member.id === currentAdmin?.id;

                    if (isEditing) {
                      return (
                        <tr key={member.id} className="bg-blue-50/40">
                          <td className="px-4 py-2.5 text-gray-400 text-xs">{member.email}</td>
                          <td className="px-4 py-2.5">
                            <input type="text" value={editForm.full_name}
                              onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                              className="px-2 py-1 border rounded text-sm w-full max-w-[200px]" />
                          </td>
                          <td className="px-4 py-2.5">
                            {isOwner ? (
                              <span className="text-xs font-medium text-yellow-700">Owner</span>
                            ) : (
                              <select value={editForm.role}
                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                className="px-2 py-1 border rounded text-xs">
                                {ASSIGNABLE_ROLES.map((r) => (
                                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <input type="text" value={editForm.phone}
                              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                              className="px-2 py-1 border rounded text-sm w-full max-w-[160px]" />
                          </td>
                          <td className="px-4 py-2.5">
                            <input type="password" value={editForm.password} placeholder="New password (optional)"
                              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                              className="px-2 py-1 border rounded text-sm w-full max-w-[180px]" />
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex gap-1 justify-end">
                              <button onClick={saveEdit} disabled={editSaving}
                                className="p-1.5 text-green-700 bg-green-50 hover:bg-green-100 rounded transition" title="Save">
                                <Check size={14} />
                              </button>
                              <button onClick={cancelEdit}
                                className="p-1.5 text-gray-500 bg-gray-50 hover:bg-gray-100 rounded transition" title="Cancel">
                                <X size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={member.id} className="hover:bg-gray-50/70 transition">
                        <td className="px-4 py-2.5 text-gray-700">{member.email}</td>
                        <td className="px-4 py-2.5 text-gray-900 font-medium">
                          {member.full_name || '—'}
                          {isSelf && <span className="ml-1.5 text-[10px] text-blue-500 font-semibold align-super">(you)</span>}
                        </td>
                        <td className="px-4 py-2.5 text-gray-700">{ROLE_LABELS[member.role] || member.role}</td>
                        <td className="px-4 py-2.5 text-gray-600">{member.phone || '—'}</td>
                        <td className="px-4 py-2.5">
                          {member.active ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex gap-0.5 justify-end">
                            <button onClick={() => startEdit(member)} title="Edit"
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition">
                              <Pencil size={13} />
                            </button>
                            {!isOwner && !isSelf && (
                              <>
                                <button onClick={() => handleToggleActive(member)}
                                  title={member.active ? 'Deactivate' : 'Activate'}
                                  className={`p-1.5 rounded transition ${member.active ? 'text-orange-500 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}>
                                  {member.active ? <X size={13} /> : <Check size={13} />}
                                </button>
                                <button onClick={() => handleDelete(member)} title="Remove"
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded transition">
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {!loading && filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t text-sm text-gray-500">
            <span>
              Showing {startIdx} to {endIdx} of {filtered.length} entries
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={safePage === 1}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-default transition">
                <ChevronsLeft size={16} />
              </button>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-default transition">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - safePage) <= 2 || p === 1 || p === totalPages)
                .map((p, i, arr) => {
                  const prev = arr[i - 1];
                  const gap = prev && p - prev > 1;
                  return (
                    <span key={p} className="flex items-center">
                      {gap && <span className="px-1 text-gray-300">...</span>}
                      <button
                        onClick={() => setPage(p)}
                        className={`min-w-[28px] h-7 text-xs font-medium rounded transition ${
                          p === safePage
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  );
                })}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-default transition">
                <ChevronRight size={16} />
              </button>
              <button onClick={() => setPage(totalPages)} disabled={safePage === totalPages}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-default transition">
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Add Administrator</h2>
              <button onClick={() => { setShowModal(false); setError(''); }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 p-2.5 rounded-lg">{error}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                  <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className={inputCls} required placeholder="Fortune Matenda" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email (Login) *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={inputCls} required placeholder="support@company.co.za" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Password *</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className={inputCls} required minLength={6} placeholder="Min 6 characters" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                  <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={inputCls} placeholder="27612685033" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Role *</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputCls}>
                    {ASSIGNABLE_ROLES.map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2 border-t">
                <button type="button" onClick={() => { setShowModal(false); setError(''); }}
                  className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
                  {saving ? 'Adding...' : 'Add Administrator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
