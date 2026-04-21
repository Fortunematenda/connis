import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import BottomNav from './BottomNav';
import SubscriptionBanner from './SubscriptionBanner';
import UpgradeModal from './UpgradeModal';

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f0eef5]">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      {/* Right panel: banner + navbar + content */}
      <div className="md:ml-64 flex flex-col min-h-screen">
        <SubscriptionBanner />
        <TopNavbar onMenuToggle={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>
      {/* Mobile bottom navigation */}
      <BottomNav />
      <UpgradeModal />
    </div>
  );
}
