import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import ManualDisplay from './components/ManualDisplay';
import Disclaimer from './components/Disclaimer';
import Navbar from './components/Navbar';
import SavedManualsPage from './pages/SavedManualsPage';
import ModelsPage from './pages/ModelsPage';
import ErrorMessage from './components/ErrorMessage';
import LoginPage from './pages/LoginPage';
import { generateManual } from './services/generationService';
import { getAuthToken, logout } from './services/authService';
import { getSavedManuals, saveManual as apiSaveManual, updateManual as apiUpdateManual, deleteManual as apiDeleteManual } from './services/manualsService';
import type { ManualData, SavedManual, DetailLevel, ApiKey, User } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import useDebounce from './hooks/useDebounce';

const decodeToken = (token: string): User | null => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.user ? { ...payload.user, id: String(payload.user.id) } : null;
    } catch (error) {
        console.error("Failed to decode token:", error);
        return null;
    }
}

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    const [view, setView] = useState<'generator' | 'saved' | 'models'>('generator');

    const [topic, setTopic] = useState<string>(() => localStorage.getItem('draftTopic') || '');
    const [language, setLanguage] = useState<string>(() => localStorage.getItem('draftLanguage') || 'English');
    const [detailLevel, setDetailLevel] = useState<DetailLevel>(() => (localStorage.getItem('draftDetailLevel') as DetailLevel) || 'Standard');
    
    const debouncedTopic = useDebounce(topic, 500);
    const debouncedLanguage = useDebounce(language, 500);
    const debouncedDetailLevel = useDebounce(detailLevel, 500);

    const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');

    const [activeManual, setActiveManual] = useState<SavedManual | null>(null);
    const [currentGeneratedData, setCurrentGeneratedData] = useState<ManualData | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [savedManuals, setSavedManuals] = useState<SavedManual[]>([]);
    const [searchHistory, setSearchHistory] = useLocalStorage<string[]>('searchHistory', []);
    const [apiKeys, setApiKeys] = useLocalStorage<ApiKey[]>('apiKeys', []);

    useEffect(() => {
        const token = getAuthToken();
        if (token) {
            const userData = decodeToken(token);
            if (userData) {
                setUser(userData);
            }
        }
        setIsAuthLoading(false);
    }, []);

    useEffect(() => {
        if (user) {
            const fetchManuals = async () => {
                try {
                    const manuals = await getSavedManuals();
                    setSavedManuals(manuals);
                } catch (err) {
                    console.error("Failed to fetch manuals:", err);
                    setError("Could not load your saved manuals.");
                }
            };
            fetchManuals();
        } else {
            setSavedManuals([]);
        }
    }, [user]);

    useEffect(() => {
        document.documentElement.setAttribute('data-bs-theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('draftTopic', debouncedTopic);
    }, [debouncedTopic]);
    
    useEffect(() => {
        localStorage.setItem('draftLanguage', debouncedLanguage);
    }, [debouncedLanguage]);

    useEffect(() => {
        localStorage.setItem('draftDetailLevel', debouncedDetailLevel);
    }, [debouncedDetailLevel]);

    const displayData = activeManual || currentGeneratedData;
    const displayTopic = activeManual?.topic || topic;

    const isCurrentManualSaved = useMemo(() => {
        if (!displayData) return false;
        if (activeManual) return true; 
        return savedManuals.some(m => m.content === displayData.content && m.topic.toLowerCase() === topic.toLowerCase());
    }, [displayData, activeManual, savedManuals, topic]);

    const handleGenerate = useCallback(async () => {
        const activeApiKeys = apiKeys.filter(k => k.isActive);
        if (activeApiKeys.length === 0) {
            setError("No active API key found. Please select one in the Models settings.");
            return;
        }
        if (!topic) {
            setError('Please enter a medical topic to search.');
            return;
        }

        const newHistory = [topic, ...searchHistory.filter(t => t.toLowerCase() !== topic.toLowerCase())].slice(0, 10);
        setSearchHistory(newHistory);

        setIsLoading(true);
        setError(null);
        setCurrentGeneratedData(null);
        setActiveManual(null);

        try {
            // Passiamo isDeepSearch come true direttamente
            const data = await generateManual(activeApiKeys, topic, language, detailLevel, true);
            setCurrentGeneratedData(data);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [apiKeys, topic, language, detailLevel, searchHistory, setSearchHistory]);

    const handleSave = useCallback(async () => {
        if (!currentGeneratedData || !topic) return;

        const newManual: SavedManual = {
            id: crypto.randomUUID(),
            topic,
            language,
            detailLevel,
            savedAt: new Date().toISOString(),
            ...currentGeneratedData
        };
        
        try {
            const saved = await apiSaveManual(newManual);
            setSavedManuals(prev => [saved, ...prev]);
            setActiveManual(saved);
            setCurrentGeneratedData(null);
        } catch(err) {
            setError(err instanceof Error ? err.message : 'An error occurred while saving.');
        }
    }, [currentGeneratedData, topic, language, detailLevel]);
    
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

    const handleUpdateManual = useCallback(async (id: string) => {
        const manualToUpdate = savedManuals.find(m => m.id === id);
        if(!manualToUpdate) return;
        
        const activeApiKeys = apiKeys.filter(k => k.isActive);
        if (activeApiKeys.length === 0) {
            setError("No active API key found for updating. Please select one in the Models settings.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setView('generator');
        setActiveManual(null);
        setCurrentGeneratedData(null);

        try {
            // Passiamo isDeepSearch come true direttamente
            const newData = await generateManual(activeApiKeys, manualToUpdate.topic, manualToUpdate.language, manualToUpdate.detailLevel, true);
            const updatedManual: SavedManual = {
                ...manualToUpdate,
                ...newData,
                savedAt: new Date().toISOString(),
            };

            const saved = await apiUpdateManual(updatedManual);
            setSavedManuals(savedManuals.map(m => m.id === id ? saved : m));
            setActiveManual(saved);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred during update.');
        } finally {
            setIsLoading(false);
        }
    }, [savedManuals, apiKeys]);

    const handleDeleteManual = useCallback(async (id: string) => {
        try {
            await apiDeleteManual(id);
            setSavedManuals(savedManuals.filter(m => m.id !== id));
            if (activeManual?.id === id) {
                setActiveManual(null);
            }
        } catch(err) {
            setError(err instanceof Error ? err.message : 'An error occurred while deleting.');
        }
    }, [savedManuals, activeManual]);

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
    
    const handleLoginSuccess = (loggedInUser: User) => {
        setUser(loggedInUser);
    };
    
    const handleLogout = () => {
        logout();
        setUser(null);
    };

    const InitialStateMessage: React.FC = () => (
        <div className="text-center p-5 mt-4 bg-body-tertiary rounded-3">
            <h2 className="h4">Ready to Begin?</h2>
            <p className="text-muted mt-2">
                Enter a topic and language above to generate your first medical manual.
            </p>
        </div>
    );

    if (isAuthLoading) {
        return <div className="d-flex justify-content-center align-items-center min-vh-100"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>;
    }
    
    if (!user) {
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }
    
    return (
        <div className="d-flex flex-column min-vh-100">
            <Header setView={setView} theme={theme} setTheme={setTheme} user={user} onLogout={handleLogout} />
            
            {view !== 'models' && <Navbar currentView={view as 'generator' | 'saved'} setView={setView as (view: 'generator' | 'saved') => void} savedCount={savedManuals.length} />}
            
            <div className="flex-grow-1">
                {view === 'generator' ? (
                     <div className="container py-4">
                        <main>
                            <SearchBar 
                                topic={topic} 
                                setTopic={setTopic}
                                language={language}
                                setLanguage={setLanguage}
                                detailLevel={detailLevel}
                                setDetailLevel={setDetailLevel}
                                handleGenerate={handleGenerate} 
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
            </div>
            
            <Disclaimer />
        </div>
    );
};

export default App;