import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { CartContext } from '../context/CartContext';
import { buildCartLineId } from '../services/cartPricing';
import { debounceAsync } from '../utils/debounce';
import { useAuth } from '../context/AuthContext';
import { useTranslatedText } from '../hooks/useTranslatedData';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function toNumber(value, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function getItemFeatures(p, nameOverride = null) {
  if (!p || typeof p !== 'object') return { type: 'other', badge: null };

  const nameValue = nameOverride || (typeof p.name === 'string' ? p.name : (p.name?.en || p.name?.ar || p.name?.de || p.label || p.title || ''));
  const labelStr = String(nameValue).toLowerCase();
  const foodTypeLower = (p.type || p.foodType || p.food_type || p.item_type || '')?.toLowerCase()?.trim();

  // Keywords for fallback detection
  const vegKeywords = ['veg', 'paneer', 'corn', 'mushroom', 'potato', 'aloo', 'onion', 'garlic', 'tomato', 'orange', 'fruit', 'sweet', 'vegetable'];
  const nonVegKeywords = ['chicken', 'meat', 'beef', 'mutton', 'egg', 'fish', 'prawn', 'bacon', 'ham', 'salami', 'pepperoni', 'nonveg', 'non-veg'];
  const proteinKeywords = ['protein', 'whey', 'soya', 'soy', 'tofu', 'nut', 'almond', 'peanut'];
  const fastFoodKeywords = ['cheese', 'cheez', 'pizza', 'burger', 'fries', 'fry', 'junk', 'fastfood', 'nugget', 'hotdog', 'sandwich', 'sauce', 'dip', 'mayo', 'ketchup', 'coke', 'pepsi'];

  const isFastFoodByLabel = fastFoodKeywords.some(k => labelStr.includes(k));
  const isVegByLabel = vegKeywords.some(k => labelStr.includes(k)) && !nonVegKeywords.some(k => labelStr.includes(k)) && !isFastFoodByLabel;
  const isNonVegByLabel = nonVegKeywords.some(k => labelStr.includes(k));
  const isProteinByLabel = proteinKeywords.some(k => labelStr.includes(k));

  const isVeg = 
    p.isVeg === true || p.veg === true || p.is_veg === true || 
    p.isVeg === 1 || p.veg === 1 || p.is_veg === 1 ||
    String(p.isVeg) === 'true' || String(p.veg) === 'true' ||
    foodTypeLower === 'veg' || foodTypeLower === 'vegetarian' || foodTypeLower === '1' ||
    isVegByLabel;

  const isNonVeg = 
    p.isVeg === false || p.veg === false || p.is_veg === false || 
    p.isNonVeg === true || p.nonVeg === true || p.is_non_veg === true ||
    p.isVeg === 2 || p.veg === 2 || p.isNonVeg === 1 ||
    String(p.isVeg) === 'false' || String(p.isNonVeg) === 'true' ||
    foodTypeLower === 'non-veg' || foodTypeLower === 'nonveg' || foodTypeLower === 'non-vegetarian' || foodTypeLower === '2' ||
    isNonVegByLabel;

  const isProteinRich = p.isProteinRich === true || p.proteinRich === true || p.is_protein_rich === true || String(p.isProteinRich) === 'true' || isProteinByLabel;
  const isBestsellerRaw = p.isBestseller === true || p.bestseller === true || p.is_bestseller === true || String(p.isBestseller) === 'true' || labelStr.includes('best');

  let badge = p.badge || null;
  if (!badge) {
    if (isVeg && isBestsellerRaw) badge = 'Bestseller';
    else if (isNonVeg || isProteinRich) badge = 'Protein Rich';
  }

  const type = isFastFoodByLabel ? 'fastfood' : (isVeg ? 'veg' : (isNonVeg ? 'non-veg' : 'other'));
  
  return { type, badge, isVeg, isNonVeg, isProteinRich, isFastFood: isFastFoodByLabel, name: nameValue };
}

function normalizeFlavors(item) {
  const raw =
    item?.variations ||
    item?.flavors ||
    item?.variation ||
    item?.product?.variations ||
    item?.product?.flavors ||
    [];

  if (!Array.isArray(raw)) return [];

  const normalized = raw
    .map((f, idx) => {
      if (typeof f === 'string') {
        return { id: String(idx), label: f, priceDelta: 0, type: 'other', badge: null };
      }
      if (f && typeof f === 'object') {
        const features = getItemFeatures(f);
        console.log(`DEBUG: Flavor "${features.name}" | Type: ${features.type} | Badge: ${features.badge}`);

        return {
          id: String(f._id ?? f.id ?? idx),
          label: features.name,
          priceDelta: toNumber(f.priceDelta ?? f.extraPrice ?? f.price ?? 0, 0),
          type: features.type,
          badge: features.badge,
        };
      }
      return null;
    })
    .filter(Boolean);

  return normalized;
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

  if (!Array.isArray(raw)) return [];

  const normalized = raw
    .map((x, idx) => {
      if (typeof x === 'string') {
        return { id: String(idx), label: x, price: 0, image: null };
      }
      if (x && typeof x === 'object') {
        const itemObj = x.product || x;
        const nameObj = itemObj.name || itemObj.label || itemObj.title || '';
        const nameValue =
          typeof nameObj === 'string'
            ? nameObj
            : (nameObj.en || nameObj.ar || nameObj.de || String(nameObj));

        console.log(`DEBUG: Add-on "${nameValue}" | Image: ${itemObj.image || 'NONE'}`);
        
        return {
          id: String(x._id ?? x.id ?? idx),
          label: nameValue,
          price: toNumber(x.price ?? x.extraPrice ?? itemObj.price ?? 0, 0),
          image: itemObj.image || itemObj.img || itemObj.coverImage || null,
        };
      }
      return null;
    })
    .filter(Boolean);

  return normalized;
}

const AddonItem = ({ item, isChecked, onToggle, currencySymbol }) => {
  const [imgError, setImgError] = useState(false);
  const itemImage = !imgError && item.image && String(item.image).length > 0 
    ? { uri: item.image } 
    : require('../assets/images/Food.png');

  return (
    <Pressable
      style={styles.addonRow}
      onPress={() => onToggle(item.id)}
    >
      <Image 
        source={itemImage} 
        style={styles.addonImage} 
        onError={() => setImgError(true)}
      />
      
      <View style={styles.addonMain}>
        <Text style={styles.optionLabel}>{item.label}</Text>
      </View>

      <View style={styles.optionRight}>
        {toNumber(item.price, 0) > 0 && (
          <Text style={styles.optionPrice}>
            {currencySymbol}
            {toNumber(item.price, 0)}
          </Text>
        )}
        <View
          style={[
            styles.checkbox,
            isChecked && styles.checkboxChecked,
          ]}
        >
          {isChecked && <Text style={styles.checkboxTick}>✓</Text>}
        </View>
      </View>
    </Pressable>
  );
};

export default function AddToCartDrawer({
  visible,
  item,
  categoryItems = [],
  category = null,
  restaurant,
  onClose,
  currencySymbol,
  onAddToCart,
  isCategoryDrawer = false,
}) {
  const { t } = useTranslation();
  const { currencySymbol: globalCurrencySymbol } = useAuth();
  const activeCurrencySymbol = currencySymbol || globalCurrencySymbol;

  // Translate item name and description
  const translatedItemName = useTranslatedText(item?.name);
  const translatedItemDesc = useTranslatedText(item?.description);

  console.log('💰 [AddToCartDrawer] Props currencySymbol:', currencySymbol);
  console.log('✅ [AddToCartDrawer] Active currencySymbol:', activeCurrencySymbol);

  const sheetHeight = SCREEN_HEIGHT * 0.85;

  const translateY = useRef(new Animated.Value(sheetHeight)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const openedAtRef = useRef(0);
  const scrollViewRef = useRef(null);
  const notesInputRef = useRef(null);
  const openedFreshCartResolvedAtRef = useRef(0);
  const [shouldRender, setShouldRender] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [selectedFlavorId, setSelectedFlavorId] = useState(null);
  const [selectedTogetherIds, setSelectedTogetherIds] = useState(
    () => new Set(),
  );
  const [notes, setNotes] = useState('');
  const [showAllFlavors, setShowAllFlavors] = useState(false);
  const [showAllTogether, setShowAllTogether] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category drawer specific states
  const [selectedCategoryItem, setSelectedCategoryItem] = useState(null);
  const [showItemDrawer, setShowItemDrawer] = useState(false);

  const { addToCart, updateCartItem, removeFromCart, freshCartResolvedAt } = useContext(CartContext);

  const basePrice = useMemo(() => {
    // If it's a cart item (edit mode), use item.basePrice which was calculated in CartContext
    // Otherwise use item.price or item.basePrice (standard product properties)
    const val = item?.basePrice ?? item?.price ?? 0;
    return toNumber(val, 0);
  }, [item]);

  const flavors = useMemo(() => normalizeFlavors(item?.product || item), [item]);
  const frequentlyBought = useMemo(
    () => normalizeFrequentlyBought(item?.product || item),
    [item],
  );

  useEffect(() => {
    if (!visible) return;

    if (item?.cartLineId) {
      // Pre-fill for edit mode
      setQuantity(toNumber(item.quantity, 1));
      setNotes(item.notes || '');

      const addonIds = new Set();
      if (Array.isArray(item.selectedAddOns)) {
        item.selectedAddOns.forEach(a => {
          const id = a.id || a._id;
          if (id) addonIds.add(String(id));
        });
      }
      setSelectedTogetherIds(addonIds);

      if (item.selectedFlavor) {
        setSelectedFlavorId(String(item.selectedFlavor.id || item.selectedFlavor._id));
      } else {
        setSelectedFlavorId(null);
      }
    } else {
      // Default for add mode
      setQuantity(1);
      setNotes('');
      setSelectedTogetherIds(new Set());
      setSelectedFlavorId(null);
    }

    setIsSubmitting(false);
    setShowAllFlavors(false);
    setShowAllTogether(false);
  }, [visible, item]);

  useEffect(() => {
    if (visible) {
      openedFreshCartResolvedAtRef.current = freshCartResolvedAt || 0;
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    if (!freshCartResolvedAt) return;

    if (freshCartResolvedAt > openedFreshCartResolvedAtRef.current) {
      onClose?.();
    }
  }, [freshCartResolvedAt, visible, onClose]);

  const selectedFlavor = useMemo(() => {
    if (!selectedFlavorId) return null;
    return flavors.find(f => f.id === selectedFlavorId) ?? null;
  }, [flavors, selectedFlavorId]);

  const selectedTogetherTotal = useMemo(() => {
    if (!frequentlyBought.length || !selectedTogetherIds?.size) return 0;
    let total = 0;
    for (const extra of frequentlyBought) {
      if (selectedTogetherIds.has(extra.id)) total += toNumber(extra.price, 0);
    }
    return total;
  }, [frequentlyBought, selectedTogetherIds]);

  const perUnitTotal = useMemo(() => {
    const flavorDelta = selectedFlavor
      ? toNumber(selectedFlavor.priceDelta, 0)
      : 0;
    const unitTotal = basePrice + flavorDelta + selectedTogetherTotal;

    return unitTotal;
  }, [basePrice, selectedFlavor, selectedTogetherTotal]);

  const totalPrice = useMemo(() => {
    const total = perUnitTotal * Math.max(1, quantity);
    return total;
  }, [perUnitTotal, quantity]);

  const animateOpen = useCallback(() => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [overlayOpacity, translateY]);

  const animateClose = useCallback((cb) => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: sheetHeight,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) cb?.();
    });
  }, [overlayOpacity, translateY, sheetHeight]);

  useEffect(() => {
    if (!visible) {
      setShouldRender(false);
      return;
    }

    openedAtRef.current = Date.now();

    translateY.setValue(sheetHeight);
    overlayOpacity.setValue(0);

    requestAnimationFrame(() => {
      setShouldRender(true);
      requestAnimationFrame(() => {
        animateOpen();
      });
    });

  }, [animateOpen, overlayOpacity, sheetHeight, translateY, visible]);

  const requestClose = useCallback(() => {
    if (!visible) return;

    if (Date.now() - openedAtRef.current < 280) return;

    animateClose(onClose);
  }, [animateClose, onClose, visible]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => {
          const { dy, dx } = gesture;
          return Math.abs(dy) > 6 && Math.abs(dy) > Math.abs(dx);
        },
        onPanResponderMove: (_, gesture) => {
          const dy = Math.max(0, gesture.dy);
          translateY.setValue(dy);
        },
        onPanResponderRelease: (_, gesture) => {
          const dy = Math.max(0, gesture.dy);
          const vy = gesture.vy;

          const shouldClose = dy > 120 || vy > 1.2;
          if (shouldClose) {
            requestClose();
          } else {
            Animated.timing(translateY, {
              toValue: 0,
              duration: 180,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }).start();
          }
        },
      }),

    [requestClose, translateY],
  );

  const toggleTogether = id => {
    setSelectedTogetherIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const decQty = () => setQuantity(q => Math.max(1, q - 1));
  const incQty = () => setQuantity(q => Math.min(99, q + 1));

  const handleAdd = useCallback(async () => {
    if (!item || isSubmitting) {
      console.log('🚫 [AddToCartDrawer] Click ignored:', { hasItem: !!item, isSubmitting });
      return;
    }

    console.log('🖱️ [AddToCartDrawer] Add to Cart clicked');
    setIsSubmitting(true);
    try {
      const addOnsIds = Array.from(selectedTogetherIds);

      const restaurantId = String(restaurant?.id || restaurant?._id || '');
      const productId = String(item?._id || item?.id || '');

      if (!restaurantId || !productId || restaurantId === '' || productId === '') {
        console.error('❌ [AddToCartDrawer] Missing restaurantId or productId:', { restaurantId, productId });
        Toast.show({
          type: 'topError',
          text1: t('common.error', 'Error'),
          text2: 'Product or Restaurant information is missing',
          position: 'top',
        });
        setIsSubmitting(false);
        return;
      }

      const cartItem = {
        restaurantId,
        productId,
        quantity,
        addOnsIds: addOnsIds.map(id => String(id)),
      };

      if (selectedFlavorId) {
        cartItem.variationId = String(selectedFlavorId);
      }

      if (notes && notes.trim()) {
        cartItem.notes = notes.trim();
      }

      console.log('🚀 [AddToCartDrawer] Attempting to add item:', cartItem);

      if (!addToCart) {
        console.error('❌ [AddToCartDrawer] addToCart function is missing from context!');
        Toast.show({
          type: 'topError',
          text1: t('common.error', 'Error'),
          text2: 'Internal Error: Cart functionality unavailable',
          position: 'top',
        });
        setIsSubmitting(false);
        return;
      }

      let result;
      if (item?.cartLineId) {
        console.log('🔄 [AddToCartDrawer] UPDATE MODE DETECTED');
        console.log('   - Old Cart Line ID:', item.cartLineId);
        console.log('   - New Item Payload:', JSON.stringify(cartItem, null, 2));
        result = await updateCartItem(item.cartLineId, cartItem);
      } else {
        console.log('➕ [AddToCartDrawer] ADD MODE DETECTED');
        console.log('   - Item Payload:', JSON.stringify(cartItem, null, 2));
        result = await addToCart(cartItem);
      }

      console.log('📥 [AddToCartDrawer] Result from Backend:', JSON.stringify(result, null, 2));

      if (result?.conflict) {
        console.log('⚠️ [AddToCartDrawer] Conflict detected, not closing drawer');
        setIsSubmitting(false);
        return;
      }

      if (result?.success || !result?.error) {
        console.log('✅ [AddToCartDrawer] Operation successful');
        onAddToCart?.();
        requestClose();
      } else {
        console.error('❌ [AddToCartDrawer] Operation failed:', result);
        setIsSubmitting(false);
        Toast.show({
          type: 'topError',
          text1: t('common.error', 'Error'),
          text2: result?.error || t('cart.add_failed', 'Failed to add item to cart'),
          position: 'top',
        });
      }
    } catch (error) {
      console.error('🔥 [AddToCartDrawer] Exception in handleAdd:', error);
      setIsSubmitting(false);
      Toast.show({
        type: 'topError',
        text1: t('common.error', 'Error'),
        text2: error?.message || t('cart.add_failed', 'Failed to add item to cart'),
        position: 'top',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [item, isSubmitting, selectedFlavorId, selectedTogetherIds, quantity, notes, restaurant, addToCart, onAddToCart, requestClose, t]);

  // Category drawer specific functions
  const handleQuickAdd = async (menuItem) => {
    setIsSubmitting(true);
    try {
      const cartItem = {
        restaurantId: restaurant?.id || restaurant?._id,
        productId: menuItem?._id || menuItem?.id,
        quantity: 1,
        addOnsIds: [],
      };

      const result = await addToCart(cartItem);
      if (result?.success || !result?.error) {
        Toast.show({
          type: 'topSuccess',
          text1: t('common.success', 'Success'),
          text2: t('cart.item_added', 'Item added to cart'),
          position: 'top',
        });
      } else {
        Toast.show({
          type: 'topError',
          text1: t('common.error', 'Error'),
          text2: t('cart.add_failed', 'Failed to add item to cart'),
          position: 'top',
        });
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      Toast.show({
        type: 'topError',
        text1: t('common.error', 'Error'),
        text2: error?.message || t('cart.add_failed', 'Failed to add item to cart'),
        position: 'top',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCategoryItems = () => {
    return (
      <ScrollView
        style={styles.categoryItemsContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {categoryItems.map((menuItem, index) => (
          <Pressable
            key={menuItem.id}
            style={styles.categoryMenuItem}
            onPress={() => {
              setSelectedCategoryItem(menuItem);
              setShowItemDrawer(true);
            }}
          >
            <Image source={{ uri: menuItem.image }} style={styles.categoryItemImage} />
            <View style={styles.categoryItemDetails}>
              <Text style={styles.categoryItemName}>{menuItem.name}</Text>
              {menuItem.description && (
                <Text style={styles.categoryItemDesc} numberOfLines={2}>
                  {menuItem.description}
                </Text>
              )}
              <Text style={styles.categoryItemPrice}>
                {activeCurrencySymbol}{menuItem.price}
              </Text>
            </View>
            <Pressable
              style={styles.addButton}
              onPress={(e) => {
                e.stopPropagation();
                handleQuickAdd(menuItem);
              }}
            >
              <Text style={styles.addButtonText}>+</Text>
            </Pressable>
          </Pressable>
        ))}
      </ScrollView>
    );
  };

  const itemImageSource =
    item?.image != null && String(item.image).length
      ? { uri: String(item.image) }
      : require('../assets/images/Food.png');

  const initialFlavorCount = 5;
  const initialTogetherCount = 4;

  const visibleFlavors = showAllFlavors
    ? flavors
    : flavors.slice(0, initialFlavorCount);

  const hiddenFlavorCount = Math.max(0, flavors.length - visibleFlavors.length);

  const visibleTogether = showAllTogether
    ? frequentlyBought
    : frequentlyBought.slice(0, initialTogetherCount);

  const hiddenTogetherCount = Math.max(
    0,
    frequentlyBought.length - visibleTogether.length,
  );

  // Category drawer mode
  if (isCategoryDrawer && category) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <View style={styles.modalRoot}>
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          </Animated.View>

          <Pressable style={styles.closeFab} onPress={onClose}>
            <Text style={styles.closeFabText}>×</Text>
          </Pressable>

          <Animated.View
            style={[
              styles.sheet,
              {
                height: SCREEN_HEIGHT * 0.9,
                transform: [{ translateY }],
              },
            ]}
          >
            <View style={styles.handleWrap} {...panResponder.panHandlers}>
              <View style={styles.handle} />
            </View>

            {/* Category Header */}
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryHeaderTitle}>{category.name}</Text>
              <Text style={styles.categoryHeaderCount}>
                {categoryItems.length} items
              </Text>
            </View>

            {/* Category Items List */}
            {renderCategoryItems()}

            {/* Bottom Bar for Category Mode */}
            <View style={styles.bottomBar}>
              <Pressable onPress={onClose} style={styles.closeCategoryBtn}>
                <Text style={styles.closeCategoryBtnText}>Close</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>

        {/* Nested Drawer for Item Details */}
        {showItemDrawer && selectedCategoryItem && (
          <AddToCartDrawer
            visible={showItemDrawer}
            item={selectedCategoryItem}
            restaurant={restaurant}
            onClose={() => {
              setShowItemDrawer(false);
              setSelectedCategoryItem(null);
            }}
            currencySymbol={currencySymbol}
            onAddToCart={() => {
              setShowItemDrawer(false);
              setSelectedCategoryItem(null);
            }}
            isCategoryDrawer={false}
          />
        )}
      </Modal>
    );
  }

  // Single item drawer mode (original)
  if (!visible) return null;
  if (!shouldRender) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={requestClose}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={requestClose} />
        </Animated.View>

        <Pressable style={styles.closeFab} onPress={requestClose}>
          <Text style={styles.closeFabText}>×</Text>
        </Pressable>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end' }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <Animated.View
            style={[
              styles.sheet,
              {
                height: sheetHeight,
                transform: [{ translateY }],
              },
            ]}
          >
            <View style={styles.handleWrap} {...panResponder.panHandlers}>
              <View style={styles.handle} />
            </View>

            <ScrollView
              ref={scrollViewRef}
              style={styles.content}
              contentContainerStyle={{ paddingBottom: 180 + (Platform.OS === 'ios' ? 10 : 0) }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.heroCard}>
                <Image source={itemImageSource} style={styles.heroImage} />
              </View>

              <View style={styles.titleRow}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>

                    {/* Main Item Protein Rich / Bestseller Badge */}
                    {(() => {
                      const features = getItemFeatures(item?.product || item, translatedItemName);
                      if (features.badge) {
                        const badgeColor = features.badge === 'Bestseller' ? '#EE5A52' : '#C33989';
                        return (
                          <View style={[styles.proteinBadge, { backgroundColor: badgeColor }]}>
                            <Text style={styles.proteinBadgeText}>{features.badge}</Text>
                          </View>
                        );
                      }
                      return null;
                    })()}
                  </View>

                  <Text numberOfLines={2} style={styles.foodName}>
                    {translatedItemName || item?.name}
                  </Text>
                  {!!(translatedItemDesc || item?.description) && (
                    <Text numberOfLines={2} style={styles.foodDesc}>
                      {translatedItemDesc || item?.description}
                    </Text>
                  )}
                </View>
              </View>

              {/* Flavor (radio) */}
              {flavors.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionTitle}>{t('cart.choice_of_variation', 'Choice of Flavor')}</Text>
                    <Text style={styles.sectionHint}>({t('common.optional', 'Optional')})</Text>
                  </View>

                  {visibleFlavors.map(f => {
                    const selected = f.id === selectedFlavorId;
                    const isVeg = f.type === 'veg';
                    const badgeColor = f.badge === 'Bestseller' ? '#EE5A52' : '#C33989';

                    return (
                      <Pressable
                        key={f.id}
                        style={styles.optionRow}
                        onPress={() => {
                          setSelectedFlavorId(prev => (prev === f.id ? null : f.id));
                        }}
                      >
                        {/* Veg/Non-Veg Icon */}
                        {f.type && (
                          <View style={[
                            styles.typeIconContainer, 
                            { 
                              borderColor: f.type === 'veg' ? '#0F8A5F' : 
                                           f.type === 'non-veg' ? '#BC4B4D' : 
                                           f.type === 'fastfood' ? '#F39C12' : '#5DADE2' 
                            }
                          ]}>
                            {f.type === 'veg' ? (
                              <View style={styles.vegDot} />
                            ) : f.type === 'non-veg' ? (
                              <View style={styles.nonVegTriangle} />
                            ) : f.type === 'fastfood' ? (
                              <View style={styles.fastFoodDot} />
                            ) : (
                              <View style={styles.otherDot} />
                            )}
                          </View>
                        )}

                        <View style={styles.optionMain}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            {f.badge && (
                              <Text style={[styles.badgeText, { color: badgeColor }]}>{f.badge}</Text>
                            )}
                            {f.badge === 'Protein Rich' && (
                              <View style={styles.proteinIconSmall}>
                                <View style={styles.proteinDot} />
                              </View>
                            )}
                          </View>
                          <Text style={styles.optionLabel}>
                            {f.labelKey ? t(f.labelKey, f.label) : f.label}
                          </Text>
                        </View>

                        <View style={styles.optionRight}>
                          {toNumber(f.priceDelta, 0) > 0 && (
                            <Text style={styles.optionPrice}>
                              + {activeCurrencySymbol}
                              {toNumber(f.priceDelta, 0)}
                            </Text>
                          )}
                          <View
                            style={[
                              styles.selectorOuter,
                              selected && styles.selectorOuterActive,
                            ]}
                          >
                            {selected && <View style={styles.selectorInner} />}
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}

                  {hiddenFlavorCount > 0 && (
                    <Pressable
                      style={styles.viewMoreBtn}
                      onPress={() => setShowAllFlavors(true)}
                    >
                      <Text style={styles.viewMoreText}>
                        {t('cart.view_more', 'View {{count}} More', { count: hiddenFlavorCount })}
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}

              {/* Add-Ons */}
              {frequentlyBought.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionTitle}>
                      {t('cart.add_ons', 'Frequently bought together')}
                    </Text>
                    <Text style={styles.sectionHint}>({t('common.optional', 'Optional')})</Text>
                  </View>

                  {visibleTogether.map(x => (
                    <AddonItem
                      key={x.id}
                      item={x}
                      isChecked={selectedTogetherIds.has(x.id)}
                      onToggle={toggleTogether}
                      currencySymbol={activeCurrencySymbol}
                    />
                  ))}

                  {hiddenTogetherCount > 0 && (
                    <Pressable
                      style={styles.viewMoreBtn}
                      onPress={() => setShowAllTogether(true)}
                    >
                      <Text style={styles.viewMoreText}>
                        {t('cart.view_more', 'View {{count}} More', { count: hiddenTogetherCount })}
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}

              {/* Additional Request */}
              <View
                style={styles.section}
                ref={notesInputRef}
              >
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionTitle}>{t('cart.additional_request', 'Additional Request')}</Text>
                  <Text style={styles.sectionHint}>({t('common.optional', 'Optional')})</Text>
                </View>
                <View style={styles.inputWrap}>
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder={t('cart.request_placeholder', 'Request')}
                    placeholderTextColor="#9AA0A6"
                    style={styles.input}
                    multiline
                    maxLength={160}
                    textAlignVertical="top"
                    onFocus={() => {
                      setTimeout(() => {
                        notesInputRef.current?.measureLayout(
                          scrollViewRef.current?.getInnerViewNode?.() ||
                          scrollViewRef.current,
                          (x, y) => {
                            scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
                          },
                          () => { }
                        );
                      }, 300);
                    }}
                  />
                  <Text style={styles.charCount}>{notes.length}/160</Text>
                </View>
              </View>
            </ScrollView>

            {/* Bottom Bar */}
            <View style={styles.bottomBar}>
              <View style={styles.bottomTopRow}>
                <View style={styles.qtyWrap}>
                  <Pressable onPress={decQty} style={styles.qtyBtn}>
                    <Text style={styles.qtyBtnText}>−</Text>
                  </Pressable>
                  <Text style={styles.qtyText}>{quantity}</Text>
                  <Pressable onPress={incQty} style={styles.qtyBtn}>
                    <Text style={styles.qtyBtnText}>＋</Text>
                  </Pressable>
                </View>

                <View style={styles.totalWrap}>
                  <Text style={styles.totalValue}>
                    {activeCurrencySymbol}
                    {totalPrice}
                  </Text>
                  <Text style={styles.totalLabel}>{t('cart.total_price', 'Total Price')}</Text>
                </View>
              </View>

              {/* Price Breakdown Preview */}
              {(selectedFlavor || selectedTogetherIds.size > 0) && (
                <View style={styles.priceBreakdownPreview}>
                  <Text style={styles.breakdownPreviewText}>
                    {t('cart.base', 'Base')}: {activeCurrencySymbol}{basePrice}
                    {selectedFlavor && ` + ${t('cart.variation', 'Variation')}: ${activeCurrencySymbol}${toNumber(selectedFlavor.priceDelta, 0)}`}
                    {selectedTogetherIds.size > 0 && ` + ${t('cart.add_ons', 'Add-ons')}: ${activeCurrencySymbol}${selectedTogetherTotal}`}
                    {quantity > 1 && ` × ${quantity}`}
                  </Text>
                </View>
              )}

              <Pressable
                onPress={handleAdd}
                style={[styles.addCartBtn, isSubmitting && styles.addCartBtnDisabled]}
                disabled={isSubmitting}
              >
                <Text style={styles.addCartText}>
                  {isSubmitting
                    ? (item?.cartLineId ? t('common.updating', 'Updating...') : t('common.adding', 'Adding...'))
                    : (item?.cartLineId ? t('cart.update_cart', 'Update Cart') : t('cart.add_to_cart', 'Add to Cart'))}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  closeFab: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 58 : 95,
    alignSelf: 'center',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  closeFabText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111111',
    marginTop: -1,
  },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  handleWrap: {
    paddingTop: 10,
    paddingBottom: 8,
    alignItems: 'center',
  },
  handle: {
    width: 52,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#E6E6E6',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  heroCard: {
    marginTop: 2,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F2F2F2',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  heroImage: {
    width: '100%',
    height: 180,
  },
  titleRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111',
  },
  foodDesc: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  qtyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  qtyBtnText: {
    fontSize: 18,
    color: '#111',
    fontWeight: '800',
    marginTop: -1,
  },
  qtyText: {
    width: 28,
    textAlign: 'center',
    fontWeight: '800',
    color: '#111',
  },
  section: {
    marginTop: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
  },
  sectionHint: {
    fontSize: 13,
    color: '#777',
    fontWeight: '400',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  addonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  addonImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  addonMain: {
    flex: 1,
    justifyContent: 'center',
  },
  typeIconContainer: {
    width: 16,
    height: 16,
    borderWidth: 1.2,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  vegDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#0F8A5F',
  },
  nonVegTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#BC4B4D',
  },
  otherDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#5DADE2',
  },
  fastFoodDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#F39C12', // Orange/Yellow for Fast Food
  },
  optionMain: {
    flex: 1,
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  proteinBadge: {
    backgroundColor: '#C33989',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proteinBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  proteinIconSmall: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#C33989',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proteinDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFF',
  },
  optionLabel: {
    color: '#111',
    fontSize: 15,
    fontWeight: '500',
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionPrice: {
    color: '#333',
    fontWeight: '600',
    fontSize: 14,
  },
  selectorOuter: {
    width: 20,
    height: 20,
    borderRadius: 10, // Circle for radio
    borderWidth: 1.5,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorOuterActive: {
    borderColor: '#EE5A52',
  },
  selectorInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EE5A52',
  },
  radioOuterActive: {
    borderColor: '#FF3D3D',
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#FF3D3D',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4, // Square for checkbox
    borderWidth: 1.5,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  checkboxChecked: {
    borderColor: '#EE5A52',
    backgroundColor: '#EE5A52',
  },
  checkboxTick: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
  viewMoreBtn: {
    marginTop: 12,
    alignSelf: 'center',
    paddingHorizontal: 24,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewMoreText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111111',
  },
  inputWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    minHeight: 74,
    color: '#111',
    fontSize: 13,
    fontWeight: '600',
    padding: 0,
  },
  charCount: {
    marginTop: 8,
    fontSize: 11,
    color: '#9AA0A6',
    textAlign: 'right',
    fontWeight: '700',
  },
  qtyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#f36b72ff',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    height: 38,
    minWidth: 110,
    justifyContent: 'space-between',
  },
  qtyBtn: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#E41C26',
    lineHeight: 26,
  },
  qtyText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: '#F0F0F0',
    backgroundColor: '#FFF',
  },
  bottomTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  totalWrap: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '800',
  },
  totalValue: {
    fontSize: 18,
    color: '#111',
    fontWeight: '900',
  },
  priceBreakdownPreview: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  breakdownPreviewText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
  },
  addCartBtn: {
    marginTop: 12,
    backgroundColor: '#FF3D3D',
    borderRadius: 16,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCartBtnDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.7,
  },
  addCartText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 14,
  },
  // Category drawer specific styles
  categoryHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  categoryHeaderTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111',
  },
  categoryHeaderCount: {
    fontSize: 13,
    color: '#7A7A7A',
    marginTop: 4,
  },
  categoryItemsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  categoryMenuItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
  },
  categoryItemImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
  },
  categoryItemDetails: {
    flex: 1,
  },
  categoryItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },
  categoryItemDesc: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  categoryItemPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FF3D3D',
    marginTop: 4,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF3D3D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  closeCategoryBtn: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeCategoryBtnText: {
    color: '#111',
    fontWeight: '800',
    fontSize: 14,
  },
});