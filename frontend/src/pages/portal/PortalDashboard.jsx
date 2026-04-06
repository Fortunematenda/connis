import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Wifi, WifiOff, CreditCard, ArrowDownCircle, ArrowUpCircle,
  Loader2, TicketCheck, Globe, ChevronRight, Headphones, Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { portalApi } from '../../services/api';

const fmtCurrency = (v) => 'R' + Number(v || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

export default function PortalDashboard() {
  const { user, refreshUser } = useOutletContext();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voucherCode, setVoucherCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    portalApi.getTransactions(5).then(res => setTransactions(res.data)).catch(() => {}).finally(() => setLoading(false));
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
      const txRes = await portalApi.getTransactions(5);
      setTransactions(txRes.data);
    } catch (err) {
      toast.error(err.message || 'Invalid voucher');
    } finally {
      setRedeeming(false);
    }
  };

  if (!user) return null;
  const balance = parseFloat(user.balance || 0);

  return (
    <div className="space-y-5">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Welcome back, {user.full_name || user.username}</h1>
        <p className="text-sm text-gray-400 mt-0.5">Here's an overview of your account</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Balance */}
        <div className={`rounded-xl p-4 text-white ${balance > 0 ? 'bg-gradient-to-br from-[#2d2e50] to-indigo-700' : 'bg-gradient-to-br from-red-500 to-red-600'}`}>
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider opacity-70">Balance</p>
            <Wallet size={16} className="opacity-40" />
          </div>
          <p className="text-2xl font-black mt-2">{fmtCurrency(balance)}</p>
          {balance <= 0 && <p className="text-[11px] mt-1.5 opacity-80">Top up to stay connected</p>}
        </div>

        {/* Connection */}
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Connection</p>
            {user.is_online ? <Wifi size={16} className="text-emerald-500" /> : <WifiOff size={16} className="text-gray-300" />}
          </div>
          <p className={`text-lg font-bold mt-2 ${user.is_online ? 'text-emerald-600' : 'text-gray-500'}`}>
            {user.is_online ? 'Online' : 'Offline'}
          </p>
          {user.ip_address && (
            <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-1">
              <Globe size={10} /> {user.ip_address}
            </div>
          )}
        </div>

        {/* Plan */}
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Plan</p>
            <CreditCard size={16} className="text-violet-400" />
          </div>
          <p className="text-lg font-bold text-gray-900 mt-2">{user.plan_name || 'No plan'}</p>
          {user.download_speed && <p className="text-[11px] text-gray-400">{user.download_speed} / {user.upload_speed}</p>}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Redeem Voucher */}
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <TicketCheck size={16} className="text-indigo-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800">Redeem Voucher</h3>
          </div>
          <form onSubmit={handleRedeem} className="space-y-2">
            <input
              type="text"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              placeholder="VCH-XXXX-XXXX"
              className="w-full px-3.5 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 font-mono tracking-wider"
            />
            <button type="submit" disabled={redeeming || !voucherCode.trim()}
              className="w-full py-2.5 bg-[#2d2e50] text-white rounded-lg text-sm font-semibold hover:bg-[#3d3e60] disabled:opacity-50 transition-colors">
              {redeeming ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Redeem'}
            </button>
          </form>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl border p-4 space-y-2">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Quick Links</h3>
          <Link to="/portal/services" className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-600 group">
            <div className="flex items-center gap-2.5">
              <Wifi size={16} className="text-indigo-500" /> View my services
            </div>
            <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500" />
          </Link>
          <Link to="/portal/finance" className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-600 group">
            <div className="flex items-center gap-2.5">
              <Wallet size={16} className="text-emerald-500" /> Transaction history
            </div>
            <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500" />
          </Link>
          <Link to="/portal/tickets" className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-600 group">
            <div className="flex items-center gap-2.5">
              <Headphones size={16} className="text-orange-500" /> Contact support
            </div>
            <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500" />
          </Link>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Recent Transactions</h3>
          <Link to="/portal/finance" className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            View all <ChevronRight size={12} />
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32"><Loader2 size={20} className="animate-spin text-indigo-500" /></div>
        ) : transactions.length > 0 ? (
          <div className="divide-y">
            {transactions.map((tx) => (
              <div key={tx.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                  }`}>
                    {tx.type === 'credit' ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
                  </div>
                  <div>
                    <p className="text-sm text-gray-800">{tx.description || (tx.type === 'credit' ? 'Top-up' : 'Charge')}</p>
                    <p className="text-[10px] text-gray-400">{fmtDateTime(tx.created_at)}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {tx.type === 'credit' ? '+' : '-'}{fmtCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">No transactions yet</p>
        )}
      </div>
    </div>
  );
}
