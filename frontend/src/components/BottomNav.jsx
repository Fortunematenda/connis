import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, UserCheck, Ticket, MessageSquare, MoreHorizontal,
  Target, CheckSquare, Wifi, TicketCheck, Shield, Globe, Settings, X,
} from 'lucide-react';

const primaryTabs = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/customers', icon: UserCheck, label: 'Customers' },
  { to: '/tickets', icon: Ticket, label: 'Tickets' },
  { to: '/messages', icon: MessageSquare, label: 'Messages' },
];

const moreItems = [
  { to: '/leads', icon: Target, label: 'Leads Pipeline' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/plans', icon: Wifi, label: 'Plans' },
  { to: '/vouchers', icon: TicketCheck, label: 'Vouchers' },
  { to: '/staff', icon: Shield, label: 'Staff' },
  { to: '/network', icon: Globe, label: 'Network' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      {/* More menu overlay + sheet */}
      {moreOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setMoreOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl border-t pb-safe animate-slide-up">
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            <div className="flex items-center justify-between px-5 pb-2">
              <h3 className="text-sm font-semibold text-gray-800">More</h3>
              <button onClick={() => setMoreOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <nav className="grid grid-cols-3 gap-1 px-4 pb-6">
              {moreItems.map(({ to, icon: Icon, label }) => (
                <button
                  key={to}
                  onClick={() => { setMoreOpen(false); navigate(to); }}
                  className="flex flex-col items-center gap-1.5 py-4 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Icon size={20} className="text-gray-600" />
                  </div>
                  <span className="text-[11px] font-medium text-gray-700">{label}</span>
                </button>
              ))}
            </nav>
          </div>
        </>
      )}

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white border-t md:hidden">
        <div className="flex items-center justify-around h-16 px-1 pb-safe">
          {primaryTabs.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg transition-colors ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-gray-400 active:text-gray-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
          {/* More button */}
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg transition-colors ${
              moreOpen ? 'text-blue-600' : 'text-gray-400 active:text-gray-600'
            }`}
          >
            <MoreHorizontal size={22} strokeWidth={moreOpen ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
