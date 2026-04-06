import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Search, Loader2, Plus, RefreshCw, X, Eye, Send, CheckCircle,
  XCircle, Clock, ArrowRight, Trash2, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { quotesApi, billableItemsApi, customersApi } from '../services/api';

const STATUS_META = {
  draft:     { label: 'Draft',     color: 'bg-gray-100 text-gray-600',      icon: FileText },
  sent:      { label: 'Sent',      color: 'bg-blue-50 text-blue-700',       icon: Send },
  accepted:  { label: 'Accepted',  color: 'bg-emerald-50 text-emerald-700', icon: CheckCircle },
  rejected:  { label: 'Rejected',  color: 'bg-red-50 text-red-700',         icon: XCircle },
  expired:   { label: 'Expired',   color: 'bg-orange-50 text-orange-600',   icon: AlertTriangle },
  converted: { label: 'Converted', color: 'bg-purple-50 text-purple-700',   icon: ArrowRight },
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtAmount = (v) => 'R' + parseFloat(v || 0).toFixed(2);

export default function QuotesPage() {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ user_id: '', customer_name: '', customer_email: '', notes: '', valid_until: '' });
  const [lineItems, setLineItems] = useState([{ description: '', quantity: 1, unit_price: 0 }]);
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await quotesApi.getAll(params);
      setQuotes(res.data || []);
    } catch { toast.error('Failed to load quotes'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchQuotes(); }, [statusFilter]);

  useEffect(() => {
    if (showCreate) {
      billableItemsApi.getAll({ active: 'true' }).then(r => setItems(r.data || [])).catch(() => {});
      customersApi.getAll().then(r => setCustomers(r.data || [])).catch(() => {});
    }
  }, [showCreate]);

  const filtered = useMemo(() => {
    if (!search.trim()) return quotes;
    const q = search.toLowerCase();
    return quotes.filter(qo =>
      (qo.quote_number || '').toLowerCase().includes(q) ||
      (qo.customer_name_db || qo.customer_name || '').toLowerCase().includes(q) ||
      (qo.username || '').toLowerCase().includes(q)
    );
  }, [quotes, search]);

  const addLine = () => setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0 }]);
  const removeLine = (i) => setLineItems(lineItems.filter((_, idx) => idx !== i));
  const updateLine = (i, field, val) => {
    const updated = [...lineItems];
    updated[i] = { ...updated[i], [field]: val };
    setLineItems(updated);
  };
  const pickItem = (i, itemId) => {
    const item = items.find(it => it.id === itemId);
    if (item) {
      const updated = [...lineItems];
      updated[i] = { ...updated[i], description: item.name, unit_price: parseFloat(item.price), item_id: item.id };
      setLineItems(updated);
    }
  };

  const lineTotal = lineItems.reduce((s, l) => s + (parseFloat(l.quantity) || 0) * (parseFloat(l.unit_price) || 0), 0);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!lineItems.some(l => l.description)) return toast.error('Add at least one line item');
    setSubmitting(true);
    try {
      await quotesApi.create({
        ...form,
        user_id: form.user_id || null,
        items: lineItems.filter(l => l.description),
      });
      toast.success('Quote created');
      setShowCreate(false);
      setForm({ user_id: '', customer_name: '', customer_email: '', notes: '', valid_until: '' });
      setLineItems([{ description: '', quantity: 1, unit_price: 0 }]);
      fetchQuotes();
    } catch (err) { toast.error(err.message || 'Failed to create quote'); }
    finally { setSubmitting(false); }
  };

  const handleViewDetail = async (id) => {
    if (detail?.id === id) { setDetail(null); return; }
    setDetailLoading(true);
    try {
      const res = await quotesApi.getById(id);
      setDetail(res.data);
    } catch { toast.error('Failed to load quote'); }
    finally { setDetailLoading(false); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await quotesApi.updateStatus(id, status);
      toast.success(`Quote ${status}`);
      fetchQuotes();
      setDetail(null);
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const handleConvert = async (id) => {
    try {
      const res = await quotesApi.convertToInvoice(id);
      toast.success(`Converted to invoice ${res.data.invoice.invoice_number}`);
      fetchQuotes();
      setDetail(null);
    } catch (err) { toast.error(err.message || 'Failed to convert'); }
  };

  const handleDelete = async (id) => {
    try {
      await quotesApi.delete(id);
      toast.success('Quote deleted');
      fetchQuotes();
      setDetail(null);
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Quotes</h1>
          <p className="text-sm text-gray-500">Create and manage customer quotes</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchQuotes} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border rounded-lg hover:bg-gray-50">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-amber-500/90 rounded-lg hover:bg-amber-600 shadow-sm">
            <Plus size={14} /> New Quote
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search quotes..."
            className="w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm bg-white" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={14} /></button>}
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2.5 border rounded-xl text-sm bg-white">
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="converted">Converted</option>
        </select>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900">New Quote</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">Customer (optional)</label>
                  <select value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                    <option value="">— Select customer —</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.username})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">Or customer name</label>
                  <input value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} placeholder="Name" className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">Valid Until</label>
                  <input type="date" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">Notes</label>
                  <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional" className="w-full px-3 py-2 border rounded-lg text-sm" />
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
                  {submitting ? 'Creating...' : 'Create Quote'}
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
          <p className="text-gray-400 font-medium">No quotes found</p>
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] text-gray-500 uppercase tracking-wider border-b bg-gray-50/50">
                  <th className="pl-4 pr-2 py-3 font-medium">Quote #</th>
                  <th className="px-3 py-3 font-medium">Customer</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Valid Until</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium text-right">Total</th>
                  <th className="px-3 py-3 font-medium text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(q => {
                  const st = STATUS_META[q.status] || STATUS_META.draft;
                  const StIcon = st.icon;
                  return (
                    <tr key={q.id} className="border-b last:border-0 hover:bg-gray-50/50">
                      <td className="pl-4 pr-2 py-3">
                        <button onClick={() => handleViewDetail(q.id)} className="text-sm font-semibold text-indigo-600 hover:underline">{q.quote_number}</button>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-gray-900 text-sm">{q.customer_name_db || q.customer_name || '—'}</p>
                        <p className="text-[10px] text-gray-400">{q.username || q.customer_email || ''}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.color}`}>
                          <StIcon size={11} /> {st.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-500">{fmtDate(q.valid_until)}</td>
                      <td className="px-3 py-3 text-xs text-gray-500">{fmtDate(q.created_at)}</td>
                      <td className="px-3 py-3 text-right font-semibold text-gray-900">{fmtAmount(q.total)}</td>
                      <td className="px-3 py-3 text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          {q.status === 'draft' && <button onClick={() => handleStatusChange(q.id, 'sent')} className="px-2 py-1 text-[10px] font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100">Send</button>}
                          {q.status === 'accepted' && <button onClick={() => handleConvert(q.id)} className="px-2 py-1 text-[10px] font-medium text-purple-700 bg-purple-50 rounded-md hover:bg-purple-100">→ Invoice</button>}
                          {q.status === 'draft' && <button onClick={() => handleDelete(q.id)} className="p-1 text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>}
                          <button onClick={() => handleViewDetail(q.id)} className="p-1 text-gray-400 hover:text-gray-600"><Eye size={14} /></button>
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
            {filtered.map(q => {
              const st = STATUS_META[q.status] || STATUS_META.draft;
              const StIcon = st.icon;
              return (
                <div key={q.id} className="px-4 py-3" onClick={() => handleViewDetail(q.id)}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${st.color}`}><StIcon size={16} /></div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{q.quote_number}</p>
                        <p className="text-xs text-gray-500 truncate">{q.customer_name_db || q.customer_name || '—'}</p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-900 shrink-0">{fmtAmount(q.total)}</p>
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
              <h2 className="font-bold text-gray-900">{detail.quote_number}</h2>
              <button onClick={() => setDetail(null)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {detailLoading ? <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-amber-500" /></div> : (
                <>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-gray-400">Customer</p><p className="font-medium">{detail.customer_name_db || detail.customer_name || '—'}</p></div>
                    <div><p className="text-xs text-gray-400">Status</p><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${(STATUS_META[detail.status]||STATUS_META.draft).color}`}>{(STATUS_META[detail.status]||STATUS_META.draft).label}</span></div>
                    <div><p className="text-xs text-gray-400">Valid Until</p><p>{fmtDate(detail.valid_until)}</p></div>
                    <div><p className="text-xs text-gray-400">Created</p><p>{fmtDate(detail.created_at)}</p></div>
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
                  <div className="flex gap-2 pt-2 flex-wrap">
                    {detail.status === 'draft' && <button onClick={() => handleStatusChange(detail.id, 'sent')} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600">Mark Sent</button>}
                    {detail.status === 'sent' && <button onClick={() => handleStatusChange(detail.id, 'accepted')} className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600">Accept</button>}
                    {detail.status === 'sent' && <button onClick={() => handleStatusChange(detail.id, 'rejected')} className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100">Reject</button>}
                    {detail.status === 'accepted' && <button onClick={() => handleConvert(detail.id)} className="px-3 py-1.5 text-xs font-medium text-white bg-purple-500 rounded-lg hover:bg-purple-600">Convert to Invoice</button>}
                    {detail.user_id && <button onClick={() => { setDetail(null); navigate(`/customers/${detail.user_id}`); }} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">View Customer</button>}
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
