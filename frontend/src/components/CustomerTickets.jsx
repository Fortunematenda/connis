import { useState, useEffect, useCallback } from 'react';
import { Ticket, Plus, X, MessageSquare, Send, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { ticketsApi } from '../services/api';

const STATUS_COLORS = {
  open: 'text-blue-700 bg-blue-50 ring-blue-200/60',
  in_progress: 'text-amber-700 bg-amber-50 ring-amber-200/60',
  waiting: 'text-purple-700 bg-purple-50 ring-purple-200/60',
  resolved: 'text-emerald-700 bg-emerald-50 ring-emerald-200/60',
  closed: 'text-gray-600 bg-gray-100 ring-gray-200/60',
};

const PRIORITY_COLORS = {
  low: 'text-gray-600 bg-gray-50',
  medium: 'text-blue-600 bg-blue-50',
  high: 'text-orange-600 bg-orange-50',
  critical: 'text-red-600 bg-red-50',
};

const fmtDate = (d) => d ? new Date(d).toLocaleString('en-GB', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
}) : '—';

export default function CustomerTickets({ customerId }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);

  const [form, setForm] = useState({ subject: '', description: '', priority: 'medium' });

  const fetchTickets = useCallback(async () => {
    try {
      const res = await ticketsApi.getAll({ user_id: customerId });
      setTickets(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, [customerId]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const loadDetail = async (id) => {
    try {
      const res = await ticketsApi.getById(id);
      setDetail(res.data);
      setSelected(id);
    } catch { toast.error('Failed to load ticket'); }
  };

  const handleCreate = async () => {
    if (!form.subject.trim()) return toast.error('Subject is required');
    try {
      await ticketsApi.create({ user_id: customerId, ...form });
      toast.success('Ticket created');
      setShowCreate(false);
      setForm({ subject: '', description: '', priority: 'medium' });
      fetchTickets();
    } catch (e) { toast.error(e.message); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await ticketsApi.update(id, { status });
      toast.success('Status updated');
      fetchTickets();
      if (detail?.id === id) loadDetail(id);
    } catch (e) { toast.error(e.message); }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    setSending(true);
    try {
      await ticketsApi.addComment(selected, comment);
      setComment('');
      loadDetail(selected);
    } catch (e) { toast.error(e.message); }
    setSending(false);
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-blue-500" /></div>;

  // ── Detail view ──
  if (detail && selected) {
    return (
      <div className="space-y-4">
        <button onClick={() => { setSelected(null); setDetail(null); }} className="text-sm text-blue-600 hover:underline">&larr; Back to tickets</button>
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="px-5 py-4 border-b">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{detail.subject}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Created {fmtDate(detail.created_at)} {detail.created_by_name && `by ${detail.created_by_name}`}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ring-1 ${PRIORITY_COLORS[detail.priority] || ''}`}>
                  {detail.priority}
                </span>
                <select value={detail.status} onChange={(e) => handleStatusChange(detail.id, e.target.value)}
                  className="text-xs border rounded px-2 py-1 bg-white">
                  {['open', 'in_progress', 'waiting', 'resolved', 'closed'].map(s => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
            {detail.description && <p className="text-sm text-gray-600 mt-3">{detail.description}</p>}
          </div>

          {/* Comments */}
          <div className="px-5 py-4 space-y-3 max-h-96 overflow-y-auto">
            {detail.comments?.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No comments yet</p>
            )}
            {detail.comments?.map((c) => (
              <div key={c.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-700">{c.author_name || 'Admin'}</span>
                  <span className="text-[10px] text-gray-400">{fmtDate(c.created_at)}</span>
                </div>
                <p className="text-sm text-gray-600">{c.content}</p>
              </div>
            ))}
          </div>

          {/* Add comment */}
          <div className="px-5 py-3 border-t flex gap-2">
            <input value={comment} onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              onKeyDown={(e) => e.key === 'Enter' && handleComment()}
              className="flex-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
            <button onClick={handleComment} disabled={sending || !comment.trim()}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── List view ──
  return (
    <div className="space-y-4">
      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-xl border shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">New Ticket</h3>
            <button onClick={() => setShowCreate(false)}><X size={16} className="text-gray-400" /></button>
          </div>
          <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="Subject" className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description (optional)" rows={3}
            className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none" />
          <div className="flex items-center gap-3">
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm bg-white">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              Create Ticket
            </button>
          </div>
        </div>
      )}

      {/* Header + add button */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</p>
        {!showCreate && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            <Plus size={14} /> New Ticket
          </button>
        )}
      </div>

      {/* Table */}
      {tickets.length === 0 ? (
        <div className="bg-white rounded-xl border shadow-sm flex flex-col items-center justify-center py-16 text-center">
          <Ticket size={28} className="text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">No tickets yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider bg-gray-50/50 border-b">
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} onClick={() => loadDetail(t.id)}
                  className="border-b last:border-0 hover:bg-blue-50/30 cursor-pointer transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{t.subject}</div>
                    {t.created_by_name && <div className="text-[11px] text-gray-400 mt-0.5">by {t.created_by_name}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ring-1 ${STATUS_COLORS[t.status] || ''}`}>
                      {t.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[t.priority] || ''}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
