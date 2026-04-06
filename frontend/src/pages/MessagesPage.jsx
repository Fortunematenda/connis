import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  MessageSquare, Send, Loader2, Search, ArrowLeft, User, Clock, Paperclip,
  Phone, Mail, CalendarPlus, ExternalLink, X, Wrench, AlertTriangle, Reply,
  Check, Pencil,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { messagesApi, tasksApi, staffApi } from '../services/api';

const fmtTime = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
const isImage = (url) => url && /\.(jpg|jpeg|png|gif|webp|heic|heif)/i.test(url);
const fixUrl = (url) => {
  if (!url) return url;
  if (url.startsWith('/uploads/')) return '/api' + url;
  return url;
};

function ChatAttachment({ url, isAdmin }) {
  const src = fixUrl(url);
  if (!src) return null;
  if (isImage(src)) {
    return (
      <a href={src} target="_blank" rel="noopener noreferrer" className="block mt-1">
        <img src={src} alt="attachment" className={`max-w-[220px] max-h-[200px] rounded-lg border ${isAdmin ? 'border-blue-400/30' : 'border-gray-200'} object-cover`} />
      </a>
    );
  }
  return (
    <a href={src} target="_blank" rel="noopener noreferrer"
      className={`flex items-center gap-1.5 mt-1 text-xs underline ${isAdmin ? 'text-blue-100' : 'text-blue-600'}`}>
      <Paperclip size={12} /> View attachment
    </a>
  );
}

const priorityColors = { low: 'bg-gray-100 text-gray-600', medium: 'bg-blue-100 text-blue-700', high: 'bg-red-100 text-red-700' };

function parseTaskCard(content) {
  try { const obj = JSON.parse(content); if (obj._type === 'task_card') return obj; } catch {}
  return null;
}

