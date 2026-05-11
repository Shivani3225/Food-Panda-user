import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Animated,
  BackHandler,
} from 'react-native';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

export const ConflictModal = ({
  visible,
  currentRestaurant,
  newRestaurant,
  onPlaceOrder,
  onFreshCart,
  loading,
}) => {
  const { t } = useTranslation();
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const [shouldRender, setShouldRender] = React.useState(false);

  useEffect(() => {
    if (!visible) {
      setShouldRender(false);
      return undefined;
    }

    overlayOpacity.setValue(0);
    scale.setValue(0.8);
    
    requestAnimationFrame(() => {
      setShouldRender(true);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(overlayOpacity, {
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
  }, [visible, overlayOpacity, scale]);

  React.useEffect(() => {
    if (visible) {
      console.log('[ConflictModal] 📋 Conflict modal visible');
      console.log('[ConflictModal]   Current restaurant:', currentRestaurant?.name || 'Unknown');
      console.log('[ConflictModal]   New restaurant:', newRestaurant?.name || 'Unknown');
    }
  }, [visible, currentRestaurant, newRestaurant]);

  if (!visible) {
    return null;
  }

  if (!shouldRender) return null;

  const currentRestaurantName = currentRestaurant?.nameKey 
    ? t(currentRestaurant.nameKey, currentRestaurant?.name || 'Unknown')
    : currentRestaurant?.name || t('common.unknown', 'Unknown');
    
  const newRestaurantName = newRestaurant?.nameKey 
    ? t(newRestaurant.nameKey, newRestaurant?.name || 'Unknown')
    : newRestaurant?.name || t('common.unknown', 'Unknown');

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={() => {}}
    >
      <Animated.View style={[styles.centeredView, { opacity: overlayOpacity }]}>
        <Animated.View style={[styles.modalView, { transform: [{ scale }] }]}>
          <Text style={styles.headerText}>
            {t('conflict.different_restaurant', 'Different Restaurant')}
          </Text>
          
          <View style={styles.contentView}>
            <Text style={styles.messageText}>
              {t('conflict.cart_has_items_from', 'Your cart has items from')}{' '}
              <Text style={styles.boldText}>"{currentRestaurantName}"</Text>
            </Text>
            
            <Text style={[styles.messageText, { marginTop: 12 }]}>
              {t('conflict.trying_to_add_from', "You're trying to add from")}{' '}
              <Text style={styles.boldText}>"{newRestaurantName}"</Text>
            </Text>
            
            <Text style={styles.questionText}>
              {t('conflict.what_would_you_like_to_do', 'What would you like to do?')}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary]}
              onPress={() => {
                console.log('User pressed: Continue Current Order');
                onPlaceOrder();
              }}
              disabled={loading}
            >
              <Text style={styles.btnSecondaryText}>
                {t('conflict.continue_current_order', 'Continue Current Order')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, loading && styles.btnDisabled]}
              onPress={() => {
                console.log('User pressed: Fresh Cart');
                onFreshCart();
              }}
              disabled={loading}
            >
              <Text style={styles.btnPrimaryText}>
                {loading 
                  ? t('common.processing', 'Processing...') 
                  : t('conflict.fresh_cart', 'Fresh Cart')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerView}>
            <Text style={styles.footerText}>
              {t('conflict.clear_cart_warning', 'Clearing your cart will remove all current items.')}
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingTop: 0,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: width - 40,
    maxWidth: 400,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FF3D3D',
    width: '100%',
    textAlign: 'center',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  contentView: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#000',
  },
  questionText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    color: '#111',
  },
  buttonRow: {
    flexDirection: 'column',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    width: '100%',
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondary: {
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  btnSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  btnPrimary: {
    backgroundColor: '#FF3D3D',
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  footerView: {
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    width: '100%',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});