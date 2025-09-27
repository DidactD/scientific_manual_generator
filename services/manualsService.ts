import apiClient from './apiClient';
import type { SavedManual } from '../types';

export async function getSavedManuals(): Promise<SavedManual[]> {
    const response = await apiClient.get<SavedManual[]>('api/manuals.php');
    return response.data;
}

export async function saveManual(manual: SavedManual): Promise<SavedManual> {
    const response = await apiClient.post<SavedManual>('api/manuals.php', manual);
    return response.data;
}

export async function updateManual(manual: SavedManual): Promise<SavedManual> {
    const response = await apiClient.put<SavedManual>(`api/manuals.php?id=${manual.id}`, manual);
    return response.data;
}

export async function deleteManual(id: string): Promise<void> {
    await apiClient.delete(`api/manuals.php?id=${id}`);
}