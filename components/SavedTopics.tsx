import React from 'react';
import type { SavedManual } from '../types';

interface SavedTopicsProps {
    savedManuals: SavedManual[];
    activeManualId: string | null;
    onSelect: (id: string) => void;
    onUpdate: (id: string) => void;
    onDelete: (id: string) => void;
    isLoadingUpdate: boolean;
}

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
);

const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l1.35 1.35A9 9 0 0120.65 8.65M20 20l-1.35-1.35A9 9 0 013.35 15.35" /></svg>
);

const SavedTopics: React.FC<SavedTopicsProps> = ({ savedManuals, activeManualId, onSelect, onUpdate, onDelete, isLoadingUpdate }) => {
    return (
        <aside className="w-full md:w-80 bg-white p-4 rounded-lg shadow-md h-full self-start">
            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Saved Manuals</h2>
            {savedManuals.length === 0 ? (
                <p className="text-sm text-slate-500 p-2">No manuals saved yet.</p>
            ) : (
                <ul className="space-y-2">
                    {savedManuals.slice().reverse().map(manual => (
                        <li key={manual.id}
                            className={`p-3 rounded-lg cursor-pointer transition border ${activeManualId === manual.id ? 'bg-blue-100 border-blue-500' : 'hover:bg-slate-100 border-transparent'}`}
                             onClick={() => onSelect(manual.id)}
                        >
                            <div className="flex-1">
                                <h3 className="font-semibold text-slate-900 truncate">{manual.topic}</h3>
                                <p className="text-xs text-slate-500">{new Date(manual.savedAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <button onClick={(e) => { e.stopPropagation(); onUpdate(manual.id); }} disabled={isLoadingUpdate} className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 disabled:text-slate-400 p-1 rounded hover:bg-blue-100 transition-colors"><RefreshIcon /> Update</button>
                                <button onClick={(e) => { e.stopPropagation(); onDelete(manual.id); }} className="text-xs flex items-center gap-1 text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100 transition-colors"><TrashIcon /> Delete</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </aside>
    );
};

export default SavedTopics;
