import React, { createContext, startTransition, useContext, useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { DEFAULT_PUBLIC_PRICING, normalizePublicPricing, type PublicPricing } from '../data/publicPricing';

const PricingContext = createContext<PublicPricing>(DEFAULT_PUBLIC_PRICING);

function initialPricing(): PublicPricing {
  if (typeof document !== 'undefined') {
    const snapshot = document.getElementById('tanbox-public-pricing');
    if (snapshot?.textContent) {
      try { return normalizePublicPricing(JSON.parse(snapshot.textContent)); } catch { /* use verified fallback */ }
    }
  }
  return DEFAULT_PUBLIC_PRICING;
}

export const PublicPricingProvider: React.FC<{ children: React.ReactNode; initialValue?: PublicPricing }> = ({ children, initialValue }) => {
  const [pricing, setPricing] = useState<PublicPricing>(() => initialValue || initialPricing());
  useEffect(() => {
    let active = true;
    apiClient.get('/tariffs').then(response => {
      const next = normalizePublicPricing(response.data);
      if (active) startTransition(() => setPricing(current =>
        JSON.stringify(current) === JSON.stringify(next) ? current : next));
    }).catch(() => { /* The same public snapshot remains available offline. */ });
    return () => { active = false; };
  }, []);
  return <PricingContext.Provider value={pricing}>{children}</PricingContext.Provider>;
};

export const usePublicPricing = () => useContext(PricingContext);
