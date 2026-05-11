import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { scale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';
import { useAuth } from '../../context/AuthContext';

export const CartBottomBar = memo(({ cartCount, subtotal, onPress }) => {
  const { t } = useTranslation();
  const { currencySymbol } = useAuth();

  if (cartCount <= 0) {
    return null;
  }

  // Format items in cart text
  const getItemsInCartText = () => {
    const translation = t('cart.items_in_cart', { count: cartCount });

    // If translation key is missing, show fallback text
    if (translation === 'cart.items_in_cart') {
      return cartCount === 1 ? '1 item in cart' : `${cartCount} items in cart`;
    }

    return translation;
  };

  // Format subtotal text
  const getSubtotalText = () => {
    const formattedSubtotal = typeof subtotal === 'number'
      ? `${currencySymbol}${subtotal.toFixed(2)}`
      : `${currencySymbol}${subtotal}`;

    const translation = t('cart.subtotal', { subtotal: formattedSubtotal });

    // If translation key is missing, show fallback text
    if (translation === 'cart.subtotal') {
      return `Subtotal: ${formattedSubtotal}`;
    }

    return translation;
  };

  // Format button text
  const getButtonText = () => {
    const translation = t('cart.go_to_cart', 'Go to Cart');

    // If translation returns the key and no default provided
    if (translation === 'cart.go_to_cart') {
      return 'Go to Cart';
    }

    return translation;
  };

  const itemsText = getItemsInCartText();
  const subtotalText = getSubtotalText();
  const buttonText = getButtonText();

  return (
    <View style={styles.cartBar}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cartBarTitle}>
          {itemsText}
        </Text>
        <Text style={styles.cartBarSub}>
          {subtotalText}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.cartBtn}
        activeOpacity={0.9}
        onPress={onPress}
      >
        <Text style={styles.cartBtnText}>
          {buttonText}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  cartBar: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    bottom: SPACING.md,
    backgroundColor: '#111',
    borderRadius: scale(16),
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartBarTitle: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: FONT_SIZES.sm,
  },
  cartBarSub: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
    fontSize: FONT_SIZES.xs,
    marginTop: scale(2),
  },
  cartBtn: {
    backgroundColor: '#FF3D3D',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: scale(12),
  },
  cartBtnText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: FONT_SIZES.xs,
  },
});