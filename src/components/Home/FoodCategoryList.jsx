import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { hp, wp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES as FONT } from '../../theme/typography';
import { SkeletonFoodItem } from './SkeletonLoaders';

const FoodCategoryItem = memo(({ item, onPress }) => {
  const { t } = useTranslation();
  
  return (
    <TouchableOpacity
      style={styles.foodItem}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <Image source={item.image} style={styles.foodImage} />
      <Text style={styles.foodTitle}>
        {t(`categories.${item.id}`, item.title)}
      </Text>
    </TouchableOpacity>
  );
});

export const FoodCategoryList = memo(({ categories, isLoading, onCategoryPress }) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <FlatList
        horizontal
        data={Array(5).fill(null)}
        keyExtractor={(_, index) => `skeleton-food-${index}`}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.foodList}
        renderItem={() => <SkeletonFoodItem />}
      />
    );
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <FlatList
      horizontal
      data={categories}
      keyExtractor={item => item.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.foodList}
      renderItem={({ item }) => (
        <FoodCategoryItem
          item={item}
          onPress={() => onCategoryPress(item)}
        />
      )}
    />
  );
});

const styles = StyleSheet.create({
  foodList: {
    paddingLeft: wp(4.44),
    marginTop: hp(2.25),
    paddingBottom: hp(0.5),
  },
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
    fontSize: FONT.xs,
    fontWeight: '500',
    color: '#2A2A2A',
  },
});