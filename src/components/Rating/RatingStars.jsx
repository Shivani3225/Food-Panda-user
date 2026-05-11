import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { scale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';

const RatingStars = ({ 
  rating = 0, 
  onRatingChange, 
  size = 32, 
  editable = true,
  label = '',
  showLabel = true,
  containerStyle = {}
}) => {
  const { t } = useTranslation();
  const [hoverRating, setHoverRating] = useState(0);
  const activeRating = hoverRating || rating;

  const handlePress = (value) => {
    if (editable && onRatingChange) {
      onRatingChange(value);
    }
  };

  // Get rating text based on active rating value
  const getRatingText = (ratingValue) => {
    if (ratingValue === 0) return t('rating.tap_to_rate', 'Tap to rate');
    if (ratingValue === 1) return t('rating.poor', 'Poor');
    if (ratingValue === 2) return t('rating.fair', 'Fair');
    if (ratingValue === 3) return t('rating.good', 'Good');
    if (ratingValue === 4) return t('rating.very_good', 'Very Good');
    if (ratingValue === 5) return t('rating.excellent', 'Excellent');
    return t('rating.tap_to_rate', 'Tap to rate');
  };

  // Check if label is a translation key
  const translatedLabel = label && (label.startsWith('common.') || 
    label.startsWith('rating.') || 
    label.startsWith('order_rating.'))
    ? t(label, label)
    : label;

  const ratingText = getRatingText(activeRating);

  return (
    <View style={[styles.container, containerStyle]}>
      {showLabel && translatedLabel ? (
        <Text style={styles.label}>{translatedLabel}</Text>
      ) : null}
      
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handlePress(star)}
            onPressIn={() => editable && setHoverRating(star)}
            onPressOut={() => setHoverRating(0)}
            disabled={!editable}
            activeOpacity={0.7}
            style={styles.starButton}
          >
            <Star
              size={size}
              color={star <= activeRating ? '#FBBF24' : '#E5E7EB'}
              fill={star <= activeRating ? '#FBBF24' : 'transparent'}
              strokeWidth={2}
            />
          </TouchableOpacity>
        ))}
      </View>
      
      {showLabel && (
        <Text style={[
          styles.ratingText,
          activeRating > 0 && styles.ratingTextActive
        ]}>
          {ratingText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: SPACING.sm,
    letterSpacing: -0.2,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  starButton: {
    padding: scale(4),
  },
  ratingText: {
    fontSize: FONT_SIZES.xs,
    color: '#9CA3AF',
    marginTop: scale(6),
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  ratingTextActive: {
    color: '#F59E0B',
    fontWeight: '700',
  },
});

export default RatingStars;