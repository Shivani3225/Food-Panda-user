import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TokenDebugScreen = () => {
  const { t } = useTranslation();
  const [tokenStatus, setTokenStatus] = useState({
    hasToken: false,
    tokenValue: null,
    tokenLength: 0,
    userData: null,
    lastCheck: null,
  });

  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const user = await AsyncStorage.getItem('userData');
      
      setTokenStatus({
        hasToken: !!token,
        tokenValue: token ? token.substring(0, 50) + '...' : t('debug.no_token', 'NO TOKEN'),
        tokenLength: token?.length || 0,
        userData: user ? JSON.parse(user) : null,
        lastCheck: new Date().toLocaleTimeString(),
      });

      console.log('[TokenDebug] Token Check:');
      console.log('  Has Token:', !!token);
      console.log('  Token Length:', token?.length || 0);
      console.log('  User:', user ? JSON.parse(user) : 'NO USER');
    } catch (error) {
      console.error('[TokenDebug] Error:', error);
    }
  };

  const clearToken = async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('userData');
    checkToken();
  };

  useEffect(() => {
    const interval = setInterval(checkToken, 1000);
    checkToken();
    return () => clearInterval(interval);
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔐 {t('debug.token_debug', 'Token Debug')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{t('debug.token_status', 'Token Status')}:</Text>
        <Text style={[styles.value, tokenStatus.hasToken ? styles.success : styles.error]}>
          {tokenStatus.hasToken 
            ? `✅ ${t('debug.present', 'PRESENT')}` 
            : `❌ ${t('debug.missing', 'MISSING')}`}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{t('debug.token_length', 'Token Length')}:</Text>
        <Text style={styles.value}>{tokenStatus.tokenLength} {t('debug.characters', 'characters')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{t('debug.token_preview', 'Token Preview')}:</Text>
        <Text style={styles.code}>{tokenStatus.tokenValue}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{t('debug.user_data', 'User Data')}:</Text>
        {tokenStatus.userData ? (
          <Text style={styles.code}>
            {JSON.stringify(tokenStatus.userData, null, 2)}
          </Text>
        ) : (
          <Text style={[styles.value, styles.error]}>{t('debug.no_user_data', 'NO USER DATA')}</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{t('debug.last_check', 'Last Check')}:</Text>
        <Text style={styles.value}>{tokenStatus.lastCheck}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={checkToken}>
        <Text style={styles.buttonText}>🔄 {t('debug.refresh_now', 'Refresh Now')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={clearToken}>
        <Text style={styles.buttonText}>🗑️ {t('debug.clear_token', 'Clear Token')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  header: {
    paddingVertical: 20,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  value: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'monospace',
  },
  code: {
    fontSize: 11,
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
    fontFamily: 'monospace',
    color: '#333',
  },
  success: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  error: {
    color: '#f44336',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginVertical: 5,
  },
  dangerButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default TokenDebugScreen;