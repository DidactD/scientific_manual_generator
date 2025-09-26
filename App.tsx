import React, { useState, useCallback, useMemo } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import ManualDisplay from './components/ManualDisplay';
import Disclaimer from './components/Disclaimer';
import SavedTopics from './components/SavedTopics';
import { generateManual } from './services/geminiService';
import type { ManualData, SavedManual } from './types';
import useLocalStorage from './hooks/useLocalStorage';

const App: React.FC = () => {
    const [topic, setTopic] = useState<string>('');
    const [language, setLanguage] = useState<string>('English');
    
    const [activeManual, setActiveManual] = useState<SavedManual | null>(null);
    const [currentGeneratedData, setCurrentGeneratedData] = useState<ManualData | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [savedManuals, setSavedManuals] = useLocalStorage<SavedManual[]>('savedManuals', []);

    const displayData = activeManual || currentGeneratedData;
    const displayTopic = activeManual?.topic || topic;

    const isCurrentManualSaved = useMemo(() => {
        if (!displayData) return false;
        if (activeManual) return true; // If we are viewing an active manual, it is by definition saved
        // If viewing newly generated data, check if a manual with the same content exists
        return savedManuals.some(m => m.content === displayData.content && m.topic.toLowerCase() === topic.toLowerCase());
    }, [displayData, activeManual, savedManuals, topic]);

    const handleGenerate = useCallback(async (generationTopic: string, generationLanguage: string, idToUpdate?: string) => {
        if (!generationTopic) {
            setError('Please enter a medical topic to search.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setCurrentGeneratedData(null);
        setActiveManual(null);

        try {
            const data = await generateManual(generationTopic, generationLanguage);
            if(idToUpdate) {
                setSavedManuals(prev => prev.map(m => m.id === idToUpdate ? {...m, ...data, savedAt: new Date().toISOString() } : m));
                const updatedManual = savedManuals.find(m => m.id === idToUpdate);
                if(updatedManual) setActiveManual({...updatedManual, ...data});
            } else {
                setCurrentGeneratedData(data);
                setTopic(generationTopic);
                setLanguage(generationLanguage);
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
    }, [savedManuals, setSavedManuals]);

    const handleSave = useCallback(() => {
        if (!currentGeneratedData || !topic) return;

        const newManual: SavedManual = {
            id: crypto.randomUUID(),
            topic,
            language,
            savedAt: new Date().toISOString(),
            ...currentGeneratedData
        };

        setSavedManuals([...savedManuals, newManual]);
        setActiveManual(newManual);
        setCurrentGeneratedData(null);
    }, [currentGeneratedData, topic, language, savedManuals, setSavedManuals]);
    
    const handleSelectManual = useCallback((id: string) => {
        const manual = savedManuals.find(m => m.id === id);
        if(manual) {
            setActiveManual(manual);
            setTopic(manual.topic);
            setLanguage(manual.language);
            setCurrentGeneratedData(null);
            setError(null);
        }
    }, [savedManuals]);

    const handleUpdateManual = useCallback((id: string) => {
        const manual = savedManuals.find(m => m.id === id);
        if(manual) {
           handleGenerate(manual.topic, manual.language, id);
        }
    }, [savedManuals, handleGenerate]);

    const handleDeleteManual = useCallback((id: string) => {
        setSavedManuals(savedManuals.filter(m => m.id !== id));
        if (activeManual?.id === id) {
            setActiveManual(null);
        }
    }, [savedManuals, setSavedManuals, activeManual]);

    const InitialStateMessage: React.FC = () => (
        <div className="text-center p-8 mt-8 bg-white rounded-lg shadow-md max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-slate-700">Ready to Begin?</h2>
            <p className="text-slate-500 mt-2">
                Enter a topic and language above to generate your first medical manual, or select a previously saved manual from the list.
            </p>
        </div>
    );

    const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
        <div className="text-center p-6 mt-8 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-md max-w-2xl mx-auto" role="alert">
            <p className="font-bold">Error</p>
            <p>{message}</p>
        </div>
    );
    
    return (
        <div className="min-h-screen font-sans bg-slate-50">
            <Header />
            <div className="container mx-auto px-4 py-8">
                 <div className="flex flex-col md:flex-row gap-8">
                    <SavedTopics
                        savedManuals={savedManuals}
                        activeManualId={activeManual?.id || null}
                        onSelect={handleSelectManual}
                        onUpdate={handleUpdateManual}
                        onDelete={handleDeleteManual}
                        isLoadingUpdate={isLoading}
                    />
                    <main className="flex-1">
                        <SearchBar 
                            topic={topic} 
                            setTopic={setTopic}
                            language={language}
                            setLanguage={setLanguage} 
                            handleGenerate={() => handleGenerate(topic, language)} 
                            isLoading={isLoading} 
                        />
                        
                        <div className="mt-4">
                            {!isLoading && !displayData && !error && <InitialStateMessage />}
                            {error && <ErrorMessage message={error} />}
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
            </div>
            <Disclaimer />
        </div>
    );
};

export default App;
