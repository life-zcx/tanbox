import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePublicPricing } from '../../context/PublicPricingContext';
import { getPageSeo } from '../../utils/pageSeo';
import { applyPageSeo } from '../../utils/seo';

export function PageSeo() {
  const { pathname } = useLocation();
  const pricing = usePublicPricing();
  useEffect(() => {
    let active = true;
    getPageSeo(pathname, pricing).then(page => { if (active) applyPageSeo(page); });
    return () => { active = false; };
  }, [pathname, pricing]);
  return null;
}
