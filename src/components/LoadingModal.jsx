import React, { useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { useTranslation } from 'react-i18next';

export default function LoadingModal({ visible, message }) {
  const { t } = useTranslation();
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const [shouldRender, setShouldRender] = React.useState(false);

  // Get translated message if it's a translation key
  const translatedMessage = message && (message.startsWith('common.') || 
    message.startsWith('cart.') || 
    message.startsWith('order_rating.') ||
    message.startsWith('auth.'))
    ? t(message, message)
    : message || t('common.loading', 'Loading...');

  useEffect(() => {
    if (!visible) {
      setShouldRender(false);
      return undefined;
    }

    opacityAnim.setValue(0);
    scale.setValue(0.8);
    
    requestAnimationFrame(() => {
      setShouldRender(true);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            stiffness: 220,
            damping: 20,
            useNativeDriver: true,
          }),
        ]).start();
      });
    });

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true,
    );
    return () => backHandler.remove();
  }, [visible, opacityAnim, scale]);

  if (!shouldRender) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      hardwareAccelerated
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
          <ActivityIndicator size="large" color="#E41C26" />
          <Text style={styles.message}>{translatedMessage}</Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  message: {
    marginTop: 16,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
});