import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Heart, ChevronRight, Settings, Plus, Minus } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { CartContext } from '../context/CartContext';
import { FavouritesContext } from '../context/FavouritesContext';
import { useAuth } from '../context/AuthContext';
import { buildCartLineId } from '../services/cartPricing';
import AddToCartDrawer from '../components/AddToCartDrawer';
import { scale } from '../utils/scale';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function toNumber(value, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function normalizeFlavors(item) {
  const raw =
    item?.variations ||
    item?.flavors ||
    item?.flavourOptions ||
    item?.variants ||
    item?.options?.flavors ||
    item?.options?.flavours ||
    [];
  return Array.isArray(raw) ? raw : [];
}

function normalizeFrequentlyBought(item) {
  const raw =
    item?.addOns ||
    item?.frequentlyBoughtTogether ||
    item?.frequentlyBought ||
    item?.addons ||
    item?.extras ||
    item?.options?.frequentlyBoughtTogether ||
    item?.options?.addons ||
    [];
  return Array.isArray(raw) ? raw : [];
}

export default function MenuItemDetail() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { menuItem, restaurant } = route.params || {};

  const { addToCart, loading: cartLoading } = useContext(CartContext);
  const { isFavourite, toggleFavourite } = useContext(FavouritesContext);
  const { currencySymbol: globalCurrencySymbol } = useAuth();

  const [qty, setQty] = useState(1);
  const [showCustomizer, setShowCustomizer] = useState(false);

  if (!menuItem) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{t('common.item_not_found', 'Item not found')}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>{t('common.go_back', 'Go Back')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const activeCurrencySymbol = restaurant?.currencySymbol || globalCurrencySymbol || '₱';
  const basePrice = toNumber(menuItem.price || menuItem.basePrice, 0);

  // Normalizations for options check
  const flavors = normalizeFlavors(menuItem);
  const frequentlyBought = normalizeFrequentlyBought(menuItem);
  const hasOptions = flavors.length > 0 || frequentlyBought.length > 0;

  // Translated item name and description
  const itemName = menuItem.nameKey ? t(menuItem.nameKey, menuItem.name) : menuItem.name;
  const itemDescription = menuItem.descriptionKey ? t(menuItem.descriptionKey, menuItem.description) : menuItem.description;

  const isFavorite = isFavourite?.(menuItem.id || menuItem._id, 'product');

  const handleToggleFav = () => {
    const rId = restaurant?.id || restaurant?._id || menuItem?.restaurantId || menuItem?.restaurant_id;
    if (!rId) {
      Toast.show({
        type: 'topError',
        text1: t('common.error', 'Error'),
        text2: t('menu.fav_failed', 'Could not add to favorites. Restaurant info missing.'),
        position: 'top',
      });
      return;
    }
    toggleFavourite?.({
      id: buildCartLineId({
        restaurantId: rId,
        menuItemId: menuItem.id || menuItem._id,
        selectedFlavorId: null,
        addOnIds: [],
      }),
      menuItemId: menuItem.id || menuItem._id,
      name: menuItem.name,
      image: menuItem.image,
      price: basePrice,
      basePrice: basePrice,
      restaurantId: rId,
      restaurantName: restaurant?.name?.en || restaurant?.name || 'Restaurant',
      type: 'product',
    });
  };

  const handleMainAddToCart = async () => {
    if (hasOptions) {
      setShowCustomizer(true);
      return;
    }

    const rId = restaurant?.id || restaurant?._id || menuItem?.restaurantId || menuItem?.restaurant_id;
    const payload = {
      ...menuItem,
      quantity: qty,
      restaurantId: rId,
    };

    console.log('MenuItemDetail: Adding simple item to cart:', payload);
    const res = await addToCart(payload);

    if (res && !res.error && !res.conflict) {
      Toast.show({
        type: 'success',
        text1: t('common.added_to_cart', 'Added to Cart'),
        text2: `${itemName} has been added to your cart.`,
        position: 'bottom',
      });
      navigation.goBack();
    }
  };

  const foodTypeLower = menuItem?.foodType?.toLowerCase()?.trim();
  const isVeg = menuItem?.isVeg === true || foodTypeLower === 'veg' || foodTypeLower === 'vegetarian';
  const isNonVeg = menuItem?.isVeg === false || foodTypeLower === 'non-veg' || foodTypeLower === 'nonveg' || foodTypeLower === 'non veg' || foodTypeLower === 'non vegetarian';
  const foodTypeColor = isVeg ? '#008000' : isNonVeg ? '#E41C26' : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Absolute Header Controls */}
      <View style={styles.headerControls}>
        <TouchableOpacity style={styles.controlCircle} onPress={() => navigation.goBack()}>
          <X size={20} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlCircle} onPress={handleToggleFav}>
          <Heart size={20} color={isFavorite ? '#E41C26' : '#333'} fill={isFavorite ? '#E41C26' : 'transparent'} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Product Image */}
        <Image
          source={menuItem.image ? { uri: menuItem.image } : require('../assets/images/Food.png')}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Product Details Area */}
        <View style={styles.detailsCard}>
          <View style={styles.badgeRow}>
            {foodTypeColor && (
              <View style={[styles.foodTypeIcon, { borderColor: foodTypeColor }]}>
                <View style={[styles.foodTypeDot, { backgroundColor: foodTypeColor }]} />
              </View>
            )}
            {menuItem.isBestSeller && (
              <View style={styles.bestsellerPill}>
                <Text style={styles.bestsellerText}>⭐ {t('menu.bestseller', 'Bestseller')}</Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>{itemName}</Text>
          <Text style={styles.price}>
            {activeCurrencySymbol} {basePrice.toFixed(2)}
          </Text>

          {itemDescription ? (
            <Text style={styles.desc}>{itemDescription}</Text>
          ) : null}
        </View>

        {/* Addon / Customisation Trigger Button */}
        {hasOptions && (
          <View style={styles.customiseSection}>
            <Text style={styles.sectionHeader}>{t('menu.customise_title', 'Customisation')}</Text>
            <TouchableOpacity style={styles.customiseCard} onPress={() => setShowCustomizer(true)}>
              <View style={styles.customiseLeft}>
                <View style={styles.settingsIconWrap}>
                  <Settings size={18} color="#E41C26" />
                </View>
                <View>
                  <Text style={styles.customiseTitle}>{t('menu.customize_meal', 'Customise your meal')}</Text>
                  <Text style={styles.customiseSubtitle}>
                    {flavors.length > 0 && frequentlyBought.length > 0
                      ? t('menu.select_flavor_addons', 'Select flavor & add-ons')
                      : flavors.length > 0
                      ? t('menu.select_flavor', 'Select flavor options')
                      : t('menu.select_addons', 'Select add-ons')}
                  </Text>
                </View>
              </View>
              <View style={styles.customiseRight}>
                <Text style={styles.requiredPill}>
                  {flavors.length > 0 ? t('common.required', 'Required') : t('common.optional', 'Optional')}
                </Text>
                <ChevronRight size={18} color="#9E9E9E" />
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Floating Bottom Navigation Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.qtyBox}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => qty > 1 && setQty(qty - 1)}
            disabled={hasOptions}
          >
            <Minus size={18} color={hasOptions ? '#C0C0C0' : '#E41C26'} strokeWidth={3} />
          </TouchableOpacity>

          <Text style={[styles.qty, hasOptions && styles.qtyDisabled]}>{qty}</Text>

          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => setQty(qty + 1)}
            disabled={hasOptions}
          >
            <Plus size={18} color={hasOptions ? '#C0C0C0' : '#E41C26'} strokeWidth={3} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={handleMainAddToCart}
          disabled={cartLoading}
        >
          {cartLoading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.addText}>
              {hasOptions
                ? t('menu.customize_to_add', 'Customise to Add')
                : `${t('menu_item.add_to_cart', 'Add to Cart')} — ${activeCurrencySymbol}${(qty * basePrice).toFixed(2)}`}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Reusable customization drawer */}
      {showCustomizer && (
        <AddToCartDrawer
          visible={showCustomizer}
          item={menuItem}
          restaurant={restaurant}
          onClose={() => setShowCustomizer(false)}
          currencySymbol={activeCurrencySymbol}
          onAddToCart={() => {
            setShowCustomizer(false);
            Toast.show({
              type: 'success',
              text1: t('common.added_to_cart', 'Added to Cart'),
              text2: `${itemName} ${t('common.added_success_msg', 'has been added to your cart successfully!')}`,
              position: 'bottom',
            });
            navigation.goBack();
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  headerControls: {
    position: 'absolute',
    top: scale(16),
    left: scale(16),
    right: scale(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  controlCircle: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  scrollContent: {
    paddingBottom: scale(100),
  },
  image: {
    width: SCREEN_WIDTH,
    height: scale(280),
    backgroundColor: '#EEEEEE',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    padding: scale(16),
    borderBottomLeftRadius: scale(24),
    borderBottomRightRadius: scale(24),
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(8),
  },
  foodTypeIcon: {
    width: scale(14),
    height: scale(14),
    borderWidth: 1.5,
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
  bestsellerPill: {
    backgroundColor: '#FFF8E1',
    borderRadius: scale(6),
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
  },
  bestsellerText: {
    color: '#FFB300',
    fontSize: scale(10),
    fontWeight: '800',
  },
  title: {
    fontSize: scale(22),
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: scale(4),
  },
  price: {
    fontSize: scale(18),
    fontWeight: '700',
    color: '#E41C26',
    marginBottom: scale(12),
  },
  desc: {
    fontSize: scale(13),
    color: '#666666',
    lineHeight: scale(19),
  },
  customiseSection: {
    marginTop: scale(20),
    paddingHorizontal: scale(16),
  },
  sectionHeader: {
    fontSize: scale(14),
    fontWeight: '700',
    color: '#666666',
    marginBottom: scale(8),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  customiseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    padding: scale(16),
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  customiseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsIconWrap: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(10),
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  customiseTitle: {
    fontSize: scale(14),
    fontWeight: '700',
    color: '#1A1A1A',
  },
  customiseSubtitle: {
    fontSize: scale(11),
    color: '#757575',
    marginTop: scale(2),
  },
  customiseRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  requiredPill: {
    fontSize: scale(10),
    fontWeight: '700',
    color: '#E41C26',
    backgroundColor: '#FFF0F0',
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(8),
    overflow: 'hidden',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    gap: scale(12),
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: scale(12),
    height: scale(44),
    paddingHorizontal: scale(4),
  },
  qtyBtn: {
    width: scale(36),
    height: scale(36),
    justifyContent: 'center',
    alignItems: 'center',
  },
  qty: {
    marginHorizontal: scale(12),
    fontWeight: '800',
    fontSize: scale(15),
    color: '#1A1A1A',
    minWidth: scale(20),
    textAlign: 'center',
  },
  qtyDisabled: {
    color: '#999999',
  },
  addBtn: {
    flex: 1,
    backgroundColor: '#E41C26',
    height: scale(44),
    borderRadius: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E41C26',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  addText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: scale(14),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontSize: scale(16),
    color: '#666',
    marginBottom: scale(16),
  },
  backBtn: {
    backgroundColor: '#E41C26',
    paddingHorizontal: scale(20),
    paddingVertical: scale(10),
    borderRadius: scale(8),
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});