import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Create this icon file or use any image
const ICONS = {
  stripe: require('../assets/icons/stripe.png'), // Make sure this file exists
};

const getMethods = (t) => ({
  stripe: { 
    id: 'stripe', 
    label: t('payment.card_payment', 'Credit / Debit Card'),
    description: t('payment.pay_online', 'Pay securely with Stripe'),
    icon: ICONS.stripe 
  },
  cod: { 
    id: 'cod', 
    label: t('payment.cash_on_delivery', 'Cash on Delivery'),
    description: t('payment.pay_at_delivery', 'Pay when you receive your order')
  },
});

export default function PaymentMethodSheet({
  visible,
  selectedId,
  onClose,
  onApply,
  onStripePayment,
  isProcessingStripe = false,
}) {
  const { t } = useTranslation();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(false);
  const [localId, setLocalId] = useState(selectedId ?? null);

  const METHODS = useMemo(() => getMethods(t), [t]);

  // Reset localId when modal opens or selectedId changes
  useEffect(() => {
    if (visible) {
      setLocalId(selectedId ?? null);
    }
  }, [selectedId, visible]);

  useEffect(() => {
    if (!visible) {
      setShouldRender(false);
      return;
    }
    
    overlayOpacity.setValue(0);
    translateY.setValue(SCREEN_HEIGHT);
    
    requestAnimationFrame(() => {
      setShouldRender(true);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(overlayOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            stiffness: 220,
            damping: 28,
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

  const canApply = !!localId;

  const handleApply = () => {
    if (!canApply) return;
    
    // Find the selected method object
    const selectedMethod = localId === METHODS.stripe.id ? METHODS.stripe : METHODS.cod;
    
    // Always just save the selected method and close the sheet.
    // Actual payment processing happens when the user presses "Place Order".
    onApply?.(selectedMethod);
  };

  if (!shouldRender) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.8}
            style={styles.closeFloating}
            disabled={isProcessingStripe}
          >
            <Text style={styles.closeFloatingText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>{t('payment.payment_method', 'Payment Method')}</Text>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Stripe / Card Payment Option */}
            <TouchableOpacity
              style={styles.paymentOption}
              onPress={() => !isProcessingStripe && setLocalId(METHODS.stripe.id)}
              activeOpacity={0.9}
              disabled={isProcessingStripe}
            >
              <View
                style={[
                  styles.radioOuter,
                  localId === METHODS.stripe.id && styles.radioOuterActive,
                ]}
              >
                {localId === METHODS.stripe.id && <View style={styles.radioInner} />}
              </View>
              <View style={styles.optionContent}>
                <View style={styles.optionHeader}>
                  {METHODS.stripe.icon && (
                    <Image source={METHODS.stripe.icon} style={styles.icon} />
                  )}
                  <Text style={styles.optionTitle}>{METHODS.stripe.label}</Text>
                </View>
                <Text style={styles.optionDescription}>
                  {METHODS.stripe.description}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Cash on Delivery Option */}
            <TouchableOpacity
              style={styles.paymentOption}
              onPress={() => !isProcessingStripe && setLocalId(METHODS.cod.id)}
              activeOpacity={0.9}
              disabled={isProcessingStripe}
            >
              <View
                style={[
                  styles.radioOuter,
                  localId === METHODS.cod.id && styles.radioOuterActive,
                ]}
              >
                {localId === METHODS.cod.id && <View style={styles.radioInner} />}
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{METHODS.cod.label}</Text>
                <Text style={styles.optionDescription}>
                  {METHODS.cod.description}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={{ height: 96 }} />
          </ScrollView>

          <View style={styles.bottomBar}>
            <TouchableOpacity
              onPress={handleApply}
              style={[
                styles.primaryBtn,
                (!canApply || isProcessingStripe) && styles.primaryBtnDisabled,
              ]}
              activeOpacity={0.9}
              disabled={!canApply || isProcessingStripe}
            >
              {isProcessingStripe ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.primaryText}>{t('common.apply', 'Apply')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    maxHeight: SCREEN_HEIGHT * 0.82,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'visible',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 12,
  },
  title: { fontSize: 16, fontWeight: '900', color: '#111' },
  closeFloating: {
    position: 'absolute',
    top: -50,
    alignSelf: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeFloatingText: { fontSize: 18, color: '#111' },
  content: { padding: 16 },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    backgroundColor: '#FFF',
    marginBottom: 16,
  },
  optionContent: { flex: 1, marginLeft: 12 },
  optionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  optionTitle: { fontWeight: '700', color: '#111', fontSize: 14 },
  optionDescription: { fontSize: 12, color: '#777', marginTop: 2, lineHeight: 16 },
  icon: { width: 24, height: 24, resizeMode: 'contain', marginRight: 8 },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  radioOuterActive: { borderColor: '#FF3D3D' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF3D3D' },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderColor: '#EEE',
    padding: 16,
  },
  primaryBtn: { height: 52, borderRadius: 16, backgroundColor: '#FF3D3D', alignItems: 'center', justifyContent: 'center' },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryText: { color: '#FFF', fontWeight: '900', fontSize: 14 },
});