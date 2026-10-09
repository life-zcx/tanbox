import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Upload,
  AlertCircle,
  CheckCircle2,
  Boxes,
  PackageOpen,
  FileDown,
  FileCheck2,
  FileX2,
  FileEdit,
  CheckCircle,
  RotateCcw,
} from 'lucide-react';
import { MarkirovkaOpChoice } from './MarkirovkaOperationsButton';
import { apiClient } from '../../api/client';
import { useNCALayer } from '../../hooks/useNCALayer';

interface OperationModalProps {
  operationType: MarkirovkaOpChoice | null;
  accounts: any[];
  selectedAccountId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function generateValidSscc18(companyPrefix = '0487000'): string {
  const ext = '0';
  const prefix = companyPrefix.replace(/\D/g, '').slice(0, 7).padStart(7, '0');
  const serial = Date.now().toString().slice(-9);
  const base17 = `${ext}${prefix}${serial}`.slice(0, 17);

  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const weight = i % 2 === 0 ? 3 : 1;
    sum += parseInt(base17[i], 10) * weight;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return `00${base17}${checkDigit}`;
}

export function normalizeSscc18(input?: string): string {
  if (!input || !input.trim()) return generateValidSscc18();
  let clean = input.replace(/\D/g, '').trim();

  // If already 20 digits starting with 00:
  if (clean.length === 20 && clean.startsWith('00')) {
    const payload17 = clean.slice(2, 19);
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      const weight = i % 2 === 0 ? 3 : 1;
      sum += parseInt(payload17[i], 10) * weight;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return `00${payload17}${checkDigit}`;
  }

  // If 18 digits (payload without AI 00):
  if (clean.length === 18) {
    const payload17 = clean.slice(0, 17);
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      const weight = i % 2 === 0 ? 3 : 1;
      sum += parseInt(payload17[i], 10) * weight;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return `00${payload17}${checkDigit}`;
  }

  // If other length >= 17:
  if (clean.length >= 17) {
    const payload17 = clean.replace(/^00/, '').slice(0, 17).padEnd(17, '0');
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      const weight = i % 2 === 0 ? 3 : 1;
      sum += parseInt(payload17[i], 10) * weight;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return `00${payload17}${checkDigit}`;
  }

  return generateValidSscc18();
}

export function extractIdentificationCode(raw?: string): string {
  if (!raw) return '';
  let code = raw.trim();

  // Удаляем невидимые символы (BOM, zero-width space и т.д.)
  code = code.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();

  // Если это транспортный код SSCC:
  if (code.startsWith('00') && /^\d{18,20}$/.test(code)) {
    return normalizeSscc18(code);
  }
  if (/^\d{18}$/.test(code)) {
    return normalizeSscc18(code);
  }

  // 1. Если присутствует символ-разделитель GS (\x1d, \u001d или текстовое обозначение <GS>)
  const gsIndex = code.search(/[\x1d\u001d]|<GS>/i);
  if (gsIndex !== -1) {
    code = code.slice(0, gsIndex).trim();
  }

  // 2. Стандартный DataMatrix формата GS1: 01 + 14 цифр GTIN + 21 + серийный номер
  const match0121 = code.match(/^01(\d{14})21(.+)$/);
  if (match0121) {
    const gtin = match0121[1];
    const serialAndTail = match0121[2];

    // Если разделитель GS был потерян при копировании через буфер обмена:
    // Криптохвост начинается с идентификатора применения 91 (4 символа ключа проверки) и 92 (подпись)
    const cryptoMatch = serialAndTail.match(/^(.*?)(?:91[^\s]{4}92.+|91[a-zA-Z0-9+/=]{4}92.*)$/);
    if (cryptoMatch && cryptoMatch[1] && cryptoMatch[1].length >= 6) {
      return `01${gtin}21${cryptoMatch[1]}`;
    }

    // Если серийный номер стандартной длины 13 символов (для обуви, одежды и т.д. в ИС МПТ КЗ)
    // и после 13-го символа идет '91':
    if (serialAndTail.length >= 15 && serialAndTail.slice(13, 15) === '91') {
      return `01${gtin}21${serialAndTail.slice(0, 13)}`;
    }

    // Если длина полного кода более 70 символов (полный код с криптоподписью 85+ символов)
    if (code.length >= 70 && serialAndTail.length >= 13) {
      return `01${gtin}21${serialAndTail.slice(0, 13)}`;
    }
  }

  return code;
}

export const OperationModal: React.FC<OperationModalProps> = ({
  operationType,
  accounts,
  selectedAccountId,
  onClose,
  onSuccess,
}) => {
  const { isRunning: isNcaRunning, checkStatus, sign } = useNCALayer();

  const [accountId, setAccountId] = useState<string>(selectedAccountId || '');

  useEffect(() => {
    if (selectedAccountId && accounts.some((a) => a.id === selectedAccountId)) {
      setAccountId(selectedAccountId);
    } else if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [selectedAccountId, accounts]);
  const [category, setCategory] = useState<string>('SHOES');
  const [codesText, setCodesText] = useState<string>('');
  const [sscc, setSscc] = useState<string>('');
  const [unitType, setUnitType] = useState<string>('BOX');
  const [importType, setImportType] = useState<string>('THIRD_COUNTRIES');
  const [exportCountry, setExportCountry] = useState<string>('CN');
  const [declarationNumber, setDeclarationNumber] = useState<string>('');
  const [declarationDate, setDeclarationDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [retirementReason, setRetirementReason] = useState<string>('DAMAGE');
  const [returnReason, setReturnReason] = useState<string>('RETAIL_RETURN');
  const [correctionDoc, setCorrectionDoc] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [storageType, setStorageType] = useState<string>('PKCS12');
  const [signingStatus, setSigningStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationResults, setValidationResults] = useState<any[] | null>(null);

  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      const active = accounts.find((a) => a.status === 'ACTIVE') || accounts[0];
      setAccountId(active.id);
    }
  }, [accounts, accountId]);

