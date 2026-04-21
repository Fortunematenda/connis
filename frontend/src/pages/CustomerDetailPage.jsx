import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Loader2, Wifi, WifiOff, Phone, Mail, MapPin, KeyRound,
  Edit3, Save, X, Globe, Clock, DollarSign, User, Shield, Activity,
  ChevronRight, Copy, Check, Eye, EyeOff, MessageSquare, Ticket,
  FileText, Package, Plus, Power, PowerOff, MoreVertical, BarChart3,
  RefreshCw, Calendar, ArrowRight, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { customersApi, plansApi, usersApi } from '../services/api';
import CustomerStatistics from '../components/CustomerStatistics';
import LiveBandwidth from '../components/LiveBandwidth';
import CustomerTickets from '../components/CustomerTickets';
import CustomerDocuments from '../components/CustomerDocuments';
import CustomerTasks from '../components/CustomerTasks';
import CustomerInvoices from '../components/CustomerInvoices';
import SubscriptionGate from '../components/SubscriptionGate';
import { useSubscription } from '../contexts/SubscriptionContext';

// ── Tabs ──────────────────────────────────────────────────────
const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'services', label: 'Services' },
  { key: 'statistics', label: 'Statistics' },
  { key: 'tickets', label: 'Tickets' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'documents', label: 'Documents' },
  { key: 'equipment', label: 'Equipment' },
];

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isExpired, openUpgradeModal } = useSubscription();
  const [customer, setCustomer] = useState(null);
  const [plans, setPlans] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.find(t => t.key === searchParams.get('tab'))?.key || 'overview';
  const setTab = (key) => setSearchParams({ tab: key }, { replace: true });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [newPlanId, setNewPlanId] = useState('');
  const [planStartDate, setPlanStartDate] = useState('');
  const [planEndDate, setPlanEndDate] = useState('');
  const [applyingPlan, setApplyingPlan] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [liveUptime, setLiveUptime] = useState(null);
  const [actionsOpen, setActionsOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [custRes, plansRes, statusRes] = await Promise.all([
        customersApi.getById(id),
        plansApi.getAll(),
        usersApi.getStatus(),
      ]);
      const c = custRes.data;
      setCustomer(c);
      setPlans(plansRes.data);
      setForm({
        full_name: c.full_name || '', email: c.email || '',
        phone: c.phone || '', address: c.address || '',
        username: c.username || '', password: c.password || '',
      });
      const s = (statusRes.data || []).find((u) => u.username === c.username);
      setSession(s || null);
    } catch {
      toast.error('Customer not found');
      navigate('/customers');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Live uptime ticker — parses initial uptime string and counts up every second
  useEffect(() => {
    if (!session?.online || !session?.uptime) { setLiveUptime(null); return; }
    const parseUptime = (str) => {
      let secs = 0;
      const d = str.match(/(\d+)d/); if (d) secs += +d[1] * 86400;
      const h = str.match(/(\d+)h/); if (h) secs += +h[1] * 3600;
      const m = str.match(/(\d+)m/); if (m) secs += +m[1] * 60;
      const s = str.match(/(\d+)s/); if (s) secs += +s[1];
      return secs;
    };
    let seconds = parseUptime(session.uptime);
    const formatUp = (s) => {
      const dd = Math.floor(s / 86400);
      const hh = Math.floor((s % 86400) / 3600);
      const mm = Math.floor((s % 3600) / 60);
      const ss = s % 60;
      if (dd > 0) return `${dd}d ${hh}h ${mm}m ${ss}s`;
      if (hh > 0) return `${hh}h ${mm}m ${ss}s`;
      return `${mm}m ${ss}s`;
    };
    setLiveUptime(formatUp(seconds));
    const interval = setInterval(() => {
      seconds++;
      setLiveUptime(formatUp(seconds));
    }, 1000);
    return () => clearInterval(interval);
  }, [session?.online, session?.uptime]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await customersApi.update(id, form);
      toast.success('Customer updated');
      setEditing(false);
      fetchData();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleToggleStatus = async () => {
    try {
      await customersApi.update(id, { active: !customer.active });
      toast.success(customer.active ? 'Customer disabled' : 'Customer enabled');
      fetchData();
    } catch (err) { toast.error(err.message); }
  };

  const openPlanModal = () => {
    setNewPlanId('');
    setPlanStartDate(new Date().toISOString().split('T')[0]);
    setPlanEndDate('');
    setPlanModalOpen(true);
  };

  const handleChangePlan = async () => {
    if (!newPlanId) return;
    setApplyingPlan(true);
    try {
      const res = await customersApi.changePlan(id, {
        plan_id: newPlanId,
        start_date: planStartDate || undefined,
        end_date: planEndDate || undefined,
      });
      if (res.data?.scheduled) {
        toast.success(`Plan scheduled from ${planStartDate}`);
      } else {
        toast.success('Plan changed and applied');
      }
      setPlanModalOpen(false);
      setNewPlanId('');
      fetchData();
    } catch (err) { toast.error(err.message); }
    finally { setApplyingPlan(false); }
  };

  const handleCancelPending = async () => {
    try {
      await customersApi.cancelPendingPlan(id);
      toast.success('Pending plan change cancelled');
      fetchData();
    } catch (err) { toast.error(err.message); }
  };

  const handleDeleteCustomer = async () => {
    if (!window.confirm(`Are you sure you want to delete customer "${customer.full_name || customer.username}"? This action cannot be undone.`)) return;
    try {
      await customersApi.remove(id);
      toast.success('Customer deleted');
      navigate('/customers');
    } catch (err) { toast.error(err.message || 'Failed to delete customer'); }
  };

  const copyUsername = () => {
    navigator.clipboard.writeText(customer.username);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const upd = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={28} className="animate-spin text-indigo-500" /></div>;
  if (!customer) return null;

  const online = session?.online || false;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="space-y-0">
      {/* ── Top bar: breadcrumb + name + badges + actions ── */}
      <div className="bg-white border-b -mx-4 md:-mx-6 -mt-4 md:-mt-6 px-4 md:px-6 pt-4 pb-0 mb-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
          <Link to="/customers" className="hover:text-indigo-600 transition-colors">Customers</Link>
          <ChevronRight size={12} />
          <span className="text-gray-600 font-medium">List</span>
        </div>

        {/* Name row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar circle */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${!customer.active ? 'bg-red-400' : online ? 'bg-emerald-500' : 'bg-gray-400'}`}>
              {(customer.full_name || customer.username || '?')[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">#{String(customer.seq_id || 0).padStart(3, '0')}</span>
                <h1 className="text-base md:text-lg font-bold text-gray-900 truncate">{customer.full_name || customer.username}</h1>
                {customer.active ? (
                  online ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200/60 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />Online
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500 bg-gray-100 ring-1 ring-gray-200/60 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />Offline
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-600 bg-red-50 ring-1 ring-red-200/60 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />Disabled
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Balance: <span className={parseFloat(customer.balance) >= 0 ? 'text-emerald-600' : 'text-red-600'}>R{parseFloat(customer.balance || 0).toFixed(2)}</span> &middot; Since {fmtDate(customer.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!editing ? (
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border rounded-lg hover:bg-gray-50 shadow-sm">
                <Edit3 size={12} /> Edit
              </button>
            ) : (
              <>
                <button onClick={() => setEditing(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 bg-white border rounded-lg hover:bg-gray-50">
                  <X size={12} /> Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-amber-500/90 rounded-lg hover:bg-amber-600 disabled:opacity-50">
                  <Save size={12} /> {saving ? 'Saving...' : 'Save'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
                tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Left: Info (3 cols) */}
          <div className="lg:col-span-3 space-y-5">
            {/* Personal info */}
            <Card title="Personal Information" icon={<User size={14} className="text-gray-400" />}>
              {editing ? (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Full Name" value={form.full_name} onChange={upd('full_name')} span2 />
                  <Field label="Email" value={form.email} onChange={upd('email')} type="email" />
                  <Field label="Phone" value={form.phone} onChange={upd('phone')} />
                  <Field label="Address" value={form.address} onChange={upd('address')} span2 />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  <ReadRow icon={<Mail size={13} />} label="Email" value={customer.email} />
                  <ReadRow icon={<Phone size={13} />} label="Phone" value={customer.phone} />
                  <ReadRow icon={<MapPin size={13} />} label="Address" value={customer.address} span2 />
                  <ReadRow icon={<User size={13} />} label="Added by" value={customer.added_by_name || '—'} />
                </div>
              )}
            </Card>

            {/* PPPoE */}
            <Card title="PPPoE Credentials" icon={<KeyRound size={14} className="text-orange-400" />}>
              {editing ? (
                <div className="space-y-3">
                  <Field label="PPPoE Username" value={form.username} onChange={upd('username')} accent="orange" />
                  <Field label="PPPoE Password" value={form.password || ''} onChange={upd('password')} accent="orange" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className="text-[11px] text-gray-400 mb-1">Username</div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono font-semibold text-gray-900 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200/50">
                        {customer.username}
                      </code>
                      <button onClick={copyUsername} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 transition-colors">
                        {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-400 mb-1">Password</div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono font-semibold text-gray-900 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200/50">
                        {showPassword ? (customer.password || '—') : '••••••••'}
                      </code>
                      <button onClick={() => setShowPassword(!showPassword)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 transition-colors">
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Portal Access */}
            <Card title="Customer Portal Access" icon={<Globe size={14} className="text-blue-500" />}>
              <div className="space-y-3">
                <div>
                  <div className="text-[11px] text-gray-400 mb-1">Portal URL</div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200/50 break-all">
                      {window.location.origin}/portal/login
                    </code>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-400 mb-1">Login: same PPPoE credentials above</div>
                </div>
                <button
                  onClick={() => {
                    const portalUrl = `${window.location.origin}/portal/login`;
                    const text = `Your internet portal login:\n\nURL: ${portalUrl}\nUsername: ${customer.username}\nPassword: ${customer.password || '(ask your ISP)'}\n\nUse this portal to check your balance, redeem vouchers, and contact support.`;
                    navigator.clipboard.writeText(text);
                    toast.success('Portal credentials copied! Ready to send to client.');
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Copy size={14} /> Copy Login Details for Client
                </button>
              </div>
            </Card>
          </div>

          {/* Right: Plan + Balance + Actions (2 cols) */}
          <div className="lg:col-span-2 space-y-5">
            {/* Plan (read-only — change plan is under Services tab) */}
            <Card title="Internet Plan" icon={<Wifi size={14} className="text-purple-500" />}
              action={<button onClick={() => setTab('services')} className="text-[11px] text-purple-600 font-medium hover:underline">Manage</button>}>
              {customer.plan_name ? (
                <div className="space-y-3">
                  <p className="text-base font-bold text-gray-900">{customer.plan_name}</p>
                  <div className="flex gap-2">
                    <SpeedBox label="Download" value={customer.download_speed} />
                    <SpeedBox label="Upload" value={customer.upload_speed} />
                  </div>
                  {customer.plan_price && (
                    <p className="text-xs text-gray-500">R{parseFloat(customer.plan_price).toFixed(2)}/month</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No plan assigned</p>
              )}
            </Card>

            {/* Balance */}
            <Card title="Account Balance" icon={<DollarSign size={14} className="text-gray-400" />}>
              <p className={`text-2xl font-bold ${parseFloat(customer.balance) >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                R{parseFloat(customer.balance || 0).toFixed(2)}
              </p>
            </Card>

            {/* Notes / Comments */}
            <Card title="Notes" icon={<MessageSquare size={14} className="text-gray-400" />}>
              <textarea
                placeholder="Add notes about this customer..."
                className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none h-24 text-gray-700 placeholder:text-gray-300"
                readOnly
              />
              <p className="text-[10px] text-gray-300 mt-1.5">Notes feature coming soon</p>
            </Card>
          </div>
        </div>
      )}

      {tab === 'services' && (
        <div className="space-y-5">
          {/* Service table */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h2 className="text-sm font-semibold text-gray-800">Internet Services</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wider bg-gray-50/50 border-b">
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Plan</th>
                    <th className="px-5 py-3 font-medium">Speed</th>
                    <th className="px-5 py-3 font-medium">Price</th>
                    <th className="px-5 py-3 font-medium">PPPoE Login</th>
                    <th className="px-5 py-3 font-medium">IP Address</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.plan_name ? (
                    <tr className="border-b">
                      <td className="px-5 py-3">
                        {customer.active ? (
                          online ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200/60 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />Online
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 bg-blue-50 ring-1 ring-blue-200/60 px-2 py-0.5 rounded-full">Active</span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 bg-red-50 ring-1 ring-red-200/60 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />Blocked
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 font-medium text-gray-900">{customer.plan_name}</td>
                      <td className="px-5 py-3 text-gray-600">{customer.download_speed}/{customer.upload_speed}</td>
                      <td className="px-5 py-3 text-gray-600">{customer.plan_price ? `R${parseFloat(customer.plan_price).toFixed(2)}` : '—'}</td>
                      <td className="px-5 py-3"><code className="text-xs bg-gray-50 px-1.5 py-0.5 rounded">{customer.username}</code></td>
                      <td className="px-5 py-3">
                        {session?.ip ? <span className="text-xs font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{session.ip}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={(e) => { e.stopPropagation(); setActionsOpen(!actionsOpen); }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr><td colSpan={7} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <p className="text-gray-400 text-sm">No active services</p>
                        <SubscriptionGate>
                          <button onClick={() => setPlanModalOpen(true)}
                            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700">
                            + Add Service Plan
                          </button>
                        </SubscriptionGate>
                      </div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending plan banner */}
          {customer.pending_plan && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <Calendar size={16} className="text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pending Plan Change</span>
                    <span className="text-[10px] font-medium text-amber-600 bg-amber-100 ring-1 ring-amber-300/50 px-1.5 py-0.5 rounded-full">Scheduled</span>
                  </div>
                  <p className="text-sm text-amber-900 mt-0.5">
                    <span className="font-semibold">{customer.pending_plan.plan_name}</span>
                    {' '}({customer.pending_plan.download_speed}/{customer.pending_plan.upload_speed})
                    {' '}&middot; starts {new Date(customer.pending_plan.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {customer.pending_plan.end_date && <> &middot; ends {new Date(customer.pending_plan.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</>}
                  </p>
                  {customer.pending_plan.changed_by_name && (
                    <p className="text-xs text-amber-700/70 mt-1">
                      Changed by <span className="font-medium">{customer.pending_plan.changed_by_name}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setNewPlanId(customer.pending_plan.plan_id); setPlanStartDate(new Date(customer.pending_plan.start_date).toISOString().split('T')[0]); setPlanEndDate(customer.pending_plan.end_date ? new Date(customer.pending_plan.end_date).toISOString().split('T')[0] : ''); setPlanModalOpen(true); }}
                  className="px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-100 border border-amber-300 rounded-lg hover:bg-amber-200 transition-colors">
                  Edit
                </button>
                <button onClick={handleCancelPending}
                  className="px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Actions dropdown (fixed portal — never clipped) ── */}
      {actionsOpen && (
        <>
          <div className="fixed inset-0 z-[80]" onClick={() => setActionsOpen(false)} />
          <div className="fixed top-1/3 right-12 z-[90] bg-white border rounded-xl shadow-2xl py-2 w-52">
            {customer.active ? (
              <button onClick={() => { if (isExpired) { openUpgradeModal(); setActionsOpen(false); return; } handleToggleStatus(); setActionsOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${isExpired ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}>
                <PowerOff size={15} /> Block Service
              </button>
            ) : (
              <button onClick={() => { if (isExpired) { openUpgradeModal(); setActionsOpen(false); return; } handleToggleStatus(); setActionsOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${isExpired ? 'text-gray-400 cursor-not-allowed' : 'text-emerald-600 hover:bg-emerald-50'}`}>
                <Power size={15} /> Activate Service
              </button>
            )}
            <button onClick={() => { if (isExpired) { openUpgradeModal(); setActionsOpen(false); return; } openPlanModal(); setActionsOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${isExpired ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}>
              <ArrowRight size={15} /> Change Plan
            </button>
            <button onClick={() => setActionsOpen(false)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <RefreshCw size={15} /> Restart Session
            </button>
            <div className="border-t my-1" />
            <button onClick={() => { if (isExpired) { openUpgradeModal(); setActionsOpen(false); return; } handleDeleteCustomer(); setActionsOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${isExpired ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}>
              <Trash2 size={15} /> Delete Customer
            </button>
          </div>
        </>
      )}

      {/* ── Change Plan Modal ── */}
      {planModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPlanModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Modal header */}
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi size={18} className="text-purple-500" />
                <h2 className="text-base font-semibold text-gray-900">{customer.plan_name ? 'Change Service Plan' : 'Add Service Plan'}</h2>
              </div>
              <button onClick={() => setPlanModalOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>

            {/* Current plan */}
            {customer.plan_name && (
              <div className="px-6 pt-4">
                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium mb-1.5">Current Plan</p>
                <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{customer.plan_name}</p>
                    <p className="text-xs text-gray-400">{customer.download_speed}/{customer.upload_speed}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-700">R{parseFloat(customer.plan_price || 0).toFixed(2)}/mo</span>
                </div>
              </div>
            )}

            {/* New plan selection — scrollable dropdown */}
            <div className="px-6 pt-4 space-y-4">
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium mb-1.5">New Plan</p>
                <div className="relative">
                  {/* Selected value display */}
                  <button
                    type="button"
                    onClick={() => document.getElementById('plan-dropdown').classList.toggle('hidden')}
                    className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white text-left outline-none focus:ring-2 focus:ring-purple-400/20 focus:border-purple-400 flex items-center justify-between"
                  >
                    <span className={newPlanId ? 'text-gray-900' : 'text-gray-400'}>
                      {newPlanId ? plans.find(p => p.id === newPlanId)?.name + ' — ' + plans.find(p => p.id === newPlanId)?.download_speed + '/' + plans.find(p => p.id === newPlanId)?.upload_speed + ' — R' + parseFloat(plans.find(p => p.id === newPlanId)?.price || 0).toFixed(2) + '/mo' : '— Select a plan —'}
                    </span>
                    <ChevronRight size={16} className="text-gray-400 rotate-90" />
                  </button>
                  
                  {/* Scrollable dropdown */}
                  <div id="plan-dropdown" className="hidden absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-purple-50 ${!newPlanId ? 'bg-purple-50 text-purple-700' : 'text-gray-400'}`}
                      onClick={() => { setNewPlanId(''); document.getElementById('plan-dropdown').classList.add('hidden'); }}
                    >
                      — Select a plan —
                    </div>
                    {plans.filter(p => p.id !== customer.plan_id).map((p) => (
                      <div
                        key={p.id}
                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-purple-50 border-t border-gray-50 ${newPlanId === p.id ? 'bg-purple-50 text-purple-700' : 'text-gray-700'}`}
                        onClick={() => { setNewPlanId(p.id); document.getElementById('plan-dropdown').classList.add('hidden'); }}
                      >
                        <span className="font-medium">{p.name}</span>
                        <span className="text-gray-400 ml-2">— {p.download_speed}/{p.upload_speed} — R{parseFloat(p.price).toFixed(2)}/mo</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-gray-400 uppercase tracking-wider font-medium mb-1.5">Start Date</label>
                  <input type="date" value={planStartDate} onChange={(e) => setPlanStartDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-400/20 focus:border-purple-400" />
                  {planStartDate && new Date(planStartDate) > new Date(new Date().toISOString().split('T')[0]) && (
                    <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                      <Calendar size={10} /> Will be scheduled as pending
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] text-gray-400 uppercase tracking-wider font-medium mb-1.5">End Date <span className="text-gray-300">(optional)</span></label>
                  <input type="date" value={planEndDate} onChange={(e) => setPlanEndDate(e.target.value)}
                    min={planStartDate}
                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-400/20 focus:border-purple-400" />
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 mt-2 border-t flex items-center justify-end gap-2">
              <button onClick={() => setPlanModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-500 bg-white border rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleChangePlan} disabled={!newPlanId || applyingPlan}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-40">
                {applyingPlan ? 'Applying...' : planStartDate && new Date(planStartDate) > new Date(new Date().toISOString().split('T')[0]) ? 'Schedule Plan' : 'Apply Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'invoices' && <CustomerInvoices customerId={id} />}

      {tab === 'statistics' && (
        <div className="space-y-5">
          <LiveBandwidth customerId={id} />
          <CustomerStatistics customerId={id} />
        </div>
      )}

      {tab === 'tickets' && <CustomerTickets customerId={id} />}

      {tab === 'tasks' && <CustomerTasks customerId={id} />}

      {tab === 'documents' && <CustomerDocuments customerId={id} />}

      {tab === 'equipment' && (
        <PlaceholderTab icon={<Package size={32} />} title="Equipment"
          desc="Routers, ONTs, and other equipment assigned to this customer will appear here once stock management is enabled." />
      )}
    </div>
  );
}

// ── Reusable components ──────────────────────────────────────

function Card({ title, icon, action, children }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function ReadRow({ icon, label, value, span2 }) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <div className="flex items-center gap-1 text-[11px] text-gray-400 mb-0.5">{icon}{label}</div>
      <p className="text-sm text-gray-800">{value || <span className="text-gray-300">—</span>}</p>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', span2, accent }) {
  const ring = accent === 'orange' ? 'focus:ring-orange-400/20 focus:border-orange-400 border-orange-200 bg-orange-50/30' : 'focus:ring-blue-500/20 focus:border-blue-400';
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <label className="block text-[11px] font-medium text-gray-500 mb-1">{label}</label>
      <input type={type} value={value} onChange={onChange}
        className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 ${ring}`} />
    </div>
  );
}

function Stat({ label, value, mono, live }) {
  return (
    <div>
      <p className="text-[10px] text-emerald-600/70 uppercase tracking-wider font-medium">{label}</p>
      <p className={`text-sm font-semibold text-emerald-900 mt-0.5 ${mono ? 'font-mono' : ''}`}>
        {live && <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse mr-1.5 align-middle" />}
        <span className={live ? 'tabular-nums' : ''}>{value || '—'}</span>
      </p>
    </div>
  );
}

function SpeedBox({ label, value }) {
  return (
    <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
      <p className="text-[10px] text-gray-400 uppercase">{label}</p>
      <p className="text-sm font-bold text-gray-800">{value || '—'}</p>
    </div>
  );
}

function PlaceholderTab({ icon, title, desc }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-8">
      <div className="flex flex-col items-center justify-center text-center py-8">
        <div className="text-gray-300 mb-3">{icon}</div>
        <h3 className="text-sm font-semibold text-gray-700 mb-1">{title}</h3>
        <p className="text-xs text-gray-400 max-w-sm">{desc}</p>
      </div>
    </div>
  );
}
