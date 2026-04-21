import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { onSubscriptionError } from '../services/api';

const SubscriptionContext = createContext(null);

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider = ({ children }) => {
  const { company } = useAuth();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState(false);

  const isExpired = useMemo(() => {
    if (subscriptionError) return true;
    if (!company) return false;
    const status = company.subscription_status;
    if (status === 'expired' || status === 'cancelled') return true;
    if (company.expires_at && new Date(company.expires_at) < new Date()) return true;
    return false;
  }, [company, subscriptionError]);

  const isTrial = useMemo(() => {
    return company?.subscription_status === 'trial';
  }, [company]);

  const openUpgradeModal = useCallback(() => setUpgradeModalOpen(true), []);
  const closeUpgradeModal = useCallback(() => setUpgradeModalOpen(false), []);

  const triggerSubscriptionExpired = useCallback(() => {
    setSubscriptionError(true);
  }, []);

  // Listen for subscription errors from API layer
  useEffect(() => {
    return onSubscriptionError(() => {
      setSubscriptionError(true);
    });
  }, []);

  const value = useMemo(() => ({
    isExpired,
    isTrial,
    upgradeModalOpen,
    openUpgradeModal,
    closeUpgradeModal,
    triggerSubscriptionExpired,
    subscriptionPlan: company?.subscription_plan,
    expiresAt: company?.expires_at,
  }), [isExpired, isTrial, upgradeModalOpen, openUpgradeModal, closeUpgradeModal, triggerSubscriptionExpired, company]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
