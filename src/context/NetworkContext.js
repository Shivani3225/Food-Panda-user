import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  subscribeToNetworkChanges,
  onNetworkReconnected,
  showNetworkToast,
  getPendingRequests,
  getPendingRequestCount,
  clearPendingRequests,
  initializePendingRequests,
  detectNetworkQuality,
  checkInternetConnection,
} from '../utils/networkUtils';

export const NetworkContext = createContext();


export const NetworkProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);
  const [connectionType, setConnectionType] = useState('unknown');
  const [isNetworkReconnecting, setIsNetworkReconnecting] = useState(false);
  const [networkQuality, setNetworkQuality] = useState('unknown');
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [lastReconnectTime, setLastReconnectTime] = useState(null);

  const connectionTypeRef = useRef(null);
  const wasOfflineRef = useRef(false);

 
  useEffect(() => {
    const initializeNetwork = async () => {
      try {
        await initializePendingRequests();
        setPendingRequestCount(getPendingRequestCount());

     
        const initialState = await checkInternetConnection();
        setIsConnected(initialState.isConnected);
        setIsInternetReachable(initialState.isInternetReachable);
        setConnectionType(initialState.type);


        const quality = await detectNetworkQuality();
        setNetworkQuality(quality);

        console.log('[Network] Provider initialized:', initialState);
      } catch (error) {
        console.error('[Network] Error initializing provider:', error);
      }
    };

    initializeNetwork();
  }, []);

 
  useEffect(() => {
    const unsubscribe = subscribeToNetworkChanges(async (networkState) => {
      const prevInternetReachable = isInternetReachable;

      setIsConnected(networkState.isConnected);
      setIsInternetReachable(networkState.isInternetReachable);
      setConnectionType(networkState.type);

     
      if (networkState.isInternetReachable) {
        const quality = await detectNetworkQuality();
        setNetworkQuality(quality);
      } else {
        setNetworkQuality('offline');
      }

      
      if (
        prevInternetReachable !== undefined &&
        prevInternetReachable !== networkState.isInternetReachable
      ) {
        showNetworkToast(networkState.isInternetReachable);
      }

      console.log('[Network] State changed:', {
        isConnected: networkState.isConnected,
        isInternetReachable: networkState.isInternetReachable,
        type: networkState.type,
        quality: networkState.isInternetReachable ? 'detecting...' : 'offline',
      });
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isInternetReachable]);

  
  useEffect(() => {
    const unsubscribeReconnect = onNetworkReconnected(async () => {
      console.log('[Network] Connection restored, retrying pending requests...');
      setIsNetworkReconnecting(true);
      setLastReconnectTime(new Date());

      try {
        
        const pendingReqs = getPendingRequests();
        console.log(
          `[Network] Found ${pendingReqs.length} pending requests to retry`,
        );

        if (pendingReqs.length > 0) {
       
          showNetworkToast(true);

          
          let successCount = 0;
          for (const request of pendingReqs) {
            try {
              if (request.apiFunction) {
                await request.apiFunction();
                successCount++;
                console.log(
                  `[Network] Pending request retried successfully: ${request.id}`,
                );
              }
            } catch (error) {
              console.warn(
                `[Network] Failed to retry request ${request.id}:`,
                error.message,
              );
            }
          }

          console.log(
            `[Network] Retry complete: ${successCount}/${pendingReqs.length} successful`,
          );

         
          await clearPendingRequests();
          setPendingRequestCount(0);
        }
      } finally {
        setIsNetworkReconnecting(false);
      }
    });

    return () => {
      if (unsubscribeReconnect) {
        unsubscribeReconnect();
      }
    };
  }, []);

  
  useEffect(() => {
    const interval = setInterval(() => {
      setPendingRequestCount(getPendingRequestCount());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const value = {
    
    isConnected,
    isInternetReachable,
    connectionType,
    isOffline: !isInternetReachable,
    isOnline: isInternetReachable,

    
    networkQuality,

    
    isNetworkReconnecting,
    pendingRequestCount,
    lastReconnectTime,

    
    getPendingRequests,
    clearPendingRequests,
  };

  return (
    <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
  );
};


export const useNetwork = () => {
  const context = React.useContext(NetworkContext);

  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }

  return context;
};
