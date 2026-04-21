import { useState, useEffect } from 'react';
import { Plus, Loader2, UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi } from '../services/api';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    username: '', password: '', full_name: '', email: '', phone: '', address: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const result = await usersApi.getAll();
      setUsers(result.data);
    } catch (err) {
      if (!err.isSubscriptionError) toast.error('Failed to load users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await usersApi.create(form);
      toast.success('User created');
      setForm({ username: '', password: '', full_name: '', email: '', phone: '', address: '' });
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-500/90 rounded-lg hover:bg-amber-600 transition-colors"
        >
          <Plus size={16} />
          Add User
        </button>
      </div>

      {/* Inline create form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-5 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {['username', 'password', 'full_name', 'email', 'phone', 'address'].map((field) => (
            <div key={field}>
              <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">
                {field.replace('_', ' ')}
              </label>
              <input
                type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                name={field}
                value={form[field]}
                onChange={handleChange}
                required={field === 'username' || field === 'password'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          ))}
          <div className="md:col-span-3 flex gap-3 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-amber-500/90 rounded-lg hover:bg-amber-600 disabled:opacity-50">
              {submitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      )}

      {/* Users table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={28} className="animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Username</th>
                <th className="px-4 py-3 font-medium">Full Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Balance</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No users yet</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{user.username}</td>
                    <td className="px-4 py-3">{user.full_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{user.email || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{user.phone || '—'}</td>
                    <td className="px-4 py-3 font-medium">{parseFloat(user.balance).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {user.active ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                          <UserCheck size={12} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                          <UserX size={12} /> Inactive
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
