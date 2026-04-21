import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';

export default function SubscriptionBanner() {
  const { isExpired, isTrial, openUpgradeModal, expiresAt } = useSubscription();

  if (!isExpired && !isTrial) return null;

  const isExpiredState = isExpired;

  return (
    <div
      className={`sticky top-0 z-30 px-4 py-2.5 flex items-center justify-between gap-3 text-sm transition-all duration-300 ${
        isExpiredState
          ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
          : 'bg-gradient-to-r from-amber-400 to-orange-400 text-amber-950'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <AlertTriangle size={16} className="flex-shrink-0" />
        <p className="truncate font-medium">
          {isExpiredState
            ? 'Your subscription has expired — some features are disabled.'
            : `Free trial expires ${expiresAt ? new Date(expiresAt).toLocaleDateString() : 'soon'}. Upgrade to keep your service running.`}
        </p>
      </div>
      <button
        onClick={openUpgradeModal}
        className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-95 ${
          isExpiredState
            ? 'bg-white text-red-600 hover:bg-red-50 shadow-sm'
            : 'bg-amber-950 text-amber-100 hover:bg-amber-900 shadow-sm'
        }`}
      >
        Upgrade
        <ArrowRight size={14} />
      </button>
    </div>
  );
}