function TaskCardAdmin({ task, onReply, onResend }) {
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ...task });
  const [saving, setSaving] = useState(false);
  const dateStr = editForm.date ? new Date(editForm.date).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : 'TBD';

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update the task via API only if we have a valid task ID
      if (task.id) {
        await tasksApi.update(task.id, {
          title: editForm.title,
          description: editForm.description,
          date: editForm.date,
          priority: editForm.priority,
          technician: editForm.technician,
        });
      }
      setEditing(false);
      // Resend updated task card
      if (onResend) onResend(editForm);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm({ ...task });
    setEditing(false);
  };

  return (
    <div className="w-full max-w-[320px] bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-orange-500 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench size={14} className="text-white" />
          <span className="text-white text-xs font-bold uppercase tracking-wider">Scheduled Task</span>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="p-1 text-white/80 hover:text-white">
            <Pencil size={12} />
          </button>
        )}
      </div>
      <div className="p-4 space-y-3">
        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-medium text-gray-500 mb-1 block">Task Title</label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full px-2 py-1.5 border rounded text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-gray-500 mb-1 block">Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={2}
                className="w-full px-2 py-1.5 border rounded text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-medium text-gray-500 mb-1 block">Date</label>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  className="w-full px-2 py-1.5 border rounded text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-gray-500 mb-1 block">Priority</label>
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                  className="w-full px-2 py-1.5 border rounded text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 bg-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors">
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                {saving ? 'Saving...' : 'Save & Resend'}
              </button>
              <button onClick={handleCancel} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                <X size={12} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-base font-bold text-gray-900">{task.title}</p>
            {task.description && <p className="text-sm text-gray-600 leading-relaxed">{task.description}</p>}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Clock size={12} className="text-orange-500" /> {dateStr}
              </div>
              {task.technician && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Wrench size={12} className="text-orange-500" /> {task.technician}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle size={12} className="text-orange-500" />
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${priorityColors[task.priority] || priorityColors.medium}`}>
                  {task.priority?.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="pt-3 border-t border-orange-200/60 flex gap-2">
              <button onClick={() => onReply && onReply(task)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-orange-700 bg-white border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors">
                <Reply size={13} /> Reply
              </button>
              <button onClick={() => setEditing(true)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-orange-700 bg-white border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors">
                <Pencil size={13} /> Edit
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const fmtRelative = (d) => {
  if (!d) return '';
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

export default function MessagesPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { admin } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [taskModal, setTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', due_date: '', priority: 'medium', assigned_to: '' });
  const [taskSaving, setTaskSaving] = useState(false);
  const [staff, setStaff] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const fetchConversations = async () => {
    try {
      const res = await messagesApi.getConversations();
      setConversations(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const fetchMessages = async (uid) => {
    if (!uid) return;
    setMsgLoading(true);
    try {
      const res = await messagesApi.getMessages(uid);
      setMessages(res.data.messages);
      setSelectedUser(res.data.user);
      // Auto mark-read: update sidebar unread count immediately
      setConversations(prev => prev.map(c =>
        c.user_id === uid ? { ...c, unread_count: 0 } : c
      ));
    } catch { toast.error('Failed to load messages'); }
    setMsgLoading(false);
  };

  useEffect(() => {
    fetchConversations();
    staffApi.getAll().then(r => setStaff(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (userId) {
      fetchMessages(userId);
      pollRef.current = setInterval(() => fetchMessages(userId), 8000);
      return () => clearInterval(pollRef.current);
    }
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !userId) return;
    setSending(true);
    try {
      const res = await messagesApi.send(userId, text.trim());
      setMessages([...messages, res.data]);
      setText('');
      setReplyTo(null);
    } catch (err) { toast.error(err.message); }
    setSending(false);
  };

  const handleReplyTask = (task) => {
    setReplyTo(task);
    setText(`Re: ${task.title}\n\n`);
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleResendTask = async (updatedTask) => {
    try {
      const techName = staff.find(s => s.id === updatedTask.assigned_to)?.full_name || updatedTask.technician;
      const taskCard = JSON.stringify({
        _type: 'task_card',
        title: updatedTask.title,
        description: updatedTask.description || '',
        date: updatedTask.date || '',
        priority: updatedTask.priority,
        technician: techName || '',
      });
      const msgRes = await messagesApi.send(userId, taskCard);
      setMessages([...messages, msgRes.data]);
      toast.success('Task updated & client notified');
    } catch (err) { toast.error(err.message); }
  };

  const selectConversation = (uid) => {
    navigate(`/messages/${uid}`);
  };

  const handleScheduleTask = async () => {
    if (!taskForm.title.trim()) { toast.error('Task title is required'); return; }
    setTaskSaving(true);
    try {
      const techName = staff.find(s => s.id === taskForm.assigned_to)?.full_name || null;
      await tasksApi.create({
        user_id: userId,
        title: taskForm.title,
        description: taskForm.description,
        priority: taskForm.priority,
        due_date: taskForm.due_date || null,
        assigned_to: taskForm.assigned_to || null,
        created_by: admin?.id,
      });
      // Send structured task card message
      const taskCard = JSON.stringify({
        _type: 'task_card',
        title: taskForm.title,
        description: taskForm.description || '',
        date: taskForm.due_date || '',
        priority: taskForm.priority,
        technician: techName || '',
      });
      // Note: task ID not included since tasksApi.create doesn't return it in the card flow
      const msgRes = await messagesApi.send(userId, taskCard);
      setMessages([...messages, msgRes.data]);
      setTaskModal(false);
      setTaskForm({ title: '', description: '', due_date: '', priority: 'medium', assigned_to: '' });
      toast.success('Task scheduled & client notified');
    } catch (err) { toast.error(err.message); }
    setTaskSaving(false);
  };

  const filtered = conversations.filter(c =>
    !search || (c.full_name || c.username || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-7rem)] -mx-6 -mt-2">
      {/* Sidebar: Conversations list */}
      <div className={`w-80 border-r bg-white flex flex-col shrink-0 ${userId ? 'hidden md:flex' : 'flex'} ${!userId ? 'flex-1 md:flex-none' : ''}`}>
        <div className="px-4 py-3 border-b">
          <h2 className="text-sm font-semibold text-gray-800 mb-2">Messages</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 size={18} className="animate-spin text-blue-500" />
            </div>
          ) : filtered.length > 0 ? (
            <div className="divide-y">
              {filtered.map((c) => (
                <button key={c.user_id} onClick={() => selectConversation(c.user_id)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${userId === c.user_id ? 'bg-blue-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                      {(c.full_name || c.username || 'U')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.full_name || c.username}</p>
                        <span className="text-[10px] text-gray-400 shrink-0 ml-2">{fmtRelative(c.last_message_at)}</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{c.last_message}</p>
                    </div>
                    {c.unread_count > 0 && (
                      <span className="w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                        {c.unread_count}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-12 text-center">
              <MessageSquare size={28} className="text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No conversations yet</p>
              <p className="text-[10px] text-gray-300 mt-0.5">Customer messages will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className={`flex-1 flex flex-col bg-gray-50 ${!userId ? 'hidden md:flex' : 'flex'}`}>
        {userId ? (
          <>
            {/* Chat header — with contact info + quick actions */}
            <div className="px-5 py-3 bg-white border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => navigate('/messages')} className="md:hidden p-1 text-gray-400 hover:text-gray-600">
                    <ArrowLeft size={18} />
                  </button>
                  {selectedUser && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                        {(selectedUser.full_name || selectedUser.username || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{selectedUser.full_name || selectedUser.username}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {selectedUser.email && (
                            <span className="flex items-center gap-1 text-[11px] text-gray-400">
                              <Mail size={10} /> {selectedUser.email}
                            </span>
                          )}
                          {selectedUser.phone && (
                            <span className="flex items-center gap-1 text-[11px] text-gray-400">
                              <Phone size={10} /> {selectedUser.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Quick Actions */}
                {selectedUser && (
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => { setTaskForm({ title: '', description: '', due_date: '', priority: 'medium' }); setTaskModal(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                      title="Schedule task for this client">
                      <CalendarPlus size={13} /> Schedule Task
                    </button>
                    <button onClick={() => navigate(`/customers/${userId}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                      title="View customer profile">
                      <ExternalLink size={13} /> View Profile
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {msgLoading && messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 size={20} className="animate-spin text-blue-500" />
                </div>
              ) : messages.length > 0 ? (
                <>
                  {messages.map((m) => {
                    const isAdmin = m.sender_type === 'admin';
                    const taskData = parseTaskCard(m.content);
                    return (
                      <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[70%]">
                          {!isAdmin && (
                            <p className="text-[10px] text-gray-400 mb-0.5 ml-1">
                              {selectedUser?.full_name || selectedUser?.username || 'Customer'}
                            </p>
                          )}
                          {isAdmin && m.admin_name && (
                            <p className="text-[10px] text-gray-400 mb-0.5 mr-1 text-right">{m.admin_name}</p>
                          )}
                          {taskData ? (
                            <TaskCardAdmin task={taskData} onReply={handleReplyTask} onResend={handleResendTask} />
                          ) : (
                          <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isAdmin
                              ? 'bg-blue-600 text-white rounded-br-md'
                              : 'bg-white border text-gray-800 rounded-bl-md shadow-sm'
                          }`}>
                            {m.ticket_id && m.content.startsWith('[Ticket]') ? (
                              <div>
                                <p className={`text-[10px] mb-1 font-medium ${isAdmin ? 'opacity-70' : 'text-blue-600'}`}>Support Ticket</p>
                                <p className="whitespace-pre-wrap">{m.content.replace('[Ticket] ', '')}</p>
                              </div>
                            ) : m.content ? (
                              <p className="whitespace-pre-wrap">{m.content}</p>
                            ) : null}
                            <ChatAttachment url={m.attachment_url} isAdmin={isAdmin} />
                          </div>
                          )}
                          <p className={`text-[10px] text-gray-400 mt-0.5 ${isAdmin ? 'text-right mr-1' : 'ml-1'}`}>
                            {fmtTime(m.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare size={28} className="text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400">Start a conversation</p>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="px-5 py-3 bg-white border-t">
              {replyTo && (
                <div className="flex items-center justify-between px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg mb-2">
                  <div className="flex items-center gap-2 text-xs text-orange-700">
                    <Reply size={12} />
                    <span className="font-medium">Replying to task: {replyTo.title}</span>
                  </div>
                  <button onClick={() => { setReplyTo(null); setText(''); }} className="p-1 text-orange-400 hover:text-orange-600">
                    <X size={14} />
                  </button>
                </div>
              )}
              <form onSubmit={handleSend} className="flex gap-2">
                <textarea value={text} onChange={(e) => setText(e.target.value)}
                  placeholder={replyTo ? `Reply to ${replyTo.title}...` : "Type a message..."}
                  rows={1}
                  className="flex-1 px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none h-10 max-h-32 overflow-hidden" style={{ appearance: 'none' }} />
                <button type="submit" disabled={sending || !text.trim()}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <MessageSquare size={40} className="text-gray-200 mb-4" />
            <h3 className="text-lg font-semibold text-gray-500">Customer Messages</h3>
            <p className="text-sm text-gray-400 mt-1 max-w-xs">
              Select a conversation from the list to view and reply to customer messages
            </p>
          </div>
        )}
      </div>

      {/* Schedule Task Modal */}
      {taskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Schedule Task for Client</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">The client will be notified via chat to confirm availability</p>
              </div>
              <button onClick={() => setTaskModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">Task Title *</label>
                <input type="text" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Router Installation, Site Visit..."
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">Description</label>
                <textarea value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Details about what needs to be done..."
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none h-20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">Scheduled Date</label>
                  <input type="date" value={taskForm.due_date} onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">Priority</label>
                  <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">Assign Technician</label>
                <select value={taskForm.assigned_to} onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white">
                  <option value="">— Unassigned —</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name} {s.role ? `(${s.role})` : ''}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-5 py-3 border-t flex justify-end gap-2">
              <button onClick={() => setTaskModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleScheduleTask} disabled={taskSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
                {taskSaving ? <Loader2 size={14} className="animate-spin" /> : <CalendarPlus size={14} />}
                Schedule & Notify Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
