import React, { useContext, useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { scale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';
import AddToCartDrawer from '../../components/AddToCartDrawer';
import { CartContext } from '../../context/CartContext';
import { FavouritesContext } from '../../context/FavouritesContext';
import { buildCartLineId, toNumber } from '../../services/cartPricing';
import { getRestaurantMenu } from '../../services/restaurantService';
import { RestaurantHeader } from '../../components/Restaurant/RestaurantHeader';
import { RestaurantInfo } from '../../components/Restaurant/RestaurantInfo';
import { CartBottomBar } from '../../components/Restaurant/CartBottomBar';
import { MenuItemCard } from '../../components/Restaurant/MenuItemCard';
import { SearchBar, CategoryPills } from '../../components/Restaurant/CategoryAndSearch';
import { useAuth } from '../../context/AuthContext';
import { getLocalizedText, translateArray, translateText } from '../../services/translationService';

const restaurantMenuCache = new Map();
const MENU_CACHE_VERSION = 'menu-map-v4';

const parseNumeric = value => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const getResolvedRatingAverage = source => {
  if (!source || typeof source !== 'object') return null;
  for (const v of [source?.rating?.average, source?.ratingAverage, source?.avgRating, source?.rating]) {
    const p = parseNumeric(v);
    if (p !== null) return p;
  }
  return null;
};

const getResolvedRatingCount = source => {
  if (!source || typeof source !== 'object') return null;
  for (const v of [source?.rating?.count, source?.ratingCount, source?.reviewsCount, source?.totalRatings]) {
    const p = parseNumeric(v);
    if (p !== null) return p;
  }
  return null;
};

export default function RestaurantDetail() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en';
  const { currencySymbol } = useAuth();
  const route = useRoute();
  const navigation = useNavigation();
  const { restaurant: initialParamRestaurant } = route.params;
  const isMountedRef = useRef(true);

  const [restaurant, setRestaurant] = useState(() => {
    const name = typeof initialParamRestaurant?.name === 'object'
      ? initialParamRestaurant?.name?.en ?? t('restaurant.default_name', 'Restaurant')
      : initialParamRestaurant?.name ?? t('restaurant.default_name', 'Restaurant');

    const cuisines = Array.isArray(initialParamRestaurant?.cuisine)
      ? initialParamRestaurant.cuisine
      : (Array.isArray(initialParamRestaurant?.cuisines) ? initialParamRestaurant.cuisines : []);

    return {
      id: initialParamRestaurant?.id ?? initialParamRestaurant?._id ?? null,
      _id: initialParamRestaurant?._id ?? initialParamRestaurant?.id ?? null,
      name,
      ratingAverage: getResolvedRatingAverage(initialParamRestaurant) ?? 0,
      ratingCount: getResolvedRatingCount(initialParamRestaurant) ?? 0,
      deliveryTime: initialParamRestaurant?.deliveryTime ?? 30,
      minOrderValue: initialParamRestaurant?.minOrderValue ?? 0,
      cuisines,
      image: initialParamRestaurant?.image ?? '',
      bannerImage: initialParamRestaurant?.bannerImage ?? '',
      isFreeDelivery: initialParamRestaurant?.isFreeDelivery ?? false,
      freeDeliveryText: initialParamRestaurant?.isFreeDelivery ? t('restaurant.free_delivery', 'Free delivery') : '',
      minOrder: initialParamRestaurant?.minOrderValue ? `${currencySymbol}${initialParamRestaurant.minOrderValue.toFixed(2)}` : '',
      distance: initialParamRestaurant?.distance ?? null,
      address: initialParamRestaurant?.address ?? '',
      categories: [],
      menuByCategory: {},
    };
  });

  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState(null); // null = categories view

  const restaurantParamId = initialParamRestaurant?.id ?? initialParamRestaurant?._id ?? null;

  const fetchMenu = useCallback(async () => {
    if (!restaurantParamId) {
      setMenuError(t('restaurant.missing_id', 'Restaurant ID is missing.'));
      return;
    }

    const cacheKey = `${restaurantParamId}_${currentLang}`;

    if (restaurantMenuCache.has(cacheKey)) {
      const cached = restaurantMenuCache.get(cacheKey);
      if (cached?.version === MENU_CACHE_VERSION) {
        setRestaurant(prev => ({ ...prev, ...cached.restaurant }));
        if (cached.restaurant?.categories?.length > 0) {
          setActiveCategoryId('all');
        }
        return;
      }
    }

    setMenuLoading(true);
    setMenuError(null);

    try {
      const data = await getRestaurantMenu(restaurantParamId);

      console.log('🍽️ [RestaurantDetail] Full API Response:', JSON.stringify(data, null, 2));
      console.log('🍽️ [RestaurantDetail] Keys:', Object.keys(data || {}));
      console.log('🍽️ [RestaurantDetail] Categories:', data?.categories?.length, data?.categories);
      console.log('🍽️ [RestaurantDetail] Products:', data?.products?.length, data?.products);
      console.log('🍽️ [RestaurantDetail] menuByCategoryId:', data?.menuByCategoryId);
      console.log('🍽️ [RestaurantDetail] menu:', data?.menu);
      console.log('🍽️ [RestaurantDetail] restaurant:', data?.restaurant);

      const restaurantPayload = data?.restaurant || null;
      const categoriesFromApi = Array.isArray(data?.categories) ? data.categories : [];
      const products = Array.isArray(data?.products) ? data.products : [];
      const menuByCategoryIdFromApi = data?.menuByCategoryId && typeof data.menuByCategoryId === 'object'
        ? data.menuByCategoryId : null;
      const menuMap = data?.menu && typeof data.menu === 'object' && !Array.isArray(data.menu)
        ? data.menu : null;

      if (!isMountedRef.current) return;

      const getLocalizedText = value => {
        if (!value) return '';
        if (typeof value === 'object') {
          const result = value[currentLang] || value.en || value.de || value.ar || '';
          if (value.en && value.en !== result) {
            console.log(`🌐 [RestaurantDetail] Lang:${currentLang} | en:"${value.en}" → "${result}"`);
          }
          return result;
        }
        return String(value);
      };

      const categoriesWithIds = categoriesFromApi.map(c => ({
        id: String(c?._id || c?.id || '').trim(),
        name: getLocalizedText(c?.name) || t('restaurant.unknown', 'Unknown'),
        description: getLocalizedText(c?.description) || '',
        image: c?.image || '',
      })).filter(c => c.id);

      const mapMenuItem = (item, index, categoryId) => ({
        id: item?._id || item?.id || `${categoryId}-${index}`,
        name: getLocalizedText(item?.name) || t('restaurant.unknown_product', 'Unknown Product'),
        description: getLocalizedText(item?.description) || '',
        image: item?.image || '',
        price: item?.basePrice ?? item?.price ?? 0,
        isVeg: item?.isVeg,
        foodType: item?.foodType,
        categoryId: String(categoryId || '').trim(),
        available: item?.available,
        variations: item?.variations || [],
        addOns: item?.addOns || [],
        isBestSeller: item?.isBestSeller ?? false,
        subtitle: item?.subtitle,
        shortDescription: item?.shortDescription,
      });

      let menuByCategory = {};

      if (menuByCategoryIdFromApi) {
        Object.entries(menuByCategoryIdFromApi).forEach(([categoryId, categoryData]) => {
          const id = String(categoryId).trim();
          // category name API se lo
          const catName = getLocalizedText(categoryData?.category?.name) || id;
          // categories list mein add karo agar nahi hai
          if (!categoriesWithIds.find(c => c.id === id)) {
            categoriesWithIds.push({
              id,
              name: catName,
              description: '',
              image: categoryData?.category?.image || '',
            });
          }
          menuByCategory[id] = (Array.isArray(categoryData?.items) ? categoryData.items : [])
            .map((item, i) => mapMenuItem(item, i, id));
        });
      } else if (menuMap) {
        Object.entries(menuMap).forEach(([categoryName, items]) => {
          const match = categoriesWithIds.find(c => c.name === categoryName);
          const id = match?.id || categoryName;
          menuByCategory[id] = (Array.isArray(items) ? items : []).map((item, i) => mapMenuItem(item, i, id));
        });
      } else if (Array.isArray(products)) {
        products.forEach((item, i) => {
          const catId = String(item?.categoryId || item?.category?._id || 'uncategorized').trim();
          if (!menuByCategory[catId]) menuByCategory[catId] = [];
          menuByCategory[catId].push(mapMenuItem(item, i, catId));
        });
      }

      let finalCategories = [...categoriesWithIds];
      if (finalCategories.length === 0 && Object.keys(menuByCategory).length > 0) {
        finalCategories = Object.keys(menuByCategory).map(key => ({ id: key, name: key }));
      }

      // "All" category sabse pehle add karo
      finalCategories = [{ id: 'all', name: t('home.all', 'All') }, ...finalCategories];

      console.log('✅ [RestaurantDetail] Final categories:', finalCategories);
      console.log('✅ [RestaurantDetail] menuByCategory keys:', Object.keys(menuByCategory));
      console.log('✅ [RestaurantDetail] Total items:', Object.values(menuByCategory).flat().length);

      setRestaurant(prev => {
        const src = restaurantPayload || initialParamRestaurant || {};
        const name = typeof src?.name === 'object' ? src?.name?.en ?? prev.name : src?.name ?? prev.name;
        const cuisines = Array.isArray(src?.cuisine) ? src.cuisine
          : Array.isArray(src?.cuisines) ? src.cuisines : prev.cuisines;

        const next = {
          ...prev,
          id: restaurantParamId,
          name,
          image: src?.image ?? prev.image,
          bannerImage: src?.bannerImage ?? prev.bannerImage,
          cuisines,
          ratingAverage: getResolvedRatingAverage(src) ?? getResolvedRatingAverage(data) ?? prev.ratingAverage ?? 0,
          ratingCount: getResolvedRatingCount(src) ?? getResolvedRatingCount(data) ?? prev.ratingCount ?? 0,
          deliveryTime: src?.deliveryTime ?? prev.deliveryTime,
          minOrderValue: src?.minOrderValue ?? prev.minOrderValue,
          isFreeDelivery: src?.isFreeDelivery ?? prev.isFreeDelivery,
          freeDeliveryText: src?.isFreeDelivery ? t('restaurant.free_delivery', 'Free delivery') : prev.freeDeliveryText,
          minOrder: src?.minOrderValue ? `${currencySymbol}${src.minOrderValue}` : prev.minOrder,
          address: src?.address ?? prev.address ?? '',
          categories: finalCategories,
          menuByCategory,
        };

        restaurantMenuCache.set(`${restaurantParamId}_${currentLang}`, { version: MENU_CACHE_VERSION, restaurant: next });
        return next;
      });

      if (finalCategories.length > 0) {
        setActiveCategoryId('all'); // directly items view
      }

      // Agar language English nahi hai to items translate karo
      if (currentLang !== 'en' && isMountedRef.current) {
        console.log(`🌐 [RestaurantDetail] Translating menu to ${currentLang}...`);

        // Menu items translate karo
        const translatedMenuByCategory = {};
        await Promise.all(
          Object.entries(menuByCategory).map(async ([catId, items]) => {
            translatedMenuByCategory[catId] = await translateArray(items, ['name', 'description'], currentLang);
            console.log(`  ✓ Category ${catId}: ${items.length} items translated`);
          })
        );

        // Category names translate karo
        const translatedCategories = await translateArray(
          finalCategories.filter(c => c.id !== 'all'),
          ['name', 'description'],
          currentLang
        );

        // Restaurant name aur cuisines translate karo
        const translatedCuisines = await Promise.all(
          (restaurant.cuisines || []).map(c => translateText(String(c), currentLang))
        );

        if (isMountedRef.current) {
          console.log(`✅ [RestaurantDetail] Menu translated to ${currentLang}`);
          setRestaurant(prev => ({
            ...prev,
            cuisines: translatedCuisines,
            categories: [{ id: 'all', name: t('home.all', 'All') }, ...translatedCategories],
            menuByCategory: translatedMenuByCategory,
          }));
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        setMenuError(err?.message || t('restaurant.menu_failed', 'Failed to load menu.'));
      }
    } finally {
      if (isMountedRef.current) setMenuLoading(false);
    }
  }, [restaurantParamId, initialParamRestaurant, t, currencySymbol, currentLang]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchMenu();
    return () => { isMountedRef.current = false; };
  }, [fetchMenu]);

  const { cart, cartCount, totals, incrementItem, decrementItem } = useContext(CartContext);
  const { isFavourite, toggleFavourite } = useContext(FavouritesContext);

  const restaurantId = restaurant?.id ?? null;
  const restaurantName = restaurant?.name ?? t('restaurant.default_name', 'Restaurant');
  const subtotal = useMemo(() => toNumber(totals?.subtotal, 0), [totals]);
  const minOrderText = restaurant?.minOrder || `${currencySymbol}0.00`;
  const deliveryTimeText = restaurant?.deliveryTime ? `🕒 ${restaurant.deliveryTime}` : '🕒 25 - 40 min';
  const freeDeliveryText = restaurant?.freeDeliveryText || t('restaurant.free_delivery_first', 'Free delivery for first order');

  let headerImageSource = require('../../assets/images/Food.png');
  let thumbImageSource = require('../../assets/images/Food.png');

  if (restaurant?.bannerImage) {
    headerImageSource = typeof restaurant.bannerImage === 'string' 
      ? { uri: restaurant.bannerImage } 
      : restaurant.bannerImage;
  }
  if (restaurant?.image) {
    thumbImageSource = typeof restaurant.image === 'string' 
      ? { uri: restaurant.image } 
      : restaurant.image;
  }

  const activeItems = useMemo(() => {
    let items;
    if (!activeCategoryId || activeCategoryId === 'all') {
      items = Object.values(restaurant.menuByCategory).flat();
    } else {
      items = restaurant.menuByCategory[activeCategoryId] || [];
    }
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(item =>
      (item?.name || '').toLowerCase().includes(q) ||
      (item?.description || '').toLowerCase().includes(q)
    );
  }, [activeCategoryId, restaurant.menuByCategory, searchQuery]);

  const activeCategoryName = useMemo(() => {
    if (!activeCategoryId || activeCategoryId === 'all') return t('home.all', 'All');
    return restaurant.categories.find(c => c.id === activeCategoryId)?.name || '';
  }, [restaurant.categories, activeCategoryId, t]);
  const getCartLine = item => {
    const menuItemId = item?.id ?? null;
    if (!menuItemId) return null;
    return (Array.isArray(cart) ? cart : []).find(ci =>
      String(ci.menuItemId ?? ci.productId ?? '') === String(menuItemId) &&
      String(ci.restaurantId ?? '') === String(restaurantId)
    );
  };

  const getQty = item => toNumber(getCartLine(item)?.quantity, 0);
  const getCartLineId = item => getCartLine(item)?.id ?? null;

  const getFavId = item => buildCartLineId({
    restaurantId,
    menuItemId: item?.id ?? null,
    selectedFlavorId: null,
    addOnIds: [],
  });

  const handleToggleFav = (item, e) => {
    e?.stopPropagation?.();
    toggleFavourite?.({
      id: getFavId(item),
      menuItemId: item?.id,
      name: item?.name,
      image: item?.image,
      price: toNumber(item?.price, 0),
      basePrice: toNumber(item?.price, 0),
      restaurantId,
      restaurantName,
      type: 'product',
    });
  };

  const openDrawer = useCallback(item => { if (item) setSelectedItem(item); }, []);
  const closeDrawer = useCallback(() => setSelectedItem(null), []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }} edges={['top']}>
      <StatusBar hidden={false} translucent={false} backgroundColor="#FFF" barStyle="dark-content" />
      <View style={styles.screen}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: cartCount > 0 ? 140 : 80 }}
        >
          {/* Header image + back + fav */}
          <RestaurantHeader
            headerImage={headerImageSource}
            onBackPress={() => navigation.goBack()}
            isFavorite={isFavourite?.(restaurantId, 'restaurant')}
            onFavoritePress={() => toggleFavourite({
              id: restaurantId, restaurantId, name: restaurantName,
              image: restaurant.bannerImage || restaurant.image,
              restaurantName, type: 'restaurant',
            })}
            onMenuPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
            ratingAverage={toNumber(restaurant.ratingAverage, 0)}
            ratingCount={toNumber(restaurant.ratingCount, 0)}
          />

          {/* Restaurant name, cuisine, delivery info */}
          <RestaurantInfo
            thumbImage={thumbImageSource}
            name={restaurant.name}
            cuisines={restaurant.cuisines}
            deliveryTime={deliveryTimeText}
            freeDeliveryText={freeDeliveryText}
            minOrder={minOrderText}
            distance={restaurant.distance}
            address={restaurant.address}
          />

          {/* ── LOADING / ERROR ── */}
          {menuLoading && (
            <View style={styles.centerBox}>
              <ActivityIndicator color="#FF3D3D" />
              <Text style={styles.loadingText}>{t('restaurant.loading_menu', 'Loading menu...')}</Text>
            </View>
          )}

          {!menuLoading && menuError && (
            <View style={styles.centerBox}>
              <Text style={styles.errorText}>{menuError}</Text>
              <Pressable style={styles.retryBtn} onPress={fetchMenu}>
                <Text style={styles.retryText}>{t('common.retry', 'Retry')}</Text>
              </Pressable>
            </View>
          )}

          {!menuLoading && !menuError && (
            <>
              {/* Search */}
              <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search Dish name..."
              />

              {/* Category pills */}
              <CategoryPills
                categories={[
                  { id: 'all', name: t('home.all', 'All') },
                  ...restaurant.categories.filter(c => c.id !== 'all'),
                ]}
                activeCategory={activeCategoryId}
                onCategoryPress={id => {
                  setActiveCategoryId(id);
                  setSearchQuery('');
                }}
              />

              {/* Items */}
              <View style={styles.itemsCard}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{activeCategoryName}</Text>
                  <Text style={styles.sectionSub}>{t('restaurant.most_ordered', 'Most Order right now')}</Text>
                </View>

                {activeItems.length === 0 ? (
                  <Text style={styles.emptyText}>{t('restaurant.no_items', 'No items available.')}</Text>
                ) : (
                  activeItems.map((item, index, arr) => {
                    const qty = getQty(item);
                    const cartLineId = getCartLineId(item);
                    return (
                      <MenuItemCard
                        key={item.id || `item-${index}`}
                        item={item}
                        quantity={qty}
                        isFavorite={isFavourite?.(item?.id, 'product')}
                        onPress={() => openDrawer(item)}
                        onFavoritePress={e => handleToggleFav(item, e)}
                        onIncrement={e => {
                          e.stopPropagation();
                          cartLineId ? incrementItem?.(cartLineId) : openDrawer(item);
                        }}
                        onDecrement={e => {
                          e.stopPropagation();
                          if (cartLineId) decrementItem?.(cartLineId);
                        }}
                        onQuickAdd={e => {
                          e.stopPropagation();
                          openDrawer(item);
                        }}
                        showDivider={index < arr.length - 1}
                      />
                    );
                  })
                )}
              </View>
            </>
          )}
        </ScrollView>

        <CartBottomBar
          cartCount={cartCount}
          subtotal={subtotal}
          onPress={() => navigation.navigate('Cart')}
        />

        {selectedItem && (
          <AddToCartDrawer
            visible={!!selectedItem}
            item={selectedItem}
            restaurant={restaurant}
            onClose={closeDrawer}
            currencySymbol={currencySymbol}
            onAddToCart={closeDrawer}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF' },
  itemsCard: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    borderRadius: scale(12),
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    overflow: 'hidden',
  },
  sectionHeader: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '800',
    color: '#111',
  },
  sectionSub: {
    marginTop: scale(2),
    fontSize: FONT_SIZES.xs,
    color: '#7A7A7A',
    fontWeight: '600',
  },
  // Category card row
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: scale(12),
  },
  categoryIconCircle: {
    width: scale(52),
    height: scale(52),
    borderRadius: scale(26),
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  categoryEmoji: { fontSize: scale(26) },
  categoryContent: { flex: 1 },
  categoryName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: '#111',
  },
  categoryCount: {
    marginTop: scale(2),
    fontSize: FONT_SIZES.xs,
    color: '#7A7A7A',
    fontWeight: '600',
  },
  categoryChevron: {
    fontSize: scale(22),
    color: '#BDBDBD',
    fontWeight: '300',
  },
  centerBox: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    color: '#7A7A7A',
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  errorText: {
    color: '#D84C4C',
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#FF3D3D',
    paddingHorizontal: SPACING.md,
    paddingVertical: scale(6),
    borderRadius: scale(12),
  },
  retryText: {
    color: '#FFF',
    fontSize: FONT_SIZES.xs,
    fontWeight: '800',
  },
  emptyText: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    color: '#7A7A7A',
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
});
