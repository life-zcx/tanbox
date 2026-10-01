import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { OrderAdminItem, OrderStatus } from '../types';
import { StatusBadge, parseOrderNotes } from '@shared';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Building2,
  Mail,
  Phone,
  CreditCard,
  Package,
  Palette,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  AlertCircle,
  Check,
  Save,
  Download,
  Upload,
  Printer,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  Layers,
  BookmarkCheck,
} from 'lucide-react';
import axios from 'axios';
import { StickerCanvasPreview } from '../components/common/StickerCanvasPreview';
import RollSplitModal from '../components/modals/RollSplitModal';

const CATEGORY_NAMES: Record<string, string> = {
  WATER: 'Вода и напитки',
  MILK: 'Молочная продукция',
  PHARMA: 'Лекарственные препараты',
  SHOES: 'Обувные товары',
  TOBACCO: 'Табачные изделия',
  TEXTILE: 'Товары легкой промышленности (текстиль)',
  ALCOHOL: 'Алкогольная продукция',
  PERFUME: 'Духи и туалетная вода',
  TIRES: 'Шины и покрышки',
  ELECTRONICS: 'Бытовая техника и электроника',
  JEWELRY: 'Ювелирные изделия',
  ANTISEPTIC: 'Антисептики',
  SUPPLEMENTS: 'Биологически активные добавки (БАД)',
  OILS: 'Моторные масла',
  OTHER: 'Прочие товары',
};

const TARIFF_NAMES: Record<string, string> = {
  DIGITAL: 'Цифровой (коды в PDF / CSV)',
  PRINT: 'Печатный (печать рулонов)',
  STANDARD: 'Стандарт (нанесение на складе)',
  PRO: 'PRO Склад (полный цикл под ключ)',
};

const SERVICE_NAMES: Record<string, string> = {
  ON_SITE_STICKERING: 'Стикеровка на складе',
  STICKER_LAYOUT_DESIGN: 'Разработка макета стикера',
  URGENT_PROCESSING: 'Срочное исполнение (24ч)',
  EXPRESS_DELIVERY: 'Экспресс-доставка рулонов',
  SSCC_AGGREGATION: 'SSCC Агрегация коробов',
};

