import NetInfo from '@react-native-community/netinfo';
import { BASE_URL } from '../config/api';

/**
 * Check if device has internet connectivity
 */
export const checkInternetConnectivity = async () => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable;
  } catch (error) {
    console.error('Error checking internet connectivity:', error);
    return false;
  }
};

/**
 * Check if backend server is reachable
 */
export const checkBackendConnectivity = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${BASE_URL}/api/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('Backend health check failed:', error?.message);
    return false;
  }
};

/**
 * Check overall network status
 */
export const checkNetworkStatus = async () => {
  const isConnected = await checkInternetConnectivity();
  if (!isConnected) {
    return {
      status: 'no-internet',
      message: 'No internet connection. Please check your network.',
      isOnline: false,
    };
  }

  const backendReachable = await checkBackendConnectivity();
  if (!backendReachable) {
    return {
      status: 'backend-unreachable',
      message: 'Backend server is not responding. Please try again later.',
      isOnline: true,
      backendUrl: BASE_URL,
    };
  }

  return {
    status: 'online',
    message: 'Connected',
    isOnline: true,
  };
};
