import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Send, Loader2, MessageSquare, Headphones, Paperclip, X, Image as ImageIcon, CalendarPlus, Wrench, Clock, AlertTriangle, Check, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { portalApi } from '../../services/api';

const fmtTime = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
const isImage = (url) => url && /\.(jpg|jpeg|png|gif|webp|heic|heif)/i.test(url);
const fixUrl = (url) => {
  if (!url) return url;
  if (url.startsWith('/uploads/')) return '/api' + url;
  return url;
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-red-100 text-red-700',
};

function parseTaskCard(content) {
  try {
    const obj = JSON.parse(content);
    if (obj._type === 'task_card') return obj;
  } catch { /* not JSON */ }
  return null;
}

function generateICS(task) {
  const date = task.date ? new Date(task.date) : new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dtStart = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T090000`;
  const dtEnd = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T100000`;
  const now = new Date();
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}T${pad(now.getHours())}${pad(now.getMinutes())}00`;
  const desc = (task.description || '').replace(/\n/g, '\\n');
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CONNIS//Task//EN',
    'BEGIN:VEVENT',
    `DTSTART:${dtStart}`, `DTEND:${dtEnd}`, `DTSTAMP:${stamp}Z`,
    `UID:${Date.now()}@connis`,
    `SUMMARY:${task.title}`,
    `DESCRIPTION:${desc}${task.technician ? '\\nTechnician: ' + task.technician : ''}`,
    'STATUS:CONFIRMED',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  return ics;
}

function downloadICS(task) {
  const ics = generateICS(task);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${task.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function TaskCardBubble({ task }) {
  const dateStr = task.date ? new Date(task.date).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : 'To be confirmed';
  return (
    <div className="w-full max-w-[260px] sm:max-w-[300px] bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-orange-500 px-4 py-2.5 flex items-center gap-2">
        <Wrench size={14} className="text-white" />
        <span className="text-white text-xs font-bold uppercase tracking-wider">Scheduled Task</span>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-sm font-bold text-gray-900">{task.title}</p>
        {task.description && <p className="text-xs text-gray-600 leading-relaxed">{task.description}</p>}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <Clock size={12} className="text-orange-500" />
            <span className="font-medium">{dateStr}</span>
          </div>
          {task.technician && (
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <Wrench size={12} className="text-orange-500" />
              <span>Technician: <span className="font-medium">{task.technician}</span></span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs">
            <AlertTriangle size={12} className="text-orange-500" />
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${priorityColors[task.priority] || priorityColors.medium}`}>
              {task.priority?.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="pt-2 border-t border-orange-200/60 space-y-2">
          <p className="text-[11px] text-orange-700 font-medium">Please confirm your availability by replying to this message.</p>
          {task.date && (
            <button onClick={() => downloadICS(task)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-orange-700 bg-white border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors">
              <CalendarPlus size={13} /> Add to My Calendar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ChatAttachment({ url, isMe }) {
  const src = fixUrl(url);
  if (!src) return null;
  if (isImage(src)) {
    return (
      <a href={src} target="_blank" rel="noopener noreferrer" className="block mt-1">
        <img src={src} alt="attachment" className={`max-w-[220px] max-h-[200px] rounded-lg border ${isMe ? 'border-blue-400/30' : 'border-gray-200'} object-cover`} />
      </a>
    );
  }
  return (
    <a href={src} target="_blank" rel="noopener noreferrer"
      className={`flex items-center gap-1.5 mt-1 text-xs underline ${isMe ? 'text-blue-100' : 'text-blue-600'}`}>
      <Paperclip size={12} /> View attachment
    </a>
  );
}

export default function PortalChat() {
  const { user } = useOutletContext();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null); // { file, dataUrl }
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const pollRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const res = await portalApi.getMessages();
      setMessages(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 10000);
    return () => clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('File too large (max 10MB)'); return; }
    const reader = new FileReader();
    reader.onload = () => setPreview({ file, dataUrl: reader.result });
    reader.readAsDataURL(file);
  };

  const clearPreview = () => {
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !preview) return;
    setSending(true);
    try {
      let attachmentUrl = null;
      if (preview) {
        setUploading(true);
        const uploadRes = await portalApi.uploadFile(preview.file);
        attachmentUrl = uploadRes.data.url;
        setUploading(false);
      }
      const res = await portalApi.sendMessage(text.trim() || (attachmentUrl ? '' : ''), null, attachmentUrl);
      setMessages([...messages, res.data]);
      setText('');
      clearPreview();
    } catch (err) { toast.error(err.message); setUploading(false); }
    setSending(false);
  };

  if (!user) return null;

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 10rem)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 pb-4">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <Headphones size={18} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Chat with Support</h1>
          <p className="text-xs text-gray-400">Messages are replied to during business hours</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white rounded-xl border p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={20} className="animate-spin text-blue-500" />
          </div>
        ) : messages.length > 0 ? (
          <>
            {messages.map((m) => {
              const isMe = m.sender_type === 'customer';
              const taskData = parseTaskCard(m.content);
              return (
                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] sm:max-w-[80%] ${isMe ? 'order-2' : ''}`}>
                    {!isMe && (
                      <p className="text-[10px] text-gray-400 mb-0.5 ml-1">{m.admin_name || 'Support'}</p>
                    )}
                    {taskData ? (
                      <TaskCardBubble task={taskData} />
                    ) : (
                      <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-800 rounded-bl-md'
                      }`}>
                        {m.ticket_id && m.content.startsWith('[Ticket]') ? (
                          <div>
                            <p className="text-[10px] opacity-70 mb-1 font-medium">Support Ticket</p>
                            <p className="whitespace-pre-wrap">{m.content.replace('[Ticket] ', '')}</p>
                          </div>
                        ) : m.content ? (
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        ) : null}
                        <ChatAttachment url={m.attachment_url} isMe={isMe} />
                      </div>
                    )}
                    <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'justify-end mr-1' : 'ml-1'}`}>
                      <span className="text-[10px] text-gray-400">{fmtTime(m.created_at)}</span>
                      {isMe && (
                        m.is_read
                          ? <CheckCheck size={14} className="text-blue-500" />
                          : m.is_delivered
                            ? <CheckCheck size={14} className="text-gray-400" />
                            : <Check size={14} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare size={32} className="text-gray-200 mb-3" />
            <p className="text-sm text-gray-500 font-medium">No messages yet</p>
            <p className="text-xs text-gray-400 mt-1">Send a message to start a conversation with support</p>
          </div>
        )}
      </div>

      {/* Preview */}
      {preview && (
        <div className="pt-2 flex items-center gap-2">
          <div className="relative inline-block">
            {isImage(preview.file.name) ? (
              <img src={preview.dataUrl} alt="preview" className="w-16 h-16 rounded-lg object-cover border" />
            ) : (
              <div className="w-16 h-16 rounded-lg border bg-gray-50 flex items-center justify-center">
                <Paperclip size={18} className="text-gray-400" />
              </div>
            )}
            <button onClick={clearPreview}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm">
              <X size={10} />
            </button>
          </div>
          <p className="text-xs text-gray-500 truncate max-w-[200px]">{preview.file.name}</p>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 pt-3">
        <input type="file" ref={fileRef} onChange={handleFileSelect} accept="image/*,.pdf" className="hidden" />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={18} />}
        </button>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
        />
        <button type="submit" disabled={sending || (!text.trim() && !preview)}
          className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
}
