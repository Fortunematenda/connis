import { useState, useEffect, useCallback } from 'react';
import {
  TicketCheck, Plus, Loader2, Search, RefreshCw, Trash2, Copy, Check,
  Filter, Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { vouchersApi } from '../services/api';

const fmtCurrency = (v) => 'R' + Number(v || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterUsed, setFilterUsed] = useState('all');
  const [showGenerate, setShowGenerate] = useState(false);
  const [genAmount, setGenAmount] = useState('');
  const [genCount, setGenCount] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const used = filterUsed === 'all' ? undefined : filterUsed;
      const res = await vouchersApi.getAll(used);
      setVouchers(res.data);
    } catch { toast.error('Failed to load vouchers'); }
    setLoading(false);
  }, [filterUsed]);

  useEffect(() => { fetchVouchers(); }, [fetchVouchers]);

  const handleGenerate = async () => {
    const amount = parseFloat(genAmount);
    if (!amount || amount <= 0) return toast.error('Enter a valid amount');
    if (genCount < 1 || genCount > 100) return toast.error('Count must be 1–100');
    setGenerating(true);
    try {
      const res = await vouchersApi.generate(amount, genCount);
      toast.success(`Generated ${res.data.length} voucher(s)`);
      setShowGenerate(false);
      setGenAmount('');
      setGenCount(1);
      fetchVouchers();
    } catch (e) { toast.error(e.message); }
    setGenerating(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this unused voucher?')) return;
    try {
      await vouchersApi.remove(id);
      toast.success('Deleted');
      fetchVouchers();
    } catch (e) { toast.error(e.message); }
  };

  const copyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Copied!');
  };

  const filtered = vouchers.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return v.code.toLowerCase().includes(q) ||
      v.used_by_name?.toLowerCase().includes(q) ||
      v.used_by_username?.toLowerCase().includes(q);
  });

  const exportCsv = () => {
    const rows = filtered.map(v => `${v.code},${v.amount},${v.is_used ? 'Used' : 'Available'},${v.used_by_name || ''},${fmtDate(v.created_at)}`);
    const csv = `Code,Amount,Status,Used By,Created\n${rows.join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'vouchers.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const totalValue = vouchers.filter(v => !v.is_used).reduce((s, v) => s + parseFloat(v.amount), 0);
  const usedCount = vouchers.filter(v => v.is_used).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Vouchers</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {vouchers.length} total · {usedCount} used · {fmtCurrency(totalValue)} available value
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchVouchers} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 shadow-sm">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => setShowGenerate(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-500/90 rounded-lg hover:bg-amber-600 shadow-sm">
            <Plus size={14} /> Generate
          </button>
        </div>
      </div>

      {/* Generate Modal */}
      {showGenerate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowGenerate(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Generate Vouchers</h2>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Amount per voucher (R)</label>
              <input type="number" value={genAmount} onChange={(e) => setGenAmount(e.target.value)}
                placeholder="e.g. 50" min="1" step="0.01"
                className="w-full px-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">How many?</label>
              <input type="number" value={genCount} onChange={(e) => setGenCount(parseInt(e.target.value) || 1)}
                min="1" max="100"
                className="w-full px-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowGenerate(false)}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={handleGenerate} disabled={generating}
                className="px-5 py-2 text-sm font-semibold text-white bg-amber-500/90 rounded-lg hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2">
                {generating ? <><Loader2 size={14} className="animate-spin" /> Generating...</> : <><TicketCheck size={14} /> Generate</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <select value={filterUsed} onChange={(e) => { setFilterUsed(e.target.value); }}
              className="px-2 py-1.5 border rounded-lg text-sm bg-white">
              <option value="all">All</option>
              <option value="false">Available</option>
              <option value="true">Used</option>
            </select>
            <button onClick={exportCsv} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-500 border rounded-lg hover:bg-gray-50">
              <Download size={12} /> Export CSV
            </button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vouchers..."
              className="pl-9 pr-4 py-2 border rounded-lg text-sm w-full sm:w-56 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none" />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={24} className="animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-16 text-center text-gray-400 text-sm">
            {vouchers.length === 0 ? 'No vouchers yet. Generate some to get started.' : 'No results found.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b bg-gray-50/50">
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-3 py-3 font-medium">Amount</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Used By</th>
                  <th className="px-3 py-3 font-medium">Created By</th>
                  <th className="px-3 py-3 font-medium">Created</th>
                  <th className="px-3 py-3 font-medium w-16"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v.id} className="border-b last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono font-bold text-gray-900">{v.code}</code>
                        <button onClick={() => copyCode(v.code, v.id)}
                          className="p-1 text-gray-300 hover:text-blue-600 rounded">
                          {copiedId === v.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-semibold text-gray-800">{fmtCurrency(v.amount)}</td>
                    <td className="px-3 py-3">
                      {v.is_used ? (
                        <span className="inline-flex items-center text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Used</span>
                      ) : (
                        <span className="inline-flex items-center text-[11px] font-medium text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200/60 px-2 py-0.5 rounded-full">Available</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">
                      {v.is_used ? (
                        <div>
                          <span>{v.used_by_name || v.used_by_username || '—'}</span>
                          {v.used_at && <span className="text-[10px] text-gray-400 ml-1">({fmtDate(v.used_at)})</span>}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">{v.created_by_name || '—'}</td>
                    <td className="px-3 py-3 text-xs text-gray-500">{fmtDate(v.created_at)}</td>
                    <td className="px-3 py-3">
                      {!v.is_used && (
                        <button onClick={() => handleDelete(v.id)}
                          className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
