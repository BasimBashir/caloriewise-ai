import React, { useState } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { Theme } from '../types';
import ThemeSwitcher from './ThemeSwitcher';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from '../hooks/useTranslation';

interface LoginProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    onContinueAsGuest: () => void;
    onSignInAttempt: () => Promise<any>;
}

const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
        <path fill="#4285F4" d="M24 9.5c3.2 0 6.1 1.1 8.4 3.2l6.5-6.5C34.6 2.3 29.6 0 24 0 14.9 0 7.3 5.4 3 13.2l7.7 6C12.8 12.9 18 9.5 24 9.5z"></path>
        <path fill="#34A853" d="M46.2 25.4c0-1.7-.2-3.4-.5-5H24v9.5h12.6c-.5 3.1-2.2 5.7-4.7 7.5l7.6 5.9c4.4-4.1 7-10 7-17.9z"></path>
        <path fill="#FBBC05" d="M10.7 28.2c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.7-6C1.2 16.5 0 20.1 0 24c0 3.9 1.2 7.5 3 10.2l7.7-6z"></path>
        <path fill="#EA4335" d="M24 48c5.6 0 10.6-1.9 14.1-5.1l-7.6-5.9c-1.9 1.3-4.2 2-6.5 2-6 0-11.2-3.4-13.2-8.2l-7.7 6C7.3 42.6 14.9 48 24 48z"></path>
        <path fill="none" d="M0 0h48v48H0z"></path>
    </svg>
);


const Login: React.FC<LoginProps> = ({ theme, setTheme, onContinueAsGuest, onSignInAttempt }) => {
    const { t, t_html } = useTranslation();
    const [authError, setAuthError] = useState<string | null>(null);

    const handleLogin = async () => {
        setAuthError(null);
        try {
            await onSignInAttempt();
        } catch (error: any) {
            console.error("Google Sign-In failed:", error);
            if (error.code === 'auth/unauthorized-domain') {
                 setAuthError(t_html('loginAuthErrorUnauthorizedDomain'));
            } else if (error.code === 'auth/configuration-not-found') {
                 setAuthError(t_html('loginAuthErrorConfigNotFound'));
            } else {
                 setAuthError(t_html('loginAuthErrorDefault'));
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
            <Card className="max-w-md w-full text-center">
                 <div className="flex justify-end items-center gap-4">
                    <LanguageSwitcher />
                    <ThemeSwitcher theme={theme} setTheme={setTheme} />
                </div>
                <h1 className="text-2xl font-bold my-2 text-slate-800 dark:text-slate-100">{t('loginWelcome')}</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8">{t('loginSubtext')}</p>
                
                 <div className="flex flex-col items-center gap-4">
                    <Button onClick={handleLogin} variant="secondary" className="w-full max-w-[280px]">
                        <GoogleIcon />
                        Sign in with Google
                    </Button>
                     <Button onClick={onContinueAsGuest} variant="secondary" className="w-full max-w-[280px]">
                        {t('loginGuest')}
                    </Button>
                </div>

                {authError && (
                     <div className="mt-4 text-left bg-red-50 dark:bg-red-900/30 p-3 rounded-md border border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-700 dark:text-red-300">{authError}</p>
                    </div>
                )}
               
                 <p className="text-xs text-slate-400 dark:text-slate-500 mt-8">
                    Note: For this app to function, you must set up your own Firebase project and API keys. Please follow the instructions in the README.md file carefully.
                </p>
            </Card>
        </div>
    );
};

export default Login;