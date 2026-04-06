import { useState, useEffect, useRef } from 'react';
import {
  X, Send, UserPlus, MessageSquare, Phone, Mail, MapPin,
  Loader2, CheckCircle2, Wifi, KeyRound, User, FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { leadsApi, plansApi } from '../services/api';

export default function LeadDetailModal({ lead, isOpen, onClose, onLeadUpdated }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Convert state
  const [showConvert, setShowConvert] = useState(false);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertForm, setConvertForm] = useState({
    full_name: '', phone: '', email: '', address: '',
    username: '', password: '',
    plan_id: '',
  });

  const commentsEndRef = useRef(null);

  // Fetch comments when modal opens
  useEffect(() => {
    if (isOpen && lead) {
      fetchComments();
      setShowConvert(false);
      resetConvertForm();
    }
  }, [isOpen, lead?.id]);

  // Pre-fill convert form from lead data when opening convert panel
  const resetConvertForm = () => {
    if (!lead) return;
    setConvertForm({
      full_name: lead.full_name || '',
      phone: lead.phone || '',
      email: lead.email || '',
      address: lead.address || '',
      username: '',
      password: '',
      plan_id: '',
    });
  };

  // Scroll to bottom when new comment arrives
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const fetchComments = async () => {
    if (!lead) return;
    setLoadingComments(true);
    try {
      const result = await leadsApi.getComments(lead.id);
      setComments(result.data);
    } catch (err) {
      toast.error('Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  };

  // Fetch plans when admin opens the convert panel
  const openConvertPanel = async () => {
    setShowConvert(true);
    resetConvertForm();
    setLoadingPlans(true);
    try {
      const result = await plansApi.getAll();
      setPlans(result.data);
      if (result.data.length === 0) {
        toast.error('No active plans found. Create a plan first.');
      }
    } catch (err) {
      toast.error('Failed to load plans');
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const result = await leadsApi.addComment(lead.id, newComment.trim());
      setComments((prev) => [...prev, result.data]);
      setNewComment('');
    } catch (err) {
      toast.error('Failed to add comment: ' + err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleConvert = async (e) => {
    e.preventDefault();

    // Validate all required fields before submitting
    if (!convertForm.username.trim()) return toast.error('PPPoE username is required');
    if (!convertForm.password || convertForm.password.length < 6) return toast.error('PPPoE password must be at least 6 characters');
    if (!convertForm.plan_id) return toast.error('You must select a service plan');
    if (!convertForm.full_name.trim()) return toast.error('Customer name is required');

    setConverting(true);
    try {
      await leadsApi.convert(lead.id, convertForm);
      toast.success(`Lead converted to customer: ${convertForm.username}`);
      setShowConvert(false);
      onLeadUpdated();
      onClose();
    } catch (err) {
      toast.error('Conversion failed: ' + err.message);
    } finally {
      setConverting(false);
    }
  };

  const updateField = (field) => (e) => {
    setConvertForm((f) => ({ ...f, [field]: e.target.value }));
  };

  if (!isOpen || !lead) return null;

  const isConverted = lead.status === 'converted';
  const selectedPlan = plans.find((p) => p.id === convertForm.plan_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{lead.full_name}</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 capitalize">
              {lead.status.replace('_', ' ')}
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto min-h-0">

          {/* Lead info */}
          <div className="px-6 py-3 border-b border-gray-50 space-y-1.5">
            {lead.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone size={14} className="text-gray-400" /> {lead.phone}
              </div>
            )}
            {lead.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail size={14} className="text-gray-400" /> {lead.email}
              </div>
            )}
            {lead.address && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin size={14} className="text-gray-400" /> {lead.address}
              </div>
            )}
          </div>

          {/* Comments section */}
          <div className="px-6 py-3 border-b border-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={16} className="text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-700">
                Comments ({comments.length})
              </h3>
            </div>

            {loadingComments ? (
              <div className="flex justify-center py-4">
                <Loader2 size={20} className="animate-spin text-blue-500" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3 italic">No comments yet</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {comments.map((c) => (
                  <div key={c.id} className={`rounded-lg p-3 text-sm ${
                    c.author === 'System'
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-gray-50 border border-gray-100'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-semibold ${
                        c.author === 'System' ? 'text-green-700' : 'text-blue-700'
                      }`}>
                        {c.author}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(c.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">{c.content}</p>
                  </div>
                ))}
                <div ref={commentsEndRef} />
              </div>
            )}

            {/* Add comment */}
            <form onSubmit={handleAddComment} className="mt-3 flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submittingComment ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </div>

          {/* ── Convert to Customer section ── */}
          <div className="px-6 py-4">
            {isConverted ? (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-4 py-3 rounded-lg border border-green-200">
                <CheckCircle2 size={16} />
                This lead has been converted to a customer
              </div>
            ) : !showConvert ? (
              <button
                onClick={openConvertPanel}
                className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                <UserPlus size={16} />
                Convert to Customer
              </button>
            ) : (
              <form onSubmit={handleConvert} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                    Convert to Customer
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowConvert(false)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Cancel
                  </button>
                </div>

                {/* Section 1: Customer Details (editable) */}
                <div className="rounded-lg border border-gray-200 p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <User size={14} className="text-blue-500" />
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Customer Details</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={convertForm.full_name}
                        onChange={updateField('full_name')}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                      <input
                        type="text"
                        value={convertForm.phone}
                        onChange={updateField('phone')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                      <input
                        type="email"
                        value={convertForm.email}
                        onChange={updateField('email')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
                      <input
                        type="text"
                        value={convertForm.address}
                        onChange={updateField('address')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: PPPoE Credentials */}
                <div className="rounded-lg border border-orange-200 bg-orange-50/30 p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <KeyRound size={14} className="text-orange-500" />
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">PPPoE Credentials</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        PPPoE Username <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={convertForm.username}
                        onChange={updateField('username')}
                        placeholder="e.g. john_pppoe"
                        required
                        className="w-full px-3 py-2 border border-orange-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        PPPoE Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={convertForm.password}
                        onChange={updateField('password')}
                        placeholder="min 6 characters"
                        required
                        minLength={6}
                        className="w-full px-3 py-2 border border-orange-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Service Plan Selection */}
                <div className="rounded-lg border border-purple-200 bg-purple-50/30 p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Wifi size={14} className="text-purple-500" />
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Service Plan</span>
                  </div>

                  {loadingPlans ? (
                    <div className="flex items-center gap-2 py-2 text-sm text-gray-500">
                      <Loader2 size={14} className="animate-spin" /> Loading plans...
                    </div>
                  ) : plans.length === 0 ? (
                    <p className="text-sm text-red-500">No active plans available. Please create a plan first.</p>
                  ) : (
                    <>
                      <select
                        value={convertForm.plan_id}
                        onChange={updateField('plan_id')}
                        required
                        className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 outline-none bg-white"
                      >
                        <option value="">— Select a plan —</option>
                        {plans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — {p.download_speed}/{p.upload_speed} — R{parseFloat(p.price).toFixed(2)}/mo
                          </option>
                        ))}
                      </select>

                      {/* Plan preview */}
                      {selectedPlan && (
                        <div className="flex items-center gap-4 p-2 rounded bg-white border border-purple-100 text-xs text-gray-600">
                          <FileText size={12} className="text-purple-400" />
                          <span><b>Download:</b> {selectedPlan.download_speed}</span>
                          <span><b>Upload:</b> {selectedPlan.upload_speed}</span>
                          <span><b>Price:</b> R{parseFloat(selectedPlan.price).toFixed(2)}/mo</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Submit */}
                <div className="flex gap-3 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setShowConvert(false)}
                    className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={converting || !convertForm.username || !convertForm.password || !convertForm.plan_id || !convertForm.full_name}
                    className="px-5 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {converting ? (
                      <><Loader2 size={14} className="animate-spin" /> Converting...</>
                    ) : (
                      <><UserPlus size={14} /> Convert to Customer</>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
