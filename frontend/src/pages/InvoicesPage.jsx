import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Search, Loader2, CheckCircle, Clock, XCircle, AlertTriangle,
  RefreshCw, X, ChevronDown, ChevronUp, Eye, Plus, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { invoicesApi, billableItemsApi, customersApi } from '../services/api';
import SubscriptionGate from '../components/SubscriptionGate';

const STATUS_META = {
  paid:      { label: 'Paid',      icon: CheckCircle,   color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  issued:    { label: 'Issued',    icon: Clock,          color: 'bg-blue-50 text-blue-700',       dot: 'bg-blue-500' },
  draft:     { label: 'Draft',     icon: FileText,       color: 'bg-gray-100 text-gray-600',      dot: 'bg-gray-400' },
  overdue:   { label: 'Overdue',   icon: AlertTriangle,  color: 'bg-red-50 text-red-700',         dot: 'bg-red-500' },
  cancelled: { label: 'Cancelled', icon: XCircle,        color: 'bg-orange-50 text-orange-600',   dot: 'bg-orange-400' },
  credited:  { label: 'Credited',  icon: XCircle,        color: 'bg-purple-50 text-purple-700',   dot: 'bg-purple-500' },
};

const TYPE_LABEL = {
  subscription: 'Subscription',
  once_off: 'Once-off',
  credit_note: 'Credit Note',
  proforma: 'Proforma',
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtAmount = (v) => 'R' + parseFloat(v || 0).toFixed(2);

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ user_id: '', type: 'once_off', notes: '', due_date: '', period_start: '', period_end: '' });
  const [lineItems, setLineItems] = useState([{ description: '', quantity: 1, unit_price: 0 }]);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await invoicesApi.getAll(params);
      setInvoices(res.data || []);
      setSummary(res.summary || null);
    } catch (err) {
      if (!err.isSubscriptionError) toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  useEffect(() => {
    if (showCreate) {
      billableItemsApi.getAll({ active: 'true' }).then(r => setItems(r.data || [])).catch(() => {});
      customersApi.getAll().then(r => setCustomers(r.data || [])).catch(() => {});
    }
  }, [showCreate]);

  const addLine = () => setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0 }]);
  const removeLine = (i) => setLineItems(lineItems.filter((_, idx) => idx !== i));
  const updateLine = (i, field, val) => { const u = [...lineItems]; u[i] = { ...u[i], [field]: val }; setLineItems(u); };
  const pickItem = (i, itemId) => {
    const item = items.find(it => it.id === itemId);
    if (item) { const u = [...lineItems]; u[i] = { ...u[i], description: item.name, unit_price: parseFloat(item.price) }; setLineItems(u); }
  };
  const lineTotal = lineItems.reduce((s, l) => s + (parseFloat(l.quantity) || 0) * (parseFloat(l.unit_price) || 0), 0);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.user_id) return toast.error('Select a customer');
    if (!lineItems.some(l => l.description)) return toast.error('Add at least one line item');
    setSubmitting(true);
    try {
      await invoicesApi.create({
        user_id: form.user_id,
        type: form.type,
        notes: form.notes || undefined,
        due_date: form.due_date || undefined,
        period_start: form.period_start || undefined,
        period_end: form.period_end || undefined,
        items: lineItems.filter(l => l.description),
      });
      toast.success('Invoice created');
      setShowCreate(false);
      setForm({ user_id: '', type: 'once_off', notes: '', due_date: '', period_start: '', period_end: '' });
      setLineItems([{ description: '', quantity: 1, unit_price: 0 }]);
      fetchData();
    } catch (err) { toast.error(err.message || 'Failed to create invoice'); }
    finally { setSubmitting(false); }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return invoices;
    const q = search.toLowerCase();
    return invoices.filter(inv =>
      (inv.invoice_number || '').toLowerCase().includes(q) ||
      (inv.customer_name || '').toLowerCase().includes(q) ||
      (inv.customer_username || '').toLowerCase().includes(q)
    );
  }, [invoices, search]);

  const handleExpand = async (id) => {
    if (expanded === id) { setExpanded(null); setDetail(null); return; }
    setExpanded(id);
    setDetailLoading(true);
    try {
      const res = await invoicesApi.getById(id);
      setDetail(res.data);
    } catch (err) { if (!err.isSubscriptionError) toast.error('Failed to load invoice'); }
    finally { setDetailLoading(false); }
  };

  const handleMarkPaid = async (id) => {
    try {
      await invoicesApi.updateStatus(id, 'paid');
      toast.success('Invoice marked as paid');
      fetchData();
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const handleCredit = async (id) => {
    try {
      const res = await invoicesApi.credit(id);
      toast.success(`Credit note ${res.data.credit_note.credit_number} created`);
      fetchData();
    } catch (err) { toast.error(err.message || 'Failed to credit'); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500">All invoices across customers</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border rounded-lg hover:bg-gray-50">
            <RefreshCw size={14} /> Refresh
          </button>
          <SubscriptionGate>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-amber-500/90 rounded-lg hover:bg-amber-600 shadow-sm">
              <Plus size={14} /> New Invoice
            </button>
          </SubscriptionGate>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total Invoiced</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{fmtAmount(summary.total_amount)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{summary.total_invoices} invoices</p>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Paid</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">{fmtAmount(summary.total_paid)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{summary.paid_count} invoices</p>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Outstanding</p>
            <p className="text-xl font-bold text-amber-600 mt-1">{fmtAmount(summary.total_outstanding)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{summary.issued_count} issued</p>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Overdue</p>
            <p className="text-xl font-bold text-red-600 mt-1">{summary.overdue_count}</p>
            <p className="text-xs text-gray-400 mt-0.5">invoices overdue</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice #, customer..."
            className="w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm bg-white" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 border rounded-xl text-sm bg-white">
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="issued">Issued</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Create Invoice modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900">New Invoice</h2>
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
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                    <option value="once_off">Once-off</option>
                    <option value="subscription">Subscription</option>
                    <option value="proforma">Proforma</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">Notes</label>
                  <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional" className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">Period Start</label>
                  <input type="date" value={form.period_start} onChange={e => setForm({ ...form, period_start: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">Period End</label>
                  <input type="date" value={form.period_end} onChange={e => setForm({ ...form, period_end: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>

              {/* Line items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Line Items</p>
                  <button type="button" onClick={addLine} className="text-xs text-amber-600 hover:text-amber-700 font-medium">+ Add Line</button>
                </div>
                <div className="space-y-2">
                  {lineItems.map((line, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        {i === 0 && <label className="text-[10px] text-gray-400 mb-0.5 block">Description</label>}
                        <div className="flex gap-1">
                          <select onChange={e => pickItem(i, e.target.value)} className="w-10 px-1 py-2 border rounded-lg text-xs bg-white shrink-0" title="Pick item">
                            <option value="">...</option>
                            {items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                          </select>
                          <input value={line.description} onChange={e => updateLine(i, 'description', e.target.value)} placeholder="Description" className="flex-1 px-2 py-2 border rounded-lg text-sm" />
                        </div>
                      </div>
                      <div className="col-span-2">
                        {i === 0 && <label className="text-[10px] text-gray-400 mb-0.5 block">Qty</label>}
                        <input type="number" min="1" step="1" value={line.quantity} onChange={e => updateLine(i, 'quantity', e.target.value)} className="w-full px-2 py-2 border rounded-lg text-sm" />
                      </div>
                      <div className="col-span-3">
                        {i === 0 && <label className="text-[10px] text-gray-400 mb-0.5 block">Unit Price</label>}
                        <input type="number" min="0" step="0.01" value={line.unit_price} onChange={e => updateLine(i, 'unit_price', e.target.value)} className="w-full px-2 py-2 border rounded-lg text-sm" />
                      </div>
                      <div className="col-span-2 flex items-center gap-1">
                        <span className="text-sm font-medium text-gray-700 flex-1 text-right">{fmtAmount((parseFloat(line.quantity)||0)*(parseFloat(line.unit_price)||0))}</span>
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
                  {submitting ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-amber-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border rounded-xl">
          <FileText size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No invoices found</p>
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] text-gray-500 uppercase tracking-wider border-b bg-gray-50/50">
                  <th className="pl-4 pr-2 py-3 font-medium">Invoice #</th>
                  <th className="px-3 py-3 font-medium">Customer</th>
                  <th className="px-3 py-3 font-medium">Type</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Period</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium text-right">Total</th>
                  <th className="px-3 py-3 font-medium text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => {
                  const st = STATUS_META[inv.status] || STATUS_META.draft;
                  const StIcon = st.icon;
                  return (
                    <tr key={inv.id} className="border-b last:border-0 hover:bg-gray-50/50">
                      <td className="pl-4 pr-2 py-3">
                        <button onClick={() => handleExpand(inv.id)} className="text-sm font-semibold text-indigo-600 hover:underline">
                          {inv.invoice_number}
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <button onClick={() => navigate(`/customers/${inv.user_id}?tab=invoices`)} className="text-left hover:underline">
                          <p className="font-medium text-gray-900 text-sm">{inv.customer_name || '—'}</p>
                          <p className="text-[10px] text-gray-400">{inv.customer_username || ''}</p>
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-xs text-gray-500">{TYPE_LABEL[inv.type] || inv.type}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.color}`}>
                          <StIcon size={11} /> {st.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-500">
                        {inv.period_start && inv.period_end
                          ? `${fmtDate(inv.period_start)} – ${fmtDate(inv.period_end)}`
                          : '—'}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(inv.created_at)}</td>
                      <td className="px-3 py-3 text-right font-semibold text-gray-900">{fmtAmount(inv.total)}</td>
                      <td className="px-3 py-3 text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          {inv.status === 'issued' && (
                            <button onClick={() => handleMarkPaid(inv.id)}
                              className="px-2 py-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 rounded-md hover:bg-emerald-100">
                              Mark Paid
                            </button>
                          )}
                          {inv.status === 'issued' && (
                            <button onClick={() => handleCredit(inv.id)}
                              className="px-2 py-1 text-[10px] font-medium text-purple-700 bg-purple-50 rounded-md hover:bg-purple-100">
                              Credit
                            </button>
                          )}
                          <button onClick={() => handleExpand(inv.id)}
                            className="p-1 text-gray-400 hover:text-gray-600">
                            <Eye size={14} />
                          </button>
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
            {filtered.map((inv) => {
              const st = STATUS_META[inv.status] || STATUS_META.draft;
              const StIcon = st.icon;
              return (
                <div key={inv.id} className="px-4 py-3" onClick={() => handleExpand(inv.id)}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${st.color}`}>
                        <StIcon size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{inv.invoice_number}</p>
                        <p className="text-xs text-gray-500 truncate">{inv.customer_name || '—'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                          <span className="text-[10px] text-gray-400">{fmtDate(inv.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-900 shrink-0">{fmtAmount(inv.total)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expanded detail modal */}
      {expanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setExpanded(null); setDetail(null); }}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Invoice Detail</h2>
              <button onClick={() => { setExpanded(null); setDetail(null); }} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              {detailLoading ? (
                <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-amber-500" /></div>
              ) : detail ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">Invoice #</p>
                      <p className="font-semibold">{detail.invoice_number}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Status</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${(STATUS_META[detail.status] || STATUS_META.draft).color}`}>
                        {(STATUS_META[detail.status] || STATUS_META.draft).label}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Customer</p>
                      <p className="font-medium">{detail.customer_name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Date</p>
                      <p>{fmtDate(detail.created_at)}</p>
                    </div>
                    {detail.period_start && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-400">Billing Period</p>
                        <p>{fmtDate(detail.period_start)} – {fmtDate(detail.period_end)}</p>
                      </div>
                    )}
                  </div>

                  {/* Line items */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[10px] text-gray-500 uppercase border-b bg-gray-50/50">
                          <th className="px-3 py-2 font-medium">Item</th>
                          <th className="px-3 py-2 font-medium text-right">Qty</th>
                          <th className="px-3 py-2 font-medium text-right">Price</th>
                          <th className="px-3 py-2 font-medium text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(detail.items || []).map((item, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="px-3 py-2 text-gray-700">{item.description}</td>
                            <td className="px-3 py-2 text-right text-gray-500">{parseFloat(item.quantity)}</td>
                            <td className="px-3 py-2 text-right text-gray-500">{fmtAmount(item.unit_price)}</td>
                            <td className="px-3 py-2 text-right font-medium">{fmtAmount(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-100">
                          <td colSpan="3" className="px-3 py-2 text-right font-bold text-gray-800">Total</td>
                          <td className="px-3 py-2 text-right font-bold">{fmtAmount(detail.total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {detail.notes && <p className="text-xs text-gray-500 italic">{detail.notes}</p>}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {detail.status === 'issued' && (
                      <button onClick={() => { handleMarkPaid(detail.id); setExpanded(null); setDetail(null); }}
                        className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600">
                        Mark as Paid
                      </button>
                    )}
                    {detail.status === 'issued' && (
                      <button onClick={() => { handleCredit(detail.id); setExpanded(null); setDetail(null); }}
                        className="px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100">
                        Credit
                      </button>
                    )}
                    <button onClick={() => navigate(`/customers/${detail.user_id}?tab=invoices`)}
                      className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                      View Customer
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
