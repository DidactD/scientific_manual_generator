import React from 'react';

const BookIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

const SettingsIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);


interface HeaderProps {
    setView: (view: 'generator' | 'saved' | 'models') => void;
}

const Header: React.FC<HeaderProps> = ({ setView }) => {
    return (
        <header className="relative text-center py-6 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-center gap-3">
                <BookIcon />
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    Scientific Manual Generator
                </h1>
            </div>
            <p className="mt-2 text-md text-slate-500 max-w-2xl mx-auto">
                Leverage AI to generate detailed medical manuals from the latest scientific literature.
            </p>
            <div className="absolute top-1/2 right-6 -translate-y-1/2">
                <button 
                    onClick={() => setView('models')}
                    className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                    aria-label="Manage API Keys"
                >
                    <SettingsIcon />
                </button>
            </div>
        </header>
    );
};

export default Header;
