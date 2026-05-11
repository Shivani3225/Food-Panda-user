import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { scale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';

const RatingBadge = ({ rating, count, showCount = false, size = 14, style = {} }) => {
  const numericRating = Number(rating);
  
  // Agar rating valid nahi hai toh kuch show nahi karega
  if (isNaN(numericRating) || numericRating <= 0) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <Star size={scale(size)} color="#F5A623" fill="#F5A623" />
      <Text style={styles.ratingValue}>{numericRating.toFixed(1)}</Text>
      {showCount && count !== undefined && count > 0 && (
        <Text style={styles.ratingCount}>({count})</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
  },
  ratingValue: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: '#000',
  },
  ratingCount: {
    fontSize: scale(10),
    color: '#828282',
  },
});

export default RatingBadge;