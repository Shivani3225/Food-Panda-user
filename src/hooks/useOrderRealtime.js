import { useEffect, useRef, useContext } from 'react';
import {
  joinOrderRoom,
  leaveOrderRoom,
  onSocketEvent,
  isSocketConnected,
  subscribeSocketConnect,
} from '../services/realtime/socketClient';
import { AuthContext, useAuth } from '../context/AuthContext';

const toId = value => (value?.toString ? value.toString() : String(value || ''));

export const useOrderRealtime = (orderId, handlers = {}) => {
  const authContext = useAuth() || {};
  const isAuthenticated = authContext?.isAuthenticated || false;
  const realtimeReady = authContext?.realtimeReady || false;

  
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!orderId || !isAuthenticated || !realtimeReady) {
      console.log('[useOrderRealtime] ⏳ Waiting for auth/realtime:', {
        hasOrderId: !!orderId,
        isAuthenticated,
        realtimeReady,
      });
      return;
    }

    if (!isSocketConnected()) {
      console.log('[useOrderRealtime] ⏳ Socket not yet connected, will retry on connect event');
      return;
    }

    const normalizedOrderId = toId(orderId);

    const setupRoom = () => {
      console.log('[useOrderRealtime] 🔌 Joining order room:', normalizedOrderId);
      joinOrderRoom(normalizedOrderId);
    };

    setupRoom();

    const isForCurrentOrder = payload => {
      const eventOrderId = toId(payload?.orderId);
      return !eventOrderId || eventOrderId === normalizedOrderId;
    };

    // Re-join the room automatically after a socket reconnect
    const unsubReconnect = subscribeSocketConnect(() => {
      console.log('[useOrderRealtime] 🔄 Socket reconnected - re-joining order room:', normalizedOrderId);
      setupRoom();
    });

    const subscriptions = [
      onSocketEvent('order:status', payload => {
        if (isForCurrentOrder(payload)) handlersRef.current.onOrderStatus?.(payload);
      }),
      onSocketEvent('order:status_updated', payload => {
        if (isForCurrentOrder(payload)) handlersRef.current.onOrderStatusUpdated?.(payload);
      }),
      onSocketEvent('order:cancelled', payload => {
        if (isForCurrentOrder(payload)) handlersRef.current.onOrderCancelled?.(payload);
      }),
      onSocketEvent('order:rider_assigned', payload => {
        if (isForCurrentOrder(payload)) handlersRef.current.onRiderAssigned?.(payload);
      }),
      onSocketEvent('rider:location', payload => {
        if (isForCurrentOrder(payload)) handlersRef.current.onRiderLocation?.(payload);
      }),
      onSocketEvent('rider:location_updated', payload => {
        if (isForCurrentOrder(payload)) handlersRef.current.onRiderLocation?.(payload);
      }),
      onSocketEvent('notification:new', payload => {
        handlersRef.current.onNotification?.(payload);
      }),
    ].filter(Boolean);

    return () => {
      if (isSocketConnected()) {
        leaveOrderRoom(normalizedOrderId);
      }
      unsubReconnect();
      subscriptions.forEach(unsubscribe => unsubscribe());
    };

  }, [orderId, isAuthenticated, realtimeReady]);
};

