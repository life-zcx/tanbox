import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { OrderItem } from '../types';
import { StatusBadge, parseOrderNotes } from '@shared';
import { getCategoryLabel } from '../data/categories';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Download,
  FileText,
  CheckCircle2,
  Clock,
  Building2,
  AlertCircle,
  Check,
  FileCheck,
  Layers,
  Tag,
  Eye,
  Palette,
  X,
  Printer,
  Upload,
  AlertTriangle,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { StickerCanvasPreview } from '../components/common/StickerCanvasPreview';
import RollSplitModal from '../components/modals/RollSplitModal';

interface StepConfig {
  key: string;
  title: string;
  desc: string;
}

const TARIFF_STEPS: Record<string, StepConfig[]> = {
  DIGITAL: [
    { key: 'NEW', title: 'Создан', desc: 'Оформлен в системе' },
    { key: 'PROCESSING', title: 'В обработке', desc: 'Заказ кодов в ИС Танба / ГС1' },
    { key: 'PRINTING', title: 'Эмиссия кодов', desc: 'Генерация кодов Data Matrix' },
    { key: 'STICKERING', title: 'Формирование файлов', desc: 'Подготовка PDF и CSV' },
    { key: 'COMPLETED', title: 'Готов к выгрузке', desc: 'Файлы доступны для скачивания' },
  ],
  PRINT: [
    { key: 'NEW', title: 'Создан', desc: 'Оформлен в системе' },
    { key: 'PROCESSING', title: 'В обработке', desc: 'Проверка ИС Танба' },
    { key: 'PRINTING', title: 'Печать рулонов', desc: 'Термотрансферная печать 58×40' },
    { key: 'STICKERING', title: 'Упаковка партии', desc: 'Контроль и упаковка рулонов' },
    { key: 'COMPLETED', title: 'Готов к выдаче', desc: 'Рулоны готовы к отгрузке' },
  ],
  STANDARD: [
    { key: 'NEW', title: 'Создан', desc: 'Оформлен в системе' },
    { key: 'PROCESSING', title: 'В обработке', desc: 'Проверка ИС Танба' },
    { key: 'PRINTING', title: 'Печать кодов', desc: 'Печать этикеток партии' },
    { key: 'STICKERING', title: 'Стикеровка', desc: 'Оклейка товаров на складе' },
    { key: 'COMPLETED', title: 'Выполнен', desc: 'Ввод в оборот и отчетность' },
  ],
  PRO: [
    { key: 'NEW', title: 'Создан', desc: 'Оформлен в системе' },
    { key: 'PROCESSING', title: 'Сверка и приемка', desc: 'Сверка артикулов и брак-контроль' },
    { key: 'PRINTING', title: 'Печать и стикеровка', desc: 'Маркировка единиц товара' },
    { key: 'STICKERING', title: 'SSCC Агрегация', desc: 'Формирование коробов и паллет' },
    { key: 'COMPLETED', title: 'Выполнен', desc: 'Партия агрегирована в Танба' },
  ],
};

const TARIFF_NAMES: Record<string, string> = {
  DIGITAL: 'Цифровой',
  PRINT: 'Печатный',
  STANDARD: 'Стандарт',
  PRO: 'PRO Склад',
};

