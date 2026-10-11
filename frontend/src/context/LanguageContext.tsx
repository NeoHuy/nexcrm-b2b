import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  type Language,
  translations,
  INDUSTRY_TRANSLATIONS,
  LEAD_SOURCE_TRANSLATIONS,
  STATUS_TRANSLATIONS,
  TIER_TRANSLATIONS,
  ROLE_LABEL_TRANSLATIONS,
  DEPARTMENT_TRANSLATIONS,
  ACTIVITY_TYPE_TRANSLATIONS,
  TRANSACTION_TYPE_TRANSLATIONS,
} from '../i18n/translations';

const STORAGE_KEY = 'nexcrm_lang';

export const getStoredLanguage = (): Language => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (saved === 'vi' || saved === 'en' || saved === 'ja') {
      return saved;
    }
  } catch {
    // ignore storage errors
  }
  return 'vi';
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  translateIndustry: (industry?: string) => string;
  translateLeadSource: (source?: string) => string;
  translateStatus: (status?: string, fallbackLabel?: string) => string;
  translateTier: (tier?: string, fallbackLabel?: string) => string;
  translateRole: (role?: string, department?: string, fallbackLabel?: string) => string;
  translateDepartment: (department?: string, fallbackLabel?: string) => string;
  translateActivityType: (type?: string, fallbackLabel?: string) => string;
  translateTransactionType: (type?: string, fallbackLabel?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(getStoredLanguage);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    const titles: Record<Language, string> = {
      vi: 'NexCRM B2B - Quản lý Khách hàng Doanh nghiệp & Công nợ',
      en: 'NexCRM B2B - Enterprise CRM & Receivables Platform',
      ja: 'NexCRM B2B - 法人顧客・売掛債権管理システム',
    };
    document.title = titles[language];
  }, [language]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let text = translations[language]?.[key] ?? translations.vi[key] ?? key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        });
      }
      return text;
    },
    [language]
  );

  const translateIndustry = useCallback(
    (industry?: string): string => {
      if (!industry) return '';
      return INDUSTRY_TRANSLATIONS[industry]?.[language] ?? industry;
    },
    [language]
  );

  const translateLeadSource = useCallback(
    (source?: string): string => {
      if (!source) return '';
      return LEAD_SOURCE_TRANSLATIONS[source]?.[language] ?? source;
    },
    [language]
  );

  const translateStatus = useCallback(
    (status?: string, fallbackLabel?: string): string => {
      if (!status) return fallbackLabel || '';
      return STATUS_TRANSLATIONS[status]?.[language] ?? fallbackLabel ?? status;
    },
    [language]
  );

  const translateTier = useCallback(
    (tier?: string, fallbackLabel?: string): string => {
      if (!tier) return fallbackLabel || '';
      return TIER_TRANSLATIONS[tier]?.[language] ?? fallbackLabel ?? tier;
    },
    [language]
  );

  const translateRole = useCallback(
    (role?: string, department?: string, fallbackLabel?: string): string => {
      if (role === 'admin') return ROLE_LABEL_TRANSLATIONS.admin[language];
      if (department && ROLE_LABEL_TRANSLATIONS[department]) {
        return ROLE_LABEL_TRANSLATIONS[department][language];
      }
      if (role && ROLE_LABEL_TRANSLATIONS[role]) {
        return ROLE_LABEL_TRANSLATIONS[role][language];
      }
      return fallbackLabel || '';
    },
    [language]
  );

  const translateDepartment = useCallback(
    (department?: string, fallbackLabel?: string): string => {
      if (!department) return fallbackLabel || '';
      return DEPARTMENT_TRANSLATIONS[department]?.[language] ?? fallbackLabel ?? department;
    },
    [language]
  );

  const translateActivityType = useCallback(
    (type?: string, fallbackLabel?: string): string => {
      if (!type) return fallbackLabel || '';
      return ACTIVITY_TYPE_TRANSLATIONS[type]?.[language] ?? fallbackLabel ?? type;
    },
    [language]
  );

  const translateTransactionType = useCallback(
    (type?: string, fallbackLabel?: string): string => {
      if (!type) return fallbackLabel || '';
      return TRANSACTION_TYPE_TRANSLATIONS[type]?.[language] ?? fallbackLabel ?? type;
    },
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        translateIndustry,
        translateLeadSource,
        translateStatus,
        translateTier,
        translateRole,
        translateDepartment,
        translateActivityType,
        translateTransactionType,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
