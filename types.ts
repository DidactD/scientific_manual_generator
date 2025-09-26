export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface ManualData {
  content: string;
  sources: GroundingChunk[];
}

export type DetailLevel = 'Concise' | 'Standard' | 'Detailed';

export interface SavedManual extends ManualData {
    id: string;
    topic: string;
    language: string;
    detailLevel: DetailLevel;
    savedAt: string; // ISO Date string
}

export type ModelProvider = 'Google Gemini' | 'Anthropic Claude' | 'OpenAI ChatGPT';

export interface ApiKey {
    id: string;
    provider: ModelProvider;
    key: string;
    isActive: boolean;
}
