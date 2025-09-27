import type { ManualData, DetailLevel, ApiKey } from '../types';
import apiClient from './apiClient';
import axios from 'axios';

export async function generateManual(
    activeKeys: ApiKey[],
    topic: string,
    language: string,
    detailLevel: DetailLevel
): Promise<ManualData> {
    if (activeKeys.length === 0) {
        throw new Error("No active API keys found. Please select one or more active keys in the Models settings.");
    }
    if (!topic || topic.trim() === '') {
        throw new Error("Topic cannot be empty.");
    }
    if (!language || language.trim() === '') {
        throw new Error("Language cannot be empty.");
    }

    try {
        const response = await apiClient.post<ManualData>('api/generate.php', {
            topic,
            language,
            detailLevel,
            activeKeys,
        });

        if (!response.data || !response.data.content) {
            throw new Error("Failed to generate content. The response from the backend was empty.");
        }

        return response.data;
    } catch (error) {
        console.error("Error generating manual via backend:", error);
        if (axios.isAxiosError(error)) {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                const errorMessage = error.response.data?.message || `The backend responded with status ${error.response.status}.`;
                throw new Error(`Backend Error: ${errorMessage}`);
            } else if (error.request) {
                // The request was made but no response was received
                throw new Error('Could not connect to the backend service. Please check your network connection and if the server is running.');
            } else {
                // Something happened in setting up the request that triggered an Error
                throw new Error(`An error occurred while communicating with the backend: ${error.message}`);
            }
        }
        if (error instanceof Error) {
           throw new Error(`An error occurred: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the manual.");
    }
}