import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { 
  QrCode, 
  Trash2, 
  Save, 
  RefreshCw, 
  Check, 
  Download,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Sparkles,
  Palette,
  CreditCard,
  ShieldCheck,
  Wallet,
  ArrowRight,
  ExternalLink,
  Layers,
  FileCheck2,
  FolderOpen,
} from 'lucide-react';

import { 
  LabelElement, 
  SymbolType, 
  BarcodeElement, 
  QRCodeElement, 
  BoxElement, 
  TextElement, 
  SymbolElement, 
  DataMatrixElement, 
  DividerElement, 
  SavedTemplate 
} from './label-designer/types';
import { LeftToolbox } from './label-designer/components/LeftToolbox';
import { LabelCanvas } from './label-designer/components/LabelCanvas';
import { PropertiesSidebar } from './label-designer/components/PropertiesSidebar';
import { SaveTemplateModal } from './label-designer/components/SaveTemplateModal';
import { TemplateLibraryModal } from './label-designer/components/TemplateLibraryModal';
import { TopUpBalanceModal } from '../components/modals/TopUpBalanceModal';

export const LabelDesignerPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTemplateId = searchParams.get('templateId') || searchParams.get('id');

  // Label format state
  const [widthMm, setWidthMm] = useState<number>(58);
  const [heightMm, setHeightMm] = useState<number>(40);
  const [templateName, setTemplateName] = useState<string>('Моя этикетка 58x40');
  const [templateCategory, setTemplateCategory] = useState<string>('SHOES');

  // Zoom level state (1 = 100%, 1.5 = 150%, 2 = 200%, 3 = 300%)
  const [zoom, setZoom] = useState<number>(1);

  // Pricing & Monetization settings
  const [selfLayoutPrice, setSelfLayoutPrice] = useState<number>(1000);
  const [stickerLayoutPrice, setStickerLayoutPrice] = useState<number>(5000);
  const [userBalance, setUserBalance] = useState<number>(0);

  // Template paid status
  const [isTemplatePaid, setIsTemplatePaid] = useState<boolean>(false);
  const [templatePaidAt, setTemplatePaidAt] = useState<string | null>(null);

  // CSV Data state for live preview testing
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [totalRowsCount, setTotalRowsCount] = useState<number>(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [currentRowIndex, setCurrentRowIndex] = useState<number>(0);
  const [fileName, setFileName] = useState<string>('');
  const [isCsvDragOver, setIsCsvDragOver] = useState<boolean>(false);

  // Selected element for editing in sidebar
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);
  const [elementCategory, setElementCategory] = useState<string>('all');

  // User Templates state
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(initialTemplateId || '');
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [saveTemplateName, setSaveTemplateName] = useState<string>('');
  const [saveCategory, setSaveCategory] = useState<string>('SHOES');
  const [savingTemplate, setSavingTemplate] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Modals for payment & design order
  const [showPayModal, setShowPayModal] = useState<boolean>(false);
  const [payingTemplate, setPayingTemplate] = useState<boolean>(false);
  const [showTopUpModal, setShowTopUpModal] = useState<boolean>(false);
  const [topUpInitialAmount, setTopUpInitialAmount] = useState<number>(1000);
  const [showLibraryModal, setShowLibraryModal] = useState<boolean>(false);

  const [showDesignerModal, setShowDesignerModal] = useState<boolean>(false);
  const [designerRequirements, setDesignerRequirements] = useState<string>('');
  const [orderingDesigner, setOrderingDesigner] = useState<boolean>(false);

  // Canvas elements layout - empty draft by default
  const [elements, setElements] = useState<LabelElement[]>([]);

  // Drag-and-drop state on canvas
  const draggingRef = useRef<{
    elementId: string;
    startClientX: number;
    startClientY: number;
    startElX: number;
    startElY: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const baseScale = 7;
  const effectiveScale = baseScale * zoom;

  // Auto-adjust zoom when label dimensions are small
  const handleSelectPreset = (w: number, h: number) => {
    setWidthMm(w);
    setHeightMm(h);
    if (w <= 35 || h <= 25) {
      setZoom(2);
    } else {
      setZoom(1);
    }
  };

  // 1. Fetch user balance and tariffs on mount
  const fetchBalanceAndTariffs = async () => {
    try {
      const [balRes, tariffRes] = await Promise.all([
        apiClient.get('/payments/balance').catch(() => ({ data: { balance: 0 } })),
        apiClient.get('/tariffs').catch(() => ({ data: {} })),
      ]);

      if (balRes.data?.balance !== undefined) {
        setUserBalance(Number(balRes.data.balance) || 0);
      }
      if (tariffRes.data?.pricingSettings) {
        if (tariffRes.data.pricingSettings.selfLayoutPrice !== undefined) {
          setSelfLayoutPrice(Number(tariffRes.data.pricingSettings.selfLayoutPrice) || 1000);
        }
        if (tariffRes.data.pricingSettings.stickerLayoutPrice !== undefined) {
          setStickerLayoutPrice(Number(tariffRes.data.pricingSettings.stickerLayoutPrice) || 5000);
        }
      }
    } catch (e) {
      console.warn('Error loading balance or tariffs:', e);
    }
  };

  // 2. Fetch user's saved templates
  const fetchSavedTemplates = async () => {
    try {
      const res = await apiClient.get('/user-templates');
      if (res.data?.templates && Array.isArray(res.data.templates)) {
        setSavedTemplates(res.data.templates);

        // If templateId was passed in search params, load it
        if (initialTemplateId) {
          const found = res.data.templates.find((t: any) => t.id === initialTemplateId);
          if (found) {
            loadTemplateIntoCanvas(found);
          }
        }
      }
    } catch (err) {
      console.warn('Could not load user templates:', err);
    }
  };

  useEffect(() => {
    fetchBalanceAndTariffs();
    fetchSavedTemplates();
  }, []);

  const loadTemplateIntoCanvas = (tpl: any) => {
    setSelectedTemplateId(tpl.id);
    setWidthMm(Number(tpl.widthMm) || 58);
    setHeightMm(Number(tpl.heightMm) || 40);
    setTemplateName(tpl.name || 'Мой шаблон');
    setTemplateCategory(tpl.category || 'SHOES');
    setIsTemplatePaid(Boolean(tpl.isPaid));
    setTemplatePaidAt(tpl.paidAt || null);

    if (Array.isArray(tpl.elements) && tpl.elements.length > 0) {
      setElements(tpl.elements);
    }
    setSelectedElementId(null);
    if (tpl.widthMm <= 35 || tpl.heightMm <= 25) {
      setZoom(2);
    }
  };

  const handleSelectSavedTemplate = (id: string) => {
    setSelectedTemplateId(id);
    if (!id) return;
    const tpl = savedTemplates.find((t) => t.id === id);
    if (tpl) {
      loadTemplateIntoCanvas(tpl);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await apiClient.delete(`/user-templates/${templateId}`);
      if (selectedTemplateId === templateId) {
        handleCreateNewTemplate();
      }
      await fetchSavedTemplates();
    } catch (err: any) {
      alert('Ошибка при удалении шаблона: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCreateNewTemplate = () => {
    setSelectedTemplateId('');
    setWidthMm(58);
    setHeightMm(40);
    setTemplateName('Новый макет 58x40');
    setTemplateCategory('SHOES');
    setIsTemplatePaid(false);
    setTemplatePaidAt(null);
    setSelectedElementId(null);
    setZoom(1);

    // Reset to empty canvas
    setElements([]);
  };

  // Mock / Sample active row for preview rendering
  const activeRow = useMemo(() => {
    if (csvRows.length > 0 && csvRows[currentRowIndex]) {
      return csvRows[currentRowIndex];
    }
    return {
      code: '0104600439931256215ABC12391FFD092',
      name: 'Кроссовки мужские кожаные TANBOX',
      sku: 'SNK-2026-BLK',
      size: '42',
      color: 'Черный',
      brand: 'TANBOX',
      country: 'Казахстан',
      importer: 'ТОО TANBOX',
      barcode: '2000000001234',
    };
  }, [csvRows, currentRowIndex]);

  const selectedElement = useMemo(
    () => elements.find((el) => el.id === selectedElementId) || null,
    [elements, selectedElementId]
  );

  // CSV parsing logic for preview
  const processFile = async (file: File) => {
    if (!file) return;
    setFileName(file.name);
    setUploadedFile(file);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiClient.post('/labels/parse-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCsvHeaders(res.data.headers);
      setCsvRows(res.data.previewRows);
      setTotalRowsCount(res.data.totalRows);
      setCurrentRowIndex(0);
    } catch (err: any) {
      setUploadError(err.response?.data?.message || err.message || 'Ошибка парсинга CSV файла');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleCsvDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    if (!isCsvDragOver) setIsCsvDragOver(true);
  };

  const handleCsvDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsCsvDragOver(false);
  };

  const handleCsvDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCsvDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  // Drag logic on Canvas
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setSelectedElementId(id);

    const el = elements.find((item) => item.id === id);
    if (!el) return;

    draggingRef.current = {
      elementId: id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startElX: el.x,
      startElY: el.y,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const { elementId, startClientX, startClientY, startElX, startElY } = draggingRef.current;

      const deltaX = (e.clientX - startClientX) / effectiveScale;
      const deltaY = (e.clientY - startClientY) / effectiveScale;

      const rawNewX = startElX + deltaX;
      const rawNewY = startElY + deltaY;

      const clampedX = Math.max(0, Math.min(widthMm - 1, Math.round(rawNewX * 2) / 2));
      const clampedY = Math.max(0, Math.min(heightMm - 1, Math.round(rawNewY * 2) / 2));

      setElements((prev) =>
        prev.map((item) =>
          item.id === elementId ? ({ ...item, x: clampedX, y: clampedY } as LabelElement) : item
        )
      );
    };

    const handleMouseUp = () => {
      if (draggingRef.current) {
        draggingRef.current = null;
        setIsDragging(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [widthMm, heightMm, effectiveScale]);

  // Element actions
  const updateElement = (id: string, updates: Partial<LabelElement>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? ({ ...el, ...updates } as LabelElement) : el))
    );
  };

  const deleteElement = (id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  const rotateElementBy90 = (id: string) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== id) return el;
        const currentRotation = el.rotation || 0;
        const newRotation = ((currentRotation + 90) % 360) as 0 | 90 | 180 | 270;
        return { ...el, rotation: newRotation };
      })
    );
  };

  // Add element builders
  const addDataMatrixElement = () => {
    const newId = `dm-${Date.now()}`;
    const size = Math.min(14, Math.min(widthMm, heightMm) - 4);
    const newEl: DataMatrixElement = {
      id: newId,
      type: 'datamatrix',
      x: 2,
      y: 2,
      size,
      columnName: 'code',
      matrixStructure: 'four_regions',
      rotation: 0,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedElementId(newId);
  };

  const addBarcodeElement = () => {
    const newId = `bc-${Date.now()}`;
    const newEl: BarcodeElement = {
      id: newId,
      type: 'barcode',
      x: 2,
      y: Math.max(2, heightMm - 12),
      width: Math.min(38, widthMm - 4),
      height: 8,
      columnName: 'barcode',
      rotation: 0,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedElementId(newId);
  };

  const addQRCodeElement = () => {
    const newId = `qr-${Date.now()}`;
    const size = Math.min(12, Math.min(widthMm, heightMm) - 4);
    const newEl: QRCodeElement = {
      id: newId,
      type: 'qrcode',
      x: 2,
      y: 2,
      size,
      columnName: 'https://tanbox.kz',
      rotation: 0,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedElementId(newId);
  };

  const addTextElement = () => {
    const newId = `txt-${Date.now()}`;
    const newEl: TextElement = {
      id: newId,
      type: 'text',
      x: 2,
      y: 2,
      width: Math.max(10, widthMm - 4),
      content: 'Новый текст',
      fontSize: 7,
      fontWeight: 'normal',
      fontFamily: 'Arial, sans-serif',
      align: 'left',
      rotation: 0,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedElementId(newId);
  };

  const addPresetTextElement = (
    content: string,
    fontWeight: 'normal' | 'bold' = 'normal',
    fontSize?: number
  ) => {
    const newId = `txt-${Date.now()}`;
    const width = Math.max(10, widthMm - 4);
    const isCompact = Math.min(widthMm, heightMm) <= 25;
    const computedFontSize = fontSize || (isCompact ? 5.5 : 7);

    const offset = (elements.length % 5) * 4;
    const y = Math.min(Math.max(2, 6 + offset), Math.max(2, heightMm - 6));

    const newEl: TextElement = {
      id: newId,
      type: 'text',
      x: 2,
      y,
      width,
      content,
      fontSize: computedFontSize,
      fontWeight,
      fontFamily: 'Arial, sans-serif',
      align: 'left',
      rotation: 0,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedElementId(newId);
  };

  const addSymbolElement = (symbolType: SymbolType, hasBorder: boolean = false) => {
    const newId = `sym-${Date.now()}`;
    const size = Math.min(8, Math.min(widthMm, heightMm) - 4);
    const newEl: SymbolElement = {
      id: newId,
      type: 'symbol',
      x: 2,
      y: 2,
      size,
      symbolType,
      hasBorder,
      rotation: 0,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedElementId(newId);
  };

  const addDividerElement = () => {
    const newId = `div-${Date.now()}`;
    const newEl: DividerElement = {
      id: newId,
      type: 'divider',
      x: 2,
      y: Math.round(heightMm / 2),
      length: Math.max(5, widthMm - 4),
      orientation: 'horizontal',
      thickness: 0.3,
      rotation: 0,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedElementId(newId);
  };

  const addBoxElement = () => {
    const newId = `box-${Date.now()}`;
    const newEl: BoxElement = {
      id: newId,
      type: 'box',
      x: 1,
      y: 1,
      width: Math.max(5, widthMm - 2),
      height: Math.max(5, heightMm - 2),
      thickness: 0.3,
      rotation: 0,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedElementId(newId);
  };

  // Save template action (create new or update existing)
  const handleSaveClick = async () => {
    if (selectedTemplateId) {
      // Update existing
      setSavingTemplate(true);
      try {
        await apiClient.put(`/user-templates/${selectedTemplateId}`, {
          name: templateName,
          category: templateCategory,
          widthMm,
          heightMm,
          elements,
        });
        setSaveSuccessMsg('Изменения в макете успешно сохранены!');
        setTimeout(() => setSaveSuccessMsg(null), 3000);
        await fetchSavedTemplates();
      } catch (err: any) {
        alert('Ошибка при сохранении: ' + (err.response?.data?.message || err.message));
      } finally {
        setSavingTemplate(false);
      }
    } else {
      // Open save as new modal
      setSaveTemplateName(templateName);
      setSaveCategory(templateCategory);
      setShowSaveModal(true);
    }
  };

  const handleConfirmSaveNew = async () => {
    if (!saveTemplateName.trim()) return;
    setSavingTemplate(true);
    try {
      const res = await apiClient.post('/user-templates', {
        name: saveTemplateName.trim(),
        category: saveCategory,
        widthMm,
        heightMm,
        elements,
      });

      if (res.data?.template) {
        setSelectedTemplateId(res.data.template.id);
        setTemplateName(res.data.template.name);
        setTemplateCategory(res.data.template.category || 'SHOES');
        setIsTemplatePaid(Boolean(res.data.template.isPaid));
        setTemplatePaidAt(res.data.template.paidAt || null);
      }
      setShowSaveModal(false);
      setSaveSuccessMsg('Шаблон успешно сохранен в вашу библиотеку!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
      await fetchSavedTemplates();
    } catch (err: any) {
      alert('Ошибка при сохранении: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingTemplate(false);
    }
  };

  // Payment for self-service layout (1 000 ₸)
  const handlePayTemplateClick = async () => {
    // Ensure template is saved first
    if (!selectedTemplateId) {
      setSaveTemplateName(templateName);
      setSaveCategory(templateCategory);
      setShowSaveModal(true);
      return;
    }

    if (userBalance < selfLayoutPrice) {
      setTopUpInitialAmount(selfLayoutPrice - userBalance);
      setShowTopUpModal(true);
      return;
    }

    setShowPayModal(true);
  };

  const handleConfirmPayTemplate = async () => {
    if (!selectedTemplateId) return;
    setPayingTemplate(true);
    try {
      const res = await apiClient.post(`/user-templates/${selectedTemplateId}/pay`);
      setIsTemplatePaid(true);
      setTemplatePaidAt(res.data?.template?.paidAt || new Date().toISOString());
      if (res.data?.newBalance !== undefined) {
        setUserBalance(Number(res.data.newBalance));
      }
      setShowPayModal(false);
      setSaveSuccessMsg(`Макет «${templateName}» успешно оплачен и утвержден! Водяной знак снят.`);
      setTimeout(() => setSaveSuccessMsg(null), 5000);
      await fetchSavedTemplates();
    } catch (err: any) {
      if (err.response?.data?.error === 'INSUFFICIENT_BALANCE') {
        setShowPayModal(false);
        setTopUpInitialAmount(selfLayoutPrice - userBalance);
        setShowTopUpModal(true);
      } else {
        alert('Ошибка при оплате: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setPayingTemplate(false);
    }
  };

  // Order Designer service (5 000 ₸)
  const handleOpenDesignerModal = () => {
    if (userBalance < stickerLayoutPrice) {
      setTopUpInitialAmount(stickerLayoutPrice - userBalance);
      setShowTopUpModal(true);
      return;
    }
    setShowDesignerModal(true);
  };

  const handleConfirmOrderDesigner = async () => {
    setOrderingDesigner(true);
    try {
      const res = await apiClient.post('/user-templates/order-designer', {
        name: `Дизайн: ${templateName} (${widthMm}x${heightMm} мм)`,
        category: templateCategory,
        widthMm,
        heightMm,
        description: designerRequirements,
      });

      if (res.data?.newBalance !== undefined) {
        setUserBalance(Number(res.data.newBalance));
      }
      setShowDesignerModal(false);
      setDesignerRequirements('');
      alert('Заказ на разработку макета принят! Наш дизайнер свяжется с вами и подготовит векторный макет.');
      await fetchSavedTemplates();
    } catch (err: any) {
      if (err.response?.data?.error === 'INSUFFICIENT_BALANCE') {
        setShowDesignerModal(false);
        setTopUpInitialAmount(stickerLayoutPrice - userBalance);
        setShowTopUpModal(true);
      } else {
        alert('Ошибка при заказе дизайна: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setOrderingDesigner(false);
    }
  };

  // Generate & Download vector PDF
  const handleDownloadPdf = async () => {
    if (!isTemplatePaid) {
      alert('Для выгрузки чистого PDF без водяного знака сначала оплатите и утвердите макет (1 000 ₸).');
      handlePayTemplateClick();
      return;
    }

    setGenerating(true);
    try {
      const template = {
        name: templateName,
        widthMm,
        heightMm,
        elements,
      };

      const response = await apiClient.post(
        '/labels/generate-pdf?limit=5',
        {
          template,
          csvData: csvRows.length > 0 ? csvRows : [activeRow],
        },
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tanbox-${templateName.replace(/[\s/\\?%*:|"<>]/g, '_')}-${widthMm}x${heightMm}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Ошибка при генерации PDF: ' + (err.response?.data?.message || err.message));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">

      {/* Success Notification Alert */}
      {saveSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold p-4 rounded-2xl flex items-center gap-2.5 shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Template Control Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Selector, New, Library & Status */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="min-w-[200px]">
            <select
              value={selectedTemplateId}
              onChange={(e) => handleSelectSavedTemplate(e.target.value)}
              className="w-full text-xs font-bold text-[#111827] bg-[#F8FAFC] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#0082FB] cursor-pointer"
            >
              <option value="">Черновик без сохранения</option>
              {savedTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.widthMm}×{t.heightMm} мм) {t.isPaid ? '✓' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleCreateNewTemplate}
            className="px-3 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer"
          >
            + Новый
          </button>

          <button
            type="button"
            onClick={() => setShowLibraryModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer"
            title="Открыть все сохраненные макеты"
          >
            <FolderOpen className="w-3.5 h-3.5 text-gray-500" />
            <span>Макеты ({savedTemplates.length})</span>
          </button>

          <div className="h-4 w-px bg-gray-200 mx-1 hidden sm:block" />

          {/* Status Indicator */}
          {isTemplatePaid ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Утвержден
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Черновик
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Save Button */}
          <button
            type="button"
            onClick={handleSaveClick}
            disabled={savingTemplate}
            className="px-3.5 py-2 text-xs font-bold bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5 text-gray-500" />
            <span>{savingTemplate ? 'Сохранение...' : 'Сохранить'}</span>
          </button>

          {/* If NOT PAID */}
          {!isTemplatePaid && (
            <>
              <button
                type="button"
                onClick={handleOpenDesignerModal}
                className="px-3.5 py-2 text-xs font-bold bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                title="Заказать дизайн специалистом TANBOX"
              >
                <Palette className="w-3.5 h-3.5 text-gray-500" />
                <span>Заказать дизайнеру ({stickerLayoutPrice.toLocaleString('ru-RU')} ₸)</span>
              </button>

              <button
                type="button"
                onClick={handlePayTemplateClick}
                className="px-4 py-2 text-xs font-bold bg-[#0082FB] hover:bg-[#0070DA] text-white rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Утвердить макет ({selfLayoutPrice.toLocaleString('ru-RU')} ₸)</span>
              </button>
            </>
          )}

          {/* If PAID */}
          {isTemplatePaid && (
            <>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={generating}
                className="px-3.5 py-2 text-xs font-bold bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-gray-500" />
                <span>{generating ? 'Генерация...' : 'Скачать PDF'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  navigate(`/orders/new?templateId=${selectedTemplateId}&category=${templateCategory}`);
                }}
                className="px-4 py-2 text-xs font-bold bg-[#0082FB] hover:bg-[#0070DA] text-white rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Заказать печать</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 3-Column Designer Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left Column: Toolbox & Data */}
        <LeftToolbox
          fileName={fileName}
          isCsvDragOver={isCsvDragOver}
          uploadError={uploadError}
          csvRows={csvRows}
          totalRowsCount={totalRowsCount}
          csvHeaders={csvHeaders}
          handleCsvDragOver={handleCsvDragOver}
          handleCsvDragLeave={handleCsvDragLeave}
          handleCsvDrop={handleCsvDrop}
          handleFileUpload={handleFileUpload}
          elementCategory={elementCategory}
          setElementCategory={setElementCategory}
          addDataMatrixElement={addDataMatrixElement}
          addBarcodeElement={addBarcodeElement}
          addQRCodeElement={addQRCodeElement}
          addTextElement={addTextElement}
          addPresetTextElement={addPresetTextElement}
          addSymbolElement={addSymbolElement}
          addDividerElement={addDividerElement}
          addBoxElement={addBoxElement}
          widthMm={widthMm}
          heightMm={heightMm}
          setWidthMm={setWidthMm}
          setHeightMm={setHeightMm}
          handleSelectPreset={handleSelectPreset}
          elements={elements}
          selectedElementId={selectedElementId}
          setSelectedElementId={setSelectedElementId}
        />

        {/* Center Column: Interactive Canvas */}
        <LabelCanvas
          widthMm={widthMm}
          heightMm={heightMm}
          zoom={zoom}
          setZoom={setZoom}
          currentRowIndex={currentRowIndex}
          setCurrentRowIndex={setCurrentRowIndex}
          csvRows={csvRows}
          activeRow={activeRow}
          elements={elements}
          selectedElementId={selectedElementId}
          setSelectedElementId={setSelectedElementId}
          isDragging={isDragging}
          draggingElementId={draggingRef.current?.elementId || null}
          handleMouseDown={handleMouseDown}
          rotateElementBy90={rotateElementBy90}
          isPaid={isTemplatePaid}
        />

        {/* Right Column: Properties of selected element & Layers */}
        <PropertiesSidebar
          selectedElement={selectedElement}
          widthMm={widthMm}
          heightMm={heightMm}
          csvHeaders={csvHeaders}
          updateElement={updateElement}
          deleteElement={deleteElement}
          rotateElementBy90={rotateElementBy90}
          elements={elements}
          selectedElementId={selectedElementId}
          setSelectedElementId={setSelectedElementId}
        />
      </div>

      {/* Save Template Modal */}
      <SaveTemplateModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        saveTemplateName={saveTemplateName}
        setSaveTemplateName={setSaveTemplateName}
        category={saveCategory}
        setCategory={setSaveCategory}
        widthMm={widthMm}
        heightMm={heightMm}
        elements={elements}
        savingTemplate={savingTemplate}
        onConfirmSave={handleConfirmSaveNew}
      />

      {/* Confirmation Modal: Pay 1 000 ₸ with balance */}
      {showPayModal && createPortal(
        <div
          onClick={() => setShowPayModal(false)}
          className="fixed inset-0 w-screen h-screen z-[99999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          style={{ top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-6 max-w-md w-full space-y-4 animate-in zoom-in-95 duration-150 relative z-10"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-[#111827] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Оплата и утверждение макета
              </h3>
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              С вашего лицевого счёта будет списана разовая плата за утверждение макета. Водяной знак «ОБРАЗЕЦ» будет удалён, и вы сможете скачивать чистый векторный PDF или сразу запускать этикетки в печать.
            </p>

            <div className="bg-[#F8FAFC] border border-gray-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748B]">Макет:</span>
                <span className="font-extrabold text-[#111827]">«{templateName}» ({widthMm}×{heightMm} мм)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748B]">Стоимость услуги:</span>
                <span className="font-black text-emerald-600 text-sm">{selfLayoutPrice.toLocaleString('ru-RU')} ₸</span>
              </div>
              <div className="pt-2 border-t border-gray-200/80 flex items-center justify-between text-xs">
                <span className="text-[#64748B]">Ваш текущий баланс:</span>
                <span className="font-bold text-[#111827]">{userBalance.toLocaleString('ru-RU')} ₸</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748B]">Баланс после списания:</span>
                <span className="font-black text-[#111827]">{(userBalance - selfLayoutPrice).toLocaleString('ru-RU')} ₸</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="flex-1 py-3 text-xs font-bold text-[#64748B] hover:text-[#111827] bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmPayTemplate}
                disabled={payingTemplate}
                className="flex-1 py-3 text-xs font-black text-white bg-[#0082FB] hover:bg-[#0070DA] disabled:opacity-50 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {payingTemplate ? 'Обработка...' : `Оплатить ${selfLayoutPrice.toLocaleString('ru-RU')} ₸`}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Order Designer 5 000 ₸ */}
      {showDesignerModal && createPortal(
        <div
          onClick={() => setShowDesignerModal(false)}
          className="fixed inset-0 w-screen h-screen z-[99999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          style={{ top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 max-w-md w-full space-y-4 animate-in zoom-in-95 duration-150 relative z-10"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-extrabold text-[#111827] flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#0082FB]" />
                Заказ дизайна специалистом
              </h3>
              <button
                type="button"
                onClick={() => setShowDesignerModal(false)}
                className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-black flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Специалист разработает макет по техническому регламенту ТР ТС и требованиям маркетплейсов (Kaspi, WB, Ozon).
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#111827] uppercase tracking-wider block mb-1">
                  Размер и категория
                </label>
                <div className="text-xs font-bold bg-[#F8FAFC] border border-gray-200 rounded-xl p-3 text-[#111827]">
                  {widthMm} × {heightMm} мм • {templateCategory}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#111827] uppercase tracking-wider block mb-1">
                  Пожелания к макету (текст, реквизиты, логотип)
                </label>
                <textarea
                  rows={4}
                  value={designerRequirements}
                  onChange={(e) => setDesignerRequirements(e.target.value)}
                  placeholder="Укажите артикул, производителя, обязательные знаки ухода или другие особенности..."
                  className="w-full text-xs font-medium border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-[#0082FB]"
                />
              </div>

              <div className="bg-[#F8FAFC] border border-gray-200 rounded-2xl p-3.5 space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#111827] font-bold">Стоимость разработки:</span>
                  <span className="font-black text-[#0082FB] text-sm">{stickerLayoutPrice.toLocaleString('ru-RU')} ₸</span>
                </div>
                <div className="flex justify-between items-center text-[#64748B]">
                  <span>Баланс кабинета:</span>
                  <span className="font-bold text-[#111827]">{userBalance.toLocaleString('ru-RU')} ₸</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDesignerModal(false)}
                className="flex-1 py-3 text-xs font-bold text-[#64748B] hover:text-[#111827] bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmOrderDesigner}
                disabled={orderingDesigner}
                className="flex-1 py-3 text-xs font-black text-white bg-[#0082FB] hover:bg-[#0070DA] disabled:opacity-50 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {orderingDesigner ? 'Оформление...' : `Заказать за ${stickerLayoutPrice.toLocaleString('ru-RU')} ₸`}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Template Library Modal */}
      <TemplateLibraryModal
        isOpen={showLibraryModal}
        onClose={() => setShowLibraryModal(false)}
        templates={savedTemplates as any}
        activeTemplateId={selectedTemplateId}
        onSelectTemplate={(tpl) => loadTemplateIntoCanvas(tpl)}
        onCreateNew={handleCreateNewTemplate}
        onDeleteTemplate={handleDeleteTemplate}
        onOrderPrint={(tpl) => {
          navigate(`/orders/new?templateId=${tpl.id}&category=${tpl.category || 'OTHER'}`);
        }}
      />

      {/* Top Up Balance Modal */}
      <TopUpBalanceModal
        isOpen={showTopUpModal}
        onClose={() => {
          setShowTopUpModal(false);
          fetchBalanceAndTariffs();
        }}
        currentBalance={userBalance}
        initialAmount={topUpInitialAmount}
      />
    </div>
  );
};
