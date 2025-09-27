import apiClient from './apiClient';
import type { User } from '../types';
import axios from 'axios';

interface LoginResponse {
    token: string;
    user: User;
}

export async function login(email: string, password: string): Promise<User> {
    try {
        const response = await apiClient.post<LoginResponse>('api/login.php', { email, password });
        if (response.data && response.data.token && response.data.user) {
            localStorage.setItem('authToken', response.data.token);
            // The interceptor will now pick up the token for subsequent requests
            return response.data.user;
        }
        throw new Error("Invalid response from server during login.");
    } catch (error) {
        console.error("Login failed:", error);
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data.message || "Invalid email or password.");
        }
        throw new Error("An unexpected error occurred during login.");
    }
}

export function logout(): void {
    localStorage.removeItem('authToken');
    // The interceptor will no longer find a token to attach.
}

export function getAuthToken(): string | null {
    return localStorage.getItem('authToken');
}