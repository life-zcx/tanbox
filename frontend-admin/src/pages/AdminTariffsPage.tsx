import React, { useState } from 'react';
import { Save, Check } from 'lucide-react';
import { PageHeader } from '@shared';

export const AdminTariffsPage: React.FC = () => {
  const [tariffs, setTariffs] = useState([
    {
      code: 'DIGITAL',
      name: '«Цифровой»',
      desc: 'Только эмиссия кодов в Танбе. Выгрузка в PDF.',
      fitFor: 'У кого есть свои принтеры',
      priceClient: '10 - 15 ₸/шт',
      margin: '~10 - 15 ₸',
    },
    {
      code: 'PRINT',
      name: '«Печатный»',
      desc: 'Эмиссия кодов + термотрансферная печать рулонов.',
      fitFor: 'Без настройки принтеров',
      priceClient: '25 - 35 ₸/шт',
      margin: '~22 - 32 ₸ (расходники ~3 ₸)',
    },
    {
      code: 'STANDARD',
      name: '«Стандарт» (Под ключ)',
      desc: 'Эмиссия, печать, выезд, потоковая оклейка, проверка Urovo DT50.',
      fitFor: 'Оптовики с однотипным товаром',
      priceClient: '50 - 65 ₸/шт',
      margin: '~40 - 55 ₸ (учитывая оплату стикеровщика)',
    },
    {
      code: 'PRO',
      name: '«PRO» (Сложная оклейка)',
      desc: 'Вскрытие коробок, сверка артикулов, оклейка, SSCC агрегация.',
      fitFor: 'Импортеры обуви и одежды',
      priceClient: '90 - 120 ₸/шт',
      margin: '~75 - 105 ₸',
    },
  ]);

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-black tracking-tight">Управление тарифной сеткой и маржинальностью</h2>
          <p className="text-xs text-gray-500">Настройка базовой стоимости 1 единицы товара и расчёта прибыли</p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 bg-black text-white font-extrabold text-xs px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-all shadow-sm"
        >
          <Save className="w-4 h-4" /> Сохранить изменения
        </button>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4" /> Настройки тарифов успешно обновлены!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tariffs.map((t, idx) => (
          <div key={t.code} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-extrabold text-black">{t.name}</h3>
              <span className="text-[10px] font-extrabold font-mono bg-gray-100 px-2.5 py-1 rounded">
                CODE: {t.code}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">
                  Цена для клиента (₸ / шт)
                </label>
                <input
                  type="text"
                  value={t.priceClient}
                  onChange={(e) => {
                    const newT = [...tariffs];
                    newT[idx].priceClient = e.target.value;
                    setTariffs(newT);
                  }}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm font-extrabold text-black focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">
                  Примерная маржа оператора (₸ / шт)
                </label>
                <input
                  type="text"
                  value={t.margin}
                  onChange={(e) => {
                    const newT = [...tariffs];
                    newT[idx].margin = e.target.value;
                    setTariffs(newT);
                  }}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm font-extrabold text-black focus:outline-none focus:border-black"
                />
              </div>

              <div className="text-xs space-y-1 pt-1">
                <p className="font-bold text-black uppercase">Состав:</p>
                <p className="text-gray-600">{t.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
