import apiClient from '../config/apiClient';
import {
  retryApiCall,
  getPendingRequestCount,
  addPendingRequest,
  checkInternetConnection,
} from './networkUtils';
import Toast from 'react-native-toast-message';

/**
 * API Request Manager - Simplified interface for making network requests
 * Handles retries, offline detection, and error management
 */

/**
 * Make a GET request with automatic retry
 */
export const get = async (url, config = {}) => {
  try {
    const { retries = 3, ...restConfig } = config;

    const response = await retryApiCall(
      () => apiClient.get(url, restConfig),
      retries,
    );

    return {
      data: response.data,
      status: response.status,
      success: true,
    };
  } catch (error) {
    console.error(`[API] GET ${url} failed:`, error.message);
    return {
      data: null,
      error: error.message,
      status: error.response?.status,
      success: false,
    };
  }
};

/**
 * Make a POST request with automatic retry
 */
export const post = async (url, data = {}, config = {}) => {
  try {
    const { retries = 3, ...restConfig } = config;

    const response = await retryApiCall(
      () => apiClient.post(url, data, restConfig),
      retries,
    );

    Toast.show({
      type: 'success',
      text1: '✅ Success',
      text2: 'Request completed',
      duration: 2000,
      position: 'bottom',
    });

    return {
      data: response.data,
      status: response.status,
      success: true,
    };
  } catch (error) {
    console.error(`[API] POST ${url} failed:`, error.message);

    Toast.show({
      type: 'error',
      text1: '❌ Error',
      text2: error.message,
      duration: 3000,
      position: 'bottom',
    });

    return {
      data: null,
      error: error.message,
      status: error.response?.status,
      success: false,
    };
  }
};

/**
 * Make a PUT request with automatic retry
 */
export const put = async (url, data = {}, config = {}) => {
  try {
    const { retries = 3, ...restConfig } = config;

    const response = await retryApiCall(
      () => apiClient.put(url, data, restConfig),
      retries,
    );

    Toast.show({
      type: 'success',
      text1: '✅ Updated',
      text2: 'Changes saved',
      duration: 2000,
      position: 'bottom',
    });

    return {
      data: response.data,
      status: response.status,
      success: true,
    };
  } catch (error) {
    console.error(`[API] PUT ${url} failed:`, error.message);

    Toast.show({
      type: 'error',
      text1: '❌ Error',
      text2: error.message,
      duration: 3000,
      position: 'bottom',
    });

    return {
      data: null,
      error: error.message,
      status: error.response?.status,
      success: false,
    };
  }
};

/**
 * Make a DELETE request with automatic retry
 */
export const remove = async (url, config = {}) => {
  try {
    const { retries = 3, ...restConfig } = config;

    const response = await retryApiCall(
      () => apiClient.delete(url, restConfig),
      retries,
    );

    Toast.show({
      type: 'success',
      text1: '✅ Deleted',
      text2: 'Item removed',
      duration: 2000,
      position: 'bottom',
    });

    return {
      data: response.data,
      status: response.status,
      success: true,
    };
  } catch (error) {
    console.error(`[API] DELETE ${url} failed:`, error.message);

    Toast.show({
      type: 'error',
      text1: '❌ Error',
      text2: error.message,
      duration: 3000,
      position: 'bottom',
    });

    return {
      data: null,
      error: error.message,
      status: error.response?.status,
      success: false,
    };
  }
};

/**
 * Make a request with full control
 */
export const request = async (config = {}) => {
  try {
    const { retries = 3, showToast = true, ...restConfig } = config;

    // Check internet before making request
    const { isInternetReachable } = await checkInternetConnection();
    if (!isInternetReachable) {
      throw new Error('No internet connection');
    }

    const response = await retryApiCall(
      () => apiClient(restConfig),
      retries,
    );

    if (showToast) {
      Toast.show({
        type: 'success',
        text1: '✅ Success',
        duration: 2000,
        position: 'bottom',
      });
    }

    return {
      data: response.data,
      status: response.status,
      success: true,
    };
  } catch (error) {
    console.error('[API] Request failed:', error.message);

    Toast.show({
      type: 'error',
      text1: '❌ Error',
      text2: error.message,
      duration: 3000,
      position: 'bottom',
    });

    return {
      data: null,
      error: error.message,
      status: error.response?.status,
      success: false,
    };
  }
};

/**
 * Batch multiple requests
 */
export const batchRequests = async (requests = []) => {
  try {
    const results = await Promise.all(
      requests.map((req) =>
        retryApiCall(() => apiClient(req), 3).catch((error) => ({
          error,
          success: false,
        })),
      ),
    );

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    if (failed.length === 0) {
      Toast.show({
        type: 'success',
        text1: `✅ ${results.length} requests completed`,
        duration: 2000,
        position: 'bottom',
      });
    } else if (successful.length === 0) {
      Toast.show({
        type: 'error',
        text1: `❌ All ${results.length} requests failed`,
        duration: 3000,
        position: 'bottom',
      });
    } else {
      Toast.show({
        type: 'warning',
        text1: `⚠️ ${successful.length}/${results.length} requests completed`,
        duration: 3000,
        position: 'bottom',
      });
    }

    return {
      results,
      successful: successful.length,
      failed: failed.length,
      success: failed.length === 0,
    };
  } catch (error) {
    console.error('[API] Batch request failed:', error.message);
    return {
      results: [],
      successful: 0,
      failed: requests.length,
      success: false,
      error: error.message,
    };
  }
};

/**
 * Check if there are pending requests
 */
export const hasPendingRequests = () => {
  return getPendingRequestCount() > 0;
};

/**
 * Export all methods as a namespace
 */
export default {
  get,
  post,
  put,
  delete: remove,
  request,
  batchRequests,
  hasPendingRequests,
};
