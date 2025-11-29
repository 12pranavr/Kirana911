import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://kirana911.onrender.com/api',
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
    async (config) => {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
                console.error('Session error:', sessionError);
                return config;
            }
            
            if (session?.access_token) {
                config.headers.Authorization = `Bearer ${session.access_token}`;
                console.log('Token added to request for:', config.url);
            } else {
                console.warn('No access token available for request to:', config.url);
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