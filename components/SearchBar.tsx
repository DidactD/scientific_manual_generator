import React, { useState } from 'react';
import type { DetailLevel } from '../types';

interface SearchBarProps {
    topic: string;
    setTopic: (topic: string) => void;
    language: string;
    setLanguage: (language: string) => void;
    detailLevel: DetailLevel;
    setDetailLevel: (level: DetailLevel) => void;
    handleGenerate: () => void;
    handleClearDraft: () => void;
    isLoading: boolean;
    searchHistory: string[];
    handleClearHistory: () => void;
}

const LoadingSpinner: React.FC = () => (
    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
);

const PREDEFINED_LANGUAGES = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Mandarin Chinese', 'Japanese', 'Russian', 'Arabic'
];

const SearchBar: React.FC<SearchBarProps> = ({ topic, setTopic, language, setLanguage, detailLevel, setDetailLevel, handleGenerate, handleClearDraft, isLoading, searchHistory, handleClearHistory }) => {
    const [isHistoryVisible, setIsHistoryVisible] = useState(false);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoading) {
            handleGenerate();
        }
    };

    const handleHistorySelect = (selectedTopic: string) => {
        setTopic(selectedTopic);
        setIsHistoryVisible(false);
    }
    
    const showClearButton = topic || (language && language.toLowerCase() !== 'english') || detailLevel !== 'Standard';

    const detailLevels: DetailLevel[] = ['Concise', 'Standard', 'Detailed'];

    const isPredefinedLanguage = PREDEFINED_LANGUAGES.includes(language);
    const showCustomLanguageInput = !isPredefinedLanguage;

    const handleLanguageSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = e.target.value;
        if (selectedValue === 'other') {
            setLanguage(''); // Clear language to prompt for custom input
        } else {
            setLanguage(selectedValue);
        }
    };

    return (
        <section className="card shadow-sm">
            <div className="card-body p-4">
                <form onSubmit={handleSubmit} className="w-100">
                    <div className="row g-3 mb-3">
                        <div className="col-md-8">
                            <label htmlFor="topic-input" className="form-label">Medical Topic</label>
                            <div className="dropdown">
                                <input
                                    id="topic-input"
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    onFocus={() => setIsHistoryVisible(true)}
                                    onBlur={() => setTimeout(() => setIsHistoryVisible(false), 200)}
                                    placeholder="e.g., Pathophysiology of Alzheimer's disease"
                                    className="form-control form-control-lg"
                                    disabled={isLoading}
                                    aria-label="Medical Topic"
                                    autoComplete="off"
                                    aria-expanded={isHistoryVisible}
                                />
                                {searchHistory.length > 0 && (
                                    <div className={`dropdown-menu w-100 ${isHistoryVisible ? 'show' : ''}`}>
                                        <h6 className="dropdown-header">Recent Searches</h6>
                                        {searchHistory.map((item, index) => (
                                            <button 
                                                key={index}
                                                type="button"
                                                className="dropdown-item"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    handleHistorySelect(item);
                                                }}
                                            >
                                                {item}
                                            </button>
                                        ))}
                                        <div className="dropdown-divider"></div>
                                        <button
                                            type="button"
                                            className="dropdown-item text-danger"
                                            onMouseDown={(e) => { e.preventDefault(); handleClearHistory(); }}
                                        >
                                            Clear History
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="col-md-4">
                             <label htmlFor="language-select" className="form-label">Output Language</label>
                             <div className="input-group">
                                <select
                                    id="language-select"
                                    value={isPredefinedLanguage ? language : 'other'}
                                    onChange={handleLanguageSelectChange}
                                    className="form-select form-select-lg"
                                    disabled={isLoading}
                                    aria-label="Output Language"
                                >
                                    {PREDEFINED_LANGUAGES.map(lang => (
                                        <option key={lang} value={lang}>{lang}</option>
                                    ))}
                                    <option value="other">Other...</option>
                                </select>
                                {showCustomLanguageInput && (
                                    <input
                                        id="language-input-custom"
                                        type="text"
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        placeholder="e.g., Polish"
                                        className="form-control form-control-lg"
                                        disabled={isLoading}
                                        aria-label="Custom Output Language"
                                    />
                                )}
                             </div>
                        </div>
                    </div>

                    <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 pt-2">
                         <div>
                            <label className="form-label d-none d-md-block">Detail Level</label>
                            <div className="btn-group" role="group" aria-label="Detail level">
                                {detailLevels.map((level) => (
                                    <button
                                        key={level}
                                        type="button"
                                        onClick={() => !isLoading && setDetailLevel(level)}
                                        className={`btn ${detailLevel === level ? 'btn-primary' : 'btn-outline-secondary'}`}
                                        disabled={isLoading}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="d-flex align-items-center gap-2 w-100 w-md-auto">
                            <button
                                type="submit"
                                className="btn btn-primary btn-lg flex-grow-1"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <LoadingSpinner />
                                        Generating...
                                    </>
                                ) : (
                                    'Generate Manual'
                                )}
                            </button>
                            {showClearButton && (
                                <button
                                    type="button"
                                    onClick={handleClearDraft}
                                    className="btn btn-secondary btn-lg"
                                    title="Clear draft"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </section>
    );
};

export default SearchBar;