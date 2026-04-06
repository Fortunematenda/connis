import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Wifi, Wallet, Headphones,
  User, LogOut, Menu, X, BarChart3, MessageSquare,
  Bell, ChevronDown, Settings, Shield,
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
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

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

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('connis_portal_token');
    localStorage.removeItem('connis_portal_user');
    navigate('/portal/login');
  };

  const balance = parseFloat(user?.balance || 0);
  const initial = (user?.full_name || user?.username || 'U')[0].toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar — Desktop */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-60 bg-white border-r flex-col z-40">
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

        <div className={`mx-3 mt-3 rounded-xl px-4 py-3 ${balance > 0 ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gradient-to-r from-red-500 to-red-600'} text-white`}>
          <p className="text-[10px] uppercase tracking-wider opacity-70">Balance</p>
          <p className="text-xl font-black mt-0.5">R{balance.toFixed(2)}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                  isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-3 border-t">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">{initial}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{user?.full_name || user?.username}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.username}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Mobile Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-white z-50 flex flex-col shadow-xl transition-transform duration-200 md:hidden ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white"><Wifi size={14} /></div>
            <span className="text-sm font-bold text-gray-900">{user?.company_name || 'My ISP'}</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className={`mx-3 mt-3 rounded-xl px-4 py-3 ${balance > 0 ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gradient-to-r from-red-500 to-red-600'} text-white`}>
          <p className="text-[10px] uppercase tracking-wider opacity-70">Balance</p>
          <p className="text-xl font-black mt-0.5">R{balance.toFixed(2)}</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
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
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">{initial}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{user?.full_name || user?.username}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.username}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-60 min-h-screen flex flex-col">
        {/* Top Nav — both mobile and desktop */}
        <header className="bg-white border-b sticky top-0 z-30 px-4 md:px-6 h-14 flex items-center justify-between">
          {/* Left: hamburger (mobile) + brand */}
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 -ml-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 md:hidden">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white"><Wifi size={12} /></div>
              <span className="text-sm font-bold text-gray-800">{user?.company_name || 'My ISP'}</span>
            </div>
            {/* Desktop: balance badge */}
            <div className={`hidden md:block px-3 py-1 rounded-lg text-sm font-bold ${balance > 0 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-600'}`}>
              R{balance.toFixed(2)}
            </div>
          </div>

          {/* Right: notifications + profile */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <Bell size={18} />
            </button>

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1.5 pr-2 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">{initial}</div>
                <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">{user?.full_name || user?.username}</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl border shadow-xl z-50 overflow-hidden">
                  {/* User info */}
                  <div className="px-4 py-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-b">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">{initial}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user?.full_name || user?.username}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email || user?.username}</p>
                      </div>
                    </div>
                    <div className={`mt-3 px-3 py-1.5 rounded-lg text-sm font-bold inline-block ${balance > 0 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600'}`}>
                      Balance: R{balance.toFixed(2)}
                    </div>
                  </div>
                  {/* Menu items */}
                  <div className="py-1">
                    <button onClick={() => { setProfileOpen(false); navigate('/portal/profile'); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <User size={15} className="text-gray-400" /> My Profile
                    </button>
                    <button onClick={() => { setProfileOpen(false); navigate('/portal/services'); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <Wifi size={15} className="text-gray-400" /> My Services
                    </button>
                    <button onClick={() => { setProfileOpen(false); navigate('/portal/statistics'); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <BarChart3 size={15} className="text-gray-400" /> Usage Stats
                    </button>
                  </div>
                  <div className="border-t py-1">
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-6 py-6">
          <Outlet context={{ user, refreshUser: () => portalApi.getMe().then(r => { setUser(r.data); localStorage.setItem('connis_portal_user', JSON.stringify(r.data)); }) }} />
        </div>
      </main>
    </div>
  );
}
