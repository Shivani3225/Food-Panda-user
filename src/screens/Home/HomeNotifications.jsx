import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import useHideTabBar from '../../utils/hooks/useHideTabBar';

const HomeNotifications = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  useHideTabBar(navigation);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Image
              source={require('../../assets/icons/Backarrow.png')}
              style={styles.backIcon}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('notifications.title', 'Notifications')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.emptyState}>
          <Image
            source={require('../../assets/icons/bell.png')}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>{t('notifications.empty_title', 'No notifications yet')}</Text>
          <Text style={styles.emptyText}>
            {t('notifications.empty_message', 'You\'ll see order updates, offers, and important alerts here.')}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default HomeNotifications;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  headerSpacer: {
    width: 32,
    height: 32,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: 0.2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: -28,
  },
  emptyIcon: {
    width: 46,
    height: 46,
    resizeMode: 'contain',
    opacity: 0.4,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#8E8E93',
    textAlign: 'center',
  },
});