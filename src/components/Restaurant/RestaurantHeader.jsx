import React, { memo } from 'react';
import { View, Image, TouchableOpacity, Pressable, Text, StyleSheet } from 'react-native';
import { ArrowLeft, Heart, Star, MoreVertical } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
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
      
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.6)']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Back button */}
      <TouchableOpacity style={styles.headerIconLeft} onPress={onBackPress}>
        <ArrowLeft size={20} color="#FFF" />
      </TouchableOpacity>

      {/* Right icons */}
      <View style={styles.headerIconRightGroup}>
        <Pressable style={styles.headerIcon} onPress={onFavoritePress}>
          <Heart
            size={18}
            color={isFavorite ? '#FF3D3D' : '#FFF'}
            fill={isFavorite ? '#FF3D3D' : 'transparent'}
          />
        </Pressable>

        <TouchableOpacity style={styles.headerIcon} onPress={onMenuPress}>
          <MoreVertical size={18} color="#FFF" />
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
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: scale(30),
    right: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F8A5F',
    paddingHorizontal: SPACING.md,
    paddingVertical: scale(6),
    borderRadius: scale(10),
    elevation: 4,
  },
  ratingText: {
    marginLeft: SPACING.xs,
    fontWeight: '800',
    fontSize: FONT_SIZES.sm,
    color: '#FFF',
  },
  ratingSubText: {
    marginLeft: SPACING.xs,
    fontSize: FONT_SIZES.xs - 1,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
});