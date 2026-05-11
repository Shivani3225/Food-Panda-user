import React, { memo } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { scale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';
import { useAuth } from '../../context/AuthContext';

export const RestaurantInfo = memo(({
  thumbImage,
  name,
  cuisines,
  deliveryTime,
  freeDeliveryText,
  minOrder,
  distance,
  address,
}) => {
  const { t } = useTranslation();
  const { currencySymbol } = useAuth();
  
  // Check if name is a translation key
  const translatedName = name && (name.startsWith('restaurant.') || 
    name.startsWith('common.'))
    ? t(name, name)
    : name;
  
  // Get translated delivery text - FIXED
  const getDeliveryText = () => {
    if (!deliveryTime) {
      return t('restaurant.delivery', 'Delivery');
    }
    
    // Check if deliveryTime is a number
    const timeInMinutes = typeof deliveryTime === 'number' 
      ? deliveryTime 
      : parseInt(deliveryTime);
    
    if (isNaN(timeInMinutes)) {
      return t('restaurant.delivery', 'Delivery');
    }
    
    // Try to use translation with parameter
    const translated = t('restaurant.delivery_time_with_value', { time: timeInMinutes });
    
    // If translation returns the same as key (key not found), format manually
    if (translated === 'restaurant.delivery_time_with_value') {
      return `${timeInMinutes} min`;
    }
    
    return translated;
  };
  
  // Get free delivery text
  const getFreeDeliveryText = () => {
    if (!freeDeliveryText) {
      return t('restaurant.free_delivery', 'Free Delivery');
    }
    
    if (freeDeliveryText.startsWith('restaurant.')) {
      const translated = t(freeDeliveryText, freeDeliveryText);
      if (translated === freeDeliveryText) {
        return t('restaurant.free_delivery', 'Free Delivery');
      }
      return translated;
    }
    
    return freeDeliveryText;
  };
  
  // Get min order text
  const getMinOrderText = () => {
    if (!minOrder) {
      return t('restaurant.min_order', 'Min order');
    }
    
    const minOrderAmount = typeof minOrder === 'number' 
      ? minOrder 
      : parseFloat(minOrder);
    
    if (isNaN(minOrderAmount)) {
      return t('restaurant.min_order', 'Min order');
    }
    
    const translated = t('restaurant.min_order_with_value', { amount: minOrderAmount });
    
    if (translated === 'restaurant.min_order_with_value') {
      return `Min ${currencySymbol}${minOrderAmount}`;
    }
    
    return translated;
  };

  const deliveryDisplayText = getDeliveryText();
  const freeDeliveryDisplayText = getFreeDeliveryText();
  const minOrderDisplayText = getMinOrderText();

  return (
    <View style={styles.infoBox}>
      <View style={styles.topRow}>
        <Image source={thumbImage} style={styles.resThumb} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{translatedName}</Text>
          <Text style={styles.meta}>{(cuisines || []).join(', ')}</Text>
          {address ? (
            <Text style={styles.addressText} numberOfLines={2}>📍 {address}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.deliveryRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.deliveryText}>{deliveryDisplayText}</Text>
          {distance ? (
            <Text style={styles.distanceText}>📍 {distance}</Text>
          ) : null}
          <Text style={styles.freeDeliveryText}>{freeDeliveryDisplayText}</Text>
          <Text style={styles.minOrderText}>{minOrderDisplayText}</Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  infoBox: {
    padding: SPACING.lg,
    marginTop: scale(-28),
    backgroundColor: '#FFF',
    borderTopLeftRadius: scale(28),
    borderTopRightRadius: scale(28),
  },
  topRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  resThumb: {
    width: scale(86),
    height: scale(96),
    borderRadius: scale(16),
    borderWidth: 3,
    borderColor: '#FFFFFF',
    top: scale(-45),
  },
  name: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
  meta: {
    color: '#7A7A7A',
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.xs,
  },
  addressText: {
    color: '#555',
    marginTop: scale(6),
    fontSize: FONT_SIZES.xs,
    lineHeight: scale(16),
  },
  deliveryRow: {
    marginTop: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: '#111',
  },
  freeDeliveryText: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: '#FF3D3D',
  },
  distanceText: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: '#555',
  },
  minOrderText: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.xs,
    color: '#7A7A7A',
    fontWeight: '600',
  },
});