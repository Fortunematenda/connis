import { useDraggable } from '@dnd-kit/core';
import { Phone, Mail, MapPin, GripVertical, CheckCircle2 } from 'lucide-react';

export default function LeadCard({ lead, onClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { lead },
  });

  const style = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        zIndex: 50,
      }
    : undefined;

  const isConverted = lead.status === 'converted';

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onClick?.(lead)}
      className={`bg-white rounded-lg border p-3 shadow-sm hover:shadow-md transition-shadow group cursor-pointer ${
        isDragging ? 'opacity-50 shadow-lg ring-2 ring-blue-400' : ''
      } ${isConverted ? 'border-green-300 bg-green-50/50' : 'border-gray-200'}`}
    >
      {/* Drag handle + name */}
      <div className="flex items-start gap-2">
        <button
          {...listeners}
          {...attributes}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-gray-900 truncate">
            {lead.full_name}
          </h4>
        </div>
        {isConverted && <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />}
      </div>

      {/* Contact details */}
      <div className="mt-2 ml-6 space-y-1">
        {lead.phone && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Phone size={12} />
            <span className="truncate">{lead.phone}</span>
          </div>
        )}
        {lead.email && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Mail size={12} />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
        {lead.address && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin size={12} />
            <span className="truncate">{lead.address}</span>
          </div>
        )}
      </div>

      {/* Created date */}
      <div className="mt-2 ml-6 text-[10px] text-gray-400">
        {new Date(lead.created_at).toLocaleDateString()}
      </div>
    </div>
  );
}
