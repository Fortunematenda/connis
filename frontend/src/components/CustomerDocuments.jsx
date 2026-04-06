import { useState, useEffect, useCallback } from 'react';
import { FileText, Plus, X, Download, Trash2, Loader2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { documentsApi } from '../services/api';

const fmtDate = (d) => d ? new Date(d).toLocaleString('en-GB', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
}) : '—';

function fmtSize(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i > 1 ? 2 : 0) + ' ' + units[i];
}

export default function CustomerDocuments({ customerId }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchDocs = useCallback(async () => {
    try {
      const res = await documentsApi.getAll({ user_id: customerId });
      setDocs(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, [customerId]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', customerId);
      await documentsApi.upload(formData);
      toast.success('Document uploaded');
      fetchDocs();
    } catch (err) { toast.error(err.message || 'Upload failed'); }
    setUploading(false);
    e.target.value = '';
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await documentsApi.remove(id);
      toast.success('Document deleted');
      fetchDocs();
    } catch (err) { toast.error(err.message); }
  };

  const handleDownload = async (id, name) => {
    try {
      const token = localStorage.getItem('connis_token');
      const res = await fetch(`/api/documents/${id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) { toast.error(err.message || 'Download failed'); }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">{docs.length} document{docs.length !== 1 ? 's' : ''}</p>
        <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer">
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          Upload
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {/* Table */}
      {docs.length === 0 ? (
        <div className="bg-white rounded-xl border shadow-sm flex flex-col items-center justify-center py-16 text-center">
          <FileText size={28} className="text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">No documents yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider bg-gray-50/50 border-b">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium">Uploaded by</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id} className="border-b last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="font-medium text-gray-800 truncate max-w-xs">{d.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{fmtSize(d.file_size)}</td>
                  <td className="px-4 py-3 text-gray-500">{d.uploaded_by_name || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(d.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleDownload(d.id, d.name)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Download">
                        <Download size={14} />
                      </button>
                      <button onClick={() => handleDelete(d.id, d.name)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete">
                        <Trash2 size={14} />
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
