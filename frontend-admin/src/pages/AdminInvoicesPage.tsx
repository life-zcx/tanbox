import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { apiClient } from '../api/client';
import { PageHeader } from '@shared';
import html2pdf from 'html2pdf.js';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  User,
  Building,
  Calendar,
  X,
  CreditCard,
  RefreshCw,
  Copy,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';

interface InvoiceItemLine {
  id: string;
  name: string;
  qty: number;
  unit: string;
  price: number;
  sum: number;
}

interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  orderId?: string;
  orderNumber?: string;
  customerName: string;
  customerBinIin: string;
  customerAddress: string;
  customerPhone?: string;
  items: InvoiceItemLine[];
  totalAmount: number;
  status: 'PAID' | 'PENDING' | 'CANCELLED';
  createdAt: string;
}

// Complete catalog of all TANBOX services from website and tariffs
const TANBOX_SERVICES_CATALOG = [
  // 1. Таможенное оформление и растаможка грузов
  {
    category: 'Таможенное оформление и растаможка',
    items: [
      { name: 'Таможенное декларирование грузов (ГТД / ДТ)', unit: 'декларация', defaultPrice: 45000 },
      { name: 'Классификация и аудит кодов ТН ВЭД РК', unit: 'услуга', defaultPrice: 20000 },
      { name: 'Оформление сертификатов и деклараций о соответствии (ЕАЭС)', unit: 'документ', defaultPrice: 65000 },
      { name: 'Расчет и оптимизация таможенных пошлин и НДС', unit: 'расчет', defaultPrice: 15000 },
    ],
  },
  // 2. Заведение товаров в НКТ (Каталог товаров)
  {
    category: 'Заведение товаров в Национальный каталог (НКТ / GS1)',
    items: [
      { name: 'Заведение номенклатуры и присвоение кодов GTIN / NTIN в НКТ', unit: 'карточка', defaultPrice: 500 },
      { name: 'Массовая загрузка спецификаций номенклатуры из 1С / Excel в НКТ', unit: 'пакет', defaultPrice: 25000 },
      { name: 'Аудит и исправление карточек при модерации в НКТ', unit: 'карточка', defaultPrice: 350 },
      { name: 'Привязка номенклатуры к справочникам ТН ВЭД и ГСВС', unit: 'услуга', defaultPrice: 15000 },
    ],
  },
  // 3. Эмиссия и нанесение кодов Data Matrix
  {
    category: 'Эмиссия и нанесение кодов Data Matrix',
    items: [
      { name: 'Эмиссия кодов маркировки Data Matrix в ИС «Танба» (Файлы)', unit: 'код', defaultPrice: 12 },
      { name: 'Печать термотрансферных стикеров Data Matrix в рулонах', unit: 'стикер', defaultPrice: 25 },
      { name: 'Нанесение стикеров Data Matrix на потребительскую упаковку товаров', unit: 'шт', defaultPrice: 35 },
      { name: 'Промышленная верификация 100% считываемости 2D сканерами', unit: 'партия', defaultPrice: 10000 },
    ],
  },
  // 4. Агрегация в короба и паллеты (SSCC)
  {
    category: 'Агрегация в короба и паллеты (коды SSCC)',
    items: [
      { name: 'Агрегация кодов в транспортные короба с печатью ярлыков SSCC', unit: 'короб', defaultPrice: 5 },
      { name: 'Агрегация коробов на логистические паллеты с маркировкой SSCC', unit: 'паллета', defaultPrice: 500 },
      { name: 'Формирование и передача сведений об агрегации в ИС «Танба»', unit: 'заказ', defaultPrice: 10000 },
      { name: 'Печать паллетных и коробочных ярлыков формата A5 / A6', unit: 'ярлык', defaultPrice: 80 },
    ],
  },
  // 5. Выездные мобильные бригады оклейщиков (24/7)
  {
    category: 'Выездные мобильные бригады оклейщиков (24/7)',
    items: [
      { name: 'Выезд мобильной бригады маркировщиков на склад заказчика (Алматы)', unit: 'выезд', defaultPrice: 15000 },
      { name: 'Выезд мобильной бригады маркировщиков по регионам РК / СВХ', unit: 'выезд', defaultPrice: 45000 },
      { name: 'Смена маркировки мобильной бригады (до 50 000 ед. продукции)', unit: 'смена', defaultPrice: 120000 },
      { name: 'Предоставление промышленного термотрансферного оборудования и аппликаторов', unit: 'сутки', defaultPrice: 20000 },
    ],
  },
  // 6. Интеграция ИС Танба с 1С / ERP и Консалтинг
  {
    category: 'Интеграция ИС Танба с 1С / ERP и Консалтинг',
    items: [
      { name: 'Настройка прямого обмена ИС «Танба» с 1С:Предприятие / ERP / WMS', unit: 'интеграция', defaultPrice: 150000 },
      { name: 'Обучение персонала и кладовщиков работе с 2D-сканерами и ТСД', unit: 'курс', defaultPrice: 35000 },
      { name: 'Аудит бизнес-процессов цифровой маркировки перед проверками ДГД', unit: 'аудит', defaultPrice: 50000 },
      { name: 'Абонентское техническое сопровождение и поддержка маркировки (в месяц)', unit: 'месяц', defaultPrice: 80000 },
    ],
  },
  // 7. Сопутствующие сервисы и макеты
  {
    category: 'Макеты и сопутствующие услуги',
    items: [
      { name: 'Разработка индивидуального макета стикера дизайнером', unit: 'макет', defaultPrice: 5000 },
      { name: 'Регистрация и настройка личного кабинета в ИС МПТ (Танба) с ЭЦП', unit: 'услуга', defaultPrice: 25000 },
      { name: 'Срочный выезд / экспресс-печать за 24 часа (+20%)', unit: 'заказ', defaultPrice: 15000 },
      { name: 'Экспресс-доставка готовых рулонов по Алматы', unit: 'доставка', defaultPrice: 15000 },
    ],
  },
];

