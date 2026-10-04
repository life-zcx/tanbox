/**
 * Phone number utilities for Kazakhstan and Russia (+7)
 */

export const formatPhoneNumber = (val: string): string => {
  if (!val) return '';

  // Extract all digits
  let digits = val.replace(/\D/g, '');

  if (digits.length === 0) return '';

  // If user starts with 8 (common in KZ/RU trunk line), convert to 7
  if (digits.startsWith('8')) {
    digits = '7' + digits.slice(1);
  } else if (!digits.startsWith('7')) {
    // If user starts typing operator code directly, e.g. "701...", prepend 7
    digits = '7' + digits;
  }

  // Maximum 11 digits: country code (7) + 10 digits
  digits = digits.slice(0, 11);

  if (digits.length === 1) return '+7';
  if (digits.length <= 4) return `+7 (${digits.slice(1)}`;
  if (digits.length <= 7) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4)}`;
  if (digits.length <= 9) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
};

export const isValidPhoneNumber = (val: string): boolean => {
  if (!val) return false;
  const digits = val.replace(/\D/g, '');
  return digits.length === 11 && digits.startsWith('7');
};

export const getPhoneDigitsCount = (val: string): number => {
  return val.replace(/\D/g, '').length;
};
