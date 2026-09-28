import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Upload, 
  Download, 
  Plus, 
  Trash2, 
  QrCode, 
  Type, 
  ShieldCheck, 
  Layers, 
  FileText, 
  Check, 
  RefreshCw, 
  Eye, 
  Settings2, 
  ChevronLeft, 
  ChevronRight,
  Maximize2,
  Sparkles,
  Barcode as BarcodeIcon,
  HelpCircle,
  AlertCircle,
  Save,
  Bookmark,
  RotateCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Bold,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus
} from 'lucide-react';
import axios from 'axios';

export type SymbolType = 
  | 'EAC' 
  | 'EAC_BOX'
  | 'RECYCLE' 
  | 'GLASS_FORK' 
  | 'WASH_30' 
  | 'NO_BLEACH' 
  | 'IRON_LOW' 
  | 'KEEP_DRY';

export interface BaseElement {
  id: string;
  type: 'datamatrix' | 'text' | 'symbol' | 'divider' | 'barcode';
  x: number; // in mm
  y: number; // in mm
  rotation?: number; // 0, 90, 180, 270 degrees
}

export interface DataMatrixElement extends BaseElement {
  type: 'datamatrix';
  size: number; // in mm
  columnName: string;
  matrixStructure?: 'four_regions' | 'auto';
}

export interface TextElement extends BaseElement {
  type: 'text';
  width: number; // in mm
  content: string; // e.g. "{name}" or "Арт: {sku}"
  fontSize: number; // pt
  fontWeight: 'normal' | 'bold';
  fontFamily?: string;
  align: 'left' | 'center' | 'right';
}

export interface SymbolElement extends BaseElement {
  type: 'symbol';
  symbolType: SymbolType;
  size: number; // in mm
  hasBorder?: boolean;
}

export interface DividerElement extends BaseElement {
  type: 'divider';
  length: number; // in mm
  orientation: 'horizontal' | 'vertical';
  thickness?: number; // in mm
}

export interface BarcodeElement extends BaseElement {
  type: 'barcode';
  width: number;
  height: number;
  columnName: string;
}

export type LabelElement = 
  | DataMatrixElement 
  | TextElement 
  | SymbolElement 
  | DividerElement 
  | BarcodeElement;

export interface LabelTemplate {
  name: string;
  widthMm: number;
  heightMm: number;
  elements: LabelElement[];
}

const PRESET_SIZES = [
  { label: '58 × 40 мм (Стандарт РК / Kaspi)', width: 58, height: 40 },
  { label: '58 × 60 мм (Одежда / Обувь)', width: 58, height: 60 },
  { label: '43 × 25 мм (Фарма / Флаконы)', width: 43, height: 25 },
  { label: '30 × 20 мм (Компактный / Ювелирка)', width: 30, height: 20 },
  { label: '75 × 120 мм (Транспортный короб SSCC)', width: 75, height: 120 },
];

const FONT_FAMILIES = [
  { label: 'Arial (Стандартный без засечек)', value: 'Arial, sans-serif' },
  { label: 'Roboto (Современный)', value: 'Roboto, sans-serif' },
  { label: 'Inter (Чистый системный)', value: 'Inter, sans-serif' },
  { label: 'Courier New (Моноширинный)', value: '"Courier New", monospace' },
  { label: 'Times New Roman (С засечками)', value: '"Times New Roman", serif' },
];