// Helper: Convert number to Russian words for Kazakh invoice standard
function numberToWordsRu(num: number): string {
  const rounded = Math.floor(Math.abs(num));
  if (rounded === 0) return 'ноль тенге 00 тиын';

  const units = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
  const unitsFemale = ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
  const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
  const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
  const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];

  function triadToWords(triad: number, genderFemale = false): string {
    const h = Math.floor(triad / 100);
    const d = Math.floor((triad % 100) / 10);
    const u = triad % 10;
    const parts: string[] = [];
    if (h > 0) parts.push(hundreds[h]);
    if (d === 1) {
      parts.push(teens[u]);
    } else {
      if (d > 1) parts.push(tens[d]);
      if (u > 0) parts.push(genderFemale ? unitsFemale[u] : units[u]);
    }
    return parts.join(' ');
  }

  const millions = Math.floor(rounded / 1000000);
  const thousands = Math.floor((rounded % 1000000) / 1000);
  const ones = rounded % 1000;
  const result: string[] = [];

  if (millions > 0) {
    result.push(triadToWords(millions, false));
    const mMod10 = millions % 10;
    const mMod100 = millions % 100;
    if (mMod100 >= 11 && mMod100 <= 19) result.push('миллионов');
    else if (mMod10 === 1) result.push('миллион');
    else if (mMod10 >= 2 && mMod10 <= 4) result.push('миллиона');
    else result.push('миллионов');
  }

  if (thousands > 0) {
    result.push(triadToWords(thousands, true));
    const tMod10 = thousands % 10;
    const tMod100 = thousands % 100;
    if (tMod100 >= 11 && tMod100 <= 19) result.push('тысяч');
    else if (tMod10 === 1) result.push('тысяча');
    else if (tMod10 >= 2 && tMod10 <= 4) result.push('тысячи');
    else result.push('тысяч');
  }

  if (ones > 0 || result.length === 0) {
    result.push(triadToWords(ones, false));
  }

  const words = result.join(' ').trim();
  const capitalized = words.charAt(0).toUpperCase() + words.slice(1);
  return `${capitalized} теңге 00 тиын`;
}

