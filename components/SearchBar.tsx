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
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
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
        <section className="bg-white p-6 rounded-lg shadow-md">
            <form onSubmit={handleSubmit} className="w-full mx-auto space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 relative">
                        <label htmlFor="topic-input" className="block text-sm font-medium text-slate-700 mb-1">Medical Topic</label>
                        <input
                            id="topic-input"
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            onFocus={() => setIsHistoryVisible(true)}
                            onBlur={() => setTimeout(() => setIsHistoryVisible(false), 200)}
                            placeholder="e.g., Pathophysiology of Alzheimer's disease"
                            className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                            disabled={isLoading}
                            aria-label="Medical Topic"
                            autoComplete="off"
                            aria-haspopup="listbox"
                            aria-expanded={isHistoryVisible}
                        />
                        {isHistoryVisible && (
                            <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl mt-1 z-20 max-h-60 flex flex-col overflow-hidden origin-top transition-opacity duration-150 ease-out">
                                {searchHistory.length > 0 ? (
                                    <>
                                        <div className="px-4 pt-3 pb-2 border-b border-slate-100">
                                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recent Searches</h4>
                                        </div>
                                        <ul role="listbox" className="overflow-y-auto py-1">
                                            {searchHistory.map((item, index) => (
                                                <li 
                                                    key={index} 
                                                    role="option"
                                                    aria-selected="false"
                                                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-slate-800"
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        handleHistorySelect(item);
                                                    }}
                                                >
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="px-2 py-2 border-t border-slate-200 bg-slate-50 text-center">
                                            <button
                                                type="button"
                                                className="text-sm font-semibold text-red-600 hover:text-red-800 transition-colors w-full"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    handleClearHistory();
                                                }}
                                            >
                                                Clear History
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="px-4 py-4 text-sm text-slate-500 text-center">
                                        No recent searches.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div>
                        <label htmlFor="language-select" className="block text-sm font-medium text-slate-700 mb-1">Output Language</label>
                        <div className="flex items-center gap-2">
                            <select
                                id="language-select"
                                value={isPredefinedLanguage ? language : 'other'}
                                onChange={handleLanguageSelectChange}
                                className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
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
                                    className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                                    disabled={isLoading}
                                    aria-label="Custom Output Language"
                                />
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2 sr-only md:not-sr-only">Detail Level</label>
                        <div className="flex rounded-lg shadow-sm w-full md:w-auto" role="radiogroup">
                            {detailLevels.map((level, index) => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => !isLoading && setDetailLevel(level)}
                                    className={`
                                        w-full md:w-auto px-5 py-2 text-sm font-semibold transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 focus:z-10 disabled:cursor-not-allowed disabled:opacity-60
                                        ${index === 0 ? 'rounded-l-lg' : ''}
                                        ${index === detailLevels.length - 1 ? 'rounded-r-lg' : ''}
                                        ${index > 0 ? 'border-l border-slate-200' : ''}
                                        ${detailLevel === level ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}
                                    `}
                                    disabled={isLoading}
                                    role="radio"
                                    aria-checked={detailLevel === level}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            type="submit"
                            className="flex-grow flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-200 ease-in-out disabled:bg-blue-400 disabled:cursor-not-allowed"
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
                                className="px-5 py-3 bg-slate-100 text-slate-600 font-semibold rounded-lg shadow-sm hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-opacity-75 transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Clear draft"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </form>
        </section>
    );
};

export default SearchBar;