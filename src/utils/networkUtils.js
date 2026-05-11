import NetInfo from '@react-native-community/netinfo';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_REQUESTS_STORAGE_KEY = '@pending_requests';
const MAX_RETRY_ATTEMPTS = 5;
const STORAGE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours

// In-memory cache for pending API calls
let pendingRequests = [];
let requestDedupeMap = new Map();

/**
 * Initialize pending requests from storage on app start
 */
export const initializePendingRequests = async () => {
  try {
    const stored = await AsyncStorage.getItem(PENDING_REQUESTS_STORAGE_KEY);
    if (stored) {
      const requests = JSON.parse(stored);
      // Filter out expired requests (older than 24 hours)
      const now = Date.now();
      const validRequests = requests.filter(
        (req) => now - req.timestamp < STORAGE_EXPIRY_TIME
      );

      if (validRequests.length > 0) {
        console.log(
          `[Network] Loaded ${validRequests.length} pending requests from storage`,
        );
        pendingRequests = validRequests;
      }

      // Clean up storage
      if (validRequests.length !== requests.length) {
        await savePendingRequestsToStorage(validRequests);
      }
    }
  } catch (error) {
    console.error('[Network] Error loading pending requests:', error);
  }
};

/**
 * Save pending requests to AsyncStorage for persistence
 */
const savePendingRequestsToStorage = async (requests) => {
  try {
    if (requests.length === 0) {
      await AsyncStorage.removeItem(PENDING_REQUESTS_STORAGE_KEY);
    } else {
      // Don't store function references, only config
      const serializableRequests = requests.map((req) => ({
        id: req.id,
        config: req.config,
        timestamp: req.timestamp,
        retryCount: req.retryCount || 0,
      }));
      await AsyncStorage.setItem(
        PENDING_REQUESTS_STORAGE_KEY,
        JSON.stringify(serializableRequests),
      );
    }
  } catch (error) {
    console.error('[Network] Error saving pending requests:', error);
  }
};

/**
 * Check current internet connection status with detailed info
 */
export const checkInternetConnection = async () => {
  try {
    const state = await NetInfo.fetch();
    return {
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
      isExpensive: state.isExpensive,
      details: state.details,
    };
  } catch (error) {
    console.error('[Network] Error checking connection:', error);
    return {
      isConnected: false,
      isInternetReachable: false,
      type: 'none',
      isExpensive: false,
    };
  }
};

/**
 * Detect network quality/speed
 * @returns {Promise<string>} 'fast' | 'slow' | 'unknown'
 */
export const detectNetworkQuality = async () => {
  try {
    const state = await NetInfo.fetch();

    if (!state.isConnected || !state.isInternetReachable) {
      return 'offline';
    }

    // Estimate based on connection type
    switch (state.type) {
      case 'wifi':
      case 'ethernet':
        return 'fast';
      case '5g':
        return 'fast';
      case '4g':
        return 'slow';
      case '3g':
        return 'slow';
      case '2g':
        return 'slow';
      default:
        return 'unknown';
    }
  } catch (error) {
    console.warn('[Network] Error detecting network quality:', error);
    return 'unknown';
  }
};

/**
 * Subscribe to network state changes
 */
export const subscribeToNetworkChanges = (callback) => {
  const unsubscribe = NetInfo.addEventListener((state) => {
    const networkState = {
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
      isExpensive: state.isExpensive,
    };
    callback(networkState);
  });

  return unsubscribe;
};

/**
 * Generate unique request ID for deduplication
 */
const generateRequestId = (config) => {
  const key = `${config.method?.toUpperCase()}_${config.url}`;
  return key;
};

/**
 * Add API call to pending requests queue with deduplication
 */
