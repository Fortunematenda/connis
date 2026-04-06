import { useState, useEffect, useCallback } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Plus, RefreshCw, Loader2, LayoutGrid, List } from 'lucide-react';
import toast from 'react-hot-toast';
import KanbanColumn from '../components/KanbanColumn';
import LeadCard from '../components/LeadCard';
import AddLeadModal from '../components/AddLeadModal';
import LeadDetailModal from '../components/LeadDetailModal';
import { leadsApi } from '../services/api';

// Pipeline stage definitions — order matters for display
const STAGES = [
  { key: 'new', label: 'New Lead' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'site_survey', label: 'Site Survey' },
  { key: 'quoted', label: 'Quoted' },
  { key: 'install_pending', label: 'Install Pending' },
  { key: 'converted', label: 'Converted' },
  { key: 'lost', label: 'Lost' },
];

export default function LeadsPipeline() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'

  // Configure drag sensor — require 5px movement before drag starts (prevents accidental drags)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Fetch all leads from the backend
  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const result = await leadsApi.getAll();
      setLeads(result.data);
    } catch (err) {
      toast.error('Failed to load leads: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Group leads by their pipeline stage
  const groupedLeads = STAGES.reduce((acc, stage) => {
    acc[stage.key] = leads.filter((lead) => lead.status === stage.key);
    return acc;
  }, {});

  // Handle adding a new lead
  const handleAddLead = async (formData) => {
    try {
      const result = await leadsApi.create(formData);
      setLeads((prev) => [result.data, ...prev]);
      toast.success('Lead added successfully');
    } catch (err) {
      toast.error('Failed to add lead: ' + err.message);
      throw err;
    }
  };

  // ── Drag & Drop handlers ─────────────────────────────────

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const leadId = active.id;
    const newStatus = over.id; // The droppable ID is the stage key

    // Find the lead being dragged
    const draggedLead = leads.find((l) => l.id === leadId);
    if (!draggedLead || draggedLead.status === newStatus) return;

    // Optimistic UI update — move the lead immediately
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );

    // Persist to backend
    try {
      await leadsApi.updateStatus(leadId, newStatus);
      toast.success(`Moved to ${STAGES.find((s) => s.key === newStatus)?.label}`);
    } catch (err) {
      // Revert on failure
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId ? { ...l, status: draggedLead.status } : l
        )
      );
      toast.error('Failed to update lead: ' + err.message);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  // Find the active lead for the drag overlay
  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">
            Drag leads between stages to update their status
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
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
            onClick={fetchLeads}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Add Lead
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && leads.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={32} className="animate-spin text-blue-500" />
          <span className="ml-3 text-gray-500">Loading pipeline...</span>
        </div>
      ) : viewMode === 'kanban' ? (
        /* Kanban board */
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STAGES.map((stage) => (
              <KanbanColumn
                key={stage.key}
                stageKey={stage.key}
                title={stage.label}
                leads={groupedLeads[stage.key]}
                onLeadClick={(lead) => setSelectedLead(lead)}
              />
            ))}
          </div>

          {/* Drag overlay — renders the card "floating" while being dragged */}
          <DragOverlay>
            {activeLead ? (
              <div className="drag-overlay">
                <LeadCard lead={activeLead} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        /* List view */
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b bg-gray-50/50">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Address</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created By</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className="border-b last:border-0 hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{lead.name}</div>
                    <div className="text-xs text-gray-400">{lead.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{lead.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{lead.address || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      lead.status === 'converted' ? 'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200/60' :
                      lead.status === 'lost' ? 'text-gray-600 bg-gray-100' :
                      'text-blue-700 bg-blue-50 ring-1 ring-blue-200/60'
                    }`}>
                      {STAGES.find(s => s.key === lead.status)?.label || lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{lead.created_by_name || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(lead.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No leads found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Lead modal */}
      <AddLeadModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddLead}
      />

      {/* Lead detail modal — comments + convert */}
      <LeadDetailModal
        lead={selectedLead}
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        onLeadUpdated={fetchLeads}
      />
    </div>
  );
}
