import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { unlocalizedPath } from '../../utils/seoPaths';

export function CommercialLinks({ categoryId }: { categoryId?: string }) {
  const { lang, getLocalizedPath } = useLanguage();
  const currentPath = unlocalizedPath(useLocation().pathname);
  const labels = lang === 'kz' ? ['Құнын есептеу', 'Таңбалау қызметтері', 'Санат талаптары']
    : lang === 'en' ? ['Calculate cost', 'Marking services', 'Category requirements']
    : ['Рассчитать стоимость', 'Услуги маркировки', 'Требования к категории'];
  return (
    <nav aria-label={lang === 'kz' ? 'Қызметтер мен есептеу' : lang === 'en' ? 'Services and pricing' : 'Услуги и расчёт'} className="flex flex-wrap gap-3 py-4">
      <Link to={getLocalizedPath('/calculator')} className="rounded-xl bg-[#0082FB] px-5 py-3 text-sm font-bold text-white hover:bg-[#0070DA]">{labels[0]}</Link>
      {currentPath !== '/services' && <Link to={getLocalizedPath('/services')} className="rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-bold text-[#0082FB]">{labels[1]}</Link>}
      {categoryId && <Link to={getLocalizedPath(`/categories/${categoryId}`)} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700">{labels[2]}</Link>}
    </nav>
  );
}
