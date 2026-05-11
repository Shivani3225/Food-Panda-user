import React, { useContext, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
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
import { RestaurantHeader } from '../../components/Restaurant/RestaurantHeader';
import { RestaurantInfo } from '../../components/Restaurant/RestaurantInfo';
import { SearchBar } from '../../components/Restaurant/CategoryAndSearch';
import { MenuItemCard } from '../../components/Restaurant/MenuItemCard';
import { CartBottomBar } from '../../components/Restaurant/CartBottomBar';
import { useAuth } from '../../context/AuthContext';

export default function CategoryItemsScreen() {
  const { t } = useTranslation();
  const { currencySymbol } = useAuth();
  const route = useRoute();
  const navigation = useNavigation();

  const {
    categoryName,
    categoryItems = [],
    restaurant: restaurantParam = {},
  } = route.params || {};

  const restaurantId = restaurantParam?.id || restaurantParam?._id || null;
  const restaurantName = restaurantParam?.name || t('restaurant.default_name', 'Restaurant');

  const { cart, cartCount, totals, addToCart, incrementItem, decrementItem } =
    useContext(CartContext);
  const { isFavourite, toggleFavourite } = useContext(FavouritesContext);

  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter items by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return categoryItems;
    const query = searchQuery.toLowerCase().trim();
    return categoryItems.filter(item => {
      const name = (item?.name || '').toLowerCase();
      const description = (item?.description || '').toLowerCase();
      const subtitle = (item?.subtitle || '').toLowerCase();
      return name.includes(query) || description.includes(query) || subtitle.includes(query);
    });
  }, [categoryItems, searchQuery]);

  const subtotal = useMemo(() => toNumber(totals?.subtotal, 0), [totals]);

  const openDrawer = useCallback((item) => {
    if (!item) return;
    setSelectedItem(item);
  }, []);

  const closeDrawer = useCallback(() => {
    setSelectedItem(null);
  }, []);

  const getCartLineForItem = item => {
    const menuItemId = item?.id ?? null;
    if (!menuItemId) return null;
    return (Array.isArray(cart) ? cart : []).find(ci =>
      String(ci.menuItemId ?? ci.productId ?? '') === String(menuItemId) &&
      String(ci.restaurantId ?? '') === String(restaurantId),
    );
  };

  const getSimpleQty = item => {
    const line = getCartLineForItem(item);
    return toNumber(line?.quantity, 0);
  };

  const getCartLineIdForItem = item => {
    const line = getCartLineForItem(item);
    return line?.id ?? null;
  };

  const getFavouriteId = item =>
    buildCartLineId({
      restaurantId,
      menuItemId: item?.id ?? null,
      selectedFlavorId: null,
      addOnIds: [],
    });

  const quickAdd = useCallback((item) => {
    if (!item) return;
    openDrawer(item);
  }, [openDrawer]);

  const handleToggleFavourite = (item, e) => {
    e?.stopPropagation?.();
    const favId = getFavouriteId(item);
    toggleFavourite?.({
      id: favId,
      menuItemId: item?.id,
      name: item?.name,
      image: item?.image,
      description: item?.description,
      price: toNumber(item?.price, 0),
      basePrice: toNumber(item?.price, 0),
      restaurantId,
      restaurantName,
      type: 'product',
    });
  };

  // Restaurant header/info setup — same as RestaurantDetail
  const deliveryTimeText = restaurantParam?.deliveryTime ?? '25 - 40 min';
  const freeDeliveryText =
    restaurantParam?.freeDeliveryText ||
    restaurantParam?.offers?.[0] ||
    t('restaurant.free_delivery_first', 'Free delivery for first order');
  const minOrderText =
    restaurantParam?.minOrder || restaurantParam?.minimumOrder || `${currencySymbol}119.00`;

  let headerImageSource = require('../../assets/images/Food.png');
  let thumbImageSource = require('../../assets/images/Food.png');

  if (restaurantParam?.bannerImage && restaurantParam.bannerImage.trim()) {
    headerImageSource = { uri: restaurantParam.bannerImage };
  } else if (restaurantParam?.image && restaurantParam.image.trim()) {
    headerImageSource = require('../../assets/images/Food.png');
    thumbImageSource = { uri: restaurantParam.image };
  }

  if (restaurantParam?.image && restaurantParam.image.trim()) {
    thumbImageSource = { uri: restaurantParam.image };
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }} edges={['top']}>
      <StatusBar hidden={false} translucent={false} backgroundColor="#FFF" barStyle="dark-content" />
      <View style={styles.screenContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: cartCount > 0 ? 140 : 80 }}
        >
          <RestaurantHeader
            headerImage={headerImageSource}
            onBackPress={() => navigation.goBack()}
            isFavorite={isFavourite?.(restaurantId, 'restaurant')}
            onFavoritePress={() => toggleFavourite({
              id: restaurantId,
              restaurantId: restaurantId,
              name: restaurantName,
              image: restaurantParam.bannerImage || restaurantParam.image,
              restaurantName: restaurantName,
              type: 'restaurant',
            })}
            ratingAverage={toNumber(restaurantParam.ratingAverage, 0)}
            ratingCount={toNumber(restaurantParam.ratingCount, 0)}
          />

          <RestaurantInfo
            thumbImage={thumbImageSource}
            name={restaurantParam.name}
            cuisines={restaurantParam.cuisines}
            deliveryTime={deliveryTimeText}
            freeDeliveryText={freeDeliveryText}
            minOrder={minOrderText}
            distance={restaurantParam.distance ?? null}
          />

          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <View style={styles.itemsCardWrap}>
            <View style={styles.itemsHeader}>
              <Text style={styles.itemsTitle}>{categoryName}</Text>
              <Text style={styles.itemsSubTitle}>{t('restaurant.most_ordered', 'Most Order right now')}</Text>
            </View>

            {(Array.isArray(filteredItems) ? filteredItems : []).map(
              (item, index, arr) => {
                const qty = getSimpleQty(item);
                const favOn = isFavourite?.(item?.id, 'product');
                const cartLineId = getCartLineIdForItem(item);

                return (
                  <MenuItemCard
                    key={item.id || item._id || `item-${index}`}
                    item={item}
                    quantity={qty}
                    isFavorite={favOn}
                    onPress={() => openDrawer(item)}
                    onFavoritePress={(e) => handleToggleFavourite(item, e)}
                    onIncrement={(e) => {
                      e.stopPropagation();
                      if (cartLineId) {
                        incrementItem?.(cartLineId);
                      } else {
                        quickAdd(item);
                      }
                    }}
                    onDecrement={(e) => {
                      e.stopPropagation();
                      if (cartLineId) {
                        decrementItem?.(cartLineId);
                      }
                    }}
                    onQuickAdd={(e) => {
                      e.stopPropagation();
                      quickAdd(item);
                    }}
                    showDivider={index < arr.length - 1}
                  />
                );
              },
            )}

            {filteredItems.length === 0 && (
              <Text style={styles.emptyText}>{t('restaurant.no_items', 'No items available.')}</Text>
            )}
          </View>
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
            restaurant={restaurantParam}
            onClose={closeDrawer}
            currencySymbol={currencySymbol}
            onAddToCart={() => {
              closeDrawer();
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  itemsHeader: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  itemsTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '800',
    color: '#111',
  },
  itemsSubTitle: {
    marginTop: scale(2),
    fontSize: FONT_SIZES.xs,
    color: '#7A7A7A',
    fontWeight: '600',
  },
  itemsCardWrap: {
    marginHorizontal: SPACING.lg,
    borderRadius: scale(12),
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingBottom: SPACING.sm,
  },
  emptyText: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    color: '#7A7A7A',
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
});
