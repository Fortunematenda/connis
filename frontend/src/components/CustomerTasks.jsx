import { useState, useEffect, useCallback } from 'react';
import { CheckSquare, Plus, X, Loader2, Calendar, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { tasksApi, staffApi } from '../services/api';

const STATUS_META = {
  todo: { label: 'To Do', color: 'text-blue-700 bg-blue-50' },
  in_progress: { label: 'In Progress', color: 'text-amber-700 bg-amber-50' },
  done: { label: 'Done', color: 'text-emerald-700 bg-emerald-50' },
};

const PRIORITY_META = {
  low: { label: 'Low', color: 'text-gray-600 bg-gray-100' },
  medium: { label: 'Medium', color: 'text-amber-700 bg-amber-100' },
  high: { label: 'High', color: 'text-red-700 bg-red-100' },
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
const isOverdue = (d, status) => d && status !== 'done' && new Date(d) < new Date();

export default function CustomerTasks({ customerId }) {
  const [tasks, setTasks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '' });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, sRes] = await Promise.all([
        tasksApi.getAll({ user_id: customerId }),
        staffApi.getAll(),
      ]);
      setTasks(tRes.data);
      setStaff(sRes.data || []);
    } catch { toast.error('Failed to load tasks'); }
    setLoading(false);
  }, [customerId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleCreate = async () => {
    if (!form.title.trim()) return toast.error('Title is required');
    try {
      await tasksApi.create({ ...form, user_id: customerId });
      toast.success('Task created');
      setShowCreate(false);
      setForm({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '' });
      fetchTasks();
    } catch (e) { toast.error(e.message); }
  };

  const handleStatusChange = async (id, status) => {
    try { await tasksApi.update(id, { status }); fetchTasks(); }
    catch (e) { toast.error(e.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    try { await tasksApi.remove(id); toast.success('Deleted'); fetchTasks(); }
    catch (e) { toast.error(e.message); }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">{tasks.length} Task{tasks.length !== 1 ? 's' : ''}</h3>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
          {showCreate ? <X size={12} /> : <Plus size={12} />} {showCreate ? 'Cancel' : 'Add Task'}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl border p-4 space-y-3">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Task title" className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description (optional)" rows={2}
            className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none" />
          <div className="flex items-center gap-3">
            <select value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm bg-white flex-1">
              <option value="">Unassigned</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm bg-white">
              {Object.entries(PRIORITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm bg-white" />
            <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Create</button>
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CheckSquare size={28} className="text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">No tasks for this customer</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] text-gray-500 uppercase tracking-wider border-b bg-gray-50/50">
                <th className="px-4 py-2.5 font-medium">Task</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Priority</th>
                <th className="px-4 py-2.5 font-medium">Assigned</th>
                <th className="px-4 py-2.5 font-medium">Due</th>
                <th className="px-4 py-2.5 font-medium">Created By</th>
                <th className="px-4 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id} className={`border-b last:border-0 hover:bg-gray-50/50 transition-colors ${isOverdue(t.due_date, t.status) ? 'bg-red-50/30' : ''}`}>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-gray-900">{t.title}</p>
                    {t.description && <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[200px]">{t.description}</p>}
                  </td>
                  <td className="px-4 py-2.5">
                    <select value={t.status} onChange={(e) => handleStatusChange(t.id, e.target.value)}
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full cursor-pointer border-0 ${STATUS_META[t.status]?.color || 'bg-gray-100'}`}>
                      {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${PRIORITY_META[t.priority]?.color || ''}`}>
                      {PRIORITY_META[t.priority]?.label || t.priority}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-600">{t.assigned_name || '—'}</td>
                  <td className="px-4 py-2.5 text-xs">
                    {t.due_date ? (
                      <span className={`flex items-center gap-1 ${isOverdue(t.due_date, t.status) ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                        <Calendar size={12} /> {fmtDate(t.due_date)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-600">{t.created_by_name || '—'}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => handleDelete(t.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                      <Trash2 size={13} />
                    </button>
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
