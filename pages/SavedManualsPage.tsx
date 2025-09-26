import React, { useState, useMemo } from 'react';
import type { SavedManual } from '../types';

const ViewIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const RefreshIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l1.35 1.35A9 9 0 0120.65 8.65M20 20l-1.35-1.35A9 9 0 013.35 15.35" />
    </svg>
);

const TrashIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);


interface SavedManualsPageProps {
    savedManuals: SavedManual[];
    onView: (id: string) => void;
    onUpdate: (id: string) => void;
    onDelete: (id: string) => void;
    isLoadingUpdate: boolean;
}

type SortOption = 'date-desc' | 'date-asc' | 'topic-asc' | 'topic-desc';

const SavedManualsPage: React.FC<SavedManualsPageProps> = ({ savedManuals, onView, onUpdate, onDelete, isLoadingUpdate }) => {
    const [sortOption, setSortOption] = useState<SortOption>('date-desc');
    const [searchTerm, setSearchTerm] = useState('');
    
    const sortedManuals = useMemo(() => {
        const filtered = savedManuals.filter(manual =>
            manual.topic.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const sorted = [...filtered];
        switch (sortOption) {
            case 'date-asc':
                sorted.sort((a, b) => new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime());
                break;
            case 'topic-asc':
                sorted.sort((a, b) => a.topic.localeCompare(b.topic));
                break;
            case 'topic-desc':
                sorted.sort((a, b) => b.topic.localeCompare(a.topic));
                break;
            case 'date-desc':
            default:
                sorted.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
                break;
        }
        return sorted;
    }, [savedManuals, sortOption, searchTerm]);

    return (
        <div className="container mx-auto px-4 py-8 animate-fade-in">
            <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                 <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Saved Manuals</h1>
                    <p className="mt-1 text-md text-slate-500">
                        Browse, update, or delete your previously generated manuals.
                    </p>
                </div>
                 {savedManuals.length > 0 && (
                     <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
                        <div className="relative w-full md:w-auto">
                            <input
                                type="search"
                                placeholder="Search by topic..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-lg text-sm pl-4 pr-10 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                aria-label="Search saved manuals"
                            />
                            <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <div className="flex items-center gap-2">
                            <label htmlFor="sort-select" className="text-sm font-medium text-slate-600 shrink-0">Sort by:</label>
                            <select
                                id="sort-select"
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value as SortOption)}
                                className="w-full bg-white border border-slate-300 rounded-lg text-sm px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            >
                                <option value="date-desc">Date: Newest First</option>
                                <option value="date-asc">Date: Oldest First</option>
                                <option value="topic-asc">Topic: A-Z</option>
                                <option value="topic-desc">Topic: Z-A</option>
                            </select>
                        </div>
                    </div>
                )}
            </header>
            
            {savedManuals.length > 0 && sortedManuals.length === 0 ? (
                <div className="text-center p-12 mt-8 bg-white rounded-lg shadow-md max-w-2xl mx-auto">
                    <h2 className="text-xl font-semibold text-slate-700">No Manuals Found</h2>
                    <p className="text-slate-500 mt-2">
                        Your search for "{searchTerm}" did not match any saved manuals.
                    </p>
                </div>
            ) : savedManuals.length === 0 ? (
                <div className="text-center p-12 mt-8 bg-white rounded-lg shadow-md max-w-2xl mx-auto border-2 border-dashed border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-700">No Manuals Saved Yet</h2>
                    <p className="text-slate-500 mt-2">
                        Use the 'Generator' to create and save your first medical manual.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedManuals.map(manual => (
                        <div key={manual.id} className="bg-white rounded-lg shadow-md p-5 flex flex-col justify-between transition hover:shadow-lg hover:-translate-y-1">
                           <div>
                             <h2 className="text-lg font-bold text-slate-800 truncate mb-1" title={manual.topic}>{manual.topic}</h2>
                             <div className="flex items-center text-sm text-slate-500 mb-1 space-x-3">
                                <p>Language: <span className="font-medium text-slate-600">{manual.language}</span></p>
                                <p>Detail: <span className="font-medium text-slate-600">{manual.detailLevel}</span></p>
                             </div>
                             <p className="text-sm text-slate-500">Saved: <span className="font-medium text-slate-600">{new Date(manual.savedAt).toLocaleDateString()}</span></p>
                           </div>
                           <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200">
                                <button onClick={() => onView(manual.id)} className="flex-1 text-sm flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"><ViewIcon /> View</button>
                                <button onClick={() => onUpdate(manual.id)} disabled={isLoadingUpdate} className="text-sm p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:text-slate-400 disabled:cursor-not-allowed" aria-label="Update manual"><RefreshIcon /></button>
                                <button onClick={() => onDelete(manual.id)} className="text-sm p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-100 transition-colors" aria-label="Delete manual"><TrashIcon /></button>
                           </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SavedManualsPage;