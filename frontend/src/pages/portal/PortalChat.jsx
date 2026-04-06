import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Send, Loader2, MessageSquare, Headphones } from 'lucide-react';
import toast from 'react-hot-toast';
import { portalApi } from '../../services/api';

const fmtTime = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

export default function PortalChat() {
  const { user } = useOutletContext();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
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

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await portalApi.sendMessage(text.trim());
      setMessages([...messages, res.data]);
      setText('');
    } catch (err) { toast.error(err.message); }
    setSending(false);
  };

  if (!user) return null;

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 7rem)' }}>
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
              return (
                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${isMe ? 'order-2' : ''}`}>
                    {!isMe && (
                      <p className="text-[10px] text-gray-400 mb-0.5 ml-1">{m.admin_name || 'Support'}</p>
                    )}
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
                      ) : (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      )}
                    </div>
                    <p className={`text-[10px] text-gray-400 mt-0.5 ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
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
            <MessageSquare size={32} className="text-gray-200 mb-3" />
            <p className="text-sm text-gray-500 font-medium">No messages yet</p>
            <p className="text-xs text-gray-400 mt-1">Send a message to start a conversation with support</p>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 pt-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
        />
        <button type="submit" disabled={sending || !text.trim()}
          className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
}
