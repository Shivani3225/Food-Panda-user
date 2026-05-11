import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
  Dimensions,
  BackHandler,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const CouponDetailsDrawer = ({ visible, coupon, onClose, onUseNow }) => {
  const { t } = useTranslation();
  const { currencySymbol } = useAuth();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = React.useState(false);

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
  }, [visible, overlayOpacity, translateY]);

  if (!coupon) return null;
  if (!shouldRender) return null;

  // Get translated title if titleKey exists
  const couponTitle = coupon?.titleKey 
    ? t(coupon.titleKey, coupon.title)
    : coupon?.title || t('coupon.default_title', 'Special Offer');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        <Animated.View style={[styles.drawer, { transform: [{ translateY }] }]}>
          
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={24} color="#111" />
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            
            <Text style={styles.title}>{couponTitle}</Text>

            
            <Text style={styles.amount}>
              {currencySymbol}{coupon?.amount?.toFixed?.(2) ?? coupon?.amount ?? 0}
            </Text>

            
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                {t('coupon.min_spend', 'Min Spend')} {currencySymbol}{coupon?.minSpend?.toFixed?.(2) ?? coupon?.minSpend ?? 0}
              </Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaText}>
                {t('coupon.use_by', 'Use by')} {coupon?.expires || t('coupon.no_expiry', 'No expiry')}
              </Text>
            </View>

           
            <View style={styles.divider} />

            
            <Text style={styles.sectionTitle}>
              {t('coupon.terms_conditions', 'Terms & Conditions')}
            </Text>

            <View style={styles.termsList}>
              <TermItem text={t('coupon.term_1', 'Voucher must be used before the expiry date.')} />
              <TermItem text={t('coupon.term_2', 'This voucher is valid for a single use only.')} />
              <TermItem text={t('coupon.term_3', 'Cannot be combined with other offers or discounts.')} />
              <TermItem text={t('coupon.term_4', 'Applicable on food items only unless stated otherwise.')} />
              <TermItem text={t('coupon.term_5', 'Not redeemable for cash or credit.')} />
              <TermItem text={t('coupon.term_6', 'The restaurant reserves the right to modify or cancel the voucher at any time.')} />
            </View>
          </ScrollView>

          
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.useNowBtn}
              activeOpacity={0.8}
              onPress={() => {
                onUseNow?.(coupon);
                onClose();
              }}
            >
              <Text style={styles.useNowText}>
                {t('coupon.use_now', 'Use Now')}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const TermItem = ({ text }) => (
  <View style={styles.termItem}>
    <View style={styles.bullet} />
    <Text style={styles.termText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  drawer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingTop: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    zIndex: 10,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },
  amount: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  metaText: {
    fontSize: 12,
    color: '#8C8C8C',
  },
  metaDot: {
    marginHorizontal: 8,
    color: '#BDBDBD',
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
    marginBottom: 12,
  },
  termsList: {
    marginBottom: 20,
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#666',
    marginTop: 6,
    marginRight: 10,
  },
  termText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  useNowBtn: {
    backgroundColor: '#E53935',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  useNowText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CouponDetailsDrawer;