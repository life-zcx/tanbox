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
import { useModalBehavior } from '@shared';

interface OperationModalProps {
  operationType: MarkirovkaOpChoice | null;
  accounts: any[];
  selectedAccountId?: string;
  initialCodes?: string[];
  initialCategory?: string;
  orderId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const MARKIROVKA_COUNTRIES = [
  // Популярные направления импорта в Казахстан
  { code: 'CN', name: 'Китай (CN)' },
  { code: 'TR', name: 'Турция (TR)' },
  { code: 'UZ', name: 'Узбекистан (UZ)' },
  { code: 'RU', name: 'Россия (RU)' },
  { code: 'BY', name: 'Беларусь (BY)' },
  { code: 'KG', name: 'Кыргызстан (KG)' },
  { code: 'DE', name: 'Германия (DE)' },
  { code: 'IT', name: 'Италия (IT)' },
  { code: 'PL', name: 'Польша (PL)' },
  { code: 'VN', name: 'Вьетнам (VN)' },
  { code: 'KR', name: 'Южная Корея (KR)' },
  { code: 'IN', name: 'Индия (IN)' },
  { code: 'AE', name: 'ОАЭ (AE)' },
  { code: 'US', name: 'США (US)' },
  { code: 'AM', name: 'Армения (AM)' },
  { code: 'GE', name: 'Грузия (GE)' },
  { code: 'AZ', name: 'Азербайджан (AZ)' },
  { code: 'TJ', name: 'Таджикистан (TJ)' },
  { code: 'TM', name: 'Туркменистан (TM)' },
  { code: 'PK', name: 'Пакистан (PK)' },
  { code: 'BD', name: 'Бангладеш (BD)' },
  { code: 'TH', name: 'Таиланд (TH)' },
  { code: 'ID', name: 'Индонезия (ID)' },
  { code: 'MY', name: 'Малайзия (MY)' },
  { code: 'JP', name: 'Япония (JP)' },
  { code: 'GB', name: 'Великобритания (GB)' },
  { code: 'FR', name: 'Франция (FR)' },
  { code: 'ES', name: 'Испания (ES)' },
  { code: 'NL', name: 'Нидерланды (NL)' },
  { code: 'BE', name: 'Бельгия (BE)' },
  { code: 'AT', name: 'Австрия (AT)' },
  { code: 'CH', name: 'Швейцария (CH)' },
  { code: 'SE', name: 'Швеция (SE)' },
  { code: 'FI', name: 'Финляндия (FI)' },
  { code: 'CZ', name: 'Чехия (CZ)' },
  { code: 'HU', name: 'Венгрия (HU)' },
  { code: 'RO', name: 'Румыния (RO)' },
  { code: 'BG', name: 'Болгария (BG)' },
  { code: 'GR', name: 'Греция (GR)' },
  { code: 'PT', name: 'Португалия (PT)' },
  { code: 'LT', name: 'Литва (LT)' },
  { code: 'LV', name: 'Латвия (LV)' },
  { code: 'EE', name: 'Эстония (EE)' },
  { code: 'RS', name: 'Сербия (RS)' },
  { code: 'IL', name: 'Израиль (IL)' },
  { code: 'IR', name: 'Иран (IR)' },
  { code: 'EG', name: 'Египет (EG)' },
  { code: 'BR', name: 'Бразилия (BR)' },
  { code: 'MX', name: 'Мексика (MX)' },
  { code: 'CA', name: 'Канада (CA)' },
  { code: 'AU', name: 'Австралия (AU)' },
  { code: 'KZ', name: 'Казахстан (KZ)' },
  // Остальные страны мира
  { code: 'AL', name: 'Албания (AL)' },
  { code: 'DZ', name: 'Алжир (DZ)' },
  { code: 'AO', name: 'Ангола (AO)' },
  { code: 'AR', name: 'Аргентина (AR)' },
  { code: 'AF', name: 'Афганистан (AF)' },
  { code: 'BA', name: 'Босния и Герцеговина (BA)' },
  { code: 'CL', name: 'Чили (CL)' },
  { code: 'CO', name: 'Колумбия (CO)' },
  { code: 'CY', name: 'Кипр (CY)' },
  { code: 'DK', name: 'Дания (DK)' },
  { code: 'IE', name: 'Ирландия (IE)' },
  { code: 'IS', name: 'Исландия (IS)' },
  { code: 'JO', name: 'Иордания (JO)' },
  { code: 'KW', name: 'Кувейт (KW)' },
  { code: 'LB', name: 'Ливан (LB)' },
  { code: 'LU', name: 'Люксембург (LU)' },
  { code: 'MA', name: 'Марокко (MA)' },
  { code: 'MD', name: 'Молдова (MD)' },
  { code: 'MN', name: 'Монголия (MN)' },
  { code: 'ME', name: 'Черногория (ME)' },
  { code: 'MK', name: 'Северная Македония (MK)' },
  { code: 'NO', name: 'Норвегия (NO)' },
  { code: 'NZ', name: 'Новая Зеландия (NZ)' },
  { code: 'OM', name: 'Оман (OM)' },
  { code: 'QA', name: 'Катар (QA)' },
  { code: 'SA', name: 'Саудовская Аравия (SA)' },
  { code: 'SG', name: 'Сингапур (SG)' },
  { code: 'SK', name: 'Словакия (SK)' },
  { code: 'SI', name: 'Словения (SI)' },
  { code: 'TW', name: 'Тайвань (TW)' },
  { code: 'ZA', name: 'ЮАР (ZA)' },
];

export const MARKIROVKA_CATEGORIES = [
  { value: 'SHOES', label: 'Обувные товары' },
  { value: 'TEXTILE', label: 'Товары легпрома / текстиль' },
  { value: 'MEDICINE', label: 'Лекарственные средства' },
  { value: 'WATER', label: 'Упакованная вода' },
  { value: 'OILS', label: 'Моторные масла' },
  { value: 'TOBACCO', label: 'Табачная продукция' },
  { value: 'BEER', label: 'Пиво и слабоалкогольные напитки' },
  { value: 'DIETARY_SUPPLEMENTS', label: 'Биологически активные добавки (БАД)' },
];

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

