import { useDroppable } from '@dnd-kit/core';
import LeadCard from './LeadCard';

// Color mapping for each pipeline stage
const STAGE_COLORS = {
  new: 'border-blue-500 bg-blue-50',
  contacted: 'border-amber-500 bg-amber-50',
  site_survey: 'border-purple-500 bg-purple-50',
  quoted: 'border-cyan-500 bg-cyan-50',
  install_pending: 'border-green-500 bg-green-50',
  converted: 'border-emerald-500 bg-emerald-50',
  lost: 'border-red-500 bg-red-50',
};

const BADGE_COLORS = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-amber-100 text-amber-700',
  site_survey: 'bg-purple-100 text-purple-700',
  quoted: 'bg-cyan-100 text-cyan-700',
  install_pending: 'bg-green-100 text-green-700',
  converted: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-red-100 text-red-700',
};

export default function KanbanColumn({ stageKey, title, leads, onLeadClick }) {
  const { setNodeRef, isOver } = useDroppable({ id: stageKey });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-72 min-w-[18rem] rounded-xl border-t-4 bg-white shadow-sm transition-shadow ${
        STAGE_COLORS[stageKey] || 'border-gray-400 bg-gray-50'
      } ${isOver ? 'ring-2 ring-blue-400 shadow-md' : ''}`}
    >
      {/* Column header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            BADGE_COLORS[stageKey] || 'bg-gray-200 text-gray-600'
          }`}
        >
          {leads.length}
        </span>
      </div>

      {/* Cards area */}
      <div className="flex-1 px-3 pb-3 space-y-2 overflow-y-auto kanban-column max-h-[calc(100vh-14rem)]">
        {leads.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400 italic">
            No leads
          </div>
        ) : (
          leads.map((lead) => <LeadCard key={lead.id} lead={lead} onClick={onLeadClick} />)
        )}
      </div>
    </div>
  );
}
