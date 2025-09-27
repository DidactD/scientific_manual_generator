import React, { useState } from 'react';
import type { ApiKey, ModelProvider } from '../types';

const MODEL_PROVIDERS: ModelProvider[] = ['Google Gemini', 'Anthropic Claude', 'OpenAI ChatGPT'];

// Definiamo i modelli disponibili per ogni provider
const AVAILABLE_MODELS: Record<ModelProvider, string[]> = {
    'Google Gemini': ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
    'OpenAI ChatGPT': ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    'Anthropic Claude': ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
};

interface ModelsPageProps {
    apiKeys: ApiKey[];
    setApiKeys: (keys: ApiKey[] | ((keys: ApiKey[]) => ApiKey[])) => void;
    onClose: () => void;
}

const ModelsPage: React.FC<ModelsPageProps> = ({ apiKeys, setApiKeys, onClose }) => {
    const [newProvider, setNewProvider] = useState<ModelProvider>('Google Gemini');
    const [newModel, setNewModel] = useState<string>(AVAILABLE_MODELS['Google Gemini'][0]);
    const [newKey, setNewKey] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleProviderChange = (provider: ModelProvider) => {
        setNewProvider(provider);
        setNewModel(AVAILABLE_MODELS[provider][0]); // Imposta il primo modello della lista come default
    };

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
            model: newModel,
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
                key.id === id ? { ...key, isActive: !key.isActive } : key
            )
        );
    };
    
    const maskKey = (key: string) => {
        if (key.length < 8) return '********';
        return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
    }

    return (
        <div className="container py-4">
            <header className="mb-4">
                 <button onClick={onClose} className="btn btn-link text-decoration-none ps-0 mb-3">
                    <i className="bi bi-arrow-left me-2"></i>
                    Back to Generator
                </button>
                <h1 className="h2 fw-bold">Manage AI Models</h1>
                <p className="text-muted">
                    Add and configure API keys for different models to power the generator.
                </p>
            </header>

            <div className="row g-4">
                <div className="col-lg-4">
                    <div className="card shadow-sm">
                      <div className="card-body p-4">
                        <h2 className="h5 card-title d-flex align-items-center gap-2 mb-3">
                            <i className="bi bi-key-fill"></i>
                            Add New API Key
                        </h2>
                        <form onSubmit={handleAddKey} className="space-y-4">
                            {error && <p className="text-danger small">{error}</p>}
                            <div className="mb-3">
                                <label htmlFor="model-provider" className="form-label">Model Provider</label>
                                <select
                                    id="model-provider"
                                    value={newProvider}
                                    onChange={(e) => handleProviderChange(e.target.value as ModelProvider)}
                                    className="form-select"
                                >
                                    {MODEL_PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div className="mb-3">
                                <label htmlFor="model-version" className="form-label">Model Version</label>
                                <select
                                    id="model-version"
                                    value={newModel}
                                    onChange={(e) => setNewModel(e.target.value)}
                                    className="form-select"
                                >
                                    {AVAILABLE_MODELS[newProvider].map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div className="mb-3">
                                <label htmlFor="api-key" className="form-label">API Key</label>
                                <input
                                    id="api-key"
                                    type="password"
                                    value={newKey}
                                    onChange={(e) => setNewKey(e.target.value)}
                                    placeholder="Paste your API key here"
                                    className="form-control"
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary w-100"
                            >
                                Save Key
                            </button>
                        </form>
                      </div>
                    </div>
                </div>

                <div className="col-lg-8">
                    <div className="card shadow-sm">
                       <div className="card-body p-4">
                        <h2 className="h5 card-title mb-3">Saved Keys</h2>
                        <div className="vstack gap-3">
                            {apiKeys.length > 0 ? (
                                apiKeys.map(apiKey => (
                                    <div key={apiKey.id} className="p-3 border rounded-3 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
                                        <div className="flex-grow-1">
                                            <p className="fw-semibold mb-0">{apiKey.provider}</p>
                                            <p className="small text-body-secondary font-monospace mb-0" title={apiKey.model}>{apiKey.model}</p>
                                            <p className="small text-muted font-monospace mb-0">{maskKey(apiKey.key)}</p>
                                        </div>
                                        <div className="d-flex align-items-center gap-4">
                                            <div className="form-check form-switch d-flex align-items-center gap-2">
                                                <input className="form-check-input" type="checkbox" role="switch" id={`toggle-${apiKey.id}`} checked={apiKey.isActive} onChange={() => handleToggleActive(apiKey.id)} />
                                                <label className="form-check-label" htmlFor={`toggle-${apiKey.id}`}>Active</label>
                                            </div>
                                            <button onClick={() => handleDeleteKey(apiKey.id)} className="btn btn-sm btn-outline-danger" aria-label="Delete API Key">
                                                <i className="bi bi-trash-fill"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center p-4 border border-dashed rounded-3">
                                    <p className="text-muted mb-0">No API keys saved yet. Add one to get started.</p>
                                </div>
                            )}
                        </div>
                        <div className="alert alert-secondary mt-4 mb-0 small">
                            <strong className="fw-semibold">Note:</strong> You can activate multiple models simultaneously. The generator will use all active models to synthesize a more comprehensive report. For best results, include Google Gemini for its web search and synthesis capabilities.
                        </div>
                       </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModelsPage;