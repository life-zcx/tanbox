import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../api/client';
import { PageHeader } from '@shared';
import html2pdf from 'html2pdf.js';
import {
  Printer,
  Download,
  Copy,
  RefreshCw,
  Plus,
  Trash2,
  Check,
  FileSpreadsheet,
  Building,
  Zap,
  Info,
} from 'lucide-react';

interface TariffRow {
  id: string;
  name: string;
  description: string;
  p1: number; // до 1 000
  p2: number; // 1 001 - 5 000
  p3: number; // 5 001 - 20 000
  p4: number; // от 20 001
  enabled: boolean;
}

interface ExtraServiceRow {
  id: string;
  name: string;
  unit: string;
  price: string;
  enabled: boolean;
}

export const AdminPriceBuilderPage: React.FC = () => {
  const previewRef = useRef<HTMLDivElement>(null);

  // General offer settings
  const [clientName, setClientName] = useState<string>('Для корпоративных клиентов');
  const [managerName, setManagerName] = useState<string>('Отдел корпоративных продаж');
  const [managerPhone, setManagerPhone] = useState<string>('+7 (707) 711-16-53');
  const [managerEmail, setManagerEmail] = useState<string>('sales@tanbox.kz');
  const [validUntilDays, setValidUntilDays] = useState<number>(14);

  // Legal company credentials from official TANBOX configuration
  const [legalName, setLegalName] = useState<string>('ИП INTERSENSE');
  const [legalIin, setLegalIin] = useState<string>('990601301525');

  // Tariffs
  const [tariffs, setTariffs] = useState<TariffRow[]>([
    {
      id: 'DIGITAL',
      name: 'Электронный (Файлы)',
      description: 'Генерация кодов Data Matrix, валидация криптохвостов, экспорт в PDF/EPS/CSV',
      p1: 15,
      p2: 12,
      p3: 10,
      p4: 8,
      enabled: true,
    },
    {
      id: 'PRINT',
      name: 'Печать наклеек в рулонах',
      description: 'Термотрансферная печать на стикерах, верификация сканером, доставка по РК',
      p1: 35,
      p2: 30,
      p3: 25,
      p4: 20,
      enabled: true,
    },
    {
      id: 'STANDARD',
      name: 'Стандарт (Выездная оклейка)',
      description: 'Печать + выезд мобильной бригады на ваш склад, ручная оклейка каждой единицы',
      p1: 65,
      p2: 55,
      p3: 50,
      p4: 45,
      enabled: true,
    },
    {
      id: 'PRO',
      name: 'Полный цикл PRO',
      description: 'Всё включено: заведение в НКТ, печать, оклейка, агрегация в короба SSCC и ввод в оборот',
      p1: 120,
      p2: 105,
      p3: 90,
      p4: 80,
      enabled: true,
    },
  ]);

  // Extra services
  const [extraServices, setExtraServices] = useState<ExtraServiceRow[]>([
    {
      id: 's1',
      name: 'Разработка индивидуального макета стикера',
      unit: 'макет',
      price: '5 000 ₸',
      enabled: true,
    },
    {
      id: 's2',
      name: 'Агрегация кодов в короба / паллеты с печатью транспортных кодов SSCC',
      unit: 'короб',
      price: '5 ₸',
      enabled: true,
    },
    {
      id: 's3',
      name: 'Регистрация и настройка личного кабинета в ИС МПТ (Танба) с ЭЦП',
      unit: 'услуга',
      price: '25 000 ₸',
      enabled: true,
    },
    {
      id: 's4',
      name: 'Заведение номенклатуры и модерация в Национальном каталоге товаров (НКТ)',
      unit: 'карточка',
      price: '500 ₸',
      enabled: true,
    },
    {
      id: 's5',
      name: 'Срочный выезд / ускоренное изготовление тиража за 24 часа',
      unit: 'заказ',
      price: '+20% к заказу',
      enabled: true,
    },
    {
      id: 's6',
      name: 'Экспресс-доставка рулонов по Алматы в день готовности',
      unit: 'доставка',
      price: '15 000 ₸',
      enabled: true,
    },
  ]);

  const [loadingDb, setLoadingDb] = useState<boolean>(false);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Load active prices from backend on mount
  useEffect(() => {
    loadPricesFromDatabase();
  }, []);

  const loadPricesFromDatabase = async () => {
    setLoadingDb(true);
    try {
      const res = await apiClient.get('/tariffs');
      if (res.data?.tariffs && Array.isArray(res.data.tariffs)) {
        const dbList = res.data.tariffs;
        setTariffs((prev) =>
          prev.map((t) => {
            const found = dbList.find((dbItem: any) => dbItem.tariffType === t.id);
            if (!found) return t;
            const retail = Number(found.priceRetail) || t.p1;
            const wholesale = Number(found.priceWholesale) || t.p2;
            const large = Number(found.priceLargeWholesale) || t.p3;
            const ultra = Math.max(1, Math.round(large * 0.85));
            return {
              ...t,
              p1: retail,
              p2: wholesale,
              p3: large,
              p4: ultra,
            };
          })
        );
      }

      if (res.data?.pricingSettings) {
        const ps = res.data.pricingSettings;
        setExtraServices((prev) =>
          prev.map((item) => {
            if (item.id === 's1' && ps.stickerLayoutPrice) {
              return { ...item, price: `${Number(ps.stickerLayoutPrice).toLocaleString()} ₸` };
            }
            if (item.id === 's2' && ps.ssccPrice) {
              return { ...item, price: `${Number(ps.ssccPrice).toLocaleString()} ₸` };
            }
            if (item.id === 's5' && ps.urgentPercent) {
              return { ...item, price: `+${Number(ps.urgentPercent)}% к заказу` };
            }
            if (item.id === 's6' && ps.expressDeliveryPrice) {
              return { ...item, price: `${Number(ps.expressDeliveryPrice).toLocaleString()} ₸` };
            }
            return item;
          })
        );
      }
    } catch (err) {
      console.warn('Could not load tariffs from DB:', err);
    } finally {
      setLoadingDb(false);
    }
  };

  const handleTariffPriceChange = (id: string, field: 'p1' | 'p2' | 'p3' | 'p4', val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setTariffs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: num } : t))
    );
  };

  const toggleTariffEnabled = (id: string) => {
    setTariffs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t))
    );
  };

  const handleExtraServiceChange = (id: string, field: keyof ExtraServiceRow, val: any) => {
    setExtraServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: val } : s))
    );
  };

  const handleAddExtraService = () => {
    const newId = `custom_${Date.now()}`;
    setExtraServices((prev) => [
      ...prev,
      {
        id: newId,
        name: 'Новая дополнительная услуга',
        unit: 'услуга',
        price: '10 000 ₸',
        enabled: true,
      },
    ]);
  };

  const handleDeleteExtraService = (id: string) => {
    setExtraServices((prev) => prev.filter((s) => s.id !== id));
  };

  // Native Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Download PDF using html2pdf directly on the rendered DOM element
  const handleDownloadPdf = async () => {
    if (!previewRef.current) return;
    setDownloadingPdf(true);

    const el = previewRef.current;
    const prevBorder = el.style.border;
    const prevRadius = el.style.borderRadius;
    const prevShadow = el.style.boxShadow;
    const prevMaxWidth = el.style.maxWidth;

    el.style.border = 'none';
    el.style.borderRadius = '0px';
    el.style.boxShadow = 'none';
    el.style.maxWidth = '100%';

    try {
      const opt = {
        margin: [8, 10, 8, 10],
        filename: `TANBOX_Прайс_Лист_${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          logging: false,
          scrollY: 0,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };

      await (html2pdf as any)().set(opt).from(el).save();
    } catch (err) {
      console.error('PDF export failed:', err);
      // Fallback to print dialog
      window.print();
    } finally {
      el.style.border = prevBorder;
      el.style.borderRadius = prevRadius;
      el.style.boxShadow = prevShadow;
      el.style.maxWidth = prevMaxWidth;
      setDownloadingPdf(false);
    }
  };

  // Copy Plain Text for WhatsApp / Email
  const handleCopyText = () => {
    const activeTariffs = tariffs.filter((t) => t.enabled);
    const activeServices = extraServices.filter((s) => s.enabled);

    let text = `📦 ТОО "TANBOX" — ПРАЙС-ЛИСТ НА МАРКИРОВКУ И ФУЛФИЛМЕНТ\n`;
    text += `Клиент: ${clientName}\n`;
    text += `Дата: ${new Date().toLocaleDateString('ru-RU')}\n\n`;

    text += `--- ТАРИФЫ НА ОБСЛУЖИВАНИЕ ---\n`;
    activeTariffs.forEach((t) => {
      text += `🔹 ${t.name}:\n`;
      text += `  • до 1 000 шт: ${t.p1} ₸/код\n`;
      text += `  • 1 001 – 5 000 шт: ${t.p2} ₸/код\n`;
      text += `  • 5 001 – 20 000 шт: ${t.p3} ₸/код\n`;
      text += `  • от 20 001 шт: ${t.p4} ₸/код\n`;
    });

    if (activeServices.length > 0) {
      text += `\n--- ДОПОЛНИТЕЛЬНЫЕ УСЛУГИ ---\n`;
      activeServices.forEach((s) => {
        text += `• ${s.name}: ${s.price} (${s.unit})\n`;
      });
    }

    text += `\nКонтакты: ${managerPhone} | ${managerEmail} | tanbox.kz\n`;

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const currentDateFormatted = new Date().toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      {/* Print-only CSS isolation to make sure exactly 1 clean page is printed */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide all UI navigation and admin layout elements */
          aside, header, nav, .no-print, button, input, textarea, select {
            display: none !important;
          }
          /* Neutralize admin layout containers */
          main {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
          }
          .preview-outer-box {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            border: none !important;
            border-width: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          #tanbox-print-sheet {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            border-width: 0 !important;
            border-style: none !important;
            border-color: transparent !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
        }
      `}</style>

      <div className="space-y-6 pb-16">
        {/* Header with actions */}
        <div className="no-print">
        <PageHeader
          title="Конструктор прайс-листов"
          description="Формирование официального коммерческого предложения, настройка стоимости под клиента и экспорт в PDF"
          action={
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={loadPricesFromDatabase}
                disabled={loadingDb}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
                title="Загрузить текущие тарифы из базы данных"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingDb ? 'animate-spin text-[#0082FB]' : 'text-gray-500'}`} />
                {loadingDb ? 'Загрузка...' : 'Подтянуть из базы'}
              </button>

              <button
                type="button"
                onClick={handleCopyText}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
                title="Скопировать прайс в виде текста для мессенджеров"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Скопировано!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-gray-500" />
                    <span>Копировать текст</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-gray-500" />
                {downloadingPdf ? 'Генерация PDF...' : 'Скачать PDF'}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl text-xs font-extrabold bg-[#0082FB] hover:bg-[#0072de] text-white flex items-center gap-2 transition-all shadow-md shadow-[#0082FB]/20 active:scale-95 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Печать / Векторный PDF
              </button>
            </div>
          }
        />
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Controls & Settings */}
        <div className="xl:col-span-6 space-y-6 no-print">
          {/* Card 1: Client & Contact details */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#111827] uppercase tracking-wider pb-3 border-b border-gray-100">
              <Building className="w-4 h-4 text-[#0082FB]" />
              Реквизиты и контакты предложения
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">
                  Кому адресовано (Клиент / Компания)
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="ТОО Компания / Для коммерческого предложения"
                  className="w-full text-xs bg-[#F8FAFC] border border-gray-200 rounded-xl px-3 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">
                  Срок действия КП (дней)
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={validUntilDays}
                  onChange={(e) => setValidUntilDays(parseInt(e.target.value, 10) || 14)}
                  className="w-full text-xs bg-[#F8FAFC] border border-gray-200 rounded-xl px-3 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">
                  Ответственный менеджер / Отдел
                </label>
                <input
                  type="text"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  className="w-full text-xs bg-[#F8FAFC] border border-gray-200 rounded-xl px-3 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">
                  Телефон / WhatsApp
                </label>
                <input
                  type="text"
                  value={managerPhone}
                  onChange={(e) => setManagerPhone(e.target.value)}
                  className="w-full text-xs bg-[#F8FAFC] border border-gray-200 rounded-xl px-3 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">
                  Email для связи
                </label>
                <input
                  type="email"
                  value={managerEmail}
                  onChange={(e) => setManagerEmail(e.target.value)}
                  className="w-full text-xs bg-[#F8FAFC] border border-gray-200 rounded-xl px-3 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                />
              </div>

              {/* Legal Credentials Block */}
              <div className="sm:col-span-2 pt-3 border-t border-gray-150 space-y-2.5">
                <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider block">
                  Юридические реквизиты исполнителя (по договору)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 block mb-0.5">Юр. лицо / ИП</label>
                    <input
                      type="text"
                      value={legalName}
                      onChange={(e) => setLegalName(e.target.value)}
                      className="w-full text-xs bg-[#F8FAFC] border border-gray-200 rounded-lg px-2.5 py-1.5 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 block mb-0.5">ИИН / БИН</label>
                    <input
                      type="text"
                      value={legalIin}
                      onChange={(e) => setLegalIin(e.target.value)}
                      className="w-full text-xs bg-[#F8FAFC] border border-gray-200 rounded-lg px-2.5 py-1.5 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Tariffs Matrix */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#111827] uppercase tracking-wider">
                <FileSpreadsheet className="w-4 h-4 text-[#0082FB]" />
                Тарифы на маркировку (₸ за 1 код)
              </div>
              <span className="text-[11px] text-[#64748B]">
                Цены можно править вручную
              </span>
            </div>

            <div className="space-y-4">
              {tariffs.map((t) => (
                <div
                  key={t.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    t.enabled
                      ? 'border-gray-200 bg-[#F8FAFC]'
                      : 'border-gray-200/60 bg-gray-50 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={t.enabled}
                        onChange={() => toggleTariffEnabled(t.id)}
                        className="w-4 h-4 rounded text-[#0082FB] focus:ring-[#0082FB]"
                      />
                      <span className="text-xs font-bold text-[#111827]">{t.name}</span>
                    </label>
                  </div>

                  <p className="text-[11px] text-[#64748B] mb-3">{t.description}</p>

                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <span className="text-[10px] font-semibold text-gray-500 block mb-1">
                        до 1 000 шт
                      </span>
                      <div className="relative">
                        <input
                          type="number"
                          value={t.p1}
                          disabled={!t.enabled}
                          onChange={(e) => handleTariffPriceChange(t.id, 'p1', e.target.value)}
                          className="w-full text-center text-xs font-bold bg-white border border-gray-200 rounded-lg py-1.5 px-1 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-gray-500 block mb-1">
                        1 001–5 000
                      </span>
                      <div className="relative">
                        <input
                          type="number"
                          value={t.p2}
                          disabled={!t.enabled}
                          onChange={(e) => handleTariffPriceChange(t.id, 'p2', e.target.value)}
                          className="w-full text-center text-xs font-bold bg-white border border-gray-200 rounded-lg py-1.5 px-1 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-gray-500 block mb-1">
                        5 001–20 000
                      </span>
                      <div className="relative">
                        <input
                          type="number"
                          value={t.p3}
                          disabled={!t.enabled}
                          onChange={(e) => handleTariffPriceChange(t.id, 'p3', e.target.value)}
                          className="w-full text-center text-xs font-bold bg-white border border-gray-200 rounded-lg py-1.5 px-1 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-gray-500 block mb-1">
                        от 20 001 шт
                      </span>
                      <div className="relative">
                        <input
                          type="number"
                          value={t.p4}
                          disabled={!t.enabled}
                          onChange={(e) => handleTariffPriceChange(t.id, 'p4', e.target.value)}
                          className="w-full text-center text-xs font-bold bg-white border border-gray-200 rounded-lg py-1.5 px-1 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Additional Services */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#111827] uppercase tracking-wider">
                <Zap className="w-4 h-4 text-[#0082FB]" />
                Дополнительные услуги TANBOX
              </div>
              <button
                type="button"
                onClick={handleAddExtraService}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#0082FB] hover:bg-blue-50 flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Добавить услугу
              </button>
            </div>

            <div className="space-y-2.5">
              {extraServices.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 bg-[#F8FAFC]"
                >
                  <input
                    type="checkbox"
                    checked={service.enabled}
                    onChange={(e) => handleExtraServiceChange(service.id, 'enabled', e.target.checked)}
                    className="w-4 h-4 rounded text-[#0082FB] shrink-0"
                  />
                  <input
                    type="text"
                    value={service.name}
                    onChange={(e) => handleExtraServiceChange(service.id, 'name', e.target.value)}
                    className="flex-1 text-xs font-medium bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                  />
                  <input
                    type="text"
                    value={service.unit}
                    placeholder="ед. изм."
                    onChange={(e) => handleExtraServiceChange(service.id, 'unit', e.target.value)}
                    className="w-16 text-center text-xs bg-white border border-gray-200 rounded-lg px-1.5 py-1.5 text-gray-600 focus:outline-none focus:border-[#0082FB]"
                  />
                  <input
                    type="text"
                    value={service.price}
                    placeholder="цена"
                    onChange={(e) => handleExtraServiceChange(service.id, 'price', e.target.value)}
                    className="w-28 text-center text-xs font-bold text-[#0082FB] bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#0082FB]"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteExtraService(service.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Live A4 Preview Sheet */}
        <div className="xl:col-span-6 sticky top-6">
          <div className="preview-outer-box bg-gray-100/90 rounded-2xl p-4 border border-gray-200/80 print:p-0 print:border-none print:bg-transparent print:rounded-none">
            <div className="flex items-center justify-between pb-3 px-1 no-print">
              <span className="text-xs font-extrabold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#0082FB]" />
                Превью печатного листа А4
              </span>
              <span className="text-[11px] text-[#64748B] font-mono">
                210 × 297 мм
              </span>
            </div>

            {/* Printable A4 Container */}
            <div
              id="tanbox-print-sheet"
              ref={previewRef}
              className="bg-white rounded-xl shadow-md border border-gray-300/80 p-8 text-[#111827] font-sans mx-auto max-w-[650px] space-y-5 print:border-none print:rounded-none print:shadow-none print:p-0 print:m-0 print:max-w-none print:w-full"
            >
              {/* Sheet Header */}
              <div className="flex items-center justify-between border-b-2 border-[#0082FB] pb-4">
                <div className="space-y-1">
                  <img src="/tanbox-dark.svg" alt="TANBOX" className="h-7 w-auto object-contain" />
                  <p className="text-[10px] text-gray-500 font-medium">
                    Цифровая маркировка товаров под ключ в Республике Казахстан (ИС Танба)
                  </p>
                </div>
                <div className="text-right space-y-0.5">
                  <span className="text-[10px] font-black uppercase text-[#0082FB] tracking-widest block">
                    КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ
                  </span>
                  <p className="text-xs font-bold text-[#111827]">
                    Прайс-лист на услуги
                  </p>
                  <p className="text-[10px] text-gray-500">
                    от {currentDateFormatted}
                  </p>
                </div>
              </div>

              {/* Destination Meta */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg text-xs">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-semibold">
                    Заказчик:
                  </span>
                  <span className="font-bold text-[#111827]">{clientName || 'Для корпоративных клиентов'}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-semibold">
                    Срок действия предложения:
                  </span>
                  <span className="font-bold text-[#111827]">
                    {validUntilDays} дней (до {new Date(Date.now() + validUntilDays * 86400000).toLocaleDateString('ru-RU')})
                  </span>
                </div>
              </div>

              {/* Tariffs Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#111827]">
                    1. Тарифы на маркировку продукции (₸ за 1 код)
                  </span>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F1F5F9] text-gray-700 font-bold border-b border-gray-200 text-[10px] uppercase">
                        <th className="p-2 pl-3">Тариф / Состав услуг</th>
                        <th className="p-2 text-center w-16">до 1 тыс</th>
                        <th className="p-2 text-center w-16">1–5 тыс</th>
                        <th className="p-2 text-center w-16">5–20 тыс</th>
                        <th className="p-2 text-center w-16 text-[#0082FB]">от 20 тыс</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {tariffs
                        .filter((t) => t.enabled)
                        .map((t) => (
                          <tr key={t.id} className="hover:bg-gray-50/50">
                            <td className="p-2 pl-3">
                              <span className="font-bold text-[#111827] block text-xs">{t.name}</span>
                              <span className="text-[10px] text-gray-500 line-clamp-1">{t.description}</span>
                            </td>
                            <td className="p-2 text-center font-mono font-medium">{t.p1} ₸</td>
                            <td className="p-2 text-center font-mono font-medium">{t.p2} ₸</td>
                            <td className="p-2 text-center font-mono font-medium">{t.p3} ₸</td>
                            <td className="p-2 text-center font-mono font-bold text-[#0082FB]">{t.p4} ₸</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Extra Services Table */}
              {extraServices.filter((s) => s.enabled).length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#111827] block">
                    2. Сопутствующие и цифровые услуги
                  </span>

                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-[11px] text-left border-collapse">
                      <tbody className="divide-y divide-gray-100">
                        {extraServices
                          .filter((s) => s.enabled)
                          .map((s) => (
                            <tr key={s.id} className="hover:bg-gray-50/50">
                              <td className="p-2 pl-3 text-gray-800 font-medium">
                                {s.name}
                              </td>
                              <td className="p-2 text-right pr-3 font-bold text-[#111827] whitespace-nowrap">
                                {s.price} <span className="text-[10px] text-gray-500 font-normal">/ {s.unit}</span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}



              {/* Contacts & Signoff Footer */}
              <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-600">
                <div className="space-y-0.5">
                  <p className="font-bold text-[#111827]">{legalName} • ИИН: {legalIin}</p>
                  <p>Официальный сервис: <span className="font-semibold text-[#0082FB]">tanbox.kz</span></p>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="font-semibold text-[#111827]">{managerName}</p>
                  <p className="font-bold text-gray-900">{managerPhone}</p>
                  <p>{managerEmail}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
);
};
