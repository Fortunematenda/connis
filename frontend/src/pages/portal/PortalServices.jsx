import { useOutletContext } from 'react-router-dom';
import { Wifi, WifiOff, Globe, Calendar, Gauge, ArrowDown, ArrowUp, Zap } from 'lucide-react';

const fmtCurrency = (v) => 'R' + Number(v || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function PortalServices() {
  const { user } = useOutletContext();
  if (!user) return null;

  const hasPlan = !!user.plan_name;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Services</h1>
        <p className="text-sm text-gray-400 mt-0.5">Your internet plan and connection details</p>
      </div>

      {/* Connection Status Banner */}
      <div className={`rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 ${user.is_online ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-gray-200'}`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${user.is_online ? 'bg-emerald-100' : 'bg-gray-200'}`}>
          {user.is_online ? <Wifi size={22} className="text-emerald-600" /> : <WifiOff size={22} className="text-gray-400" />}
        </div>
        <div>
          <p className={`text-lg font-bold ${user.is_online ? 'text-emerald-700' : 'text-gray-600'}`}>
            {user.is_online ? 'You are connected' : 'You are offline'}
          </p>
          {user.ip_address ? (
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
              <Globe size={13} /> IP Address: <span className="font-mono font-medium">{user.ip_address}</span>
            </div>
          ) : (
            <p className="text-sm text-gray-400 mt-0.5">
              {user.is_online ? 'Connected to the network' : 'No active connection detected'}
            </p>
          )}
        </div>
      </div>

      {/* Plan Details */}
      {hasPlan ? (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-5 py-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Zap size={20} />
              </div>
              <div>
                <p className="text-lg font-bold">{user.plan_name}</p>
                <p className="text-sm opacity-80">Active Internet Plan</p>
              </div>
            </div>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                  <ArrowDown size={16} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Download Speed</p>
                  <p className="text-sm font-bold text-gray-900">{user.download_speed || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <ArrowUp size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Upload Speed</p>
                  <p className="text-sm font-bold text-gray-900">{user.upload_speed || '—'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                  <Gauge size={16} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Monthly Price</p>
                  <p className="text-sm font-bold text-gray-900">{user.plan_price ? fmtCurrency(user.plan_price) : '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Calendar size={16} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Billing Type</p>
                  <p className="text-sm font-bold text-gray-900 capitalize">{user.billing_type || 'Postpaid'}</p>
                </div>
              </div>
            </div>
          </div>

          {(user.plan_start || user.plan_end) && (
            <div className="px-5 py-3 border-t bg-gray-50/50 flex items-center gap-6 text-sm text-gray-500">
              {user.plan_start && <span>Start: <span className="font-medium text-gray-700">{fmtDate(user.plan_start)}</span></span>}
              {user.plan_end && <span>End: <span className="font-medium text-gray-700">{fmtDate(user.plan_end)}</span></span>}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border p-8 text-center">
          <Wifi size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No active plan</p>
          <p className="text-sm text-gray-400 mt-1">Contact your ISP to subscribe to a plan</p>
        </div>
      )}

      {/* Account Details */}
      <div className="bg-white rounded-xl border p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Connection Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">PPPoE Username</span>
            <span className="font-mono font-medium text-gray-800">{user.username}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Customer ID</span>
            <span className="font-medium text-gray-800">#{String(user.seq_id || 0).padStart(3, '0')}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Account Status</span>
            <span className={`font-medium ${user.active ? 'text-emerald-600' : 'text-red-500'}`}>
              {user.active ? 'Active' : 'Suspended'}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Member Since</span>
            <span className="font-medium text-gray-800">{fmtDate(user.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
