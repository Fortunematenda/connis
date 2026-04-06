import { useState } from 'react';
import {
  Settings, Building2, Pencil, X, Check, Loader2, CreditCard,
  FileText, Activity, AlertTriangle, UserCheck, XCircle, Terminal,
  Download, RefreshCw, ChevronRight, User, Shield, Mail, Phone, MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const TABS = [
  { key: 'company', label: 'Company', icon: Building2 },
  { key: 'admin', label: 'Admin & Security', icon: Shield },
  { key: 'logs', label: 'System Logs', icon: Terminal },
];

const MOCK_LOGS = [
  { id: 1, timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), level: 'info', category: 'auth', message: 'Admin user logged in successfully', details: 'IP: 196.214.55.172', user: 'admin@connis.co.za' },
  { id: 2, timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), level: 'warning', category: 'auth', message: 'Failed login attempt', details: 'IP: 192.168.1.100, Username: unknown_user', user: null },
  { id: 3, timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), level: 'error', category: 'system', message: 'MikroTik API connection timeout', details: 'Router: Main Tower, Error: Timeout after 5000ms', user: null },
  { id: 4, timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), level: 'info', category: 'customer', message: 'Customer account created', details: 'Customer: John Doe, ID: #001', user: 'admin@connis.co.za' },
  { id: 5, timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), level: 'info', category: 'customer', message: 'Plan change applied', details: 'Customer: Jane Smith, Plan: pppoe-10M -> pppoe-20M', user: 'admin@connis.co.za' },
  { id: 6, timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(), level: 'warning', category: 'radius', message: 'RADIUS accounting delay detected', details: 'Queue size: 145, Processing delay: 3.2s', user: null },
  { id: 7, timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), level: 'error', category: 'database', message: 'Database connection pool exhausted', details: 'Active connections: 20/20, Waiting queries: 8', user: null },
  { id: 8, timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), level: 'info', category: 'system', message: 'Automated backup completed', details: 'Backup size: 2.4MB, Duration: 12s', user: 'system' },
];

