import { useOutletContext } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Calendar, Hash, Shield } from 'lucide-react';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function PortalProfile() {
  const { user } = useOutletContext();
  if (!user) return null;

  const fields = [
    { icon: User, label: 'Full Name', value: user.full_name || '—' },
    { icon: Hash, label: 'Username (PPPoE)', value: user.username, mono: true },
    { icon: Mail, label: 'Email', value: user.email || '—' },
    { icon: Phone, label: 'Phone', value: user.phone || '—' },
    { icon: MapPin, label: 'Address', value: user.address || '—' },
    { icon: Hash, label: 'Customer ID', value: `#${String(user.seq_id || 0).padStart(3, '0')}` },
    { icon: Shield, label: 'Account Status', value: user.active ? 'Active' : 'Suspended', color: user.active ? 'text-emerald-600' : 'text-red-500' },
    { icon: Calendar, label: 'Member Since', value: fmtDate(user.created_at) },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-400 mt-0.5">Your account information</p>
      </div>

      {/* Avatar + Name */}
      <div className="bg-white rounded-xl border p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          {(user.full_name || user.username || 'U')[0].toUpperCase()}
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">{user.full_name || user.username}</h2>
          <p className="text-sm text-gray-400">{user.company_name || 'ISP Customer'}</p>
          <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full mt-1.5 ${
            user.active ? 'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200/60' : 'text-red-600 bg-red-50 ring-1 ring-red-200/60'
          }`}>
            {user.active ? 'Active Account' : 'Suspended'}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50/50">
          <h3 className="text-sm font-semibold text-gray-700">Account Details</h3>
        </div>
        <div className="divide-y">
          {fields.map(({ icon: Icon, label, value, mono, color }) => (
            <div key={label} className="px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Icon size={16} className="text-gray-400" />
                {label}
              </div>
              <span className={`text-sm font-medium ${color || 'text-gray-800'} ${mono ? 'font-mono' : ''}`}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        To update your details, please contact your ISP.
      </p>
    </div>
  );
}
