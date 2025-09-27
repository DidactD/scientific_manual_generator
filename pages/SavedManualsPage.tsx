import React, { useState, useMemo } from 'react';
import type { SavedManual } from '../types';

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
        <div className="container py-4">
            <header className="mb-4 d-flex flex-column flex-md-row justify-content-md-between align-items-md-center gap-3">
                 <div>
                    <h1 className="h2 fw-bold">Saved Manuals</h1>
                    <p className="text-muted mb-0">
                        Browse, update, or delete your previously generated manuals.
                    </p>
                </div>
                 {savedManuals.length > 0 && (
                     <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center gap-3 w-100 w-md-auto">
                        <div className="input-group">
                             <span className="input-group-text"><i className="bi bi-search"></i></span>
                            <input
                                type="search"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="form-control"
                                aria-label="Search saved manuals"
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-group-text" htmlFor="sort-select">Sort by:</label>
                            <select
                                id="sort-select"
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value as SortOption)}
                                className="form-select"
                            >
                                <option value="date-desc">Newest First</option>
                                <option value="date-asc">Oldest First</option>
                                <option value="topic-asc">Topic: A-Z</option>
                                <option value="topic-desc">Topic: Z-A</option>
                            </select>
                        </div>
                    </div>
                )}
            </header>
            
            {savedManuals.length === 0 ? (
                <div className="text-center p-5 mt-4 bg-body-tertiary rounded-3">
                    <h2 className="h4">No Manuals Saved Yet</h2>
                    <p className="text-muted mt-2">
                        Use the 'Generator' to create and save your first medical manual.
                    </p>
                </div>
            ) : sortedManuals.length === 0 ? (
                 <div className="text-center p-5 mt-4 bg-body-tertiary rounded-3">
                    <h2 className="h4">No Manuals Found</h2>
                    <p className="text-muted mt-2">
                        Your search for "{searchTerm}" did not match any saved manuals.
                    </p>
                </div>
            ) : (
                <div className="row g-3">
                    {sortedManuals.map(manual => (
                        <div key={manual.id} className="col-12 col-md-6 col-lg-4">
                            <div className="card h-100 shadow-sm">
                               <div className="card-body d-flex flex-column">
                                 <h2 className="h6 card-title text-truncate fw-bold" title={manual.topic}>{manual.topic}</h2>
                                 <div className="d-flex small text-muted mb-2 gap-3">
                                    <span>Lang: <span className="fw-semibold text-body-secondary">{manual.language}</span></span>
                                    <span>Detail: <span className="fw-semibold text-body-secondary">{manual.detailLevel}</span></span>
                                 </div>
                                 <p className="small text-muted mt-auto mb-3">Saved: <span className="fw-semibold text-body-secondary">{new Date(manual.savedAt).toLocaleDateString()}</span></p>
                                 <div className="d-flex align-items-center gap-2 mt-auto pt-3 border-top">
                                     <button onClick={() => onView(manual.id)} className="btn btn-sm btn-primary flex-grow-1 d-flex align-items-center justify-content-center gap-2"><i className="bi bi-eye-fill"></i> View</button>
                                     <button onClick={() => onUpdate(manual.id)} disabled={isLoadingUpdate} className="btn btn-sm btn-outline-secondary" aria-label="Update manual"><i className="bi bi-arrow-clockwise"></i></button>
                                     <button onClick={() => onDelete(manual.id)} className="btn btn-sm btn-outline-danger" aria-label="Delete manual"><i className="bi bi-trash-fill"></i></button>
                                </div>
                               </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SavedManualsPage;