import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { OrderAdminItem, OrderStatus } from '../types';
import { StatusBadge, parseOrderNotes } from '@shared';
import { downloadHtmlAsPdf } from '../utils/clientPdf';
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
  Eye,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  Layers,
  BookmarkCheck,
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  Tag,
  Boxes,
  Calculator,
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

  // Print permission and payment state
  const [updatingPrintPermission, setUpdatingPrintPermission] = useState<boolean>(false);
  const [printPermissionMsg, setPrintPermissionMsg] = useState<string | null>(null);
  const [downloadingDoc, setDownloadingDoc] = useState<'invoice' | 'act' | null>(null);

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

      // Check if template is already saved in client's template library
      if (res.data.isTemplateSaved || res.data.savedTemplate || res.data.templateId) {
        setTemplateSaved(true);
        if (res.data.savedTemplate) {
          setSavedTemplateInfo(res.data.savedTemplate);
        }
      }
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

      const sizeStr = getVal('Размер этикетки:', 'Размер:') || '58 × 40 мм';
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
        productName: getVal('Наименование товара:', 'Товар:'),
        brand: getVal('Бренд:'),
        article: getVal('Артикул:'),
        composition: getVal('Состав/Материал:', 'Состав:'),
        symbols: getVal('Обязательные знаки:', 'Знаки:'),
        barcode: getVal('Штрихкод (EAN-13):', 'Штрихкод EAN-13:', 'Штрихкод:'),
        wishes: getVal('Пожелания:', 'Пожелания/текст:'),
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
  const [templateSaved, setTemplateSaved] = useState<boolean>(false);
  const [savedTemplateInfo, setSavedTemplateInfo] = useState<{ id?: string; name?: string } | null>(null);
  const [templateSavedMsg, setTemplateSavedMsg] = useState<string | null>(null);

  const isTemplateAlreadySaved = Boolean(
    templateSaved ||
    (order as any)?.isTemplateSaved ||
    (order as any)?.templateId ||
    savedTemplateInfo ||
    isReusedTemplate
  );

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
    if (isTemplateAlreadySaved) {
      alert(`Шаблон для этого заказа уже сохранён в библиотеке клиента ${savedTemplateInfo?.name ? `(«${savedTemplateInfo.name}»)` : ''}. Повторное сохранение заблокировано во избежание дубликатов.`);
      return;
    }

    const defaultName = `${labelRequirements?.productName || order.category || 'Этикетка'} ${layoutWidthMm}×${layoutHeightMm} мм`;
    const templateName = window.prompt(
      'Введите название шаблона для сохранения в библиотеку клиента:',
      defaultName
    );
    if (!templateName || !templateName.trim()) return;

    setSavingTemplate(true);
    try {
      const res = await apiClient.post('/user-templates', {
        targetUserId: order.userId,
        name: templateName.trim(),
        category: order.category,
        widthMm: layoutWidthMm,
        heightMm: layoutHeightMm,
        elements: layoutElements,
        sourceOrderId: order.id,
      });
      setTemplateSaved(true);
      const createdTpl = res.data.template;
      setSavedTemplateInfo({ id: createdTpl?.id, name: createdTpl?.name || templateName.trim() });
      setTemplateSavedMsg(`Шаблон «${templateName.trim()}» успешно сохранён в библиотеку клиента!`);
      setTimeout(() => setTemplateSavedMsg(null), 5000);
    } catch (err: any) {
      if (err.response?.data?.alreadyExists) {
        setTemplateSaved(true);
        if (err.response?.data?.template) {
          setSavedTemplateInfo(err.response.data.template);
        }
      }
      alert(err.response?.data?.message || err.message || 'Ошибка при сохранении в библиотеку');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleUpdateUserTemplate = async () => {
    let targetId = savedTemplateInfo?.id || (order as any)?.templateId;
    if (!order || !layoutElements.length) return;

    if (!targetId) {
      try {
        const tplRes = await apiClient.get(`/user-templates?userId=${order.userId}`);
        const found = tplRes.data?.templates?.find((t: any) => t.sourceOrderId === order.id);
        if (found) {
          targetId = found.id;
          setSavedTemplateInfo(found);
        }
      } catch (e) {
        console.warn('Could not auto-resolve template ID:', e);
      }
    }

    if (!targetId) {
      alert('Не удалось определить идентификатор шаблона для обновления');
      return;
    }

    const tplName = savedTemplateInfo?.name || 'текущий шаблон';
    if (!window.confirm(`Обновить существующий шаблон «${tplName}» в библиотеке клиента текущей версией макета?`)) {
      return;
    }
    setSavingTemplate(true);
    try {
      const res = await apiClient.put(`/user-templates/${targetId}`, {
        widthMm: layoutWidthMm,
        heightMm: layoutHeightMm,
        elements: layoutElements,
        category: order.category,
      });
      if (res.data?.template) {
        setSavedTemplateInfo(res.data.template);
      }
      setTemplateSavedMsg(`Шаблон «${res.data?.template?.name || tplName}» успешно обновлен!`);
      setTimeout(() => setTemplateSavedMsg(null), 5000);
    } catch (err: any) {
      alert('Ошибка при обновлении шаблона: ' + (err.response?.data?.message || err.message));
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

  // Toggle print permission and payment status
  const handleTogglePrintPermission = async (allow: boolean, newPaymentStatus?: string) => {
    if (!order) return;
    setUpdatingPrintPermission(true);
    const statusToSet = newPaymentStatus !== undefined ? newPaymentStatus : (allow ? 'PAID' : 'UNPAID');
    try {
      const res = await apiClient.patch(`/orders/${order.id}/print-permission`, {
        printAllowed: allow,
        paymentStatus: statusToSet,
      });
      setOrder((prev) => (prev ? { ...prev, printAllowed: allow, paymentStatus: statusToSet } : prev));
      setPrintPermissionMsg(
        allow
          ? 'Доступ к печати партии ОТКРЫТ (оплата подтверждена)'
          : 'Доступ к печати партии ЗАБЛОКИРОВАН'
      );
      setTimeout(() => setPrintPermissionMsg(null), 4000);
    } catch (err: any) {
      alert('Ошибка при обновлении доступа к печати: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingPrintPermission(false);
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
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Поддерживаются только файлы выгрузки кодов в формате .CSV');
      return;
    }
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
      alert('Ошибка при скачивании файла кодов: ' + (err.response?.data?.message || err.message));
    } finally {
      setDownloadingCodes(false);
    }
  };

  const handleApproveLayoutDirectly = async () => {
    if (!order) return;
    try {
      const res = await apiClient.patch(`/orders/${order.id}/sticker-approval`, {
        approvalStatus: 'APPROVED',
      });
      setOrder(res.data.order);
      setCodesSuccessMsg('Макет этикетки успешно утверждён!');
      setTimeout(() => setCodesSuccessMsg(null), 4000);
    } catch (err: any) {
      alert('Ошибка при согласовании макета: ' + (err.response?.data?.message || err.message));
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

      // 1. Persist current designer layout to order
      await apiClient.patch(`/orders/${order.id}/sticker-layout`, {
        stickerLayout: {
          widthMm: w,
          heightMm: h,
          elements: templateElements,
        },
      });

      // 2. Request PDF generation on the backend with force=true (processes all codes from uploaded file/DB)
      const response = await apiClient.get(`/orders/${order.id}/pdf?force=true`, {
        responseType: 'blob',
        timeout: 600000,
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const generatedPath = `/api/orders/${order.id}/pdf`;

      // Save generated blob to memory / local reference so user can download directly
      (window as any)[`tanbox_pdf_blob_${order.id}`] = blob;
      setPdfUrl(generatedPath);
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              pdfUrl: generatedPath,
              stickerLayout: { widthMm: w, heightMm: h, elements: templateElements },
            }
          : prev
      );
      setPdfSuccessMsg(`PDF этикеток партии (${order.itemsCount.toLocaleString()} шт.) успешно сформирован на основе макета!`);
      setTimeout(() => setPdfSuccessMsg(null), 5000);
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
      link.download = `Labels_${order.orderNumber}_(${order.itemsCount}pcs).pdf`;
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
        timeout: 600000,
      });
      const resBlob = new Blob([res.data], { type: 'application/pdf' });
      (window as any)[`tanbox_pdf_blob_${order.id}`] = resBlob;
      const blobUrl = window.URL.createObjectURL(resBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `Labels_${order.orderNumber}_(${order.itemsCount}pcs).pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      console.error('Download PDF error:', err);
      alert('Ошибка при скачивании PDF: ' + (err.response?.data?.message || err.message));
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadAct = async () => {
    if (!order) return;
    setDownloadingDoc('act');
    try {
      const res = await apiClient.get(`/orders/${order.id}/act`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `Act_${order.orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (err: any) {
      console.error('Download act error:', err);
      alert('Ошибка при формировании Акта выполненных работ: ' + (err.response?.data?.message || err.message));
    } finally {
      setDownloadingDoc(null);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;
    setDownloadingDoc('invoice');
    try {
      const res = await apiClient.get(`/orders/${order.id}/invoice`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `Invoice_${order.orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (err: any) {
      console.error('Download invoice error:', err);
      alert('Ошибка при формировании Счёта на оплату: ' + (err.response?.data?.message || err.message));
    } finally {
      setDownloadingDoc(null);
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
            <StatusBadge status={order.status} tariffType={order.tariffType} />
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

            {/* Separated Address, Warehouse Conditions, and Client Notes */}
            {(() => {
              const parsed = parseOrderNotes(order.notes);
              const isOnSite = order.tariffType === 'STANDARD' || order.tariffType === 'PRO' || order.extraServices?.includes('ON_SITE_STICKERING') || Boolean(parsed.warehouseConditions);

              if (!parsed.address && !parsed.clientNote && !isOnSite) return null;

              return (
                <div className="pt-3 border-t border-gray-100 text-xs space-y-4">
                  {/* Warehouse address */}
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

                  {/* On-Site Stickering Estimate & Details */}
                  {isOnSite && (
                    parsed.confirmedEstimate ? (
                      <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-xs font-bold text-[#111827]">
                                  Смета выездной оклейки утверждена
                                </h3>
                                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                  {parsed.confirmedEstimate.date || 'Рассчитано'}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#64748B] mt-0.5">
                                Данные применены к заказу и отображаются в счёте и акте
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={handleDownloadInvoice}
                              disabled={downloadingDoc === 'invoice'}
                              className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                              title="Открыть официальный счёт на оплату в формате PDF"
                            >
                              <FileText className="w-3.5 h-3.5 text-gray-400" />
                              {downloadingDoc === 'invoice' ? 'Создание PDF...' : 'Счёт на оплату'}
                            </button>

                            <button
                              type="button"
                              onClick={handleDownloadAct}
                              disabled={downloadingDoc === 'act'}
                              className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                              title="Открыть официальный АВР в формате PDF"
                            >
                              <FileText className="w-3.5 h-3.5 text-gray-400" />
                              {downloadingDoc === 'act' ? 'Создание PDF...' : 'АВР'}
                            </button>

                            <Link
                              to={`/stickering-calc?orderId=${order.id}&orderNumber=${order.orderNumber}&category=${order.category}&count=${order.itemsCount}&climate=${parsed.warehouseConditions?.climateCode || 'WARM_HEATED'}&storage=${parsed.warehouseConditions?.storageTypeCode || 'PALLETS'}&company=${encodeURIComponent(order.user?.companyName || '')}`}
                              className="inline-flex items-center gap-1.5 bg-[#111827] hover:bg-black text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer active:scale-95"
                            >
                              <Calculator className="w-3.5 h-3.5" />
                              Пересчитать
                            </Link>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-gray-50/70 border border-gray-200/80 p-3.5 rounded-xl">
                            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Бригада</span>
                            <span className="font-extrabold text-[#111827] mt-1 block text-sm">
                              {parsed.confirmedEstimate.workersCount || 1} чел.
                            </span>
                          </div>

                          <div className="bg-gray-50/70 border border-gray-200/80 p-3.5 rounded-xl">
                            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Срок работ</span>
                            <span className="font-extrabold text-[#111827] mt-1 block text-sm">
                              {parsed.confirmedEstimate.daysNeeded || 1} дн. <span className="text-xs font-medium text-gray-500">(~{parsed.confirmedEstimate.manHours || 0} ч.)</span>
                            </span>
                          </div>

                          <div className="bg-gray-50/70 border border-gray-200/80 p-3.5 rounded-xl">
                            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Тариф за шт.</span>
                            <span className="font-extrabold text-emerald-700 mt-1 block text-sm">
                              {parsed.confirmedEstimate.clientPricePerUnit || order.pricePerItem} ₸
                            </span>
                          </div>

                          <div className="bg-gray-50/70 border border-gray-200/80 p-3.5 rounded-xl">
                            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Сумма партии</span>
                            <span className="font-extrabold text-[#111827] mt-1 block text-sm">
                              {(parsed.confirmedEstimate.totalPrice || order.totalPrice).toLocaleString()} ₸
                            </span>
                          </div>
                        </div>

                        {parsed.confirmedEstimate.materials && (
                          <div className="flex items-center gap-2.5 text-xs text-gray-600 bg-gray-50/70 px-3.5 py-2.5 rounded-xl border border-gray-200/80">
                            <Package className="w-4 h-4 text-gray-400 shrink-0" />
                            <span>Расходные материалы: <strong className="text-[#111827] font-semibold">{parsed.confirmedEstimate.materials}</strong></span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-blue-50/50 border border-blue-200/90 rounded-2xl space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100/80 pb-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#0082FB] flex items-center justify-center shrink-0">
                              <Boxes className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-xs font-extrabold text-[#111827] block">
                                Выездная оклейка на складе
                              </span>
                              <span className="text-[10px] text-gray-500 font-medium">
                                Условия складирования и параметры объекта клиента
                              </span>
                            </div>
                          </div>

                          <Link
                            to={`/stickering-calc?orderId=${order.id}&orderNumber=${order.orderNumber}&category=${order.category}&count=${order.itemsCount}&climate=${parsed.warehouseConditions?.climateCode || 'WARM_HEATED'}&storage=${parsed.warehouseConditions?.storageTypeCode || 'PALLETS'}&company=${encodeURIComponent(order.user?.companyName || '')}`}
                            className="inline-flex items-center gap-1.5 bg-[#0082FB] hover:bg-[#0070DA] text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer shrink-0 active:scale-95"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                            Рассчитать смету и наряд на выезд
                          </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div className="bg-white/80 border border-blue-200/60 p-2.5 rounded-xl">
                            <span className="text-[10px] uppercase font-bold text-gray-400 block">Размещение</span>
                            <span className="font-bold text-[#111827] mt-0.5 block text-xs">
                              {parsed.warehouseConditions?.storageType || 'На паллетах в коробах'}
                            </span>
                          </div>

                          <div className="bg-white/80 border border-blue-200/60 p-2.5 rounded-xl">
                            <span className="text-[10px] uppercase font-bold text-gray-400 block">Температурный режим</span>
                            <span className="font-bold text-[#111827] mt-0.5 block text-xs">
                              {parsed.warehouseConditions?.climate || 'Тёплый склад (Класс А/В)'}
                            </span>
                          </div>

                          <div className="bg-white/80 border border-blue-200/60 p-2.5 rounded-xl">
                            <span className="text-[10px] uppercase font-bold text-gray-400 block">Складская техника</span>
                            <span className="font-bold text-[#111827] mt-0.5 block text-xs">
                              {parsed.warehouseConditions?.equipment || 'Есть рохля / погрузчик'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-[#334155] bg-white/70 p-2.5 rounded-xl border border-blue-100">
                          <Clock className="w-3.5 h-3.5 text-[#0082FB] shrink-0" />
                          <span className="font-medium">
                            <strong>SLA заявки:</strong> расчет сметы и согласование выезда в течение 2 часов.
                          </span>
                        </div>
                      </div>
                    )
                  )}

                  {/* Client Note */}
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
                    Исходные Data Matrix коды (CSV) от ИС Танба / Asl Belgisi / Честный Знак
                  </p>
                </div>
              </div>

              {!order.codesFileUrl && (
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

                  <Link
                    to={`/labels?orderId=${order.id}`}
                    className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-xs"
                    title="Посмотреть все коды этого заказа в общем реестре"
                  >
                    <Tag className="w-3.5 h-3.5 text-blue-500" />
                    В реестр кодов
                  </Link>

                  <label className="inline-flex items-center gap-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingCodes ? 'Загрузка...' : 'Заменить'}
                    <input
                      type="file"
                      accept=".csv"
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
                      : 'Поддерживается формат CSV (до 50 МБ). Файл сохранится в заказе и автоматически подтянется в конструктор этикеток.'}
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 bg-[#111827] hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95">
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingCodes ? 'Сохранение файла...' : 'Выбрать файл кодов'}
                  <input
                    ref={codesFileInputRef}
                    type="file"
                    accept=".csv"
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

                    {labelRequirements?.productName && (
                      <div className="grid grid-cols-3 gap-2 py-1 border-b border-gray-200/60">
                        <span className="text-[#64748B]">Наименование:</span>
                        <span className="col-span-2 font-bold text-[#111827]">
                          {labelRequirements.productName}
                        </span>
                      </div>
                    )}

                    {labelRequirements?.brand && (
                      <div className="grid grid-cols-3 gap-2 py-1 border-b border-gray-200/60">
                        <span className="text-[#64748B]">Бренд / Торговая марка:</span>
                        <span className="col-span-2 font-bold text-[#111827]">
                          {labelRequirements.brand}
                        </span>
                      </div>
                    )}

                    {labelRequirements?.article && (
                      <div className="grid grid-cols-3 gap-2 py-1 border-b border-gray-200/60">
                        <span className="text-[#64748B]">Артикул / Модель:</span>
                        <span className="col-span-2 font-mono font-bold text-[#111827]">
                          {labelRequirements.article}
                        </span>
                      </div>
                    )}

                    {labelRequirements?.composition && (
                      <div className="grid grid-cols-3 gap-2 py-1 border-b border-gray-200/60">
                        <span className="text-[#64748B]">Состав продукции:</span>
                        <span className="col-span-2 text-[#111827] font-medium">
                          {labelRequirements.composition}
                        </span>
                      </div>
                    )}

                    {labelRequirements?.symbols && (
                      <div className="grid grid-cols-3 gap-2 py-1 border-b border-gray-200/60">
                        <span className="text-[#64748B]">Обязательные знаки:</span>
                        <span className="col-span-2 text-[#0082FB] font-bold">
                          {labelRequirements.symbols}
                        </span>
                      </div>
                    )}

                    {labelRequirements?.barcode && (
                      <div className="grid grid-cols-3 gap-2 py-1 border-b border-gray-200/60">
                        <span className="text-[#64748B]">Штрихкод EAN-13:</span>
                        <span className="col-span-2 font-mono font-bold text-[#111827]">
                          {labelRequirements.barcode}
                        </span>
                      </div>
                    )}

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

                  <div className="text-[10px] font-semibold text-gray-500 text-center">
                    <span>{layoutWidthMm} × {layoutHeightMm} мм</span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar for Sticker Layout & Library */}
              <div className="pt-4 border-t border-gray-100 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                {/* Left group: Designer CTA + Approval Status */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Link
                    to={`/label-designer?orderId=${order.id}`}
                    className="inline-flex items-center gap-2 bg-[#111827] hover:bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 group shrink-0 whitespace-nowrap"
                  >
                    <Palette className="w-4 h-4 text-blue-400 group-hover:rotate-12 transition-transform" />
                    <span>Открыть в конструкторе макетов</span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  {approvalStatus === 'WAITING_APPROVAL' ? (
                    <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200/80 text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-2xs whitespace-nowrap shrink-0">
                      <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                      Ожидает согласования клиентом
                    </span>
                  ) : approvalStatus === 'CHANGES_REQUESTED' ? (
                    <button
                      type="button"
                      onClick={handleSendToClientApproval}
                      className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 whitespace-nowrap shrink-0"
                    >
                      <Check className="w-4 h-4" />
                      Отправить обновленный макет клиенту
                    </button>
                  ) : approvalStatus === 'APPROVED' ? (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-2xs whitespace-nowrap shrink-0">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Макет утвержден клиентом
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendToClientApproval}
                      className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 whitespace-nowrap shrink-0"
                    >
                      <Check className="w-4 h-4" />
                      Отправить клиенту на согласование
                    </button>
                  )}

                  {/* Show draft pill only if not approved and not saved to template library */}
                  {hasSavedLabel && approvalStatus !== 'APPROVED' && !isTemplateAlreadySaved && (
                    <span className="text-xs text-slate-600 font-medium flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/70 whitespace-nowrap shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Черновик сохранён
                    </span>
                  )}
                </div>

                {/* Right group: Client library template controls */}
                {layoutElements.length > 0 && (
                  <div className="flex items-center shrink-0">
                    {isTemplateAlreadySaved ? (
                      <div className="inline-flex items-center gap-2 bg-emerald-50/80 border border-emerald-200/80 rounded-xl px-3 py-1.5 shadow-2xs">
                        <BookmarkCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-xs text-gray-500 font-medium whitespace-nowrap">В библиотеке:</span>
                        <span className="text-xs font-bold text-[#111827] max-w-[200px] truncate whitespace-nowrap" title={savedTemplateInfo?.name || 'Шаблон клиента'}>
                          «{savedTemplateInfo?.name || 'Шаблон клиента'}»
                        </span>
                        {(savedTemplateInfo?.id || (order as any)?.templateId) && (
                          <button
                            type="button"
                            onClick={handleUpdateUserTemplate}
                            disabled={savingTemplate}
                            title="Обновить существующий шаблон в библиотеке клиента текущей версией макета"
                            className="ml-1 inline-flex items-center gap-1.5 bg-white hover:bg-emerald-600 hover:text-white border border-emerald-300 text-emerald-800 text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-2xs transition-all cursor-pointer active:scale-95 disabled:opacity-50 whitespace-nowrap shrink-0"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${savingTemplate ? 'animate-spin' : 'text-emerald-600'}`} />
                            <span>{savingTemplate ? 'Обновление...' : 'Обновить'}</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSaveToUserTemplates}
                        disabled={savingTemplate}
                        className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50 shadow-2xs whitespace-nowrap"
                      >
                        <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                        <span>{savingTemplate ? 'Сохранение...' : 'Сохранить в шаблоны клиента'}</span>
                      </button>
                    )}
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
                    to={`/label-designer?orderId=${order.id}`}
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

          {/* Payment & Print Permission Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <h3 className="text-xs font-extrabold text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0082FB]" />
                Оплата и доступ к печати
              </h3>
              {order.printAllowed ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Unlock className="w-3 h-3 text-emerald-600" />
                  Печать открыта
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-600" />
                  Печать закрыта
                </span>
              )}
            </div>

            {printPermissionMsg && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                {printPermissionMsg}
              </div>
            )}

            {/* Status Checklist */}
            <div className="space-y-2 text-xs">
              {/* Check 1: Layout Approval */}
              <div className="flex items-center justify-between p-2.5 bg-gray-50/80 rounded-xl border border-gray-200/70">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold text-gray-700">1. Макет этикетки</span>
                </div>
                {((order.tariffType as string) === 'DIGITAL' || (order as any).tariff === 'DIGITAL') ? (
                  <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                    Не требуется (DIGITAL)
                  </span>
                ) : ((order as any)?.templateId || !order.extraServices?.includes('STICKER_LAYOUT_DESIGN')) ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {(order as any)?.templateId ? 'Из библиотеки (готов)' : 'Стандартный (авто)'}
                  </span>
                ) : order.stickerApprovalStatus === 'APPROVED' ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Согласован
                  </span>
                ) : order.stickerApprovalStatus === 'CHANGES_REQUESTED' ? (
                  <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                    Правки клиента
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Ожидает согласования
                  </span>
                )}
              </div>

              {/* Check 2: Payment Status */}
              <div className="flex items-center justify-between p-2.5 bg-gray-50/80 rounded-xl border border-gray-200/70">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold text-gray-700">2. Статус оплаты</span>
                </div>
                {order.paymentStatus === 'PAID' ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Оплачено
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    {order.paymentStatus === 'PARTIAL' ? 'Частично' : 'Не оплачено'}
                  </span>
                )}
              </div>
            </div>

            {/* Explanation Note */}
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              {order.extraServices?.includes('STICKER_LAYOUT_DESIGN') ? (
                <>Клиент сможет скачать готовую партию ({order.itemsCount.toLocaleString()} шт.) или рулоны <strong>после согласования дизайна макета</strong> и подтверждения оплаты администратором.</>
              ) : (
                <>Для стандартного заказа макет применяется автоматически. Клиент может скачать партию ({order.itemsCount.toLocaleString()} шт.) сразу после <strong>подтверждения оплаты</strong>.</>
              )}
            </p>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              {!order.printAllowed ? (
                <button
                  type="button"
                  onClick={() => handleTogglePrintPermission(true, 'PAID')}
                  disabled={updatingPrintPermission}
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Unlock className="w-4 h-4 text-white" />
                  {updatingPrintPermission ? 'Обновление...' : 'Разрешить печать (Оплата получена)'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleTogglePrintPermission(false, 'UNPAID')}
                  disabled={updatingPrintPermission}
                  className="w-full inline-flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-4 h-4 text-amber-700" />
                  {updatingPrintPermission ? 'Обновление...' : 'Заблокировать печать / Отозвать'}
                </button>
              )}

              {/* Warning only if custom design is ordered and not yet approved */}
              {order.extraServices?.includes('STICKER_LAYOUT_DESIGN') && order.stickerApprovalStatus !== 'APPROVED' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-[11px] text-amber-900 font-medium">
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Заказана разработка индивидуального макета. Макет ещё не утверждён клиентом.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleApproveLayoutDirectly}
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Утвердить макет как администратор
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Step Changer Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-[#111827] uppercase tracking-wider border-b border-gray-100 pb-2.5">
              Смена этапа заказа
            </h3>

            <div className="space-y-2">
              {(() => {
                const norm = (order.tariffType as string)?.toUpperCase() || '';
                let steps = [
                  { st: 'NEW' as OrderStatus, label: 'Новый заказ', desc: 'Принят в системе, коды проверены' },
                  { st: 'PROCESSING' as OrderStatus, label: 'В обработке', desc: isStickerDesign ? 'Согласование макета' : 'Подготовка и планирование выезда' },
                  { st: 'PRINTING' as OrderStatus, label: 'Печать кодов', desc: 'Печать стикеров для партии' },
                  { st: 'STICKERING' as OrderStatus, label: 'Оклейка на складе', desc: 'Выездная оклейка на складе РК' },
                  { st: 'COMPLETED' as OrderStatus, label: 'Выполнен', desc: 'Ввод в оборот и отчетность в Танба' },
                ];

                if (norm.includes('DIGITAL') || norm.includes('ЦИФР')) {
                  steps = [
                    { st: 'NEW' as OrderStatus, label: 'Новый заказ', desc: 'Принят в системе, коды проверены' },
                    { st: 'PROCESSING' as OrderStatus, label: 'В обработке', desc: isStickerDesign ? 'Согласование макета' : 'Сверка кодов и параметров' },
                    { st: 'PRINTING' as OrderStatus, label: 'Генерация кодов', desc: 'Вёрстка макетов Data Matrix' },
                    { st: 'STICKERING' as OrderStatus, label: 'Формирование файлов', desc: 'Подготовка PDF рулонов / CSV' },
                    { st: 'COMPLETED' as OrderStatus, label: 'Готов к выгрузке', desc: 'Файлы готовы для скачивания клиентом' },
                  ];
                } else if (norm.includes('PRINT') || norm.includes('ПЕЧАТ')) {
                  steps = [
                    { st: 'NEW' as OrderStatus, label: 'Новый заказ', desc: 'Принят в системе, коды проверены' },
                    { st: 'PROCESSING' as OrderStatus, label: 'В обработке', desc: isStickerDesign ? 'Согласование макета' : 'Подготовка макета к печати' },
                    { st: 'PRINTING' as OrderStatus, label: 'Печать рулонов', desc: 'Термотрансферная печать на производстве' },
                    { st: 'STICKERING' as OrderStatus, label: 'Упаковка партии', desc: 'Контроль качества и упаковка рулонов' },
                    { st: 'COMPLETED' as OrderStatus, label: 'Готов к выдаче', desc: 'Готов к отгрузке / доставке' },
                  ];
                } else if (norm.includes('PRO') || norm.includes('ПРО')) {
                  steps = [
                    { st: 'NEW' as OrderStatus, label: 'Новый заказ', desc: 'Принят в системе, коды проверены' },
                    { st: 'PROCESSING' as OrderStatus, label: 'Сверка и приемка', desc: 'Контроль артикулов и брак-контроль' },
                    { st: 'PRINTING' as OrderStatus, label: 'Печать и стикеровка', desc: 'Печать и оклейка единиц товара' },
                    { st: 'STICKERING' as OrderStatus, label: 'SSCC Агрегация', desc: 'Формирование коробов и паллет' },
                    { st: 'COMPLETED' as OrderStatus, label: 'Выполнен', desc: 'Партия агрегирована и сдана в Танба' },
                  ];
                }

                return steps.map((step) => {
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
                });
              })()}

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
          startLabelNumber={(order as any).startLabelNumber}
        />
      )}

      {/* Floating Top-Right Toast Notifications */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm w-full">
        {templateSavedMsg && (
          <div className="pointer-events-auto bg-[#0F172A] text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="leading-snug">{templateSavedMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setTemplateSavedMsg(null)}
              className="text-gray-400 hover:text-white font-bold p-1 rounded-lg cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {adjustSuccessMsg && (
          <div className="pointer-events-auto bg-[#0F172A] text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="leading-snug">{adjustSuccessMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setAdjustSuccessMsg(null)}
              className="text-gray-400 hover:text-white font-bold p-1 rounded-lg cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
