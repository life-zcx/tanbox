import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { 
  QrCode, 
  Trash2, 
  Save, 
  RefreshCw, 
  Check, 
  Download,
  ArrowLeft,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Copy,
  Loader2
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

// Re-export types if other modules import them from here
export * from './label-designer/types';

export const AdminLabelDesignerPage: React.FC = () => {
  // Label format state
  const [widthMm, setWidthMm] = useState<number>(58);
  const [heightMm, setHeightMm] = useState<number>(40);
  const [templateName, setTemplateName] = useState<string>('Шаблон этикетки 58x40');

  // Zoom level state (1 = 100%, 1.5 = 150%, 2 = 200%, 3 = 300%)
  const [zoom, setZoom] = useState<number>(1);

  // CSV Data state
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
  const [pdfLimit, setPdfLimit] = useState<'all' | 'sample'>('all');
  const [elementCategory, setElementCategory] = useState<string>('all');

  // Database Templates state
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [isSaveAsNew, setIsSaveAsNew] = useState<boolean>(false);
  const [saveTemplateName, setSaveTemplateName] = useState<string>('');
  const [savingTemplate, setSavingTemplate] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Canvas elements layout
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

  // Auto-adjust zoom when label dimensions are small (e.g. 30x20 mm)
  const handleSelectPreset = (w: number, h: number) => {
    setWidthMm(w);
    setHeightMm(h);
    if (w <= 35 || h <= 25) {
      setZoom(2);
    } else {
      setZoom(1);
    }
  };

  // Fetch saved templates from PostgreSQL database
  const fetchSavedTemplates = async () => {
    try {
      const res = await apiClient.get('/label-templates');
      if (Array.isArray(res.data)) {
        setSavedTemplates(res.data);
      }
    } catch (err) {
      console.warn('Could not load saved templates from DB:', err);
    }
  };

  // Order integration state
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [orderData, setOrderData] = useState<any>(null);
  const [orderSentSuccess, setOrderSentSuccess] = useState<boolean>(false);

  useEffect(() => {
    fetchSavedTemplates();
  }, []);

  // When opened with ?orderId=..., load order specifications and starter layout
  useEffect(() => {
    if (!orderId) return;

    const loadOrderContext = async () => {
      try {
        const res = await apiClient.get(`/orders/${orderId}`);
        const ord = res.data;
        setOrderData(ord);

        // Determine label dimensions from DB layout or order notes
        let w = ord.stickerLayout?.widthMm || 58;
        let h = ord.stickerLayout?.heightMm || 40;

        if (ord.notes && ord.notes.includes('=== ТРЕБОВАНИЯ К МАКЕТУ СТИКЕРА ===')) {
          const sizeMatch = ord.notes.match(/Размер(?: этикетки)?:?\s*(\d+)\s*[×x*]\s*(\d+)/i);
          if (sizeMatch) {
            w = parseInt(sizeMatch[1], 10);
            h = parseInt(sizeMatch[2], 10);
          }
        }

        setWidthMm(w);
        setHeightMm(h);
        setTemplateName(`Стикер ${w}×${h} мм - Заказ ${ord.orderNumber}`);

        // If layout was already created in DB, load its elements.
        // Otherwise start with a clean empty canvas (only dimensions set).
        if (ord.stickerLayout?.elements && Array.isArray(ord.stickerLayout.elements) && ord.stickerLayout.elements.length > 0) {
          setElements(ord.stickerLayout.elements);
        } else {
          // Check local backup if any
          const saved =
            localStorage.getItem(`tanbox_order_label_${ord.id}`) ||
            localStorage.getItem(`tanbox_order_label_${ord.orderNumber}`);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              const els = Array.isArray(parsed) ? parsed : parsed.elements || [];
              if (els.length > 0) {
                setElements(els);
              } else {
                setElements([]);
              }
            } catch {
              setElements([]);
            }
          } else {
            // МАКЕТ ПУСТОЙ, заполнен только размер
            setElements([]);
          }
        }

        // Auto-load codes attached to this order from DB
        try {
          const codesRes = await apiClient.get(`/orders/${orderId}/codes-content`);
          if (codesRes.data?.hasCodes && codesRes.data?.isCsv) {
            const bcMatch = ord.notes?.match(/Штрихкод(?:\s*\(EAN-13\))?:?\s*(\d+)/i);
            const orderBarcode = bcMatch ? bcMatch[1].trim() : undefined;

            const enrichedRows = (codesRes.data.previewRows || []).map((r: any, idx: number) => {
              const codeVal = r.code || Object.values(r)[0] || '';
              const m = String(codeVal).match(/^01(\d{14})21([^\u001d\s]+)/);
              const gtin14 = m ? m[1] : '';
              const gtin13 = gtin14.startsWith('0') ? gtin14.slice(1) : gtin14;
              const serial = m ? m[2] : '';
              return {
                ...r,
                code: codeVal,
                gtin: gtin14,
                serial: serial,
                barcode: orderBarcode || gtin13 || gtin14 || '2000000001234',
                index: String(idx + 1),
                number: String(idx + 1),
                orderNumber: ord.orderNumber,
              };
            });

            const enrichedHeaders = Array.from(
              new Set(['code', 'barcode', 'gtin', 'serial', ...codesRes.data.headers])
            );

            setCsvHeaders(enrichedHeaders);
            setCsvRows(enrichedRows);
            setTotalRowsCount(codesRes.data.totalRows);
            setFileName(codesRes.data.fileName || 'Коды маркировки из заказа');
          }
        } catch (e) {
          console.warn('Could not auto-load order codes:', e);
        }
      } catch (e) {
        console.error('Error loading order context into designer:', e);
      }
    };

    loadOrderContext();
  }, [orderId]);

  // Save layout for this order and send to client in DB
  const handleSaveAndSendToClient = async () => {
    if (!orderId || !orderData) return;
    try {
      const layoutData = {
        widthMm,
        heightMm,
        elements,
        updatedAt: new Date().toISOString(),
      };

      const targetId = orderData?.id || orderId;

      // 1. Save directly to PostgreSQL database via backend API
      await apiClient.patch(`/orders/${targetId}/sticker-layout`, {
        stickerLayout: layoutData,
        sendToClient: true,
        pdfUrl: `/api/orders/${targetId}/pdf`,
      });

      // 2. Save local backup
      localStorage.setItem(`tanbox_order_label_${targetId}`, JSON.stringify(layoutData));
      if (orderData.orderNumber) {
        localStorage.setItem(`tanbox_order_label_${orderData.orderNumber}`, JSON.stringify(layoutData));
      }
      localStorage.setItem(
        `tanbox_sticker_approval_${orderId}`,
        JSON.stringify({
          status: 'WAITING_APPROVAL',
          sentAt: new Date().toLocaleString('ru-RU'),
        })
      );

      setOrderData((prev: any) =>
        prev
          ? {
              ...prev,
              stickerApprovalStatus: 'WAITING_APPROVAL',
              stickerLayout: layoutData,
            }
          : prev
      );

      setOrderSentSuccess(true);
      setTimeout(() => setOrderSentSuccess(false), 4000);
      alert('Макет стикера сохранён в базе данных и передан клиенту на согласование!');
    } catch (e: any) {
      alert('Ошибка при сохранении: ' + (e.response?.data?.message || e.message));
    }
  };

  // Load a template from the database
  const handleSelectSavedTemplate = (id: string) => {
    setSelectedTemplateId(id);
    if (!id) return;
    const tpl = savedTemplates.find((t) => t.id === id);
    if (tpl) {
      setWidthMm(tpl.widthMm);
      setHeightMm(tpl.heightMm);
      setTemplateName(tpl.name);
      setSaveTemplateName(tpl.name);
      setElements(tpl.elements || []);
      setSelectedElementId(null);
      if (tpl.widthMm <= 35 || tpl.heightMm <= 25) {
        setZoom(2);
      }
    }
  };

  // Clear canvas to blank layout
  const handleClearCanvas = () => {
    setElements([]);
    setSelectedElementId(null);
    setSelectedTemplateId('');
    setTemplateName('Шаблон этикетки');
    setSaveTemplateName('');
  };

  // Direct save current template (if already loaded/saved), or open naming modal (if new)
  const handleSaveClick = async () => {
    if (selectedTemplateId) {
      // Directly update the existing template in PostgreSQL without asking for name again!
      setSavingTemplate(true);
      try {
        const nameToSave = (templateName || saveTemplateName || 'Шаблон этикетки').trim();
        await apiClient.put(`/label-templates/${selectedTemplateId}`, {
          name: nameToSave,
          widthMm,
          heightMm,
          elements,
        });
        await fetchSavedTemplates();
        setSaveSuccessMsg(`«${nameToSave}» сохранён в БД!`);
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      } catch (err: any) {
        alert('Ошибка при сохранении шаблона в базу: ' + (err.response?.data?.message || err.message));
      } finally {
        setSavingTemplate(false);
      }
    } else {
      // First time save -> open modal to ask for template name
      setIsSaveAsNew(false);
      setSaveTemplateName(
        templateName && templateName !== 'Шаблон этикетки' && templateName !== 'Шаблон этикетки 58x40'
          ? templateName
          : `Шаблон ${widthMm}×${heightMm} мм`
      );
      setShowSaveModal(true);
    }
  };

  // Confirm save new template into PostgreSQL DB from modal
  const handleConfirmSaveTemplate = async () => {
    if (!saveTemplateName.trim()) return;
    setSavingTemplate(true);
    try {
      const name = saveTemplateName.trim();
      if (selectedTemplateId && !isSaveAsNew) {
        await apiClient.put(`/label-templates/${selectedTemplateId}`, {
          name,
          widthMm,
          heightMm,
          elements,
        });
        setTemplateName(name);
      } else {
        const res = await apiClient.post('/label-templates', {
          name,
          widthMm,
          heightMm,
          elements,
        });
        if (res.data?.id) {
          setSelectedTemplateId(res.data.id);
          setTemplateName(name);
        }
      }
      await fetchSavedTemplates();
      setShowSaveModal(false);
      setIsSaveAsNew(false);
      setSaveSuccessMsg(`Шаблон «${name}» сохранён в БД!`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: any) {
      alert('Ошибка при сохранении шаблона в базу: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingTemplate(false);
    }
  };

  // Delete template from PostgreSQL DB
  const handleDeleteSavedTemplate = async (id: string) => {
    if (!window.confirm('Вы действительно хотите удалить этот шаблон из базы данных?')) {
      return;
    }
    try {
      await apiClient.delete(`/label-templates/${id}`);
      setSelectedTemplateId('');
      await fetchSavedTemplates();
      setSaveSuccessMsg('Шаблон удален из базы данных');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: any) {
      alert('Ошибка при удалении шаблона: ' + (err.response?.data?.message || err.message));
    }
  };

  // Current row data preview
  const activeRow = useMemo(() => {
    if (csvRows.length > 0 && csvRows[currentRowIndex]) {
      return csvRows[currentRowIndex];
    }
    return {
      code: '0104600439931256215ABC12391FFD092',
      name: 'Кроссовки мужские кожаные',
      sku: 'SNK-2026-BLK',
      size: '42',
      color: 'Черный',
      brand: 'TANBOX Footwear',
      country: 'Турция',
      importer: 'ТОО ТехноМаркет Казахстан',
    };
  }, [csvRows, currentRowIndex]);

  const selectedElement = useMemo(
    () => elements.find((el) => el.id === selectedElementId) || null,
    [elements, selectedElementId]
  );

  // Process CSV file upload
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

  const handleCsvDragEnter = (e: React.DragEvent) => {
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

  // Canvas element drag logic
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

  // Operations on elements
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

  // Keyboard navigation for selected element
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedElementId) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      const step = e.shiftKey ? 5 : 0.5;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setElements((prev) =>
          prev.map((el) => (el.id === selectedElementId ? { ...el, y: Math.max(0, el.y - step) } : el))
        );
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setElements((prev) =>
          prev.map((el) => (el.id === selectedElementId ? { ...el, y: Math.min(heightMm - 1, el.y + step) } : el))
        );
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setElements((prev) =>
          prev.map((el) => (el.id === selectedElementId ? { ...el, x: Math.max(0, el.x - step) } : el))
        );
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setElements((prev) =>
          prev.map((el) => (el.id === selectedElementId ? { ...el, x: Math.min(widthMm - 1, el.x + step) } : el))
        );
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteElement(selectedElementId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, heightMm, widthMm]);

  // Add Element Helpers
  const addDataMatrixElement = () => {
    const newId = `dm-${Date.now()}`;
    const matchedCol =
      csvHeaders.find((h) =>
        ['code', 'marking', 'datamatrix', 'код', 'маркировка'].some((k) =>
          h.toLowerCase().includes(k)
        )
      ) ||
      csvHeaders[0] ||
      'code';

    const maxDim = Math.min(widthMm, heightMm);
    const size = Math.max(8, Math.min(18, Math.floor(maxDim * 0.45)));

    const newEl: DataMatrixElement = {
      id: newId,
      type: 'datamatrix',
      x: 2,
      y: 2,
      size,
      columnName: matchedCol,
      matrixStructure: 'four_regions',
      rotation: 0,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedElementId(newId);
  };

  const addTextElement = () => {
    const newId = `txt-${Date.now()}`;
    const width = Math.max(10, widthMm - 4);
    const y = Math.min(Math.max(2, Math.floor(heightMm / 3)), Math.max(2, heightMm - 8));
    const isCompact = Math.min(widthMm, heightMm) <= 25;

    const newEl: TextElement = {
      id: newId,
      type: 'text',
      x: 2,
      y,
      width,
      content: csvHeaders[0] ? `{${csvHeaders[0]}}` : 'Новый текст',
      fontSize: isCompact ? 5.5 : 7,
      fontWeight: 'normal',
      fontFamily: 'Arial, sans-serif',
      align: 'left',
      rotation: 0,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedElementId(newId);
  };

  const addSymbolElement = (type: SymbolType, hasBorder = false) => {
    const newId = `sym-${Date.now()}`;
    const size = Math.max(3, Math.min(7, Math.floor(Math.min(widthMm, heightMm) / 3)));
    const x = Math.max(1, Math.min(widthMm - size - 1, Math.floor((widthMm - size) / 2)));
    const y = Math.max(1, Math.min(heightMm - size - 1, Math.floor((heightMm - size) / 2)));

    const newEl: SymbolElement = {
      id: newId,
      type: 'symbol',
      symbolType: type,
      x,
      y,
      size,
      hasBorder,
      rotation: 0,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedElementId(newId);
  };

  const addDividerElement = () => {
    const newId = `div-${Date.now()}`;
    const length = Math.max(10, widthMm - 4);
    const newEl: DividerElement = {
      id: newId,
      type: 'divider',
      x: 2,
      y: Math.max(1, Math.floor(heightMm / 2)),
      length,
      orientation: 'horizontal',
      thickness: 0.3,
      rotation: 0,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedElementId(newId);
  };

  const addBarcodeElement = () => {
    const newId = `bc-${Date.now()}`;
    const matchedCol =
      csvHeaders.find((h) =>
        ['barcode', 'штрихкод', 'ean', 'ean13', 'sku', 'баркод'].some((k) =>
          h.toLowerCase().includes(k)
        )
      ) ||
      (csvHeaders.includes('gtin') ? 'gtin' : 'barcode');

    const width = Math.min(widthMm - 4, 38);
    const height = Math.min(heightMm - 4, 12);

    const newEl: BarcodeElement = {
      id: newId,
      type: 'barcode',
      x: Math.max(1, Math.floor((widthMm - width) / 2)),
      y: Math.max(1, heightMm - height - 2),
      width: Math.max(15, width),
      height: Math.max(8, height),
      columnName: matchedCol,
      rotation: 0,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedElementId(newId);
  };

  const addQRCodeElement = () => {
    const newId = `qr-${Date.now()}`;
    const matchedCol =
      csvHeaders.find((h) =>
        ['qr', 'link', 'url', 'site', 'kaspi'].some((k) =>
          h.toLowerCase().includes(k)
        )
      ) || 'https://tanbox.kz';

    const maxDim = Math.min(widthMm, heightMm);
    const size = Math.max(6, Math.min(16, Math.floor(maxDim * 0.45)));

    const newEl: QRCodeElement = {
      id: newId,
      type: 'qrcode',
      x: 2,
      y: 2,
      size,
      columnName: matchedCol,
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

  // Generate PDF download
  const handleGeneratePdf = async () => {
    setGenerating(true);
    try {
      const template = {
        name: templateName,
        widthMm,
        heightMm,
        elements,
      };

      let response;
      if (uploadedFile) {
        const formData = new FormData();
        formData.append('template', JSON.stringify(template));
        formData.append('file', uploadedFile);
        if (pdfLimit === 'sample') {
          formData.append('limit', '5');
        }

        response = await apiClient.post('/labels/generate-pdf', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          responseType: 'blob',
        });
      } else {
        const limitParam = pdfLimit === 'sample' ? '?limit=5' : '';
        response = await apiClient.post(
          `/labels/generate-pdf${limitParam}`,
          {
            template,
            csvData: csvRows.length > 0 ? csvRows : [activeRow],
          },
          { responseType: 'blob' }
        );
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      if (orderId && pdfLimit !== 'sample') {
        try {
          await apiClient.patch(`/orders/${orderId}/status`, {
            pdfUrl: `/api/orders/${orderId}/pdf`,
          });
        } catch {}
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tanbox-${widthMm}x${heightMm}-labels.pdf`;
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
    <div className="space-y-6 pb-16">
      {/* Active Order Context Header (when opened from an order) */}
      {orderId && (
        <div className="bg-[#111827] text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <Link
              to={`/orders/${orderId}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> К заказу #{orderData?.orderNumber || orderId}
            </Link>

            <span className="text-gray-500">|</span>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white block">
                  Работа над макетом стикера: {orderData?.user?.companyName || `Заказ #${orderData?.orderNumber}`}
                </span>
                {totalRowsCount > 0 && (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                    ✓ Подгружено кодов: {totalRowsCount.toLocaleString()}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-gray-400">
                Размер: {widthMm}×{heightMm} мм • Товар: {orderData?.category}
                {fileName && ` • Источник: ${fileName}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {orderSentSuccess ? (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Макет передан клиенту на согласование!
              </span>
            ) : orderData?.stickerApprovalStatus === 'WAITING_APPROVAL' ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Ожидает согласования клиентом
                </span>
                <button
                  type="button"
                  onClick={handleSaveAndSendToClient}
                  className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-gray-200 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                  title="Сохранить текущие правки в базу данных"
                >
                  <Save className="w-3.5 h-3.5" />
                  Сохранить в БД
                </button>
              </div>
            ) : orderData?.stickerApprovalStatus === 'CHANGES_REQUESTED' ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2.5 py-1 rounded-lg">
                  Клиент запросил правки
                </span>
                <button
                  type="button"
                  onClick={handleSaveAndSendToClient}
                  className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  Отправить обновленный макет клиенту
                </button>
              </div>
            ) : orderData?.stickerApprovalStatus === 'APPROVED' ? (
              <span className="text-xs font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Макет утвержден клиентом
              </span>
            ) : (
              <button
                type="button"
                onClick={handleSaveAndSendToClient}
                className="inline-flex items-center gap-1.5 bg-[#0082FB] hover:bg-[#0070DA] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                Отправить клиенту на согласование
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sleek & Compact Top Header Bar */}
      <div className="bg-white px-5 py-3 rounded-2xl border border-gray-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left Section: Title & DB Template Manager */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5 pr-3 border-r border-gray-200/80">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0082FB] flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-black text-[#111827] leading-none">
                Конструктор этикеток
              </h1>
            </div>
          </div>

          {/* Database Template Select & Actions */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <select
              value={selectedTemplateId}
              onChange={(e) => handleSelectSavedTemplate(e.target.value)}
              className="text-xs font-bold border border-gray-200 rounded-xl px-3 py-1.5 bg-gray-50 text-[#111827] hover:bg-gray-100 transition-colors focus:outline-none focus:border-[#0082FB] max-w-[240px] truncate cursor-pointer"
            >
              <option value="">Шаблон: (Новый макет)</option>
              {savedTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.widthMm}×{t.heightMm} мм)
                </option>
              ))}
            </select>

            {selectedTemplateId && (
              <button
                onClick={() => handleDeleteSavedTemplate(selectedTemplateId)}
                title="Удалить выбранный шаблон из базы"
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={handleSaveClick}
              disabled={savingTemplate}
              title={
                selectedTemplateId
                  ? `Сохранить изменения в шаблон «${templateName || 'текущий'}»`
                  : 'Сохранить шаблон в базу данных'
              }
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {savingTemplate ? (
                <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5 text-emerald-600" />
              )}
              {savingTemplate ? 'Сохранение...' : 'Сохранить в БД'}
            </button>

            {selectedTemplateId && (
              <button
                type="button"
                onClick={() => {
                  setIsSaveAsNew(true);
                  setSaveTemplateName(`${templateName} (копия)`);
                  setShowSaveModal(true);
                }}
                title="Сохранить текущий макет как отдельный новый шаблон"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-gray-500" />
                Как новый...
              </button>
            )}

            <button
              onClick={handleClearCanvas}
              title="Очистить холст"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 text-gray-500" />
              Очистить
            </button>

            {saveSuccessMsg && (
              <span className="text-emerald-600 text-xs font-bold flex items-center gap-1 ml-1 animate-fade-in">
                <Check className="w-3.5 h-3.5" />
                {saveSuccessMsg}
              </span>
            )}
          </div>
        </div>

        {/* Right Section: Print Options & Download PDF */}
        <div className="flex items-center gap-2.5">
          <select
            value={pdfLimit}
            onChange={(e) => setPdfLimit(e.target.value as any)}
            className="text-xs font-bold border border-gray-200 rounded-xl px-2.5 py-1.5 bg-gray-50 text-[#111827] focus:outline-none cursor-pointer"
          >
            <option value="all">Все коды ({totalRowsCount || csvRows.length || 1} шт.)</option>
            <option value="sample">Тест (5 шт.)</option>
          </select>

          <button
            onClick={handleGeneratePdf}
            disabled={generating || elements.length === 0}
            className="inline-flex items-center gap-1.5 bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Формирование PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Сгенерировать PDF рулона
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main 3-Column Studio Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Toolbox */}
        <LeftToolbox
          fileName={fileName}
          isCsvDragOver={isCsvDragOver}
          uploadError={uploadError}
          csvRows={csvRows}
          totalRowsCount={totalRowsCount}
          csvHeaders={csvHeaders}
          handleCsvDragOver={handleCsvDragOver}
          handleCsvDragEnter={handleCsvDragEnter}
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
        />

        {/* Right Column: Properties Sidebar */}
        <PropertiesSidebar
          selectedElement={selectedElement}
          widthMm={widthMm}
          heightMm={heightMm}
          csvHeaders={csvHeaders}
          updateElement={updateElement}
          deleteElement={deleteElement}
          rotateElementBy90={rotateElementBy90}
        />
      </div>

      {/* Save Template Modal */}
      <SaveTemplateModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        saveTemplateName={saveTemplateName}
        setSaveTemplateName={setSaveTemplateName}
        widthMm={widthMm}
        heightMm={heightMm}
        elements={elements}
        savingTemplate={savingTemplate}
        onConfirmSave={handleConfirmSaveTemplate}
      />
    </div>
  );
};
