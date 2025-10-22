import React from 'react';
import Card from './ui/Card';

const FirebaseConfigError: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <Card className="max-w-xl w-full text-center border-2 border-red-500">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full mx-auto flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        </div>
        <h1 className="text-2xl font-bold my-2 text-red-600 dark:text-red-400">Configuration Error</h1>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Your Firebase configuration is missing or incorrect. The application cannot connect to the database to save your data.
        </p>
        <div className="text-left bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
            <h2 className="font-semibold mb-2 text-slate-800 dark:text-slate-100">How to fix this:</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700 dark:text-slate-200">
                <li>Make sure you have created a Firebase project and a Web App within it.</li>
                <li>Find the <strong>firebaseConfig.ts</strong> file in the root of this project.</li>
                <li>
                    Replace the placeholder values in that file with your actual Firebase project credentials.
                </li>
                <li>Detailed instructions are available in the <strong>README.md</strong> file.</li>
            </ol>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-6">
            After updating the file, please refresh this page.
        </p>
      </Card>
    </div>
  );
};

export default FirebaseConfigError;
