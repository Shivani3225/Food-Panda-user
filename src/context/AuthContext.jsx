import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkVerificationStatus as checkVerificationStatusApi, loginApi, logoutApi } from '../services/authService';
import Toast from 'react-native-toast-message';
import {
  connectSocket,
  disconnectSocket,
  getSocket,
  onSocketEvent,
} from '../services/realtime/socketClient';
import {
  initializePushNotifications,
  teardownPushNotifications,
} from '../services/push/firebaseMessagingService';
import { updateI18nVariables } from '../locales/i18n';

import { COUNTRIES } from '../utils/countryData';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [realtimeReady, setRealtimeReady] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState('€');
  const [currencyCode, setCurrencyCode] = useState('EUR');
  const socketUnsubscribers = React.useRef([]);

  // Map country code/mobile to currency symbol and code
  const getCurrencyInfo = React.useCallback(() => {
    // 1. Try to get from user.mobile (robust way)
    if (user?.mobile) {
      const mobile = user.mobile.replace('+', '').trim();
      // Sort countries by dialCode length descending to match longest prefix first (e.g., +971 before +9)
      const sortedCountries = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
      
      for (const country of sortedCountries) {
        if (mobile.startsWith(country.dialCode)) {
          console.log(`💰 [AuthContext] Detected country ${country.country} from mobile ${user.mobile}`);
          return { symbol: country.symbol, code: country.currency };
        }
      }
    }

    // 2. Try to get from user.country name
    if (user?.country) {
      const countryName = user.country.toLowerCase();
      const country = COUNTRIES.find(c => c.country.toLowerCase() === countryName);
      if (country) {
        console.log(`💰 [AuthContext] Detected country ${country.country} from name`);
        return { symbol: country.symbol, code: country.currency };
      }
    }

    // Default to Euro if nothing found (since baseURL is .de)
    return { symbol: '€', code: 'EUR' };
  }, [user]);

  useEffect(() => {
    const info = getCurrencyInfo();
    console.log('🌍 [AuthContext] User object:', user);
    console.log('💰 [AuthContext] Applied Currency:', info);
    setCurrencySymbol(info.symbol);
    setCurrencyCode(info.code);
    
    // Update i18n global variables
    updateI18nVariables({ currencySymbol: info.symbol });
    console.log('🌐 [AuthContext] i18n currencySymbol updated to:', info.symbol);
  }, [getCurrencyInfo, user]);

  const cleanupSocketListeners = React.useCallback(() => {
    socketUnsubscribers.current.forEach(unsubscribe => {
      try {
        unsubscribe?.();
      } catch (error) {
        console.error('[AuthContext] socket unsubscribe error', error?.message || error);
      }
    });
    socketUnsubscribers.current = [];
  }, []);

  const setupSocketListeners = React.useCallback(() => {
    cleanupSocketListeners();

    socketUnsubscribers.current = [
      onSocketEvent('connected', payload => {
        console.log('[Socket] server connected payload', payload);
      }),
      onSocketEvent('notification:new', notification => {
        Toast.show({
          type: 'success',
          text1: notification?.title || 'Notification',
          text2: notification?.message || '',
        });
      }),
      onSocketEvent('order:status', payload => {
        Toast.show({
          type: 'success',
          text1: 'Order Update',
          text2: payload?.message || `Status: ${payload?.status || 'updated'}`,
        });
      }),
      onSocketEvent('order:cancelled', payload => {
        Toast.show({
          type: 'error',
          text1: 'Order Cancelled',
          text2: payload?.reason || 'Your order was cancelled',
        });
      }),
    ];
  }, [cleanupSocketListeners]);

  const bootstrapRealtimeAndPush = React.useCallback(async () => {
    console.log('[AuthContext] 🚀 Bootstrapping realtime and push...');

    try {
      await connectSocket();
      setupSocketListeners();
      setRealtimeReady(true);
      console.log('[AuthContext] ✅ Socket ready');
    } catch (error) {
      console.error('[AuthContext] ❌ Socket initialization failed:', error?.message || error);
      setRealtimeReady(false);

      // If the socket self-heals (token was renewed in background), flip
      // realtimeReady to true once the deferred connect event fires.
      const s = getSocket();
      if (s) {
        s.once('connect', () => {
          setupSocketListeners();
          setRealtimeReady(true);
          console.log('[AuthContext] ✅ Socket self-healed and ready');
        });
      }
    }

    const pushResult = await initializePushNotifications();
    if (pushResult?.enabled) {
      console.log('[AuthContext] ✅ Push notifications enabled');
    } else {
      console.warn('[AuthContext] ⚠️ Push notifications disabled:', pushResult?.reason);
    }
  }, [setupSocketListeners]);

  const teardownRealtimeAndPush = React.useCallback(async ({ removeRemoteToken = false } = {}) => {
    cleanupSocketListeners();
    disconnectSocket();
    setRealtimeReady(false);
    await teardownPushNotifications({ removeRemoteToken });
  }, [cleanupSocketListeners]);

  const checkAuthStatus = React.useCallback(async () => {
    try {
      const storedUser = await AsyncStorage.getItem('userData');
      let storedToken = await AsyncStorage.getItem('auth_token');

      if (!storedUser) {
        setUser(null);
        return;
      }

      setUser(JSON.parse(storedUser));

      if (!storedToken) {
        console.warn('⚠️ [AuthContext] No auth token in storage — clearing user session');
        await AsyncStorage.removeItem('userData');
        setUser(null);
        return;
      }

      console.log('✅ [AuthContext] Auth token found in storage');

      await bootstrapRealtimeAndPush();
    } catch (error) {
      setUser(null);
      await AsyncStorage.removeItem('userData');
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  }, [bootstrapRealtimeAndPush]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async (email, password) => {
    try {
      console.log('[AuthContext] 🔐 Login attempt for:', email);
      const response = await loginApi({ email, password });
      console.log('[AuthContext] ✅ Login response received:', response.data);

      const { user: authenticatedUser, token, accessToken } = response.data;

      const authToken = token || accessToken;
      if (authToken) {
        await AsyncStorage.setItem('auth_token', authToken);
        console.log('[AuthContext] ✅ Auth token saved to AsyncStorage:', authToken.substring(0, 20) + '...');

        // Verify it was saved
        const savedToken = await AsyncStorage.getItem('auth_token');
        if (savedToken) {
          console.log('[AuthContext] ✅ Token verified in AsyncStorage');
        } else {
          console.error('[AuthContext] ❌ Token NOT saved in AsyncStorage!');
        }
      }

      if (authenticatedUser) {
        await AsyncStorage.setItem('userData', JSON.stringify(authenticatedUser));
        setUser(authenticatedUser);
        console.log('[AuthContext] ✅ User data saved');

        if (authToken) {
          console.log('[AuthContext] 🚀 Bootstrapping realtime and push...');
          await bootstrapRealtimeAndPush();
        } else {
          console.warn('[AuthContext] ⚠️ No token in login response — cannot connect socket');
        }
        return { success: true };
      }

      return { success: false };
    } catch (error) {
      console.error('[AuthContext] ❌ Login failed:', error?.message);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          'Something went wrong, please try again',
      };
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error('Logout API error:', error);
    }
    await teardownRealtimeAndPush({ removeRemoteToken: true });
    await AsyncStorage.removeItem('userData');
    await AsyncStorage.removeItem('auth_token');
    setUser(null);
  };

  useEffect(() => {
    return () => {
      teardownRealtimeAndPush({ removeRemoteToken: false });
    };
  }, [teardownRealtimeAndPush]);

  const setAuthenticatedUser = async (token, userData) => {
    if (token) {
      await AsyncStorage.setItem('auth_token', token);
    }
    if (userData) {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData);
    }
    if (token) {
      await bootstrapRealtimeAndPush();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        setAuthenticatedUser,
        loading,
        isAuthenticated: !!user,
        isInitialized,
        realtimeReady,
        currencySymbol,
        currencyCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined || context === null) {
    throw new Error('useAuth must be used within an AuthProvider. Check your App.js/App.tsx');
  }
  return context;
};
