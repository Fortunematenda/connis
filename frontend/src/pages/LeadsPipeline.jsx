import { useState, useEffect, useCallback } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Plus, RefreshCw, Loader2 } from 'lucide-react';
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">
            Drag leads between stages to update their status
          </p>
        </div>
        <div className="flex items-center gap-3">
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
      ) : (
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
