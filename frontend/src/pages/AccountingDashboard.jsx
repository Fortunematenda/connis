import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DollarSign, FileText, TrendingUp, TrendingDown, Clock, CheckCircle,
  AlertTriangle, ArrowRight, ArrowUpRight, Loader2, RotateCcw,
  ClipboardList, Receipt, Users,
} from 'lucide-react';
import { accountingDashboardApi } from '../services/api';

const fmtCurrency = (v) => 'R' + Number(v || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—';

export default function AccountingDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountingDashboardApi.getStats()
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-amber-500" /></div>;
  }

  if (!data) {
    return <div className="text-center py-16 text-gray-400">Failed to load accounting data</div>;
  }

  const inv = data.invoices || {};
  const cn = data.credit_notes || {};
  const qt = data.quotes || {};
  const revenueChange = data.last_month_revenue > 0
    ? (((data.current_month_revenue - data.last_month_revenue) / data.last_month_revenue) * 100).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Accounting Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Revenue, invoices, and financial overview</p>
      </div>

      {/* Revenue KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600"><DollarSign size={22} /></div>
            {revenueChange !== null && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${parseFloat(revenueChange) >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                {parseFloat(revenueChange) >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {revenueChange}%
              </span>
            )}
          </div>
          <p className="text-xl md:text-2xl font-bold text-gray-900">{fmtCurrency(data.current_month_revenue)}</p>
          <p className="text-xs text-gray-400 mt-0.5">vs {fmtCurrency(data.last_month_revenue)} last month</p>
          <p className="text-[11px] font-medium text-gray-500 mt-1">This Month Revenue</p>
        </div>

        <KpiCard icon={<FileText size={20} />} label="Total Invoiced" value={fmtCurrency(inv.total_invoiced)} sub={`${inv.total_invoices || 0} invoices`} color="blue" link="/accounting/invoices" />
        <KpiCard icon={<CheckCircle size={20} />} label="Paid" value={fmtCurrency(inv.total_paid)} sub={`${inv.paid_count || 0} invoices`} color="emerald" link="/accounting/invoices" />
        <KpiCard icon={<AlertTriangle size={20} />} label="Outstanding" value={fmtCurrency(parseFloat(inv.total_outstanding || 0) + parseFloat(inv.total_overdue || 0))} sub={`${(parseInt(inv.issued_count) || 0) + (parseInt(inv.overdue_count) || 0)} unpaid`} color="amber" link="/accounting/invoices" />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<Clock size={18} />} label="Overdue" value={inv.overdue_count || 0} sub={fmtCurrency(inv.total_overdue)} color="red" link="/accounting/invoices" />
        <KpiCard icon={<RotateCcw size={18} />} label="Credit Notes" value={cn.total || 0} sub={fmtCurrency(cn.total_amount)} color="purple" link="/accounting/credits" />
        <KpiCard icon={<ClipboardList size={18} />} label="Quote Pipeline" value={fmtCurrency(qt.pipeline_value)} sub={`${qt.sent_count || 0} sent, ${qt.accepted_count || 0} accepted`} color="violet" link="/accounting/quotes" />
        <KpiCard icon={<Receipt size={18} />} label="Credited Invoices" value={inv.credited_count || 0} sub="reversed" color="gray" link="/accounting/invoices" />
      </div>

      {/* Charts + Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Monthly Revenue Chart (simple bar) */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Monthly Revenue (Paid Invoices)</h3>
          </div>
          {data.monthly_revenue?.length > 0 ? (
            <div className="p-5">
              <div className="flex items-end gap-2 h-40">
                {(() => {
                  const max = Math.max(...data.monthly_revenue.map(m => parseFloat(m.revenue)), 1);
                  return data.monthly_revenue.map((m, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] font-medium text-gray-500">{fmtCurrency(m.revenue)}</span>
                      <div
                        className="w-full bg-emerald-400 rounded-t-md min-h-[4px] transition-all"
                        style={{ height: `${(parseFloat(m.revenue) / max) * 100}%` }}
                      />
                      <span className="text-[9px] text-gray-400">{m.month?.split(' ')[0]}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-12">No revenue data yet</p>
          )}
        </div>

        {/* Top Customers by Revenue */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Top Customers by Revenue</h3>
            <Link to="/customers" className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {data.top_customers?.length > 0 ? (
            <div className="divide-y">
              {data.top_customers.map((cu, i) => (
                <div key={cu.id} onClick={() => navigate(`/customers/${cu.id}`)}
                  className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{cu.full_name || cu.username}</p>
                      <p className="text-[11px] text-gray-400">{cu.username}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-emerald-600">{fmtCurrency(cu.total_paid)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No paid invoices yet</p>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Recent Invoices</h3>
            <Link to="/accounting/invoices" className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {data.recent_invoices?.length > 0 ? (
            <div className="divide-y">
              {data.recent_invoices.map(inv => {
                const statusColors = {
                  paid: 'bg-emerald-50 text-emerald-700',
                  issued: 'bg-blue-50 text-blue-700',
                  overdue: 'bg-red-50 text-red-700',
                  credited: 'bg-purple-50 text-purple-700',
                  draft: 'bg-gray-100 text-gray-600',
                };
                return (
                  <div key={inv.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{inv.invoice_number}</p>
                      <p className="text-[11px] text-gray-400">{inv.customer_name || '—'} · {fmtDate(inv.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${statusColors[inv.status] || 'bg-gray-100 text-gray-600'}`}>{inv.status}</span>
                      <span className="text-sm font-semibold text-gray-900">{fmtCurrency(inv.total)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No invoices yet</p>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Recent Transactions</h3>
            <Link to="/accounting/transactions" className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {data.recent_transactions?.length > 0 ? (
            <div className="divide-y">
              {data.recent_transactions.map(tx => (
                <div key={tx.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                      {tx.type === 'credit' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{tx.description || tx.category}</p>
                      <p className="text-[11px] text-gray-400">{tx.customer_name || '—'} · {fmtDate(tx.created_at)}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {tx.type === 'credit' ? '+' : '-'}{fmtCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No transactions yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, sub, color, link }) {
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    violet: 'bg-violet-50 text-violet-600',
    gray: 'bg-gray-100 text-gray-500',
    indigo: 'bg-indigo-50 text-indigo-600',
  };
  const Wrapper = link ? Link : 'div';
  const wrapperProps = link ? { to: link } : {};
  return (
    <Wrapper {...wrapperProps} className="bg-white rounded-2xl border p-4 md:p-5 hover:shadow-md transition-all cursor-pointer group">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${colorMap[color] || colorMap.blue}`}>{icon}</div>
        {link && <ArrowUpRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />}
      </div>
      <p className="text-xl md:text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      <p className="text-[11px] font-medium text-gray-500 mt-1">{label}</p>
    </Wrapper>
  );
}
