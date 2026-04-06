import { useState, useEffect } from 'react';
import { Loader2, FileText, Eye, Download, CheckCircle, Clock, XCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { invoicesApi } from '../services/api';

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

export default function CustomerInvoices({ customerId }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await invoicesApi.getByUser(customerId, params);
      setInvoices(res.data);
    } catch (err) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, [customerId, statusFilter]);

  const handleExpand = async (id) => {
    if (expanded === id) { setExpanded(null); setDetail(null); return; }
    setExpanded(id);
    setDetailLoading(true);
    try {
      const res = await invoicesApi.getById(id);
      setDetail(res.data);
    } catch { toast.error('Failed to load invoice detail'); }
    finally { setDetailLoading(false); }
  };

  const handleMarkPaid = async (id) => {
    try {
      await invoicesApi.updateStatus(id, 'paid');
      toast.success('Invoice marked as paid');
      fetchInvoices();
      if (expanded === id) handleExpand(id);
    } catch (err) { toast.error(err.message || 'Failed to update'); }
  };

  const handleCredit = async (id) => {
    try {
      const res = await invoicesApi.credit(id);
      toast.success(`Credit note ${res.data.credit_note.credit_number} created`);
      fetchInvoices();
    } catch (err) { toast.error(err.message || 'Failed to credit'); }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Invoices</p>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm bg-white">
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="issued">Issued</option>
          <option value="overdue">Overdue</option>
          <option value="credited">Credited</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-amber-500" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12">
          <FileText size={32} className="text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No invoices yet</p>
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden divide-y">
          {invoices.map((inv) => {
            const st = STATUS_META[inv.status] || STATUS_META.draft;
            const StIcon = st.icon;
            const isOpen = expanded === inv.id;

            return (
              <div key={inv.id}>
                {/* Row */}
                <button onClick={() => handleExpand(inv.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50/50 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${st.color}`}>
                    <StIcon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{inv.invoice_number}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                      <span className="text-[10px] text-gray-400">{TYPE_LABEL[inv.type] || inv.type}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {fmtDate(inv.created_at)}
                      {inv.period_start && inv.period_end && ` · ${fmtDate(inv.period_start)} – ${fmtDate(inv.period_end)}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">{fmtAmount(inv.total)}</p>
                    {inv.status === 'paid' && <p className="text-[10px] text-emerald-600">Paid {fmtDate(inv.paid_at)}</p>}
                    {inv.status === 'issued' && <p className="text-[10px] text-blue-600">Due {fmtDate(inv.due_date)}</p>}
                  </div>
                  <div className="shrink-0 text-gray-300">
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="px-4 pb-4 bg-gray-50/50">
                    {detailLoading ? (
                      <div className="flex justify-center py-6">
                        <Loader2 size={18} className="animate-spin text-amber-500" />
                      </div>
                    ) : detail ? (
                      <div className="space-y-3">
                        {/* Line items */}
                        <div className="bg-white border rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-[10px] text-gray-500 uppercase border-b bg-gray-50/50">
                                <th className="px-3 py-2 font-medium">Description</th>
                                <th className="px-3 py-2 font-medium text-right">Qty</th>
                                <th className="px-3 py-2 font-medium text-right">Unit Price</th>
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
                              <tr className="border-t bg-gray-50/50">
                                <td colSpan="3" className="px-3 py-2 text-right text-xs font-medium text-gray-500">Subtotal</td>
                                <td className="px-3 py-2 text-right font-semibold">{fmtAmount(detail.subtotal)}</td>
                              </tr>
                              {parseFloat(detail.tax) > 0 && (
                                <tr>
                                  <td colSpan="3" className="px-3 py-1.5 text-right text-xs font-medium text-gray-500">Tax</td>
                                  <td className="px-3 py-1.5 text-right">{fmtAmount(detail.tax)}</td>
                                </tr>
                              )}
                              <tr className="bg-gray-100">
                                <td colSpan="3" className="px-3 py-2 text-right text-sm font-bold text-gray-800">Total</td>
                                <td className="px-3 py-2 text-right text-sm font-bold">{fmtAmount(detail.total)}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        {/* Notes */}
                        {detail.notes && (
                          <p className="text-xs text-gray-500 italic">{detail.notes}</p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-1">
                          {inv.status === 'issued' && (
                            <button onClick={() => handleMarkPaid(inv.id)}
                              className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600">
                              Mark as Paid
                            </button>
                          )}
                          {inv.status === 'issued' && (
                            <button onClick={() => handleCredit(inv.id)}
                              className="px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100">
                              Credit
                            </button>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
