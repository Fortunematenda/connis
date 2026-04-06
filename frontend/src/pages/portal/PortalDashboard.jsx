import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wifi, WifiOff, Wallet, CreditCard, ArrowDownCircle, ArrowUpCircle,
  Loader2, LogOut, TicketCheck, RefreshCw, Globe,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { portalApi } from '../../services/api';

const fmtCurrency = (v) => 'R' + Number(v || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

export default function PortalDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voucherCode, setVoucherCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [meRes, txRes] = await Promise.all([
        portalApi.getMe(),
        portalApi.getTransactions(20),
      ]);
      setUser(meRes.data);
      setTransactions(txRes.data);
    } catch (err) {
      if (err.message?.includes('401') || err.message?.includes('token')) {
        navigate('/portal/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('connis_portal_token');
    if (!token) { navigate('/portal/login'); return; }
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast.success('Refreshed');
  };

  const handleRedeem = async (e) => {
    e.preventDefault();
    if (!voucherCode.trim()) return;
    setRedeeming(true);
    try {
      const res = await portalApi.redeemVoucher(voucherCode.trim());
      toast.success(`Voucher redeemed! +${fmtCurrency(res.data.amount)}`);
      setVoucherCode('');
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Invalid voucher');
    } finally {
      setRedeeming(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('connis_portal_token');
    localStorage.removeItem('connis_portal_user');
    navigate('/portal/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) return null;

  const balance = parseFloat(user.balance || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Wifi size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{user.company_name || 'My ISP'}</p>
              <p className="text-[10px] text-gray-400">Customer Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleRefresh} disabled={refreshing}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Welcome + Balance Card */}
        <div className={`rounded-2xl p-5 text-white ${balance > 0 ? 'bg-gradient-to-br from-blue-600 to-indigo-700' : 'bg-gradient-to-br from-red-500 to-red-700'}`}>
          <p className="text-sm opacity-80">Welcome back,</p>
          <p className="text-lg font-bold mt-0.5">{user.full_name || user.username}</p>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-xs opacity-70 uppercase tracking-wide">Your Balance</p>
              <p className="text-3xl font-black mt-1">{fmtCurrency(balance)}</p>
            </div>
            <Wallet size={32} className="opacity-30" />
          </div>
          {balance <= 0 && (
            <div className="mt-3 bg-white/20 rounded-lg px-3 py-2 text-xs font-medium">
              Your balance is empty. Redeem a voucher to get back online.
            </div>
          )}
        </div>

        {/* Info Cards Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Connection Status */}
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2 mb-2">
              {user.is_online ? (
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Wifi size={14} className="text-emerald-600" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                  <WifiOff size={14} className="text-gray-400" />
                </div>
              )}
              <span className={`text-xs font-semibold ${user.is_online ? 'text-emerald-700' : 'text-gray-500'}`}>
                {user.is_online ? 'Online' : 'Offline'}
              </span>
            </div>
            {user.ip_address && (
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-1">
                <Globe size={10} /> {user.ip_address}
              </div>
            )}
          </div>

          {/* Plan Info */}
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                <CreditCard size={14} className="text-violet-600" />
              </div>
              <span className="text-xs font-semibold text-gray-700">My Plan</span>
            </div>
            <p className="text-sm font-bold text-gray-900">{user.plan_name || 'No plan'}</p>
            {user.download_speed && (
              <p className="text-[11px] text-gray-400">{user.download_speed} / {user.upload_speed}</p>
            )}
            {user.plan_price && (
              <p className="text-[11px] text-gray-400 mt-0.5">{fmtCurrency(user.plan_price)}/mo</p>
            )}
          </div>
        </div>

        {/* Redeem Voucher */}
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-3">
            <TicketCheck size={16} className="text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-800">Redeem Voucher</h3>
          </div>
          <form onSubmit={handleRedeem} className="flex gap-2">
            <input
              type="text"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              placeholder="Enter voucher code (e.g. VCH-XXXX-XXXX)"
              className="flex-1 px-3.5 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-mono tracking-wide"
            />
            <button
              type="submit"
              disabled={redeeming || !voucherCode.trim()}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {redeeming ? <Loader2 size={16} className="animate-spin" /> : 'Redeem'}
            </button>
          </form>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h3 className="text-sm font-semibold text-gray-800">Recent Transactions</h3>
          </div>
          {transactions.length > 0 ? (
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

        {/* Account Info */}
        <div className="bg-white rounded-xl border p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Account Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Username</span>
              <span className="font-medium text-gray-800 font-mono">{user.username}</span>
            </div>
            {user.email && (
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="text-gray-800">{user.email}</span>
              </div>
            )}
            {user.phone && (
              <div className="flex justify-between">
                <span className="text-gray-500">Phone</span>
                <span className="text-gray-800">{user.phone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Customer ID</span>
              <span className="text-gray-800">#{String(user.seq_id || 0).padStart(3, '0')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Member since</span>
              <span className="text-gray-800">{fmtDate(user.created_at)}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
