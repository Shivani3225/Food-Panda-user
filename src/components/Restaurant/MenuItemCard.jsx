import React, { memo } from 'react';
import { View, Image, Text, Pressable, StyleSheet } from 'react-native';
import { Heart, Minus, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { scale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';
import { useAuth } from '../../context/AuthContext';

export const MenuItemCard = memo(({
  item,
  quantity,
  isFavorite,
  onPress,
  onFavoritePress,
  onIncrement,
  onDecrement,
  onQuickAdd,
  showDivider,
}) => {
  const { t } = useTranslation();
  const { currencySymbol } = useAuth();

  const itemDesc = item?.detail || item?.description || item?.subtitle || item?.shortDescription || '';

  const bestSellerText = item?.isBestSeller
    ? (item.bestSellerKey
      ? t(item.bestSellerKey, 'Highly Reordered')
      : t('menu.highly_reordered', 'Highly Reordered'))
    : null;

  const imageSource = item?.image
    ? { uri: item.image }
    : require('../../assets/images/Food.png');

  const foodTypeLower = item?.foodType?.toLowerCase()?.trim();
  const isVeg = item?.isVeg === true || foodTypeLower === 'veg' || foodTypeLower === 'vegetarian';
  const isNonVeg = item?.isVeg === false || foodTypeLower === 'non-veg' || foodTypeLower === 'nonveg' || foodTypeLower === 'non veg' || foodTypeLower === 'non vegetarian';
  const foodTypeColor = isVeg ? '#008000' : isNonVeg ? '#E41C26' : null;

  return (
    <View>
      <Pressable
        onPress={onPress}
        style={styles.itemRow}
        android_ripple={{ color: '#F5F5F5', borderless: false }}
      >
        {/* Left: Image with heart */}
        <View style={styles.itemImgWrap}>
          <Image source={imageSource} style={styles.itemImg} />
          <Pressable
            style={styles.itemFavBtn}
            hitSlop={10}
            onPress={onFavoritePress}
          >
            <Heart
              size={14}
              color={isFavorite ? '#FF3D3D' : '#111'}
              fill={isFavorite ? '#FF3D3D' : 'transparent'}
            />
          </Pressable>
        </View>

        {/* Middle: Info */}
        <View style={styles.itemContent}>
          <Text style={styles.itemPrice}>
            {currencySymbol}{typeof item.price === 'number' ? item.price.toFixed(2) : item.price}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: scale(2) }}>
            {foodTypeColor && (
              <View style={[styles.foodTypeIcon, { borderColor: foodTypeColor }]}>
                <View style={[styles.foodTypeDot, { backgroundColor: foodTypeColor }]} />
              </View>
            )}
            <Text style={styles.itemName} numberOfLines={2}>
              {item.nameKey ? t(item.nameKey, item.name) : item.name}
            </Text>
          </View>
          {!!itemDesc && (
            <Text style={styles.desc} numberOfLines={2}>
              {item.descriptionKey ? t(item.descriptionKey, itemDesc) : itemDesc}
            </Text>
          )}
          {bestSellerText && (
            <View style={styles.bestSellerPill}>
              <Text style={styles.bestSellerText}>{bestSellerText}</Text>
            </View>
          )}
        </View>

        {/* Right: Add / Stepper */}
        <View style={styles.actionWrap}>
          {quantity > 0 ? (
            <View style={styles.stepper}>
              <Pressable style={styles.stepBtn} hitSlop={10} onPress={onDecrement}>
                <Minus size={12} color="#111" />
              </Pressable>
              <Text style={styles.stepQty}>{quantity}</Text>
              <Pressable style={styles.stepBtn} hitSlop={10} onPress={onIncrement}>
                <Plus size={12} color="#111" />
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.addPlusBtn} hitSlop={10} onPress={onQuickAdd}>
              <Plus size={16} color="#111" />
            </Pressable>
          )}
        </View>
      </Pressable>

      {showDivider && <View style={styles.itemDivider} />}
    </View>
  );
});

const styles = StyleSheet.create({
  itemRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    gap: scale(12),
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#EDEDED',
    marginHorizontal: SPACING.md,
  },

  // Image
  itemImgWrap: {
    position: 'relative',
  },
  itemImg: {
    width: scale(90),
    height: scale(90),
    borderRadius: scale(14),
    backgroundColor: '#F5F5F5',
  },
  itemFavBtn: {
    position: 'absolute',
    top: scale(6),
    left: scale(6),
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    shadowOffset: { width: 0, height: 1 },
  },

  // Content
  itemContent: {
    flex: 1,
  },
  itemPrice: {
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
    color: '#111',
    marginBottom: scale(2),
  },
  itemName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: '#111',
    lineHeight: scale(20),
    flex: 1,
  },
  foodTypeIcon: {
    width: scale(14),
    height: scale(14),
    borderWidth: 1,
    borderRadius: scale(2),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(6),
    marginTop: scale(3),
  },
  foodTypeDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
  },
  desc: {
    fontSize: FONT_SIZES.xs,
    color: '#777',
    marginTop: scale(4),
    lineHeight: scale(16),
  },
  bestSellerPill: {
    marginTop: scale(6),
    alignSelf: 'flex-start',
    backgroundColor: '#FFE8E8',
    borderRadius: scale(10),
    paddingHorizontal: scale(10),
    paddingVertical: scale(3),
  },
  bestSellerText: {
    color: '#D84C4C',
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    fontStyle: 'italic',
  },

  // Action
  actionWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPlusBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(10),
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: scale(12),
    paddingHorizontal: SPACING.xs,
    height: scale(32),
    backgroundColor: '#FFF',
  },
  stepBtn: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepQty: {
    minWidth: scale(18),
    textAlign: 'center',
    fontWeight: '900',
    color: '#111',
    fontSize: FONT_SIZES.xs,
    marginHorizontal: scale(2),
  },
});
