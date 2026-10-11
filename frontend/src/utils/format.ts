import { getStoredLanguage } from '../context/LanguageContext';

const LOCALE_MAP: Record<string, string> = {
  vi: 'vi-VN',
  en: 'en-US',
  ja: 'ja-JP',
};

export const formatVND = (amount: number | string | undefined | null): string => {
  const lang = getStoredLanguage();
  const locale = LOCALE_MAP[lang] || 'vi-VN';
  const suffix = lang === 'vi' ? ' đ' : ' VND';
  if (amount === undefined || amount === null || amount === '') return `0${suffix}`;
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return `0${suffix}`;
  return new Intl.NumberFormat(locale).format(Math.round(num)) + suffix;
};

export const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const lang = getStoredLanguage();
    const locale = LOCALE_MAP[lang] || 'vi-VN';
    return d.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const lang = getStoredLanguage();
    const locale = LOCALE_MAP[lang] || 'vi-VN';
    return d.toLocaleString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};
