import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import LeadsPipeline from './pages/LeadsPipeline';
import StaffPage from './pages/StaffPage';
import PlansPage from './pages/PlansPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import SettingsPage from './pages/SettingsPage';
import TicketsPage from './pages/TicketsPage';
import TasksPage from './pages/TasksPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VouchersPage from './pages/VouchersPage';
import PortalLogin from './pages/portal/PortalLogin';
import PortalLayout from './components/portal/PortalLayout';
import PortalDashboard from './pages/portal/PortalDashboard';
import PortalServices from './pages/portal/PortalServices';
import PortalFinance from './pages/portal/PortalFinance';
import PortalTickets from './pages/portal/PortalTickets';
import PortalProfile from './pages/portal/PortalProfile';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/leads" element={<LeadsPipeline />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/customers/:id" element={<CustomerDetailPage />} />
        <Route path="/staff" element={<StaffPage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/tickets/:id" element={<TicketsPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/vouchers" element={<VouchersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      {/* Customer Portal — separate from admin */}
      <Route path="/portal/login" element={<PortalLogin />} />
      <Route path="/portal" element={<PortalLayout />}>
        <Route index element={<PortalDashboard />} />
        <Route path="services" element={<PortalServices />} />
        <Route path="finance" element={<PortalFinance />} />
        <Route path="tickets" element={<PortalTickets />} />
        <Route path="profile" element={<PortalProfile />} />
      </Route>
    </Routes>
  );
}
