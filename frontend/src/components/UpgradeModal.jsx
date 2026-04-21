import { useState, useEffect } from 'react';
import { X, Check, Zap, Star, Crown, ArrowRight, Shield, Sparkles } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';

const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    price: 29,
    period: 'mo',
    icon: Zap,
    gradient: 'from-sky-500 to-blue-600',
    lightBg: 'bg-sky-50',
    lightBorder: 'border-sky-200',
    lightText: 'text-sky-700',
    recommended: false,
    description: 'Perfect for small ISPs getting started',
    features: [
      'Up to 100 customers',
      '1 MikroTik router',
      'Basic billing & invoicing',
      'Customer self-service portal',
      'Email support',
    ],
  },
  {
    key: 'professional',
    name: 'Professional',
    price: 79,
    period: 'mo',
    icon: Star,
    gradient: 'from-violet-500 to-purple-600',
    lightBg: 'bg-violet-50',
    lightBorder: 'border-violet-200',
    lightText: 'text-violet-700',
    recommended: true,
    description: 'For growing ISPs that need more power',
    features: [
      'Up to 500 customers',
      '5 MikroTik routers',
      'Advanced billing & invoicing',
      'Customer portal + live chat',
      'Bandwidth monitoring',
      'Priority support',
      'Leads pipeline & CRM',
    ],
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: 149,
    period: 'mo',
    icon: Crown,
    gradient: 'from-amber-500 to-orange-600',
    lightBg: 'bg-amber-50',
    lightBorder: 'border-amber-200',
    lightText: 'text-amber-700',
    recommended: false,
    description: 'Unlimited scale for established providers',
    features: [
      'Unlimited customers',
      'Unlimited routers',
      'Full billing suite',
      'Customer portal + live chat',
      'Advanced bandwidth analytics',
      'Dedicated account manager',
      'Multi-staff accounts',
      'Custom integrations & API',
    ],
  },
];

export default function UpgradeModal() {
  const { upgradeModalOpen, closeUpgradeModal, subscriptionPlan } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (upgradeModalOpen) {
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimateIn(true)));
    } else {
      setAnimateIn(false);
    }
  }, [upgradeModalOpen]);

  if (!upgradeModalOpen) return null;

  const selected = PLANS.find(p => p.key === selectedPlan);

  const handleUpgrade = () => {
    const subject = encodeURIComponent(`Upgrade to ${selected.name} plan`);
    const body = encodeURIComponent(
      `Hi,\n\nI'd like to upgrade my CONNIS subscription to the ${selected.name} plan ($${selected.price}/mo).\n\nPlease send me the payment details.\n\nThank you.`
    );
    window.open(`mailto:support@connis.io?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ease-out ${
        animateIn ? 'bg-black/50 backdrop-blur-sm' : 'bg-transparent pointer-events-none'
      }`}
      onClick={closeUpgradeModal}
    >
      <div
        onClick={e => e.stopPropagation()}
        className={`relative w-full max-w-[820px] bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-400 ease-out ${
          animateIn ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-6'
        }`}
        style={{ maxHeight: '92vh' }}
      >
        {/* ── Header ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-8 py-7 text-white">
          {/* Decorative glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl" />

          <button
            onClick={closeUpgradeModal}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200"
          >
            <X size={16} />
          </button>

          <div className="relative flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Upgrade Your Plan</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                Unlock all features. Scale your ISP with confidence.
              </p>
            </div>
          </div>
        </div>

        {/* ── Plans grid ── */}
        <div className="p-6 pb-4 overflow-y-auto" style={{ maxHeight: 'calc(92vh - 200px)' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map(plan => {
              const Icon = plan.icon;
              const isSelected = selectedPlan === plan.key;
              const isCurrent = subscriptionPlan?.toLowerCase() === plan.key;

              return (
                <button
                  key={plan.key}
                  onClick={() => setSelectedPlan(plan.key)}
                  className={`group relative text-left rounded-2xl border-2 transition-all duration-250 ease-out ${
                    isSelected
                      ? `${plan.lightBorder} ${plan.lightBg} shadow-lg ring-1 ring-opacity-30`
                      : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'
                  }`}
                >
                  {/* Recommended badge */}
                  {plan.recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider shadow-md shadow-violet-200">
                        <Star size={10} fill="currentColor" /> Recommended
                      </span>
                    </div>
                  )}

                  {/* Current badge */}
                  {isCurrent && (
                    <div className="absolute -top-3 right-4 z-10">
                      <span className="px-2.5 py-1 bg-gray-700 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                        Current
                      </span>
                    </div>
                  )}

                  <div className="p-5 pt-6">
                    {/* Icon + Name */}
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-4 shadow-sm transition-transform duration-200 group-hover:scale-105`}>
                      <Icon size={18} className="text-white" />
                    </div>

                    <h3 className="text-base font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{plan.description}</p>

                    {/* Price */}
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-gray-900">${plan.price}</span>
                      <span className="text-sm text-gray-400 font-medium">/{plan.period}</span>
                    </div>

                    {/* Divider */}
                    <div className="mt-4 mb-4 border-t border-dashed border-gray-200" />

                    {/* Features */}
                    <ul className="space-y-2.5">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-[13px] text-gray-600 leading-snug">
                          <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isSelected ? `bg-gradient-to-br ${plan.gradient}` : 'bg-gray-200'
                          }`}>
                            <Check size={10} className={isSelected ? 'text-white' : 'text-gray-500'} strokeWidth={3} />
                          </div>
                          {feat}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Selection indicator */}
                  <div className={`px-5 py-3 border-t text-center text-xs font-semibold transition-all duration-200 rounded-b-2xl ${
                    isSelected
                      ? `${plan.lightText} ${plan.lightBg} border-transparent`
                      : 'text-gray-400 bg-gray-50/50 border-gray-100'
                  }`}>
                    {isSelected ? 'Selected' : 'Select plan'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Trust bar */}
          <div className="mt-5 flex items-center justify-center gap-6 text-[11px] text-gray-400">
            <span className="flex items-center gap-1.5"><Shield size={12} /> SSL Secured</span>
            <span className="flex items-center gap-1.5"><Check size={12} /> Cancel anytime</span>
            <span className="flex items-center gap-1.5"><Zap size={12} /> Instant activation</span>
          </div>
        </div>

        {/* ── Footer CTA ── */}
        <div className="px-8 py-5 bg-gray-50/80 border-t flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">
              Questions? <a href="mailto:support@connis.io" className="text-violet-600 font-medium hover:underline">Contact sales</a>
            </p>
          </div>
          <button
            onClick={handleUpgrade}
            className={`flex items-center gap-2 px-7 py-3 bg-gradient-to-r ${selected?.gradient || 'from-violet-600 to-purple-600'} text-white font-semibold text-sm rounded-xl transition-all duration-200 hover:shadow-xl hover:shadow-violet-200/50 hover:scale-[1.02] active:scale-[0.98]`}
          >
            Upgrade to {selected?.name}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