  if (!operationType) return null;

  const requiresEds = ['IMPORT_NOTIFICATION', 'RETIREMENT', 'CORRECTION'].includes(operationType);

  const getTitleAndIcon = () => {
    switch (operationType) {
      case 'IMPORT_NOTIFICATION':
        return { title: 'Уведомление о ввозе товаров (Импорт)', icon: FileDown };
      case 'UTILISATION':
        return { title: 'Нанесение КМ (Отчет о нанесении)', icon: FileCheck2 };
      case 'AGGREGATION':
        return { title: 'Агрегация КМ (Короб / Паллета SSCC)', icon: Boxes };
      case 'RETIREMENT':
        return { title: 'Уведомление о выводе товара из оборота', icon: FileX2 };
      case 'VALIDATION':
        return { title: 'Валидация и проверка статуса КМ', icon: CheckCircle };
      case 'CORRECTION':
        return { title: 'Корректировка сведений о КМ', icon: FileEdit };
      case 'DISAGGREGATION':
        return { title: 'Дезагрегация (Расформирование упаковки)', icon: PackageOpen };
      case 'RETURN_TO_TURNOVER':
        return { title: 'Возврат товара в оборот (РК)', icon: RotateCcw };
    }
  };

  const { title, icon: Icon } = getTitleAndIcon();

  const [authorizingTrueApi, setAuthorizingTrueApi] = useState(false);
  const [trueApiAuthed, setTrueApiAuthed] = useState(false);

  const handleAuthorizeTrueApi = async () => {
    try {
      setAuthorizingTrueApi(true);
      setError(null);
      setSigningStatus('Получение проверочного ключа от ИС МПТ (True-API)...');
      const challengeRes = await apiClient.get(`/markirovka/operations/auth-challenge?accountId=${accountId}`);
      const { uuid, data } = challengeRes.data;

      setSigningStatus('Выберите ключ ЭЦП в окне NCALayer для авторизации сессии в ИС МПТ...');
      const signRes = await sign(data, storageType, 'SIGNATURE', true);
      if (!signRes.success || !signRes.signature) {
        throw new Error(signRes.error || 'Подписание авторизационного ключа отменено');
      }

      setSigningStatus('Авторизация сессии в True-API...');
      await apiClient.post('/markirovka/operations/auth-simple', {
        accountId,
        uuid,
        signature: signRes.signature.trim().replace(/[\r\n]/g, ''),
      });

      setTrueApiAuthed(true);
      setSigningStatus(null);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Ошибка авторизации True-API');
    } finally {
      setAuthorizingTrueApi(false);
      setSigningStatus(null);
    }
  };

