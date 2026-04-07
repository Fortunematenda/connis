import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
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
  DollarSign,
  Receipt,
  FileText,
  ChevronDown,
  ClipboardList,
  RotateCcw,
  Package,
  Activity,
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
  { to: '/bandwidth', icon: Activity, label: 'Bandwidth' },
];

const accountingItems = [
  { to: '/accounting', icon: DollarSign, label: 'Dashboard', end: true },
  { to: '/accounting/transactions', icon: Receipt, label: 'Transactions' },
  { to: '/accounting/invoices', icon: FileText, label: 'Invoices' },
  { to: '/accounting/quotes', icon: ClipboardList, label: 'Quotes' },
  { to: '/accounting/credits', icon: RotateCcw, label: 'Credit Notes' },
  { to: '/accounting/items', icon: Package, label: 'Items' },
  { to: '/vouchers', icon: TicketCheck, label: 'Vouchers' },
];

const bottomItems = [
  { to: '/staff', icon: Shield, label: 'Staff' },
  { to: '/network', icon: Globe, label: 'Network' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ mobileOpen, onClose }) {
  const { company, admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [acctOpen, setAcctOpen] = useState(() => location.pathname.startsWith('/accounting'));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNav = () => {
    if (onClose) onClose();
  };

  const isAcctActive = location.pathname.startsWith('/accounting');

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
      isActive
        ? 'bg-amber-500/90 text-white shadow-lg shadow-amber-500/20'
        : 'text-indigo-200/70 hover:bg-white/8 hover:text-white'
    }`;

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
            <NavLink key={to} to={to} end={to === '/'} onClick={handleNav} className={linkClass}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}

          {/* Accounting section (collapsible) */}
          <button
            onClick={() => setAcctOpen(!acctOpen)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 w-full ${
              isAcctActive ? 'text-amber-400' : 'text-indigo-200/70 hover:bg-white/8 hover:text-white'
            }`}
          >
            <DollarSign size={18} />
            <span className="flex-1 text-left">Accounting</span>
            <ChevronDown size={14} className={`transition-transform duration-200 ${acctOpen ? 'rotate-180' : ''}`} />
          </button>

          {acctOpen && (
            <div className="ml-4 pl-3 border-l border-white/10 space-y-0.5">
              {accountingItems.map(({ to, icon: Icon, label, end }) => (
                <NavLink key={to} to={to} end={end} onClick={handleNav} className={linkClass}>
                  <Icon size={16} />
                  {label}
                </NavLink>
              ))}
            </div>
          )}

          {/* Separator */}
          <div className="pt-2 mt-2 border-t border-white/10" />

          {bottomItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={handleNav} className={linkClass}>
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
