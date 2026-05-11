import React, { memo } from 'react';
import { View, Image, TouchableOpacity, Pressable, Text, StyleSheet } from 'react-native';
import { ArrowLeft, Heart, Star, MoreVertical } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { hp, wp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';

export const RestaurantHeader = memo(({
  headerImage,
  onBackPress,
  isFavorite,
  onFavoritePress,
  onMenuPress,
  ratingAverage,
  ratingCount,
}) => {
  const { t } = useTranslation();
  const fallbackImage = require('../../assets/images/Food.png');
  const [imgSrc, setImgSrc] = React.useState(headerImage || fallbackImage);

  // Sync state if headerImage changes (e.g. after API fetch)
  React.useEffect(() => {
    if (headerImage) setImgSrc(headerImage);
  }, [headerImage]);

  const normalizedAverage = Number.isFinite(Number(ratingAverage))
    ? Number(ratingAverage)
    : 0;
  const normalizedCount = Number.isFinite(Number(ratingCount))
    ? Number(ratingCount)
    : 0;
  const shouldShowRating = normalizedAverage > 0 || normalizedCount > 0;

  return (
    <View style={styles.headerContainer}>
      <Image 
        source={imgSrc} 
        style={styles.headerImage} 
        onError={() => setImgSrc(fallbackImage)}
      />

      {/* Back button */}
      <TouchableOpacity style={styles.headerIconLeft} onPress={onBackPress}>
        <ArrowLeft size={18} color="#000" />
      </TouchableOpacity>

      {/* Right icons */}
      <View style={styles.headerIconRightGroup}>
        <Pressable style={styles.headerIcon} onPress={onFavoritePress}>
          <Heart
            size={18}
            color={isFavorite ? '#FF3D3D' : '#000'}
            fill={isFavorite ? '#FF3D3D' : 'transparent'}
          />
        </Pressable>

        <TouchableOpacity style={styles.headerIcon} onPress={onMenuPress}>
          <MoreVertical size={18} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Rating pill */}
      {shouldShowRating ? (
        <View style={styles.ratingBadge}>
          <Star size={14} color="#FFB800" fill="#FFB800" />
          <Text style={styles.ratingText}>
            {normalizedAverage.toFixed(1)}
          </Text>
          {normalizedCount > 0 && (
            <Text style={styles.ratingSubText}>({normalizedCount} {t('restaurant.reviews', 'Reviews')})</Text>
          )}
        </View>
      ) : (
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>
            {t('restaurant.new', 'New')}
          </Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  headerContainer: {
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: hp(29),
  },
  headerIconLeft: {
    position: 'absolute',
    top: scale(24),
    left: SPACING.lg,
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  headerIconRightGroup: {
    position: 'absolute',
    top: scale(24),
    right: SPACING.lg,
    flexDirection: 'row',
    gap: SPACING.md,
  },
  headerIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: scale(35),
    right: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: SPACING.md,
    paddingVertical: scale(7),
    borderRadius: scale(18),
    elevation: 4,
  },
  ratingText: {
    marginLeft: SPACING.sm,
    fontWeight: '800',
    fontSize: FONT_SIZES.sm,
    color: '#000',
  },
  ratingSubText: {
    marginLeft: SPACING.xs,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: '#666',
  },
});