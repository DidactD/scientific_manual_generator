import React from 'react';

const GeneratorIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const CollectionIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
);


interface NavbarProps {
    currentView: 'generator' | 'saved';
    setView: (view: 'generator' | 'saved') => void;
    savedCount: number;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, setView, savedCount }) => {
    const navItemClasses = "flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-40";
    const activeClasses = "bg-blue-600 text-white shadow";
    const inactiveClasses = "text-slate-600 hover:bg-slate-200";

    return (
        <nav className="bg-white/70 backdrop-blur-lg sticky top-0 z-10 border-b border-slate-200">
            <div className="container mx-auto px-4">
                <div className="flex justify-center items-center h-16">
                    <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => setView('generator')}
                            className={`${navItemClasses} ${currentView === 'generator' ? activeClasses : inactiveClasses}`}
                            aria-current={currentView === 'generator' ? 'page' : undefined}
                        >
                            <GeneratorIcon />
                            Generator
                        </button>
                        <button
                            onClick={() => setView('saved')}
                            className={`${navItemClasses} ${currentView === 'saved' ? activeClasses : inactiveClasses}`}
                            aria-current={currentView === 'saved' ? 'page' : undefined}
                        >
                            <CollectionIcon />
                            Saved Manuals
                            {savedCount > 0 && (
                                <span className={`ml-1 text-xs font-semibold px-2 py-0.5 rounded-full ${currentView === 'saved' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'}`}>
                                    {savedCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
