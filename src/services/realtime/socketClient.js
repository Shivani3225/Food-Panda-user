import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import { BASE_URL } from '../../config/api';

let socketInstance = null;
const eventHandlers = new Map();


let _tokenRenewer = null;

export const setSocketTokenRenewer = (fn) => {
  _tokenRenewer = fn;
};

const getSocketUrl = () => BASE_URL.replace(/\/$/, '');


const getFreshToken = async () => {
  let token = await AsyncStorage.getItem('auth_token');

  if (!token && _tokenRenewer) {
    console.warn('[Socket] ⚠️ No stored token — attempting renewal via cookie…');
    try {
      const { token: renewed } = await _tokenRenewer();
      if (renewed) {
        await AsyncStorage.setItem('auth_token', renewed);
        token = renewed;
        console.log('[Socket] ✅ Token renewed and stored');
      }
    } catch (err) {
      console.error('[Socket] ❌ Token renewal failed:', err?.message || err);
    }
  }

  return token ?? null;
};

export const connectSocket = async () => {
  if (socketInstance?.connected) {
    console.log('[Socket] ✅ Already connected:', socketInstance.id);
    return socketInstance;
  }

  const token = await getFreshToken();
  if (!token) {
    console.error('[Socket] ❌ No auth token available');
    throw new Error('No auth token available for socket connection');
  }

  const socketUrl = getSocketUrl();
  console.log('[Socket] 🔌 Connecting to:', socketUrl);
  console.log('[Socket] 🔑 Using token:', token.substring(0, 20) + '...');

  if (socketInstance && !socketInstance.connected) {
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
  }

  socketInstance = io(socketUrl, {

    transports: ['polling', 'websocket'],
    autoConnect: true,
    auth: { token },
    withCredentials: false,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    timeout: 20000,
  });


  socketInstance.io.on('reconnect_attempt', async () => {
    console.log('[Socket] 🔄 Reconnect attempt — refreshing auth token…');
    const freshToken = await getFreshToken();
    if (freshToken) {
      socketInstance.auth = { token: freshToken };
      console.log('[Socket] 🔑 Reconnect token updated:', freshToken.substring(0, 20) + '...');
    }
  });

  socketInstance.on('connect', () => {
    console.log('[Socket] ✅ Connected successfully! ID:', socketInstance.id);
  });

  socketInstance.on('connect_error', async error => {
    const msg = (error?.message || '').toLowerCase();
    const isAuthError =
      msg.includes('jwt') ||
      msg.includes('token') ||
      msg.includes('unauthorized') ||
      msg.includes('authentication') ||
      error?.data?.code === 401;

    if (isAuthError) {
      console.warn('[Socket] 🔑 Auth error on connect — renewing token…', error.message);
      if (_tokenRenewer) {
        try {
          const { token: renewed } = await _tokenRenewer();
          if (renewed) {
            await AsyncStorage.setItem('auth_token', renewed);
            
            socketInstance.auth = { token: renewed };
            console.log('[Socket] ✅ Token renewed after auth error — socket will retry');
          }
        } catch (renewErr) {
          console.error('[Socket] ❌ Token renewal on auth error failed:', renewErr?.message);
        }
      }
    } else {
      console.error('[Socket] ❌ Connection error:', error?.message || error);
    }
  });

  socketInstance.on('disconnect', reason => {
    console.warn('[Socket] ⚠️ Disconnected:', reason);


    if (reason === 'io server disconnect' && _tokenRenewer) {
      getFreshToken().then(freshToken => {
        if (freshToken && socketInstance) {
          socketInstance.auth = { token: freshToken };
          socketInstance.connect();
          console.log('[Socket] 🔄 Reconnecting after server-initiated disconnect');
        }
      });
    }
  });

  socketInstance.onAny((eventName, ...args) => {
    console.log('[Socket] 📥 Received event:', eventName, args);
  });

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Socket connection timed out after 20 s'));
    }, 20000);

    socketInstance.once('connect', () => {
      clearTimeout(timer);
      resolve(socketInstance);
    });

    socketInstance.once('connect_error', err => {
      clearTimeout(timer);
      reject(err);
    });
  });
};

export const getSocket = () => socketInstance;

export const isSocketConnected = () => {
  return socketInstance?.connected === true;
};

export const disconnectSocket = () => {
  if (!socketInstance) {
    return;
  }

  eventHandlers.forEach((handlers, eventName) => {
    handlers.forEach(handler => socketInstance.off(eventName, handler));
  });
  eventHandlers.clear();

  socketInstance.disconnect();
  socketInstance = null;
};

export const onSocketEvent = (eventName, handler) => {
  if (!socketInstance) {
    return () => {};
  }

  socketInstance.on(eventName, handler);

  if (!eventHandlers.has(eventName)) {
    eventHandlers.set(eventName, new Set());
  }
  eventHandlers.get(eventName).add(handler);

  return () => {
    if (!socketInstance) {
      return;
    }
    socketInstance.off(eventName, handler);
    eventHandlers.get(eventName)?.delete(handler);
  };
};

export const emitSocketEvent = (eventName, payload) => {
  if (!socketInstance?.connected) {
    console.warn('[Socket] ⚠️ Cannot emit - not connected:', eventName);
    return false;
  }
  console.log('[Socket] 📤 Emitting:', eventName, payload);
  socketInstance.emit(eventName, payload);
  return true;
};

export const joinOrderRoom = orderId => emitSocketEvent('join:order', orderId);
export const leaveOrderRoom = orderId => emitSocketEvent('leave:order', orderId);


export const subscribeSocketConnect = (handler) => {
  if (!socketInstance) {
    return () => {};
  }
  socketInstance.on('connect', handler);
  return () => {
    socketInstance?.off('connect', handler);
  };
};
