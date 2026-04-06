import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wifi, Loader2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { portalApi } from '../../services/api';

export default function PortalLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true);
    try {
      const res = await portalApi.login(username.trim(), password);
      localStorage.setItem('connis_portal_token', res.data.token);
      localStorage.setItem('connis_portal_user', JSON.stringify(res.data.user));
      toast.success(`Welcome, ${res.data.user.full_name || res.data.user.username}!`);
      navigate('/portal');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0eef5] via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#2d2e50] text-amber-400 mb-4">
            <Wifi size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in with your PPPoE credentials</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border shadow-lg p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">PPPoE Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. john_pppoe"
              required
              autoFocus
              className="w-full px-3.5 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">PPPoE Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your PPPoE password"
                required
                className="w-full px-3.5 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 pr-10"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !username.trim() || !password}
            className="w-full py-2.5 bg-[#2d2e50] text-white rounded-lg text-sm font-semibold hover:bg-[#3d3e60] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Contact your ISP if you forgot your credentials
        </p>
      </div>
    </div>
  );
}
