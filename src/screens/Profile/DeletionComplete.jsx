import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  Dimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function AccountDeletedScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { logout } = useAuth();
  const [isDeleting, setIsDeleting] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Show loader for 2 seconds, then show success message
    const loaderTimer = setTimeout(() => {
      setIsDeleting(false);
      // Fade in the success message
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 2000);

    // Navigate to login screen after 3.5 seconds total
    const navigationTimer = setTimeout(async () => {
      try {
        await logout();
      } catch (error) {
        console.error('Logout error after account deletion:', error);
      }
      
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'LoginScreen' }],
        })
      );
    }, 3500);

    // Cleanup timeouts if component unmounts
    return () => {
      clearTimeout(loaderTimer);
      clearTimeout(navigationTimer);
    };
  }, [navigation]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ImageBackground
        source={require('../../assets/images/BgImgRotate.png')}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={styles.centerBlock}>
          {isDeleting ? (
            // Loading State
            <>
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#E41C26" />
              </View>
              <Text style={styles.loadingTitle}>
                {t('account_deleted.deleting_title', 'Deleting Account...')}
              </Text>
              <Text style={styles.loadingSubtitle}>
                {t('account_deleted.deleting_subtitle', 'Please wait while we process your request')}
              </Text>
            </>
          ) : (
            // Success State
            <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
              <Image
                source={require('../../assets/icons/deleteEmoji.png')}
                style={styles.emoji}
              />
              <Text style={styles.title}>
                {t('account_deleted.success_title', 'Account deletion completed.')}
              </Text>
              <Text style={styles.subtitle}>
                {t('account_deleted.success_subtitle', 'We\'re sorry to see you go')}
              </Text>
            </Animated.View>
          )}
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  bg: {
    width: '100%',
    height: '100%',
  },

  centerBlock: {
    position: 'absolute',
    top: 266,
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emoji: {
    width: 56,
    height: 56,
    resizeMode: 'contain',
    marginBottom: 18,
  },

  loaderContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },

  loadingTitle: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },

  loadingSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },

  title: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 22,
    color: '#000000',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 22,
    color: '#000000',
    textAlign: 'center',
    marginTop: 2,
  },
});