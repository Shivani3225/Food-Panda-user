import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNetwork } from '../context/NetworkContext';

const OfflineBanner = () => {
  const { t } = useTranslation();
  const { isInternetReachable } = useNetwork();
  const [showBanner, setShowBanner] = useState(!isInternetReachable);
  const [slideAnim] = useState(new Animated.Value(isInternetReachable ? -80 : 0));

  useEffect(() => {
    if (!isInternetReachable && !showBanner) {
      setShowBanner(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else if (isInternetReachable && showBanner) {
      Animated.timing(slideAnim, {
        toValue: -80,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        setShowBanner(false);
      });
    }
  }, [isInternetReachable, showBanner, slideAnim]);

  if (!showBanner) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>⚠️</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{t('offline.no_connection', 'No Connection')}</Text>
          <Text style={styles.subtitle}>{t('offline.check_connection', 'Check your internet connection')}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FF3B30',
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },
});

export default OfflineBanner;