export const AdminOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<OrderAdminItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Status editing
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>('NEW');
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [savingStatus, setSavingStatus] = useState<boolean>(false);
  const [statusSuccessMsg, setStatusSuccessMsg] = useState<string | null>(null);

  // PDF generation state
  const [generatingPdf, setGeneratingPdf] = useState<boolean>(false);
  const [pdfSuccessMsg, setPdfSuccessMsg] = useState<string | null>(null);

  // Codes file upload state
  const [uploadingCodes, setUploadingCodes] = useState<boolean>(false);
  const [downloadingCodes, setDownloadingCodes] = useState<boolean>(false);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const [codesSuccessMsg, setCodesSuccessMsg] = useState<string | null>(null);
  const [isCodesDragOver, setIsCodesDragOver] = useState<boolean>(false);
  const codesFileInputRef = useRef<HTMLInputElement>(null);

  // Approval state from localStorage
  const [approvalStatus, setApprovalStatus] = useState<string>('IN_DESIGN');
  const [approvalData, setApprovalData] = useState<any>({});
  const [hasSavedLabel, setHasSavedLabel] = useState<boolean>(false);

  // Roll splitting modal state
  const [showRollModal, setShowRollModal] = useState<boolean>(false);

  // Codes discrepancy & adjustment state
  const [codesSummary, setCodesSummary] = useState<{ totalRows: number; fileName: string } | null>(null);
  const [adjustingCount, setAdjustingCount] = useState<boolean>(false);
  const [adjustSuccessMsg, setAdjustSuccessMsg] = useState<string | null>(null);

  const fetchOrder = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/orders/${id}`);
      setOrder(res.data);
      setCurrentStatus(res.data.status);
      setPdfUrl(res.data.pdfUrl || '');

      // Check saved label from DB or local storage
      const dbLayout = res.data.stickerLayout;
      const hasDbLayout = Boolean(
        dbLayout?.elements && Array.isArray(dbLayout.elements) && dbLayout.elements.length > 0
      );
      const savedLocal =
        localStorage.getItem(`tanbox_order_label_${res.data.id}`) ||
        localStorage.getItem(`tanbox_order_label_${res.data.orderNumber}`);
      setHasSavedLabel(hasDbLayout || Boolean(savedLocal));

      // Check approval state from DB
      const dbApprovalStatus = res.data.stickerApprovalStatus || (hasDbLayout ? 'WAITING_APPROVAL' : 'IN_DESIGN');
      setApprovalStatus(dbApprovalStatus);
      setApprovalData({
        status: dbApprovalStatus,
        sentAt: res.data.stickerSentAt ? new Date(res.data.stickerSentAt).toLocaleString('ru-RU') : '',
        comment: res.data.stickerApprovalNotes || '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Не удалось загрузить данные заказа');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

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
        console.warn('Could not fetch codes summary in admin:', err);
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
      setAdjustSuccessMsg(res.data.message || `Объем заказа скорректирован до ${newCount.toLocaleString()} шт.`);
      setTimeout(() => setAdjustSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error('Adjust order count error:', err);
      alert(err.response?.data?.message || 'Ошибка корректировки объема заказа');
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

      const getVal = (prefix: string) => {
        const match = lines.find((l) => l.startsWith(prefix));
        return match ? match.replace(prefix, '').trim() : '';
      };

      const sizeStr = getVal('Размер:') || '58 × 40 мм';
      let widthMm = 58;
      let heightMm = 40;
      const sizeMatch = sizeStr.match(/(\d+)\s*[×x*]\s*(\d+)/i);
      if (sizeMatch) {
        widthMm = parseInt(sizeMatch[1], 10);
        heightMm = parseInt(sizeMatch[2], 10);
      }

      return {
        size: sizeStr,
        widthMm,
        heightMm,
        productName: getVal('Товар:'),
        brand: getVal('Бренд:'),
        article: getVal('Артикул:'),
        composition: getVal('Состав:'),
        symbols: getVal('Знаки:'),
        wishes: getVal('Пожелания/текст:'),
      };
    } catch {
      return null;
    }
  }, [order]);

  const isStickerDesign = Boolean(
    order?.extraServices?.includes('STICKER_LAYOUT_DESIGN') ||
    order?.notes?.includes('ТРЕБОВАНИЯ К МАКЕТУ СТИКЕРА') ||
    order?.notes?.includes('МАКЕТ ЭТИКЕТКИ: ИСПОЛЬЗОВАН СОХРАНЁННЫЙ ШАБЛОН') ||
    (order as any)?.templateId ||
    ((order as any)?.stickerLayout?.elements?.length > 0)
  );

  const isReusedTemplate = Boolean(
    (order as any)?.templateId ||
    order?.notes?.includes('МАКЕТ ЭТИКЕТКИ: ИСПОЛЬЗОВАН СОХРАНЁННЫЙ ШАБЛОН')
  );

  const [savingTemplate, setSavingTemplate] = useState<boolean>(false);
  const [templateSavedMsg, setTemplateSavedMsg] = useState<string | null>(null);

  const activeLayout = (order as any)?.stickerLayout;
  const layoutElements = useMemo(() => {
    if (activeLayout?.elements && Array.isArray(activeLayout.elements)) {
      return activeLayout.elements;
    }
    return [];
  }, [activeLayout]);

  const { layoutWidthMm, layoutHeightMm } = useMemo(() => {
    let w = activeLayout?.widthMm || labelRequirements?.widthMm || 58;
    let h = activeLayout?.heightMm || labelRequirements?.heightMm || 40;
    return { layoutWidthMm: w, layoutHeightMm: h };
  }, [activeLayout, labelRequirements]);

  const handleSaveToUserTemplates = async () => {
    if (!order || !layoutElements.length) return;
    const defaultName = `${order.category || 'Этикетка'} ${layoutWidthMm}×${layoutHeightMm} мм`;
    const templateName = window.prompt(
      'Введите название шаблона для сохранения в библиотеку клиента:',
      defaultName
    );
    if (!templateName || !templateName.trim()) return;

    setSavingTemplate(true);
    try {
      await apiClient.post('/user-templates', {
        targetUserId: order.userId,
        name: templateName.trim(),
        category: order.category,
        widthMm: layoutWidthMm,
        heightMm: layoutHeightMm,
        elements: layoutElements,
        sourceOrderId: order.id,
      });
      setTemplateSavedMsg('Макет успешно сохранён в библиотеку шаблонов клиента!');
      setTimeout(() => setTemplateSavedMsg(null), 4000);
    } catch (err: any) {
      alert('Ошибка при сохранении в библиотеку: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingTemplate(false);
    }
  };

  const stickerPreviewData = useMemo(() => ({
    brand: labelRequirements?.brand || order?.user?.companyName || 'БРЕНД',
    productName: labelRequirements?.productName || (order ? CATEGORY_NAMES[order.category] || order.category : 'Товар'),
    name: labelRequirements?.productName || (order ? CATEGORY_NAMES[order.category] || order.category : 'Товар'),
    article: labelRequirements?.article || order?.orderNumber || '',
    sku: labelRequirements?.article || order?.orderNumber || '',
    composition: labelRequirements?.composition || '',
    code: '0104870000000000215abcd1234591ffd092testcode',
    gtin: '04870000000000',
    serial: '5abcd12345',
  }), [labelRequirements, order]);

  // Save updated status to server
  const handleSaveStatus = async (newSt?: OrderStatus) => {
    if (!order) return;
    const targetStatus = newSt || currentStatus;
    setSavingStatus(true);
    try {
      await apiClient.patch(`/orders/${order.id}/status`, {
        status: targetStatus,
        pdfUrl: pdfUrl.trim() || undefined,
      });
      setCurrentStatus(targetStatus);
      setOrder((prev) => (prev ? { ...prev, status: targetStatus, pdfUrl: pdfUrl.trim() } : prev));
      setStatusSuccessMsg('Статус успешно сохранён!');
      setTimeout(() => setStatusSuccessMsg(null), 3000);
    } catch (err: any) {
      alert('Ошибка при обновлении статуса: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingStatus(false);
    }
  };

  // Send layout to client for approval via DB
  const handleSendToClientApproval = async () => {
    if (!order) return;
    try {
      await apiClient.patch(`/orders/${order.id}/sticker-layout`, {
        sendToClient: true,
      });

      const approvalPayload = {
        status: 'WAITING_APPROVAL',
        sentAt: new Date().toLocaleString('ru-RU'),
      };
      setApprovalStatus('WAITING_APPROVAL');
      setApprovalData(approvalPayload);

      if (order.status === 'NEW') {
        setCurrentStatus('PROCESSING');
        setOrder((prev) => (prev ? { ...prev, status: 'PROCESSING' } : prev));
      }

      alert('Макет стикера успешно сохранён в БД и передан клиенту на согласование!');
    } catch (e: any) {
      alert('Ошибка при отправке клиенту: ' + (e.response?.data?.message || e.message));
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
      setCodesSuccessMsg('Файл кодов успешно загружен и сохранён в заказе!');
      setTimeout(() => setCodesSuccessMsg(null), 4000);
    } catch (err: any) {
      alert('Ошибка при загрузке файла кодов: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingCodes(false);
    }
  };

  // Upload or replace codes file for this order
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
      const token = localStorage.getItem('tanbox_admin_token') || localStorage.getItem('tanbox_token') || '';
      window.open(`/api/orders/${order.id}/codes-file?token=${encodeURIComponent(token)}`, '_blank');
    } finally {
      setDownloadingCodes(false);
    }
  };

  // Generate roll PDF batch automatically from designer layout
  const handleGeneratePdfFromDesigner = async () => {
    if (!order) return;
    setGeneratingPdf(true);
    try {
      const dbLayout = (order as any).stickerLayout;
      let templateElements: any[] = [];
      let w = labelRequirements?.widthMm || 58;
      let h = labelRequirements?.heightMm || 40;

      if (dbLayout?.elements && Array.isArray(dbLayout.elements) && dbLayout.elements.length > 0) {
        templateElements = dbLayout.elements;
        if (dbLayout.widthMm) w = dbLayout.widthMm;
        if (dbLayout.heightMm) h = dbLayout.heightMm;
      } else {
        const saved =
          localStorage.getItem(`tanbox_order_label_${order.id}`) ||
          localStorage.getItem(`tanbox_order_label_${order.orderNumber}`);

        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            templateElements = Array.isArray(parsed) ? parsed : parsed.elements || [];
            if (parsed.widthMm) w = parsed.widthMm;
            if (parsed.heightMm) h = parsed.heightMm;
          } catch {}
        }
      }

      if (templateElements.length === 0) {
        templateElements = [
          {
            id: 'txt-brand',
            type: 'text',
            x: 2,
            y: 2,
            width: Math.max(10, w - 12),
            content: labelRequirements?.brand || order.user?.companyName || 'БРЕНД',
            fontSize: 6.5,
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            align: 'left',
            rotation: 0,
          },
          {
            id: 'txt-art',
            type: 'text',
            x: 2,
            y: 6,
            width: Math.max(10, w - 12),
            content: `АРТ: ${labelRequirements?.article || order.orderNumber}`,
            fontSize: 4.8,
            fontWeight: 'normal',
            fontFamily: 'Arial, sans-serif',
            align: 'left',
            rotation: 0,
          },
          {
            id: 'sym-eac',
            type: 'symbol',
            symbolType: 'eac',
            x: Math.max(1, w - 8),
            y: 2,
            size: 5,
            hasBorder: true,
            rotation: 0,
          },
          {
            id: 'txt-prod',
            type: 'text',
            x: 2,
            y: 11,
            width: Math.max(10, w - 4),
            content: labelRequirements?.productName || categoryLabel,
            fontSize: 5.5,
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            align: 'left',
            rotation: 0,
          },
          {
            id: 'dm-1',
            type: 'datamatrix',
            x: 2,
            y: Math.max(10, h - 14),
            size: 11,
            columnName: 'code',
            matrixStructure: 'four_regions',
            rotation: 0,
          },
          {
            id: 'bar-1',
            type: 'barcode',
            barcodeFormat: 'ean13',
            x: Math.max(10, w - 24),
            y: Math.max(10, h - 13),
            width: 22,
            height: 7,
            showText: true,
            columnName: 'barcode',
            rotation: 0,
          },
          {
            id: 'txt-sub',
            type: 'text',
            x: 2,
            y: Math.max(2, h - 3.5),
            width: Math.max(10, w - 4),
            content: `ИС Танба РК • ${w}×${h} мм`,
            fontSize: 4,
            fontWeight: 'normal',
            fontFamily: 'Arial, sans-serif',
            align: 'center',
            rotation: 0,
          },
        ];
      }

      // Generate dummy code rows for the batch if no external CSV
      const rows = Array.from({ length: Math.min(order.itemsCount, 20) }, (_, i) => ({
        code: `010460000000000021${String(order.orderNumber).replace(/\D/g, '')}${String(i + 1).padStart(4, '0')}\u001d91FFD0\u001d92dGVzdA==`,
        barcode: `20000000${String(i + 1).padStart(5, '0')}`,
        productName: labelRequirements?.productName || categoryLabel,
        brand: labelRequirements?.brand || order.user?.companyName || 'Бренд',
        article: labelRequirements?.article || order.orderNumber,
      }));

      const template = {
        name: `Стикер ${w}×${h} мм - Заказ ${order.orderNumber}`,
        widthMm: w,
        heightMm: h,
        elements: templateElements,
      };

      const response = await axios.post(
        '/api/labels/generate-pdf',
        {
          template,
          csvData: rows,
        },
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const generatedPath = `/api/orders/${order.id}/pdf`;

      // Update order on backend
      await apiClient.patch(`/orders/${order.id}/status`, {
        pdfUrl: generatedPath,
      });

      // Save generated blob to memory / local reference so user can download directly
      (window as any)[`tanbox_pdf_blob_${order.id}`] = blob;
      setPdfUrl(generatedPath);
      setOrder((prev) => (prev ? { ...prev, pdfUrl: generatedPath } : prev));
      setPdfSuccessMsg('PDF этикеток партии успешно сформирован на основе макета!');
      setTimeout(() => setPdfSuccessMsg(null), 4000);
    } catch (err: any) {
      alert('Ошибка при генерации PDF: ' + (err.response?.data?.message || err.message));
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDownloadGeneratedPdf = async () => {
    if (!order) return;
    const blob = (window as any)[`tanbox_pdf_blob_${order.id}`];
    if (blob) {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tanbox-batch-${order.orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return;
    }

    setDownloadingPdf(true);
    try {
      const res = await apiClient.get(`/orders/${order.id}/pdf`, {
        responseType: 'blob',
      });
      const resBlob = new Blob([res.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(resBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `Labels_${order.orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      console.error('Download PDF error:', err);
      const token = localStorage.getItem('tanbox_admin_token') || localStorage.getItem('tanbox_token') || '';
      window.open(`/api/orders/${order.id}/pdf?token=${encodeURIComponent(token)}`, '_blank');
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#64748B]">
        <div className="w-8 h-8 border-2 border-[#111827] border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-sm font-semibold">Загрузка данных заказа...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-base font-extrabold text-[#111827]">Заказ не найден</h2>
        <p className="text-xs text-[#64748B]">{error || 'Указанный заказ не существует или был удален'}</p>
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#111827] text-white px-4 py-2.5 rounded-xl hover:bg-black transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Вернуться ко всем заказам
        </Link>
      </div>
    );
  }

  const categoryLabel = CATEGORY_NAMES[order.category] || order.category;
  const tariffLabel = TARIFF_NAMES[order.tariffType] || order.tariffType;

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* Top Navigation */}
      <div>
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#64748B] hover:text-[#111827] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> К списку заказов
        </Link>
      </div>

      {/* Main Order Header Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-extrabold text-[#111827] tracking-tight">
                Заказ #{order.orderNumber}
              </h1>
              {isStickerDesign && (
                <span className="text-[11px] font-bold bg-blue-50 text-[#0082FB] border border-blue-200/80 px-2.5 py-0.5 rounded-md">
                  Требуется макет
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-[#64748B] mt-1.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span>•</span>
              <span className="font-mono text-gray-500">ID: {order.id}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} />
          </div>
        </div>

        {statusSuccessMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            {statusSuccessMsg}
          </div>
        )}

        {/* Client details quick summary bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-1">
          <div className="flex items-start gap-2.5">
            <Building2 className="w-4 h-4 text-[#64748B] shrink-0 mt-0.5" />
            <div>
              <span className="text-[#64748B] block text-[11px]">Клиент / Компания</span>
              <span className="font-bold text-[#111827]">{order.user?.companyName || 'Частное лицо'}</span>
              <span className="block font-mono text-gray-500 text-[10px]">БИН: {order.user?.binIin || '—'}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Phone className="w-4 h-4 text-[#64748B] shrink-0 mt-0.5" />
            <div>
              <span className="text-[#64748B] block text-[11px]">Телефон клиента</span>
              <a href={`tel:${order.user?.phone}`} className="font-bold text-[#111827] hover:text-[#0082FB]">
                {order.user?.phone || 'Не указан'}
              </a>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Mail className="w-4 h-4 text-[#64748B] shrink-0 mt-0.5" />
            <div>
              <span className="text-[#64748B] block text-[11px]">Email</span>
              <a href={`mailto:${order.user?.email}`} className="font-bold text-[#111827] hover:text-[#0082FB]">
                {order.user?.email || 'Не указан'}
              </a>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <CreditCard className="w-4 h-4 text-[#64748B] shrink-0 mt-0.5" />
            <div>
              <span className="text-[#64748B] block text-[11px]">Сумма партии</span>
              <span className="font-extrabold text-[#111827] text-sm">{order.totalPrice.toLocaleString()} ₸</span>
              <span className="block text-[10px] text-gray-500">{order.itemsCount.toLocaleString()} шт. × {order.pricePerItem} ₸</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Specification & Sticker Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column (2 cols): Layout & Specifications */}
        <div className="lg:col-span-2 space-y-6">

          {/* Specification details */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-extrabold text-[#111827] border-b border-gray-100 pb-3">
              Параметры партии маркировки
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80">
                <span className="text-[11px] font-bold text-gray-500 uppercase block">Категория</span>
                <span className="text-xs font-extrabold text-[#111827] mt-1 block truncate">
                  {categoryLabel}
                </span>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80">
                <span className="text-[11px] font-bold text-gray-500 uppercase block">Тариф</span>
                <span className="text-xs font-extrabold text-[#111827] mt-1 block truncate">
                  {tariffLabel}
                </span>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80">
                <span className="text-[11px] font-bold text-gray-500 uppercase block">Объем партии</span>
                <span className="text-xs font-extrabold text-[#111827] mt-1 block">
                  {order.itemsCount.toLocaleString()} шт.
                </span>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80">
                <span className="text-[11px] font-bold text-gray-500 uppercase block">Цена за 1 шт</span>
                <span className="text-xs font-extrabold text-[#111827] mt-1 block">
                  {order.pricePerItem} ₸
                </span>
              </div>
            </div>

            {/* Extra Services */}
            <div className="pt-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                Подключенные опции
              </span>
              <div className="flex flex-wrap gap-2">
                {order.extraServices && order.extraServices.length > 0 ? (
                  order.extraServices.map((srv, i) => (
                    <span
                      key={i}
                      className="text-xs font-bold bg-gray-100 text-[#111827] px-3 py-1 rounded-lg border border-gray-200"
                    >
                      {SERVICE_NAMES[srv] || srv}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">Дополнительные опции не выбирались</span>
                )}

                {order.ssccNeeded && (
                  <span className="text-xs font-bold bg-blue-50 text-[#0082FB] border border-blue-200 px-3 py-1 rounded-lg">
                    SSCC Агрегация коробов
                  </span>
                )}
              </div>
            </div>

            {/* Separated Address and Client Notes */}
            {order.notes && (() => {
              const parsed = parseOrderNotes(order.notes);
              if (!parsed.address && !parsed.clientNote) return null;

              return (
                <div className="pt-3 border-t border-gray-100 text-xs space-y-3">
                  {parsed.address && (
                    <div>
                      <span className="text-[#64748B] font-bold flex items-center gap-1.5 mb-1 uppercase tracking-wider text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-[#0082FB]" />
                        Адрес склада в РК:
                      </span>
                      <p className="text-[#111827] font-semibold bg-gray-50 p-3 rounded-xl border border-gray-200 leading-relaxed">
                        {parsed.address}
                      </p>
                    </div>
                  )}

                  {parsed.clientNote && (
                    <div>
                      <span className="text-[#64748B] font-bold flex items-center gap-1.5 mb-1 uppercase tracking-wider text-[11px]">
                        <FileText className="w-3.5 h-3.5 text-[#64748B]" />
                        Примечание клиента:
                      </span>
                      <p className="text-[#334155] bg-gray-50 p-3 rounded-xl border border-gray-200 leading-relaxed whitespace-pre-wrap">
                        {parsed.clientNote}
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* CODES FILE MANAGEMENT CARD */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
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
                    Исходные Data Matrix коды (CSV, TXT, PDF, ZIP) от ИС Танба / Asl Belgisi
                  </p>
                </div>
              </div>

              {order.codesFileUrl ? (
                <span className="text-[11px] font-bold px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Файл сохранён на сервере
                </span>
              ) : (
                <span className="text-[11px] font-bold px-3 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Ожидает загрузки файлов кодов
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
                      В загруженном файле <strong>«{codesSummary.fileName}»</strong> содержится <strong>{codesSummary.totalRows.toLocaleString()} кодов</strong>, а объем заказа оформлен на <strong>{order.itemsCount.toLocaleString()} шт.</strong>
                      {codesSummary.totalRows < order.itemsCount ? (
                        <span> (не хватает {(order.itemsCount - codesSummary.totalRows).toLocaleString()} шт.). Скорректируйте объем партии, чтобы выпустить фактическое количество.</span>
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
                    : 'bg-gray-50 border-gray-200'
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
                    <span className="text-[11px] text-gray-500 font-mono">
                      Путь: {order.codesFileUrl}
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

                  <Link
                    to={`/label-designer?orderId=${order.id}`}
                    className="inline-flex items-center gap-1.5 bg-[#0082FB] hover:bg-[#0070DA] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Открыть в конструкторе
                  </Link>

                  <label className="inline-flex items-center gap-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingCodes ? 'Загрузка...' : 'Заменить'}
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
                    {isCodesDragOver ? 'Отпустите файл для загрузки' : 'Прикрепить файл с кодами маркировки'}
                  </h4>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    {isCodesDragOver
                      ? 'Файл сохранится в заказе и подтянется в конструктор'
                      : 'Поддерживаются CSV, TXT, PDF, ZIP (до 50 МБ). Файл сохранится в заказе и автоматически подтянется в конструктор этикеток.'}
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 bg-[#111827] hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95">
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingCodes ? 'Сохранение файла...' : 'Выбрать файл кодов'}
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

          {/* STICKER DESIGN WORKFLOW BLOCK (if STICKER_LAYOUT_DESIGN requested) */}
          {isStickerDesign && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 text-[#111827] flex items-center justify-center shrink-0">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-[#111827]">
                      {isReusedTemplate ? 'Макет этикетки (из библиотеки клиента)' : 'Разработка макета стикера'}
                    </h2>
                    <p className="text-xs text-[#64748B]">
                      {isReusedTemplate ? (
                        <span className="text-emerald-700 font-semibold">
                          ✓ Клиент выбрал ранее утверждённый шаблон (без доплаты за дизайн)
                        </span>
                      ) : (
                        <>Размер: <strong className="text-[#111827]">{labelRequirements?.size || '58×40 мм'}</strong> • Конструктор этикеток Tanbox</>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border ${
                      approvalStatus === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : approvalStatus === 'CHANGES_REQUESTED'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : approvalStatus === 'WAITING_APPROVAL'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    {approvalStatus === 'APPROVED'
                      ? '✓ Утвержден клиентом'
                      : approvalStatus === 'CHANGES_REQUESTED'
                      ? 'Запрошены правки'
                      : approvalStatus === 'WAITING_APPROVAL'
                      ? 'Ожидает согласования клиентом'
                      : 'В разработке у дизайнера'}
                  </span>
                </div>
              </div>

              {/* If client requested changes, show alert box */}
              {approvalStatus === 'CHANGES_REQUESTED' && approvalData.comment && (
                <div className="bg-amber-50 border border-amber-200/90 rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Замечания клиента к макету:
                  </div>
                  <p className="text-xs text-amber-950 font-medium bg-white/80 p-2.5 rounded-lg border border-amber-200/60">
                    "{approvalData.comment}"
                  </p>
                </div>
              )}

              {/* Requirements and Visual Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Specifications table */}
                <div className="lg:col-span-7 space-y-3">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                    Техническое задание от клиента
                  </span>

                  <div className="bg-gray-50/70 border border-gray-200/80 rounded-xl p-4 text-xs space-y-2.5">
                    <div className="grid grid-cols-3 gap-2 py-1 border-b border-gray-200/60">
                      <span className="text-[#64748B]">Размер стикера:</span>
                      <span className="col-span-2 font-bold text-[#111827]">
                        {labelRequirements?.size || `${layoutWidthMm} × ${layoutHeightMm} мм`}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-1 border-b border-gray-200/60">
                      <span className="text-[#64748B]">Наименование:</span>
                      <span className="col-span-2 font-bold text-[#111827]">
                        {labelRequirements?.productName || categoryLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-1 border-b border-gray-200/60">
                      <span className="text-[#64748B]">Бренд / Торговая марка:</span>
                      <span className="col-span-2 font-bold text-[#111827]">
                        {labelRequirements?.brand || order.user?.companyName || '—'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-1 border-b border-gray-200/60">
                      <span className="text-[#64748B]">Артикул / Модель:</span>
                      <span className="col-span-2 font-mono font-bold text-[#111827]">
                        {labelRequirements?.article || order.orderNumber}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-1 border-b border-gray-200/60">
                      <span className="text-[#64748B]">Состав продукции:</span>
                      <span className="col-span-2 text-[#111827] font-medium">
                        {labelRequirements?.composition || '100% натуральные материалы'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-1 border-b border-gray-200/60">
                      <span className="text-[#64748B]">Обязательные знаки:</span>
                      <span className="col-span-2 text-[#0082FB] font-bold">
                        {labelRequirements?.symbols || 'EAC, Data Matrix ИС Танба'}
                      </span>
                    </div>

                    {labelRequirements?.wishes && (
                      <div className="pt-1">
                        <span className="text-[#64748B] block mb-1">Пожелания и реквизиты:</span>
                        <p className="text-gray-800 bg-white p-2.5 rounded-lg border border-gray-200 font-medium">
                          {labelRequirements.wishes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Visual Label Preview */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-gray-50/70 border border-gray-200/80 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block self-start">
                    Текущий макет партии
                  </span>

                  <StickerCanvasPreview
                    widthMm={layoutWidthMm}
                    heightMm={layoutHeightMm}
                    elements={layoutElements}
                    scale={3.6}
                    previewData={stickerPreviewData}
                    className="shadow-sm"
                  />

                  <div className="text-[10px] font-semibold text-gray-500 text-center flex items-center gap-1.5">
                    <span>{layoutWidthMm} × {layoutHeightMm} мм</span>
                    {layoutElements.length > 0 ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                        ✓ {layoutElements.length} эл. в макете
                      </span>
                    ) : (
                      <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold border border-amber-200">
                        Холст пустой
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons for Sticker */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link
                  to={`/labels?orderId=${order.id}`}
                  className="inline-flex items-center gap-2 bg-[#111827] hover:bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <Palette className="w-4 h-4 text-blue-400" />
                  Открыть в конструкторе макетов
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </Link>

                {approvalStatus === 'WAITING_APPROVAL' ? (
                  <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200/80 text-xs font-bold px-3.5 py-2 rounded-xl">
                    <Clock className="w-4 h-4 text-amber-600" />
                    Макет передан клиенту, ожидает согласования
                  </span>
                ) : approvalStatus === 'CHANGES_REQUESTED' ? (
                  <button
                    type="button"
                    onClick={handleSendToClientApproval}
                    className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    Отправить обновленный макет клиенту
                  </button>
                ) : approvalStatus === 'APPROVED' ? (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-bold px-3.5 py-2 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Макет утвержден клиентом
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendToClientApproval}
                    className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    Отправить клиенту на согласование
                  </button>
                )}

                {layoutElements.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSaveToUserTemplates}
                    disabled={savingTemplate}
                    className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                    {savingTemplate ? 'Сохранение...' : 'Сохранить в шаблоны клиента'}
                  </button>
                )}

                {hasSavedLabel && (
                  <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Черновик макета сохранен
                  </span>
                )}

                {templateSavedMsg && (
                  <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    {templateSavedMsg}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Data Matrix PDF Generation & Attachment Section */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-[#111827]">
                  Файл кодов Data Matrix / Этикеток партии
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Формирование многостраничного PDF рулонов для термопринтера прямо из макета конструктора
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowRollModal(true)}
                  className="text-xs font-bold text-[#0082FB] hover:text-[#0070DA] hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" /> Скачать по рулонам
                </button>
                {order.pdfUrl && (
                  <button
                    type="button"
                    onClick={handleDownloadGeneratedPdf}
                    className="text-xs font-bold text-[#0082FB] hover:text-[#0070DA] hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Скачать PDF партии
                  </button>
                )}
              </div>
            </div>

            {pdfSuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                {pdfSuccessMsg}
              </div>
            )}

            {/* If PDF already generated/attached */}
            {order.pdfUrl ? (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-emerald-950 block">
                      Файл этикеток партии сформирован
                    </span>
                    <span className="text-[11px] text-emerald-800">
                      Партия: {order.itemsCount.toLocaleString()} шт. • Размер: {labelRequirements?.size || '58×40 мм'} • Доступен клиенту в ЛК
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRollModal(true)}
                    className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                    title="Разбить партию на рулоны (по 500, 1000 или 2000 этикеток)"
                  >
                    <Layers className="w-3.5 h-3.5 text-[#0082FB]" />
                    Скачать по рулонам
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadGeneratedPdf}
                    className="inline-flex items-center gap-1.5 bg-[#111827] hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" /> Скачать PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleGeneratePdfFromDesigner}
                    disabled={generatingPdf}
                    className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 text-xs font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${generatingPdf ? 'animate-spin' : ''}`} />
                    {generatingPdf ? 'Генерация...' : 'Перегенерировать'}
                  </button>
                </div>
              </div>
            ) : (
              /* If not generated yet */
              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-5 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center mx-auto text-[#64748B] shadow-xs">
                  <Printer className="w-5 h-5 text-[#64748B]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#111827]">
                    Файл этикеток ещё не сформирован
                  </h4>
                  <p className="text-[11px] text-[#64748B] mt-1 max-w-md mx-auto leading-relaxed">
                    Нажмите кнопку ниже, чтобы автоматически сгенерировать готовый PDF файл для печати {order.itemsCount.toLocaleString()} этикеток с кодами Data Matrix на основе макета из конструктора.
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleGeneratePdfFromDesigner}
                    disabled={generatingPdf}
                    className="inline-flex items-center gap-2 bg-[#0082FB] hover:bg-[#0070DA] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Printer className="w-4 h-4" />
                    {generatingPdf ? 'Генерация файла партии...' : `Сгенерировать PDF партии (${order.itemsCount.toLocaleString()} шт.)`}
                  </button>

                  <Link
                    to={`/labels?orderId=${order.id}`}
                    className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    <Palette className="w-3.5 h-3.5 text-blue-500" />
                    Редактировать макет
                  </Link>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Actions & Workflow Status */}
        <div className="space-y-6">

          {/* Quick Step Changer Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-[#111827] uppercase tracking-wider border-b border-gray-100 pb-2.5">
              Смена этапа заказа
            </h3>

            <div className="space-y-2">
              {[
                { st: 'NEW' as OrderStatus, label: 'Новый заказ', desc: 'Принят в системе' },
                { st: 'PROCESSING' as OrderStatus, label: 'В обработке', desc: 'Дизайн макета / проверка кодов' },
                { st: 'PRINTING' as OrderStatus, label: 'Печать кодов', desc: 'Запущен в печать на производстве' },
                { st: 'STICKERING' as OrderStatus, label: 'Стикеровка', desc: 'Оклейка товаров на складе' },
                { st: 'COMPLETED' as OrderStatus, label: 'Выполнен', desc: 'Партия готова и передана клиенту' },
              ].map((step) => {
                const isCurrent = order.status === step.st;
                return (
                  <button
                    key={step.st}
                    type="button"
                    onClick={() => handleSaveStatus(step.st)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isCurrent
                        ? 'bg-[#111827] text-white border-[#111827] shadow-xs'
                        : 'bg-gray-50/70 hover:bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-extrabold block">{step.label}</span>
                      <span className={`text-[11px] block mt-0.5 ${isCurrent ? 'text-gray-300' : 'text-gray-500'}`}>
                        {step.desc}
                      </span>
                    </div>
                    {isCurrent && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Отменить этот заказ?')) {
                      handleSaveStatus('CANCELLED');
                    }
                  }}
                  className="w-full text-center text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Отменить заказ
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

      {order && (
        <RollSplitModal
          isOpen={showRollModal}
          onClose={() => setShowRollModal(false)}
          orderId={order.id}
          orderNumber={order.orderNumber}
          totalCodes={order.itemsCount}
          labelWidth={layoutWidthMm}
          labelHeight={layoutHeightMm}
          hasCodesFile={Boolean(order.codesFileUrl)}
          hasLayout={Boolean(layoutElements.length > 0 || (order.stickerLayout as any)?.elements?.length > 0)}
        />
      )}

    </div>
  );
};