const getTariffKey = (t?: string): string => {
  if (!t) return 'STANDARD';
  const norm = t.toUpperCase().trim();
  if (norm.includes('DIGITAL') || norm.includes('ЦИФР')) return 'DIGITAL';
  if (norm.includes('PRINT') || norm.includes('ПЕЧАТ')) return 'PRINT';
  if (norm.includes('PRO') || norm.includes('ПРО')) return 'PRO';
  return 'STANDARD';
};

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sticker approval states (must be declared before any early returns)
  type ApprovalStatus = 'IN_DESIGN' | 'WAITING_APPROVAL' | 'APPROVED' | 'CHANGES_REQUESTED';

  const [showStickerModal, setShowStickerModal] = useState<boolean>(false);
  const [designerLabel, setDesignerLabel] = useState<any>(null);
  const [showRevisionInput, setShowRevisionInput] = useState<boolean>(false);
  const [revisionComment, setRevisionComment] = useState<string>('');

  // Codes file upload state
  const [uploadingCodes, setUploadingCodes] = useState<boolean>(false);
  const [downloadingCodes, setDownloadingCodes] = useState<boolean>(false);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const [printingSample, setPrintingSample] = useState<boolean>(false);
  const [codesSuccessMsg, setCodesSuccessMsg] = useState<string | null>(null);
  const [isCodesDragOver, setIsCodesDragOver] = useState<boolean>(false);
  const codesFileInputRef = useRef<HTMLInputElement>(null);

  // Roll splitting modal state
  const [showRollModal, setShowRollModal] = useState<boolean>(false);

  // Codes discrepancy & adjustment state
  const [codesSummary, setCodesSummary] = useState<{ totalRows: number; fileName: string } | null>(null);
  const [adjustingCount, setAdjustingCount] = useState<boolean>(false);
  const [adjustSuccessMsg, setAdjustSuccessMsg] = useState<string | null>(null);

  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>(() => {
    try {
      if (id) {
        const saved = localStorage.getItem(`tanbox_sticker_approval_${id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.status) return parsed.status;
        }
      }
    } catch {}
    return 'IN_DESIGN';
  });

  const [approvalData, setApprovalData] = useState<{
    approvedAt?: string;
    comment?: string;
  }>(() => {
    try {
      if (id) {
        const saved = localStorage.getItem(`tanbox_sticker_approval_${id}`);
        if (saved) return JSON.parse(saved);
      }
    } catch {}
    return {};
  });

  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await apiClient.get(`/orders/${id}`);
        setOrder(res.data);
        setError(null);
      } catch (err: any) {
        // Fallback: try fetching all orders and finding by id if single GET fails
        try {
          const listRes = await apiClient.get('/orders');
          const found = (listRes.data as OrderItem[]).find((o) => o.id === id || o.orderNumber === id);
          if (found) {
            setOrder(found);
            setError(null);
          } else {
            setError('Заказ не найден');
          }
        } catch {
          setError('Не удалось загрузить данные заказа');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [id]);

  // Load custom label and approval state directly from database order record
  useEffect(() => {
    if (!order) return;

    // Check DB sticker layout
    const dbLayout = (order as any).stickerLayout;
    if (dbLayout?.elements && Array.isArray(dbLayout.elements) && dbLayout.elements.length > 0) {
      setDesignerLabel(dbLayout);
    } else {
      try {
        const saved =
          localStorage.getItem(`tanbox_order_label_${order.id}`) ||
          localStorage.getItem(`tanbox_order_label_${order.orderNumber}`);
        if (saved) {
          setDesignerLabel(JSON.parse(saved));
        }
      } catch {}
    }

    // Check DB approval status
    const dbApproval = (order as any).stickerApprovalStatus;
    if (dbApproval) {
      setApprovalStatus(dbApproval as ApprovalStatus);
      setApprovalData({
        approvedAt: (order as any).stickerSentAt
          ? new Date((order as any).stickerSentAt).toLocaleString('ru-RU')
          : undefined,
        comment: (order as any).stickerApprovalNotes || undefined,
      });
    } else {
      try {
        const savedApproval =
          localStorage.getItem(`tanbox_sticker_approval_${order.id}`) ||
          localStorage.getItem(`tanbox_sticker_approval_${order.orderNumber}`);
        if (savedApproval) {
          const parsed = JSON.parse(savedApproval);
          if (parsed.status) setApprovalStatus(parsed.status);
          setApprovalData(parsed);
        }
      } catch {}
    }
  }, [order]);

  // Load codes summary to detect count discrepancies
  useEffect(() => {
    if (!order?.id || !order.codesFileUrl) {
      setCodesSummary(null);
      return;
    }
    apiClient
      .get(`/orders/${order.id}/codes-content`)
      .then((res) => {
        if (res.data && res.data.totalRows !== undefined) {
          setCodesSummary({
            totalRows: res.data.totalRows,
            fileName: res.data.fileName || order.codesFileName || 'codes.csv',
          });
        }
      })
      .catch((err) => {
        console.warn('Could not fetch codes summary:', err);
      });
  }, [order?.id, order?.codesFileUrl]);

  const handleAdjustOrderCount = async (newCount: number) => {
    if (!order) return;
    setAdjustingCount(true);
    try {
      const res = await apiClient.patch(`/orders/${order.id}/adjust-count`, {
        itemsCount: newCount,
      });
      setOrder(res.data.order);
      setAdjustSuccessMsg(res.data.message || `Объем заказа успешно скорректирован до ${newCount.toLocaleString()} шт.`);
      setTimeout(() => setAdjustSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error('Adjust order count error:', err);
      alert(err.response?.data?.message || 'Ошибка при корректировке объема заказа');
    } finally {
      setAdjustingCount(false);
    }
  };

  // Parse structured requirements from notes
  const labelRequirements = useMemo(() => {
    if (!order || !order.notes) return null;
    const startTag = '=== ТРЕБОВАНИЯ К МАКЕТУ СТИКЕРА ===';
    const endTag = '===================================';
    if (!order.notes.includes(startTag)) return null;

    try {
      const chunk = order.notes.split(startTag)[1].split(endTag)[0];
      const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean);

      const getVal = (...prefixes: string[]) => {
        for (const prefix of prefixes) {
          const match = lines.find((l) => l.startsWith(prefix));
          if (match) {
            const val = match.replace(prefix, '').trim();
            if (val) return val;
          }
        }
        return '';
      };

      return {
        size: getVal('Размер этикетки:', 'Размер:') || '58×40 мм',
        productName: getVal('Наименование товара:', 'Товар:'),
        brand: getVal('Бренд:'),
        article: getVal('Артикул:'),
        composition: getVal('Состав/Материал:', 'Состав:'),
        symbols: getVal('Обязательные знаки:', 'Знаки:'),
        wishes: getVal('Пожелания:', 'Пожелания/текст:'),
      };
    } catch {
      return null;
    }
  }, [order]);

  // Active layout from DB or local storage
  const activeLayout = (order as any)?.stickerLayout || designerLabel;
  const layoutElements = useMemo(() => {
    if (activeLayout?.elements && Array.isArray(activeLayout.elements)) {
      return activeLayout.elements;
    }
    return [];
  }, [activeLayout]);

  const { layoutWidthMm, layoutHeightMm } = useMemo(() => {
    let w = activeLayout?.widthMm;
    let h = activeLayout?.heightMm;

    if (!w || !h) {
      if (labelRequirements?.size) {
        const parts = labelRequirements.size.match(/(\d+)\s*[×x*]\s*(\d+)/);
        if (parts) {
          w = parseInt(parts[1], 10);
          h = parseInt(parts[2], 10);
        }
      }
    }

    return {
      layoutWidthMm: w || 58,
      layoutHeightMm: h || 40,
    };
  }, [activeLayout, labelRequirements]);

  const stickerPreviewData = useMemo(() => ({
    brand: labelRequirements?.brand || order?.user?.companyName || 'БРЕНД',
    productName: labelRequirements?.productName || getCategoryLabel(order?.category || 'OTHER'),
    name: labelRequirements?.productName || getCategoryLabel(order?.category || 'OTHER'),
    article: labelRequirements?.article || order?.orderNumber || '',
    sku: labelRequirements?.article || order?.orderNumber || '',
    composition: labelRequirements?.composition || '',
    code: '0104870000000000215abcd1234591ffd092testcode',
    gtin: '04870000000000',
    serial: '5abcd12345',
  }), [labelRequirements, order]);

  const hasLayoutReady = Boolean(
    approvalStatus === 'WAITING_APPROVAL' ||
    approvalStatus === 'APPROVED' ||
    approvalStatus === 'CHANGES_REQUESTED' ||
    layoutElements.length > 0
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#64748B] hover:text-[#111827] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Вернуться к списку заказов
        </Link>
        <div className="bg-white border border-gray-200/80 rounded-2xl p-12 text-center text-[#64748B] font-bold">
          Загрузка информации о заказе...
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-6">
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#64748B] hover:text-[#111827] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Вернуться к списку заказов
        </Link>
        <div className="bg-white border border-gray-200/80 rounded-2xl p-12 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-lg font-bold text-[#111827]">{error || 'Заказ не найден'}</h3>
          <button
            onClick={() => navigate('/orders')}
            className="inline-flex items-center gap-2 bg-[#0082FB] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl hover:bg-[#0070DA] transition-all"
          >
            Вернуться в реестр заказов
          </button>
        </div>
      </div>
    );
  }

  // Check if order contains custom sticker layout design or uses a saved template
  const isStickerDesign = Boolean(
    order.extraServices?.includes('STICKER_LAYOUT_DESIGN') ||
    order.notes?.includes('ТРЕБОВАНИЯ К МАКЕТУ СТИКЕРА') ||
    order.notes?.includes('МАКЕТ ЭТИКЕТКИ: ИСПОЛЬЗОВАН СОХРАНЁННЫЙ ШАБЛОН') ||
    (order as any)?.templateId ||
    ((order as any)?.stickerLayout?.elements?.length > 0)
  );

  const isReusedTemplate = Boolean(
    (order as any)?.templateId ||
    order.notes?.includes('МАКЕТ ЭТИКЕТКИ: ИСПОЛЬЗОВАН СОХРАНЁННЫЙ ШАБЛОН')
  );

  const handleApproveSticker = async () => {
    try {
      await apiClient.patch(`/orders/${order.id}/sticker-approval`, {
        approvalStatus: 'APPROVED',
      });
      const data = {
        status: 'APPROVED' as ApprovalStatus,
        approvedAt: new Date().toLocaleString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      setApprovalStatus('APPROVED');
      setApprovalData(data);
      setShowRevisionInput(false);
      try {
        localStorage.setItem(`tanbox_sticker_approval_${id}`, JSON.stringify(data));
      } catch {}
      alert('Макет успешно утвержден и сохранён в вашу библиотеку для повторных заказов!');
    } catch (err: any) {
      alert('Ошибка при согласовании макета: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionComment.trim()) return;
    try {
      await apiClient.patch(`/orders/${order.id}/sticker-approval`, {
        approvalStatus: 'CHANGES_REQUESTED',
        comment: revisionComment.trim(),
      });
      const data = {
        status: 'CHANGES_REQUESTED' as ApprovalStatus,
        comment: revisionComment.trim(),
      };
      setApprovalStatus('CHANGES_REQUESTED');
      setApprovalData(data);
      setShowRevisionInput(false);
      try {
        localStorage.setItem(`tanbox_sticker_approval_${id}`, JSON.stringify(data));
      } catch {}
    } catch (err: any) {
      alert('Ошибка при отправке правок: ' + (err.response?.data?.message || err.message));
    }
  };

  const processCodesFile = async (file: File) => {
    if (!file || !order) return;
    setUploadingCodes(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await apiClient.post(`/orders/${order.id}/upload-codes`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setOrder(res.data.order);
      setCodesSuccessMsg('Файл с кодами маркировки успешно прикреплен к заказу!');
      setTimeout(() => setCodesSuccessMsg(null), 4000);
    } catch (err: any) {
      alert('Ошибка при загрузке файла кодов: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingCodes(false);
    }
  };

  const handleUploadCodesFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processCodesFile(file);
    }
    e.target.value = '';
  };

  const handleCodesDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    if (!isCodesDragOver) setIsCodesDragOver(true);
  };

  const handleCodesDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    if (!isCodesDragOver) setIsCodesDragOver(true);
  };

  const handleCodesDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsCodesDragOver(false);
  };

  const handleCodesDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCodesDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processCodesFile(file);
    }
  };

  const handleDownloadCodesFile = async () => {
    if (!order || !order.codesFileUrl) return;
    setDownloadingCodes(true);
    try {
      const res = await apiClient.get(`/orders/${order.id}/codes-file`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data]);
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', order.codesFileName || 'codes.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      console.error('Download codes error:', err);
      const token = localStorage.getItem('tanbox_token') || localStorage.getItem('tanbox_admin_token') || '';
      window.open(`/api/orders/${order.id}/codes-file?token=${encodeURIComponent(token)}`, '_blank');
    } finally {
      setDownloadingCodes(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!order) return;
    if (!canPrintBatch) {
      alert(printBlockReason || 'Печать партии заблокирована.');
      return;
    }
    setDownloadingPdf(true);
    try {
      const res = await apiClient.get(`/orders/${order.id}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `Labels_${order.orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      console.error('Download PDF error:', err);
      let errMsg = 'Ошибка при скачивании PDF файла.';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json.message) errMsg = json.message;
        } catch {}
      } else if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      }
      alert(errMsg);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadAct = async () => {
    if (!order) return;
    try {
      const res = await apiClient.get(`/orders/${order.id}/act`);
      const win = window.open('', '_blank');
      if (win) {
        win.document.open();
        win.document.write(res.data);
        win.document.close();
      } else {
        const token = localStorage.getItem('tanbox_token') || localStorage.getItem('tanbox_admin_token') || '';
        window.open(`/api/orders/${order.id}/act?token=${encodeURIComponent(token)}`, '_blank');
      }
    } catch (err: any) {
      console.error('Download act error:', err);
      const token = localStorage.getItem('tanbox_token') || localStorage.getItem('tanbox_admin_token') || '';
      window.open(`/api/orders/${order.id}/act?token=${encodeURIComponent(token)}`, '_blank');
    }
  };

  const handlePrintSample = async () => {
    if (!order) return;
    setPrintingSample(true);
    try {
      const res = await apiClient.get(`/orders/${order.id}/pdf?sample=true`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (err: any) {
      console.error('Print sample error:', err);
      let errMsg = 'Ошибка при печати тестового образца.';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json.message) errMsg = json.message;
        } catch {}
      } else if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      }
      alert(errMsg);
    } finally {
      setPrintingSample(false);
    }
  };

  const labelWidth = order?.stickerWidth || (order?.stickerLayout as any)?.widthMm || 58;
  const labelHeight = order?.stickerHeight || (order?.stickerLayout as any)?.heightMm || 40;

  // Print Batch Permissions:
  // Requires: 1) Layout approved by client AND 2) Admin granted permission (e.g. payment confirmed)
  const isApprovedByClient = approvalStatus === 'APPROVED' || order?.stickerApprovalStatus === 'APPROVED';
  const isPrintAllowedByAdmin = order?.printAllowed === true || order?.paymentStatus === 'PAID';
  const canPrintBatch = isApprovedByClient && isPrintAllowedByAdmin;

  let printBlockReason = '';
  if (!isApprovedByClient) {
    printBlockReason = 'Печать партии заблокирована: сначала согласуйте макет этикетки в блоке выше.';
  } else if (!isPrintAllowedByAdmin) {
    printBlockReason = 'Макет согласован! Ожидается подтверждение оплаты администратором для открытия доступа к печати партии.';
  }

  const isLayoutApproved = isApprovedByClient;
  const isWaitingApproval = approvalStatus === 'WAITING_APPROVAL' || order?.stickerApprovalStatus === 'WAITING_APPROVAL';
  const isChangesRequested = approvalStatus === 'CHANGES_REQUESTED' || order?.stickerApprovalStatus === 'CHANGES_REQUESTED';
  const isOrderCompleted = order?.status === 'COMPLETED';

  const tariffKey = getTariffKey(order.tariffType);
  const baseSteps = TARIFF_STEPS[tariffKey] || TARIFF_STEPS.STANDARD;

  // If custom layout design is requested, adapt the stages to include design/approval step
  const STEPS = isStickerDesign
    ? [
        { key: 'NEW', title: 'Создан', desc: 'Оформлен в системе' },
        {
          key: 'PROCESSING',
          title: approvalStatus === 'IN_DESIGN' ? 'Разработка макета' : 'Согласование макета',
          desc:
            approvalStatus === 'APPROVED'
              ? 'Макет утвержден'
              : approvalStatus === 'CHANGES_REQUESTED'
              ? 'Правки в работе'
              : approvalStatus === 'WAITING_APPROVAL'
              ? 'Ожидает согласования'
              : 'Дизайнер готовит макет',
        },
        baseSteps[2] || { key: 'PRINTING', title: 'Печать кодов', desc: 'Печать этикеток партии' },
        baseSteps[3] || { key: 'STICKERING', title: 'Стикеровка', desc: 'Оклейка товаров на складе' },
        { key: 'COMPLETED', title: 'Выполнен', desc: 'Партия готова и сдана в Танба' },
      ]
    : baseSteps;

  const getStepIndex = (st: string) => {
    switch (st) {
      case 'NEW':
        return 0;
      case 'PROCESSING':
        return 1;
      case 'PRINTING':
        return 2;
      case 'STICKERING':
        return 3;
      case 'COMPLETED':
        return 4;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(order.status);

  // Try retrieving user warehouses from localStorage
  let defaultWarehouse = '';
  try {
    const rawWh = localStorage.getItem('tanbox_warehouses');
    if (rawWh) {
      const whList = JSON.parse(rawWh);
      if (Array.isArray(whList) && whList.length > 0) {
        defaultWarehouse = whList[0].address || whList[0].name;
      }
    }
  } catch (e) {}

  return (
    <div className="space-y-6 w-full pb-16">
      
      {/* Top Breadcrumb */}
      <div>
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#64748B] hover:text-[#111827] transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Вернуться к списку заказов</span>
        </Link>
      </div>

      {/* Main Order Header Block */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-black text-[#111827] tracking-tight">{order.orderNumber}</h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-[#64748B] flex items-center gap-2">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                Создан: {new Date(order.createdAt).toLocaleDateString('ru-RU')} в {new Date(order.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span>•</span>
              <span>Категория: <strong className="text-[#111827]">{getCategoryLabel(order.category)}</strong></span>
            </p>
          </div>
        </div>
      </div>

      {/* Connected Order Lifecycle Stepper */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#0082FB]" /> Этапы исполнения заказа
            </h2>
            <span className="text-[11px] font-bold text-[#0082FB] bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200/70">
              Тариф: {TARIFF_NAMES[tariffKey] || order.tariffType}
            </span>
          </div>
          <span className="text-xs font-bold text-[#64748B]">
            Шаг {currentStepIdx + 1} из {STEPS.length}: <span className="text-[#0082FB]">{STEPS[currentStepIdx]?.title}</span>
          </span>
        </div>

        {/* Stepper Track */}
        <div className="pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative">
            {STEPS.map((step, idx) => {
              const isDone = idx < currentStepIdx || order.status === 'COMPLETED';
              const isCurrent = idx === currentStepIdx && order.status !== 'COMPLETED';

              return (
                <div
                  key={step.key}
                  className={`relative p-4 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-blue-50/60 border-[#0082FB] ring-1 ring-[#0082FB]'
                      : isDone
                      ? 'bg-emerald-50/50 border-emerald-200/80'
                      : 'bg-gray-50/40 border-gray-200/70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                        isDone
                          ? 'bg-emerald-500 text-white'
                          : isCurrent
                          ? 'bg-[#0082FB] text-white ring-2 ring-blue-200'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isCurrent
                          ? 'text-[#0082FB]'
                          : isDone
                          ? 'text-emerald-700'
                          : 'text-gray-400'
                      }`}
                    >
                      {isCurrent ? 'Текущий' : isDone ? 'Готово' : 'Ожидает'}
                    </span>
                  </div>

                  <h3 className="text-xs font-extrabold text-[#111827]">{step.title}</h3>
                  <p className="text-[11px] text-[#64748B] mt-0.5">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main 2-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Specification & Documents (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Order Specification Card */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-sm font-extrabold text-[#111827]">Спецификация партии маркировки</h2>
              <p className="text-xs text-[#64748B] mt-0.5">Параметры товарной группы и тарифа исполнения</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 bg-gray-50/70 rounded-xl border border-gray-200/70">
                <span className="text-[11px] font-bold text-[#64748B] uppercase block">Категория</span>
                <span className="text-sm font-extrabold text-[#111827] mt-1 block truncate">
                  {getCategoryLabel(order.category)}
                </span>
              </div>

              <div className="p-3.5 bg-gray-50/70 rounded-xl border border-gray-200/70">
                <span className="text-[11px] font-bold text-[#64748B] uppercase block">Тариф</span>
                <span className="text-sm font-extrabold text-[#111827] mt-1 block truncate">
                  {TARIFF_NAMES[tariffKey] || order.tariffType}
                </span>
              </div>

              <div className="p-3.5 bg-gray-50/70 rounded-xl border border-gray-200/70">
                <span className="text-[11px] font-bold text-[#64748B] uppercase block">Объем партии</span>
                <span className="text-sm font-extrabold text-[#111827] mt-1 block">
                  {order.itemsCount.toLocaleString()} шт.
                </span>
              </div>

              <div className="p-3.5 bg-gray-50/70 rounded-xl border border-gray-200/70">
                <span className="text-[11px] font-bold text-[#64748B] uppercase block">Цена за 1 шт</span>
                <span className="text-sm font-extrabold text-[#111827] mt-1 block">
                  {order.pricePerItem} ₸
                </span>
              </div>
            </div>

            {/* Extra Options */}
            <div className="pt-2 border-t border-gray-100">
              <span className="text-xs font-bold text-[#111827] uppercase tracking-wider block mb-2.5">
                Подключенные опции
              </span>
              <div className="flex flex-wrap gap-2">
                {order.extraServices && order.extraServices.length > 0 ? (
                  order.extraServices.map((srv, i) => {
                    const SERVICE_NAMES: Record<string, string> = {
                      ON_SITE_STICKERING: 'Стикеровка на складе',
                      STICKER_LAYOUT_DESIGN: 'Разработка макета стикера',
                      URGENT_PROCESSING: 'Срочное исполнение (24ч)',
                      EXPRESS_DELIVERY: 'Экспресс-доставка рулонов',
                      SSCC_AGGREGATION: 'SSCC Агрегация коробов',
                    };
                    return (
                      <span
                        key={i}
                        className="text-xs font-bold bg-gray-50 text-[#111827] px-3 py-1.5 rounded-lg border border-gray-200/80"
                      >
                        {SERVICE_NAMES[srv] || srv}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-[#64748B]">Дополнительные опции не выбирались</span>
                )}

                {order.ssccNeeded && (
                  <span className="text-xs font-bold bg-blue-50 text-[#0082FB] border border-blue-200/80 px-3 py-1.5 rounded-lg">
                    SSCC Агрегация коробов
                  </span>
                )}
              </div>
            </div>

            {/* Warehouse Address & Client Notes */}
            {order.notes && (() => {
              const parsed = parseOrderNotes(order.notes);
              if (!parsed.address && !parsed.clientNote) return null;

              return (
                <div className="pt-3 border-t border-gray-100 text-xs space-y-3">
                  {parsed.address && (
                    <div className="space-y-1">
                      <span className="text-[#64748B] font-bold flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-[#0082FB]" />
                        Адрес склада в РК:
                      </span>
                      <p className="text-[#111827] font-semibold bg-gray-50/70 p-3 rounded-xl border border-gray-200/70 leading-relaxed">
                        {parsed.address}
                      </p>
                    </div>
                  )}

                  {parsed.clientNote && (
                    <div className="space-y-1">
                      <span className="text-[#64748B] font-bold flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                        <FileText className="w-3.5 h-3.5 text-[#64748B]" />
                        Примечание клиента:
                      </span>
                      <p className="text-[#334155] bg-gray-50/70 p-3 rounded-xl border border-gray-200/70 leading-relaxed whitespace-pre-wrap">
                        {parsed.clientNote}
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Codes File Card */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0082FB] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-[#111827]">
                    Файл кодов маркировки партии
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    Data Matrix коды для печати и нанесения (CSV, TXT, PDF, ZIP)
                  </p>
                </div>
              </div>

              {order.codesFileUrl ? (
                <span className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Файл сохранён на сервере
                </span>
              ) : (
                <span className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Ожидает прикрепления файлов кодов
                </span>
              )}
            </div>

            {codesSuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                {codesSuccessMsg}
              </div>
            )}

            {/* Discrepancy warning banner */}
            {codesSummary && codesSummary.totalRows > 0 && codesSummary.totalRows !== order.itemsCount && (
              <div className="bg-amber-50/95 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-amber-950 uppercase tracking-wide">
                        Внимание: Несовпадение объема заказа и кодов в файле
                      </span>
                      <span className="text-[10px] font-bold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-full border border-amber-300">
                        Файл: {codesSummary.totalRows.toLocaleString()} шт. • Заказ: {order.itemsCount.toLocaleString()} шт.
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-900 mt-1 leading-relaxed">
                      В загруженном файле <strong>«{codesSummary.fileName}»</strong> содержится <strong>{codesSummary.totalRows.toLocaleString()} кодов</strong>, а в заказе заявлено <strong>{order.itemsCount.toLocaleString()} шт.</strong>
                      {codesSummary.totalRows < order.itemsCount ? (
                        <span> (не хватает {(order.itemsCount - codesSummary.totalRows).toLocaleString()} шт.). Вы можете скорректировать объем партии под фактический файл.</span>
                      ) : (
                        <span> (в файле больше кодов, чем оформлено). Скорректируйте объем заказа, чтобы включить весь тираж.</span>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleAdjustOrderCount(codesSummary.totalRows)}
                  disabled={adjustingCount}
                  className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${adjustingCount ? 'animate-spin' : ''}`} />
                  {adjustingCount ? 'Пересчет...' : `Скорректировать заказ до ${codesSummary.totalRows.toLocaleString()} шт.`}
                </button>
              </div>
            )}

            {adjustSuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                {adjustSuccessMsg}
              </div>
            )}

            {order.codesFileUrl ? (
              <div
                onDragOver={handleCodesDragOver}
                onDragEnter={handleCodesDragEnter}
                onDragLeave={handleCodesDragLeave}
                onDrop={handleCodesDrop}
                className={`rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all relative border ${
                  isCodesDragOver
                    ? 'border-[#0082FB] bg-blue-50/90 ring-2 ring-[#0082FB]/20 scale-[1.005]'
                    : 'bg-gray-50 border-gray-200/80'
                }`}
              >
                {isCodesDragOver && (
                  <div className="absolute inset-0 bg-blue-50/95 rounded-xl flex items-center justify-center border-2 border-dashed border-[#0082FB] z-10 pointer-events-none">
                    <div className="flex items-center gap-2">
                      <Upload className="w-5 h-5 text-[#0082FB] animate-bounce" />
                      <span className="text-xs font-bold text-[#0082FB]">Отпустите файл для замены</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 min-w-0 pointer-events-none">
                  <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-[#0082FB] shrink-0 shadow-xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#111827] block truncate">
                      {order.codesFileName || 'codes.csv'}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Файл привязан к заказу и доступен операторам
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadCodesFile}
                    disabled={downloadingCodes}
                    className="inline-flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Download className={`w-3.5 h-3.5 text-gray-600 ${downloadingCodes ? 'animate-bounce' : ''}`} />
                    {downloadingCodes ? 'Скачивание...' : 'Скачать файл'}
                  </button>

                  <label className="inline-flex items-center gap-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingCodes ? 'Загрузка...' : 'Заменить файл'}
                    <input
                      type="file"
                      accept=".csv,.txt,.pdf,.zip,.xlsx"
                      onChange={handleUploadCodesFile}
                      disabled={uploadingCodes}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div
                onDragOver={handleCodesDragOver}
                onDragEnter={handleCodesDragEnter}
                onDragLeave={handleCodesDragLeave}
                onDrop={handleCodesDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center space-y-3 transition-all ${
                  isCodesDragOver
                    ? 'border-[#0082FB] bg-blue-50/80 ring-2 ring-[#0082FB]/20 scale-[1.01]'
                    : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center mx-auto text-gray-400 shadow-xs pointer-events-none">
                  <Upload className={`w-5 h-5 transition-colors ${isCodesDragOver ? 'text-[#0082FB] animate-bounce' : 'text-gray-400'}`} />
                </div>
                <div className="pointer-events-none">
                  <h4 className="text-xs font-bold text-[#111827]">
                    {isCodesDragOver ? 'Отпустите файл для загрузки' : 'Загрузить файл с кодами маркировки'}
                  </h4>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    {isCodesDragOver
                      ? 'Файл будет прикреплен к заказу'
                      : 'Прикрепите выгрузку из ИС Танба / Asl Belgisi (CSV, TXT, PDF или ZIP). Специалисты нанесут их на партию.'}
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 bg-[#111827] hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95">
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingCodes ? 'Сохранение файла...' : 'Прикрепить файл кодов'}
                  <input
                    ref={codesFileInputRef}
                    type="file"
                    accept=".csv,.txt,.pdf,.zip,.xlsx"
                    onChange={handleUploadCodesFile}
                    disabled={uploadingCodes}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Custom Sticker Layout Card (when STICKER_LAYOUT_DESIGN is ordered) */}
          {isStickerDesign && (
            <div id="sticker-approval-section" className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 text-[#111827] flex items-center justify-center shrink-0">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-[#111827]">
                      {isReusedTemplate ? 'Макет этикетки (из библиотеки)' : 'Требования к макету стикера'}
                    </h2>
                    <p className="text-xs text-[#64748B]">
                      {isReusedTemplate ? (
                        <span className="text-emerald-700 font-semibold">
                          ✓ Использован готовый шаблон из вашей библиотеки (без повторной оплаты)
                        </span>
                      ) : (
                        <>Размер: <strong className="text-[#111827]">{labelRequirements?.size || '58×40 мм'}</strong> • Техническое задание для дизайнера</>
                      )}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border self-start sm:self-auto ${
                    approvalStatus === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                      : approvalStatus === 'CHANGES_REQUESTED'
                      ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                      : approvalStatus === 'WAITING_APPROVAL'
                      ? 'bg-blue-50 text-[#0082FB] border-blue-200/80'
                      : 'bg-gray-100 text-[#475569] border-gray-200'
                  }`}
                >
                  {approvalStatus === 'APPROVED'
                    ? '✓ Макет утвержден'
                    : approvalStatus === 'CHANGES_REQUESTED'
                    ? 'Запрошены правки'
                    : approvalStatus === 'WAITING_APPROVAL'
                    ? 'Ожидает согласования'
                    : 'В разработке у дизайнера'}
                </span>
              </div>

              {/* Grid: Left parameters & Right visual sticker preview / design progress */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Left parameters (7 cols) */}
                <div className="md:col-span-7 space-y-2.5 text-xs">
                  {labelRequirements?.productName && (
                    <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-100">
                      <span className="text-[#64748B] font-medium">Товар:</span>
                      <span className="col-span-2 font-bold text-[#111827]">
                        {labelRequirements.productName}
                      </span>
                    </div>
                  )}

                  {labelRequirements?.brand && (
                    <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-100">
                      <span className="text-[#64748B] font-medium">Бренд:</span>
                      <span className="col-span-2 font-bold text-[#111827]">
                        {labelRequirements.brand}
                      </span>
                    </div>
                  )}

                  {labelRequirements?.article && (
                    <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-100">
                      <span className="text-[#64748B] font-medium">Артикул / Модель:</span>
                      <span className="col-span-2 font-mono font-bold text-[#111827]">
                        {labelRequirements.article}
                      </span>
                    </div>
                  )}

                  {labelRequirements?.composition && (
                    <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-100">
                      <span className="text-[#64748B] font-medium">Состав:</span>
                      <span className="col-span-2 text-[#111827] font-semibold">
                        {labelRequirements.composition}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-100">
                    <span className="text-[#64748B] font-medium">Размер стикера:</span>
                    <span className="col-span-2 text-[#111827] font-bold">
                      {labelRequirements?.size || `${layoutWidthMm}×${layoutHeightMm} мм`}
                    </span>
                  </div>

                  {labelRequirements?.symbols && (
                    <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-100">
                      <span className="text-[#64748B] font-medium">Обязательные знаки:</span>
                      <span className="col-span-2 text-[#0082FB] font-bold">
                        {labelRequirements.symbols}
                      </span>
                    </div>
                  )}

                  {labelRequirements?.wishes && (
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/70 text-[11px] text-[#64748B]">
                      <span className="font-bold text-[#111827] block mb-0.5">Пожелания к макету:</span>
                      {labelRequirements.wishes}
                    </div>
                  )}
                </div>

                {/* Right Column: In development notice OR Actual sticker preview when ready */}
                <div className="md:col-span-5 flex flex-col items-center">
                  {!hasLayoutReady ? (
                    <div className="w-full bg-gray-50/80 border border-dashed border-gray-300 rounded-xl p-6 text-center space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center mx-auto text-[#64748B] shadow-xs">
                        <Clock className="w-5 h-5 text-[#64748B]" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#111827]">Макет готовится дизайнером</h4>
                        <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">
                          Специалист верстает макет этикетки по вашим размерам и реквизитам ({layoutWidthMm}×{layoutHeightMm} мм). Как только черновик будет подготовлен и отправлен на согласование, здесь появится точный предпросмотр и кнопки утверждения.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        onClick={() => setShowStickerModal(true)}
                        className="cursor-pointer group flex flex-col items-center"
                        title="Нажмите для просмотра в полном масштабе"
                      >
                        <StickerCanvasPreview
                          widthMm={layoutWidthMm}
                          heightMm={layoutHeightMm}
                          elements={layoutElements}
                          scale={3.6}
                          previewData={stickerPreviewData}
                          className="shadow-sm"
                        />

                        <div className="text-[10px] font-semibold text-gray-500 text-center mt-2">
                          <span>{layoutWidthMm}×{layoutHeightMm} мм</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowStickerModal(true)}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#0082FB] hover:text-[#0070DA] hover:underline cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Посмотреть макет в полном размере
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Approval Area - ONLY shown when layout is ready */}
              <div className="pt-3 border-t border-gray-100">
                {approvalStatus === 'IN_DESIGN' ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#64748B] py-1">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      Техническое задание принято в разработку
                    </span>
                    <span className="text-[11px] text-[#94A3B8]">
                      Согласование макета станет доступно после загрузки черновика
                    </span>
                  </div>
                ) : approvalStatus === 'APPROVED' ? (
                  <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-xs font-bold text-emerald-950">
                        Макет утвержден вами {approvalData.approvedAt || 'в системе'}. Запущен в тираж и печать.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setApprovalStatus('WAITING_APPROVAL')}
                      className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer self-start sm:self-auto"
                    >
                      Изменить решение
                    </button>
                  </div>
                ) : approvalStatus === 'CHANGES_REQUESTED' ? (
                  <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-600" /> Замечания отправлены дизайнеру:
                      </span>
                      <button
                        type="button"
                        onClick={handleApproveSticker}
                        className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                      >
                        Утвердить текущий вариант
                      </button>
                    </div>
                    <p className="text-xs text-amber-950 bg-white/90 p-2.5 rounded-lg border border-amber-200/80 font-medium">
                      "{approvalData.comment}"
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50/90 border border-gray-200/90 rounded-xl p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-extrabold text-[#111827]">
                          Согласование макета стикера
                        </h4>
                        <p className="text-[11px] text-[#64748B] mt-0.5">
                          Пожалуйста, проверьте реквизиты и утвердите макет перед печатью партии
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleApproveSticker}
                          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                        >
                          <Check className="w-4 h-4" /> Утвердить макет
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowRevisionInput((prev) => !prev)}
                          className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-100 text-[#111827] font-semibold text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 transition-all cursor-pointer"
                        >
                          Запросить правки
                        </button>
                      </div>
                    </div>

                    {showRevisionInput && (
                      <div className="pt-3 border-t border-gray-200 space-y-2 animate-in fade-in duration-150">
                        <textarea
                          rows={2}
                          value={revisionComment}
                          onChange={(e) => setRevisionComment(e.target.value)}
                          placeholder="Опишите, какие изменения необходимо внести в макет дизайнеру (например: скорректировать артикул, увеличить размер шрифта, добавить знак)..."
                          className="w-full text-xs bg-white border border-gray-300 rounded-xl p-3 text-[#111827] focus:outline-none focus:border-[#0082FB] resize-none"
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowRevisionInput(false)}
                            className="text-xs text-gray-500 hover:text-black font-semibold px-3 py-1.5 cursor-pointer"
                          >
                            Отмена
                          </button>
                          <button
                            type="button"
                            disabled={!revisionComment.trim()}
                            onClick={handleRequestRevision}
                            className="bg-[#111827] hover:bg-black disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                          >
                            Отправить дизайнеру
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents & Files Card */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="border-b border-gray-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h2 className="text-sm font-extrabold text-[#111827]">Документы и макеты кодов</h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {isOrderCompleted
                    ? 'Партия полностью выполнена. Файлы кодов и закрывающий Акт готовы к выгрузке.'
                    : isLayoutApproved
                    ? 'Макет этикетки утвержден. Файлы сформированы для складских термотрансферных принтеров.'
                    : isWaitingApproval
                    ? 'Макет передан вам на согласование. Ознакомьтесь и утвердите макет в блоке выше.'
                    : 'Файлы генерируются автоматически по мере согласования макета и выполнения заказа.'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Data Matrix PDF Document Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50/60 rounded-xl border border-gray-200/80 gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 text-[#0082FB]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xs font-extrabold text-[#111827]">
                        Макеты кодов Data Matrix (PDF)
                      </h3>
                      {canPrintBatch ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ✓ Печать разрешена
                        </span>
                      ) : !isApprovedByClient ? (
                        <span className="text-[10px] font-bold text-[#0082FB] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Lock className="w-3 h-3 text-[#0082FB]" />
                          Требуется согласование макета
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-[#0082FB] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Lock className="w-3 h-3 text-[#0082FB]" />
                          Ожидает подтверждения оплаты
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      Формат {labelWidth}×{labelHeight} мм для термотрансферной печати • {order.itemsCount.toLocaleString()} кодов
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handlePrintSample}
                    disabled={printingSample}
                    className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-[#111827] border border-slate-200 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
                    title="Напечатать 1 тестовый образец для калибровки принтера и проверки сканером"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#0082FB]" />
                    {printingSample ? 'Печать...' : 'Тест (1 шт.)'}
                  </button>

                  <Link
                    to={`/orders/${order.id}/labels`}
                    className="inline-flex items-center justify-center gap-2 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-xs shrink-0 bg-white hover:bg-gray-100 text-[#111827] border border-gray-200 cursor-pointer"
                    title="Открыть отдельную страницу со всеми этикетками партии, номерами и поштучной печатью"
                  >
                    <Eye className="w-4 h-4 text-[#0082FB]" />
                    Все этикетки ({order.itemsCount})
                  </Link>

                  <button
                    type="button"
                    onClick={() => setShowRollModal(true)}
                    className={`inline-flex items-center justify-center gap-2 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-xs shrink-0 ${
                      canPrintBatch
                        ? 'bg-white hover:bg-gray-100 text-[#111827] border border-gray-200 cursor-pointer'
                        : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-pointer'
                    }`}
                    title={canPrintBatch ? 'Разбить тираж на рулоны (по 500, 1000 или 2000 этикеток) для термопринтера' : printBlockReason}
                  >
                    <Layers className={`w-4 h-4 ${canPrintBatch ? 'text-[#0082FB]' : 'text-slate-400'}`} />
                    Скачать по рулонам
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={downloadingPdf || !canPrintBatch}
                    className={`inline-flex items-center justify-center gap-2 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs shrink-0 ${
                      canPrintBatch
                        ? 'bg-[#0082FB] hover:bg-[#0070DA] text-white cursor-pointer active:scale-95'
                        : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    }`}
                    title={canPrintBatch ? 'Скачать итоговый PDF для принтера' : printBlockReason}
                  >
                    {canPrintBatch ? (
                      <Download className={`w-4 h-4 ${downloadingPdf ? 'animate-bounce' : ''}`} />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    {downloadingPdf
                      ? 'Формирование PDF...'
                      : canPrintBatch
                      ? 'Скачать все (PDF)'
                      : 'Печать заблокирована'}
                  </button>
                </div>
              </div>

              {/* Print Access Informational Alert */}
              {!canPrintBatch ? (
                <div className="p-4 rounded-2xl border border-blue-200/90 bg-gradient-to-r from-blue-50/90 via-sky-50/40 to-white flex items-start gap-3.5 shadow-xs">
                  <div className="w-8 h-8 rounded-xl bg-[#0082FB] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Lock className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <span className="font-extrabold text-[#0B3A78] text-xs block">
                      {!isApprovedByClient
                        ? 'Печать тиража заблокирована: макет ещё не утверждён'
                        : 'Макет утверждён! Ожидается подтверждение оплаты администратором'}
                    </span>
                    <span className="text-[11px] text-[#334D6E] leading-relaxed block mt-0.5">
                      {!isApprovedByClient
                        ? 'Чтобы скачать полную партию этикеток или рулоны, сначала согласуйте дизайн макета в блоке выше. Для калибровки принтера доступна кнопка «Тест (1 шт.)».'
                        : 'Администратор подтверждает условную оплату за макет и тираж. После одобрения доступ к скачиванию рулонов и всей партии откроется автоматически.'}
                    </span>
                    {!isApprovedByClient && (
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById('sticker-approval-section');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#0082FB] hover:text-[#006bd1] hover:underline mt-1.5 cursor-pointer"
                      >
                        Перейти к согласованию макета &rarr;
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl border border-emerald-200/90 bg-emerald-50/80 flex items-center gap-3 text-xs text-emerald-950 shadow-xs">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold">
                    ✓ Макет согласован и оплата подтверждена. Доступ к печати всей партии ({order.itemsCount.toLocaleString()} шт.) открыт.
                  </span>
                </div>
              )}

              {/* Act Document Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50/60 rounded-xl border border-gray-200/80 gap-3">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isOrderCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xs font-extrabold text-[#111827]">
                        Акт приема-передачи выполненных работ
                      </h3>
                      {isOrderCompleted ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          ✓ Итоговый документ
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                          Предпросмотр
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      {isOrderCompleted
                        ? 'Официальный бухгалтерский акт сверки и закрытия партии в ИС Танба РК'
                        : 'Бухгалтерский акт сверки с реквизитами сторон (официально закрывается при статусе «Выполнен»)'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadAct}
                    className={`inline-flex items-center justify-center gap-2 font-bold text-xs px-4 py-2.5 rounded-xl border transition-all shrink-0 cursor-pointer ${
                      isOrderCompleted
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-xs'
                        : 'bg-white hover:bg-gray-100 text-[#111827] border-gray-200/90'
                    }`}
                    title={isOrderCompleted ? 'Открыть официальный Акт для печати и подписи' : 'Открыть предварительный Акт'}
                  >
                    {isOrderCompleted ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-white" /> Скачать / Печать Акта
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 text-gray-500" /> Предпросмотр Акта
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Financial Summary & Notes (1 col) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Financial Summary */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
              Финансовый расчет
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-[#64748B]">
                <span>Тариф маркировки ({order.itemsCount.toLocaleString()} шт.):</span>
                <span className="font-bold text-[#111827]">{(order.itemsCount * order.pricePerItem).toLocaleString()} ₸</span>
              </div>

              <div className="flex justify-between text-[#64748B]">
                <span>Дополнительные опции:</span>
                <span className="font-bold text-[#111827]">0 ₸</span>
              </div>

              <div className="flex justify-between text-[#64748B]">
                <span>НДС (0%):</span>
                <span className="font-bold text-[#111827]">0 ₸</span>
              </div>

              <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between items-baseline">
                <span className="text-xs font-bold text-[#111827] uppercase">Итого к оплате:</span>
                <span className="text-xl font-black text-[#0082FB]">
                  {order.totalPrice.toLocaleString()} ₸
                </span>
              </div>
            </div>

            <div className="pt-2">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200/70 text-[11px] text-[#64748B]">
                Оплата списывается с корпоративного баланса организации по факту выпуска макетов.
              </div>
            </div>
          </div>

          {/* Delivery & Notes Card */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
              Адрес и примечания
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] font-bold text-[#64748B] block mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-gray-400" /> Склад / Адрес доставки:
                </span>
                <p className="text-[#111827] font-semibold bg-gray-50/80 p-2.5 rounded-xl border border-gray-200/70">
                  {defaultWarehouse || 'Основной склад (г. Алматы)'}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold text-[#64748B] block mb-1 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-gray-400" /> Примечание:
                </span>
                <p className="text-[#111827] font-medium bg-gray-50/80 p-2.5 rounded-xl border border-gray-200/70 leading-relaxed">
                  {order.notes || 'Без примечаний к заказу'}
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Full-Size Sticker Modal Preview */}
      {showStickerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 max-w-lg w-full p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#0082FB]" />
                <h3 className="text-base font-extrabold text-[#111827]">
                  Макет стикера для заказа {order.orderNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowStickerModal(false)}
                className="text-gray-400 hover:text-black p-1 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-[#64748B] flex items-center justify-between">
              <span>
                Формат: <strong className="text-[#111827]">{layoutWidthMm} × {layoutHeightMm} мм</strong>
              </span>
            </div>

            {/* High-res rendered sticker canvas/card */}
            <div className="bg-gray-100 p-6 rounded-2xl flex items-center justify-center overflow-auto max-h-[60vh]">
              <div id="sticker-sample-printable-card">
                <StickerCanvasPreview
                  widthMm={layoutWidthMm}
                  heightMm={layoutHeightMm}
                  elements={layoutElements}
                  scale={6.2}
                  previewData={stickerPreviewData}
                  className="shadow-2xl"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handlePrintSample}
                disabled={printingSample}
                className="inline-flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-[#111827] text-xs font-bold px-4 py-2.5 rounded-xl border border-gray-200 transition-all cursor-pointer disabled:opacity-60"
              >
                <Printer className={`w-4 h-4 ${printingSample ? 'animate-bounce' : ''}`} />
                {printingSample ? 'Формирование...' : 'Распечатать образец (PDF)'}
              </button>

              <div className="flex items-center justify-end gap-2">
                {approvalStatus !== 'APPROVED' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleApproveSticker();
                      setShowStickerModal(false);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    <Check className="w-4 h-4" /> Утвердить макет
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowStickerModal(false)}
                  className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-[#111827] text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Roll Splitting Modal for batches */}
      {order && (
        <RollSplitModal
          isOpen={showRollModal}
          onClose={() => setShowRollModal(false)}
          orderId={order.id}
          orderNumber={order.orderNumber}
          totalCodes={order.itemsCount}
          labelWidth={labelWidth}
          labelHeight={labelHeight}
          hasCodesFile={Boolean(order.codesFileUrl)}
          hasLayout={Boolean(hasLayoutReady || (order.stickerLayout as any)?.elements?.length > 0)}
          canPrintBatch={canPrintBatch}
          blockReason={printBlockReason}
        />
      )}

    </div>
  );
};
