import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Heart, Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTranslatedText, useTranslatedArray } from '../../hooks/useTranslatedData';
import { BASE_URL } from '../../config/api';
import { hp, wp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES as FONT } from '../../theme/typography';
import { getRatingAverage, getRatingCount } from '../../utils/ratingUtils';

// Helper function to format rating to 1 decimal place
const formatRating = (rating) => {
  if (!rating && rating !== 0) return '0.0';
  return rating.toFixed(1);
};

// Helper function to format view count (e.g., 2000 -> 2k)
const formatViewCount = (count) => {
  if (!count) return '0';
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
};

export const RestaurantListCard = memo(
  ({ item, isFavorite, onPress, onFavoritePress }) => {
    const { t } = useTranslation();
    const fallbackImage = require('../../assets/images/Food.png');

    const getImageSource = (img) => {
      if (!img) return fallbackImage;
      if (typeof img === 'string') {
        const trimmed = img.trim();
        if (trimmed === '') return fallbackImage;
        if (trimmed.startsWith('http')) return { uri: trimmed };
        if (trimmed.startsWith('/')) return { uri: `${BASE_URL}${trimmed}` };
        return { uri: `${BASE_URL}/${trimmed}` };
      }
      return img; // Already a source object or require
    };

    const [imgSrc, setImgSrc] = React.useState(getImageSource(item.bannerImage || item.image));

    const cuisines = Array.isArray(item?.cuisines) ? item.cuisines
      : Array.isArray(item?.cuisine) ? item.cuisine : [];
    const translatedCuisines = useTranslatedArray(cuisines);
    const cuisineText = translatedCuisines.length > 0
      ? translatedCuisines.slice(0, 3).join(', ')
      : t('restaurant.default_cuisine', 'Pizza, Italian, Fast Food');

    const translatedName = useTranslatedText(item?.name);

    // ✅ Distance - format properly
    const distanceText = item?.distance || null;

    // ✅ Time - DIRECT STRING (no translation to avoid duplication)
    const timeText = item?.deliveryTime || '';

    // ✅ Rating - formatted to 1 decimal place
    const ratingValue = formatRating(getRatingAverage(item));
    const ratingCount = getRatingCount(item);
    const formattedRatingCount = formatViewCount(ratingCount);

    const hasBestSellerDish = item?.bestSeller && item.bestSeller !== 'Best Seller' && item.bestSeller !== 'Best seller';
    const bestSellerDisplay = hasBestSellerDish 
      ? `Best Seller: ${item.bestSeller}` 
      : t('restaurant.popular_choice', 'Popular choice');

    return (
      <TouchableOpacity
        style={styles.listCard}
        activeOpacity={0.9}
        onPress={onPress}
      >
        <View style={styles.listImageWrap}>
          <Image
            source={imgSrc}
            style={styles.listImage}
            onError={() => {
              console.log('🖼️ [Image Error] Fallback triggered for:', item.name);
              setImgSrc(fallbackImage);
            }}
          />
          {/* Offer Tag */}
          <View style={styles.offerTag}>
            <Text style={styles.offerText}>{item.offer || 'Flat 20% OFF'}</Text>
          </View>
          <TouchableOpacity
            style={styles.listFavBtn}
            activeOpacity={0.8}
            onPress={onFavoritePress}
          >
            <Heart
              size={16}
              color={isFavorite ? '#ed1c24' : '#111111'}
              fill={isFavorite ? '#ed1c24' : 'none'}
            />
          </TouchableOpacity>
          <View style={styles.listImageDots}>
            {Array.from({ length: 6 }).map((_, index) => (
              <View
                key={`list-dot-${index}`}
                style={
                  index === 4
                    ? [styles.listDot, styles.listDotActive]
                    : styles.listDot
                }
              />
            ))}
          </View>
        </View>
        <View style={styles.listBody}>
          <View style={styles.listTitleRow}>
            <Text style={styles.listTitle} numberOfLines={1}>
              {translatedName || item.name}
            </Text>
            <View style={styles.listRatingRow}>
              {ratingValue === '0.0' || parseFloat(ratingValue) === 0 ? (
                <Text style={styles.listRatingValue}>New ★</Text>
              ) : (
                <>
                  <Star size={14} color="#F5A623" fill="#F5A623" />
                  <Text style={styles.listRatingValue}>{ratingValue}</Text>
                  <Text style={styles.listRatingCount}>({formattedRatingCount})</Text>
                </>
              )}
            </View>
          </View>

          <Text style={styles.listMeta} numberOfLines={1}>
            {cuisineText}
          </Text>

          {timeText ? (
            <Text style={styles.listSubMeta} numberOfLines={1}>
              {timeText}
            </Text>
          ) : null}

          <View style={styles.listBestSellerPill}>
            <Text style={styles.listBestSellerText} numberOfLines={1}>
              {bestSellerDisplay}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);

export const RestaurantRecommendCard = memo(
  ({ item, isFavorite, onPress, onFavoritePress }) => {
    const { t } = useTranslation();

    const cuisines = Array.isArray(item?.cuisines) ? item.cuisines
      : Array.isArray(item?.cuisine) ? item.cuisine : [];
    const translatedCuisines = useTranslatedArray(cuisines);
    const cuisineText = translatedCuisines.length > 0
      ? translatedCuisines.slice(0, 3).join(', ')
      : t('restaurant.default_cuisine', 'Pizza, Italian, Fast Food');

    // ✅ Distance - format properly
    const distanceText = item?.distance || null;

    // ✅ Time - DIRECT STRING (no translation to avoid duplication)
    const timeText = item?.deliveryTime
      ? item.deliveryTime
      : '20-30 min';

    // ✅ Rating - formatted to 1 decimal place
    const ratingValue = formatRating(getRatingAverage(item));
    const ratingCount = getRatingCount(item);
    const formattedRatingCount = formatViewCount(ratingCount);

    const hasBestSellerDish = item?.bestSeller && item.bestSeller !== 'Best Seller' && item.bestSeller !== 'Best seller';
    const bestSellerDisplay = hasBestSellerDish 
      ? `Best Seller: ${item.bestSeller}` 
      : t('restaurant.popular_choice', 'Popular choice');

    const translatedName = useTranslatedText(item?.name);

    const fallbackImage = require('../../assets/images/Food.png');
    const getImageSource = (img) => {
      if (!img) return fallbackImage;
      if (typeof img === 'string') {
        const trimmed = img.trim();
        if (trimmed === '' || trimmed.includes('/uploads/')) return fallbackImage;
        if (trimmed.startsWith('http')) return { uri: trimmed };
        return fallbackImage;
      }
      return img;
    };

    return (
      <TouchableOpacity
        style={styles.recommendCard}
        activeOpacity={0.9}
        onPress={onPress}
      >
        <View style={styles.recommendImageWrap}>
          <Image
            source={getImageSource(item.bannerImage || item.image)}
            style={styles.recommendImage}
            onError={(e) => {
              console.log('🌟 [Image Error] Recommend Card Fallback for:', item.name);
            }}
            defaultSource={require('../../assets/images/Food.png')}
          />
          {/* Offer Tag */}
          <View style={styles.offerTag}>
            <Text style={styles.offerText}>{item.offer || 'Flat 20% OFF'}</Text>
          </View>
          <TouchableOpacity
            style={styles.favBtn}
            activeOpacity={0.8}
            onPress={onFavoritePress}
          >
            <Heart
              size={16}
              color={isFavorite ? '#ed1c24' : '#111111'}
              fill={isFavorite ? '#ed1c24' : 'none'}
            />
          </TouchableOpacity>
          <View style={styles.imageDots}>
            {Array.from({ length: 6 }).map((_, index) => (
              <View
                key={`dot-${index}`}
                style={
                  index === 4
                    ? [styles.dot, styles.dotActive]
                    : styles.dot
                }
              />
            ))}
          </View>
        </View>
        <View style={styles.recommendBody}>
          <View style={styles.recommendTitleRow}>
            <Text style={styles.recommendTitle} numberOfLines={1}>
              {translatedName || item.name}
            </Text>
            <View style={styles.ratingRow}>
              {ratingValue === '0.0' || parseFloat(ratingValue) === 0 ? (
                <Text style={styles.ratingValue}>New ★</Text>
              ) : (
                <>
                  <Star size={14} color="#F5A623" fill="#F5A623" />
                  <Text style={styles.ratingValue}>{ratingValue}</Text>
                  <Text style={styles.ratingCount}>({formattedRatingCount})</Text>
                </>
              )}
            </View>
          </View>

          <Text style={styles.recommendMeta} numberOfLines={1}>
            {cuisineText}
          </Text>

          <Text style={styles.recommendSubMeta} numberOfLines={1}>
            {timeText}
          </Text>

          <View style={styles.bestSellerPill}>
            <Text style={styles.bestSellerText} numberOfLines={1}>
              {bestSellerDisplay}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);

const styles = StyleSheet.create({
  // List Card Styles
  listCard: {
    width: wp(91.12),
    marginHorizontal: wp(4.44),
    marginTop: hp(1.75),
    borderRadius: scale(18),
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: hp(0.5) },
    shadowRadius: scale(12),
    overflow: 'visible',
    alignSelf: 'center',
  },
  listImageWrap: {
    position: 'relative',
  },
  listImage: {
    width: '100%',
    height: hp(19.375),
    borderTopLeftRadius: scale(18),
    borderTopRightRadius: scale(18),
    backgroundColor: '#F5F5F7',
  },
  offerTag: {
    position: 'absolute',
    top: hp(1.25),
    left: wp(2.78),
    backgroundColor: '#E23744',
    paddingHorizontal: wp(2.78),
    paddingVertical: hp(0.5),
    borderRadius: scale(6),
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: scale(4),
    elevation: 3,
    zIndex: 10,
  },
  offerText: {
    color: '#FFFFFF',
    fontSize: FONT.xs - scale(1),
    fontWeight: 'bold',
  },
  listFavBtn: {
    position: 'absolute',
    top: hp(1.25),
    right: wp(2.78),
    width: wp(9.44),
    height: hp(4.25),
    borderRadius: scale(17),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: scale(6),
    elevation: 2,
  },
  listImageDots: {
    position: 'absolute',
    right: wp(3.33),
    bottom: hp(1.25),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.67),
  },
  listDot: {
    width: wp(1.67),
    height: hp(0.75),
    borderRadius: scale(3),
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  listDotActive: {
    width: wp(4.44),
    height: hp(0.75),
    borderRadius: scale(3),
    backgroundColor: '#FFFFFF',
  },
  listBody: {
    padding: scale(12),
  },
  listTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: wp(2.22),
  },
  listTitle: {
    fontSize: FONT.sm + scale(2),
    fontWeight: '700',
    color: '#111111',
    flex: 1,
  },
  listRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.11),
  },
  listRatingValue: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: '#111111',
  },
  listRatingCount: {
    fontSize: FONT.xs,
    color: '#6E6E6E',
  },
  listMeta: {
    fontSize: FONT.xs,
    color: '#6E6E6E',
    marginTop: hp(0.75),
  },
  listSubMeta: {
    fontSize: FONT.xs,
    color: '#6E6E6E',
    marginTop: hp(0.75),
  },
  listBestSellerPill: {
    marginTop: hp(1.25),
    backgroundColor: '#FDEEEE',
    borderRadius: scale(14),
    paddingHorizontal: wp(2.78),
    paddingVertical: hp(0.75),
    alignSelf: 'flex-start',
  },
  listBestSellerText: {
    fontSize: FONT.xs,
    color: '#5B3B3B',
    fontWeight: '600',
  },

  // Recommend Card Styles
  recommendCard: {
    width: wp(72.22),
    borderRadius: scale(18),
    backgroundColor: '#FFFFFF',
    marginRight: wp(4.44),
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: hp(0.5) },
    shadowRadius: scale(12),
    elevation: 4,
    overflow: 'visible',
  },
  recommendImageWrap: {
    position: 'relative',
    padding: wp(1.39),
  },
  recommendImage: {
    width: '100%',
    height: hp(18.125),
    borderTopLeftRadius: scale(18),
    borderTopRightRadius: scale(18),
    borderRadius: scale(18),
    backgroundColor: '#F5F5F7',
  },
  favBtn: {
    position: 'absolute',
    top: hp(1.25),
    right: wp(2.78),
    width: wp(9.44),
    height: hp(4.25),
    borderRadius: scale(17),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: scale(6),
    elevation: 2,
  },
  imageDots: {
    position: 'absolute',
    right: wp(3.33),
    bottom: hp(1.25),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.67),
  },
  dot: {
    width: wp(1.67),
    height: hp(0.75),
    borderRadius: scale(3),
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  dotActive: {
    width: wp(4.44),
    height: hp(0.75),
    borderRadius: scale(3),
    backgroundColor: '#FFFFFF',
  },
  recommendBody: {
    padding: scale(12),
  },
  recommendTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: wp(2.22),
  },
  recommendTitle: {
    fontSize: FONT.sm + scale(2),
    fontWeight: '700',
    color: '#111111',
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.11),
  },
  ratingValue: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: '#111111',
  },
  ratingCount: {
    fontSize: FONT.xs,
    color: '#6E6E6E',
  },
  recommendMeta: {
    fontSize: FONT.xs,
    color: '#6E6E6E',
    marginTop: hp(0.75),
  },
  recommendSubMeta: {
    fontSize: FONT.xs,
    color: '#6E6E6E',
    marginTop: hp(0.75),
  },
  bestSellerPill: {
    marginTop: hp(1.25),
    backgroundColor: '#FDEEEE',
    borderRadius: scale(14),
    paddingHorizontal: wp(2.78),
    paddingVertical: hp(0.75),
    alignSelf: 'flex-start',
  },
  bestSellerText: {
    fontSize: FONT.xs,
    color: '#5B3B3B',
    fontWeight: '600',
  },
});