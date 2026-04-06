import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  ArrowDownCircle, ArrowUpCircle, Loader2, TicketCheck, Wallet,
  Filter, Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { portalApi } from '../../services/api';

const fmtCurrency = (v) => 'R' + Number(v || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

export default function PortalFinance() {
  const { user, refreshUser } = useOutletContext();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voucherCode, setVoucherCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    portalApi.getTransactions(100).then(res => setTransactions(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleRedeem = async (e) => {
    e.preventDefault();
    if (!voucherCode.trim()) return;
    setRedeeming(true);
    try {
      const res = await portalApi.redeemVoucher(voucherCode.trim());
      toast.success(`Voucher redeemed! +${fmtCurrency(res.data.amount)}`);
      setVoucherCode('');
      await refreshUser();
      const txRes = await portalApi.getTransactions(100);
      setTransactions(txRes.data);
    } catch (err) {
      toast.error(err.message || 'Invalid voucher');
    } finally {
      setRedeeming(false);
    }
  };

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

      {/* Redeem Voucher */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <TicketCheck size={16} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Redeem Voucher</h3>
            <p className="text-[11px] text-gray-400">Enter your prepaid voucher code to add balance</p>
          </div>
        </div>
        <form onSubmit={handleRedeem} className="flex gap-2">
          <input
            type="text"
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
            placeholder="VCH-XXXX-XXXX"
            className="flex-1 px-3.5 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-mono tracking-wider"
          />
          <button type="submit" disabled={redeeming || !voucherCode.trim()}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap flex items-center gap-2">
            {redeeming ? <Loader2 size={14} className="animate-spin" /> : <TicketCheck size={14} />}
            {redeeming ? 'Redeeming...' : 'Redeem'}
          </button>
        </form>
      </div>

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
