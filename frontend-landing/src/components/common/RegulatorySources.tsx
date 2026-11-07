import { useLanguage } from '../../context/LanguageContext';
import { getRegulatorySources, REQUIREMENTS_CHECKED_AT } from '../../data/regulatoryRequirements';

export function RegulatorySources({ categoryId }: { categoryId?: string }) {
  const { lang } = useLanguage();
  return <aside className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 space-y-2">
    <h2 className="font-bold text-slate-900">{lang === 'kz' ? 'Ресми дереккөздер' : lang === 'en' ? 'Official sources' : 'Официальные источники'}</h2>
    <p>{lang === 'kz' ? 'Дереккөздер тексерілген күн:' : lang === 'en' ? 'Sources checked:' : 'Источники проверены:'} <time dateTime={REQUIREMENTS_CHECKED_AT}>{REQUIREMENTS_CHECKED_AT}</time></p>
    <ul className="space-y-1">{getRegulatorySources(categoryId, lang).map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer" className="text-[#0082FB] underline">{source.title}</a></li>)}</ul>
    <p className="text-xs">{lang === 'kz' ? 'Талаптар тауардың атауына, ТН ВЭД кодына, өндірілген күніне және жеткізу еліне қарай тексеріледі.'
      : lang === 'en' ? 'Requirements depend on product identity, HS code, manufacture date and destination market.'
      : 'Требования проверяются по виду товара, коду ТН ВЭД, дате производства и рынку поставки.'}</p>
  </aside>;
}
