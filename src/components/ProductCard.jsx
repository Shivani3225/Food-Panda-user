import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Star, Clock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { wp, hp } from '../utils/responsive';
import { scale } from '../utils/scale';
import { FONT_SIZES as FONT } from '../theme/typography';

const { width } = Dimensions.get('window');

export const ProductCard = ({
  item,
  onPress,
}) => {
  const { t } = useTranslation();
  const { currencySymbol } = useAuth();
  const cardWidth = width - wp(8.88); // 4.44% padding on each side

  const renderStarRating = (rating) => {
    // Only render if rating exists
    if (rating === undefined || rating === null) {
      return null;
    }
    
    const stars = [];
    const roundedRating = Math.round(rating);
    
    for (let i = 0; i < 5; i++) {
      const isFilled = i < roundedRating;
      stars.push(
        <Star
          key={i}
          size={scale(12)}
          color="#FFB800"
          fill={isFilled ? '#FFB800' : 'transparent'}
          strokeWidth={2}
        />
      );
    }
    return stars;
  };

  // Get translated product name if nameKey exists
  const productName = item?.nameKey 
    ? t(item.nameKey, item.name)
    : item?.name || '';

  // Get translated description if descriptionKey exists
  const productDescription = item?.descriptionKey 
    ? t(item.descriptionKey, item.description)
    : item?.description || '';

  // Get translated restaurant name if restaurant.nameKey exists
  const restaurantName = item?.restaurant?.nameKey 
    ? t(item.restaurant.nameKey, item.restaurant.name)
    : item?.restaurant?.name || '';

  return (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Product Image */}
      <View style={styles.imageContainer}>
        <Image
          source={
            item.image
              ? { uri: item.image }
              : require('../assets/images/Food.png')
          }
          style={styles.productImage}
          defaultSource={require('../assets/images/Food.png')}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Product Name */}
        <Text style={styles.productName} numberOfLines={2}>
          {productName}
        </Text>

        {/* Description */}
        {productDescription && (
          <Text style={styles.description} numberOfLines={2}>
            {productDescription}
          </Text>
        )}

        {/* Restaurant Name - Hide if it's already the main name (for restaurants) */}
        {restaurantName && !item.isRestaurant && (
          <Text style={styles.restaurantName} numberOfLines={1}>
            {restaurantName}
          </Text>
        )}

        {/* Bottom Row: Price, Rating, Time */}
        <View style={styles.bottomRow}>
          {/* Price - Hide for restaurants */}
          {!item.isRestaurant && (
            <View style={styles.priceSection}>
              <Text style={styles.price}>{currencySymbol}{item.price}</Text>
            </View>
          )}

          {/* Rating - Only show if rating exists */}
          {item.ratingAverage !== undefined && item.ratingAverage !== null && (
            <View style={styles.ratingSection}>
              <View style={styles.starsContainer}>
                {renderStarRating(item.ratingAverage)}
              </View>
              {item.ratingCount !== undefined && item.ratingCount !== null && (
                <Text style={styles.ratingCount}>
                  ({item.ratingCount})
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Delivery Time */}
        {item.deliveryTime && (
          <View style={styles.deliveryTimeRow}>
            <View style={styles.deliveryTimeContent}>
              <Clock size={scale(14)} color="#8E8E93" strokeWidth={2} />
              <Text style={styles.deliveryTime}>{item.deliveryTime}</Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(12),
    marginBottom: hp(2),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    alignSelf: 'center',
  },
  imageContainer: {
    width: '100%',
    height: hp(20),
    backgroundColor: '#F5F5F5',
    position: 'relative',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  content: {
    padding: wp(3.33),
  },
  productName: {
    fontSize: FONT.md,
    fontWeight: '700',
    color: '#111111',
    marginBottom: hp(0.75),
  },
  description: {
    fontSize: FONT.xs,
    color: '#8E8E93',
    marginBottom: hp(0.75),
    lineHeight: scale(16),
  },
  restaurantName: {
    fontSize: FONT.sm,
    color: '#666666',
    marginBottom: hp(1),
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(0.75),
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: FONT.md,
    fontWeight: '700',
    color: '#ed1c24',
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  starsContainer: {
    flexDirection: 'row',
    gap: scale(3),
  },
  ratingCount: {
    fontSize: FONT.xs,
    color: '#8E8E93',
  },
  deliveryTimeRow: {
    paddingTop: hp(0.75),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  deliveryTimeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  deliveryTime: {
    fontSize: FONT.xs,
    color: '#8E8E93',
  },
});