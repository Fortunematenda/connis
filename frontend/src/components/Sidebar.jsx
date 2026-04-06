import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCheck,
  Shield,
  Wifi,
  Target,
  Ticket,
  CheckSquare,
  TicketCheck,
  MessageSquare,
  Settings,
  LogOut,
  Globe,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leads', icon: Target, label: 'Leads Pipeline' },
  { to: '/customers', icon: UserCheck, label: 'Customers' },
  { to: '/tickets', icon: Ticket, label: 'Tickets' },
  { to: '/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/plans', icon: Wifi, label: 'Plans' },
  { to: '/vouchers', icon: TicketCheck, label: 'Vouchers' },
  { to: '/staff', icon: Shield, label: 'Staff' },
  { to: '/network', icon: Globe, label: 'Network' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const { company, admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-white flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700 cursor-pointer" onClick={() => navigate('/')}>
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-blue-400">CON</span>NIS
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">ISP Management Platform</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer — Logout */}
      <div className="px-4 py-3 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors w-full"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
