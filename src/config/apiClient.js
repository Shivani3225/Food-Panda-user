import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './api';
import {
  checkInternetConnection,
  addPendingRequest,
} from '../utils/networkUtils';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true, // Enable cookies for cross-origin requests
});

// Request Interceptor - Add auth token and check network availability
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Check if internet is available before making request
      const { isInternetReachable } = await checkInternetConnection();

      // If no internet, reject the request
      if (!isInternetReachable) {
        const error = new Error('No internet connection');
        error.config = config;
        error.isNetworkError = true;
        console.warn('Request blocked: No internet connection', config.url);
        return Promise.reject(error);
      }

      // Add authorization token if available
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(
          `[API] 📤 Token added to ${config.method?.toUpperCase()} ${config.url}`,
          `Token: ${token.substring(0, 20)}...`
        );
      } else {
        console.warn(`[API] ⚠️ No token found for ${config.method?.toUpperCase()} ${config.url}`);
      }

      console.log(`[API] 📡 Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    } catch (error) {
      console.error('Error in request interceptor:', error);
      return Promise.reject(error);
    }
  },
  (error) => Promise.reject(error),
);

// Response Interceptor - Handle errors and network issues
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Log detailed error information for debugging
    const isNetworkError = !error?.response;
    const status = error?.response?.status;
    const url = error?.config?.url;
    const method = error?.config?.method;
    const responseData = error?.response?.data;
    const errorMessage = responseData?.message || '';

    // Skip detailed logging for "Order already rated" as it is handled locally in UI
    if (errorMessage !== 'Order already rated') {
      console.error('API Error Details:', {
        status,
        url,
        method,
        message: error?.message,
        responseData: responseData,
        isNetworkError,
        baseURL: error?.config?.baseURL,
        timeout: error?.config?.timeout,
      });
    }

    // Handle 401 Unauthorized errors
    if (status === 401) {
      console.error('🚫 [ApiClient] 401 Unauthorized - Token missing or expired');
      
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        console.error('❌ Token exists but backend rejected it. Clearing session...');
        // Clear auth data so the app redirects to login screen
        await AsyncStorage.multiRemove(['auth_token', 'userData']);
      } else {
        console.error('❌ No token in AsyncStorage - user not logged in');
      }
      
      console.error('Session cleared. User needs to log in again.');
    }

    // Handle network errors
    if (isNetworkError || error.isNetworkError) {
      console.error(
        'Network Error: Backend server not responding at',
        error?.config?.baseURL,
      );
      console.error('Check if backend is running and reachable');

      // Add request to pending queue for retry when internet is restored
      if (error?.config && method !== 'GET') {
        console.log('Adding request to pending queue for retry:', url);
        addPendingRequest(error.config, async () => {
          try {
            return await apiClient.request(error.config);
          } catch (retryError) {
            console.warn('Retry failed:', retryError.message);
            throw retryError;
          }
        });
      }
    }

    // ✅ IMPORTANT: Return the original error so downstream can access error.response.status and error.response.data
    return Promise.reject(error);
  },
);

export default apiClient;
