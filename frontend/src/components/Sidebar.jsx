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
  X,
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

export default function Sidebar({ mobileOpen, onClose }) {
  const { company, admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNav = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-[#1e1f3b] text-white flex flex-col z-50 transition-transform duration-200 ease-in-out ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}>
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div className="cursor-pointer" onClick={() => { navigate('/'); handleNav(); }}>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-amber-400">CON</span>NIS
            </h1>
            <p className="text-xs text-indigo-300/60 mt-0.5">ISP Management Platform</p>
          </div>
          <button onClick={onClose} className="md:hidden p-1 text-indigo-300/60 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={handleNav}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-amber-500/90 text-white shadow-lg shadow-amber-500/20'
                    : 'text-indigo-200/70 hover:bg-white/8 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer — Logout */}
        <div className="px-4 py-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-indigo-300/60 hover:bg-white/8 hover:text-white transition-colors w-full"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
