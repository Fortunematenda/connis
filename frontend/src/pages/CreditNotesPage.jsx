import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Search, Loader2, Plus, RefreshCw, X, Eye, CheckCircle,
  XCircle, Clock, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { creditNotesApi, customersApi } from '../services/api';

const STATUS_META = {
  draft:     { label: 'Draft',     color: 'bg-gray-100 text-gray-600',      icon: FileText },
  issued:    { label: 'Issued',    color: 'bg-blue-50 text-blue-700',       icon: Clock },
  applied:   { label: 'Applied',   color: 'bg-emerald-50 text-emerald-700', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-700',         icon: XCircle },
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtAmount = (v) => 'R' + parseFloat(v || 0).toFixed(2);

export default function CreditNotesPage() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ user_id: '', notes: '', apply_to_balance: true });
  const [lineItems, setLineItems] = useState([{ description: '', quantity: 1, unit_price: 0 }]);
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await creditNotesApi.getAll(params);
      setNotes(res.data || []);
    } catch { toast.error('Failed to load credit notes'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  useEffect(() => {
    if (showCreate) {
      customersApi.getAll().then(r => setCustomers(r.data || [])).catch(() => {});
    }
  }, [showCreate]);

  const filtered = useMemo(() => {
    if (!search.trim()) return notes;
    const q = search.toLowerCase();
    return notes.filter(cn =>
      (cn.credit_number || '').toLowerCase().includes(q) ||
      (cn.customer_name || '').toLowerCase().includes(q) ||
      (cn.customer_username || '').toLowerCase().includes(q)
    );
  }, [notes, search]);

  const addLine = () => setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0 }]);
  const removeLine = (i) => setLineItems(lineItems.filter((_, idx) => idx !== i));
  const updateLine = (i, field, val) => {
    const updated = [...lineItems];
    updated[i] = { ...updated[i], [field]: val };
    setLineItems(updated);
  };

  const lineTotal = lineItems.reduce((s, l) => s + (parseFloat(l.quantity) || 0) * (parseFloat(l.unit_price) || 0), 0);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.user_id) return toast.error('Select a customer');
    if (!lineItems.some(l => l.description)) return toast.error('Add at least one line item');
    setSubmitting(true);
    try {
      await creditNotesApi.create({
        user_id: form.user_id,
        notes: form.notes,
        apply_to_balance: form.apply_to_balance,
        items: lineItems.filter(l => l.description),
      });
      toast.success('Credit note created');
      setShowCreate(false);
      setForm({ user_id: '', notes: '', apply_to_balance: true });
      setLineItems([{ description: '', quantity: 1, unit_price: 0 }]);
      fetchData();
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleViewDetail = async (id) => {
    if (detail?.id === id) { setDetail(null); return; }
    setDetailLoading(true);
    try {
      const res = await creditNotesApi.getById(id);
      setDetail(res.data);
    } catch { toast.error('Failed to load credit note'); }
    finally { setDetailLoading(false); }
  };

  const handleApply = async (id) => {
    try {
      await creditNotesApi.apply(id);
      toast.success('Credit note applied to balance');
      fetchData();
      setDetail(null);
    } catch (err) { toast.error(err.message || 'Failed to apply'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Credit Notes</h1>
          <p className="text-sm text-gray-500">Manage refunds and credit notes</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border rounded-lg hover:bg-gray-50">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-amber-500/90 rounded-lg hover:bg-amber-600 shadow-sm">
            <Plus size={14} /> New Credit Note
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search credit notes..."
            className="w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm bg-white" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={14} /></button>}
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2.5 border rounded-xl text-sm bg-white">
          <option value="all">All Status</option>
          <option value="issued">Issued</option>
          <option value="applied">Applied</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full mx-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900">New Credit Note</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">Customer *</label>
                  <select value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                    <option value="">— Select customer —</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.username})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">Notes</label>
                  <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Reason for credit" className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.apply_to_balance} onChange={e => setForm({ ...form, apply_to_balance: e.target.checked })} className="rounded" />
                Apply to customer balance immediately
              </label>

              {/* Line items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Line Items</p>
                  <button type="button" onClick={addLine} className="text-xs text-amber-600 hover:text-amber-700 font-medium">+ Add Line</button>
                </div>
                <div className="space-y-2">
                  {lineItems.map((line, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-6">
                        {i === 0 && <label className="text-[10px] text-gray-400 mb-0.5 block">Description</label>}
                        <input value={line.description} onChange={e => updateLine(i, 'description', e.target.value)} placeholder="Description" className="w-full px-2 py-2 border rounded-lg text-sm" />
                      </div>
                      <div className="col-span-2">
                        {i === 0 && <label className="text-[10px] text-gray-400 mb-0.5 block">Qty</label>}
                        <input type="number" min="1" value={line.quantity} onChange={e => updateLine(i, 'quantity', e.target.value)} className="w-full px-2 py-2 border rounded-lg text-sm" />
                      </div>
                      <div className="col-span-3">
                        {i === 0 && <label className="text-[10px] text-gray-400 mb-0.5 block">Price</label>}
                        <input type="number" min="0" step="0.01" value={line.unit_price} onChange={e => updateLine(i, 'unit_price', e.target.value)} className="w-full px-2 py-2 border rounded-lg text-sm" />
                      </div>
                      <div className="col-span-1 flex items-center">
                        {lineItems.length > 1 && <button type="button" onClick={() => removeLine(i)} className="p-1 text-gray-300 hover:text-red-500"><Trash2 size={13} /></button>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-right mt-2 text-sm font-bold text-gray-900">Total: {fmtAmount(lineTotal)}</div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 text-sm font-medium text-white bg-amber-500/90 rounded-lg hover:bg-amber-600 disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create Credit Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-amber-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border rounded-xl">
          <FileText size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No credit notes found</p>
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] text-gray-500 uppercase tracking-wider border-b bg-gray-50/50">
                  <th className="pl-4 pr-2 py-3 font-medium">Credit #</th>
                  <th className="px-3 py-3 font-medium">Customer</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium text-right">Total</th>
                  <th className="px-3 py-3 font-medium text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(cn => {
                  const st = STATUS_META[cn.status] || STATUS_META.draft;
                  const StIcon = st.icon;
                  return (
                    <tr key={cn.id} className="border-b last:border-0 hover:bg-gray-50/50">
                      <td className="pl-4 pr-2 py-3">
                        <button onClick={() => handleViewDetail(cn.id)} className="text-sm font-semibold text-indigo-600 hover:underline">{cn.credit_number}</button>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-gray-900 text-sm">{cn.customer_name || '—'}</p>
                        <p className="text-[10px] text-gray-400">{cn.customer_username || ''}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.color}`}>
                          <StIcon size={11} /> {st.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-500">{fmtDate(cn.created_at)}</td>
                      <td className="px-3 py-3 text-right font-semibold text-emerald-600">+{fmtAmount(cn.total)}</td>
                      <td className="px-3 py-3 text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          {cn.status === 'issued' && (
                            <button onClick={() => handleApply(cn.id)} className="px-2 py-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 rounded-md hover:bg-emerald-100">Apply</button>
                          )}
                          <button onClick={() => handleViewDetail(cn.id)} className="p-1 text-gray-400 hover:text-gray-600"><Eye size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y">
            {filtered.map(cn => {
              const st = STATUS_META[cn.status] || STATUS_META.draft;
              const StIcon = st.icon;
              return (
                <div key={cn.id} className="px-4 py-3" onClick={() => handleViewDetail(cn.id)}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${st.color}`}><StIcon size={16} /></div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{cn.credit_number}</p>
                        <p className="text-xs text-gray-500 truncate">{cn.customer_name || '—'}</p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-emerald-600 shrink-0">+{fmtAmount(cn.total)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900">{detail.credit_number}</h2>
              <button onClick={() => setDetail(null)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {detailLoading ? <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-amber-500" /></div> : (
                <>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-gray-400">Customer</p><p className="font-medium">{detail.customer_name || '—'}</p></div>
                    <div><p className="text-xs text-gray-400">Status</p><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${(STATUS_META[detail.status]||STATUS_META.draft).color}`}>{(STATUS_META[detail.status]||STATUS_META.draft).label}</span></div>
                    <div><p className="text-xs text-gray-400">Date</p><p>{fmtDate(detail.created_at)}</p></div>
                    <div><p className="text-xs text-gray-400">Total</p><p className="font-bold text-emerald-600">+{fmtAmount(detail.total)}</p></div>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead><tr className="text-left text-[10px] text-gray-500 uppercase border-b bg-gray-50/50">
                        <th className="px-3 py-2 font-medium">Item</th><th className="px-3 py-2 font-medium text-right">Qty</th><th className="px-3 py-2 font-medium text-right">Price</th><th className="px-3 py-2 font-medium text-right">Total</th>
                      </tr></thead>
                      <tbody>
                        {(detail.items||[]).map((it,i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="px-3 py-2 text-gray-700">{it.description}</td>
                            <td className="px-3 py-2 text-right text-gray-500">{parseFloat(it.quantity)}</td>
                            <td className="px-3 py-2 text-right text-gray-500">{fmtAmount(it.unit_price)}</td>
                            <td className="px-3 py-2 text-right font-medium">{fmtAmount(it.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot><tr className="bg-gray-100"><td colSpan="3" className="px-3 py-2 text-right font-bold text-gray-800">Total</td><td className="px-3 py-2 text-right font-bold">{fmtAmount(detail.total)}</td></tr></tfoot>
                    </table>
                  </div>
                  {detail.notes && <p className="text-xs text-gray-500 italic">{detail.notes}</p>}
                  <div className="flex gap-2 pt-2">
                    {detail.status === 'issued' && <button onClick={() => { handleApply(detail.id); }} className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600">Apply to Balance</button>}
                    {detail.user_id && <button onClick={() => { setDetail(null); navigate(`/customers/${detail.user_id}?tab=finance`); }} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">View Customer</button>}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
