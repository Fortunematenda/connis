import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Wifi, Wallet, TicketCheck, Headphones,
  User, LogOut, Menu, X, ChevronRight, BarChart3, MessageSquare,
} from 'lucide-react';
import { portalApi } from '../../services/api';

const navItems = [
  { to: '/portal', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/portal/services', icon: Wifi, label: 'My Services' },
  { to: '/portal/finance', icon: Wallet, label: 'Finance' },
  { to: '/portal/statistics', icon: BarChart3, label: 'Usage Stats' },
  { to: '/portal/tickets', icon: Headphones, label: 'Support' },
  { to: '/portal/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/portal/profile', icon: User, label: 'My Profile' },
];

export default function PortalLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('connis_portal_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('connis_portal_token');
    if (!token) { navigate('/portal/login'); return; }
    portalApi.getMe().then(res => {
      setUser(res.data);
      localStorage.setItem('connis_portal_user', JSON.stringify(res.data));
    }).catch(() => {
      localStorage.removeItem('connis_portal_token');
      localStorage.removeItem('connis_portal_user');
      navigate('/portal/login');
    });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('connis_portal_token');
    localStorage.removeItem('connis_portal_user');
    navigate('/portal/login');
  };

  const balance = parseFloat(user?.balance || 0);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar — Desktop */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-60 bg-white border-r flex-col z-40">
        {/* Logo / Brand */}
        <div className="px-5 py-4 border-b">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Wifi size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{user?.company_name || 'My ISP'}</p>
              <p className="text-[10px] text-gray-400">Customer Portal</p>
            </div>
          </div>
        </div>

        {/* Balance Banner */}
        <div className={`mx-3 mt-3 rounded-xl px-4 py-3 ${balance > 0 ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gradient-to-r from-red-500 to-red-600'} text-white`}>
          <p className="text-[10px] uppercase tracking-wider opacity-70">Balance</p>
          <p className="text-xl font-black mt-0.5">R{balance.toFixed(2)}</p>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="px-3 py-3 border-t">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
              {(user?.full_name || user?.username || 'U')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{user?.full_name || user?.username}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.username}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors w-full mt-1"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b z-30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Wifi size={14} />
          </div>
          <span className="text-sm font-bold text-gray-900">{user?.company_name || 'My ISP'}</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setMobileOpen(false)} />
          <aside className="md:hidden fixed left-0 top-0 h-full w-64 bg-white z-50 flex flex-col shadow-xl">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <Wifi size={14} />
                </div>
                <span className="text-sm font-bold text-gray-900">{user?.company_name || 'My ISP'}</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1 text-gray-400">
                <X size={18} />
              </button>
            </div>
            <div className={`mx-3 mt-3 rounded-xl px-4 py-3 ${balance > 0 ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gradient-to-r from-red-500 to-red-600'} text-white`}>
              <p className="text-[10px] uppercase tracking-wider opacity-70">Balance</p>
              <p className="text-xl font-black mt-0.5">R{balance.toFixed(2)}</p>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-0.5">
              {navItems.map(({ to, icon: Icon, label, end }) => (
                <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                      isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }>
                  <Icon size={18} /> {label}
                </NavLink>
              ))}
            </nav>
            <div className="px-3 py-3 border-t">
              <button onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-gray-500 hover:bg-red-50 hover:text-red-600 w-full">
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 min-h-screen">
        {/* Desktop Top Nav */}
        <div className="hidden md:flex items-center justify-between px-6 py-3 bg-white border-b sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
              {(user?.full_name || user?.username || 'U')[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{user?.full_name || user?.username}</p>
              <p className="text-[10px] text-gray-400">{user?.email || user?.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1.5 rounded-lg text-sm font-bold ${balance > 0 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-600'}`}>
              R{balance.toFixed(2)}
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
          <Outlet context={{ user, refreshUser: () => portalApi.getMe().then(r => { setUser(r.data); localStorage.setItem('connis_portal_user', JSON.stringify(r.data)); }) }} />
        </div>
      </main>
    </div>
  );
}
