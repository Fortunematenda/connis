import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      {/* Right panel: navbar + content */}
      <div className="ml-64 flex flex-col min-h-screen">
        <TopNavbar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
