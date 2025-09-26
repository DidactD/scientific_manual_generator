import React from 'react';

interface SearchBarProps {
    topic: string;
    setTopic: (topic: string) => void;
    language: string;
    setLanguage: (language: string) => void;
    handleGenerate: () => void;
    isLoading: boolean;
}

const LoadingSpinner: React.FC = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


const SearchBar: React.FC<SearchBarProps> = ({ topic, setTopic, language, setLanguage, handleGenerate, isLoading }) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoading) {
            handleGenerate();
        }
    };

    return (
        <section className="bg-white p-6 rounded-lg shadow-md">
            <form onSubmit={handleSubmit} className="w-full mx-auto space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label htmlFor="topic-input" className="block text-sm font-medium text-slate-700 mb-1">Medical Topic</label>
                        <input
                            id="topic-input"
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g., Pathophysiology of Alzheimer's disease"
                            className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                            disabled={isLoading}
                            aria-label="Medical Topic"
                        />
                    </div>
                    <div>
                        <label htmlFor="language-input" className="block text-sm font-medium text-slate-700 mb-1">Output Language</label>
                        <input
                            id="language-input"
                            type="text"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            placeholder="e.g., English"
                            className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                            disabled={isLoading}
                            aria-label="Output Language"
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-200 ease-in-out disabled:bg-blue-400 disabled:cursor-not-allowed"
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
            </form>
        </section>
    );
};

export default SearchBar;
