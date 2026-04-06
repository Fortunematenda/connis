import { useState, useEffect } from 'react';
import { Plus, Loader2, Zap, Trash2, Edit2, LayoutGrid, List } from 'lucide-react';
import toast from 'react-hot-toast';
import { plansApi } from '../services/api';

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [editingPlan, setEditingPlan] = useState(null);
  const [form, setForm] = useState({
    name: '', download_speed: '', upload_speed: '', price: '', mikrotik_profile: '', radius_rate_limit: '', description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const result = await plansApi.getAll();
      setPlans(result.data);
    } catch (err) {
      toast.error('Failed to load plans: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete plan "${name}"?`)) return;
    try {
      await plansApi.remove(id);
      toast.success('Plan deleted');
      fetchPlans();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name || '',
      download_speed: plan.download_speed || '',
      upload_speed: plan.upload_speed || '',
      price: plan.price ? String(plan.price) : '',
      mikrotik_profile: plan.mikrotik_profile || '',
      radius_rate_limit: plan.radius_rate_limit || '',
      description: plan.description || '',
    });
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingPlan(null);
    setForm({ name: '', download_speed: '', upload_speed: '', price: '', mikrotik_profile: '', radius_rate_limit: '', description: '' });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPlan(null);
    setForm({ name: '', download_speed: '', upload_speed: '', price: '', mikrotik_profile: '', radius_rate_limit: '', description: '' });
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingPlan) {
        await plansApi.update(editingPlan.id, { ...form, price: parseFloat(form.price) });
        toast.success('Plan updated');
      } else {
        await plansApi.create({ ...form, price: parseFloat(form.price) });
        toast.success('Plan created');
      }
      handleCancel();
      fetchPlans();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Plans</h1>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
            >
              <List size={16} />
            </button>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Add Plan
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-5 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Plan Name</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Download Speed (e.g. 10M)</label>
            <input type="text" name="download_speed" value={form.download_speed} onChange={handleChange} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Upload Speed (e.g. 5M)</label>
            <input type="text" name="upload_speed" value={form.upload_speed} onChange={handleChange} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Price (monthly)</label>
            <input type="number" step="0.01" name="price" value={form.price} onChange={handleChange} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">MikroTik Profile (API mode)</label>
            <input type="text" name="mikrotik_profile" value={form.mikrotik_profile} onChange={handleChange}
              placeholder="Auto: uses plan name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">RADIUS Rate-Limit</label>
            <input type="text" name="radius_rate_limit" value={form.radius_rate_limit} onChange={handleChange}
              placeholder="Auto: upload/download"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
            <input type="text" name="description" value={form.description} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="md:col-span-3 flex gap-3 justify-end">
            <button type="button" onClick={handleCancel} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {submitting ? (editingPlan ? 'Updating...' : 'Creating...') : (editingPlan ? 'Update Plan' : 'Create Plan')}
            </button>
          </div>
        </form>
      )}

      {/* Plans grid */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={28} className="animate-spin text-blue-500" />
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
          No plans yet. Create your first internet plan.
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Zap size={20} />
                </div>
                <h3 className="font-semibold text-gray-900">{plan.name}</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Download</span>
                  <span className="font-medium text-gray-900">{plan.download_speed}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Upload</span>
                  <span className="font-medium text-gray-900">{plan.upload_speed}</span>
                </div>
                <div className="pt-2 border-t flex justify-between">
                  <span className="text-gray-600">Price</span>
                  <span className="text-lg font-bold text-blue-600">
                    R{parseFloat(plan.price).toFixed(2)}
                    <span className="text-xs text-gray-400 font-normal">/mo</span>
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t mt-2 space-y-1">
                {plan.mikrotik_profile && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>API Profile</span>
                    <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{plan.mikrotik_profile}</span>
                  </div>
                )}
                {plan.radius_rate_limit && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>RADIUS Rate-Limit</span>
                    <span className="font-mono bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">{plan.radius_rate_limit}</span>
                  </div>
                )}
              </div>
              {plan.description && (
                <p className="mt-2 text-xs text-gray-400">{plan.description}</p>
              )}
              <div className="pt-2 border-t mt-2 flex justify-end gap-1">
                <button
                  onClick={() => handleEdit(plan)}
                  className="text-gray-400 hover:text-blue-600 p-1 rounded transition"
                  title="Edit plan"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  onClick={() => handleDelete(plan.id, plan.name)}
                  className="text-red-400 hover:text-red-600 p-1 rounded transition"
                  title="Delete plan"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b bg-gray-50/50">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Speed (Down/Up)</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">MikroTik Profile</th>
                <th className="px-4 py-3 font-medium">RADIUS Rate-Limit</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-blue-50 text-blue-600">
                        <Zap size={14} />
                      </div>
                      <span className="font-medium text-gray-900">{plan.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{plan.download_speed} / {plan.upload_speed}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-blue-600">R{parseFloat(plan.price).toFixed(2)}</span>
                    <span className="text-xs text-gray-400">/mo</span>
                  </td>
                  <td className="px-4 py-3">
                    {plan.mikrotik_profile ? (
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{plan.mikrotik_profile}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {plan.radius_rate_limit ? (
                      <span className="font-mono text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">{plan.radius_rate_limit}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(plan)}
                        className="text-gray-400 hover:text-blue-600 p-1.5 rounded transition"
                        title="Edit plan"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(plan.id, plan.name)}
                        className="text-red-400 hover:text-red-600 p-1.5 rounded transition"
                        title="Delete plan"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
