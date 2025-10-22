import React, { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { translations } from '../translations/en_ur';

type TranslationKey = keyof typeof translations;

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  const { language } = context;

  const t = (key: TranslationKey, vars: Record<string, string | number> = {}) => {
    let enText = translations[key]?.en || key;
    let urText = translations[key]?.ur || '';

    for (const varKey in vars) {
        const regex = new RegExp(`{${varKey}}`, 'g');
        enText = enText.replace(regex, String(vars[varKey]));
        urText = urText.replace(regex, String(vars[varKey]));
    }

    if (language === 'en-ur' && urText) {
      return (
        <>
          {enText}
          <span className="block font-urdu text-emerald-600 dark:text-emerald-400 text-[0.9em] opacity-95 leading-tight">{urText}</span>
        </>
      );
    }
    return enText;
  };
  
  const t_html = (key: TranslationKey, vars: Record<string, string | number> = {}) => {
      let enText = translations[key]?.en || key;
      let urText = translations[key]?.ur || '';

      for (const varKey in vars) {
        const regex = new RegExp(`{${varKey}}`, 'g');
        enText = enText.replace(regex, String(vars[varKey]));
        urText = urText.replace(regex, String(vars[varKey]));
    }

      if (language === 'en-ur' && urText) {
          return `${enText} (${urText})`;
      }
      return enText;
  }
  
  const t_single = (key: TranslationKey, lang: 'en' | 'ur' | 'current' = 'en') => {
      const langToUse = lang === 'current' ? (language === 'en-ur' ? 'ur' : 'en') : lang;
      if (langToUse === 'ur') {
          return translations[key]?.ur || translations[key]?.en || key;
      }
      return translations[key]?.en || key;
  }

  return { t, t_html, t_single, language };
};