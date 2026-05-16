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
        {/* Left: Info */}
        <View style={styles.itemContent}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: scale(4) }}>
            {foodTypeColor && (
              <View style={[styles.foodTypeIcon, { borderColor: foodTypeColor }]}>
                <View style={[styles.foodTypeDot, { backgroundColor: foodTypeColor }]} />
              </View>
            )}
            {bestSellerText && (
              <View style={styles.bestSellerPill}>
                <Text style={styles.bestSellerText}>⭐ {bestSellerText}</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.itemName} numberOfLines={2}>
            {item.nameKey ? t(item.nameKey, item.name) : item.name}
          </Text>

          <Text style={styles.itemPrice}>
            {currencySymbol}{typeof item.price === 'number' ? item.price.toFixed(2) : item.price}
          </Text>

          {!!itemDesc && (
            <Text style={styles.desc} numberOfLines={2}>
              {item.descriptionKey ? t(item.descriptionKey, itemDesc) : itemDesc}
            </Text>
          )}
        </View>

        {/* Right: Image and Add Button */}
        <View style={styles.rightSection}>
          <View style={styles.itemImgWrap}>
            <Image source={imageSource} style={styles.itemImg} />
            <Pressable
              style={styles.itemFavBtn}
              hitSlop={10}
              onPress={onFavoritePress}
            >
              <Heart
                size={14}
                color={isFavorite ? '#E41C26' : '#666'}
                fill={isFavorite ? '#E41C26' : 'transparent'}
              />
            </Pressable>
          </View>

          {/* ADD / Stepper Button */}
          <View style={styles.actionContainer}>
            {quantity > 0 ? (
              <View style={styles.stepper}>
                <Pressable style={styles.stepBtn} hitSlop={10} onPress={onDecrement}>
                  <Minus size={14} color="#E41C26" strokeWidth={3} />
                </Pressable>
                <Text style={styles.stepQty}>{quantity}</Text>
                <Pressable style={styles.stepBtn} hitSlop={10} onPress={onIncrement}>
                  <Plus size={14} color="#E41C26" strokeWidth={3} />
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.addBtn} onPress={onQuickAdd}>
                <Text style={styles.addBtnText}>{t('menu.add', 'ADD')}</Text>
                <View style={styles.addIconWrap}>
                   <Plus size={12} color="#E41C26" strokeWidth={4} />
                </View>
              </Pressable>
            )}
          </View>
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
    paddingVertical: SPACING.lg,
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#F3F3F3',
    marginHorizontal: SPACING.md,
  },

  // Content
  itemContent: {
    flex: 1,
    paddingRight: scale(16),
  },
  itemName: {
    fontSize: scale(16),
    fontWeight: '700',
    color: '#111111',
    lineHeight: scale(22),
    marginBottom: scale(4),
  },
  itemPrice: {
    fontSize: scale(14),
    fontWeight: '600',
    color: '#222222',
    marginBottom: scale(6),
  },
  desc: {
    fontSize: scale(12),
    color: '#666666',
    lineHeight: scale(18),
  },
  foodTypeIcon: {
    width: scale(12),
    height: scale(12),
    borderWidth: 1,
    borderRadius: scale(2),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(8),
  },
  foodTypeDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
  },
  bestSellerPill: {
    backgroundColor: '#FFF5F5',
    borderRadius: scale(4),
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
  },
  bestSellerText: {
    color: '#E41C26',
    fontSize: scale(10),
    fontWeight: '700',
  },

  // Right Section
  rightSection: {
    alignItems: 'center',
  },
  itemImgWrap: {
    position: 'relative',
    marginBottom: scale(-18), // Overlap for button
  },
  itemImg: {
    width: scale(120),
    height: scale(120),
    borderRadius: scale(16),
    backgroundColor: '#F9F9F9',
  },
  itemFavBtn: {
    position: 'absolute',
    top: scale(8),
    right: scale(8),
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },

  // Action Buttons
  actionContainer: {
    width: scale(90),
    height: scale(36),
    backgroundColor: '#FFFFFF',
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    justifyContent: 'center',
    zIndex: 10,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  addBtnText: {
    color: '#E41C26',
    fontSize: scale(14),
    fontWeight: '800',
    marginRight: scale(4),
  },
  addIconWrap: {
    position: 'absolute',
    top: scale(2),
    right: scale(6),
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(8),
    height: '100%',
  },
  stepBtn: {
    width: scale(28),
    height: scale(28),
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepQty: {
    fontSize: scale(14),
    fontWeight: '800',
    color: '#E41C26',
    minWidth: scale(20),
    textAlign: 'center',
  },
});
