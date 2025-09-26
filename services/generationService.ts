import type { ManualData, DetailLevel, ModelProvider, ApiKey, GroundingChunk } from '../types';
import { generateManual as generateWithGemini } from './geminiService';
import { generateManual as generateWithClaude } from './claudeService';
import { generateManual as generateWithOpenAI } from './openAIService';

function dispatchSingleGeneration(
    provider: ModelProvider,
    topic: string,
    language: string,
    detailLevel: DetailLevel,
    apiKey: string
): Promise<ManualData> {
    switch (provider) {
        case 'Google Gemini':
            return generateWithGemini(topic, language, detailLevel, apiKey);
        case 'Anthropic Claude':
            return generateWithClaude(topic, language, detailLevel, apiKey);
        case 'OpenAI ChatGPT':
            return generateWithOpenAI(topic, language, detailLevel, apiKey);
        default:
            return Promise.reject(new Error(`Unsupported model provider: ${provider}`));
    }
}

export async function generateManual(
    activeKeys: ApiKey[],
    topic: string,
    language: string,
    detailLevel: DetailLevel
): Promise<ManualData> {
    if (activeKeys.length === 0) {
        throw new Error("No active API keys found. Please select one or more active keys in the Models settings.");
    }

    if (activeKeys.length === 1) {
        const key = activeKeys[0];
        return dispatchSingleGeneration(key.provider, topic, language, detailLevel, key.key);
    }

    // Multi-model synthesis
    const primaryKey = activeKeys.find(k => k.provider === 'Google Gemini') || activeKeys[0];
    const secondaryKeys = activeKeys.filter(k => k.id !== primaryKey.id);
    
    // Generate drafts from secondary models in parallel
    const secondaryResults = await Promise.all(
        secondaryKeys.map(key =>
            dispatchSingleGeneration(key.provider, topic, language, detailLevel, key.key)
        )
    );

    const additionalContext = secondaryResults
        .map((result, index) => `--- DRAFT FROM ${secondaryKeys[index].provider.toUpperCase()} ---\n\n${result.content}`)
        .join('\n\n');

    let finalResult: ManualData;

    // Generate final manual using primary model, providing context if it's Gemini
    if (primaryKey.provider === 'Google Gemini') {
        finalResult = await generateWithGemini(topic, language, detailLevel, primaryKey.key, additionalContext);
    } else {
        // If primary is not Gemini, it can't use the context, so just do a standard generation.
        // The user is warned via UI text to include Gemini for best results.
        finalResult = await dispatchSingleGeneration(primaryKey.provider, topic, language, detailLevel, primaryKey.key);
    }
    
    // Combine and de-duplicate sources from all models
    const allSources = [...finalResult.sources, ...secondaryResults.flatMap(r => r.sources)];
    const uniqueSources = Array.from(new Map(allSources.filter(s => s.web?.uri).map(s => [s.web!.uri, s])).values());
    finalResult.sources = uniqueSources;

    return finalResult;
}
