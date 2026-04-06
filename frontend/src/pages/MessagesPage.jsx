import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MessageSquare, Send, Loader2, Search, ArrowLeft, User, Clock, Paperclip,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { messagesApi } from '../services/api';

const fmtTime = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
const isImage = (url) => url && /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(url);

function ChatAttachment({ url, isAdmin }) {
  if (!url) return null;
  if (isImage(url)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-1">
        <img src={url} alt="attachment" className={`max-w-[220px] max-h-[200px] rounded-lg border ${isAdmin ? 'border-blue-400/30' : 'border-gray-200'} object-cover`} />
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className={`flex items-center gap-1.5 mt-1 text-xs underline ${isAdmin ? 'text-blue-100' : 'text-blue-600'}`}>
      <Paperclip size={12} /> View attachment
    </a>
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
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
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
    } catch { toast.error('Failed to load messages'); }
    setMsgLoading(false);
  };

  useEffect(() => {
    fetchConversations();
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
    } catch (err) { toast.error(err.message); }
    setSending(false);
  };

  const selectConversation = (uid) => {
    navigate(`/messages/${uid}`);
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
            {/* Chat header */}
            <div className="px-5 py-3 bg-white border-b flex items-center gap-3">
              <button onClick={() => navigate('/messages')} className="md:hidden p-1 text-gray-400 hover:text-gray-600">
                <ArrowLeft size={18} />
              </button>
              {selectedUser && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                    {(selectedUser.full_name || selectedUser.username || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{selectedUser.full_name || selectedUser.username}</p>
                    <p className="text-[11px] text-gray-400">{selectedUser.username} {selectedUser.email ? `· ${selectedUser.email}` : ''}</p>
                  </div>
                </div>
              )}
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
              <form onSubmit={handleSend} className="flex gap-2">
                <input type="text" value={text} onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
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
    </div>
  );
}
