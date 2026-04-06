import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, User, Settings, LogOut, MessageSquare, Ticket, Check, CheckCheck, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { notificationsApi } from '../services/api';

const fmtRelative = (d) => {
  if (!d) return '';
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const typeIcons = {
  new_ticket: Ticket,
  new_message: MessageSquare,
};

export default function TopNavbar({ onMenuToggle }) {
  const { admin, company, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifs = async () => {
    try {
      const [nRes, cRes] = await Promise.all([
        notificationsApi.getAll(15),
        notificationsApi.getUnreadCount(),
      ]);
      setNotifications(nRes.data);
      setUnreadCount(cRes.data.count);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotifClick = async (n) => {
    if (!n.is_read) {
      await notificationsApi.markRead(n.id);
      setUnreadCount(Math.max(0, unreadCount - 1));
      setNotifications(notifications.map(x => x.id === n.id ? { ...x, is_read: true } : x));
    }
    if (n.link) navigate(n.link);
    setNotifOpen(false);
  };

  const handleMarkAllRead = async () => {
    await notificationsApi.markAllRead();
    setUnreadCount(0);
    setNotifications(notifications.map(x => ({ ...x, is_read: true })));
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = admin?.full_name
    ? admin.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle} className="md:hidden p-2 -ml-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Menu size={20} />
        </button>
        <span className="md:hidden text-sm font-bold text-gray-800"><span className="text-amber-500">CON</span>NIS</span>
      </div>
      <div className="flex items-center gap-3">
        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
            className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              {/* Mobile overlay */}
              <div className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={() => setNotifOpen(false)} />
              <div className="fixed inset-x-0 top-14 mx-2 md:mx-0 md:absolute md:right-0 md:left-auto md:top-full md:mt-1 md:w-80 bg-white rounded-xl border shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800">Notifications</p>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      <CheckCheck size={12} /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-[60vh] md:max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? (
                    <div className="divide-y">
                      {notifications.map((n) => {
                        const Icon = typeIcons[n.type] || Bell;
                        return (
                          <button key={n.id} onClick={() => handleNotifClick(n)}
                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors ${!n.is_read ? 'bg-amber-50/40' : ''}`}>
                            <div className="flex gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                n.type === 'new_ticket' ? 'bg-orange-50 text-orange-500' :
                                n.type === 'new_message' ? 'bg-blue-50 text-blue-500' :
                                'bg-gray-100 text-gray-400'
                              }`}>
                                <Icon size={14} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${!n.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'} truncate`}>{n.title}</p>
                                {n.body && <p className="text-xs text-gray-400 truncate mt-0.5">{n.body}</p>}
                                <p className="text-[10px] text-gray-400 mt-1">{fmtRelative(n.created_at)}</p>
                              </div>
                              {!n.is_read && <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 shrink-0" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <Bell size={24} className="text-gray-200 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">No notifications</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#2d2e50] flex items-center justify-center text-amber-400 text-xs font-bold">
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
