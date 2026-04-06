import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function TopNavbar() {
  const { admin, company, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = admin?.full_name
    ? admin.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left: Page context / breadcrumb area */}
      <div />

      {/* Right: Notifications + Profile */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-800 leading-tight">{admin?.full_name || 'Admin'}</p>
              <p className="text-[10px] text-gray-400 leading-tight">{admin?.role || 'admin'}</p>
            </div>
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl border shadow-lg py-1 z-50">
              {/* User info header */}
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-semibold text-gray-900">{admin?.full_name || 'Admin'}</p>
                <p className="text-xs text-gray-400">{admin?.email}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{company?.name}</p>
              </div>

              <button onClick={() => { setProfileOpen(false); navigate('/settings'); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <User size={15} className="text-gray-400" /> My Profile
              </button>
              <button onClick={() => { setProfileOpen(false); navigate('/settings'); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <Settings size={15} className="text-gray-400" /> Settings
              </button>
              <div className="border-t my-1" />
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
