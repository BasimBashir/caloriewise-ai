import React, { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';

const LanguageSwitcher: React.FC = () => {
  const context = useContext(LanguageContext);
  if (!context) return null;
  const { language, toggleLanguage } = context;

  const isUrduEnabled = language === 'en-ur';

  return (
    <div className="flex items-center gap-2">
        <label htmlFor="language-toggle" className="text-sm font-urdu text-slate-600 dark:text-slate-300 cursor-pointer">اردو</label>
        <button
            id="language-toggle"
            onClick={toggleLanguage}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                isUrduEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
            }`}
            role="switch"
            aria-checked={isUrduEnabled}
            title={isUrduEnabled ? 'Disable Urdu' : 'Enable Urdu'}
        >
            <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isUrduEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
        </button>
    </div>
  );
};

export default LanguageSwitcher;