  code = code.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();

  if (code.startsWith('00') && /^\d{18,20}$/.test(code)) {
    return normalizeSscc18(code);
  }
  if (/^\d{18}$/.test(code)) {
    return normalizeSscc18(code);
  }

  const gsIndex = code.search(/[\x1d\u001d]|<GS>/i);
  if (gsIndex !== -1) {
    code = code.slice(0, gsIndex).trim();
  }

  const match0121 = code.match(/^01(\d{14})21(.+)$/);
  if (match0121) {
    const gtin = match0121[1];
    const serialAndTail = match0121[2];

    const cryptoMatch = serialAndTail.match(/^(.*?)(?:91[^\s]{4}92.+|91[a-zA-Z0-9+/=]{4}92.*)$/);
    if (cryptoMatch && cryptoMatch[1] && cryptoMatch[1].length >= 6) {
      return `01${gtin}21${cryptoMatch[1]}`;
    }

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
  initialCodes,
  initialCategory,
  orderId,
  onClose,
  onSuccess,
}) => {
  const { backdropProps, dialogProps } = useModalBehavior({ onClose, isOpen: Boolean(operationType) });
  const { isRunning: isNcaRunning, checkStatus, sign } = useNCALayer();

  const [accountId, setAccountId] = useState<string>(selectedAccountId || '');

  useEffect(() => {
    if (selectedAccountId && accounts.some((a) => a.id === selectedAccountId)) {
      setAccountId(selectedAccountId);
    } else if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [selectedAccountId, accounts]);

  const [category, setCategory] = useState<string>(initialCategory || '');
  const [codesText, setCodesText] = useState<string>(initialCodes?.join('\n') || '');
  const [sscc, setSscc] = useState<string>('');
  const [unitType, setUnitType] = useState<string>('');
  const [importType, setImportType] = useState<string>('');
  const [exportCountry, setExportCountry] = useState<string>('');
  const [declarationNumber, setDeclarationNumber] = useState<string>('');
  const [declarationDate, setDeclarationDate] = useState<string>('');

  // EEU fields
  const [eeuCountry, setEeuCountry] = useState<string>('');
  const [fnoNumber, setFnoNumber] = useState<string>('');
  const [fnoDate, setFnoDate] = useState<string>('');
  const [primaryDocNumber, setPrimaryDocNumber] = useState<string>('');
  const [primaryDocDate, setPrimaryDocDate] = useState<string>('');

  // PRODUCTION fields
  const [certType, setCertType] = useState<string>('');
  const [certNumber, setCertNumber] = useState<string>('');
  const [certDate, setCertDate] = useState<string>('');
  const [prodActNumber, setProdActNumber] = useState<string>('');
  const [prodActDate, setProdActDate] = useState<string>('');

  // CONTRACT_MANUFACTURING fields
  const [producerBin, setProducerBin] = useState<string>('');
  const [contractNumber, setContractNumber] = useState<string>('');

  // UTILISATION (Отчет о нанесении) fields
  const [productionDate, setProductionDate] = useState<string>('');
  const [hasExpiration, setHasExpiration] = useState<boolean>(false);
  const [expirationDate, setExpirationDate] = useState<string>('');
  const [releaseType, setReleaseType] = useState<string>('');

  const [retirementReason, setRetirementReason] = useState<string>('');
  const [returnReason, setReturnReason] = useState<string>('');
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

  useEffect(() => {
    if (initialCodes && initialCodes.length > 0) {
      setCodesText(initialCodes.join('\n'));
    }
  }, [initialCodes]);

  useEffect(() => {
    if (initialCategory) {
      setCategory(initialCategory);
    }
  }, [initialCategory]);

  if (!operationType) return null;

  const requiresEds = ['IMPORT_NOTIFICATION'].includes(operationType);

  const getTitleAndIcon = () => {
    switch (operationType) {
      case 'IMPORT_NOTIFICATION':
        return { title: 'Уведомление о ввозе товаров (Импорт)', icon: FileDown };
      case 'UTILISATION':
        return { title: 'Нанесение КМ (Отчет об использовании)', icon: FileCheck2 };
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

  const parseCodes = () => {
    return codesText
      .split('\n')
      .map((c) => {
        const trimmed = c.trim();
        // В СУЗ ИС МПТ для отчета о нанесении обязателен полный код с криптохвостом
        if (operationType === 'UTILISATION') {
          return trimmed;
        }
        return extractIdentificationCode(trimmed);
      })
      .filter((c) => c.length > 0);
  };

  const getValidationError = (): string | null => {
    const codes = parseCodes();
    if (operationType !== 'DISAGGREGATION' && codes.length === 0) {
      return 'Пожалуйста, введите или загрузите хотя бы один код маркировки.';
    }
    if (!accountId) {
      return 'Выберите подключенный аккаунт ИС МПТ.';
    }
    if (operationType !== 'DISAGGREGATION' && operationType !== 'CORRECTION' && !category) {
      return 'Выберите товарную группу.';
    }

    if (operationType === 'IMPORT_NOTIFICATION') {
      if (!importType) return 'Выберите способ ввода в оборот.';
      if (importType === 'THIRD_COUNTRIES') {
        if (!exportCountry) return 'Выберите страну экспорта (Код ISO-2).';
        if (!declarationNumber.trim()) return 'Укажите номер декларации на товары (ГТД).';
        if (!declarationDate) return 'Укажите дату декларации на товары.';
      } else if (importType === 'EEU') {
        if (!eeuCountry) return 'Выберите страну-экспортера из ЕАЭС.';
        if (!fnoNumber.trim()) return 'Укажите номер заявления о ввозе (ФНО 328.00).';
        if (!fnoDate) return 'Укажите дату заявления ФНО 328.00.';
        if (!primaryDocNumber.trim()) return 'Укажите номер первичного документа (CMR / ТТН).';
        if (!primaryDocDate) return 'Укажите дату первичного документа (CMR / ТТН).';
      } else if (importType === 'PRODUCTION') {
        if (!certType) return 'Выберите тип документа соответствия.';
        if (certType !== 'NONE') {
          if (!certNumber.trim()) return 'Укажите номер документа соответствия.';
          if (!certDate) return 'Укажите дату документа соответствия.';
        }
        if (!prodActNumber.trim()) return 'Укажите номер акта выпуска продукции.';
        if (!prodActDate) return 'Укажите дату акта выпуска продукции.';
      } else if (importType === 'CONTRACT_MANUFACTURING') {
        if (!producerBin.trim()) return 'Укажите БИН контрактного завода в РК.';
        if (!contractNumber.trim()) return 'Укажите номер договора контрактного производства.';
        if (!certType) return 'Выберите тип документа соответствия.';
        if (certType !== 'NONE') {
          if (!certNumber.trim()) return 'Укажите номер документа соответствия.';
          if (!certDate) return 'Укажите дату документа соответствия.';
        }
        if (!prodActNumber.trim()) return 'Укажите номер акта приема-передачи партии.';
        if (!prodActDate) return 'Укажите дату акта приема-передачи.';
      }
    }

    if (operationType === 'UTILISATION') {
      if (!releaseType) return 'Выберите тип выпуска продукции.';
      if (!productionDate) return 'Укажите дату производства продукции.';
      if (hasExpiration && !expirationDate) return 'Укажите срок годности продукции.';
      if (hasExpiration && expirationDate && productionDate && expirationDate < productionDate) {
        return 'Срок годности не может быть раньше даты производства.';
      }
    }

    if (operationType === 'AGGREGATION') {
      if (!unitType) return 'Выберите тип упаковки (Короб / Паллета).';
    }

    if (operationType === 'DISAGGREGATION') {
      if (!sscc.trim()) return 'Укажите код агрегата (SSCC) для расформирования.';
    }

    if (operationType === 'RETIREMENT') {
      if (!retirementReason) return 'Выберите причину вывода из оборота.';
      if (!declarationNumber.trim()) return 'Укажите номер первичного документа списания / акта.';
      if (!declarationDate) return 'Укажите дату документа списания.';
    }

    if (operationType === 'RETURN_TO_TURNOVER') {
      if (!returnReason) return 'Выберите причину возврата в оборот.';
      if (!declarationNumber.trim()) return 'Укажите номер документа / чека возврата.';
      if (!declarationDate) return 'Укажите дату документа возврата.';
    }

    if (operationType === 'CORRECTION') {
      if (!correctionDoc.trim()) return 'Укажите номер исходного документа для корректировки.';
      if (!notes.trim()) return 'Укажите причину корректировки.';
    }

    return null;
  };

  const validationError = getValidationError();
  const isFormValid = !validationError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationResults(null);

    const vErr = getValidationError();
    if (vErr) {
      setError(vErr);
      return;
    }

    const codes = parseCodes();

    try {
      setLoading(true);
      let signature: string | undefined = undefined;
      let docPayload = '';

      // EDS Signing step if required
      if (requiresEds) {
        setSigningStatus('Подготовка документа по спецификации xTrace ICOM...');
        if (operationType === 'IMPORT_NOTIFICATION') {
          let sortedDoc: any;
          if (importType === 'EEU') {
            const formattedDate = fnoDate ? (fnoDate.includes('T') ? fnoDate : `${fnoDate}T00:00:00.000Z`) : new Date().toISOString();
            sortedDoc = {
              businessPlaceId: 44,
              codes,
              exportCountry: eeuCountry || 'RU',
              fnoDeclaration: {
                date: formattedDate,
                number: fnoNumber || declarationNumber || '328001',
              },
              importType: 'EEU',
              primaryDocument: {
                date: primaryDocDate ? `${primaryDocDate}T00:00:00.000Z` : formattedDate,
                number: primaryDocNumber || 'CMR-001',
              },
            };
          } else if (importType === 'PRODUCTION') {
            const formattedDate = prodActDate ? (prodActDate.includes('T') ? prodActDate : `${prodActDate}T00:00:00.000Z`) : new Date().toISOString();
            sortedDoc = {
              businessPlaceId: 44,
              certificateDocument: {
                date: certDate ? `${certDate}T00:00:00.000Z` : formattedDate,
                number: certNumber || 'KZ-CERT-001',
                type: certType,
              },
              codes,
              exportCountry: 'KZ',
              importType: 'PRODUCTION',
              productionDocument: {
                date: formattedDate,
                number: prodActNumber || 'АКТ-001',
              },
            };
          } else if (importType === 'CONTRACT_MANUFACTURING') {
            const formattedDate = prodActDate ? (prodActDate.includes('T') ? prodActDate : `${prodActDate}T00:00:00.000Z`) : new Date().toISOString();
            sortedDoc = {
              businessPlaceId: 44,
              certificateDocument: {
                date: certDate ? `${certDate}T00:00:00.000Z` : formattedDate,
                number: certNumber || 'KZ-CERT-001',
                type: certType,
              },
              codes,
              contractDocument: {
                number: contractNumber || 'ДОГ-001',
              },
              exportCountry: 'KZ',
              importType: 'CONTRACT_MANUFACTURING',
              producerBin: producerBin || '',
              productionDocument: {
                date: formattedDate,
                number: prodActNumber || 'АКТ-001',
              },
            };
          } else {
            // THIRD_COUNTRIES (Default)
            const formattedDate = declarationDate
              ? (declarationDate.includes('T') ? declarationDate : `${declarationDate}T00:00:00.000Z`)
              : new Date().toISOString();
            sortedDoc = {
              businessPlaceId: 44,
              codes,
              customsDeclaration: {
                date: formattedDate,
                number: declarationNumber,
              },
              exportCountry: (exportCountry || 'CN').trim().toUpperCase(),
              importType: 'THIRD_COUNTRIES',
            };
          }
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
          orderId,
          releaseType,
          productionDate: productionDate ? `${productionDate}T00:00:00.000Z` : undefined,
          expirationDate: hasExpiration && expirationDate ? `${expirationDate}T23:59:59.000Z` : undefined,
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
          orderId,
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
          exportCountry: importType === 'EEU' ? eeuCountry : (importType === 'PRODUCTION' ? 'KZ' : (exportCountry || 'CN')),
          declarationNumber: importType === 'EEU' ? (fnoNumber || declarationNumber) : (importType === 'PRODUCTION' ? (certNumber || prodActNumber) : declarationNumber),
          declarationDate: importType === 'EEU' ? fnoDate : (importType === 'PRODUCTION' ? (certDate || prodActDate) : declarationDate),
          eeuCountry,
          fnoNumber,
          fnoDate,
          primaryDocNumber,
          primaryDocDate,
          certType,
          certNumber,
          certDate,
          prodActNumber,
          prodActDate,
          producerBin,
          contractNumber,
          category,
          codes,
          rawDocString: docPayload,
          signature,
          orderId,
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
          orderId,
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
      {...backdropProps}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        {...dialogProps}
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-2xl w-full p-5 sm:p-6 space-y-4 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-[#0082FB] flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-[#0082FB]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{title}</h3>
              <p className="text-[11px] text-gray-500">
                {requiresEds ? 'Подписание документа через NCALayer (ЭЦП)' : 'Операция через СУЗ / ИС МПТ'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5 overflow-y-auto pr-1 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Account Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Подключенный аккаунт ИС МПТ
            </label>
            {accounts.length > 0 ? (
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#0082FB] text-gray-800 font-medium"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.login}) — {acc.environment === 'PROD' ? 'ПРОМ (prod.markirovka.kz)' : 'ТЕСТ (test.markirovka.kz)'}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                ⚠️ У вас пока нет подключенного аккаунта СУЗ / ИС МПТ. Вы можете подключить его в разделе маркировки.
              </div>
            )}
          </div>

          {/* Operation Specific Fields */}
          {operationType === 'IMPORT_NOTIFICATION' && (
            <div className="space-y-3 p-3.5 bg-gray-50 border border-gray-200/80 rounded-xl">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Способ ввода в оборот (ИС МПТ РК) *
                </label>
                <select
                  value={importType}
                  onChange={(e) => setImportType(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs font-semibold bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-[#0082FB]"
                >
                  <option value="">-- Выберите способ ввода в оборот --</option>
                  <option value="THIRD_COUNTRIES">Третьи страны (по ГТД / Декларации на товары)</option>
                  <option value="EEU">Ввоз из стран ЕАЭС (по заявлению ФНО 328.00 / СНТ)</option>
                  <option value="PRODUCTION">Производство в Республике Казахстан (Отечественный производитель)</option>
                  <option value="CONTRACT_MANUFACTURING">Контрактное производство в РК</option>
                </select>
              </div>

              {!importType && (
                <div className="p-2.5 bg-blue-50/60 border border-blue-200/60 rounded-lg text-[11px] text-blue-800">
                  👆 Выберите способ ввода в оборот выше, чтобы заполнить параметры документа.
                </div>
              )}

              {/* Mode 1: Third countries by GTD */}
              {importType === 'THIRD_COUNTRIES' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Товарная группа *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                      required
                    >
                      <option value="">-- Выберите товарную группу --</option>
                      {MARKIROVKA_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Страна экспорта (Код ISO-2) *</label>
                    <select
                      value={exportCountry}
                      onChange={(e) => setExportCountry(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                      required
                    >
                      <option value="">-- Выберите страну экспорта --</option>
                      {MARKIROVKA_COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Номер декларации на товары (ГТД) *</label>
                    <input
                      type="text"
                      placeholder="Например: 50208/120926/0012345"
                      value={declarationNumber}
                      onChange={(e) => setDeclarationNumber(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Дата декларации *</label>
                    <input
                      type="date"
                      value={declarationDate}
                      onChange={(e) => setDeclarationDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Mode 2: EEU Import */}
              {importType === 'EEU' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Товарная группа *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                      required
                    >
                      <option value="">-- Выберите товарную группу --</option>
                      {MARKIROVKA_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Страна отправителя (ЕАЭС) *</label>
                    <select
                      value={eeuCountry}
                      onChange={(e) => setEeuCountry(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                      required
                    >
                      <option value="">-- Выберите страну ЕАЭС --</option>
                      <option value="RU">Россия (RU)</option>
                      <option value="BY">Беларусь (BY)</option>
                      <option value="KG">Кыргызстан (KG)</option>
                      <option value="AM">Армения (AM)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Номер заявления о ввозе (ФНО 328.00) / СНТ *</label>
                    <input
                      type="text"
                      placeholder="Например: 328002026001234"
                      value={fnoNumber}
                      onChange={(e) => setFnoNumber(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Дата заявления ФНО 328 / СНТ *</label>
                    <input
                      type="date"
                      value={fnoDate}
                      onChange={(e) => setFnoDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Номер накладной (CMR / ТТН) *</label>
                    <input
                      type="text"
                      placeholder="Например: CMR-98214"
                      value={primaryDocNumber}
                      onChange={(e) => setPrimaryDocNumber(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Дата CMR / ТТН *</label>
                    <input
                      type="date"
                      value={primaryDocDate}
                      onChange={(e) => setPrimaryDocDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Mode 3: Kazakhstan Production */}
              {importType === 'PRODUCTION' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Товарная группа *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                      required
                    >
                      <option value="">-- Выберите товарную группу --</option>
                      {MARKIROVKA_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Документ соответствия *</label>
                    <select
                      value={certType}
                      onChange={(e) => setCertType(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                      required
                    >
                      <option value="">-- Выберите тип документа соответствия --</option>
                      <option value="CONFORMITY_DECLARATION">Декларация о соответствии ЕАЭС</option>
                      <option value="CONFORMITY_CERTIFICATE">Сертификат соответствия</option>
                      <option value="STATE_REGISTRATION">Свидетельство гос. регистрации (СГР)</option>
                      <option value="NONE">Без документа (Отказное письмо / Не подлежит)</option>
                    </select>
                  </div>

                  {certType !== 'NONE' && (
                    <>
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-1">Номер документа соответствия *</label>
                        <input
                          type="text"
                          placeholder="Например: ЕАЭС KZ 7500361.01.01.01234"
                          value={certNumber}
                          onChange={(e) => setCertNumber(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-1">Дата документа соответствия *</label>
                        <input
                          type="date"
                          value={certDate}
                          onChange={(e) => setCertDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                          required
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Номер акта выпуска продукции *</label>
                    <input
                      type="text"
                      placeholder="Например: АКТ-2026/01"
                      value={prodActNumber}
                      onChange={(e) => setProdActNumber(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Дата выпуска продукции *</label>
                    <input
                      type="date"
                      value={prodActDate}
                      onChange={(e) => setProdActDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Mode 4: Contract Manufacturing */}
              {importType === 'CONTRACT_MANUFACTURING' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Товарная группа *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                      required
                    >
                      <option value="">-- Выберите товарную группу --</option>
                      {MARKIROVKA_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">БИН контрактного завода в РК *</label>
                    <input
                      type="text"
                      placeholder="12-значный БИН завода"
                      maxLength={12}
                      value={producerBin}
                      onChange={(e) => setProducerBin(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Номер договора контрактного производства *</label>
                    <input
                      type="text"
                      placeholder="Например: ДОГ-2026/04"
                      value={contractNumber}
                      onChange={(e) => setContractNumber(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Документ соответствия *</label>
                    <select
                      value={certType}
                      onChange={(e) => setCertType(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                      required
                    >
                      <option value="">-- Выберите тип документа соответствия --</option>
                      <option value="CONFORMITY_DECLARATION">Декларация о соответствии ЕАЭС</option>
                      <option value="CONFORMITY_CERTIFICATE">Сертификат соответствия</option>
                      <option value="STATE_REGISTRATION">Свидетельство гос. регистрации (СГР)</option>
                      <option value="NONE">Без документа (Отказное письмо / Не подлежит)</option>
                    </select>
                  </div>

                  {certType !== 'NONE' && (
                    <>
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-1">Номер документа соответствия *</label>
                        <input
                          type="text"
                          placeholder="Номер сертификата / декларации"
                          value={certNumber}
                          onChange={(e) => setCertNumber(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-1">Дата документа соответствия *</label>
                        <input
                          type="date"
                          value={certDate}
                          onChange={(e) => setCertDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                          required
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Номер акта приема-передачи партии *</label>
                    <input
                      type="text"
                      placeholder="Например: АКТ-01"
                      value={prodActNumber}
                      onChange={(e) => setProdActNumber(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Дата акта передачи *</label>
                    <input
                      type="date"
                      value={prodActDate}
                      onChange={(e) => setProdActDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {operationType === 'UTILISATION' && (
            <div className="p-3.5 bg-gray-50 border border-gray-200/80 rounded-xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Товарная группа *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      setCategory(newCat);
                      if (['MEDICINE', 'WATER', 'OILS', 'BEER', 'DIETARY_SUPPLEMENTS'].includes(newCat)) {
                        setHasExpiration(true);
                      } else if (['SHOES', 'TEXTILE'].includes(newCat)) {
                        setHasExpiration(false);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg text-gray-800"
                    required
                  >
                    <option value="">-- Выберите товарную группу --</option>
                    {MARKIROVKA_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Тип выпуска продукции *
                  </label>
                  <select
                    value={releaseType}
                    onChange={(e) => setReleaseType(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg text-gray-800"
                    required
                  >
                    <option value="">-- Выберите тип выпуска --</option>
                    <option value="PRODUCTION">Производство в Республике Казахстан</option>
                    <option value="IMPORT">Ввезен в Республику Казахстан (Импорт)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Дата производства продукции *
                  </label>
                  <input
                    type="date"
                    value={productionDate}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setProductionDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                    required
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Дата выпуска партии (не может быть в будущем)
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-gray-700">
                      Срок годности (годен до) {hasExpiration ? '*' : ''}
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-gray-500 hover:text-gray-700">
                      <input
                        type="checkbox"
                        checked={hasExpiration}
                        onChange={(e) => setHasExpiration(e.target.checked)}
                        className="rounded border-gray-300 text-[#0082FB] focus:ring-[#0082FB] w-3 h-3"
                      />
                      <span>Имеет срок</span>
                    </label>
                  </div>
                  {hasExpiration ? (
                    <input
                      type="date"
                      value={expirationDate}
                      min={productionDate || undefined}
                      onChange={(e) => setExpirationDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg font-medium text-gray-800"
                      required
                    />
                  ) : (
                    <div className="w-full px-2.5 py-1.5 text-xs bg-gray-100 border border-gray-200 rounded-lg text-gray-500 italic">
                      Бессрочный товар (для обуви, одежды)
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Обязательно для масел, воды, медикаментов, БАД
                  </p>
                </div>
              </div>
            </div>
          )}

          {operationType === 'AGGREGATION' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 bg-gray-50 border border-gray-200/80 rounded-xl">
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Товарная группа *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">-- Выберите товарную группу --</option>
                  {MARKIROVKA_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Тип упаковки *</label>
                <select
                  value={unitType}
                  onChange={(e) => setUnitType(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">-- Выберите тип упаковки --</option>
                  <option value="BOX">Короб (Групповая тара)</option>
                  <option value="PALLET">Паллета (Транспортная тара)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
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
            <div className="p-3.5 bg-gray-50 border border-gray-200/80 rounded-xl">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Код SSCC упаковки для расформирования *
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 bg-gray-50 border border-gray-200/80 rounded-xl">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Товарная группа *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">-- Выберите товарную группу --</option>
                  {MARKIROVKA_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Причина вывода из оборота *</label>
                <select
                  value={retirementReason}
                  onChange={(e) => setRetirementReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">-- Выберите причину вывода из оборота --</option>
                  <option value="DAMAGE">Брак / Порча продукции</option>
                  <option value="OWN_USE">Использование для собственных нужд</option>
                  <option value="LOSS">Утрата / Недостача / Кража</option>
                  <option value="EXPORT">Экспорт за пределы РК</option>
                  <option value="RETAIL_NO_KKM">Розничная реализация без кассового аппарата ОФД</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Номер документа списания / акта *</label>
                <input
                  type="text"
                  placeholder="Например: АКТ-СПИСАНИЯ-01"
                  value={declarationNumber}
                  onChange={(e) => setDeclarationNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Дата документа *</label>
                <input
                  type="date"
                  value={declarationDate}
                  onChange={(e) => setDeclarationDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>
          )}

          {operationType === 'CORRECTION' && (
            <div className="p-3.5 bg-gray-50 border border-gray-200/80 rounded-xl space-y-2">
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Номер исходного документа *</label>
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
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Причина корректировки *</label>
                <input
                  type="text"
                  placeholder="Уточнение реквизитов партии"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>
          )}

          {operationType === 'RETURN_TO_TURNOVER' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 bg-gray-50 border border-gray-200/80 rounded-xl">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Товарная группа *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">-- Выберите товарную группу --</option>
                  {MARKIROVKA_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Причина возврата в оборот *</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">-- Выберите причину возврата в оборот --</option>
                  <option value="RETAIL_RETURN">Возврат при розничной реализации</option>
                  <option value="RECEIPT_RETURN">Возврат по кассовому чеку</option>
                  <option value="GOODS_RETURN">Возврат товара</option>
                  <option value="SURPLUS_RETURN">Обнаружение излишков</option>
                  <option value="PRODUCTION_USE_RETURN">Возврат из производственных целей</option>
                  <option value="OWN_USE_RETURN">Возврат из собственных нужд</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Номер документа / чека *</label>
                <input
                  type="text"
                  placeholder="ЧЕК-001 или Приказ №5"
                  value={declarationNumber}
                  onChange={(e) => setDeclarationNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Дата документа *</label>
                <input
                  type="date"
                  value={declarationDate}
                  onChange={(e) => setDeclarationDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>
          )}

          {operationType === 'VALIDATION' && (
            <div className="p-3.5 bg-gray-50 border border-gray-200/80 rounded-xl">
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Товарная группа *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg"
                required
              >
                <option value="">-- Выберите товарную группу --</option>
                {MARKIROVKA_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Codes Textarea */}
          {operationType !== 'DISAGGREGATION' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-700">
                  Коды маркировки DataMatrix (по одному на строку) *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-500">
                    Строк: <strong>{parseCodes().length}</strong>
                  </span>
                  <label className="flex items-center gap-1 text-[11px] text-[#0082FB] hover:underline cursor-pointer font-medium">
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
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#0082FB]"
                required
              />
            </div>
          )}

          {/* Validation Results */}
          {validationResults && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5">
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
            <div className="p-3.5 bg-gray-50 border border-gray-200/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-gray-700">
                  Носитель ключа ЭЦП:
                </label>
                <select
                  value={storageType}
                  onChange={(e) => setStorageType(e.target.value)}
                  className="px-2 py-1 text-xs bg-white border border-gray-300 rounded-lg text-gray-800 font-medium"
                >
                  <option value="PKCS12">Файл (.p12 / PKCS12)</option>
                  <option value="KAZTOKEN">Kaztoken</option>
                  <option value="ETOKEN">eToken</option>
                  <option value="KZIDCARD">Удостоверение личности</option>
                </select>
              </div>

              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-gray-200/70">
                <div className="flex items-center gap-1.5">
                  {isNcaRunning ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-gray-700 font-medium">NCALayer активен</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-amber-800 font-medium">NCALayer не запущен</span>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => checkStatus()}
                  className="text-[11px] text-[#0082FB] hover:underline cursor-pointer"
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
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>{signingStatus}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t border-gray-100">
            {validationError ? (
              <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-medium">
                <span>⚠️ {validationError}</span>
              </div>
            ) : (
              <div className="text-[11px] text-emerald-700 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Все обязательные поля заполнены</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Отмена
              </button>

              <button
                type="submit"
                disabled={loading || accounts.length === 0 || !isFormValid}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#0082FB] hover:bg-[#0072de] text-white text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title={validationError || 'Отправить операцию'}
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
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
