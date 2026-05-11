import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { hp, wp } from '../../utils/responsive';
import { scale } from '../../utils/scale';

// Skeleton loader for vertical restaurant cards
export const SkeletonCard = memo(() => (
  <View style={styles.listCard}>
    <View style={[styles.listImageWrap, { backgroundColor: '#E8E8E8' }]}>
      <View style={[styles.listImage, { backgroundColor: '#D3D3D3' }]} />
    </View>
    <View style={styles.listBody}>
      <View style={styles.titleBar} />
      <View style={styles.metaBar} />
      <View style={styles.subMetaBar} />
    </View>
  </View>
));

// Skeleton loader for horizontal recommended cards
export const SkeletonRecommendCard = memo(() => (
  <View style={styles.recommendCard}>
    <View style={[styles.recommendImageWrap, { backgroundColor: '#E8E8E8' }]}>
      <View style={[styles.recommendImage, { backgroundColor: '#D3D3D3' }]} />
    </View>
    <View style={styles.recommendBody}>
      <View style={styles.recommendTitleBar} />
      <View style={styles.recommendMetaBar} />
      <View style={styles.recommendSubMetaBar} />
    </View>
  </View>
));

// Skeleton loader for food category items
export const SkeletonFoodItem = memo(() => (
  <View style={styles.foodItem}>
    <View style={[styles.foodImage, { backgroundColor: '#E8E8E8' }]} />
    <View style={styles.foodTitle} />
  </View>
));

const styles = StyleSheet.create({
  // Vertical card skeleton
  listCard: {
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
  },
  listImageWrap: {
    position: 'relative',
  },
  listImage: {
    width: '100%',
    height: hp(19.375),
    borderTopLeftRadius: scale(18),
    borderTopRightRadius: scale(18),
  },
  listBody: {
    padding: scale(12),
  },
  titleBar: {
    height: hp(2),
    backgroundColor: '#E8E8E8',
    borderRadius: scale(4),
    marginBottom: hp(1),
    width: '70%',
  },
  metaBar: {
    height: hp(1.5),
    backgroundColor: '#E8E8E8',
    borderRadius: scale(3),
    marginBottom: hp(0.75),
    width: '85%',
  },
  subMetaBar: {
    height: hp(1.5),
    backgroundColor: '#E8E8E8',
    borderRadius: scale(3),
    width: '75%',
  },

  // Horizontal recommend card skeleton
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
  },
  recommendBody: {
    padding: scale(12),
  },
  recommendTitleBar: {
    height: hp(1.75),
    backgroundColor: '#E8E8E8',
    borderRadius: scale(3),
    marginBottom: hp(0.75),
    width: '70%',
  },
  recommendMetaBar: {
    height: hp(1.375),
    backgroundColor: '#E8E8E8',
    borderRadius: scale(2),
    marginBottom: hp(0.5),
    width: '85%',
  },
  recommendSubMetaBar: {
    height: hp(1.375),
    backgroundColor: '#E8E8E8',
    borderRadius: scale(2),
    width: '75%',
  },

  // Food category skeleton
  foodItem: {
    alignItems: 'center',
    marginRight: wp(4.17),
    width: wp(25),
    height: hp(13.75),
    backgroundColor: '#FDEEEE',
    borderRadius: scale(22),
    paddingTop: hp(1.75),
    paddingBottom: hp(1.5),
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: scale(8),
    elevation: 2,
  },
  foodImage: {
    width: wp(16.67),
    height: hp(7.5),
    borderRadius: scale(32),
    marginBottom: hp(1.25),
  },
  foodTitle: {
    height: hp(1.5),
    backgroundColor: '#E8E8E8',
    borderRadius: scale(3),
    marginTop: hp(1),
    width: '80%',
  },
});
