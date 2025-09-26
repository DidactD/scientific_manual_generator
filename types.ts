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

export interface SavedManual extends ManualData {
    id: string;
    topic: string;
    language: string;
    savedAt: string; // ISO Date string
}
