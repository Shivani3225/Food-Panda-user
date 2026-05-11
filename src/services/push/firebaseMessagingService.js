import { PermissionsAndroid, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import messaging from '@react-native-firebase/messaging';
import { removeFcmToken, saveFcmToken } from '../userService';

let foregroundUnsubscribe = null;
let tokenRefreshUnsubscribe = null;

const getFcmFailureReason = error => {
  const message = String(error?.message || error || '').toLowerCase();

  if (message.includes('play services') || message.includes('google play')) {
    return 'play_services_unavailable';
  }

  if (message.includes('permission')) {
    return 'permission_denied';
  }

  if (message.includes('default firebase app') || message.includes('google-services')) {
    return 'firebase_not_configured';
  }

  return 'init_failed';
};

const sanitizeNotificationBody = (body = '') => {
  if (typeof body !== 'string' || !body.includes('{')) {
    return body || '';
  }

  return body.replace(/\{[^{}]*\}/g, match => {
    const keyValueMatch = match.match(/(?:^|[\s,{])(en|de|ar|label|name|title|text|message)\s*:\s*("([^"]*)"|'([^']*)')/i);
    if (keyValueMatch) {
      return keyValueMatch[3] ?? keyValueMatch[4] ?? match;
    }

    const firstQuotedValue = match.match(/"([^"]*)"|'([^']*)'/);
    return firstQuotedValue ? (firstQuotedValue[1] ?? firstQuotedValue[2] ?? match) : match;
  });
};

const normalizeRemoteMessage = remoteMessage => ({
  title: remoteMessage?.notification?.title || 'Notification',
  body: sanitizeNotificationBody(remoteMessage?.notification?.body || ''),
  data: remoteMessage?.data || {},
});

export const initializePushNotifications = async () => {
  try {
    console.log('[FCM] 🔔 Initializing push notifications...');

    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const androidStatus = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      if (androidStatus !== PermissionsAndroid.RESULTS.GRANTED) {
        console.warn('[FCM] ⚠️ Android notification permission denied');
        return { enabled: false, reason: 'permission_denied' };
      }
    }
    
    const permissionStatus = await messaging().requestPermission();
    console.log('[FCM] Permission status:', permissionStatus);
    
    const permissionGranted =
      permissionStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      permissionStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!permissionGranted) {
      console.warn('[FCM] ⚠️ Permission denied');
      return { enabled: false, reason: 'permission_denied' };
    }

    if (Platform.OS !== 'android') {
      await messaging().registerDeviceForRemoteMessages();
      console.log('[FCM] Device registered for remote messages');
    }

    const token = await messaging().getToken();
    console.log('[FCM] 🔑 Token generated:', token?.substring(0, 20) + '...');
    
    if (token) {
      console.log('[FCM] 📤 Syncing token to backend...');
      try {
        await saveFcmToken(token);
        console.log('[FCM] ✅ Token synced to backend successfully');
      } catch (error) {
        console.warn('[FCM] Push notifications disabled:', getFcmFailureReason(error), error?.message || error);
      }
    }

    if (!foregroundUnsubscribe) {
      foregroundUnsubscribe = messaging().onMessage(async remoteMessage => {
        const notif = normalizeRemoteMessage(remoteMessage);
        console.log('[FCM][Toast] Raw foreground message:', JSON.stringify(remoteMessage, null, 2));
        console.log('[FCM][Toast] Normalized payload:', {
          type: 'success',
          text1: notif.title,
          text2: notif.body,
          data: notif.data,
        });
        Toast.show({
          type: 'success',
          text1: notif.title,
          text2: notif.body,
        });
      });
    }

    if (!tokenRefreshUnsubscribe) {
      tokenRefreshUnsubscribe = messaging().onTokenRefresh(async refreshedToken => {
        if (!refreshedToken) {
          return;
        }
        try {
          await saveFcmToken(refreshedToken);
        } catch (error) {
          console.error('[Push] token refresh sync failed', error?.message || error);
        }
      });
    }

    console.log('[FCM] ✅ Push notifications initialized successfully');
    return { enabled: true, token };
  } catch (error) {
    console.warn('[FCM] Push notifications disabled:', getFcmFailureReason(error), error?.message || error);
    return { enabled: false, reason: getFcmFailureReason(error) };
  }
};

export const teardownPushNotifications = async ({ removeRemoteToken = false } = {}) => {
  try {
    if (foregroundUnsubscribe) {
      foregroundUnsubscribe();
      foregroundUnsubscribe = null;
    }

    if (tokenRefreshUnsubscribe) {
      tokenRefreshUnsubscribe();
      tokenRefreshUnsubscribe = null;
    }

    if (removeRemoteToken) {
      try {
        await removeFcmToken();
      } catch (error) {
        console.error('[Push] failed removing token on backend', error?.message || error);
      }

      try {
        await messaging().deleteToken();
      } catch (error) {
        console.error('[Push] failed deleting local FCM token', error?.message || error);
      }
    }
  } catch (error) {
    console.error('[Push] teardown failed', error?.message || error);
  }
};