export const addPendingRequest = (requestConfig, apiFunction) => {
  const requestId = generateRequestId(requestConfig);

  // Avoid duplicate requests
  if (requestDedupeMap.has(requestId)) {
    console.log(`[Network] Duplicate request ignored: ${requestId}`);
    return;
  }

  const request = {
    id: requestId,
    config: requestConfig,
    apiFunction,
    timestamp: Date.now(),
    retryCount: 0,
  };

  pendingRequests.push(request);
  requestDedupeMap.set(requestId, true);

  console.log(`[Network] Added pending request: ${requestId}`);

  // Persist to storage
  savePendingRequestsToStorage(pendingRequests);
};

/**
 * Get all pending requests
 */
export const getPendingRequests = () => {
  return [...pendingRequests];
};

/**
 * Get count of pending requests
 */
export const getPendingRequestCount = () => {
  return pendingRequests.length;
};

/**
 * Clear all pending requests
 */
export const clearPendingRequests = async () => {
  pendingRequests = [];
  requestDedupeMap.clear();
  try {
    await AsyncStorage.removeItem(PENDING_REQUESTS_STORAGE_KEY);
  } catch (error) {
    console.error('[Network] Error clearing storage:', error);
  }
};

/**
 * Remove a specific pending request
 */
export const removePendingRequest = async (requestConfig) => {
  const requestId = generateRequestId(requestConfig);
  pendingRequests = pendingRequests.filter((req) => req.id !== requestId);
  requestDedupeMap.delete(requestId);

  await savePendingRequestsToStorage(pendingRequests);
};

/**
 * Increment retry count for a request
 */
export const incrementRetryCount = async (requestConfig) => {
  const requestId = generateRequestId(requestConfig);
  const request = pendingRequests.find((req) => req.id === requestId);

  if (request) {
    request.retryCount = (request.retryCount || 0) + 1;
    await savePendingRequestsToStorage(pendingRequests);
    return request.retryCount;
  }

  return 0;
};

/**
 * Retry API call with exponential backoff + jitter
 */
export const retryApiCall = async (
  apiFunction,
  retries = 3,
  baseDelay = 1000,
) => {
  let lastError;

  for (let i = 0; i < retries; i++) {
    try {
      const { isInternetReachable } = await checkInternetConnection();

      if (!isInternetReachable) {
        throw new Error('No internet connection');
      }

      const result = await apiFunction();
      console.log(`[Network] API call successful on attempt ${i + 1}`);
      return result;
    } catch (error) {
      lastError = error;
      console.warn(
        `[Network] Retry attempt ${i + 1}/${retries} failed:`,
        error.message,
      );

      if (i < retries - 1) {
        // Exponential backoff with jitter: delay * 2^i + random(0, delay)
        const exponentialDelay = baseDelay * Math.pow(2, i);
        const jitter = Math.random() * baseDelay;
        const totalDelay = exponentialDelay + jitter;

        console.log(
          `[Network] Waiting ${Math.round(totalDelay)}ms before retry...`,
        );
        await new Promise((resolve) => setTimeout(resolve, totalDelay));
      }
    }
  }

  throw lastError;
};

/**
 * Execute callback when internet is restored
 */
export const onNetworkReconnected = (callback) => {
  let wasOffline = false;

  const unsubscribe = subscribeToNetworkChanges((state) => {
    if (wasOffline && state.isInternetReachable) {
      wasOffline = false;
      console.log('[Network] Connection restored');
      callback();
    } else if (!state.isInternetReachable) {
      wasOffline = true;
    }
  });

  return unsubscribe;
};

/**
 * Show network status toast
 */
export const showNetworkToast = (isOnline) => {
  if (isOnline) {
    Toast.show({
      type: 'success',
      position: 'top',
      text1: '🟢 Back Online',
      text2: 'Connection restored successfully',
      duration: 3000,
    });
  } else {
    Toast.show({
      type: 'error',
      position: 'top',
      text1: '🔴 No Connection',
      text2: 'Check your internet connection',
      duration: 3000,
    });
  }
};

/**
 * Format byte size to human readable
 */
export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};
