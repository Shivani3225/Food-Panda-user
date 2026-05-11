import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CheckCircle, XCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Sound from 'react-native-sound';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SUCCESS_SOUND_SOURCES = [
  { name: 'order_success', basePath: Sound.MAIN_BUNDLE },
  { name: 'order_success.mp3', basePath: Sound.MAIN_BUNDLE },
  { name: 'order_success.mp3', basePath: '' },
  { name: 'order_success.mpeg', basePath: Sound.MAIN_BUNDLE },
];

export default function OrderConfirmedModal({
  visible,
  orderId,
  onViewDetails,
  onExploreMenu,
  status = 'success',
  errorMessage,
}) {
  const { t } = useTranslation();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const successSoundRef = useRef(null);
  const [shouldRender, setShouldRender] = React.useState(false);

  const safeOrderId = useMemo(() => orderId || '—', [orderId]);
  const isSuccess = status === 'success';
  const isFailed = status === 'failed';

  // Get translated error message
  const getErrorMessage = () => {
    if (typeof errorMessage === 'string') {
      // Check if it's a translation key
      if (errorMessage.startsWith('common.') ||
        errorMessage.startsWith('order.') ||
        errorMessage.startsWith('validation.')) {
        return t(errorMessage, errorMessage);
      }
      return errorMessage;
    }
    if (typeof errorMessage === 'object') {
      const currentLang = t('language.code', 'en');
      return errorMessage[currentLang] || errorMessage.en || errorMessage.de || t('order.default_error', 'Unable to place your order. Please try again or contact support.');
    }
    return t('order.default_error', 'Unable to place your order. Please try again or contact support.');
  };

  useEffect(() => {
    if (!visible) {
      setShouldRender(false);
      return undefined;
    }

    overlayOpacity.setValue(0);
    translateY.setValue(SCREEN_HEIGHT);

    requestAnimationFrame(() => {
      setShouldRender(true);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(overlayOpacity, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            stiffness: 220,
            damping: 26,
            mass: 0.9,
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
  }, [overlayOpacity, translateY, visible]);

  useEffect(() => {
    if (visible) return;
    overlayOpacity.setValue(0);
    translateY.setValue(SCREEN_HEIGHT);
  }, [overlayOpacity, translateY, visible]);

  useEffect(() => {
    if (!visible || !isSuccess) return undefined;

    Sound.setCategory('Playback');
    let isCancelled = false;

    const releaseCurrent = () => {
      if (successSoundRef.current) {
        successSoundRef.current.release();
        successSoundRef.current = null;
      }
    };

    const tryPlaySuccessSound = (index = 0) => {
      if (isCancelled || index >= SUCCESS_SOUND_SOURCES.length) {
        if (!isCancelled) {
          console.warn('OrderConfirmedModal: unable to load success sound from all configured sources.');
        }
        return;
      }

      const { name, basePath } = SUCCESS_SOUND_SOURCES[index];
      const successSound = new Sound(name, basePath, error => {
        if (isCancelled) {
          successSound.release();
          return;
        }

        if (error) {
          console.warn(`OrderConfirmedModal: load failed for ${name}`, error);
          successSound.release();
          tryPlaySuccessSound(index + 1);
          return;
        }

        console.log(`OrderConfirmedModal: loaded success sound from ${name}`);
        releaseCurrent();
        successSoundRef.current = successSound;
        successSound.setNumberOfLoops(0);
        successSound.setVolume(1);
        successSound.play(success => {
          if (!success) {
            console.warn(`OrderConfirmedModal: playback callback returned false for ${name}.`);
          }
          console.log(`OrderConfirmedModal: playback completed for ${name}, success=${success}`);
          successSound.release();
          if (successSoundRef.current === successSound) {
            successSoundRef.current = null;
          }
        });
      });
    };

    tryPlaySuccessSound();

    return () => {
      isCancelled = true;
      if (successSoundRef.current) {
        successSoundRef.current.stop(() => {
          successSoundRef.current?.release();
          successSoundRef.current = null;
        });
      }
    };
  }, [visible, isSuccess]);

  if (!shouldRender) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => { }}
    >
      <View style={styles.modalRoot}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.content}>
            <View style={styles.celebrateWrap}>
              {isSuccess ? (
                <Image
                  source={require('../assets/images/Gemini_Generated_Image_5i1lnh5i1lnh5i1l.png')}
                  style={styles.successIcon}
                />
              ) : (
                <XCircle size={48} color="#FF3D3D" strokeWidth={2} />
              )}
            </View>

            <Text style={styles.title}>
              {isSuccess
                ? t('order.order_confirmed', 'Order Confirmed')
                : t('order.order_failed', 'Order Failed')}
            </Text>

            <Text style={styles.subtitle}>
              {isSuccess
                ? "Your order has been successfully confirmed! We are currently processing it and will provide updates on the status shortly. Thank you for choosing us. We're committed to delivering your order with the utmost care and efficiency."
                : getErrorMessage()}
            </Text>

            {isSuccess && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  ID : #{safeOrderId}
                </Text>
              </View>
            )}

            <View style={styles.buttonStack}>
              {isSuccess ? (
                <>
                  <Pressable
                    onPress={onViewDetails}
                    style={({ pressed }) => [
                      styles.primaryBtn,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <Text style={styles.primaryText}>
                      {t('order.view_booking_details', 'View Booking Details')}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={onExploreMenu}
                    style={({ pressed }) => [
                      styles.secondaryBtn,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <Text style={styles.secondaryText}>
                      {t('order.explore_other_menu', 'Explore Other Menu')}
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable
                    onPress={onViewDetails}
                    style={({ pressed }) => [
                      styles.primaryBtn,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <Text style={styles.primaryText}>
                      {t('order.try_again', 'Try Again')}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={onExploreMenu}
                    style={({ pressed }) => [
                      styles.secondaryBtn,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <Text style={styles.secondaryText}>
                      {t('order.go_back', 'Go Back')}
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    minHeight: SCREEN_HEIGHT * 0.7,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 34,
  },
  celebrateWrap: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successIcon: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  errorWrap: {
    backgroundColor: '#FFE5E5',
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111',
  },
  subtitle: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  badge: {
    marginTop: 18,
    backgroundColor: '#FFF1F1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FF3D3D',
  },
  buttonStack: {
    width: '100%',
    marginTop: 28,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FF3D3D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 14,
  },
  secondaryBtn: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FF3D3D',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  secondaryText: {
    color: '#FF3D3D',
    fontWeight: '900',
    fontSize: 14,
  },
  btnPressed: {
    opacity: 0.9,
  },
});