export const AdminInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'CANCELLED'>('ALL');

  // Customer users list from backend (for autocomplete in modal)
  const [usersList, setUsersList] = useState<any[]>([]);

  // Modal create invoice state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [customerMode, setCustomerMode] = useState<'SELECT' | 'MANUAL'>('SELECT');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [customCustomerName, setCustomCustomerName] = useState<string>('');
  const [customCustomerBin, setCustomCustomerBin] = useState<string>('');
  const [customCustomerAddress, setCustomCustomerAddress] = useState<string>('г. Алматы');
  const [customCustomerPhone, setCustomCustomerPhone] = useState<string>('');
  const [invoiceNumberInput, setInvoiceNumberInput] = useState<string>('');
  const [invoiceDateInput, setInvoiceDateInput] = useState<string>(new Date().toISOString().slice(0, 10));

  // Current lines in create modal
  const [createLines, setCreateLines] = useState<InvoiceItemLine[]>([]);

  // View / Print modal state
  const [activeViewInvoice, setActiveViewInvoice] = useState<InvoiceRecord | null>(null);
  const printSheetRef = useRef<HTMLDivElement>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Orders to populate existing invoices and Users for client selection
      const [ordersRes, usersRes] = await Promise.allSettled([
        apiClient.get('/orders'),
        apiClient.get('/users'),
      ]);

      let loadedOrders: any[] = [];
      if (ordersRes.status === 'fulfilled') {
        const d = ordersRes.value.data;
        loadedOrders = Array.isArray(d) ? d : d?.orders || [];
      }

      if (usersRes.status === 'fulfilled') {
        const ud = usersRes.value.data;
        const uList = Array.isArray(ud) ? ud : ud?.users || [];
        setUsersList(uList);
      }

      // Convert orders into invoice records
      const orderInvoices: InvoiceRecord[] = loadedOrders.map((ord: any) => {
        const invNum = ord.orderNumber ? `СЧ-${ord.orderNumber.replace(/^[^\d]*-?/, '') || ord.orderNumber}` : `СЧ-${ord.id.slice(0, 8)}`;
        const dateStr = ord.createdAt ? new Date(ord.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
        const total = Number(ord.totalPrice) || 0;
        const unitP = Number(ord.pricePerItem) || (total / Math.max(1, ord.itemsCount || 1));

        return {
          id: `order_inv_${ord.id}`,
          invoiceNumber: invNum,
          date: dateStr,
          orderId: ord.id,
          orderNumber: ord.orderNumber,
          customerName: ord.user?.companyName || 'Заказчик',
          customerBinIin: ord.user?.binIin || '—',
          customerAddress: ord.warehouseAddress || 'г. Алматы',
          customerPhone: ord.user?.phone || '',
          items: [
            {
              id: `item_${ord.id}`,
              name: `Услуги цифровой маркировки товаров (${ord.category || 'Партия'}) по тарифу ${ord.tariffType || 'СТАНДАРТ'}`,
              qty: ord.itemsCount || 1,
              unit: 'шт',
              price: Math.round(unitP * 100) / 100,
              sum: total,
            },
          ],
          totalAmount: total,
          status: ord.status === 'CANCELLED' ? 'CANCELLED' : ord.paymentStatus === 'PAID' ? 'PAID' : 'PENDING',
          createdAt: ord.createdAt || new Date().toISOString(),
        };
      });

      // Load invoices directly from PostgreSQL DB via API
      let dbInvoices: InvoiceRecord[] = [];
      try {
        const invRes = await apiClient.get('/api/invoices');
        const list = invRes.data?.invoices || (Array.isArray(invRes.data) ? invRes.data : []);
        dbInvoices = list.map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          date: inv.date ? new Date(inv.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
          dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().slice(0, 10) : undefined,
          orderId: inv.orderId || undefined,
          orderNumber: inv.orderNumber || undefined,
          customerName: inv.customerName || inv.user?.companyName || 'Заказчик',
          customerBinIin: inv.customerBinIin || inv.user?.binIin || '—',
          customerAddress: inv.customerAddress || 'г. Алматы',
          customerPhone: inv.customerPhone || inv.user?.phone || '',
          items: (inv.items || []).map((it: any) => ({
            id: it.id,
            name: it.name,
            qty: Number(it.quantity || 1),
            unit: it.unit || 'шт',
            price: Number(it.price || 0),
            sum: Number(it.totalPrice || 0),
          })),
          totalAmount: Number(inv.totalAmount || 0),
          status: inv.status || 'PENDING',
          createdAt: inv.createdAt || new Date().toISOString(),
        }));
      } catch (err) {
        console.warn('Failed to load DB invoices:', err);
      }

      // Check for legacy localStorage custom invoices and auto-migrate them to DB
      const localSaved = localStorage.getItem('tanbox_custom_invoices');
      if (localSaved) {
        try {
          const localCustom = JSON.parse(localSaved);
          if (Array.isArray(localCustom) && localCustom.length > 0) {
            for (const item of localCustom) {
              const exists = dbInvoices.some((d) => d.invoiceNumber === item.invoiceNumber);
              if (!exists) {
                try {
                  const created = await apiClient.post('/api/invoices', {
                    invoiceNumber: item.invoiceNumber,
                    date: item.date,
                    customerName: item.customerName,
                    customerBinIin: item.customerBinIin,
                    customerAddress: item.customerAddress,
                    customerPhone: item.customerPhone,
                    status: item.status,
                    items: item.items?.map((it: any) => ({
                      name: it.name,
                      quantity: it.qty,
                      unit: it.unit,
                      price: it.price,
                      totalPrice: it.sum,
                    })),
                  });
                  if (created.data) {
                    dbInvoices.unshift({
                      id: created.data.id,
                      invoiceNumber: created.data.invoiceNumber,
                      date: item.date,
                      customerName: item.customerName,
                      customerBinIin: item.customerBinIin,
                      customerAddress: item.customerAddress,
                      customerPhone: item.customerPhone,
                      items: item.items,
                      totalAmount: item.totalAmount,
                      status: item.status,
                      createdAt: item.createdAt,
                    });
                  }
                } catch (migErr) {
                  console.warn('Migration item failed:', migErr);
                }
              }
            }
            localStorage.removeItem('tanbox_custom_invoices');
          }
        } catch (e) {
          console.warn('Failed to migrate local custom invoices:', e);
        }
      }

      // Filter out orderInvoices that already have a real DB invoice to avoid duplicates
      const nonDuplicatedOrderInvoices = orderInvoices.filter(
        (ordInv) => !dbInvoices.some((dbInv) => dbInv.orderId === ordInv.orderId || dbInv.orderNumber === ordInv.orderNumber)
      );

      // Combine both lists
      const combined = [...dbInvoices, ...nonDuplicatedOrderInvoices].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setInvoices(combined);
    } catch (err) {
      console.error('Failed to load invoices data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    // Automatically assign next sequential invoice number
    const nextSeq = invoices.length + 1;
    const generatedNum = `СЧ-${new Date().getFullYear()}-${String(nextSeq).padStart(4, '0')}`;
    setInvoiceNumberInput(generatedNum);
    setInvoiceDateInput(new Date().toISOString().slice(0, 10));

    // Clear all dummy/placeholder data - strictly empty fields
    setSelectedUserId('');
    setCustomCustomerName('');
    setCustomCustomerBin('');
    setCustomCustomerPhone('');
    setCustomCustomerAddress('г. Алматы');
    setCustomerMode('SELECT');

    // Empty lines - services added explicitly by user
    setCreateLines([]);

    setIsCreateModalOpen(true);
  };

  const handleSelectCustomer = (uId: string) => {
    setSelectedUserId(uId);
    if (!uId) {
      setCustomCustomerName('');
      setCustomCustomerBin('');
      setCustomCustomerPhone('');
      setCustomCustomerAddress('г. Алматы');
      return;
    }
    const found = usersList.find((u) => u.id === uId);
    if (found) {
      setCustomCustomerName(found.companyName || found.name || '');
      setCustomCustomerBin(found.binIin || '');
      setCustomCustomerPhone(found.phone || '');
      setCustomCustomerAddress(found.address || found.warehouseAddress || 'г. Алматы');
    }
  };

  const handleAddCatalogService = (item: { name: string; unit: string; defaultPrice: number }) => {
    const newLine: InvoiceItemLine = {
      id: `line_${Date.now()}_${Math.random()}`,
      name: item.name,
      qty: 1,
      unit: item.unit,
      price: item.defaultPrice,
      sum: item.defaultPrice,
    };
    setCreateLines((prev) => [...prev, newLine]);
  };

  const handleAddCustomLine = () => {
    const newLine: InvoiceItemLine = {
      id: `line_${Date.now()}_${Math.random()}`,
      name: 'Услуга маркировки и технического сопровождения',
      qty: 1,
      unit: 'услуга',
      price: 15000,
      sum: 15000,
    };
    setCreateLines((prev) => [...prev, newLine]);
  };

  const handleUpdateLine = (id: string, field: keyof InvoiceItemLine, val: any) => {
    setCreateLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const updated = { ...l, [field]: val };
        if (field === 'qty' || field === 'price') {
          const qty = field === 'qty' ? Math.max(1, Number(val) || 0) : l.qty;
          const price = field === 'price' ? Math.max(0, Number(val) || 0) : l.price;
          updated.qty = qty;
          updated.price = price;
          updated.sum = Math.round(qty * price);
        }
        return updated;
      })
    );
  };

  const handleDeleteLine = (id: string) => {
    setCreateLines((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));
  };

  const totalCreateSum = createLines.reduce((acc, l) => acc + (l.sum || 0), 0);

  const handleSaveInvoice = async () => {
    try {
      const payload = {
        invoiceNumber: invoiceNumberInput.trim() || undefined,
        date: invoiceDateInput,
        userId: selectedUserId || undefined,
        customerName: customCustomerName.trim() || 'Покупатель',
        customerBinIin: customCustomerBin.trim() || '—',
        customerAddress: customCustomerAddress.trim() || 'г. Алматы',
        customerPhone: customCustomerPhone.trim() || undefined,
        items: createLines.map((l) => ({
          name: l.name,
          quantity: l.qty,
          unit: l.unit,
          price: l.price,
          totalPrice: l.sum,
        })),
        status: 'PENDING',
      };

      const res = await apiClient.post('/api/invoices', payload);
      const created = res.data;

      const newRecord: InvoiceRecord = {
        id: created.id,
        invoiceNumber: created.invoiceNumber,
        date: created.date ? new Date(created.date).toISOString().slice(0, 10) : invoiceDateInput,
        customerName: created.customerName,
        customerBinIin: created.customerBinIin,
        customerAddress: created.customerAddress,
        customerPhone: created.customerPhone || '',
        items: (created.items || []).map((it: any) => ({
          id: it.id,
          name: it.name,
          qty: Number(it.quantity || 1),
          unit: it.unit || 'шт',
          price: Number(it.price || 0),
          sum: Number(it.totalPrice || 0),
        })),
        totalAmount: Number(created.totalAmount || totalCreateSum),
        status: created.status || 'PENDING',
        createdAt: created.createdAt || new Date().toISOString(),
      };

      // Update state
      setInvoices((prev) => [newRecord, ...prev]);
      setIsCreateModalOpen(false);

      // Immediately open for view / print
      setActiveViewInvoice(newRecord);
    } catch (err: any) {
      console.error('Failed to save invoice to DB:', err);
      alert(err.response?.data?.message || 'Ошибка сохранения счета в базе данных');
    }
  };

  const handleSetStatus = async (inv: InvoiceRecord, nextStatus: 'PENDING' | 'PAID' | 'CANCELLED') => {
    const updatedList = invoices.map((item) =>
      item.id === inv.id ? { ...item, status: nextStatus } : item
    );
    setInvoices(updatedList);

    // If it's a real DB invoice, update in PostgreSQL
    if (!inv.id.startsWith('order_inv_')) {
      try {
        await apiClient.patch(`/api/invoices/${inv.id}/status`, { status: nextStatus });
      } catch (e) {
        console.warn('Failed to update invoice status in DB:', e);
      }
    }
  };

  const handleDeleteInvoice = async (invId: string) => {
    if (!window.confirm('Удалить счет на оплату из реестра базы данных?')) return;
    setInvoices((prev) => prev.filter((i) => i.id !== invId));

    if (!invId.startsWith('order_inv_')) {
      try {
        await apiClient.delete(`/api/invoices/${invId}`);
      } catch (e) {
        console.warn('Failed to delete invoice from DB:', e);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printSheetRef.current || !activeViewInvoice) return;
    setDownloadingPdf(true);

    const el = printSheetRef.current;
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Счет_${activeViewInvoice.invoiceNumber}_${activeViewInvoice.date}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    try {
      await (html2pdf as any)().set(opt).from(el).save();
    } catch (err) {
      console.error('PDF export failed:', err);
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Filtered list
  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter !== 'ALL' && inv.status !== statusFilter) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(term) ||
      inv.customerName.toLowerCase().includes(term) ||
      inv.customerBinIin.toLowerCase().includes(term)
    );
  });

  // KPI calculations for all 3 required statuses
  const totalInvoicesCount = invoices.length;
  const totalBilledSum = invoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0);
  const totalPaidSum = invoices
    .filter((i) => i.status === 'PAID')
    .reduce((acc, i) => acc + (i.totalAmount || 0), 0);
  const totalPendingSum = invoices
    .filter((i) => i.status === 'PENDING')
    .reduce((acc, i) => acc + (i.totalAmount || 0), 0);
  const totalCancelledSum = invoices
    .filter((i) => i.status === 'CANCELLED')
    .reduce((acc, i) => acc + (i.totalAmount || 0), 0);

  return (
    <>
      {/* Strict Print-only CSS to fill exactly 1 A4 sheet without gray frames or radiuses */}
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
          aside, header, nav, .no-print, button, input, textarea, select {
            display: none !important;
          }
          main, .print-container-wrapper {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            position: static !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
          }
          .invoice-modal-overlay {
            position: static !important;
            display: block !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
          }
          #official-invoice-print-sheet {
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

      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="no-print">
          <PageHeader
            title="Счета на оплату"
            description="Реестр выставленных счетов, выставление счетов на любые услуги TANBOX и печать официальных бланков РК"
            action={
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-[#0082FB] hover:bg-[#0070DA] text-white flex items-center gap-2 transition-all shadow-md shadow-[#0082FB]/20 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Создать счет на оплату
              </button>
            }
          />
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
          <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Всего счетов в реестре
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-[#111827]">{totalInvoicesCount}</span>
              <span className="text-xs font-bold text-gray-500">счетов</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Ожидает оплаты
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-amber-600">
                {totalPendingSum.toLocaleString()} ₸
              </span>
              <span className="text-[10px] font-extrabold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                В ожидании
              </span>
            </div>
          </div>

          <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Оплачено
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-emerald-600">
                {totalPaidSum.toLocaleString()} ₸
              </span>
              <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                Поступило
              </span>
            </div>
          </div>

          <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Оплата отменена
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-rose-600">
                {totalCancelledSum.toLocaleString()} ₸
              </span>
              <span className="text-[10px] font-extrabold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
                Отменено
              </span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3 flex-1 min-w-[260px]">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Поиск по номеру счета, названию компании или БИН..."
                className="w-full text-xs bg-[#F8FAFC] border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(
              [
                { id: 'ALL', label: 'Все счета' },
                { id: 'PENDING', label: 'Ожидает оплаты' },
                { id: 'PAID', label: 'Оплачено' },
                { id: 'CANCELLED', label: 'Оплата отменена' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${statusFilter === tab.id
                    ? 'bg-[#0082FB] text-white border-[#0082FB] shadow-2xs font-extrabold'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white border border-gray-200/90 rounded-2xl shadow-2xs overflow-hidden no-print">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-gray-200 text-[#475569] font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Номер и дата счета</th>
                  <th className="py-3 px-4">Покупатель / Контрагент</th>
                  <th className="py-3 px-4">Состав услуг</th>
                  <th className="py-3 px-4 text-right">Сумма (₸)</th>
                  <th className="py-3 px-4 text-center">Статус</th>
                  <th className="py-3 px-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-500">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#0082FB]" />
                      Загрузка реестра счетов...
                    </td>
                  </tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-500">
                      Счета не найдены. Нажмите «Создать счет на оплату», чтобы выставить новый счет.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-blue-50/20 transition-colors">
                      {/* Invoice Number & Date */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-extrabold text-[#111827]">{inv.invoiceNumber}</div>
                        <div className="text-[10px] text-gray-500 font-medium">от {inv.date}</div>
                        {inv.orderNumber && (
                          <span className="text-[9px] bg-blue-50 text-[#0082FB] font-semibold px-1.5 py-0.2 rounded mt-1 inline-block">
                            Заказ: {inv.orderNumber}
                          </span>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-bold text-[#111827]">{inv.customerName}</div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          БИН/ИИН: {inv.customerBinIin}
                        </div>
                        {inv.customerPhone && (
                          <div className="text-[10px] text-gray-400">{inv.customerPhone}</div>
                        )}
                      </td>

                      {/* Items lines */}
                      <td className="py-3.5 px-4 align-top max-w-xs">
                        <div className="space-y-1">
                          {inv.items.map((it, idx) => (
                            <div key={idx} className="text-[11px] text-[#334155] line-clamp-1">
                              • {it.name} <span className="text-gray-400">({it.qty} {it.unit})</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Sum */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <div className="font-black text-sm text-[#111827]">
                          {inv.totalAmount.toLocaleString()} ₸
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium">Без НДС</div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 align-top text-center">
                        <select
                          value={inv.status}
                          onChange={(e) =>
                            handleSetStatus(inv, e.target.value as 'PENDING' | 'PAID' | 'CANCELLED')
                          }
                          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none transition-all ${inv.status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : inv.status === 'CANCELLED'
                                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                            }`}
                        >
                          <option value="PENDING">Ожидает оплаты</option>
                          <option value="PAID">Оплачено</option>
                          <option value="CANCELLED">Оплата отменена</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap space-x-1">
                        <button
                          type="button"
                          onClick={() => setActiveViewInvoice(inv)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-[#0082FB] hover:bg-blue-50 transition-all cursor-pointer"
                          title="Просмотр и печать счета"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteInvoice(inv.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                          title="Удалить счет"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL 1: Create Invoice with ALL Tanbox Services */}
        {isCreateModalOpen &&
          createPortal(
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md no-print animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
                {/* Modal Header */}
                <div className="p-4 sm:p-5 border-b border-gray-150 flex items-center justify-between bg-[#F8FAFC]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0082FB] flex items-center justify-center shrink-0">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[#111827] uppercase tracking-wide">
                        Выставление счета на оплату
                      </h3>
                      <p className="text-[11px] text-[#64748B]">
                        Выберите услуги из каталога сайта TANBOX или укажите произвольные позиции
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-5 overflow-y-auto space-y-6">
                  {/* Top row: Number, Date, Customer */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="text-[11px] font-bold text-gray-600 block mb-1">
                        Номер счета
                      </label>
                      <input
                        type="text"
                        value={invoiceNumberInput}
                        readOnly
                        disabled
                        title="Номер присваивается автоматически по порядку"
                        className="w-full text-xs font-black bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 cursor-not-allowed select-none"
                      />
                      <span className="text-[10px] text-gray-400 mt-0.5 block">
                        Присваивается автоматически по порядку
                      </span>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-600 block mb-1">
                        Дата счета
                      </label>
                      <input
                        type="date"
                        value={invoiceDateInput}
                        onChange={(e) => setInvoiceDateInput(e.target.value)}
                        className="w-full text-xs bg-[#F8FAFC] border border-gray-200 rounded-xl px-3 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-600 block mb-1">
                        Тип контрагента
                      </label>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setCustomerMode('SELECT');
                            setSelectedUserId('');
                            setCustomCustomerName('');
                            setCustomCustomerBin('');
                            setCustomCustomerPhone('');
                            setCustomCustomerAddress('г. Алматы');
                          }}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${customerMode === 'SELECT'
                              ? 'bg-blue-50 border-[#0082FB] text-[#0082FB] font-extrabold'
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                          Из базы клиентов
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomerMode('MANUAL');
                            setSelectedUserId('');
                            setCustomCustomerName('');
                            setCustomCustomerBin('');
                            setCustomCustomerPhone('');
                            setCustomCustomerAddress('г. Алматы');
                          }}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${customerMode === 'MANUAL'
                              ? 'bg-blue-50 border-[#0082FB] text-[#0082FB] font-extrabold'
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                          Новый вручную
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Customer selection / input */}
                  <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider block">
                      Реквизиты покупателя (Плательщика)
                    </span>

                    {customerMode === 'SELECT' ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-medium text-gray-500 block mb-1">
                            Выберите организацию из базы клиентов ({usersList.length})
                          </label>
                          <select
                            value={selectedUserId}
                            onChange={(e) => handleSelectCustomer(e.target.value)}
                            className="w-full text-xs font-bold bg-white border border-gray-200 rounded-lg px-3 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                          >
                            <option value="">
                              -- {usersList.length > 0 ? `Выберите клиента из списка (${usersList.length} контрагентов)` : 'Загрузка клиентов...'} --
                            </option>
                            {usersList.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.companyName || u.name || 'Организация'} {u.binIin ? `(БИН/ИИН: ${u.binIin})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        {selectedUserId && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-2.5 bg-white rounded-lg border border-gray-200/80 text-xs">
                            <div>
                              <span className="text-[10px] text-gray-400 block font-semibold">Компания:</span>
                              <span className="font-bold text-[#111827]">{customCustomerName || '—'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-400 block font-semibold">БИН / ИИН:</span>
                              <span className="font-mono font-bold text-[#111827]">{customCustomerBin || '—'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-400 block font-semibold">Телефон:</span>
                              <span className="text-gray-700">{customCustomerPhone || '—'}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] font-medium text-gray-500 block mb-0.5">
                            Наименование компании / ИП
                          </label>
                          <input
                            type="text"
                            value={customCustomerName}
                            onChange={(e) => setCustomCustomerName(e.target.value)}
                            placeholder="ТОО Название компании"
                            className="w-full text-xs font-bold bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#0082FB]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-gray-500 block mb-0.5">
                            БИН / ИИН (12 цифр)
                          </label>
                          <input
                            type="text"
                            value={customCustomerBin}
                            onChange={(e) => setCustomCustomerBin(e.target.value)}
                            placeholder="123456789012"
                            className="w-full text-xs font-mono bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#0082FB]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-gray-500 block mb-0.5">
                            Телефон плательщика
                          </label>
                          <input
                            type="text"
                            value={customCustomerPhone}
                            onChange={(e) => setCustomCustomerPhone(e.target.value)}
                            placeholder="+7 777 000-00-00"
                            className="w-full text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#0082FB]"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Service Selection from Full Tanbox Catalog */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wide text-[#111827]">
                        Добавить услуги из официального каталога TANBOX
                      </span>
                      <button
                        type="button"
                        onClick={handleAddCustomLine}
                        className="text-xs font-bold text-[#0082FB] hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        + Своя строка
                      </button>
                    </div>

                    {/* Service Category Buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-56 overflow-y-auto p-1 bg-gray-50 rounded-xl border border-gray-200">
                      {TANBOX_SERVICES_CATALOG.map((cat, catIdx) => (
                        <div key={catIdx} className="bg-white p-3 rounded-xl border border-gray-150 space-y-2">
                          <span className="text-[10px] font-black uppercase text-[#0082FB] tracking-wider block">
                            {cat.category}
                          </span>
                          <div className="space-y-1">
                            {cat.items.map((svc, sIdx) => (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={() => handleAddCatalogService(svc)}
                                className="w-full text-left p-1.5 rounded-lg hover:bg-blue-50/60 transition-colors flex items-center justify-between gap-2 group text-xs cursor-pointer"
                              >
                                <span className="text-[11px] font-medium text-gray-800 group-hover:text-[#0082FB] line-clamp-1">
                                  + {svc.name}
                                </span>
                                <span className="text-[10px] font-bold text-gray-500 shrink-0">
                                  {svc.defaultPrice.toLocaleString()} ₸
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Invoice Lines Table (Positions) */}
                  <div className="space-y-2">
                    <span className="text-xs font-extrabold uppercase tracking-wide text-[#111827] block">
                      Позиции счёта на оплату
                    </span>

                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-[#F8FAFC] border-b border-gray-200 text-gray-700 font-bold text-[10px] uppercase">
                            <th className="p-2.5 pl-3 w-8">№</th>
                            <th className="p-2.5">Наименование товара / услуги</th>
                            <th className="p-2.5 text-center w-20">Кол-во</th>
                            <th className="p-2.5 text-center w-20">Ед. изм.</th>
                            <th className="p-2.5 text-right w-28">Цена (₸)</th>
                            <th className="p-2.5 text-right w-28">Сумма (₸)</th>
                            <th className="p-2.5 text-center w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-150">
                          {createLines.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-6 text-gray-400 text-xs">
                                Позиции пока не добавлены. Выберите нужные услуги из каталога выше или добавьте свою строку.
                              </td>
                            </tr>
                          ) : (
                            createLines.map((line, idx) => (
                              <tr key={line.id} className="hover:bg-gray-50/50">
                                <td className="p-2.5 pl-3 text-gray-400 font-mono text-center">
                                  {idx + 1}
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={line.name}
                                    onChange={(e) => handleUpdateLine(line.id, 'name', e.target.value)}
                                    className="w-full text-xs font-medium bg-white border border-gray-200 rounded px-2 py-1 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    min={1}
                                    value={line.qty}
                                    onChange={(e) => handleUpdateLine(line.id, 'qty', e.target.value)}
                                    className="w-full text-center text-xs font-bold bg-white border border-gray-200 rounded px-1.5 py-1"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={line.unit}
                                    onChange={(e) => handleUpdateLine(line.id, 'unit', e.target.value)}
                                    className="w-full text-center text-xs bg-white border border-gray-200 rounded px-1 py-1"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    min={0}
                                    value={line.price}
                                    onChange={(e) => handleUpdateLine(line.id, 'price', e.target.value)}
                                    className="w-full text-right text-xs font-bold bg-white border border-gray-200 rounded px-2 py-1 text-[#111827]"
                                  />
                                </td>
                                <td className="p-2.5 text-right font-black text-xs text-[#111827]">
                                  {line.sum.toLocaleString()} ₸
                                </td>
                                <td className="p-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLine(line.id)}
                                    className="text-gray-400 hover:text-red-600 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Subtotal & Amount in words preview */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl gap-2">
                      <div className="text-[11px] text-gray-600">
                        <span className="font-semibold block text-gray-800">
                          Сумма прописью:
                        </span>
                        {numberToWordsRu(totalCreateSum)}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] text-gray-500 uppercase block font-semibold">Итого к оплате:</span>
                        <span className="text-lg font-black text-[#0082FB]">
                          {totalCreateSum.toLocaleString()} ₸
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-gray-200 bg-[#F8FAFC] flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveInvoice}
                    disabled={createLines.length === 0}
                    className="px-5 py-2 rounded-xl text-xs font-extrabold bg-[#0082FB] hover:bg-[#0070DA] disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-md shadow-[#0082FB]/20 cursor-pointer"
                  >
                    Сформировать счет на оплату
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* MODAL 2: Official Printable Kazakh 1C Invoice (Full-width clean sheet) */}
        {activeViewInvoice &&
          createPortal(
            <div className="invoice-modal-overlay fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150 print:p-0 print:bg-white print:static print:block print:inset-auto print:z-auto print:backdrop-blur-none">
              <div className="print-container-wrapper bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[96vh] flex flex-col overflow-hidden">
                {/* Top Bar with Print & Download */}
                <div className="p-3 sm:p-4 border-b border-gray-150 flex items-center justify-between bg-[#F8FAFC] no-print">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#0082FB]" />
                    <span className="text-xs font-black text-gray-900 uppercase">
                      Счет на оплату № {activeViewInvoice.invoiceNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      disabled={downloadingPdf}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-gray-500" />
                      {downloadingPdf ? 'Генерация...' : 'Скачать PDF'}
                    </button>

                    <button
                      type="button"
                      onClick={handlePrint}
                      className="px-4 py-1.5 rounded-lg text-xs font-extrabold bg-[#0082FB] text-white hover:bg-[#0070DA] flex items-center gap-1.5 shadow-sm shadow-blue-500/20 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Печать бланка
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveViewInvoice(null)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-200 ml-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Document Body (Strictly styled like standard Kazakh 1C Invoice) */}
                <div className="overflow-y-auto p-4 sm:p-8 bg-gray-100/50 print:p-0 print:bg-white flex justify-center">
                  <div
                    id="official-invoice-print-sheet"
                    ref={printSheetRef}
                    className="w-full bg-white text-black p-6 sm:p-8 space-y-4 max-w-[210mm] text-[10pt] font-sans leading-normal print:p-0 print:max-w-none box-border"
                  >
                    {/* Warning header */}
                    <div className="border border-gray-300 p-2.5 text-[8.5pt] text-gray-700 leading-snug">
                      Внимание! Оплата данного счета означает согласие с условиями оказания услуг по цифровой маркировке товаров.<br />
                      Уведомление об оплате обязательно, в противном случае не гарантируется сохранение сроков выполнения.
                    </div>

                    {/* Bank Details Table */}
                    <table className="w-full border-collapse border border-black text-[9pt]">
                      <tbody>
                        <tr>
                          <td colSpan={2} className="border border-black p-1.5 align-top w-[65%]">
                            АО «Kaspi Bank», г. Алматы<br />
                            <span className="text-[7.5pt] text-gray-500">Банк получателя</span>
                          </td>
                          <td className="border border-black p-1.5 align-top w-[15%]">БИК</td>
                          <td className="border border-black p-1.5 align-top w-[20%] font-bold font-mono">CASPKZKA</td>
                        </tr>
                        <tr>
                          <td colSpan={2} className="border border-black p-1.5"></td>
                          <td className="border border-black p-1.5">ИИК</td>
                          <td className="border border-black p-1.5 font-bold font-mono">KZ58722S000055787378</td>
                        </tr>
                        <tr>
                          <td className="border border-black p-1.5 w-[15%]">ИИН / БИН</td>
                          <td className="border border-black p-1.5 font-bold font-mono w-[50%]">990601301525</td>
                          <td className="border border-black p-1.5">КБе</td>
                          <td className="border border-black p-1.5 font-bold font-mono">19</td>
                        </tr>
                        <tr>
                          <td colSpan={2} className="border border-black p-1.5 align-top">
                            <strong>ИП INTERSENSE</strong><br />
                            <span className="text-[7.5pt] text-gray-500">Получатель</span>
                          </td>
                          <td colSpan={2} className="border border-black p-1.5"></td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Document Title */}
                    <div className="border-b-2 border-black pb-1.5 pt-2 text-base font-bold">
                      Счет на оплату № {activeViewInvoice.invoiceNumber} от {activeViewInvoice.date} г.
                    </div>

                    {/* Parties details */}
                    <table className="w-full text-[9pt] border-collapse">
                      <tbody>
                        <tr>
                          <td className="w-24 font-bold align-top py-0.5">Поставщик:</td>
                          <td className="py-0.5">
                            <strong>ИП INTERSENSE, ИИН 990601301525</strong>, тел.: +7 (700) 304-85-32, email: sales@tanbox.kz
                          </td>
                        </tr>
                        <tr>
                          <td className="font-bold align-top py-0.5">Покупатель:</td>
                          <td className="py-0.5">
                            <strong>{activeViewInvoice.customerName}, БИН/ИИН {activeViewInvoice.customerBinIin}</strong>
                            {activeViewInvoice.customerAddress ? `, ${activeViewInvoice.customerAddress}` : ''}
                            {activeViewInvoice.customerPhone ? `, тел.: ${activeViewInvoice.customerPhone}` : ''}
                          </td>
                        </tr>
                        <tr>
                          <td className="font-bold align-top py-0.5">Договор:</td>
                          <td className="py-0.5">
                            Публичный договор-оферта на оказание услуг цифровой маркировки от {activeViewInvoice.date} г.
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Items Table */}
                    <table className="w-full border-collapse border-2 border-black text-[8.5pt]">
                      <thead>
                        <tr className="bg-gray-100 font-bold border-b border-black text-center">
                          <th className="border border-black p-1.5 w-7">№</th>
                          <th className="border border-black p-1.5 text-left">Товары (работы, услуги)</th>
                          <th className="border border-black p-1.5 w-14">Кол-во</th>
                          <th className="border border-black p-1.5 w-10">Ед.</th>
                          <th className="border border-black p-1.5 w-24">Цена</th>
                          <th className="border border-black p-1.5 w-28">Сумма</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeViewInvoice.items.map((it, idx) => (
                          <tr key={it.id || idx}>
                            <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                            <td className="border border-black p-1.5 text-left font-medium">{it.name}</td>
                            <td className="border border-black p-1.5 text-right font-mono">{it.qty}</td>
                            <td className="border border-black p-1.5 text-center">{it.unit}</td>
                            <td className="border border-black p-1.5 text-right font-mono">{it.price.toLocaleString()} ₸</td>
                            <td className="border border-black p-1.5 text-right font-bold font-mono">{it.sum.toLocaleString()} ₸</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Totals */}
                    <div className="space-y-1 text-[9pt]">
                      <div className="flex justify-end gap-6 font-bold">
                        <span>Итого:</span>
                        <span className="font-mono w-28 text-right">{activeViewInvoice.totalAmount.toLocaleString()} ₸</span>
                      </div>
                      <div className="flex justify-end gap-6 font-bold text-gray-700">
                        <span>В том числе НДС:</span>
                        <span className="w-28 text-right">Без НДС</span>
                      </div>
                    </div>

                    {/* Amount in words */}
                    <div className="border-t border-black pt-2 text-[9pt] space-y-0.5">
                      <div>Всего наименований {activeViewInvoice.items.length}, на сумму {activeViewInvoice.totalAmount.toLocaleString()} теңге</div>
                      <div><strong>Всего к оплате: {numberToWordsRu(activeViewInvoice.totalAmount)}</strong></div>
                    </div>

                    {/* Signatures */}
                    <div className="pt-6 border-t-2 border-black flex items-center justify-between text-[9pt] font-bold">
                      <div>Исполнитель</div>
                      <div className="flex items-center gap-4">
                        <div className="w-44 border-b border-black"></div>
                        <div>/ИП INTERSENSE/</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}
      </div>
    </>
  );
};
