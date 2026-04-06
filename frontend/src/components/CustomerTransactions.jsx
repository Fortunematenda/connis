import { useState, useEffect } from 'react';
import { Loader2, ArrowUpCircle, ArrowDownCircle, Plus, DollarSign, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { transactionsApi } from '../services/api';

const CATEGORY_META = {
  manual:       { label: 'Manual',       color: 'bg-gray-100 text-gray-700' },
  voucher:      { label: 'Voucher',      color: 'bg-purple-50 text-purple-700' },
  payment:      { label: 'Payment',      color: 'bg-blue-50 text-blue-700' },
  subscription: { label: 'Subscription', color: 'bg-amber-50 text-amber-700' },
  adjustment:   { label: 'Adjustment',   color: 'bg-orange-50 text-orange-700' },
  refund:       { label: 'Refund',       color: 'bg-emerald-50 text-emerald-700' },
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtAmount = (v) => 'R' + parseFloat(v || 0).toFixed(2);

export default function CustomerTransactions({ customerId, onBalanceUpdate }) {
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: 'credit', amount: '', description: '', category: 'manual' });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') params.type = filter;
      const res = await transactionsApi.getByUser(customerId, params);
      setTransactions(res.data);
      if (res.balance !== undefined) {
        setBalance(res.balance);
        onBalanceUpdate?.(res.balance);
      }
    } catch (err) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [customerId, filter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) return toast.error('Enter a valid amount');
    setSubmitting(true);
    try {
      if (form.type === 'credit') {
        await transactionsApi.credit(customerId, amt, form.description, form.category);
      } else {
        await transactionsApi.debit(customerId, amt, form.description, form.category);
      }
      toast.success(`${form.type === 'credit' ? 'Credit' : 'Debit'} of R${amt.toFixed(2)} recorded`);
      setShowAdd(false);
      setForm({ type: 'credit', amount: '', description: '', category: 'manual' });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Transaction failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Running balance calculation
  let runningBal = balance || 0;
  const txWithBalance = transactions.map((tx, i) => {
    if (i === 0) {
      const row = { ...tx, running_balance: runningBal };
      return row;
    }
    // For older transactions, subtract/add back to compute running balance
    const prev = transactions[i - 1];
    if (prev.type === 'credit') runningBal -= parseFloat(prev.amount);
    else runningBal += parseFloat(prev.amount);
    return { ...tx, running_balance: runningBal };
  });

  return (
    <div className="space-y-4">
      {/* Balance card + controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Computed Balance</p>
          <p className={`text-2xl font-bold ${balance !== null && balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
            {balance !== null ? fmtAmount(balance) : '—'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white">
            <option value="all">All Types</option>
            <option value="credit">Credits</option>
            <option value="debit">Debits</option>
          </select>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-amber-500/90 rounded-lg hover:bg-amber-600 shadow-sm transition-all">
            <Plus size={14} /> Add Transaction
          </button>
        </div>
      </div>

      {/* Add transaction form */}
      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-gray-50 border rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-medium text-gray-500 mb-1 block">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                <option value="credit">Credit (+)</option>
                <option value="debit">Debit (−)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-gray-500 mb-1 block">Amount (R)</label>
              <input type="number" step="0.01" min="0.01" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-gray-500 mb-1 block">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                <option value="manual">Manual</option>
                <option value="payment">Payment</option>
                <option value="voucher">Voucher</option>
                <option value="adjustment">Adjustment</option>
                <option value="refund">Refund</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-gray-500 mb-1 block">Description</label>
              <input type="text" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional note" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={submitting}
              className="px-4 py-1.5 text-sm font-medium text-white bg-amber-500/90 rounded-lg hover:bg-amber-600 disabled:opacity-50">
              {submitting ? 'Saving...' : 'Record'}
            </button>
          </div>
        </form>
      )}

      {/* Transaction list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-amber-500" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12">
          <DollarSign size={32} className="text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No transactions yet</p>
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] text-gray-500 uppercase tracking-wider border-b bg-gray-50/50">
                  <th className="pl-4 pr-2 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Type</th>
                  <th className="px-3 py-3 font-medium">Category</th>
                  <th className="px-3 py-3 font-medium">Description</th>
                  <th className="px-3 py-3 font-medium">Reference</th>
                  <th className="px-3 py-3 font-medium text-right">Amount</th>
                  <th className="px-3 py-3 font-medium text-right pr-4">Balance</th>
                </tr>
              </thead>
              <tbody>
                {txWithBalance.map((tx) => {
                  const cat = CATEGORY_META[tx.category] || CATEGORY_META.manual;
                  return (
                    <tr key={tx.id} className="border-b last:border-0 hover:bg-gray-50/50">
                      <td className="pl-4 pr-2 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(tx.created_at)}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {tx.type === 'credit' ? <ArrowDownCircle size={13} /> : <ArrowUpCircle size={13} />}
                          {tx.type === 'credit' ? 'Credit' : 'Debit'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cat.color}`}>{cat.label}</span>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600 max-w-[250px] truncate">{tx.description || '—'}</td>
                      <td className="px-3 py-3 text-xs font-mono text-gray-400">{tx.reference || '—'}</td>
                      <td className={`px-3 py-3 text-right font-semibold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {tx.type === 'credit' ? '+' : '−'}{fmtAmount(tx.amount)}
                      </td>
                      <td className="px-3 py-3 text-right pr-4 text-sm font-medium text-gray-700">
                        {fmtAmount(tx.running_balance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y">
            {txWithBalance.map((tx) => {
              const cat = CATEGORY_META[tx.category] || CATEGORY_META.manual;
              return (
                <div key={tx.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {tx.type === 'credit' ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{tx.description || (tx.type === 'credit' ? 'Credit' : 'Debit')}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${cat.color}`}>{cat.label}</span>
                          <span className="text-[10px] text-gray-400">{fmtDate(tx.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {tx.type === 'credit' ? '+' : '−'}{fmtAmount(tx.amount)}
                      </p>
                      <p className="text-[10px] text-gray-400">Bal: {fmtAmount(tx.running_balance)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
