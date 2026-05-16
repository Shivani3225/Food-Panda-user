import React, { useContext, useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Pressable,
  ScrollView,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ChevronRight, Minus, Plus, Heart } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Tag } from 'lucide-react-native';


import { CartContext } from '../context/CartContext';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import AddToCartDrawer from '../components/AddToCartDrawer';
import { RefreshableWrapper } from '../components/RefreshableWrapper';
import { useLocation } from '../context/LocationContext';
import { toNumber } from '../services/cartPricing';
import { wp, hp } from '../utils/responsive';
import { scale } from '../utils/scale';
import { FONT_SIZES } from '../theme/typography';
import { SPACING } from '../theme/spacing';
import { useAuth } from '../context/AuthContext';
import { useTranslatedText } from '../hooks/useTranslatedData';
import { getRestaurantMenu } from '../services/restaurantService';
import Toast from 'react-native-toast-message';

function groupByRestaurant(cart) {
  const items = Array.isArray(cart) ? cart : [];
  const map = new Map();
  for (const it of items) {
    const key = String(it.restaurantId ?? 'na');
    if (!map.has(key)) {
      map.set(key, {
        restaurantId: it.restaurantId ?? null,
        restaurantName: it.restaurantName ?? it.restaurant?.name ?? 'Restaurant',
        restaurant: it.restaurant ?? null,
        items: [],
      });
    }
    map.get(key).items.push(it);
  }
  return Array.from(map.values());
}

