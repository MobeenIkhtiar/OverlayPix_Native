import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { BASEURL } from './Endpoints';
import { onAuthStateChanged } from '@react-native-firebase/auth';
import { auth } from './loginService';

// Track when Firebase auth has finished loading the user
let authReady = false;

const waitForAuthInit = new Promise<void>((resolve) => {
    onAuthStateChanged(auth, () => {
        authReady = true;
        resolve();
    });
});

// Standard user API instance
const api = axios.create({
    baseURL: BASEURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Get Firebase ID token if logged in
const getIdToken = async (forceRefresh = false): Promise<string | null> => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken(forceRefresh);
};

// Axios request interceptor for user API
api.interceptors.request.use(
    async (config) => {
        // Wait until Firebase has loaded the auth state
        if (!authReady) {
            await waitForAuthInit;
        }

        const token = await getIdToken();
        //  console.log('global token =>>>>>>>>>>>', token)
        if (token) {
            config.headers = config.headers || {};
            config.headers['Authorization'] = `Bearer ${token}`;
        } else {
            console.warn('No Firebase token — user might be logged out.');
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * General API service for user endpoints
 */
export const apiService = async <T = unknown>(
    url: string,
    method: AxiosRequestConfig['method'],
    data?: unknown,
    config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
    return api({
        url,
        method,
        data,
        ...config,
    });
};

export default api;