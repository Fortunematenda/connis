import { useState } from 'react';
import { Lock } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';

/**
 * Wraps an action element (button, link, etc.) and disables it when subscription is expired.
 * Shows a tooltip on hover explaining why the action is disabled.
 *
 * Usage:
 *   <SubscriptionGate>
 *     <button onClick={...}>Add Lead</button>
 *   </SubscriptionGate>
 */
export default function SubscriptionGate({ children, className = '' }) {
  const { isExpired, openUpgradeModal } = useSubscription();
  const [showTooltip, setShowTooltip] = useState(false);

  if (!isExpired) return children;

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Overlay that blocks clicks and dims the child */}
      <div
        className="relative cursor-not-allowed"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          openUpgradeModal();
        }}
      >
        <div className="pointer-events-none opacity-50 select-none">
          {children}
        </div>

        {/* Lock icon badge */}
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
          <Lock size={10} className="text-white" />
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="bg-gray-900 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
            Upgrade subscription to use this feature
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
              <div className="w-2 h-2 bg-gray-900 rotate-45 transform" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
