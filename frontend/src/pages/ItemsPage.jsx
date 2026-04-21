import { useState, useEffect, useMemo } from 'react';
import {
  Package, Search, Loader2, Plus, RefreshCw, X, Edit2, Trash2, Check, Link,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { billableItemsApi } from '../services/api';

const TYPE_META = {
  service:   { label: 'Service',   color: 'bg-blue-50 text-blue-700' },
  product:   { label: 'Product',   color: 'bg-amber-50 text-amber-700' },
  once_off:  { label: 'Once-off',  color: 'bg-purple-50 text-purple-700' },
  recurring: { label: 'Recurring', color: 'bg-emerald-50 text-emerald-700' },
};

const fmtAmount = (v) => 'R' + parseFloat(v || 0).toFixed(2);

export default function ItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', type: 'service', taxable: false });
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await billableItemsApi.getAll();
      setItems(res.data || []);
    } catch (err) { if (!err.isSubscriptionError) toast.error('Failed to load items'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(it =>
      (it.name || '').toLowerCase().includes(q) ||
      (it.description || '').toLowerCase().includes(q) ||
      (it.type || '').toLowerCase().includes(q)
    );
  }, [items, search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', price: '', type: 'service', taxable: false });
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({ name: item.name, description: item.description || '', price: item.price, type: item.type, taxable: item.taxable });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Name is required');
    setSubmitting(true);
    try {
      if (editing) {
        await billableItemsApi.update(editing.id, form);
        toast.success('Item updated');
      } else {
        await billableItemsApi.create(form);
        toast.success('Item created');
      }
      setShowForm(false);
      fetchItems();
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    try {
      await billableItemsApi.delete(id);
      toast.success('Item deleted');
      fetchItems();
    } catch (err) { toast.error(err.message || 'Failed to delete'); }
  };

  const handleToggleActive = async (item) => {
    try {
      await billableItemsApi.update(item.id, { active: !item.active });
      toast.success(item.active ? 'Item deactivated' : 'Item activated');
      fetchItems();
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const handleSyncPlans = async () => {
    setSyncing(true);
    try {
      const res = await billableItemsApi.syncPlans();
      toast.success(`Synced ${res.data.synced} plans as billable items`);
      fetchItems();
    } catch (err) { toast.error(err.message || 'Failed to sync'); }
    finally { setSyncing(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Billable Items</h1>
          <p className="text-sm text-gray-500">Services and products used on invoices &amp; quotes</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSyncPlans} disabled={syncing} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50">
            <Link size={14} /> {syncing ? 'Syncing...' : 'Sync Plans'}
          </button>
          <button onClick={openCreate} className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-amber-500/90 rounded-lg hover:bg-amber-600 shadow-sm">
            <Plus size={14} /> New Item
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items..."
            className="w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm bg-white" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={14} /></button>}
        </div>
      </div>

      {/* Create/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900">{editing ? 'Edit Item' : 'New Item'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. 20Mbps Internet Plan" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">Description</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">Price (R)</label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                    <option value="service">Service</option>
                    <option value="product">Product</option>
                    <option value="once_off">Once-off</option>
                    <option value="recurring">Recurring</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.taxable} onChange={e => setForm({ ...form, taxable: e.target.checked })} className="rounded" />
                Taxable
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 text-sm font-medium text-white bg-amber-500/90 rounded-lg hover:bg-amber-600 disabled:opacity-50">
                  {submitting ? 'Saving...' : (editing ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-amber-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border rounded-xl">
          <Package size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No items yet</p>
          <p className="text-xs text-gray-300 mt-1">Create items or sync from your plans</p>
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] text-gray-500 uppercase tracking-wider border-b bg-gray-50/50">
                  <th className="pl-4 pr-2 py-3 font-medium">Name</th>
                  <th className="px-3 py-3 font-medium">Description</th>
                  <th className="px-3 py-3 font-medium">Type</th>
                  <th className="px-3 py-3 font-medium">Plan Link</th>
                  <th className="px-3 py-3 font-medium text-right">Price</th>
                  <th className="px-3 py-3 font-medium text-center">Active</th>
                  <th className="px-3 py-3 font-medium text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const tp = TYPE_META[item.type] || TYPE_META.service;
                  return (
                    <tr key={item.id} className={`border-b last:border-0 hover:bg-gray-50/50 ${!item.active ? 'opacity-50' : ''}`}>
                      <td className="pl-4 pr-2 py-3 font-medium text-gray-900">{item.name}</td>
                      <td className="px-3 py-3 text-gray-500 max-w-[200px] truncate">{item.description || '—'}</td>
                      <td className="px-3 py-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tp.color}`}>{tp.label}</span>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-400">
                        {item.plan_name ? <span className="flex items-center gap-1"><Link size={10} /> {item.plan_name}</span> : '—'}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-gray-900">{fmtAmount(item.price)}</td>
                      <td className="px-3 py-3 text-center">
                        <button onClick={() => handleToggleActive(item)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${item.active ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 text-transparent hover:border-gray-400'}`}>
                          <Check size={12} />
                        </button>
                      </td>
                      <td className="px-3 py-3 text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><Edit2 size={14} /></button>
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y">
            {filtered.map(item => {
              const tp = TYPE_META[item.type] || TYPE_META.service;
              return (
                <div key={item.id} className={`px-4 py-3 ${!item.active ? 'opacity-50' : ''}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${tp.color}`}>{tp.label}</span>
                        {item.plan_name && <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Link size={8} />{item.plan_name}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <p className="text-sm font-bold text-gray-900">{fmtAmount(item.price)}</p>
                      <button onClick={() => openEdit(item)} className="p-1 text-gray-400"><Edit2 size={14} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
