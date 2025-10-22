import React from 'react';
import { Theme } from '../types';

interface ThemeSwitcherProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
);

const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
);

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ theme, setTheme }) => {
    // FIX: Replaced `JSX.Element` with `React.ReactElement` to resolve the 'Cannot find namespace JSX' error.
    const themes: { name: Theme; icon: React.ReactElement; title: string }[] = [
        { name: 'light', icon: <SunIcon />, title: 'Light Mode' },
        { name: 'dark', icon: <MoonIcon />, title: 'Dark Mode' },
    ];

    return (
        <div className="flex items-center p-1 bg-slate-200 dark:bg-slate-700 rounded-full">
            {themes.map(t => (
                <button
                    key={t.name}
                    onClick={() => setTheme(t.name)}
                    className={`p-1.5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        theme === t.name
                            ? 'bg-white dark:bg-slate-800 text-emerald-500 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-300/50 dark:hover:bg-slate-600/50'
                    }`}
                    aria-label={`Switch to ${t.title}`}
                    title={t.title}
                >
                    {t.icon}
                </button>
            ))}
        </div>
    );
};

export default ThemeSwitcher;