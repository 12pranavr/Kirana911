import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://kirana911.onrender.com/api',
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
    async (config) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                config.headers.Authorization = `Bearer ${session.access_token}`;
            }
        } catch (error) {
            console.error('Error getting session:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;