const SettingsPage = () => {
  const { company, admin, refreshCompany } = useAuth();
  const [tab, setTab] = useState('company');

  // Company edit state
  const [editingCompany, setEditingCompany] = useState(false);
  const [companyForm, setCompanyForm] = useState({ name: '', email: '', phone: '', address: '', bank_details: '' });
  const [companySaving, setCompanySaving] = useState(false);

  // System Logs state
  const [logs] = useState(MOCK_LOGS);
  const [logFilter, setLogFilter] = useState('all');
  const [logLevelFilter, setLogLevelFilter] = useState('all');
  const [expandedLog, setExpandedLog] = useState(null);

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none text-sm transition-all';

  // Company helpers
  const startEditCompany = () => {
    setEditingCompany(true);
    setCompanyForm({
      name: company?.name || '',
      email: company?.email || '',
      phone: company?.phone || '',
      address: company?.address || '',
      bank_details: company?.bank_details || '',
    });
  };

  const cancelEditCompany = () => {
    setEditingCompany(false);
    setCompanyForm({ name: '', email: '', phone: '', address: '', bank_details: '' });
  };

  const saveCompany = async () => {
    setCompanySaving(true);
    try {
      await authApi.updateCompany(companyForm);
      toast.success('Company details updated');
      setEditingCompany(false);
      await refreshCompany();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCompanySaving(false);
    }
  };

  // Log helpers
  const getFilteredLogs = () => logs.filter(l => {
    if (logFilter !== 'all' && l.category !== logFilter) return false;
    if (logLevelFilter !== 'all' && l.level !== logLevelFilter) return false;
    return true;
  });

  const logLevelStyle = (level) => ({
    error: 'bg-red-50 text-red-600 border-red-200',
    warning: 'bg-amber-50 text-amber-600 border-amber-200',
    info: 'bg-blue-50 text-blue-600 border-blue-200',
  }[level] || 'bg-gray-50 text-gray-600 border-gray-200');

  const logLevelIcon = (level) => ({
    error: <XCircle size={14} />, warning: <AlertTriangle size={14} />, info: <Activity size={14} />,
  }[level] || <FileText size={14} />);

  const catIcon = (c) => ({
    auth: <UserCheck size={10} />, customer: <User size={10} />, system: <Settings size={10} />,
    radius: <Activity size={10} />, database: <FileText size={10} />,
  }[c] || <FileText size={10} />);

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'Level', 'Category', 'Message', 'User', 'Details'].join(','),
      ...getFilteredLogs().map(l => [l.timestamp, l.level, l.category, `"${l.message}"`, l.user || '', `"${l.details || ''}"`].join(','))
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Logs exported');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Settings size={24} /> Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">Manage your company profile, admin account, and system configuration</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="flex border-b">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 ${
                tab === key
                  ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ═══ COMPANY TAB ═══ */}
          {tab === 'company' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Company Profile</h3>
                  <p className="text-sm text-gray-500">Your business details shown to customers</p>
                </div>
                {!editingCompany && (
                  <button onClick={startEditCompany}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                    <Pencil size={14} /> Edit Profile
                  </button>
                )}
              </div>

              {editingCompany ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name</label>
                      <input type="text" value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                      <input type="email" value={companyForm.email} onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                      <input type="text" value={companyForm.phone} onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                      <input type="text" value={companyForm.address} onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                      <CreditCard size={16} /> Bank Details
                    </label>
                    <textarea value={companyForm.bank_details} onChange={(e) => setCompanyForm({ ...companyForm, bank_details: e.target.value })}
                      placeholder={"Bank Name:\nAccount Name:\nAccount Number:\nBranch Code:\nReference: Customer Name/Account"} rows={5} className={inputCls} />
                    <p className="text-xs text-gray-400 mt-1.5">Displayed in the customer portal under Payment Options</p>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button onClick={saveCompany} disabled={companySaving}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors">
                      {companySaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save Changes
                    </button>
                    <button onClick={cancelEditCompany}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm font-medium transition-colors">
                      <X size={16} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Info cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Building2 size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium">Company Name</p>
                        <p className="text-sm font-semibold text-gray-800 mt-0.5">{company?.name || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                      <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Mail size={16} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium">Email</p>
                        <p className="text-sm font-semibold text-gray-800 mt-0.5">{company?.email || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                      <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Phone size={16} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium">Phone</p>
                        <p className="text-sm font-semibold text-gray-800 mt-0.5">{company?.phone || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                      <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <MapPin size={16} className="text-orange-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium">Address</p>
                        <p className="text-sm font-semibold text-gray-800 mt-0.5">{company?.address || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                    <div className="flex items-center gap-2 mb-3">
                      <CreditCard size={16} className="text-emerald-600" />
                      <h4 className="text-sm font-semibold text-gray-800">Bank Details</h4>
                    </div>
                    {company?.bank_details ? (
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-white rounded-lg p-3 border border-emerald-100">{company.bank_details}</pre>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No bank details configured. Click Edit Profile to add them.</p>
                    )}
                  </div>

                  {/* Subscription */}
                  <div className="p-5 bg-gray-50 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Subscription</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          company?.subscription_status === 'active' || company?.subscription_status === 'trial'
                            ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>{company?.subscription_status?.toUpperCase()}</span>
                        <span className="text-sm text-gray-600">{company?.subscription_plan}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 font-medium">Expires</p>
                      <p className="text-sm font-semibold text-gray-800 mt-1">{company?.expires_at ? new Date(company.expires_at).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ ADMIN TAB ═══ */}
          {tab === 'admin' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Admin Account</h3>
                <p className="text-sm text-gray-500">Your personal admin details and security settings</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Full Name</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{admin?.full_name || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Mail size={16} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Email</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{admin?.email || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Shield size={16} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Role</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5 capitalize">{admin?.role || '—'}</p>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-amber-800">Security</h4>
                    <p className="text-sm text-amber-700 mt-1">Password change and two-factor authentication features coming soon.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ SYSTEM LOGS TAB ═══ */}
          {tab === 'logs' && (
            <div className="space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">System Logs</h3>
                  <p className="text-sm text-gray-500">{getFilteredLogs().length} entries</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select value={logFilter} onChange={(e) => setLogFilter(e.target.value)}
                    className="px-3 py-2 text-sm border rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20 outline-none">
                    <option value="all">All Categories</option>
                    <option value="auth">Authentication</option>
                    <option value="customer">Customer</option>
                    <option value="system">System</option>
                    <option value="radius">RADIUS</option>
                    <option value="database">Database</option>
                  </select>
                  <select value={logLevelFilter} onChange={(e) => setLogLevelFilter(e.target.value)}
                    className="px-3 py-2 text-sm border rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20 outline-none">
                    <option value="all">All Levels</option>
                    <option value="error">Error</option>
                    <option value="warning">Warning</option>
                    <option value="info">Info</option>
                  </select>
                  <button onClick={exportLogs}
                    className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition flex items-center gap-1.5">
                    <Download size={14} /> Export
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-red-600 text-xs font-medium mb-1"><XCircle size={12} /> Errors</div>
                  <p className="text-xl font-bold text-red-700">{logs.filter(l => l.level === 'error').length}</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-amber-600 text-xs font-medium mb-1"><AlertTriangle size={12} /> Warnings</div>
                  <p className="text-xl font-bold text-amber-700">{logs.filter(l => l.level === 'warning').length}</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-blue-600 text-xs font-medium mb-1"><Activity size={12} /> Info</div>
                  <p className="text-xl font-bold text-blue-700">{logs.filter(l => l.level === 'info').length}</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-gray-600 text-xs font-medium mb-1"><FileText size={12} /> Total</div>
                  <p className="text-xl font-bold text-gray-700">{logs.length}</p>
                </div>
              </div>

              {/* Log entries */}
              <div className="space-y-2">
                {getFilteredLogs().length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <FileText size={40} className="mx-auto mb-2 opacity-50" />
                    <p>No logs found matching your filters</p>
                  </div>
                ) : getFilteredLogs().map((log) => (
                  <div key={log.id} className={`border rounded-xl overflow-hidden transition-all ${
                    expandedLog === log.id ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="p-3 cursor-pointer" onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}>
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${logLevelStyle(log.level).split(' ')[0]}`}>
                          {logLevelIcon(log.level)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${logLevelStyle(log.level)}`}>{log.level.toUpperCase()}</span>
                            <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{catIcon(log.category)} {log.category}</span>
                            {log.user && <span className="text-xs text-gray-400">by {log.user}</span>}
                          </div>
                          <p className="text-sm text-gray-800 mt-1 font-medium">{log.message}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{new Date(log.timestamp).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                        </div>
                        <div className="text-gray-400">{expandedLog === log.id ? <X size={16} /> : <ChevronRight size={16} />}</div>
                      </div>
                    </div>
                    {expandedLog === log.id && (
                      <div className="px-3 pb-3"><div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Details</h4>
                        <p className="text-sm text-gray-700 font-mono">{log.details}</p>
                        {log.user && <div className="mt-2 pt-2 border-t border-gray-200"><span className="text-xs text-gray-500">User: </span><span className="text-sm text-gray-700">{log.user}</span></div>}
                      </div></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