  const parseCodes = () => {
    return codesText
      .split('\n')
      .map((c) => extractIdentificationCode(c.trim()))
      .filter((c) => c.length > 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationResults(null);
    const codes = parseCodes();

    if (operationType !== 'DISAGGREGATION' && codes.length === 0) {
      setError('Пожалуйста, введите или загрузите хотя бы один код маркировки.');
      return;
    }

    if (operationType === 'DISAGGREGATION' && !sscc.trim()) {
      setError('Укажите код агрегата (SSCC) для расформирования.');
      return;
    }

    try {
      setLoading(true);
      let signature: string | undefined = undefined;
      let docPayload = '';

      // EDS Signing step if required
      if (requiresEds) {
        setSigningStatus('Подготовка документа по спецификации xTrace ICOM...');
        if (operationType === 'IMPORT_NOTIFICATION') {
          const formattedDate = declarationDate
            ? (declarationDate.includes('T') ? declarationDate : `${declarationDate}T00:00:00.000Z`)
            : new Date().toISOString();
          const sortedDoc = {
            businessPlaceId: 44,
            codes,
            customsDeclaration: {
              date: formattedDate,
              number: declarationNumber,
            },
            exportCountry: (exportCountry || 'CN').trim().toUpperCase(),
          };
          docPayload = JSON.stringify(sortedDoc);
        } else if (operationType === 'AGGREGATION') {
          const targetSscc = sscc?.trim() ? normalizeSscc18(sscc) : generateValidSscc18();
          const sortedDoc = {
            aggregationUnits: [
              {
                aggregationItemsCount: codes.length,
                aggregationUnitCapacity: codes.length,
                codes,
                shouldBeUnbundled: true,
                unitSerialNumber: targetSscc,
              },
            ],
            businessPlaceId: 44,
            documentDate: new Date().toISOString(),
          };
          docPayload = JSON.stringify(sortedDoc);
        } else if (operationType === 'RETIREMENT') {
          const sortedDoc = {
            businessPlaceId: 44,
            childrenWriteOff: false,
            codes: codes.map((c) => ({ code: c })),
            primaryDocument: {
              date: declarationDate || new Date().toISOString().slice(0, 10),
              number: declarationNumber || 'DOC-001',
              type: '',
            },
            withdrawPartialQuantity: false,
            withdrawalDate: new Date().toISOString(),
            withdrawalReason: retirementReason || 'OTHER',
            withdrawalType: retirementReason === 'DAMAGE' ? 'WRITE_OFF' : 'WITHDRAWAL',
          };
          docPayload = JSON.stringify(sortedDoc);
        } else if (operationType === 'CORRECTION') {
          const sortedDoc = {
            businessDatetime: new Date().toISOString(),
            codes,
            updatedFields: {},
          };
          docPayload = JSON.stringify(sortedDoc);
        } else {
          docPayload = JSON.stringify({
            codes,
            date: new Date().toISOString(),
          });
        }

        setSigningStatus('Выберите ключ ЭЦП в окне NCALayer...');
        const signResult = await sign(docPayload, storageType, 'SIGNATURE', false);
        if (!signResult.success || !signResult.signature) {
          throw new Error(signResult.error || 'Ошибка подписания в NCALayer');
        }
        signature = signResult.signature.trim().replace(/[\r\n]/g, '');
        setSigningStatus('Отправка подписанного документа в ИС МПТ...');
      }

      // API calls
      if (operationType === 'VALIDATION') {
        const res = await apiClient.post('/markirovka/operations/validate', {
          accountId,
          codes,
        });
        setValidationResults(res.data.results || []);
        onSuccess();
        onClose();
        return;
      }

      if (operationType === 'UTILISATION') {
        await apiClient.post('/markirovka/operations/utilisation', {
          accountId,
          category,
          codes,
        });
      } else if (operationType === 'AGGREGATION') {
        const targetSscc = sscc?.trim() ? normalizeSscc18(sscc) : generateValidSscc18();
        await apiClient.post('/markirovka/operations/aggregation', {
          accountId,
          category,
          sscc: targetSscc,
          unitType,
          codes,
          rawDocString: docPayload,
          signature,
        });
      } else if (operationType === 'DISAGGREGATION') {
        const targetSscc = normalizeSscc18(sscc);
        await apiClient.post('/markirovka/operations/disaggregation', {
          accountId,
          sscc: targetSscc,
        });
      } else if (operationType === 'IMPORT_NOTIFICATION') {
        await apiClient.post('/markirovka/operations/import-notification', {
          accountId,
          importType,
          exportCountry: (exportCountry || 'CN').trim().toUpperCase(),
          declarationNumber,
          declarationDate,
          category,
          codes,
          rawDocString: docPayload,
          signature,
        });
      } else if (operationType === 'RETIREMENT') {
        await apiClient.post('/markirovka/operations/retirement', {
          accountId,
          reason: retirementReason,
          documentNumber: declarationNumber,
          documentDate: declarationDate,
          codes,
          rawDocString: docPayload,
          signature,
        });
      } else if (operationType === 'CORRECTION') {
        await apiClient.post('/markirovka/operations/correction', {
          accountId,
          targetDocNumber: correctionDoc,
          notes,
          codes,
          rawDocString: docPayload,
          signature,
        });
      } else if (operationType === 'RETURN_TO_TURNOVER') {
        await apiClient.post('/markirovka/operations/return-to-turnover', {
          accountId,
          returnReason,
          documentNumber: declarationNumber || 'DOC-001',
          documentDate: declarationDate,
          codes,
          rawDocString: docPayload,
          signature,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Ошибка выполнения операции');
    } finally {
      setLoading(false);
      setSigningStatus(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = String(event.target?.result || '');
      setCodesText((prev) => (prev ? `${prev}\n${text}` : text));
    };
    reader.readAsText(file);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-2xl w-full p-5 sm:p-6 space-y-4 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200/80 text-gray-700 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-gray-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{title}</h3>
              <p className="text-[11px] text-gray-500">
                {requiresEds ? 'Подписание документа через NCALayer' : 'Операция через СУЗ / ИС МПТ'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5 overflow-y-auto pr-1 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Account Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Подключенный аккаунт ИС МПТ
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 text-gray-800"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.login}) — {acc.environment === 'TEST' ? 'Тестовый стенд' : 'ПРОМ'}
                </option>
              ))}
            </select>
          </div>

          {/* Operation Specific Fields */}
          {operationType === 'IMPORT_NOTIFICATION' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Тип импорта</label>
                <select
                  value={importType}
                  onChange={(e) => setImportType(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                >
                  <option value="THIRD_COUNTRIES">Третьи страны (по ГТД)</option>
                  <option value="EEU">Страны ЕАЭС (ввоз до границы)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Товарная группа</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                >
                  <option value="SHOES">Обувные товары</option>
                  <option value="TEXTILE">Товары легпрома / текстиль</option>
                  <option value="MEDICINE">Лекарственные средства</option>
                  <option value="WATER">Упакованная вода</option>
                  <option value="OILS">Моторные масла</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Номер декларации / накладной</label>
                <input
                  type="text"
                  placeholder="50208/120926/0012345"
                  value={declarationNumber}
                  onChange={(e) => setDeclarationNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Дата документа</label>
                <input
                  type="date"
                  value={declarationDate}
                  onChange={(e) => setDeclarationDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Страна экспорта (Код ISO-2)</label>
                <input
                  type="text"
                  placeholder="CN"
                  maxLength={2}
                  value={exportCountry}
                  onChange={(e) => setExportCountry(e.target.value.toUpperCase())}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg uppercase"
                  required
                />
              </div>
            </div>
          )}

          {operationType === 'AGGREGATION' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Тип упаковки</label>
                <select
                  value={unitType}
                  onChange={(e) => setUnitType(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                >
                  <option value="BOX">Короб (Групповая тара)</option>
                  <option value="PALLET">Паллета (Транспортная тара)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Код SSCC (пусто = автогенерация)</label>
                <input
                  type="text"
                  placeholder="001487000123456789"
                  value={sscc}
                  onChange={(e) => setSscc(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg font-mono"
                />
              </div>
            </div>
          )}

          {operationType === 'DISAGGREGATION' && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Код SSCC упаковки для расформирования
              </label>
              <input
                type="text"
                placeholder="001487000123456789"
                value={sscc}
                onChange={(e) => setSscc(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg font-mono"
                required
              />
            </div>
          )}

          {operationType === 'RETIREMENT' && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Причина вывода из оборота</label>
                <select
                  value={retirementReason}
                  onChange={(e) => setRetirementReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                >
                  <option value="DAMAGE">Брак / Порча продукции</option>
                  <option value="OWN_USE">Использование для собственных нужд</option>
                  <option value="LOSS">Утрата / Недостача / Кража</option>
                  <option value="EXPORT">Экспорт за пределы РК</option>
                  <option value="RETAIL_NO_KKM">Розничная реализация без кассового аппарата ОФД</option>
                </select>
              </div>
            </div>
          )}

          {operationType === 'CORRECTION' && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Номер исходного документа</label>
                <input
                  type="text"
                  placeholder="IMP-123456 или УТ-0001"
                  value={correctionDoc}
                  onChange={(e) => setCorrectionDoc(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Примечание / причина корректировки</label>
                <input
                  type="text"
                  placeholder="Уточнение реквизитов партии"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          )}

          {operationType === 'RETURN_TO_TURNOVER' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Причина возврата в оборот</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                >
                  <option value="RETAIL_RETURN">Возврат при розничной реализации</option>
                  <option value="RECEIPT_RETURN">Возврат по кассовому чеку</option>
                  <option value="GOODS_RETURN">Возврат товара</option>
                  <option value="SURPLUS_RETURN">Обнаружение излишков</option>
                  <option value="PRODUCTION_USE_RETURN">Возврат из производственных целей</option>
                  <option value="OWN_USE_RETURN">Возврат из собственных нужд</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Номер документа / чека</label>
                <input
                  type="text"
                  placeholder="ЧЕК-001 или Приказ №5"
                  value={declarationNumber}
                  onChange={(e) => setDeclarationNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Дата документа</label>
                <input
                  type="date"
                  value={declarationDate}
                  onChange={(e) => setDeclarationDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Codes Textarea */}
          {operationType !== 'DISAGGREGATION' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-700">
                  Коды маркировки DataMatrix (по одному на строку)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-500">
                    Строк: <strong>{parseCodes().length}</strong>
                  </span>
                  <label className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 cursor-pointer font-medium">
                    <Upload className="w-3 h-3" />
                    Загрузить файл
                    <input type="file" accept=".txt,.csv" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <textarea
                rows={5}
                value={codesText}
                onChange={(e) => setCodesText(e.target.value)}
                placeholder="010505510743361421...&#10;010505510743361421..."
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
              />
            </div>
          )}

          {/* Validation Results */}
          {validationResults && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Результат валидации ({validationResults.length} шт.):</span>
              </div>
              <div className="max-h-36 overflow-y-auto divide-y divide-gray-200 text-[11px]">
                {validationResults.map((r, idx) => (
                  <div key={idx} className="py-1 flex items-center justify-between font-mono">
                    <span className="truncate max-w-xs">{r.code}</span>
                    <span className={r.isValid ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}>
                      {r.statusLabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NCALayer Section if EDS required */}
          {requiresEds && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-gray-700">
                  Носитель ключа ЭЦП:
                </label>
                <select
                  value={storageType}
                  onChange={(e) => setStorageType(e.target.value)}
                  className="px-2 py-1 text-xs bg-white border border-gray-300 rounded text-gray-800 font-medium"
                >
                  <option value="PKCS12">Файл (.p12 / PKCS12)</option>
                  <option value="KAZTOKEN">Kaztoken</option>
                  <option value="ETOKEN">eToken</option>
                  <option value="KZIDCARD">Удостоверение личности</option>
                </select>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-200/70">
                <div className="flex items-center gap-1.5">
                  {isNcaRunning ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-gray-700">NCALayer обнаружен</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-amber-800">NCALayer не запущен</span>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => checkStatus()}
                  className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                >
                  Проверить связь
                </button>
              </div>

              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-gray-200/70">
                <span className="text-[11px] text-gray-500">
                  Шлюз: <strong>xTrace ICOM REST API</strong>
                </span>
                <span className="text-[11px] text-emerald-700 font-medium">
                  {accounts.find((a) => a.id === accountId)?.environment === 'PROD' ? 'prod.markirovka.kz' : 'test.markirovka.kz'}
                </span>
              </div>
            </div>
          )}

          {signingStatus && (
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>{signingStatus}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              Отмена
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0082FB] hover:bg-[#0072de] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {requiresEds ? <KeyRound className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>
                {loading
                  ? 'Обработка...'
                  : requiresEds
                  ? 'Подписать через ЭЦП и отправить'
                  : 'Отправить в ИС МПТ'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
