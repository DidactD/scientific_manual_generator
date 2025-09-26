import React from 'react';

const BookIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

const Header: React.FC = () => {
    return (
        <header className="text-center py-6 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-center gap-3">
                <BookIcon />
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    Scientific Manual Generator
                </h1>
            </div>
            <p className="mt-2 text-md text-slate-500 max-w-2xl mx-auto">
                Leverage AI to generate detailed medical manuals from the latest scientific literature.
            </p>
        </header>
    );
};

export default Header;
