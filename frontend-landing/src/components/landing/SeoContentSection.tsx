import React from 'react';
import { 
  Barcode, 
  ShieldCheck, 
  Layers, 
  FileCheck2, 
  Truck, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  Cpu
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const SeoContentSection: React.FC = () => {
  return (
    <section className="py-14 sm:py-20 bg-white border-t border-gray-100" id="about-marking">
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Main Section Header */}
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#0082FB] text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Экспертный гид по маркировке товаров в РК</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111827] tracking-tight leading-tight">
            Цифровая маркировка товаров в Казахстане: национальная система ИС «Танба» и коды Data Matrix
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
            Всё, что необходимо знать импортерам, дистрибьюторам и отечественным производителям о требованиях законодательства Республики Казахстан, эмиссии кодов и складской логистике.
          </p>
        </div>

        {/* 3 Pillar Cards for Core SEO Keywords */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          
          {/* Pillar 1: IS Tanba */}
          <div className="bg-[#F8FAFC] border border-gray-200/90 rounded-2xl p-6 sm:p-7 space-y-3.5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0082FB] flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#111827]">
                Что такое ИС «Танба» (Tanba)?
              </h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                <strong>ИС «Танба» (ИС МПТ)</strong> — это единая государственная информационная система маркировки и прослеживаемости товаров в Республике Казахстан, оператором которой является АО «Казахтелеком». Через систему фиксируется полный жизненный цикл товара от завода или таможни до вывода из оборота на кассе магазина.
              </p>
            </div>
            <div className="pt-3 border-t border-gray-200 text-xs text-[#0082FB] font-bold">
              Регулируется ст. 283-1 КоАП РК
            </div>
          </div>

          {/* Pillar 2: Data Matrix */}
          <div className="bg-[#F8FAFC] border border-gray-200/90 rounded-2xl p-6 sm:p-7 space-y-3.5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0082FB] flex items-center justify-center font-bold">
                <Barcode className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#111827]">
                Код Data Matrix стандарта GS1
              </h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                <strong>Data Matrix</strong> — двухмерный матричный код повышенной емкости. В отличие от обычного линейного штрихкода EAN-13, Data Matrix содержит международный номер товара GTIN, уникальный серийный номер и криптографический ключ проверки (криптохвост), исключающий подделку продукции.
              </p>
            </div>
            <div className="pt-3 border-t border-gray-200 text-xs text-[#0082FB] font-bold">
              100% считываемость 2D-сканерами и ТСД
            </div>
          </div>

          {/* Pillar 3: SSCC & Aggregation */}
          <div className="bg-[#F8FAFC] border border-gray-200/90 rounded-2xl p-6 sm:p-7 space-y-3.5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0082FB] flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#111827]">
                Агрегация в короба (SSCC)
              </h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                <strong>Код SSCC (Serial Shipping Container Code)</strong> позволяет объединять сотни кодов потребительских упаковок в единую транспортную упаковку (короб или паллету). При таможенной очистке и приемке на склад сканируется всего один транспортный код без вскрытия тары.
              </p>
            </div>
            <div className="pt-3 border-t border-gray-200 text-xs text-[#0082FB] font-bold">
              Ускорение складской приемки в 10 раз
            </div>
          </div>

        </div>

        {/* Detailed Comprehensive Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4">
          
          {/* Left Column: Full Cycle Guide */}
          <div className="lg:col-span-8 space-y-6 text-[#334155] text-xs sm:text-sm leading-relaxed">
            <div className="space-y-3">
              <h3 className="text-xl font-extrabold text-[#111827]">
                Полный цикл маркировки товаров «под ключ» от сервиса TANBOX
              </h3>
              <p>
                В соответствии с законодательством Республики Казахстан оборот товаров, подлежащих обязательной маркировке, без нанесенных кодов Data Matrix влечет <strong>штрафы до 500 МРП с полной конфискацией немаркированной продукции</strong> (статья 283-1 КоАП РК).
              </p>
              <p>
                Сервис <strong>TANBOX</strong> берет на себя все технические, нормативные и логистические этапы подготовки партии к легальному вводу в гражданский оборот РК:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-[#F8FAFC] border border-gray-200/80 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-[#111827]">
                  <FileCheck2 className="w-4 h-4 text-[#0082FB]" />
                  <span>1. Национальный каталог (НКТ)</span>
                </div>
                <p className="text-xs text-[#64748B]">
                  Регистрация товаров в GS1 Kazakhstan, заполнение карточек номенклатуры, атрибутов и модерация.
                </p>
              </div>

              <div className="p-4 bg-[#F8FAFC] border border-gray-200/80 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-[#111827]">
                  <Cpu className="w-4 h-4 text-[#0082FB]" />
                  <span>2. Эмиссия в ИС Танба</span>
                </div>
                <p className="text-xs text-[#64748B]">
                  Официальный заказ пула кодов Data Matrix с криптозащитой через прямой шлюз Единого оператора.
                </p>
              </div>

              <div className="p-4 bg-[#F8FAFC] border border-gray-200/80 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-[#111827]">
                  <Barcode className="w-4 h-4 text-[#0082FB]" />
                  <span>3. Дизайн и печать этикеток</span>
                </div>
                <p className="text-xs text-[#64748B]">
                  Разработка макетов стикеров по требованиям ТР ТС (EAC, EAN-13, состав, размер) и печать рулонов 58×40 мм.
                </p>
              </div>

              <div className="p-4 bg-[#F8FAFC] border border-gray-200/80 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-[#111827]">
                  <Truck className="w-4 h-4 text-[#0082FB]" />
                  <span>4. Выездная оклейка и SSCC</span>
                </div>
                <p className="text-xs text-[#64748B]">
                  Мобильные бригады маркировщиков выезжают на склады в Алматы и городах РК, агрегируют в паллеты.
                </p>
              </div>
            </div>

            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-950 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#0082FB] shrink-0 mt-0.5" />
              <span>
                <strong>Официальный документооборот:</strong> По каждой партии формируется утвержденный законодательством Республики Казахстан первичный <strong>Акт выполненных работ по Форме Р-1</strong> (Приказ Минфина РК № 562) и Счёт на оплату от <strong>ИП «TORMAG.KZ»</strong> (ИИН 990601301525, без НДС).
              </span>
            </div>
          </div>

          {/* Right Column: Key Industries & Timeline */}
          <div className="lg:col-span-4 bg-[#F8FAFC] border border-gray-200/90 rounded-2xl p-6 sm:p-7 space-y-4">
            <h3 className="text-base font-bold text-[#111827] uppercase tracking-wider">
              Товарные группы маркировки в РК
            </h3>
            
            <ul className="space-y-3 text-xs divide-y divide-gray-200">
              <li className="pt-2 flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#111827] block">Обувные товары</span>
                  <span className="text-[#64748B]">ТН ВЭД 6401–6405</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Обязательно с 2021
                </span>
              </li>

              <li className="pt-2 flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#111827] block">Лекарственные препараты</span>
                  <span className="text-[#64748B]">ТН ВЭД 3004</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Обязательно с 2024
                </span>
              </li>

              <li className="pt-2 flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#111827] block">Табачные изделия и вейпы</span>
                  <span className="text-[#64748B]">ТН ВЭД 2402, 2404</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Обязательно с 2020
                </span>
              </li>

              <li className="pt-2 flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#111827] block">Упакованная вода и напитки</span>
                  <span className="text-[#64748B]">ТН ВЭД 2201, 2202</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Обязательно с 2024
                </span>
              </li>

              <li className="pt-2 flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#111827] block">Текстиль, одежда, легпром</span>
                  <span className="text-[#64748B]">Остатки до 2028 г.</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  Старт 2026–2027
                </span>
              </li>

              <li className="pt-2 flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#111827] block">Моторные масла, пиво, БАД</span>
                  <span className="text-[#64748B]">Поэтапное внедрение</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  Внедрение 2026
                </span>
              </li>
            </ul>

            <div className="pt-2">
              <Link
                to="/categories"
                className="w-full text-center inline-block py-2.5 px-4 bg-white border border-gray-300 rounded-xl text-xs font-bold text-[#111827] hover:border-[#0082FB] hover:text-[#0082FB] transition-all"
              >
                Все категории товаров РК →
              </Link>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default SeoContentSection;
