import React, { memo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { wp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';

const ReviewCardItem = memo(({ review }) => {
  const { t } = useTranslation();
  const rating = typeof review?.rating === 'number'
    ? review.rating
    : (review?.rating?.average ?? 4);

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewTop}>
        <View style={styles.reviewStars}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={`${review.id}-star-${index}`}
              size={14}
              color={index < rating ? '#FF8A00' : '#F2D2B6'}
              fill={index < rating ? '#FF8A00' : 'transparent'}
            />
          ))}
        </View>
        <Text style={styles.reviewUser}>• {review.user}</Text>
        <Text style={styles.reviewTime}>{review.time}</Text>
      </View>
      <Text style={styles.reviewText} numberOfLines={3}>
        {review.commentKey ? t(review.commentKey, review.comment) : review.comment}
      </Text>
    </View>
  );
});

export const ReviewList = memo(({ reviews, title = 'Fellow foodies say' }) => {
  const { t } = useTranslation();
  
  if (!reviews || reviews.length === 0) {
    return null;
  }

  // Check if title is a translation key
  const translatedTitle = title && (title.startsWith('reviews.') || 
    title.startsWith('common.'))
    ? t(title, title)
    : title;

  return (
    <>
      <Text style={styles.reviewTitle}>{translatedTitle}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.reviewList}
      >
        {reviews.map(review => (
          <ReviewCardItem key={review.id} review={review} />
        ))}
      </ScrollView>
    </>
  );
});

const styles = StyleSheet.create({
  reviewTitle: {
    margin: SPACING.lg,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  reviewList: {
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  reviewCard: {
    width: wp(80),
    backgroundColor: '#FFFDF5',
    marginRight: SPACING.md,
    padding: SPACING.md,
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: '#F3A15C',
  },
  reviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  reviewStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(2),
  },
  reviewUser: {
    fontWeight: '700',
    fontSize: FONT_SIZES.sm,
    color: '#111',
  },
  reviewText: {
    marginTop: SPACING.md,
    color: '#222',
    fontSize: FONT_SIZES.xs,
    lineHeight: scale(16),
  },
  reviewTime: {
    marginLeft: 'auto',
    fontSize: FONT_SIZES.xs,
    color: '#8E8E93',
    fontWeight: '600',
  },
});