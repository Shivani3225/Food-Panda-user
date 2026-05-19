import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Switch,
  StatusBar,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import useHideTabBar from '../../utils/hooks/useHideTabBar';
import { getNotificationStatus } from '../../services/userService';
import {
  initializePushNotifications,
  teardownPushNotifications,
} from '../../services/push/firebaseMessagingService';
import { useTranslation } from 'react-i18next';

const Item = ({ title, desc, value, onChange }) => (
  <View style={styles.itemCard}>
    <View style={styles.itemContent}>
      <Text style={styles.itemTitle}>{title}</Text>
      <Text style={styles.itemDesc}>{desc}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: '#D1D5DB', true: '#E41C26' }}
      thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
    />
  </View>
);

const NotificationSettings = () => {
  const navigation = useNavigation();
  useHideTabBar(navigation);
  const { t } = useTranslation();

  const [state, setState] = useState({
    order: false,
    promo: false,
    rec: false,
    rem: false,
    app: false,
  });

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const response = await getNotificationStatus();
        const enabled = !!response?.notificationStatus?.notificationsEnabled;
        setState(prev => ({ ...prev, order: enabled }));
      } catch (error) {
        console.error('[NotificationSettings] status load failed', error?.message || error);
      }
    };

    loadStatus();
  }, []);

  const toggleOrderNotifications = async () => {
    const nextState = !state.order;

    try {
      if (nextState) {
        const result = await initializePushNotifications();
        if (!result?.enabled) {
          Toast.show({
            type: 'error',
            text1: t('notifications.permission_required', 'Permission required'),
            text2: t('notifications.enable_permission', 'Enable notification permissions to receive updates'),
          });
          return;
        }
      } else {
        await teardownPushNotifications({ removeRemoteToken: true });
      }

      setState(prev => ({ ...prev, order: nextState }));
      Toast.show({
        type: 'success',
        text1: nextState
          ? t('notifications.enabled', 'Notifications enabled')
          : t('notifications.disabled', 'Notifications disabled'),
        text2: nextState
          ? t('notifications.order_on', 'Order updates will now be delivered in real-time')
          : t('notifications.order_off', 'Order notifications have been turned off'),
      });
    } catch (error) {
      console.error('[NotificationSettings] toggle failed', error?.message || error);
      Toast.show({
        type: 'error',
        text1: t('notifications.update_failed', 'Update failed'),
        text2: t('notifications.update_error', 'Could not update notification preference right now'),
      });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Image
            source={require('../../assets/icons/Backarrow.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('notifications.title', 'Notification Settings')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.container}>
        <Item
          title={t('notifications.order_title', 'Order Updates')}
          desc={t('notifications.order_desc', 'Get real-time alerts about your order status — from kitchen to delivery')}
          value={state.order}
          onChange={toggleOrderNotifications}
        />

        <Item
          title={t('notifications.promo_title', 'Promotions & Offers')}
          desc={t('notifications.promo_desc', 'Stay updated on discounts, coupons, and special deals.')}
          value={state.promo}
          onChange={() => setState({ ...state, promo: !state.promo })}
        />

        <Item
          title={t('notifications.rec_title', 'Recommendations')}
          desc={t('notifications.rec_desc', 'Receive personalized food suggestions based on your taste.')}
          value={state.rec}
          onChange={() => setState({ ...state, rec: !state.rec })}
        />

        <Item
          title={t('notifications.rem_title', 'Reminders')}
          desc={t('notifications.rem_desc', 'Meal-time nudges so you never miss lunch or dinner.')}
          value={state.rem}
          onChange={() => setState({ ...state, rem: !state.rem })}
        />

        <Item
          title={t('notifications.app_title', 'App Updates & News')}
          desc={t('notifications.app_desc', 'Be the first to know about new features and announcements')}
          value={state.app}
          onChange={() => setState({ ...state, app: !state.app })}
        />
      </View>
    </SafeAreaView>
  );
};

export default NotificationSettings;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },

  backIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },

  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    // Subtle shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    // Elevation for Android
    elevation: 2,
  },

  itemContent: {
    flex: 1,
    marginRight: 12,
  },

  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },

  itemDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: '#6B7280',
  },
});
;
