import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSocket, emitSocketEvent } from '../../services/realtime/socketClient';
import messaging from '@react-native-firebase/messaging';

const RealtimeDebugScreen = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState({
    hasToken: false,
    tokenPreview: '',
    socketConnected: false,
    socketId: null,
    fcmToken: null,
    fcmTokenPreview: '',
    lastUpdate: new Date().toLocaleTimeString(),
  });
  const [refreshing, setRefreshing] = useState(false);

  const checkStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const socket = getSocket();
      
      let fcmToken = null;
      let fcmTokenPreview = t('debug.not_available', 'Not available');
      try {
        fcmToken = await messaging().getToken();
        fcmTokenPreview = fcmToken ? fcmToken.substring(0, 30) + '...' : t('debug.none', 'None');
      } catch (e) {
        fcmTokenPreview = t('debug.error_prefix', 'Error') + ': ' + e.message;
      }

      setStatus({
        hasToken: !!token,
        tokenPreview: token ? token.substring(0, 20) + '...' : t('debug.none', 'None'),
        socketConnected: socket?.connected || false,
        socketId: socket?.id || null,
        fcmToken,
        fcmTokenPreview,
        lastUpdate: new Date().toLocaleTimeString(),
      });
    } catch (error) {
      console.error('Status check error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await checkStatus();
    setRefreshing(false);
  };

  const testSocketEmit = () => {
    const success = emitSocketEvent('test:ping', { timestamp: Date.now() });
    console.log('Test emit result:', success);
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <View style={styles.header}>
        <Text style={styles.title}>🔍 {t('debug.title', 'Realtime Debug Panel')}</Text>
        <Text style={styles.subtitle}>
          {t('debug.last_update', 'Last update')}: {status.lastUpdate}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔐 {t('debug.authentication', 'Authentication')}</Text>
        <StatusRow
          label={t('debug.auth_token', 'Auth Token')}
          value={status.hasToken 
            ? `✅ ${t('debug.present', 'Present')}` 
            : `❌ ${t('debug.missing', 'Missing')}`}
          success={status.hasToken}
          t={t}
        />
        <StatusRow 
          label={t('debug.token_preview', 'Token Preview')} 
          value={status.tokenPreview}
          t={t}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔌 {t('debug.socket_connection', 'Socket.IO Connection')}</Text>
        <StatusRow
          label={t('debug.status', 'Status')}
          value={status.socketConnected 
            ? `✅ ${t('debug.connected', 'Connected')}` 
            : `❌ ${t('debug.disconnected', 'Disconnected')}`}
          success={status.socketConnected}
          t={t}
        />
        <StatusRow
          label={t('debug.socket_id', 'Socket ID')}
          value={status.socketId || t('debug.not_connected', 'Not connected')}
          t={t}
        />
        {status.socketConnected && (
          <TouchableOpacity
            style={styles.testButton}
            onPress={testSocketEmit}>
            <Text style={styles.testButtonText}>🧪 {t('debug.test_socket', 'Test Socket Emit')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔔 {t('debug.fcm', 'Firebase Cloud Messaging')}</Text>
        <StatusRow
          label={t('debug.fcm_token', 'FCM Token')}
          value={status.fcmToken 
            ? `✅ ${t('debug.generated', 'Generated')}` 
            : `❌ ${t('debug.not_available', 'Not available')}`}
          success={!!status.fcmToken}
          t={t}
        />
        <StatusRow 
          label={t('debug.token_preview', 'Token Preview')} 
          value={status.fcmTokenPreview}
          t={t}
        />
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>📋 {t('debug.troubleshooting', 'Troubleshooting')}</Text>
        <Text style={styles.instructionsText}>
          {t('debug.troubleshooting_text', 
            '1. Auth Token missing? → Login again\n' +
            '2. Socket disconnected? → Check backend URL\n' +
            '3. FCM token missing? → Check google-services.json\n' +
            '4. Pull down to refresh status')}
        </Text>
      </View>
    </ScrollView>
  );
};

const StatusRow = ({ label, value, success, t }) => (
  <View style={styles.statusRow}>
    <Text style={styles.statusLabel}>{label}:</Text>
    <Text
      style={[
        styles.statusValue,
        success !== undefined && (success ? styles.success : styles.error),
      ]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 12,
    color: '#e3f2fd',
    marginTop: 5,
  },
  section: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  statusValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  success: {
    color: '#4CAF50',
  },
  error: {
    color: '#f44336',
  },
  testButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 6,
    marginTop: 10,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  instructions: {
    backgroundColor: '#fff3cd',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 20,
  },
});

export default RealtimeDebugScreen;