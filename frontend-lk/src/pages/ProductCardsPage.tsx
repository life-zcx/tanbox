import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import { MarkirovkaHeaderBar } from '../components/markirovka/MarkirovkaHeaderBar';
import { ProductCardsSection } from '../components/markirovka/ProductCardsSection';

export const ProductCardsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [createCardTrigger, setCreateCardTrigger] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/markirovka/accounts').catch(() => ({ data: { accounts: [] } }));
      setAccounts(res.data?.accounts || []);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Reusable Header: Compact Status Bar, Working NKT Modals & Create Card button */}
      <MarkirovkaHeaderBar
        mode="CARDS"
        accounts={accounts}
        loading={loading}
        onRefresh={fetchData}
        onCreateCard={() => setCreateCardTrigger((prev) => prev + 1)}
      />

      {/* Main Product Cards Workspace (analogous to IS MPT operations) */}
      <ProductCardsSection createModalTrigger={createCardTrigger} />
    </div>
  );
};

export default ProductCardsPage;
