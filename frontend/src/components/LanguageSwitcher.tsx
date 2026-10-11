import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGE_OPTIONS } from '../i18n/translations';

interface LanguageSwitcherProps {
  variant?: 'light' | 'dark';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'light' }) => {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isDark = variant === 'dark';
  const currentOption = LANGUAGE_OPTIONS.find((opt) => opt.code === language) || LANGUAGE_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative inline-block text-left shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        title={currentOption.label}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer select-none whitespace-nowrap ${
          isDark
            ? 'bg-slate-800/90 border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600 shadow-sm'
            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 shadow-2xs'
        }`}
      >
        <span className="text-base leading-none">{currentOption.flag}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          } ${isDark ? 'text-slate-400' : 'text-slate-400'}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className={`absolute right-0 mt-1.5 w-44 rounded-xl border py-1 shadow-xl z-50 transition-all ${
            isDark
              ? 'bg-slate-800 border-slate-700 text-slate-200'
              : 'bg-white border-slate-200 text-slate-700'
          }`}
        >
          {LANGUAGE_OPTIONS.map((opt) => {
            const active = language === opt.code;
            return (
              <button
                key={opt.code}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  setLanguage(opt.code);
                  setOpen(false);
                }}
                className={`w-full px-3 py-2 text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                  active
                    ? isDark
                      ? 'bg-indigo-600/20 text-indigo-300 font-bold'
                      : 'bg-indigo-50 text-indigo-700 font-bold'
                    : isDark
                    ? 'text-slate-300 hover:bg-slate-700/70 hover:text-white font-medium'
                    : 'text-slate-700 hover:bg-slate-50 font-medium'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-base leading-none">{opt.flag}</span>
                  <span>{opt.label}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded uppercase ${
                      active
                        ? isDark
                          ? 'bg-indigo-500/30 text-indigo-200'
                          : 'bg-indigo-100 text-indigo-700'
                        : isDark
                        ? 'bg-slate-700 text-slate-400'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {opt.shortLabel}
                  </span>
                  {active && (
                    <Check className={`w-3.5 h-3.5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
