import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, UserCheck, Wifi, WifiOff, Target, Ticket, CheckSquare,
  Coins, ArrowRight, ArrowUpRight, Loader2,
  AlertTriangle, Clock, BarChart3, Ban, Power,
} from 'lucide-react';
import { dashboardApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—';
const fmtCurrency = (v) => 'R' + Number(v || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const TICKET_STATUS_COLORS = {
  open: 'text-blue-700 bg-blue-50',
  in_progress: 'text-amber-700 bg-amber-50',
  waiting: 'text-purple-700 bg-purple-50',
  resolved: 'text-emerald-700 bg-emerald-50',
  closed: 'text-gray-600 bg-gray-100',
};

const LEAD_STATUS_COLORS = {
  new: 'text-blue-700 bg-blue-50',
  contacted: 'text-amber-700 bg-amber-50',
  qualified: 'text-purple-700 bg-purple-50',
  converted: 'text-emerald-700 bg-emerald-50',
  lost: 'text-red-600 bg-red-50',
};

export default function Dashboard() {
  const { company, admin } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bandwidthPeriod, setBandwidthPeriod] = useState('month');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await dashboardApi.getStats(bandwidthPeriod);
        setData(res.data);
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, [bandwidthPeriod]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  const c = data?.counts || {};

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{admin?.full_name ? `, ${admin.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">Here's what's happening with your network today.</p>
      </div>

      {/* ── Subscription warnings ── */}
      {company?.subscription_status === 'trial' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Free Trial</p>
            <p className="text-xs text-amber-600">Expires {company.expires_at ? new Date(company.expires_at).toLocaleDateString() : 'N/A'}. Upgrade to keep your service running.</p>
          </div>
        </div>
      )}
      {company?.subscription_status === 'expired' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Subscription Expired</p>
            <p className="text-xs text-red-600">Please renew to continue managing your network.</p>
          </div>
        </div>
      )}

      {/* ── Main Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <StatCard
          icon={<Users size={22} />}
          label="Total Customers"
          value={c.total_customers || 0}
          sub="all customers"
          color="blue"
          link="/customers"
        />
        {/* Online Now */}
        <StatCard
          icon={<Wifi size={22} />}
          label="Online Now"
          value={c.online_customers || 0}
          sub={`${c.active_customers || 0} active customers`}
          color="emerald"
          link="/customers"
          highlight={c.online_customers > 0}
        />
        {/* Active but Offline */}
        <StatCard
          icon={<WifiOff size={22} />}
          label="Active but Offline"
          value={Math.max(0, (c.active_customers || 0) - (c.online_customers || 0))}
          sub="not currently using"
          color="amber"
          link="/customers"
        />
        {/* Blocked / Inactive */}
        <StatCard
          icon={<Ban size={22} />}
          label="Blocked"
          value={c.inactive_customers || 0}
          sub="inactive customers"
          color="red"
          link="/customers"
        />
      </div>

      {/* ── Secondary Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Coins size={20} />}
          label="Monthly Revenue"
          value={fmtCurrency(c.monthly_revenue)}
          sub={`${c.active_plans} active plans`}
          color="violet"
          link="/plans"
        />
        <StatCard
          icon={<Ticket size={20} />}
          label="Open Tickets"
          value={c.open_tickets}
          sub={`${c.total_tickets} total`}
          color="amber"
          link="/tickets"
        />
        <StatCard
          icon={<Target size={20} />}
          label="Leads"
          value={c.total_leads}
          sub="in pipeline"
          color="purple"
          link="/leads"
        />
        <StatCard
          icon={<CheckSquare size={20} />}
          label="Pending Tasks"
          value={c.pending_tasks}
          sub={`${c.total_tasks} total`}
          color="sky"
          link="/tasks"
        />
      </div>

      {/* ── Recent Activity Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Bandwidth Users */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Top Bandwidth Users</h3>
            <div className="flex items-center gap-2">
              <select
                value={bandwidthPeriod}
                onChange={(e) => setBandwidthPeriod(e.target.value)}
                className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="day">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              <Link to="/customers" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
          </div>
          {data?.top_bandwidth_users?.length > 0 ? (
            <div className="divide-y">
              {data.top_bandwidth_users.map((cu) => (
                <div key={cu.id} onClick={() => navigate(`/customers/${cu.id}`)}
                  className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${cu.active ? 'bg-blue-500' : 'bg-gray-400'}`}>
                      {(cu.full_name || cu.username || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{cu.full_name || cu.username}</p>
                      <p className="text-[11px] text-gray-400">{cu.plan_name || 'No plan'} &middot; #{String(cu.seq_id || 0).padStart(3, '0')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatBytes(cu.download_bytes || 0)}</p>
                    <p className="text-[10px] text-gray-400">↓ download</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No bandwidth data yet</p>
          )}
        </div>

        {/* Recent Tickets */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Recent Tickets</h3>
          </div>
          {data?.recent_tickets?.length > 0 ? (
            <div className="divide-y">
              {data.recent_tickets.map((t) => (
                <div key={t.id} onClick={() => navigate(`/tickets/${t.id}`)} className="px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.subject}</p>
                    <p className="text-[11px] text-gray-400">{t.customer_name || 'Unassigned'} · {fmtDate(t.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${TICKET_STATUS_COLORS[t.status] || 'text-gray-600 bg-gray-100'}`}>
                      {t.status?.replace('_', ' ')}
                    </span>
                    <PriorityDot priority={t.priority} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No tickets yet</p>
          )}
        </div>

        {/* Recent Leads */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Recent Leads</h3>
            <Link to="/leads" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Pipeline <ArrowRight size={12} />
            </Link>
          </div>
          {data?.recent_leads?.length > 0 ? (
            <div className="divide-y">
              {data.recent_leads.map((l) => (
                <div key={l.id} onClick={() => navigate(`/leads?lead=${l.id}`)} className="px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{l.full_name}</p>
                    <p className="text-[11px] text-gray-400">{l.phone || '—'} · {fmtDate(l.created_at)}</p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${LEAD_STATUS_COLORS[l.status] || 'text-gray-600 bg-gray-100'}`}>
                    {l.status?.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No leads yet</p>
          )}
        </div>

        {/* Breakdowns */}
        <div className="space-y-5">
          {/* Ticket Breakdown */}
          {data?.ticket_breakdown && Object.keys(data.ticket_breakdown).length > 0 && (
            <div className="bg-white rounded-xl border shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Tickets by Status</h3>
              <div className="space-y-2">
                {Object.entries(data.ticket_breakdown).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        status === 'open' ? 'bg-blue-500' :
                        status === 'in_progress' ? 'bg-amber-500' :
                        status === 'resolved' ? 'bg-emerald-500' :
                        status === 'closed' ? 'bg-gray-400' : 'bg-purple-500'
                      }`} />
                      <span className="text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lead Breakdown */}
          {data?.lead_breakdown && Object.keys(data.lead_breakdown).length > 0 && (
            <div className="bg-white rounded-xl border shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Leads by Status</h3>
              <div className="space-y-2">
                {Object.entries(data.lead_breakdown).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        status === 'new' ? 'bg-blue-500' :
                        status === 'contacted' ? 'bg-amber-500' :
                        status === 'qualified' ? 'bg-purple-500' :
                        status === 'converted' ? 'bg-emerald-500' : 'bg-red-500'
                      }`} />
                      <span className="text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──

function StatCard({ icon, label, value, sub, color, link }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
    sky: 'bg-sky-50 text-sky-600',
    red: 'bg-red-50 text-red-600',
    teal: 'bg-teal-50 text-teal-600',
  };

  const Wrapper = link ? Link : 'div';
  const wrapperProps = link ? { to: link } : {};

  return (
    <Wrapper {...wrapperProps}
      className="bg-white rounded-xl border shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer group">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${colorMap[color] || colorMap.blue}`}>
          {icon}
        </div>
        {link && <ArrowUpRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      <p className="text-[11px] font-medium text-gray-500 mt-1">{label}</p>
    </Wrapper>
  );
}

function PriorityDot({ priority }) {
  const colors = {
    low: 'bg-gray-400',
    medium: 'bg-blue-500',
    high: 'bg-orange-500',
    critical: 'bg-red-500',
  };
  return (
    <span className={`w-2 h-2 rounded-full ${colors[priority] || colors.medium}`} title={priority} />
  );
}
