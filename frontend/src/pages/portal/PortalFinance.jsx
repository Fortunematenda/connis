import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  ArrowDownCircle, ArrowUpCircle, Loader2, TicketCheck, Wallet,
  Filter, Download, CreditCard, Building, FileText, CheckCircle,
  Clock, AlertTriangle, ChevronDown, ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { portalApi } from '../../services/api';

const fmtCurrency = (v) => 'R' + Number(v || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

export default function PortalFinance() {
  const { user, refreshUser } = useOutletContext();
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedInv, setExpandedInv] = useState(null);

  useEffect(() => {
    Promise.all([
      portalApi.getTransactions(100).then(res => setTransactions(res.data)).catch(() => {}),
      portalApi.getCompany().then(res => setCompany(res.data)).catch(() => {}),
      portalApi.getInvoices().then(res => setInvoices(res.data || [])).catch(() => {}),
    ]).finally(() => {
      setLoading(false);
      setCompanyLoading(false);
    });
  }, []);

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter);

  const totalCredit = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalDebit = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + parseFloat(t.amount), 0);

  if (!user) return null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Finance</h1>
        <p className="text-sm text-gray-400 mt-0.5">Your balance, vouchers and transaction history</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider mb-2">
            <Wallet size={14} /> Current Balance
          </div>
          <p className={`text-2xl font-black ${parseFloat(user.balance) > 0 ? 'text-blue-600' : 'text-red-500'}`}>
            {fmtCurrency(user.balance)}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider mb-2">
            <ArrowDownCircle size={14} className="text-emerald-500" /> Total Credits
          </div>
          <p className="text-2xl font-black text-emerald-600">{fmtCurrency(totalCredit)}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider mb-2">
            <ArrowUpCircle size={14} className="text-red-400" /> Total Charges
          </div>
          <p className="text-2xl font-black text-red-500">{fmtCurrency(totalDebit)}</p>
        </div>
      </div>

      {/* Payment Options */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
            <CreditCard size={16} className="text-green-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Payment Options</h3>
            <p className="text-[11px] text-gray-400">Make payments to keep your account active</p>
          </div>
        </div>
        {companyLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-blue-500" />
          </div>
        ) : company?.bank_details ? (
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building size={16} className="text-gray-600" />
                <h4 className="text-sm font-semibold text-gray-800">{company.name}</h4>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-medium mb-2">Bank Transfer Details:</p>
                <pre className="text-sm text-gray-700 bg-white rounded p-3 border border-gray-200 whitespace-pre-wrap font-mono">
                  {company.bank_details}
                </pre>
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-700 font-medium">
                <strong>Important:</strong> When making payment, please use your account name <span className="bg-blue-100 px-2 py-0.5 rounded font-mono">{user?.username}</span> as reference.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <CreditCard size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No payment details available</p>
            <p className="text-xs text-gray-300 mt-1">Contact support for payment information</p>
          </div>
        )}
      </div>

      {/* Invoices */}
      {invoices.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center gap-2">
            <FileText size={16} className="text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-800">Invoices</h3>
          </div>
          <div className="divide-y">
            {invoices.map(inv => {
              const isPaid = inv.status === 'paid';
              const isCredited = inv.status === 'credited';
              const isExpanded = expandedInv === inv.id;
              return (
                <div key={inv.id}>
                  <div className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50/50" onClick={() => setExpandedInv(isExpanded ? null : inv.id)}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isPaid ? 'bg-emerald-50 text-emerald-600' : isCredited ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                        {isPaid ? <CheckCircle size={15} /> : isCredited ? <FileText size={15} /> : <Clock size={15} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800">{inv.invoice_number}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isPaid ? 'bg-emerald-50 text-emerald-700' : isCredited ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                            {isPaid ? 'Paid' : isCredited ? 'Credited' : inv.status === 'overdue' ? 'Overdue' : 'Issued'}
                          </span>
                          <span className="text-[10px] text-gray-400">{fmtDate(inv.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold text-gray-900">{fmtCurrency(inv.total)}</span>
                      {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                    </div>
                  </div>
                  {isExpanded && inv.items && (
                    <div className="px-4 pb-3">
                      <div className="border rounded-lg overflow-hidden text-xs">
                        <table className="w-full">
                          <thead><tr className="text-left text-[10px] text-gray-500 uppercase border-b bg-gray-50/50">
                            <th className="px-3 py-1.5">Item</th><th className="px-3 py-1.5 text-right">Qty</th><th className="px-3 py-1.5 text-right">Price</th><th className="px-3 py-1.5 text-right">Total</th>
                          </tr></thead>
                          <tbody>
                            {inv.items.map((it, i) => (
                              <tr key={i} className="border-b last:border-0">
                                <td className="px-3 py-1.5 text-gray-700">{it.description}</td>
                                <td className="px-3 py-1.5 text-right text-gray-500">{parseFloat(it.quantity)}</td>
                                <td className="px-3 py-1.5 text-right text-gray-500">{fmtCurrency(it.unit_price)}</td>
                                <td className="px-3 py-1.5 text-right font-medium">{fmtCurrency(it.total)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot><tr className="bg-gray-50"><td colSpan="3" className="px-3 py-1.5 text-right font-bold">Total</td><td className="px-3 py-1.5 text-right font-bold">{fmtCurrency(inv.total)}</td></tr></tfoot>
                        </table>
                      </div>
                      {inv.due_date && <p className="text-[10px] text-gray-400 mt-1">Due: {fmtDate(inv.due_date)}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-gray-800">Transaction History</h3>
          <div className="flex items-center gap-2">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}
              className="px-2.5 py-1.5 border rounded-lg text-xs bg-white text-gray-600">
              <option value="all">All</option>
              <option value="credit">Credits only</option>
              <option value="debit">Charges only</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 size={20} className="animate-spin text-blue-500" /></div>
        ) : filtered.length > 0 ? (
          <div className="divide-y">
            {filtered.map((tx) => (
              <div key={tx.id} className="px-4 py-3.5 flex items-center justify-between hover:bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                  }`}>
                    {tx.type === 'credit' ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{tx.description || (tx.type === 'credit' ? 'Top-up' : 'Charge')}</p>
                    <p className="text-[11px] text-gray-400">{fmtDateTime(tx.created_at)}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {tx.type === 'credit' ? '+' : '-'}{fmtCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-16 text-center">
            <Wallet size={28} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No transactions yet</p>
            <p className="text-xs text-gray-300 mt-1">Redeem a voucher to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