const SAMPLE_CSV = `code,name,sku,size,color,brand,country,importer
0104600439931256215ABC12391FFD092,"Кроссовки мужские кожаные",SNK-2026-BLK,42,"Черный","TANBOX Footwear","Турция","ТОО ТехноМаркет Казахстан"
0104600439931256215ABC12491FFD092,"Кроссовки мужские кожаные",SNK-2026-BLK,43,"Черный","TANBOX Footwear","Турция","ТОО ТехноМаркет Казахстан"
0104600439931256215ABC12591FFD092,"Кроссовки мужские кожаные",SNK-2026-WHT,42,"Белый","TANBOX Footwear","Турция","ТОО ТехноМаркет Казахстан"
0104600439931256215ABC12691FFD092,"Футболка хлопковая оверсайз",TSH-KAZ-001,L,"Синий","Qazaq Style","Казахстан","ТОО ТехноМаркет Казахстан"
0104600439931256215ABC12791FFD092,"Футболка хлопковая оверсайз",TSH-KAZ-001,M,"Синий","Qazaq Style","Казахстан","ТОО ТехноМаркет Казахстан"`;

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

  // Selected element for editing in sidebar
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);
  const [pdfLimit, setPdfLimit] = useState<'all' | 'sample'>('all');

  // Database Templates state
  interface SavedTemplate {
    id: string;
    name: string;
    widthMm: number;
    heightMm: number;
    description?: string;
    elements: LabelElement[];
    createdAt: string;
    updatedAt: string;
  }

  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [saveTemplateName, setSaveTemplateName] = useState<string>('');
  const [savingTemplate, setSavingTemplate] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Initial Elements layout is completely EMPTY by default as requested
  const [elements, setElements] = useState<LabelElement[]>([]);

  // Auto-adjust zoom when label dimensions are small (like 30x20 mm)
  const handleSelectPreset = (w: number, h: number) => {
    setWidthMm(w);
    setHeightMm(h);
    if (w <= 35 || h <= 25) {
      setZoom(2); // Automatically set to 200% for compact labels so they are clearly visible
    } else {
      setZoom(1);
    }
  };

  // Fetch saved templates from PostgreSQL database
  const fetchSavedTemplates = async () => {
    try {
      const res = await axios.get('/api/label-templates');
      if (Array.isArray(res.data)) {
        setSavedTemplates(res.data);
      }
    } catch (err) {
      console.warn('Could not load saved templates from DB:', err);
    }
  };

  useEffect(() => {
    fetchSavedTemplates();
  }, []);

  // Load a template from the database
  const handleSelectSavedTemplate = (id: string) => {
    setSelectedTemplateId(id);
    if (!id) return;
    const tpl = savedTemplates.find((t) => t.id === id);
    if (tpl) {
      setWidthMm(tpl.widthMm);
      setHeightMm(tpl.heightMm);
      setTemplateName(tpl.name);
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
  };

  // Confirm save template into PostgreSQL DB
  const handleConfirmSaveTemplate = async () => {
    if (!saveTemplateName.trim()) return;
    setSavingTemplate(true);
    try {
      if (selectedTemplateId) {
        // Update existing template
        await axios.put(`/api/label-templates/${selectedTemplateId}`, {
          name: saveTemplateName.trim(),
          widthMm,
          heightMm,
          elements,
        });
      } else {
        // Create new template
        const res = await axios.post('/api/label-templates', {
          name: saveTemplateName.trim(),
          widthMm,
          heightMm,
          elements,
        });
        if (res.data?.id) {
          setSelectedTemplateId(res.data.id);
        }
      }
      await fetchSavedTemplates();
      setShowSaveModal(false);
      setSaveSuccessMsg('Шаблон сохранён в БД!');
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
      await axios.delete(`/api/label-templates/${id}`);
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

  // Load sample CSV helper
  const handleLoadSampleCsv = () => {
    setUploadedFile(null);
    parseCsvText(SAMPLE_CSV, 'sample_shoes_data.csv');
  };

  // Upload and parse CSV
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setUploadedFile(file);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/api/labels/parse-csv', formData, {
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

  const parseCsvText = (text: string, name: string) => {
    setFileName(name);
    setUploadError(null);
    axios
      .post('/api/labels/parse-csv', { csvText: text })
      .then((res) => {
        setCsvHeaders(res.data.headers);
        setCsvRows(res.data.previewRows);
        setTotalRowsCount(res.data.totalRows);
        setCurrentRowIndex(0);
      })
      .catch((err: any) => {
        setUploadError(err.response?.data?.message || err.message || 'Ошибка парсинга CSV');
      });
  };

  // Canvas scale factor (1 mm = 7 px at 100% zoom)
  const baseScale = 7;
  const effectiveScale = baseScale * zoom;
  const canvasWidthPx = widthMm * effectiveScale;
  const canvasHeightPx = heightMm * effectiveScale;

  // Drag-and-drop state
  const draggingRef = useRef<{
    elementId: string;
    startClientX: number;
    startClientY: number;
    startElX: number;
    startElY: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (e.button !== 0) return; // Only left click
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

  // Global mouse move & up listeners for smooth 60fps drag with zoom correction
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const { elementId, startClientX, startClientY, startElX, startElY } = draggingRef.current;

      const deltaX = (e.clientX - startClientX) / effectiveScale;
      const deltaY = (e.clientY - startClientY) / effectiveScale;

      const rawNewX = startElX + deltaX;
      const rawNewY = startElY + deltaY;

      // Snap to 0.5 mm steps and clamp to label margins
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
  }, [effectiveScale, widthMm, heightMm]);

  // Keyboard nudging with arrow keys (0.5 mm step, 1 mm with Shift) & Delete key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedElementId) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const step = e.shiftKey ? 1 : 0.5;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        setElements((prev) =>
          prev.map((el) => {
            if (el.id !== selectedElementId) return el;
            let newX = el.x;
            let newY = el.y;
            if (e.key === 'ArrowLeft') newX = Math.max(0, el.x - step);
            if (e.key === 'ArrowRight') newX = Math.min(widthMm - 1, el.x + step);
            if (e.key === 'ArrowUp') newY = Math.max(0, el.y - step);
            if (e.key === 'ArrowDown') newY = Math.min(heightMm - 1, el.y + step);
            return {
              ...el,
              x: Math.round(newX * 10) / 10,
              y: Math.round(newY * 10) / 10,
            } as LabelElement;
          })
        );
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteElement(selectedElementId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, widthMm, heightMm]);

  // Element modifiers
  const updateElement = (id: string, patch: Partial<LabelElement>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? ({ ...el, ...patch } as LabelElement) : el))
    );
  };

  const deleteElement = (id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  // Helper: Rotate element by +90 degrees
  const rotateElementBy90 = (id: string) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== id) return el;
        const currentRot = el.rotation || 0;
        const nextRot = (currentRot + 90) % 360;
        return { ...el, rotation: nextRot } as LabelElement;
      })
    );
  };

  // --- Dynamic and Safe Element Creation (Prevents elements from appearing off-canvas on 30x20 mm!) ---
  const addDataMatrixElement = () => {
    const newId = `dm-${Date.now()}`;
    const matchedCol =
      csvHeaders.find((h) =>
        ['code', 'код', 'cis', 'gtin', 'datamatrix', 'barcode'].some((k) =>
          h.toLowerCase().includes(k)
        )
      ) ||
      csvHeaders[0] ||
      'code';

    // Auto-calculate size that comfortably fits inside label bounds
    const maxDimension = Math.min(widthMm, heightMm);
    const size = Math.max(6, Math.min(16, Math.floor(maxDimension * 0.55)));

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
    // Fit width within canvas boundaries
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
    // Responsive size: fits comfortably even on 30x20 mm
    const size = Math.max(3, Math.min(7, Math.floor(Math.min(widthMm, heightMm) / 3)));
    // Place in visible area (centered by default so it's guaranteed to be seen!)
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
    const length = Math.max(5, widthMm - 4);
    const y = Math.floor(heightMm / 2);

    const newEl: DividerElement = {
      id: newId,
      type: 'divider',
      x: 2,
      y,
      length,
      orientation: 'horizontal',
      thickness: 0.3,
      rotation: 0,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedElementId(newId);
  };

  // Generate PDF download
  const handleGeneratePdf = async () => {
    setGenerating(true);
    try {
      const template: LabelTemplate = {
        name: templateName,
        widthMm,
        heightMm,
        elements,
      };

      let response;
      if (uploadedFile && pdfLimit === 'all') {
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('template', JSON.stringify(template));
        response = await axios.post('/api/labels/generate-pdf', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          responseType: 'blob',
        });
      } else {
        const limitParam = pdfLimit === 'sample' ? '?limit=5' : '';
        response = await axios.post(
          `/api/labels/generate-pdf${limitParam}`,
          {
            template,
            csvData: csvRows.length > 0 ? csvRows : [activeRow],
          },
          { responseType: 'blob' }
        );
      }

      // Download triggered
      const blob = new Blob([response.data], { type: 'application/pdf' });
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
              <span className="text-[10px] text-[#64748B] font-medium">Zebra / TSC / Xprinter</span>
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
              onClick={() => {
                setSaveTemplateName(templateName);
                setShowSaveModal(true);
              }}
              title="Сохранить макет в базу данных"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition-colors cursor-pointer active:scale-95"
            >
              <Save className="w-3.5 h-3.5 text-emerald-600" />
              Сохранить в БД
            </button>

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
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Сгенерировать PDF рулона
          </button>
        </div>
      </div>

      {/* Main 3-Column Studio Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Data & Elements Toolbox (3 cols) */}
        <div className="xl:col-span-3 space-y-5">
          
          {/* 1. CSV Data Source Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#111827] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#0082FB]" />
                1. Данные для маркировки (CSV)
              </h3>
            </div>

            <label className="border-2 border-dashed border-gray-200 hover:border-[#0082FB] rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-blue-50/20 text-center">
              <Upload className="w-6 h-6 text-[#64748B] mb-2" />
              <span className="text-xs font-bold text-[#111827]">
                {fileName ? fileName : 'Выберите CSV файл с кодами'}
              </span>
              <span className="text-[11px] text-[#94A3B8] mt-0.5">или перетащите сюда</span>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {uploadError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>Ошибка чтения файла:</span>
                </div>
                <p className="text-[11px] text-red-600 leading-relaxed">{uploadError}</p>
              </div>
            )}

            {csvRows.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span>Загружено записей:</span>
                  <span className="bg-emerald-200/60 px-2 py-0.5 rounded-md font-black">
                    {totalRowsCount || csvRows.length} шт.
                  </span>
                </div>
                <p className="text-[11px] text-emerald-600 truncate">
                  Колонки: {csvHeaders.join(', ')}
                </p>
              </div>
            )}
          </div>

          {/* 2. Format / Size Selector */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#111827] flex items-center gap-1.5">
              <Maximize2 className="w-4 h-4 text-[#0082FB]" />
              2. Размер этикетки
            </h3>

            <div className="space-y-1.5">
              {PRESET_SIZES.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handleSelectPreset(preset.width, preset.height)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    widthMm === preset.width && heightMm === preset.height
                      ? 'bg-[#0082FB] text-white shadow-xs'
                      : 'bg-gray-50 text-[#475569] hover:bg-gray-100'
                  }`}
                >
                  <span>{preset.label}</span>
                  {widthMm === preset.width && heightMm === preset.height && (
                    <Check className="w-3.5 h-3.5" />
                  )}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
              <div>
                <label className="text-[11px] font-bold text-[#64748B]">Ширина (мм)</label>
                <input
                  type="number"
                  value={widthMm}
                  onChange={(e) => setWidthMm(Number(e.target.value))}
                  className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2 mt-1"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#64748B]">Высота (мм)</label>
                <input
                  type="number"
                  value={heightMm}
                  onChange={(e) => setHeightMm(Number(e.target.value))}
                  className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2 mt-1"
                />
              </div>
            </div>
          </div>

          {/* 3. Add Elements Toolbar */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#111827]">
              3. Добавить элементы
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={addDataMatrixElement}
                className="col-span-2 p-2.5 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-[#0082FB]" />
                + DataMatrix (Маркировка TANBA)
              </button>

              <button
                onClick={addTextElement}
                className="p-2.5 bg-gray-50 hover:bg-[#EBF5FF] hover:text-[#0082FB] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-gray-200/50"
              >
                <Type className="w-4 h-4" />
                + Текст
              </button>

              <button
                onClick={() => addSymbolElement('EAC')}
                className="p-2.5 bg-gray-50 hover:bg-[#EBF5FF] hover:text-[#0082FB] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-gray-200/50"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                + Знак EAC
              </button>

              <button
                onClick={() => addSymbolElement('EAC_BOX')}
                className="p-2.5 bg-gray-50 hover:bg-[#EBF5FF] hover:text-[#0082FB] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-gray-200/50"
              >
                [EAC] в рамке
              </button>

              <button
                onClick={() => addSymbolElement('WASH_30')}
                className="p-2.5 bg-gray-50 hover:bg-[#EBF5FF] hover:text-[#0082FB] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-gray-200/50"
              >
                🧺 Стирка 30°
              </button>

              <button
                onClick={() => addSymbolElement('RECYCLE')}
                className="p-2.5 bg-gray-50 hover:bg-[#EBF5FF] hover:text-[#0082FB] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-gray-200/50"
              >
                ♻ Петля 21
              </button>

              <button
                onClick={() => addSymbolElement('GLASS_FORK')}
                className="p-2.5 bg-gray-50 hover:bg-[#EBF5FF] hover:text-[#0082FB] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-gray-200/50"
              >
                🍷🍴 Пищевой
              </button>

              <button
                onClick={() => addSymbolElement('KEEP_DRY')}
                className="p-2.5 bg-gray-50 hover:bg-[#EBF5FF] hover:text-[#0082FB] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-gray-200/50"
              >
                ☂ От влаги
              </button>

              <button
                onClick={addDividerElement}
                className="col-span-2 p-2.5 bg-gray-50 hover:bg-[#EBF5FF] hover:text-[#0082FB] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-gray-200/50"
              >
                — Линия / разделитель
              </button>
            </div>
          </div>

          {/* 4. Layout Elements / Layers List */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#111827] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#0082FB]" />
                4. Слои на макете ({elements.length})
              </h3>
            </div>

            <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
              {elements.length === 0 ? (
                <div className="text-center py-4 text-xs text-gray-400">Холст пуст</div>
              ) : (
                elements.map((el) => {
                  const isSelected = selectedElementId === el.id;
                  let label = '';
                  if (el.type === 'datamatrix') label = `DataMatrix [${el.columnName || 'code'}]`;
                  else if (el.type === 'text') label = el.content || 'Текст';
                  else if (el.type === 'symbol') label = `Знак ${el.symbolType}`;
                  else if (el.type === 'divider') label = `Линия (${el.length} мм)`;

                  return (
                    <button
                      key={el.id}
                      onClick={() => setSelectedElementId(el.id)}
                      className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors border cursor-pointer ${
                        isSelected
                          ? 'bg-[#EBF5FF] border-[#0082FB] text-[#0082FB] font-bold shadow-xs'
                          : 'bg-gray-50/70 border-gray-100 text-[#475569] hover:bg-gray-100'
                      }`}
                    >
                      <span className="truncate pr-2">{label}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {el.rotation ? (
                          <span className="bg-blue-100 text-blue-700 text-[9px] px-1 py-0.5 rounded font-mono">
                            {el.rotation}°
                          </span>
                        ) : null}
                        <span className="text-[10px] text-[#94A3B8] font-mono">
                          {el.x}×{el.y}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* CENTER COLUMN: Interactive Canvas (6 cols) */}
        <div className="xl:col-span-6 bg-white p-6 sm:p-8 rounded-2xl border border-gray-200/80 shadow-xs space-y-5">
          
          {/* Canvas Top Toolbar: Format, Zoom, and CSV Row Pager */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-[#111827] uppercase tracking-wider">
                Холст
              </span>
              <span className="bg-gray-100 text-[#64748B] text-[11px] font-bold px-2 py-0.5 rounded-md">
                {widthMm} × {heightMm} мм
              </span>
            </div>

            {/* Interactive Zoom Toolbar (Vital for 30x20 mm and small formats!) */}
            <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl text-xs font-bold text-gray-700">
              <span className="text-[11px] text-gray-500 px-1.5 flex items-center gap-1">
                Зум:
              </span>
              <button
                onClick={() => setZoom((prev) => Math.max(0.75, Math.round((prev - 0.25) * 100) / 100))}
                title="Уменьшить"
                className="p-1 hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              {([1, 1.5, 2, 3] as const).map((z) => (
                <button
                  key={z}
                  onClick={() => setZoom(z)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] transition-all cursor-pointer ${
                    zoom === z ? 'bg-[#0082FB] text-white shadow-xs' : 'hover:bg-white text-gray-600'
                  }`}
                >
                  {z * 100}%
                </button>
              ))}

              <button
                onClick={() => setZoom((prev) => Math.min(4, Math.round((prev + 0.25) * 100) / 100))}
                title="Увеличить"
                className="p-1 hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Pagination across CSV rows */}
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span className="text-[#64748B]">Код:</span>
              <button
                onClick={() => setCurrentRowIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentRowIndex === 0}
                className="p-1 hover:bg-gray-100 rounded-md disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono">
                {currentRowIndex + 1} / {csvRows.length || 1}
              </span>
              <button
                onClick={() => setCurrentRowIndex((prev) => Math.min((csvRows.length || 1) - 1, prev + 1))}
                disabled={currentRowIndex >= (csvRows.length || 1) - 1}
                className="p-1 hover:bg-gray-100 rounded-md disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Actual Label Visual Canvas in exact mm proportions with Zoom */}
          <div className="flex items-center justify-center p-6 sm:p-10 bg-[#F1F5F9] rounded-2xl border border-dashed border-gray-300 overflow-auto min-h-[380px] max-h-[620px]">
            <div
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setSelectedElementId(null);
                }
              }}
              style={{
                width: `${canvasWidthPx}px`,
                height: `${canvasHeightPx}px`,
                backgroundImage: 'radial-gradient(#CBD5E1 1.2px, transparent 1.2px)',
                backgroundSize: `${effectiveScale * 5}px ${effectiveScale * 5}px`,
              }}
              className="bg-white shadow-xl relative border border-gray-400 select-none overflow-hidden transition-all duration-100 shrink-0"
            >
              {elements.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center pointer-events-none">
                  <QrCode className="w-8 h-8 text-gray-300 mb-1 stroke-1" />
                  <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Пустой макет</span>
                  <span className="text-[10px] text-gray-400 mt-0.5 max-w-[180px] leading-tight">
                    Добавьте DataMatrix, текст или знак кнопками слева
                  </span>
                </div>
              )}

              {elements.map((el) => {
                const isSelected = selectedElementId === el.id;
                const isItemDragging = isDragging && draggingRef.current?.elementId === el.id;
                const leftPx = el.x * effectiveScale;
                const topPx = el.y * effectiveScale;
                const rotation = el.rotation || 0;

                return (
                  <div
                    key={el.id}
                    onMouseDown={(e) => handleMouseDown(e, el.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedElementId(el.id);
                    }}
                    style={{
                      position: 'absolute',
                      left: `${leftPx}px`,
                      top: `${topPx}px`,
                      transform: `rotate(${rotation}deg)`,
                      transformOrigin: 'center center',
                      touchAction: 'none',
                    }}
                    className={`select-none ${
                      isItemDragging
                        ? 'cursor-grabbing z-30 shadow-lg ring-2 ring-[#0082FB] bg-blue-50/40'
                        : isSelected
                        ? 'cursor-grab z-20 ring-2 ring-[#0082FB] ring-offset-1 bg-blue-50/20'
                        : 'cursor-grab z-10 hover:outline hover:outline-1 hover:outline-dashed hover:outline-blue-400'
                    }`}
                  >
                    {/* Floating coordinates badge */}
                    {isSelected && (
                      <div className="absolute -top-5 left-0 bg-[#0082FB] text-white text-[9px] font-mono px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-40 flex items-center gap-1">
                        <span>{el.x} × {el.y} мм</span>
                        {rotation !== 0 && <span>({rotation}°)</span>}
                      </div>
                    )}

                    {/* Quick rotate icon button right on selected element */}
                    {isSelected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          rotateElementBy90(el.id);
                        }}
                        title="Повернуть на 90°"
                        className="absolute -top-3.5 -right-3.5 w-6 h-6 rounded-full bg-white border border-gray-300 shadow hover:bg-blue-50 hover:text-[#0082FB] flex items-center justify-center text-gray-700 z-40 transition-transform active:rotate-90 cursor-pointer"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Render Element Types on Canvas */}
                    {el.type === 'datamatrix' && (
                      <div
                        style={{
                          width: `${el.size * effectiveScale}px`,
                          height: `${el.size * effectiveScale}px`,
                        }}
                        className="bg-white border border-gray-400 p-0.5 flex flex-col items-center justify-center shadow-xs"
                      >
                        {/* Realistic 4-quadrant DataMatrix (TANBA / ИС МПТ) */}
                        <div className="w-full h-full bg-black relative grid grid-cols-2 grid-rows-2 gap-[1px] p-[0.5px]">
                          <div className="bg-black relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(#fff_1.2px,transparent_1.2px)] [background-size:3px_3px]" />
                          </div>
                          <div className="bg-black relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(#fff_1.2px,transparent_1.2px)] [background-size:3px_3px]" />
                          </div>
                          <div className="bg-black relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(#fff_1.2px,transparent_1.2px)] [background-size:3px_3px]" />
                          </div>
                          <div className="bg-black relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(#fff_1.2px,transparent_1.2px)] [background-size:3px_3px]" />
                          </div>
                          <span className="absolute inset-0 m-auto w-max h-max bg-black/85 px-1 py-0.5 rounded text-[6px] text-white font-mono leading-none">
                            TANBA
                          </span>
                        </div>
                      </div>
                    )}

                    {el.type === 'text' && (
                      <div
                        style={{
                          width: `${el.width * effectiveScale}px`,
                          fontSize: `${el.fontSize * (effectiveScale / baseScale) * 1.33}px`,
                          fontWeight: el.fontWeight === 'bold' ? 700 : 400,
                          fontFamily: el.fontFamily || 'Arial, sans-serif',
                          textAlign: el.align,
                          lineHeight: 1.2,
                        }}
                        className="text-black whitespace-pre-wrap break-words"
                      >
                        {el.content.replace(/\{([^{}]+)\}/g, (_, key) => activeRow[key] || `{${key}}`)}
                      </div>
                    )}

                    {el.type === 'symbol' && (
                      <div
                        style={{
                          width: `${el.size * effectiveScale}px`,
                          height: `${el.size * effectiveScale}px`,
                        }}
                        className={`flex items-center justify-center select-none text-black ${
                          el.hasBorder ? 'border border-black p-0.5' : ''
                        }`}
                      >
                        {el.symbolType === 'EAC' && (
                          <svg viewBox="0 0 100 100" className="w-full h-full" fill="currentColor">
                            <rect x="0" y="0" width="14" height="100"/>
                            <rect x="14" y="0" width="14" height="14"/>
                            <rect x="14" y="43" width="11" height="14"/>
                            <rect x="14" y="86" width="14" height="14"/>
                            <rect x="36" y="0" width="10" height="100"/>
                            <rect x="54" y="0" width="10" height="100"/>
                            <rect x="46" y="0" width="8" height="14"/>
                            <rect x="46" y="43" width="8" height="14"/>
                            <rect x="72" y="0" width="14" height="100"/>
                            <rect x="86" y="0" width="14" height="14"/>
                            <rect x="86" y="86" width="14" height="14"/>
                          </svg>
                        )}
                        {el.symbolType === 'EAC_BOX' && (
                          <div 
                            className="w-full h-full border-[1.5px] border-black font-black text-black flex items-center justify-center text-center tracking-tight leading-none font-sans"
                            style={{ fontSize: `${el.size * effectiveScale * 0.38}px` }}
                          >
                            EAC
                          </div>
                        )}
                        {el.symbolType === 'RECYCLE' && (
                          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="50,10 92,80 8,80" />
                            <text x="50" y="52" textAnchor="middle" fill="currentColor" stroke="none" fontSize="22" fontWeight="bold" fontFamily="Arial, sans-serif">21</text>
                            <text x="50" y="73" textAnchor="middle" fill="currentColor" stroke="none" fontSize="14" fontWeight="bold" fontFamily="Arial, sans-serif">PAP</text>
                          </svg>
                        )}
                        {el.symbolType === 'GLASS_FORK' && (
                          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M 15 20 L 45 20 L 40 55 Q 30 65 20 55 Z" />
                            <line x1="30" y1="65" x2="30" y2="85" />
                            <line x1="18" y1="85" x2="42" y2="85" />
                            <line x1="72" y1="45" x2="72" y2="85" />
                            <line x1="62" y1="20" x2="62" y2="45" />
                            <line x1="72" y1="20" x2="72" y2="45" />
                            <line x1="82" y1="20" x2="82" y2="45" />
                            <line x1="62" y1="45" x2="82" y2="45" />
                          </svg>
                        )}
                        {el.symbolType === 'WASH_30' && (
                          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M 10 30 L 20 80 L 80 80 L 90 30" />
                            <path d="M 10 45 Q 30 35 50 45 Q 70 55 90 45" />
                            <text x="50" y="73" textAnchor="middle" fill="currentColor" stroke="none" fontSize="25" fontWeight="bold" fontFamily="Arial, sans-serif">30°</text>
                          </svg>
                        )}
                        {el.symbolType === 'NO_BLEACH' && (
                          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="50,15 88,85 12,85" />
                            <line x1="20" y1="80" x2="80" y2="20" />
                            <line x1="20" y1="20" x2="80" y2="80" />
                          </svg>
                        )}
                        {el.symbolType === 'IRON_LOW' && (
                          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M 15 75 L 75 75 Q 90 50 60 35 L 15 35 Z" />
                            <circle cx="45" cy="55" r="5" fill="currentColor" stroke="none" />
                          </svg>
                        )}
                        {el.symbolType === 'KEEP_DRY' && (
                          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M 15 50 Q 50 15 85 50 Z" />
                            <line x1="15" y1="50" x2="85" y2="50" />
                            <path d="M 50 50 L 50 80 Q 50 90 40 90" />
                          </svg>
                        )}
                      </div>
                    )}

                    {el.type === 'divider' && (
                      <div
                        style={{
                          width: el.orientation === 'horizontal' ? `${el.length * effectiveScale}px` : `${Math.max(1, (el.thickness || 0.3) * effectiveScale)}px`,
                          height: el.orientation === 'horizontal' ? `${Math.max(1, (el.thickness || 0.3) * effectiveScale)}px` : `${el.length * effectiveScale}px`,
                        }}
                        className="bg-black"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-[#64748B] pt-2 gap-2">
            <span>💡 Зажмите и тяните элемент мышкой. Кнопка <strong>⟳</strong> или стрелки на клавиатуре меняют положение и поворот.</span>
            {widthMm <= 35 && (
              <span className="text-[#0082FB] font-bold">
                🔎 Для размера 30×20 мм включен увеличенный масштаб ({zoom * 100}%)
              </span>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Selected Element Properties (3 cols) */}
        <div className="xl:col-span-3 space-y-5">
          
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#111827] flex items-center gap-1.5">
                <Settings2 className="w-4 h-4 text-[#0082FB]" />
                Свойства элемента
              </h3>
              {selectedElement && (
                <button
                  onClick={() => deleteElement(selectedElement.id)}
                  title="Удалить элемент"
                  className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {selectedElement ? (
              <div className="space-y-4">
                
                {/* 1. Rotation Controls (0°, 90°, 180°, 270°) */}
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-extrabold text-[#111827] flex items-center gap-1">
                      <RotateCw className="w-3.5 h-3.5 text-[#0082FB]" />
                      Поворот (Вращение)
                    </label>
                    <span className="text-[11px] font-mono font-bold text-[#0082FB]">
                      {selectedElement.rotation || 0}°
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1">
                    {([0, 90, 180, 270] as const).map((angle) => (
                      <button
                        key={angle}
                        onClick={() => updateElement(selectedElement.id, { rotation: angle })}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          (selectedElement.rotation || 0) === angle
                            ? 'bg-[#0082FB] text-white shadow-xs'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-blue-50'
                        }`}
                      >
                        {angle}°
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => rotateElementBy90(selectedElement.id)}
                    className="w-full mt-1 py-1.5 px-3 bg-white border border-blue-200 hover:bg-blue-100 text-[#0082FB] text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    Повернуть на +90°
                  </button>
                </div>

                {/* 2. Coordinates & Positioning */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-[#64748B]">X (мм)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={selectedElement.x}
                      onChange={(e) => updateElement(selectedElement.id, { x: Number(e.target.value) })}
                      className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#64748B]">Y (мм)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={selectedElement.y}
                      onChange={(e) => updateElement(selectedElement.id, { y: Number(e.target.value) })}
                      className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2 mt-1"
                    />
                  </div>
                </div>

                {/* Quick Centering Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const elW = (selectedElement as any).size || (selectedElement as any).width || (selectedElement as any).length || 10;
                      updateElement(selectedElement.id, { x: Math.max(0, Math.round(((widthMm - elW) / 2) * 2) / 2) });
                    }}
                    className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold border border-gray-200 cursor-pointer"
                  >
                    По центру X
                  </button>
                  <button
                    onClick={() => {
                      const elH = (selectedElement as any).size || 6;
                      updateElement(selectedElement.id, { y: Math.max(0, Math.round(((heightMm - elH) / 2) * 2) / 2) });
                    }}
                    className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold border border-gray-200 cursor-pointer"
                  >
                    По центру Y
                  </button>
                </div>

                {/* 3. Text specific properties */}
                {selectedElement.type === 'text' && (
                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    <div>
                      <label className="text-[11px] font-bold text-[#64748B] flex items-center justify-between">
                        <span>Текст шаблона</span>
                        <span className="text-[#0082FB] font-normal">{'{поле}'} из CSV</span>
                      </label>
                      <textarea
                        rows={3}
                        value={selectedElement.content}
                        onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                        className="w-full text-xs border border-gray-200 rounded-lg p-2 mt-1 font-mono"
                      />
                    </div>

                    {/* Font Family Selector */}
                    <div>
                      <label className="text-[11px] font-bold text-[#64748B]">Шрифт (гарнитура)</label>
                      <select
                        value={selectedElement.fontFamily || 'Arial, sans-serif'}
                        onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                        className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2 mt-1 bg-white cursor-pointer"
                      >
                        {FONT_FAMILIES.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Font Size & Stepper */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-[#64748B]">Размер шрифта</label>
                        <span className="text-xs font-mono font-bold text-[#111827]">
                          {selectedElement.fontSize} pt
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => updateElement(selectedElement.id, { fontSize: Math.max(3.5, selectedElement.fontSize - 0.5) })}
                          className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="range"
                          min="3.5"
                          max="24"
                          step="0.5"
                          value={selectedElement.fontSize}
                          onChange={(e) => updateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
                          className="w-full cursor-pointer"
                        />
                        <button
                          onClick={() => updateElement(selectedElement.id, { fontSize: Math.min(32, selectedElement.fontSize + 0.5) })}
                          className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Width of text block */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-[#64748B]">Ширина блока текста</label>
                        <span className="text-xs font-mono font-bold text-[#111827]">
                          {selectedElement.width} мм
                        </span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max={widthMm}
                        step="1"
                        value={selectedElement.width}
                        onChange={(e) => updateElement(selectedElement.id, { width: Number(e.target.value) })}
                        className="w-full mt-1 cursor-pointer"
                      />
                    </div>

                    {/* Styling: Bold & Alignment */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => updateElement(selectedElement.id, { fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' })}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 cursor-pointer ${
                          selectedElement.fontWeight === 'bold' ? 'bg-[#0082FB] text-white border-[#0082FB]' : 'bg-gray-50 border-gray-200 text-gray-700'
                        }`}
                      >
                        <Bold className="w-3.5 h-3.5" />
                        Жирный
                      </button>

                      <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
                        <button
                          onClick={() => updateElement(selectedElement.id, { align: 'left' })}
                          title="По левому краю"
                          className={`p-1.5 cursor-pointer ${selectedElement.align === 'left' ? 'bg-[#0082FB] text-white' : 'bg-gray-50 text-gray-700'}`}
                        >
                          <AlignLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateElement(selectedElement.id, { align: 'center' })}
                          title="По центру"
                          className={`p-1.5 cursor-pointer ${selectedElement.align === 'center' ? 'bg-[#0082FB] text-white' : 'bg-gray-50 text-gray-700'}`}
                        >
                          <AlignCenter className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateElement(selectedElement.id, { align: 'right' })}
                          title="По правому краю"
                          className={`p-1.5 cursor-pointer ${selectedElement.align === 'right' ? 'bg-[#0082FB] text-white' : 'bg-gray-50 text-gray-700'}`}
                        >
                          <AlignRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* CSV Column quick insert pills */}
                    {csvHeaders.length > 0 && (
                      <div className="pt-2">
                        <label className="text-[10px] font-bold text-[#94A3B8] uppercase block mb-1">
                          Вставить переменную из CSV:
                        </label>
                        <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto">
                          {csvHeaders.map((hdr) => (
                            <button
                              key={hdr}
                              onClick={() =>
                                updateElement(selectedElement.id, {
                                  content: `${selectedElement.content} {${hdr}}`,
                                })
                              }
                              className="bg-gray-100 hover:bg-blue-100 hover:text-[#0082FB] text-[10px] font-bold px-2 py-0.5 rounded transition-colors cursor-pointer"
                            >
                              +{hdr}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. DataMatrix specific properties */}
                {selectedElement.type === 'datamatrix' && (
                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    <div>
                      <label className="text-[11px] font-bold text-[#64748B]">Колонка с кодом из CSV</label>
                      <input
                        type="text"
                        value={selectedElement.columnName}
                        onChange={(e) => updateElement(selectedElement.id, { columnName: e.target.value })}
                        className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2 mt-1"
                        placeholder="code"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#64748B]">Формат / Плотность сетки</label>
                      <select
                        value={selectedElement.matrixStructure || 'four_regions'}
                        onChange={(e) => updateElement(selectedElement.id, { matrixStructure: e.target.value as any })}
                        className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2 mt-1 bg-white cursor-pointer"
                      >
                        <option value="four_regions">4 секции с перекрестием (TANBA / ИС МПТ РК)</option>
                        <option value="auto">Авто (минимальная сетка)</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-[#64748B]">Размер стороны (мм)</label>
                        <span className="text-xs font-mono font-bold text-[#111827]">
                          {selectedElement.size} × {selectedElement.size} мм
                        </span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max={Math.min(widthMm, heightMm)}
                        step="0.5"
                        value={selectedElement.size}
                        onChange={(e) => updateElement(selectedElement.id, { size: Number(e.target.value) })}
                        className="w-full mt-1 cursor-pointer"
                      />
                      <div className="flex gap-1.5 mt-1.5">
                        {[8, 10, 12, 14, 16].filter(s => s <= Math.min(widthMm, heightMm)).map((sz) => (
                          <button
                            key={sz}
                            onClick={() => updateElement(selectedElement.id, { size: sz })}
                            className={`flex-1 py-1 text-[10px] font-bold rounded border cursor-pointer ${
                              selectedElement.size === sz ? 'bg-[#0082FB] text-white border-[#0082FB]' : 'bg-gray-50 border-gray-200 text-gray-700'
                            }`}
                          >
                            {sz} мм
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Symbol specific properties */}
                {selectedElement.type === 'symbol' && (
                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    <div>
                      <label className="text-[11px] font-bold text-[#64748B]">Тип знака маркировки</label>
                      <select
                        value={selectedElement.symbolType}
                        onChange={(e) => updateElement(selectedElement.id, { symbolType: e.target.value as SymbolType })}
                        className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2 mt-1 bg-white cursor-pointer"
                      >
                        <option value="EAC">Знак EAC (Официальный по ТР ТС)</option>
                        <option value="EAC_BOX">Знак [EAC] (Классический в рамке)</option>
                        <option value="WASH_30">Стирка при 30° (Таз с волной)</option>
                        <option value="RECYCLE">Петля Мебиуса 21 PAP (Переработка)</option>
                        <option value="GLASS_FORK">Бокал и вилка (Пищевой контакт)</option>
                        <option value="NO_BLEACH">Не отбеливать (Треугольник)</option>
                        <option value="IRON_LOW">Глажка при низкой температуре</option>
                        <option value="KEEP_DRY">Беречь от влаги (Зонт)</option>
                      </select>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={!!selectedElement.hasBorder}
                        onChange={(e) => updateElement(selectedElement.id, { hasBorder: e.target.checked })}
                        className="rounded text-[#0082FB] focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-gray-700">Квадратная рамка вокруг знака</span>
                    </label>

                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-[#64748B]">Размер знака</label>
                        <span className="text-xs font-mono font-bold text-[#111827]">
                          {selectedElement.size} × {selectedElement.size} мм
                        </span>
                      </div>
                      <input
                        type="range"
                        min="3"
                        max={Math.min(25, Math.min(widthMm, heightMm))}
                        step="0.5"
                        value={selectedElement.size}
                        onChange={(e) => updateElement(selectedElement.id, { size: Number(e.target.value) })}
                        className="w-full mt-1 cursor-pointer"
                      />
                      <div className="flex gap-1.5 mt-1.5">
                        {[4, 5, 6, 8, 10].filter(s => s <= Math.min(widthMm, heightMm)).map((sz) => (
                          <button
                            key={sz}
                            onClick={() => updateElement(selectedElement.id, { size: sz })}
                            className={`flex-1 py-1 text-[10px] font-bold rounded border cursor-pointer ${
                              selectedElement.size === sz ? 'bg-[#0082FB] text-white border-[#0082FB]' : 'bg-gray-50 border-gray-200 text-gray-700'
                            }`}
                          >
                            {sz} мм
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. Divider specific properties */}
                {selectedElement.type === 'divider' && (
                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    <div>
                      <label className="text-[11px] font-bold text-[#64748B]">Ориентация</label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <button
                          onClick={() => updateElement(selectedElement.id, { orientation: 'horizontal' })}
                          className={`p-2 rounded-lg text-xs font-bold border cursor-pointer ${
                            selectedElement.orientation === 'horizontal' ? 'bg-[#0082FB] text-white border-[#0082FB]' : 'bg-gray-50 border-gray-200 text-gray-700'
                          }`}
                        >
                          Горизонтальная
                        </button>
                        <button
                          onClick={() => updateElement(selectedElement.id, { orientation: 'vertical' })}
                          className={`p-2 rounded-lg text-xs font-bold border cursor-pointer ${
                            selectedElement.orientation === 'vertical' ? 'bg-[#0082FB] text-white border-[#0082FB]' : 'bg-gray-50 border-gray-200 text-gray-700'
                          }`}
                        >
                          Вертикальная
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-[#64748B]">Длина (мм)</label>
                        <span className="text-xs font-mono font-bold text-[#111827]">
                          {selectedElement.length} мм
                        </span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max={Math.max(widthMm, heightMm)}
                        step="1"
                        value={selectedElement.length}
                        onChange={(e) => updateElement(selectedElement.id, { length: Number(e.target.value) })}
                        className="w-full mt-1 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-[#64748B]">Толщина линии (мм)</label>
                        <span className="text-xs font-mono font-bold text-[#111827]">
                          {selectedElement.thickness || 0.3} мм
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="2"
                        step="0.1"
                        value={selectedElement.thickness || 0.3}
                        onChange={(e) => updateElement(selectedElement.id, { thickness: Number(e.target.value) })}
                        className="w-full mt-1 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="text-center py-8 text-xs text-[#94A3B8]">
                Выберите элемент на макете для настройки параметров.
              </div>
            )}
          </div>

          {/* Quick Help Card */}
          <div className="bg-[#F8FAFC] border border-gray-200 rounded-2xl p-4 text-xs space-y-2">
            <h4 className="font-extrabold text-[#111827] flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-[#0082FB]" />
              Подсказка для печати:
            </h4>
            <p className="text-[#64748B] leading-relaxed">
              Сгенерированный PDF сформирован точно в размерах этикетки (например, 30×20 или 58×40 мм). При отправке на принтер Zebra / TSC выберите в диалоге печати масштаб <strong>«Реальный размер / 100%»</strong> без полей.
            </p>
          </div>
        </div>
      </div>

      {/* Save Template to Database Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-6 max-w-md w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-[#111827] flex items-center gap-2">
                <Save className="w-5 h-5 text-emerald-600" />
                Сохранить шаблон в БД
              </h3>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Шаблон сохранится в PostgreSQL: размеры, разделители, положение DataMatrix и текстовые поля из CSV будут доступны в любой момент.
            </p>

            <div>
              <label className="text-xs font-extrabold text-[#111827] uppercase tracking-wider block mb-1.5">
                Название шаблона
              </label>
              <input
                type="text"
                required
                value={saveTemplateName}
                onChange={(e) => setSaveTemplateName(e.target.value)}
                placeholder="Например: WB Ювелирка 30x20"
                className="w-full text-xs font-bold border border-gray-300 rounded-xl p-3 focus:border-[#0082FB] focus:outline-none bg-gray-50"
                autoFocus
              />
            </div>

            <div className="bg-[#F8FAFC] border border-gray-200 rounded-xl p-3 text-xs space-y-1 font-mono text-gray-700">
              <div className="flex justify-between">
                <span>Размер:</span>
                <span className="font-bold">{widthMm} × {heightMm} мм</span>
              </div>
              <div className="flex justify-between">
                <span>Элементов на холсте:</span>
                <span className="font-bold">{elements.length} шт.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmSaveTemplate}
                disabled={savingTemplate || !saveTemplateName.trim()}
                className="px-5 py-2.5 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {savingTemplate ? 'Сохранение...' : 'Сохранить шаблон'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
