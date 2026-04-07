import { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, UserCheck, Ticket, MessageSquare, MoreHorizontal,
  Target, CheckSquare, Wifi, TicketCheck, Shield, Globe, Settings, X,
  Receipt, FileText, ClipboardList, RotateCcw, Package, DollarSign, Activity,
} from 'lucide-react';
import { messagesApi, notificationsApi } from '../services/api';

const primaryTabs = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/customers', icon: UserCheck, label: 'Customers' },
  { to: '/tickets', icon: Ticket, label: 'Tickets', badgeKey: 'tickets' },
  { to: '/messages', icon: MessageSquare, label: 'Messages', badgeKey: 'messages' },
];

const moreSections = [
  {
    title: 'Sales',
    items: [
      { to: '/leads', icon: Target, label: 'Leads', color: 'bg-violet-50 text-violet-600' },
      { to: '/tasks', icon: CheckSquare, label: 'Tasks', color: 'bg-amber-50 text-amber-600' },
    ],
  },
  {
    title: 'Billing',
    items: [
      { to: '/plans', icon: Wifi, label: 'Plans', color: 'bg-blue-50 text-blue-600' },
      { to: '/vouchers', icon: TicketCheck, label: 'Vouchers', color: 'bg-emerald-50 text-emerald-600' },
      { to: '/bandwidth', icon: Activity, label: 'Bandwidth', color: 'bg-red-50 text-red-600' },
    ],
  },
  {
    title: 'Accounting',
    items: [
      { to: '/accounting', icon: DollarSign, label: 'Dashboard', color: 'bg-amber-50 text-amber-600' },
      { to: '/accounting/transactions', icon: Receipt, label: 'Transactions', color: 'bg-indigo-50 text-indigo-600' },
      { to: '/accounting/invoices', icon: FileText, label: 'Invoices', color: 'bg-pink-50 text-pink-600' },
      { to: '/accounting/quotes', icon: ClipboardList, label: 'Quotes', color: 'bg-violet-50 text-violet-600' },
      { to: '/accounting/credits', icon: RotateCcw, label: 'Credits', color: 'bg-teal-50 text-teal-600' },
      { to: '/accounting/items', icon: Package, label: 'Items', color: 'bg-amber-50 text-amber-600' },
    ],
  },
  {
    title: 'System',
    items: [
      { to: '/staff', icon: Shield, label: 'Staff', color: 'bg-orange-50 text-orange-600' },
      { to: '/network', icon: Globe, label: 'Network', color: 'bg-cyan-50 text-cyan-600' },
      { to: '/settings', icon: Settings, label: 'Settings', color: 'bg-gray-100 text-gray-600' },
    ],
  },
];

export default function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const [badges, setBadges] = useState({ tickets: 0, messages: 0 });
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch badge counts
  const fetchBadges = useCallback(async () => {
    try {
      const [msgRes, notifRes] = await Promise.all([
        messagesApi.getUnreadCount(),
        notificationsApi.getUnreadCount(),
      ]);
      setBadges({
        messages: msgRes.data?.count || 0,
        tickets: notifRes.data?.count || 0,
      });
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchBadges();
    const interval = setInterval(fetchBadges, 30000);
    return () => clearInterval(interval);
  }, [fetchBadges]);

  // Close menus when navigating
  useEffect(() => { setMoreOpen(false); }, [location.pathname]);

  return (
    <>
      {/* ── More bottom sheet ── */}
      {moreOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setMoreOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl pb-safe animate-slide-up md:hidden">
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3">
              <h3 className="text-base font-bold text-gray-900">More</h3>
              <button onClick={() => setMoreOpen(false)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 active:bg-gray-200 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Grouped sections */}
            <div className="px-5 pb-8 space-y-5">
              {moreSections.map((section) => (
                <div key={section.title}>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 ml-1">{section.title}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {section.items.map(({ to, icon: Icon, label, color }) => (
                      <button
                        key={to}
                        onClick={() => { setMoreOpen(false); navigate(to); }}
                        className="flex flex-col items-center gap-2 py-3.5 rounded-2xl bg-gray-50/80 hover:bg-gray-100 active:scale-95 transition-all"
                      >
                        <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center`}>
                          <Icon size={20} />
                        </div>
                        <span className="text-[11px] font-semibold text-gray-700">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Bottom tab bar ── */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-lg border-t border-gray-200/80 md:hidden">
        <div className="flex items-center justify-around h-16 px-1 pb-safe">
          {primaryTabs.map(({ to, icon: Icon, label, badgeKey }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all active:scale-90 ${
                  isActive ? 'text-indigo-600' : 'text-gray-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                    {badgeKey && badges[badgeKey] > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                        {badges[badgeKey] > 99 ? '99+' : badges[badgeKey]}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
                  {isActive && <div className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-indigo-600" />}
                </>
              )}
            </NavLink>
          ))}
          {/* More button */}
          <button
            onClick={() => setMoreOpen(true)}
            className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all active:scale-90 ${
              moreOpen ? 'text-indigo-600' : 'text-gray-400'
            }`}
          >
            <MoreHorizontal size={22} strokeWidth={moreOpen ? 2.5 : 1.8} />
            <span className={`text-[10px] ${moreOpen ? 'font-bold' : 'font-medium'}`}>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
