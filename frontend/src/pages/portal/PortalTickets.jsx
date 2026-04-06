import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Headphones, Plus, Loader2, ArrowLeft, Send, Clock,
  CheckCircle2, AlertCircle, ChevronRight, MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { portalApi } from '../../services/api';

const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

const statusConfig = {
  open: { label: 'Open', color: 'text-blue-700 bg-blue-50 ring-blue-200/60', icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'text-amber-700 bg-amber-50 ring-amber-200/60', icon: Clock },
  resolved: { label: 'Resolved', color: 'text-emerald-700 bg-emerald-50 ring-emerald-200/60', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'text-gray-600 bg-gray-100', icon: CheckCircle2 },
};

const priorityColor = {
  low: 'text-gray-500',
  medium: 'text-blue-600',
  high: 'text-orange-600',
  urgent: 'text-red-600',
};

export default function PortalTickets() {
  const { user } = useOutletContext();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // list | detail | create
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  // Create form
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [creating, setCreating] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await portalApi.getTickets();
      setTickets(res.data);
    } catch { toast.error('Failed to load tickets'); }
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, []);

  const openTicket = async (id) => {
    try {
      const res = await portalApi.getTicket(id);
      setSelectedTicket(res.data);
      setComments(res.data.comments || []);
      setView('detail');
    } catch { toast.error('Failed to load ticket'); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    setCreating(true);
    try {
      await portalApi.createTicket(subject.trim(), description.trim(), priority);
      toast.success('Ticket created! We\'ll get back to you soon.');
      setSubject(''); setDescription(''); setPriority('medium');
      setView('list');
      fetchTickets();
    } catch (err) { toast.error(err.message); }
    setCreating(false);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTicket) return;
    setSendingComment(true);
    try {
      const res = await portalApi.addTicketComment(selectedTicket.id, newComment.trim());
      setComments([...comments, { ...res.data, is_customer: true }]);
      setNewComment('');
    } catch (err) { toast.error(err.message); }
    setSendingComment(false);
  };

  if (!user) return null;

  // ─── Create View ───
  if (view === 'create') {
    return (
      <div className="space-y-5">
        <button onClick={() => setView('list')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={14} /> Back to tickets
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">New Support Ticket</h1>
          <p className="text-sm text-gray-400 mt-0.5">Describe your issue and we'll help you as soon as possible</p>
        </div>
        <form onSubmit={handleCreate} className="bg-white rounded-xl border p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Subject</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your issue" required
              className="w-full px-3.5 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe your issue in detail..." required rows={5}
              className="w-full px-3.5 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}
              className="px-3 py-2.5 border rounded-lg text-sm bg-white">
              <option value="low">Low — General question</option>
              <option value="medium">Medium — Something isn't working right</option>
              <option value="high">High — Serious issue</option>
              <option value="urgent">Urgent — No internet at all</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setView('list')}
              className="px-4 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={creating || !subject.trim() || !description.trim()}
              className="px-5 py-2.5 bg-amber-500/90 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2">
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {creating ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ─── Detail View ───
  if (view === 'detail' && selectedTicket) {
    const sc = statusConfig[selectedTicket.status] || statusConfig.open;
    const StatusIcon = sc.icon;
    return (
      <div className="space-y-4">
        <button onClick={() => { setView('list'); setSelectedTicket(null); }}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={14} /> Back to tickets
        </button>

        {/* Ticket Header */}
        <div className="bg-white rounded-xl border p-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{selectedTicket.subject}</h2>
              <p className="text-xs text-gray-400 mt-1">Created {fmtDateTime(selectedTicket.created_at)}</p>
            </div>
            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full ring-1 ${sc.color}`}>
              <StatusIcon size={12} /> {sc.label}
            </span>
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
            {selectedTicket.description}
          </div>
        </div>

        {/* Comments */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-5 py-3 border-b flex items-center gap-2">
            <MessageSquare size={16} className="text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-800">Conversation ({comments.length})</h3>
          </div>

          {comments.length > 0 ? (
            <div className="divide-y">
              {comments.map((c) => (
                <div key={c.id} className={`px-5 py-4 ${c.is_customer ? 'bg-blue-50/30' : ''}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      c.is_customer ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {c.is_customer ? 'Y' : 'S'}
                    </div>
                    <span className="text-xs font-semibold text-gray-700">
                      {c.is_customer ? 'You' : (c.author_name || 'Support')}
                    </span>
                    <span className="text-[10px] text-gray-400">{fmtDateTime(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700 ml-8 whitespace-pre-wrap">{c.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-5 py-8 text-sm text-gray-400 text-center">No replies yet</p>
          )}

          {/* Reply */}
          {selectedTicket.status !== 'closed' && (
            <form onSubmit={handleComment} className="px-5 py-3 border-t flex gap-2">
              <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)}
                placeholder="Type your reply..."
                className="flex-1 px-3.5 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
              <button type="submit" disabled={sendingComment || !newComment.trim()}
                className="px-4 py-2.5 bg-amber-500/90 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 disabled:opacity-50">
                {sendingComment ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ─── List View ───
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Support</h1>
          <p className="text-sm text-gray-400 mt-0.5">Need help? Open a support ticket</p>
        </div>
        <button onClick={() => setView('create')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-500/90 rounded-lg hover:bg-amber-600 shadow-sm self-start sm:self-auto">
          <Plus size={14} /> New Ticket
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 size={20} className="animate-spin text-blue-500" /></div>
        ) : tickets.length > 0 ? (
          <div className="divide-y">
            {tickets.map((t) => {
              const sc = statusConfig[t.status] || statusConfig.open;
              const StatusIcon = sc.icon;
              return (
                <button key={t.id} onClick={() => openTicket(t.id)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 text-left group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <Headphones size={16} className="text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{t.subject}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ring-1 ${sc.color}`}>
                          <StatusIcon size={10} /> {sc.label}
                        </span>
                        <span className={`text-[10px] font-medium capitalize ${priorityColor[t.priority] || ''}`}>{t.priority}</span>
                        <span className="text-[10px] text-gray-400">{fmtDateTime(t.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 shrink-0" />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="px-5 py-16 text-center">
            <Headphones size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">No tickets yet</p>
            <p className="text-xs text-gray-400 mt-1">Need help? Create a new support ticket</p>
            <button onClick={() => setView('create')}
              className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">
              <Plus size={14} className="inline mr-1" /> Create Ticket
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
