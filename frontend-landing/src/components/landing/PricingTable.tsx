import { useLanguage } from '../../context/LanguageContext';
import { usePublicPricing } from '../../context/PublicPricingContext';

export function PricingTable() {
  const { lang } = useLanguage();
  const { tariffs, pricingSettings: settings } = usePublicPricing();
  const names = lang === 'kz' ? ['Цифрлық', 'Басып шығару', 'Стандарт', 'PRO қоймасы']
    : lang === 'en' ? ['Digital', 'Print', 'Standard', 'PRO warehouse'] : ['Цифровой', 'Печать', 'Стандарт', 'PRO Склад'];
  const units = lang === 'kz' ? 'дана' : lang === 'en' ? 'units' : 'шт.';
  return <section className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 space-y-4">
    <h2 className="text-xl font-bold">{lang === 'kz' ? 'Тарифтер мен есептеу шарттары' : lang === 'en' ? 'Rates and calculation terms' : 'Тарифы и условия расчёта'}</h2>
    <p className="text-sm text-slate-600">{lang === 'kz'
      ? 'Прогрессивті есептеу: әр сатының бағасы тек сол сатыдағы дана санына қолданылады. Партияның орташа бағасы калькуляторда көрсетіледі. Оператордың таңбалау кодтары бөлек төленеді.'
      : lang === 'en' ? 'Progressive pricing: each rate applies only to units within that tier. The calculator shows the batch average. Marking codes are paid separately to the operator.'
      : 'Прогрессивный расчёт: ставка применяется только к количеству внутри своей ступени. Средняя цена партии показана в калькуляторе. Коды маркировки оплачиваются оператору отдельно.'}</p>
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{lang === 'kz' ? 'Сатыдағы бір дана үшін теңгемен ставка' : lang === 'en' ? 'KZT rate per unit in each tier' : 'Ставка в тенге за единицу внутри ступени'}</caption>
        <thead className="bg-slate-50"><tr>
          <th scope="col" className="p-3">{lang === 'kz' ? 'Тариф' : lang === 'en' ? 'Plan' : 'Тариф'}</th>
          {[`1–${settings.volumeTier1} ${units}`, `${settings.volumeTier1 + 1}–${settings.volumeTier2} ${units}`, `${settings.volumeTier2 + 1}+ ${units}`].map(label => <th key={label} scope="col" className="p-3">{label}</th>)}
        </tr></thead>
        <tbody>{['DIGITAL', 'PRINT', 'STANDARD', 'PRO'].map((code, i) => {
          const tariff = tariffs.find(t => t.code === code)!;
          return <tr key={code} className="border-t border-slate-100"><th scope="row" className="p-3">{names[i]}</th>
            {[tariff.priceRetail, tariff.priceWholesale, tariff.priceLargeWholesale].map((rate, j) => <td key={j} className="p-3 whitespace-nowrap">{rate} ₸</td>)}
          </tr>;
        })}</tbody>
      </table>
    </div>
    <p className="text-xs text-slate-600">{lang === 'kz' ? `SSCC: ${settings.ssccPrice} ₸ / қорап, PRO тарифіне кіреді. Бір реттік аутсорсинг: ${settings.outsourcingOneTimePrice} ₸ бастап; ай сайынғы: ${settings.outsourcingTier1Price} ₸ бастап.`
      : lang === 'en' ? `SSCC: ${settings.ssccPrice} ₸ / box, included in PRO. One-time outsourcing from ${settings.outsourcingOneTimePrice} ₸; monthly from ${settings.outsourcingTier1Price} ₸.`
      : `SSCC: ${settings.ssccPrice} ₸ / короб, включён в PRO. Разовый аутсорсинг от ${settings.outsourcingOneTimePrice} ₸; ежемесячный от ${settings.outsourcingTier1Price} ₸.`}</p>
  </section>;
}
