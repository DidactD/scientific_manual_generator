import React, { useState } from 'react';
import type { ApiKey, ModelProvider } from '../types';

const MODEL_PROVIDERS: ModelProvider[] = ['Google Gemini', 'Anthropic Claude', 'OpenAI ChatGPT'];

interface ModelsPageProps {
    apiKeys: ApiKey[];
    setApiKeys: (keys: ApiKey[] | ((keys: ApiKey[]) => ApiKey[])) => void;
    onClose: () => void;
}

const KeyIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
);

const BackIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const Toggle: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void }> = ({ enabled, onChange }) => {
    return (
        <button
            type="button"
            onClick={() => onChange(!enabled)}
            className={`${enabled ? 'bg-blue-600' : 'bg-slate-300'
                } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            role="switch"
            aria-checked={enabled}
        >
            <span
                className={`${enabled ? 'translate-x-6' : 'translate-x-1'
                    } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
            />
        </button>
    );
};

const ModelsPage: React.FC<ModelsPageProps> = ({ apiKeys, setApiKeys, onClose }) => {
    const [newProvider, setNewProvider] = useState<ModelProvider>('Google Gemini');
    const [newKey, setNewKey] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleAddKey = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKey.trim()) {
            setError('API key cannot be empty.');
            return;
        }

        const newApiKey: ApiKey = {
            id: crypto.randomUUID(),
            provider: newProvider,
            key: newKey,
            isActive: false,
        };

        setApiKeys(prev => [...prev, newApiKey]);
        setNewKey('');
        setError(null);
    };

    const handleDeleteKey = (id: string) => {
        setApiKeys(prev => prev.filter(key => key.id !== id));
    };

    const handleToggleActive = (id: string) => {
        setApiKeys(prev =>
            prev.map(key =>
                key.id === id ? { ...key, isActive: true } : { ...key, isActive: false }
            )
        );
    };
    
    const maskKey = (key: string) => {
        if (key.length < 8) return '********';
        return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
    }

    return (
        <div className="container mx-auto px-4 py-8 animate-fade-in">
            <header className="mb-8">
                <button onClick={onClose} className="flex items-center gap-2 text-sm text-blue-600 font-semibold hover:underline mb-4">
                    <BackIcon />
                    Back to Generator
                </button>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manage AI Models</h1>
                <p className="mt-1 text-md text-slate-500">
                    Add and configure API keys for different models to power the generator.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <form onSubmit={handleAddKey} className="bg-white p-6 rounded-lg shadow-md space-y-4">
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <KeyIcon />
                            Add New API Key
                        </h2>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        <div>
                            <label htmlFor="model-provider" className="block text-sm font-medium text-slate-700 mb-1">Model Provider</label>
                            <select
                                id="model-provider"
                                value={newProvider}
                                onChange={(e) => setNewProvider(e.target.value as ModelProvider)}
                                className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                            >
                                {MODEL_PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="api-key" className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                            <input
                                id="api-key"
                                type="password"
                                value={newKey}
                                onChange={(e) => setNewKey(e.target.value)}
                                placeholder="Paste your API key here"
                                className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-200 ease-in-out"
                        >
                            Save Key
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">Saved Keys</h2>
                        <div className="space-y-3">
                            {apiKeys.length > 0 ? (
                                apiKeys.map(apiKey => (
                                    <div key={apiKey.id} className="p-4 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div className="flex-grow">
                                            <p className="font-semibold text-slate-700">{apiKey.provider}</p>
                                            <p className="text-sm text-slate-500 font-mono">{maskKey(apiKey.key)}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <label htmlFor={`toggle-${apiKey.id}`} className="text-sm font-medium text-slate-600">Active:</label>
                                                <Toggle enabled={apiKey.isActive} onChange={() => handleToggleActive(apiKey.id)} />
                                            </div>
                                            <button onClick={() => handleDeleteKey(apiKey.id)} className="text-sm p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors" aria-label="Delete API Key">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-lg">
                                    <p className="text-slate-500">No API keys saved yet. Add one to get started.</p>
                                </div>
                            )}
                        </div>
                        <div className="mt-6 p-4 bg-slate-50 border-l-4 border-slate-300 text-slate-600 rounded-r-lg text-sm">
                            <p><strong className="font-semibold">Note:</strong> Only one API key can be active at a time. Currently, only the active 'Google Gemini' key is used for generating manuals. Support for other models is coming soon.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModelsPage;
