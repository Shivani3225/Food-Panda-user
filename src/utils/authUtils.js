/**
 * API Client Utilities for Auth Integration
 * 
 * CRITICAL: Ensure your apiClient includes the token in every request header
 * 
 * Usage in apiClient.js:
 * 
 *   import { getAuthToken } from '../services/storage';
 *   
 *   // Add interceptor to include token in every request
 *   apiClient.interceptors.request.use(async (config) => {
 *     const token = await getAuthToken();
 *     if (token) {
 *       config.headers.Authorization = `Bearer ${token}`;
 *     }
 *     return config;
 *   });
 *   
 *   // Handle 401 responses (unauthorized)
 *   apiClient.interceptors.response.use(
 *     response => response,
 *     error => {
 *       if (error.response?.status === 401) {
 *         // Token expired or invalid
 *         // In production: implement token refresh
 *         // For now: force logout
 *         clearAuth();
 *       }
 *       return Promise.reject(error);
 *     }
 *   );
 */

export const setupAuthInterceptors = (apiClient, authContext) => {
  /**
   * Request interceptor: Add token to every API request
   */
  apiClient.interceptors.request.use(
    async (config) => {
      const token = authContext?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  /**
   * Response interceptor: Handle 401 unauthorized responses
   * 
   * When token is invalid or expired:
   * 1. Clear auth state
   * 2. Trigger logout
   * 3. Redirect to LoginScreen
   */
  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        console.warn('API returned 401 - Token invalid or expired');
        
        // Logout user
        if (authContext?.logout) {
          await authContext.logout();
        }
      }
      return Promise.reject(error);
    }
  );
};

/**
 * Example: How to integrate with your apiClient
 * 
 * In your App.tsx or AppNavigator:
 * 
 *   import { useAuth } from './src/context/AuthContext';
 *   import { setupAuthInterceptors } from './src/utils/authUtils';
 *   import apiClient from './src/config/apiClient';
 *   
 *   export default function AppNavigator() {
 *     const auth = useAuth();
 *     
 *     useEffect(() => {
 *       setupAuthInterceptors(apiClient, auth);
 *     }, [auth.token]); // Re-setup when token changes
 *     
 *     // ... rest of navigator
 *   }
 */
