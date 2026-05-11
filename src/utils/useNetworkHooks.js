import { useEffect, useState, useCallback, useRef } from 'react';
import { useNetwork } from '../context/NetworkContext';
import {
  retryApiCall,
  detectNetworkQuality,
  checkInternetConnection,
} from './networkUtils';

/**
 * Hook to automatically retry an API call when network is available
 * @param {Function} apiFunction - Async function to retry
 * @param {Object} options - Configuration options
 * @returns {Object} {data, loading, error, retry}
 */
export const useNetworkAwareApiCall = (apiFunction, options = {}) => {
  const { retries = 3, autoRetry = true, logEnabled = true } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isInternetReachable } = useNetwork();

  const executeCall = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isInternetReachable) {
        throw new Error('No internet connection available');
      }

      if (logEnabled) {
        console.log('[useNetworkAwareApiCall] Executing API call...');
      }

      const result = await retryApiCall(apiFunction, retries);
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      if (logEnabled) {
        console.error('[useNetworkAwareApiCall] Error:', err.message);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, isInternetReachable, retries, logEnabled]);

  // Auto-retry when internet comes back online
  useEffect(() => {
    if (autoRetry && isInternetReachable && error) {
      console.log('[useNetworkAwareApiCall] Retrying after reconnection...');
      executeCall();
    }
  }, [isInternetReachable, autoRetry, error, executeCall]);

  return {
    data,
    loading,
    error,
    retry: executeCall,
    isReady: !loading && !error,
  };
};

/**
 * Hook to listen to network quality changes
 * @returns {Object} {quality, isConnected, type}
 */
export const useNetworkQuality = () => {
  const { isOnline, connectionType } = useNetwork();
  const [quality, setQuality] = useState('unknown');
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const detectQuality = async () => {
      try {
        setIsChecking(true);
        const q = await detectNetworkQuality();
        if (isMounted) {
          setQuality(q);
        }
      } catch (error) {
        console.error('[useNetworkQuality] Error:', error);
        if (isMounted) {
          setQuality('unknown');
        }
      } finally {
        setIsChecking(false);
      }
    };

    detectQuality();

    return () => {
      isMounted = false;
    };
  }, [isOnline, connectionType]);

  return {
    quality,
    isChecking,
    isFast: quality === 'fast',
    isSlow: quality === 'slow',
    isOffline: quality === 'offline',
  };
};

/**
 * Hook to detect when connection status changes
 * @param {Function} onConnect - Callback when connection is restored
 * @param {Function} onDisconnect - Callback when connection is lost
 */
export const useConnectionStatusChange = (onConnect, onDisconnect) => {
  const { isOnline } = useNetwork();
  const prevStatusRef = useRef(isOnline);

  useEffect(() => {
    if (isOnline && !prevStatusRef.current) {
      // Changed from offline to online
      if (onConnect) {
        onConnect();
      }
    } else if (!isOnline && prevStatusRef.current) {
      // Changed from online to offline
      if (onDisconnect) {
        onDisconnect();
      }
    }

    prevStatusRef.current = isOnline;
  }, [isOnline, onConnect, onDisconnect]);
};

/**
 * Hook to check if device can make network requests
 * @param {boolean} shouldWait - If true, waits for internet before returning true
 * @returns {Object} {canRequest, isChecking, details}
 */
export const useCanMakeRequest = (shouldWait = false) => {
  const { isOnline } = useNetwork();
  const [canRequest, setCanRequest] = useState(isOnline);
  const [isChecking, setIsChecking] = useState(false);
  const [details, setDetails] = useState({});

  useEffect(() => {
    let isMounted = true;
    let checkInterval;

    const performCheck = async () => {
      try {
        setIsChecking(true);
        const connectionState = await checkInternetConnection();

        if (isMounted) {
          const canMakeReq =
            connectionState.isInternetReachable &&
            connectionState.isConnected;
          setCanRequest(canMakeReq);
          setDetails(connectionState);
        }
      } catch (error) {
        console.error('[useCanMakeRequest] Error:', error);
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    performCheck();

    if (shouldWait && !isOnline) {
      // Poll every 2 seconds if waiting for internet
      checkInterval = setInterval(performCheck, 2000);
    }

    return () => {
      isMounted = false;
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, [isOnline, shouldWait]);

  return {
    canRequest,
    isChecking,
    details,
  };
};

/**
 * Hook to show warning when offline
 * @param {Object} options - Configuration options
 * @returns {Object} {isOffline, showWarning}
 */
export const useOfflineWarning = (options = {}) => {
  const { autoShow = true } = options;
  const { isOffline, pendingRequestCount } = useNetwork();
  const [showWarning, setShowWarning] = useState(isOffline);

  useEffect(() => {
    if (autoShow && isOffline) {
      setShowWarning(true);
    } else if (!isOffline) {
      setShowWarning(false);
    }
  }, [isOffline, autoShow]);

  return {
    isOffline,
    showWarning,
    setShowWarning,
    hasPendingRequests: pendingRequestCount > 0,
    pendingRequestCount,
  };
};

/**
 * Hook to track network state changes with timestamps
 * @returns {Object} Network state with timing information
 */
export const useNetworkTimings = () => {
  const network = useNetwork();
  const [timings, setTimings] = useState({
    lastOnlineTime: Date.now(),
    lastOfflineTime: null,
    totalOfflineTime: 0,
  });

  useEffect(() => {
    setTimings((prev) => {
      if (network.isOnline && prev.lastOfflineTime) {
        // Just came back online
        const offlineTime = Date.now() - prev.lastOfflineTime;
        return {
          lastOnlineTime: Date.now(),
          lastOfflineTime: null,
          totalOfflineTime: prev.totalOfflineTime + offlineTime,
        };
      } else if (!network.isOnline && !prev.lastOfflineTime) {
        // Just went offline
        return {
          ...prev,
          lastOfflineTime: Date.now(),
        };
      }
      return prev;
    });
  }, [network.isOnline]);

  return {
    ...network,
    ...timings,
  };
};

/**
 * Hook to debounce API calls until internet is available
 * @param {Function} apiFunction - Function to call
 * @param {Object} dependencies - useEffect dependencies
 * @returns {Object} {executeAsync, isWaiting, isMakingRequest}
 */
export const useDebouncedNetworkCall = (apiFunction, dependencies = []) => {
  const [isWaiting, setIsWaiting] = useState(false);
  const [isMakingRequest, setIsMakingRequest] = useState(false);
  const { isOnline } = useNetwork();
  const timeoutRef = useRef(null);

  const executeAsync = useCallback(async () => {
    return new Promise((resolve, reject) => {
      const attemptCall = async () => {
        if (isOnline) {
          try {
            setIsMakingRequest(true);
            setIsWaiting(false);
            const result = await apiFunction();
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            setIsMakingRequest(false);
          }
        } else {
          // Wait for internet
          setIsWaiting(true);
          timeoutRef.current = setTimeout(attemptCall, 1000);
        }
      };

      attemptCall();
    });
  }, [apiFunction, isOnline]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    executeAsync,
    isWaiting,
    isMakingRequest,
  };
};