// ── Cart Item Row ──────────────────────────────────────────────────────────────
function CartItemRow({ item, onIncrement, onDecrement, onEdit, onDelete, isDeleting, t }) {
  const { currencySymbol } = useAuth();
  const itemId = item?.id ?? item?.menuItemId ?? item?.productId;
  const qty = toNumber(item?.quantity, 1);
  const totalPrice = toNumber(item?.totalPrice, 0);
  const optionsLine = item?.selectedFlavor?.label || t('cart.original', 'Original');

  const translatedName = useTranslatedText(item?.name);
  const imageSource = item?.image && typeof item.image === 'string' && item.image.trim()
    ? { uri: item.image }
    : require('../assets/images/Food.png');

  return (
    <View style={styles.itemContainer}>
      <View style={styles.itemMainRow}>
        {/* Image */}
        <Image source={imageSource} style={styles.itemImg} />

        {/* Info */}
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>{translatedName || item?.name}</Text>
          <Text style={styles.itemOptions}>{optionsLine}</Text>
          {item.addOns && item.addOns.length > 0 && (
            <View style={styles.addonsContainer}>
              <Text style={styles.itemAddonsLabel}>{t('cart.add_ons', 'Add-Ons')}: </Text>
              <Text style={styles.itemAddons} numberOfLines={1}>
                {item.addOns.map(a => a.label).join(', ')}
              </Text>
            </View>
          )}
          <TouchableOpacity onPress={() => onEdit?.(item)} hitSlop={8}>
            <Text style={styles.itemEdit}>{t('cart.edit', 'Edit')}</Text>
          </TouchableOpacity>
        </View>

        {/* Stepper + Price */}
        <View style={styles.itemRight}>
          <View style={styles.stepper}>
            <Pressable
              style={styles.stepBtn}
              onPress={() => onDecrement?.(itemId)}
              hitSlop={8}
            >
              <Minus size={12} color="#E53935" />
            </Pressable>
            <Text style={styles.stepQty}>{qty}</Text>
            <Pressable
              style={styles.stepBtn}
              onPress={() => onIncrement?.(itemId)}
              hitSlop={8}
            >
              <Plus size={12} color="#E53935" />
            </Pressable>
          </View>
          <Text style={styles.itemPrice}>{currencySymbol}{totalPrice.toFixed(1)}</Text>
        </View>
      </View>

      {/* New Footer Row spanning full width below */}
      <View style={styles.itemFooterRow}>
        <Text style={styles.itemCount}>
          {t('cart.items_count', 'Items Count')} : {qty}
        </Text>
        <Text style={styles.itemTotal}>
          {t('cart.total_price_label', 'Total Price')} : {currencySymbol} {totalPrice.toFixed(0)}
        </Text>
      </View>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function CartScreen() {
  const { t } = useTranslation();
  const { currencySymbol } = useAuth();
  const navigation = useNavigation();
  const { cart, totals, incrementItem, decrementItem, removeFromCart, addToCart, address } = useContext(CartContext);
  const { address: globalAddress } = useLocation();

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [deleteItemName, setDeleteItemName] = useState('');
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [appliedCouponId, setAppliedCouponId] = useState(null);

  const groups = useMemo(() => groupByRestaurant(cart), [cart]);
  const hasItems = Array.isArray(cart) && cart.length > 0;

  const handleIncrement = useCallback(id => incrementItem?.(id), [incrementItem]);
  const handleDecrement = useCallback(id => decrementItem?.(id), [decrementItem]);

  const handleEdit = useCallback(async (item) => {
    try {
      const menuData = await getRestaurantMenu(item.restaurantId);
      const products = Array.isArray(menuData?.products) ? menuData.products : [];
      const product = products.find(p => String(p._id || p.id) === String(item.productId));
      
      if (!product) {
        Toast.show({
          type: 'error',
          text1: t('common.error', 'Error'),
          text2: 'Product details not found',
        });
        return;
      }

      setSelectedItem({
        ...product,
        id: product._id || product.id,
        cartLineId: item.id, // Track the actual cart line ID for editing
        quantity: item.quantity,
        selectedFlavor: item.selectedFlavor,
        selectedAddOns: item.addOns,
        notes: item.notes || '',
      });

      setSelectedRestaurant(item.restaurant || {
        id: item.restaurantId,
        _id: item.restaurantId,
        name: item.restaurantName,
      });
    } catch (error) {
      console.error('Error fetching product for edit:', error);
      Toast.show({
        type: 'error',
        text1: t('common.error', 'Error'),
        text2: 'Failed to fetch product details',
      });
    }
  }, [t]);

  const handleDelete = useCallback((itemId, itemName) => {
    setDeletingItemId(itemId);
    setDeleteItemName(itemName);
    setDeleteModalVisible(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingItemId) return;
    try {
      setIsDeletingItem(true);
      await removeFromCart(deletingItemId);
      setDeleteModalVisible(false);
      setDeletingItemId(null);
      setDeleteItemName('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeletingItem(false);
    }
  }, [deletingItemId, removeFromCart]);

  const handleCancelDelete = useCallback(() => {
    setDeleteModalVisible(false);
    setDeletingItemId(null);
    setDeleteItemName('');
  }, []);

  const closeDrawer = useCallback(() => {
    setSelectedItem(null);
    setSelectedRestaurant(null);
  }, []);

  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);

  useEffect(() => {
    const loadCoupons = async () => {
      try {
        setCouponsLoading(true);
        const { getCoupons } = require('../services/couponService');
        const data = await getCoupons();
        const promoList = Array.isArray(data) ? data : data?.promocodes || [];
        
        // If there's a restaurant in cart, only show coupons for that restaurant or global ones
        if (groups.length > 0) {
          const currentRestaurantId = groups[0].restaurantId;
          const filtered = promoList.filter(p => !p.restaurant || String(p.restaurant._id || p.restaurant) === String(currentRestaurantId));
          setCoupons(filtered);
        } else {
          setCoupons(promoList);
        }
      } catch (err) {
        console.warn('Failed to load coupons:', err);
      } finally {
        setCouponsLoading(false);
      }
    };
    if (hasItems) loadCoupons();
  }, [hasItems, groups]);

  const delivery = toNumber(totals?.delivery, 0);
  const tax = toNumber(totals?.tax, 0);
  const subtotal = toNumber(totals?.subtotal, 0);
  const platformFee = toNumber(totals?.platformFee, 0);
  const packaging = toNumber(totals?.packaging, 0);
  const smallCartFee = toNumber(totals?.smallCartFee, 0);
  const appliedCoupon = coupons.find(c => c.id === appliedCouponId || c._id === appliedCouponId || c.code === appliedCouponId) || null;
  const discount = useMemo(() => {
    if (!appliedCoupon) return 0;
    let d = 0;
    if (appliedCoupon.offerType === 'percent') {
      d = (subtotal * appliedCoupon.discountValue) / 100;
      if (appliedCoupon.maxDiscountAmount > 0) d = Math.min(d, appliedCoupon.maxDiscountAmount);
    } else if (appliedCoupon.offerType === 'amount' || appliedCoupon.offerType === 'flat') {
      d = appliedCoupon.discountValue || 0;
    }
    return Math.min(d, subtotal);
  }, [appliedCoupon, subtotal]);

  const isFreeDelivery = appliedCoupon?.offerType === 'free_delivery';
  const effectiveDelivery = isFreeDelivery ? 0 : delivery;
  const grandTotal = Math.max(0, subtotal + effectiveDelivery + tax + platformFee + packaging + smallCartFee - discount);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
          <Image source={require('../assets/icons/Backarrow.png')} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('cart.title', 'Cart')}</Text>
        <View style={{ width: scale(32) }} />
      </View>

      <RefreshableWrapper
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        onRefresh={() => { }}
      >
        {!hasItems ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>{t('cart.empty_title', 'Your cart is empty')}</Text>
            <Text style={styles.emptySub}>{t('cart.empty_message', 'Add items from a restaurant to get started.')}</Text>
          </View>
        ) : (
          <>
            {/* Estimated Delivery Banner */}
            <View style={styles.deliveryBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.deliveryLabel}>{t('cart.delivering_to', 'Delivering to')}</Text>
                <Text style={styles.deliveryValue} numberOfLines={1}>
                  {address?.label || address?.addressLine || globalAddress?.addressLine || t('cart.current_location', 'Current Location')}
                </Text>
              </View>
              <TouchableOpacity
                hitSlop={8}
                onPress={() => navigation.navigate('MainTabs', {
                  screen: 'Profile',
                  params: {
                    screen: 'AddressesScreen'
                  }
                })}
              >
                <Text style={styles.deliveryChange}>{t('cart.change', 'Change')}</Text>
              </TouchableOpacity>
            </View>

            {groups.map(group => {
              const restaurantName = group.restaurantName || t('cart.restaurant', 'Restaurant');
              const cuisineText = group.restaurant?.cuisines?.join?.(', ') || '';

              return (
                <View key={String(group.restaurantId ?? 'na')} style={styles.groupCard}>
                  {/* Restaurant Header */}
                  <TouchableOpacity
                    style={styles.restaurantRow}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('RestaurantDetail', {
                      restaurant: group.restaurant || {
                        id: group.restaurantId,
                        _id: group.restaurantId,
                        name: group.restaurantName
                      }
                    })}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.restaurantName}>{restaurantName}</Text>
                      {!!cuisineText && <Text style={styles.restaurantMeta}>{cuisineText}</Text>}
                    </View>
                    <ChevronRight size={18} color="#999" />
                  </TouchableOpacity>

                  <View style={styles.divider} />

                  {/* Items */}
                  {group.items.map((ci, idx) => {
                    const itemId = ci?.id || ci?._id || ci?.menuItemId || ci?.productId || idx;
                    return (
                      <CartItemRow
                        key={`cart-item-${String(itemId)}`}
                        item={ci}
                        onIncrement={handleIncrement}
                        onDecrement={handleDecrement}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                        isDeleting={String(deletingItemId ?? '') === String(itemId ?? '')}
                        t={t}
                      />
                    );
                  })}

                  {/* Add More Items */}
                  <TouchableOpacity
                    style={styles.addMoreBtn}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.addMoreText}>{t('cart.add_more_items', '+ Add More Items')}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* Offers Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('cart.offers', 'Offers')}</Text>

              {coupons.map((coupon, index) => {
                const isApplied = appliedCouponId === coupon.id;
                const couponId = coupon.id || coupon._id || coupon.code || index;
                return (
                  <View key={`coupon-${String(couponId)}`} style={styles.couponCard}>
                    <View style={{ flex: 1, paddingRight: scale(8) }}>
                      <Text style={styles.couponLabel} numberOfLines={3} ellipsizeMode="tail">
                        {coupon.label}
                      </Text>
                      <View style={styles.couponCodeBox}>
                        <Text style={styles.couponCode}>{coupon.id}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={isApplied ? styles.couponAppliedBtn : styles.couponApplyBtn}
                      onPress={() => setAppliedCouponId(prev => prev === coupon.id ? null : coupon.id)}
                      activeOpacity={0.85}
                    >
                      <Text style={isApplied ? styles.couponAppliedText : styles.couponApplyText}>
                        {isApplied ? t('cart.applied', 'Applied') : t('cart.apply', 'Apply')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}

              <TouchableOpacity
                style={styles.viewCouponsRow}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('MainTabs', {
                  screen: 'Profile',  // ← "ProfileTab" ki jagah "Profile" use karo
                  params: {
                    screen: 'Coupons'
                  }
                })}
              >
                <View style={styles.iconCircle}>
                  <Tag size={18} color="#E53935" />
                </View>
                <Text style={styles.viewCouponsText}>{t('cart.view_all_coupons', 'View all Coupons')}</Text>
                <ChevronRight size={16} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Bill Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('cart.bill_details', 'Bill Details')}</Text>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>{t('cart.subtotal', 'Subtotal')}</Text>
                <Text style={styles.billValue}>{currencySymbol}{subtotal.toFixed(2)}</Text>
              </View>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>{t('cart.delivery_fee', 'Standard Delivery')}</Text>
                <Text style={effectiveDelivery > 0 ? styles.billValue : styles.billFree}>
                  {effectiveDelivery > 0 ? `${currencySymbol}${effectiveDelivery.toFixed(2)}` : t('cart.free', 'Free')}
                </Text>
              </View>

              {tax > 0 && (
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>{t('cart.tax', 'Tax')}</Text>
                  <Text style={styles.billValue}>{currencySymbol}{tax.toFixed(2)}</Text>
                </View>
              )}

              {platformFee > 0 && (
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>{t('cart.service_fee', 'Service Fee')}</Text>
                  <Text style={styles.billValue}>{currencySymbol}{platformFee.toFixed(2)}</Text>
                </View>
              )}

              {packaging > 0 && (
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>{t('cart.packaging', 'Packaging')}</Text>
                  <Text style={styles.billValue}>{currencySymbol}{packaging.toFixed(2)}</Text>
                </View>
              )}

              {smallCartFee > 0 && (
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>{t('cart.small_cart_fee', 'Small Cart Fee')}</Text>
                  <Text style={styles.billValue}>{currencySymbol}{smallCartFee.toFixed(2)}</Text>
                </View>
              )}

              {discount > 0 && (
                <View style={styles.billRow}>
                  <View>
                    <Text style={styles.billLabel}>{t('cart.offer_applied', 'Offer Applied')}</Text>
                    <Text style={styles.billDiscountSub}>
                      {appliedCoupon ? `${appliedCoupon.id}` : '10% Off'}
                    </Text>
                  </View>
                  <Text style={styles.billDiscount}>-{currencySymbol}{discount.toFixed(2)}</Text>
                </View>
              )}

              <View style={styles.billDivider} />

              <View style={styles.billTotalRow}>
                <Text style={styles.billTotalLabel}>{t('cart.grand_total', 'Grand Total')}</Text>
                <Text style={styles.billTotalValue}>{currencySymbol}{grandTotal.toFixed(2)}</Text>
              </View>
            </View>

            {/* Popular with your Order */}
            {groups.map(group => {
              const popular = group.restaurant?.popularItems || group.restaurant?.menuItems || [];
              if (!popular.length) return null;
              return (
                <View key={`popular-${group.restaurantId}`} style={styles.popularSection}>
                  <Text style={styles.sectionTitle}>{t('cart.popular_with_order', 'Popular with your Order')}</Text>
                  <FlatList
                    horizontal
                    data={popular.slice(0, 6)}
                    keyExtractor={(item, idx) => item?.id || item?._id || String(idx)}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.popularList}
                    renderItem={({ item: pi }) => (
                      <View style={styles.popularCard}>
                        <View style={styles.popularImgWrap}>
                          <Image
                            source={
                              pi?.image
                                ? { uri: pi.image }
                                : require('../assets/images/Food.png')
                            }
                            style={styles.popularImg}
                          />
                          <TouchableOpacity style={styles.popularHeart} hitSlop={8}>
                            <Heart size={14} color="#111" fill="transparent" />
                          </TouchableOpacity>
                        </View>
                        <View style={styles.popularBody}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.popularPrice}>
                              {currencySymbol}{toNumber(pi?.price ?? pi?.basePrice, 0).toFixed(2)}
                            </Text>
                            <Text style={styles.popularName} numberOfLines={2}>
                              {pi?.name?.en || pi?.name || ''}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.popularAddBtn}
                            activeOpacity={0.85}
                            onPress={() =>
                              addToCart?.({
                                ...pi,
                                qty: 1,
                                restaurant: group.restaurant,
                                restaurantId: group.restaurantId,
                                restaurantName: group.restaurantName,
                              })
                            }
                          >
                            <Plus size={16} color="#555" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  />
                </View>
              );
            })}

            <View style={{ height: scale(20) }} />
          </>
        )}
      </RefreshableWrapper>

      {/* Bottom Bar */}
      {hasItems && (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.bottomTotal}>{currencySymbol}{grandTotal.toFixed(2)}</Text>
            <Text style={styles.bottomSub}>{t('cart.total_price', 'Total Price')}</Text>
          </View>
          <TouchableOpacity
            style={styles.reviewBtn}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('ReviewOrderScreen', {
              appliedCoupon: appliedCoupon,
              discount: discount
            })}
          >
            <Text style={styles.reviewBtnText}>{t('cart.review_order', 'Review Order')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <DeleteConfirmationModal
        visible={deleteModalVisible}
        itemName={deleteItemName}
        isDeleting={isDeletingItem}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {selectedItem && selectedRestaurant && (
        <AddToCartDrawer
          visible={!!selectedItem}
          item={selectedItem}
          restaurant={selectedRestaurant}
          onClose={closeDrawer}
          currencySymbol={currencySymbol}
          onAddToCart={closeDrawer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },

  // Header
  header: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderColor: '#EFEFEF',
  },
  backBtn: {
    width: scale(32),
    height: scale(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
    color: '#111',
  },

  scroll: { paddingBottom: scale(120) },

  backIcon: {
    width: scale(22),
    height: scale(22),
    resizeMode: 'contain',
  },

  // Empty
  emptyWrap: { paddingVertical: scale(60), alignItems: 'center', paddingHorizontal: SPACING.xl },
  emptyTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: '#111' },
  emptySub: { marginTop: SPACING.sm, color: '#777', fontWeight: '600', textAlign: 'center' },

  // Delivery Banner
  deliveryBanner: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: scale(8),
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryLabel: { fontSize: FONT_SIZES.sm, color: '#777', fontWeight: '600' },
  deliveryValue: { fontSize: FONT_SIZES.md, fontWeight: '800', color: '#111', marginTop: scale(2) },
  deliveryChange: { color: '#E53935', fontWeight: '700', fontSize: FONT_SIZES.sm, marginTop: scale(4) },

  // Group Card
  groupCard: {
    backgroundColor: '#FFF',
    marginBottom: scale(8),
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  restaurantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: SPACING.sm,
  },
  restaurantName: { fontSize: FONT_SIZES.md, fontWeight: '900', color: '#111' },
  restaurantMeta: { fontSize: FONT_SIZES.sm, color: '#777', marginTop: scale(2) },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: SPACING.sm },

  // Item Row
  itemContainer: {
    paddingVertical: SPACING.md,
  },
  itemMainRow: {
    flexDirection: 'row',
    gap: scale(10),
  },
  itemImg: {
    width: scale(72),
    height: scale(72),
    borderRadius: scale(10),
    backgroundColor: '#F5F5F5',
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: FONT_SIZES.sm, fontWeight: '800', color: '#111', lineHeight: scale(18) },
  itemOptions: { fontSize: FONT_SIZES.xs, color: '#777', marginTop: scale(2) },
  itemAddons: { fontSize: FONT_SIZES.xs, color: '#777', flex: 1 },
  addonsContainer: { flexDirection: 'row', alignItems: 'center', marginTop: scale(2) },
  itemAddonsLabel: { fontSize: FONT_SIZES.xs, color: '#E53935', fontWeight: '700' },
  itemEdit: { color: '#E53935', fontWeight: '700', fontSize: FONT_SIZES.xs, marginTop: scale(4) },
  itemFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: scale(14),
    paddingTop: scale(10),
    borderTopWidth: 1,
    borderTopColor: '#F2F2F2',
  },
  itemCount: {
    fontSize: scale(13),
    color: '#111',
    fontWeight: '700',
    paddingLeft: scale(82), // Aligns with the info section (image 72 + gap 10)
  },
  itemTotal: {
    fontSize: scale(13),
    color: '#111',
    fontWeight: '700'
  },
  itemRight: { alignItems: 'flex-end', justifyContent: 'flex-start', gap: scale(4) },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5393533',
    borderRadius: scale(6),
    overflow: 'hidden',
  },
  stepBtn: {
    width: scale(26),
    height: scale(26),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  stepQty: {
    width: scale(24),
    textAlign: 'center',
    fontWeight: '800',
    color: '#111',
    fontSize: FONT_SIZES.sm,
  },
  itemPrice: { fontSize: FONT_SIZES.sm, fontWeight: '800', color: '#111' },

  // Add More
  addMoreBtn: {
    marginTop: SPACING.sm,
    alignSelf: 'flex-start',
    backgroundColor: '#E53935',
    paddingHorizontal: SPACING.md,
    paddingVertical: scale(7),
    borderRadius: scale(8),
  },
  addMoreText: { color: '#FFF', fontWeight: '800', fontSize: FONT_SIZES.sm },

  // Section
  section: {
    backgroundColor: '#FFF',
    marginBottom: scale(8),
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  sectionTitle: { fontSize: FONT_SIZES.md, fontWeight: '900', color: '#111', marginBottom: SPACING.sm },

  // Coupons
  couponCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: scale(10),
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: scale(10),
  },
  couponLabel: { fontSize: FONT_SIZES.sm, color: '#111', fontWeight: '600' },
  couponCodeBox: {
    marginTop: scale(6),
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E53935',
    borderStyle: 'dashed',
    borderRadius: scale(6),
    paddingHorizontal: scale(10),
    paddingVertical: scale(3),
  },
  couponCode: { color: '#E53935', fontWeight: '800', fontSize: FONT_SIZES.sm },
  couponApplyBtn: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: scale(8),
    paddingHorizontal: SPACING.md,
    paddingVertical: scale(6),
  },
  couponApplyText: { fontWeight: '800', fontSize: FONT_SIZES.sm, color: '#111' },
  couponAppliedBtn: {
    borderWidth: 1,
    borderColor: '#E53935',
    borderRadius: scale(8),
    paddingHorizontal: SPACING.md,
    paddingVertical: scale(6),
    backgroundColor: '#FFECEC',
  },
  couponAppliedText: { fontWeight: '800', fontSize: FONT_SIZES.sm, color: '#E53935' },
  viewCouponsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: scale(8),
  },
  viewCouponsIcon: { fontSize: scale(16) },
  viewCouponsText: { flex: 1, fontWeight: '700', color: '#111', fontSize: FONT_SIZES.sm },

  // Bill
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: scale(6),
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  billLabel: { fontSize: FONT_SIZES.sm, color: '#555', fontWeight: '600' },
  billValue: { fontSize: FONT_SIZES.sm, color: '#111', fontWeight: '700' },
  billFree: { fontSize: FONT_SIZES.sm, color: '#E53935', fontWeight: '800' },
  billDiscount: { fontSize: FONT_SIZES.sm, color: '#E53935', fontWeight: '800' },
  billDiscountSub: { fontSize: FONT_SIZES.xs, color: '#E53935', fontWeight: '600', marginTop: scale(2) },
  billDivider: { height: 1, backgroundColor: '#DDD', marginVertical: SPACING.sm, borderStyle: 'dashed' },
  billTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: scale(4),
  },
  billTotalLabel: { fontSize: FONT_SIZES.md, fontWeight: '900', color: '#111' },
  billTotalValue: { fontSize: FONT_SIZES.md, fontWeight: '900', color: '#111' },

  // Popular with your Order
  popularSection: {
    backgroundColor: '#FFF',
    marginBottom: scale(8),
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
  },
  popularList: {
    paddingRight: SPACING.lg,
    gap: scale(12),
  },
  popularCard: {
    width: wp(38),
    backgroundColor: '#FFF',
    borderRadius: scale(14),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: scale(6),
    shadowOffset: { width: 0, height: 2 },
  },
  popularImgWrap: {
    position: 'relative',
  },
  popularImg: {
    width: '100%',
    height: scale(120),
    borderTopLeftRadius: scale(14),
    borderTopRightRadius: scale(14),
    backgroundColor: '#F5F5F5',
  },
  popularHeart: {
    position: 'absolute',
    top: scale(8),
    left: scale(8),
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    shadowOffset: { width: 0, height: 1 },
  },
  popularBody: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: scale(10),
    gap: scale(6),
  },
  popularPrice: {
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
    color: '#111',
  },
  popularName: {
    fontSize: FONT_SIZES.xs,
    color: '#555',
    fontWeight: '600',
    marginTop: scale(2),
    lineHeight: scale(14),
  },
  popularAddBtn: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(10),
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderColor: '#F0F0F0',
    paddingHorizontal: SPACING.lg,
    paddingVertical: scale(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  bottomTotal: { 
    fontSize: scale(22), 
    fontWeight: '900', 
    color: '#000',
    lineHeight: scale(28),
  },
  bottomSub: { 
    fontSize: scale(12), 
    color: '#555', 
    fontWeight: '600',
    marginTop: -2,
  },
  reviewBtn: {
    backgroundColor: '#E53935',
    borderRadius: scale(18),
    paddingHorizontal: scale(30),
    height: scale(52),
    minWidth: wp(55),
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewBtnText: { 
    color: '#FFF', 
    fontWeight: '800', 
    fontSize: scale(16),
  },
});
