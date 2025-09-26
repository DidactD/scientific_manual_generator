import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import ManualDisplay from './components/ManualDisplay';
import Disclaimer from './components/Disclaimer';
import Navbar from './components/Navbar';
import SavedManualsPage from './pages/SavedManualsPage';
import ModelsPage from './pages/ModelsPage';
import ErrorMessage from './components/ErrorMessage';
import { generateManual } from './services/geminiService';
import type { ManualData, SavedManual, DetailLevel, ApiKey } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import useDebounce from './hooks/useDebounce';

const App: React.FC = () => {
    const [view, setView] = useState<'generator' | 'saved' | 'models'>('generator');

    const [topic, setTopic] = useState<string>(() => localStorage.getItem('draftTopic') || '');
    const [language, setLanguage] = useState<string>(() => localStorage.getItem('draftLanguage') || 'English');
    const [detailLevel, setDetailLevel] = useState<DetailLevel>(() => (localStorage.getItem('draftDetailLevel') as DetailLevel) || 'Standard');
    
    const debouncedTopic = useDebounce(topic, 500);
    const debouncedLanguage = useDebounce(language, 500);
    const debouncedDetailLevel = useDebounce(detailLevel, 500);

    useEffect(() => {
        localStorage.setItem('draftTopic', debouncedTopic);
    }, [debouncedTopic]);
    
    useEffect(() => {
        localStorage.setItem('draftLanguage', debouncedLanguage);
    }, [debouncedLanguage]);

    useEffect(() => {
        localStorage.setItem('draftDetailLevel', debouncedDetailLevel);
    }, [debouncedDetailLevel]);

    const [activeManual, setActiveManual] = useState<SavedManual | null>(null);
    const [currentGeneratedData, setCurrentGeneratedData] = useState<ManualData | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [savedManuals, setSavedManuals] = useLocalStorage<SavedManual[]>('savedManuals', []);
    const [searchHistory, setSearchHistory] = useLocalStorage<string[]>('searchHistory', []);
    const [apiKeys, setApiKeys] = useLocalStorage<ApiKey[]>('apiKeys', []);

    const displayData = activeManual || currentGeneratedData;
    const displayTopic = activeManual?.topic || topic;

    const isCurrentManualSaved = useMemo(() => {
        if (!displayData) return false;
        if (activeManual) return true; 
        return savedManuals.some(m => m.content === displayData.content && m.topic.toLowerCase() === topic.toLowerCase());
    }, [displayData, activeManual, savedManuals, topic]);

    const handleGenerate = useCallback(async (generationTopic: string, generationLanguage: string, generationDetailLevel: DetailLevel, idToUpdate?: string) => {
        const activeGeminiKey = apiKeys.find(k => k.provider === 'Google Gemini' && k.isActive)?.key;

        if (!activeGeminiKey) {
            setError("No active Google Gemini API key found. Please configure it in the Models settings (click the gear icon in the header).");
            return;
        }

        if (!generationTopic) {
            setError('Please enter a medical topic to search.');
            return;
        }

        const newHistory = [generationTopic, ...searchHistory.filter(t => t.toLowerCase() !== generationTopic.toLowerCase())].slice(0, 10);
        setSearchHistory(newHistory);

        setIsLoading(true);
        setError(null);
        setCurrentGeneratedData(null);
        setActiveManual(null);

        try {
            const data = await generateManual(generationTopic, generationLanguage, generationDetailLevel, activeGeminiKey);
            if(idToUpdate) {
                const updatedManuals = savedManuals.map(m => m.id === idToUpdate ? {...m, ...data, topic: generationTopic, language: generationLanguage, detailLevel: generationDetailLevel, savedAt: new Date().toISOString() } : m);
                setSavedManuals(updatedManuals);
                const updatedManual = updatedManuals.find(m => m.id === idToUpdate);
                if(updatedManual) setActiveManual(updatedManual);
            } else {
                setCurrentGeneratedData(data);
                setTopic(generationTopic);
                setLanguage(generationLanguage);
                setDetailLevel(generationDetailLevel);
            }

        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [apiKeys, savedManuals, setSavedManuals, searchHistory, setSearchHistory]);

    const handleSave = useCallback(() => {
        if (!currentGeneratedData || !topic) return;

        const newManual: SavedManual = {
            id: crypto.randomUUID(),
            topic,
            language,
            detailLevel,
            savedAt: new Date().toISOString(),
            ...currentGeneratedData
        };
        
        setSavedManuals(prevManuals => [...prevManuals, newManual]);
        setActiveManual(newManual);
        setCurrentGeneratedData(null);
    }, [currentGeneratedData, topic, language, detailLevel, setSavedManuals]);
    
    const handleSelectManual = useCallback((id: string) => {
        const manual = savedManuals.find(m => m.id === id);
        if(manual) {
            setActiveManual(manual);
            setTopic(manual.topic);
            setLanguage(manual.language);
            setDetailLevel(manual.detailLevel);
            setCurrentGeneratedData(null);
            setError(null);
            setView('generator');
        }
    }, [savedManuals]);

    const handleUpdateManual = useCallback((id: string) => {
        const manual = savedManuals.find(m => m.id === id);
        if(manual) {
           handleGenerate(manual.topic, manual.language, manual.detailLevel, id);
           setView('generator');
        }
    }, [savedManuals, handleGenerate]);

    const handleDeleteManual = useCallback((id: string) => {
        setSavedManuals(savedManuals.filter(m => m.id !== id));
        if (activeManual?.id === id) {
            setActiveManual(null);
        }
    }, [savedManuals, setSavedManuals, activeManual]);

    const handleClearDraft = useCallback(() => {
        setTopic('');
        setLanguage('English');
        setDetailLevel('Standard');
        localStorage.removeItem('draftTopic');
        localStorage.removeItem('draftLanguage');
        localStorage.removeItem('draftDetailLevel');
    }, []);

    const handleClearSearchHistory = useCallback(() => {
        setSearchHistory([]);
    }, [setSearchHistory]);

    const InitialStateMessage: React.FC = () => (
        <div className="text-center p-8 mt-8 bg-white rounded-lg shadow-md max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-slate-700">Ready to Begin?</h2>
            <p className="text-slate-500 mt-2">
                Enter a topic and language above to generate your first medical manual.
            </p>
        </div>
    );
    
    return (
        <div className="min-h-screen font-sans bg-slate-50">
            <Header setView={setView} />
            
            {view !== 'models' && <Navbar currentView={view} setView={setView} savedCount={savedManuals.length} />}
            
            {view === 'generator' ? (
                 <div className="container mx-auto px-4 py-8">
                    <main>
                        <SearchBar 
                            topic={topic} 
                            setTopic={setTopic}
                            language={language}
                            setLanguage={setLanguage}
                            detailLevel={detailLevel}
                            setDetailLevel={setDetailLevel}
                            handleGenerate={() => handleGenerate(topic, language, detailLevel)} 
                            handleClearDraft={handleClearDraft}
                            isLoading={isLoading} 
                            searchHistory={searchHistory}
                            handleClearHistory={handleClearSearchHistory}
                        />
                        
                        <div className="mt-4">
                            {!isLoading && !displayData && !error && <InitialStateMessage />}
                            {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
                            {displayData && (
                                <ManualDisplay 
                                    data={displayData}
                                    topic={displayTopic}
                                    onSave={handleSave}
                                    isSaved={isCurrentManualSaved}
                                />
                            )}
                        </div>
                    </main>
                </div>
            ) : view === 'saved' ? (
                <SavedManualsPage 
                    savedManuals={savedManuals}
                    onView={handleSelectManual}
                    onUpdate={handleUpdateManual}
                    onDelete={handleDeleteManual}
                    isLoadingUpdate={isLoading}
                />
            ) : (
                <ModelsPage 
                    apiKeys={apiKeys}
                    setApiKeys={setApiKeys}
                    onClose={() => setView('generator')}
                />
            )}
            
            <Disclaimer />
        </div>
    );
};

export default App;
