import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpCircle, ArrowDownCircle, Search, Loader2, DollarSign, Plus,
  Filter, Download, RefreshCw, X,
} from 'lucide-react';
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

export default function TransactionsPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter !== 'all') params.type = typeFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      const res = await transactionsApi.getAll(params);
      setTransactions(res.data || []);
    } catch (err) {
      if (!err.isSubscriptionError) toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [typeFilter, categoryFilter]);

  const filtered = useMemo(() => {
    if (!search.trim()) return transactions;
    const q = search.toLowerCase();
    return transactions.filter(tx =>
      (tx.customer_name || '').toLowerCase().includes(q) ||
      (tx.customer_username || '').toLowerCase().includes(q) ||
      (tx.description || '').toLowerCase().includes(q) ||
      (tx.reference || '').toLowerCase().includes(q)
    );
  }, [transactions, search]);

  // Summary stats
  const totalCredits = useMemo(() => filtered.filter(t => t.type === 'credit').reduce((s, t) => s + parseFloat(t.amount), 0), [filtered]);
  const totalDebits = useMemo(() => filtered.filter(t => t.type === 'debit').reduce((s, t) => s + parseFloat(t.amount), 0), [filtered]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Transactions</h1>
          <p className="text-sm text-gray-500">All financial transactions across customers</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border rounded-lg hover:bg-gray-50">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total Credits</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">+{fmtAmount(totalCredits)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{filtered.filter(t => t.type === 'credit').length} transactions</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total Debits</p>
          <p className="text-2xl font-bold text-red-600 mt-1">−{fmtAmount(totalDebits)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{filtered.filter(t => t.type === 'debit').length} transactions</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Net</p>
          <p className={`text-2xl font-bold mt-1 ${totalCredits - totalDebits >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
            {fmtAmount(totalCredits - totalDebits)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{filtered.length} total transactions</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, description, reference..."
            className="w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm bg-white" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2.5 border rounded-xl text-sm bg-white">
          <option value="all">All Types</option>
          <option value="credit">Credits</option>
          <option value="debit">Debits</option>
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2.5 border rounded-xl text-sm bg-white">
          <option value="all">All Categories</option>
          <option value="manual">Manual</option>
          <option value="voucher">Voucher</option>
          <option value="payment">Payment</option>
          <option value="subscription">Subscription</option>
          <option value="adjustment">Adjustment</option>
          <option value="refund">Refund</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-amber-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border rounded-xl">
          <DollarSign size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No transactions found</p>
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] text-gray-500 uppercase tracking-wider border-b bg-gray-50/50">
                  <th className="pl-4 pr-2 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Customer</th>
                  <th className="px-3 py-3 font-medium">Type</th>
                  <th className="px-3 py-3 font-medium">Category</th>
                  <th className="px-3 py-3 font-medium">Description</th>
                  <th className="px-3 py-3 font-medium">By</th>
                  <th className="px-3 py-3 font-medium text-right pr-4">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => {
                  const cat = CATEGORY_META[tx.category] || CATEGORY_META.manual;
                  return (
                    <tr key={tx.id} className="border-b last:border-0 hover:bg-gray-50/50 cursor-pointer"
                      onClick={() => tx.user_id && navigate(`/customers/${tx.user_id}?tab=finance`)}>
                      <td className="pl-4 pr-2 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(tx.created_at)}</td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-gray-900 text-sm">{tx.customer_name || '—'}</p>
                        <p className="text-[10px] text-gray-400">{tx.customer_username || ''}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {tx.type === 'credit' ? <ArrowDownCircle size={13} /> : <ArrowUpCircle size={13} />}
                          {tx.type === 'credit' ? 'Credit' : 'Debit'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cat.color}`}>{cat.label}</span>
                      </td>
                      <td className="px-3 py-3 text-gray-600 max-w-[250px] truncate">{tx.description || '—'}</td>
                      <td className="px-3 py-3 text-xs text-gray-400">{tx.created_by_name || 'System'}</td>
                      <td className={`px-3 py-3 text-right pr-4 font-semibold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {tx.type === 'credit' ? '+' : '−'}{fmtAmount(tx.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y">
            {filtered.map((tx) => {
              const cat = CATEGORY_META[tx.category] || CATEGORY_META.manual;
              return (
                <div key={tx.id} className="px-4 py-3 active:bg-gray-50"
                  onClick={() => tx.user_id && navigate(`/customers/${tx.user_id}?tab=finance`)}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {tx.type === 'credit' ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{tx.customer_name || tx.description || 'Transaction'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${cat.color}`}>{cat.label}</span>
                          <span className="text-[10px] text-gray-400">{fmtDate(tx.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <p className={`text-sm font-bold shrink-0 ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {tx.type === 'credit' ? '+' : '−'}{fmtAmount(tx.amount)}
                    </p>
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
