import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGE_OPTIONS } from '../i18n/translations';

interface LanguageSwitcherProps {
  variant?: 'light' | 'dark';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'light' }) => {
  const { language, setLanguage } = useLanguage();

  const isDark = variant === 'dark';

  return (
    <div
      className={`inline-flex items-center gap-1 p-1 rounded-xl border text-xs font-semibold ${
        isDark
          ? 'bg-slate-800/90 border-slate-700 text-slate-300'
          : 'bg-slate-100 border-slate-200/80 text-slate-600'
      }`}
    >
      <Globe className={`w-3.5 h-3.5 ml-1.5 mr-0.5 hidden sm:inline ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
      {LANGUAGE_OPTIONS.map((opt) => {
        const active = language === opt.code;
        return (
          <button
            key={opt.code}
            type="button"
            onClick={() => setLanguage(opt.code)}
            title={opt.label}
            className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
              active
                ? isDark
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'bg-white text-indigo-700 shadow-xs font-bold ring-1 ring-slate-200'
                : isDark
                ? 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span>{opt.flag}</span>
            <span>{opt.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
};
