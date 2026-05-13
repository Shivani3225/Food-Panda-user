import React, { useContext, useMemo, useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Image,
  Pressable,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bike, ChevronRight, Star, Search, ArrowLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { translateField } from '../../services/translationService';

import { CartContext } from '../../context/CartContext';
import { useNavigation } from '@react-navigation/native';
import { wp, hp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';
import { getRatingAverage, getRatingCount } from '../../utils/ratingUtils';
import RatingBadge from '../../components/Rating/RatingBadge';

const FALLBACK_ITEM_IMAGE = require('../../assets/images/Noodle.png');

function getLocalizedValue(value, lang) {
  if (!value) return '';
  if (typeof value === 'object') {
    return value[lang] || value.en || value.de || value.ar || '';
  }
  return String(value);
}

function formatOrderDateTime(isoString, t) {
  const date = isoString ? new Date(isoString) : new Date();
  if (Number.isNaN(date.getTime())) return { dateLine1: '', dateLine2: '' };

  const months = [
    t('common.months.jan', 'Jan'),
    t('common.months.feb', 'Feb'),
    t('common.months.mar', 'Mar'),
    t('common.months.apr', 'Apr'),
    t('common.months.may', 'May'),
    t('common.months.jun', 'Jun'),
    t('common.months.jul', 'Jul'),
    t('common.months.aug', 'Aug'),
    t('common.months.sep', 'Sep'),
    t('common.months.oct', 'Oct'),
    t('common.months.nov', 'Nov'),
    t('common.months.dec', 'Dec'),
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];

  const hours24 = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = ((hours24 + 11) % 12) + 1;

  return {
    dateLine1: t('orders.placed_on', 'Order placed on {{day}}, {{month}},', { day, month }),
    dateLine2: `${hours12}:${minutes}${ampm}`,
  };
}

function getImageSource(image) {
  if (!image) return FALLBACK_ITEM_IMAGE;
  if (typeof image === 'number') return image;
  if (typeof image === 'string') return { uri: image };
  if (typeof image === 'object') return image;
  return FALLBACK_ITEM_IMAGE;
}

function deriveStatusUi(order, t) {
  const raw = String(order?.status || '').toLowerCase();

  if (raw.includes('complete') || raw.includes('delivered')) {
    return {
      status: t('orders.status.completed', 'Completed'),
      statusColor: '#27AE60',
      completed: true
    };
  }

  if (raw.includes('cancel')) {
    return {
      status: t('orders.status.cancelled', 'Cancelled'),
      statusColor: '#9E9E9E'
    };
  }

  if (
    raw.includes('ongoing') ||
    raw.includes('out_for_delivery') ||
    raw.includes('shipping')
  ) {
    return {
      status: t('orders.status.ongoing', 'Ongoing'),
      statusColor: '#EB5757',
      note: t('orders.arriving_soon', 'Your order is arriving soon, please be ready at Dock Gate 2'),
    };
  }

  return {
    status: t('orders.status.preparing', 'Preparing'),
    statusColor: '#F2994A'
  };
}

export default function OrdersScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const { orders, fetchOrders } = useContext(CartContext);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchOrders();
    } catch (error) {
      console.log('Refresh error:', error?.message);
    } finally {
      setRefreshing(false);
    }
  }, [fetchOrders]);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setFetchError(null);
        await fetchOrders();
      } catch (error) {
        console.log('Orders screen error:', error?.message);
        setFetchError(error?.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [fetchOrders]);

  const data = useMemo(() => {
    let filtered = (orders || [])
      .filter(o => {
        const hasDeliveryAddress = !!o?.deliveryAddress;
        return hasDeliveryAddress;
      })
      .map(o => {
        const ui = deriveStatusUi(o, t);
        return {
          ...o,
          ...ui,
        };
      })
      .filter(o => {
        if (statusFilter === 'All') return true;
        if (statusFilter === 'Ongoing') return o.status === t('orders.status.ongoing', 'Ongoing') || o.status === t('orders.status.preparing', 'Preparing');
        if (statusFilter === 'Completed') return o.completed === true;
        if (statusFilter === 'Cancelled') return o.status === t('orders.status.cancelled', 'Cancelled');
        return true;
      });

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      console.log(`🔍 [Orders Search] Query: "${query}" | Filtering ${filtered.length} orders...`);
      filtered = filtered.filter(o => {
        const nameObj = o?.restaurant?.name || {};
        const restaurantName = (
          (typeof nameObj === 'string' ? nameObj : (nameObj.en || nameObj.de || nameObj.ar || '')) ||
          o?.restaurantName ||
          ''
        ).toLowerCase();

        const orderId = String(o?._id || o?.id || '').toLowerCase();
        const match = restaurantName.includes(query) || orderId.includes(query);

        if (match) console.log(`   ✅ Match found: "${restaurantName}" (ID: ${orderId})`);
        return match;
      });
    }

    return filtered;
  }, [orders, statusFilter, searchQuery, t]);

  const handleFilterChange = useCallback((status) => {
    setStatusFilter(status);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerWrapper}>
        <Text style={styles.headerText}>{t('orders.your_orders', 'Your Orders')}</Text>
      </View>
      <View style={styles.headerDivider} />

      <View style={styles.contentPadding}>

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <Search size={scale(22)} color="#000000" strokeWidth={1.5} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('orders.search_order', 'Search Order')}
            placeholderTextColor="#999999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Status Filter */}
        <View style={styles.filterContainer}>
          {[
            { key: 'All', label: t('orders.filter.all', 'All') },
            { key: 'Ongoing', label: t('orders.filter.ongoing', 'Ongoing') },
            { key: 'Completed', label: t('orders.filter.completed', 'Completed') },
            { key: 'Cancelled', label: t('orders.filter.cancelled', 'Cancelled') }
          ].map(status => (
            <TouchableOpacity
              key={status.key}
              style={[
                styles.filterChip,
                statusFilter === status.key && styles.filterChipActive,
              ]}
              onPress={() => handleFilterChange(status.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === status.key && styles.filterChipTextActive,
                ]}
              >
                {status.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={styles.loadingText}>{t('orders.loading', 'Loading your orders...')}</Text>
          </View>
        ) : data.length === 0 ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.emptyContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#ed1c24']}
                tintColor="#ed1c24"
              />
            }
          >
            <Text style={styles.emptyText}>
              {statusFilter !== 'All'
                ? t('orders.no_filtered_orders', 'No {{status}} orders', { status: statusFilter.toLowerCase() })
                : t('orders.no_orders', 'No orders yet')}
            </Text>
            <Text style={styles.emptySubText}>
              {statusFilter === 'All' && t('orders.orders_appear_here', 'Your orders will appear here')}
            </Text>
          </ScrollView>
        ) : (
          <FlatList
            data={data}
            keyExtractor={item => String(item._id || item.id)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: SPACING.lg }}
            renderItem={({ item }) => <OrderCard item={item} currentFilter={statusFilter} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#ed1c24']}
                tintColor="#ed1c24"
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const OrderCard = memo(function OrderCard({ item, currentFilter }) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en';
  const { currencySymbol } = useAuth();
  const navigation = useNavigation();

  const handlePress = useCallback(() => {
    navigation.navigate("OrderDetailsScreen", { orderId: item._id || item.id });
  }, [navigation, item._id, item.id]);

  // Robust restaurant name resolution similar to OrderDetailsScreen
  const getResolvedRestaurantName = React.useCallback(() => {
    const rawName = item?.restaurant?.name || item?.restaurant?.title || item?.restaurantName || item?.restaurant?.restaurantName || '';
    
    if (typeof rawName === 'object' && rawName !== null) {
      return rawName[currentLang] || rawName.en || rawName.de || rawName.ar || '';
    }
    if (typeof rawName === 'string' && rawName.trim().length > 0) {
      return rawName;
    }
    
    // Fallback to items if restaurant info is missing
    const firstItem = Array.isArray(item?.items) ? item.items[0] : null;
    if (firstItem) {
      const itemRestName = firstItem.restaurant?.name || firstItem.restaurantName || '';
      if (typeof itemRestName === 'object' && itemRestName !== null) {
        return itemRestName[currentLang] || itemRestName.en || '';
      }
      if (typeof itemRestName === 'string' && itemRestName.trim().length > 0) {
        return itemRestName;
      }
    }

    return '';
  }, [item, currentLang]);

  const initialName = getResolvedRestaurantName() || t('orders.restaurant', 'Restaurant');
  const [displayName, setDisplayName] = React.useState(initialName);

  // Sync displayName if item or language changes
  React.useEffect(() => {
    const resolved = getResolvedRestaurantName();
    const finalInitial = resolved || t('orders.restaurant', 'Restaurant');
    setDisplayName(finalInitial);

    // If we have a name and it's not in the current language, try to translate it
    if (currentLang !== 'en' && resolved) {
      const sourceForTranslation = item?.restaurant?.name || item?.restaurantName || resolved;
      translateField(sourceForTranslation, currentLang).then(v => {
        if (v) setDisplayName(v);
      });
    }
  }, [currentLang, item, getResolvedRestaurantName]);

  console.log(`🌐 [OrdersPage] Lang:${currentLang} | restaurantName: "${displayName}"`);

  const items = Array.isArray(item?.items) ? item.items : [];
  const shownItems = items.slice(0, 2);
  const remainingCount = Math.max(0, items.length - shownItems.length);

  const itemCuisineLine = items
    .map(it => it?.name || getLocalizedValue(it?.product?.name, currentLang) || it?.productName)
    .filter(Boolean)
    .slice(0, 3)
    .join(', ');

  const restaurantCuisineLine = Array.isArray(item?.restaurant?.cuisine)
    ? item.restaurant.cuisine.filter(Boolean).join(',')
    : item?.restaurant?.cuisine || item?.restaurant?.category || '';

  const cuisineLine = restaurantCuisineLine || itemCuisineLine;

  const { dateLine1, dateLine2 } = formatOrderDateTime(item?.createdAt, t);

  const total =
    typeof item?.totalAmount === 'number'
      ? item.totalAmount
      : typeof item?.totals?.grandTotal === 'number'
        ? item.totals.grandTotal
        : typeof item?.grandTotal === 'number'
          ? item.grandTotal
          : typeof item?.totals?.subtotal === 'number'
            ? item.totals.subtotal
            : typeof item?.subtotal === 'number'
              ? item.subtotal
              : 0;

  return (
    <Pressable style={styles.card} onPress={handlePress}>
      {/* Restaurant */}
      <View style={styles.cardHeader}>
        <View style={styles.restaurantInfo}>
          <Text style={styles.restaurant}>{displayName}</Text>
          <Text style={styles.cuisine} numberOfLines={1}>
            {cuisineLine || '—'}
          </Text>
        </View>
        <ChevronRight size={scale(24)} color="#111111" strokeWidth={2.6} />
      </View>

      <View style={styles.divider} />

      {/* Items */}
      <View style={styles.itemsWrapper}>
        <View style={styles.itemsGrid}>
          {shownItems.map((it, idx) => (
            <View key={String(it?._id || it?.id || idx)} style={styles.itemPreview}>
              <View style={styles.itemCopy}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {it?.name || getLocalizedValue(it?.product?.name, currentLang) || it?.productName || t('orders.item', 'Item')}
                </Text>
                <Text style={styles.itemSub} numberOfLines={1}>
                  {it?.selectedFlavor?.name ||
                    it?.variation?.name ||
                    it?.selectedFlavor?.title ||
                    it?.selectedFlavor?.label ||
                    t('orders.original', idx === 0 ? 'Original' : 'Regular')}
                </Text>
              </View>
              <Image source={getImageSource(it?.image || it?.product?.image)} style={styles.itemImg} />
            </View>
          ))}
          {shownItems.length === 1 && <View style={styles.itemPreviewPlaceholder} />}
        </View>

        {remainingCount > 0 && (
          <Text style={styles.moreText}>{t('orders.more_items', '+{{count}} More', { count: remainingCount })}</Text>
        )}
      </View>

      <View style={styles.divider} />
      {/* Footer */}
      <View style={styles.footerRow}>
        <View style={styles.dateBlock}>
          {!!dateLine1 && <Text style={styles.date}>{dateLine1}</Text>}
          {!!dateLine2 && <Text style={styles.date}>{dateLine2}</Text>}
          <Text style={[styles.status, { color: item.statusColor }]}>
            {item.status}
          </Text>
        </View>

        <Text style={styles.price}>{currencySymbol}{Number(total || 0).toFixed(2)}</Text>
      </View>

      {/* Ongoing Note */}
      {item.note && (
        <View style={styles.noteBox}>
          <Text style={styles.noteText} numberOfLines={2}>{item.note}</Text>
          <View style={styles.noteIconWrap}>
            <Bike size={scale(30)} color="#ed1c24" strokeWidth={2.6} />
          </View>
        </View>
      )}

      {/* Completed */}
      {item.completed && currentFilter === 'Completed' && (
        <View style={styles.completedActionRow}>
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackLabel}>{t('orders.share_feedback', 'Share your Feedback')}</Text>
            {(item.isRated || item.rated || (item.rating && item.rating > 0) || (item.restaurantRating && item.restaurantRating > 0)) ? (
              <RatingBadge
                rating={(() => {
                  const submittedVal =
                    item.rating ||
                    item.restaurantRating ||
                    item.orderRating ||
                    item.overallRating ||
                    item.review?.rating ||
                    item.restaurant?.ratingAverage ||
                    item.restaurant?.rating?.average ||
                    item.restaurant?.rating;

                  const finalRating = submittedVal || getRatingAverage(item.restaurant) || getRatingAverage(item) || 0;

                  return finalRating;
                })()}
                count={item.restaurant?.ratingCount || getRatingCount(item.restaurant) || getRatingCount(item) || 0}
                showCount={true}
              />
            ) : (
              <TouchableOpacity onPress={() => navigation.navigate('RatePastOrders', { order: item })}>
                <Text style={styles.review}>{t('orders.rating_and_review', 'Rating and review')}</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.reorderButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('RatePastOrders', { order: item })}
          >
            <Text style={styles.reorderText}>{t('orders.reorder', 'Reorder')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  headerWrapper: {
    paddingVertical: SPACING.md,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerText: {
    fontSize: scale(20),
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },

  headerDivider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    width: '100%',
    marginBottom: SPACING.md,
  },

  contentPadding: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },

  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: scale(50),
    paddingHorizontal: scale(18),
    marginBottom: SPACING.lg,
    height: scale(52),
    borderWidth: 1.2,
    borderColor: '#999999',
  },

  searchIcon: {
    marginRight: scale(8),
  },

  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: '#000000',
    height: '100%',
    fontWeight: '400',
  },

  filterContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    justifyContent: 'space-between',
    gap: scale(6),
  },

  filterChip: {
    flex: 1,
    paddingVertical: scale(10),
    paddingHorizontal: scale(4),
    borderRadius: scale(25),
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterChipActive: {
    backgroundColor: '#ed1c24',
    borderColor: '#ed1c24',
  },

  filterChipText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    color: '#666666',
  },

  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  card: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: scale(18),
    paddingHorizontal: scale(14),
    paddingVertical: scale(14),
    marginBottom: SPACING.lg,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: scale(6),
    elevation: 2,
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  restaurantInfo: {
    flex: 1,
    paddingRight: scale(10),
  },

  divider: {
    height: 1,
    backgroundColor: '#DCDCDC',
    marginTop: scale(10),
  },

  restaurant: {
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
    color: '#000',
  },

  cuisine: {
    fontSize: FONT_SIZES.sm,
    color: '#111111',
    marginTop: scale(4),
  },

  itemsWrapper: {
    paddingTop: scale(14),
    paddingBottom: scale(8),
  },

  itemsGrid: {
    flexDirection: 'row',
    gap: scale(18),
  },

  itemPreview: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: scale(8),
  },

  itemPreviewPlaceholder: {
    flex: 1,
  },

  itemCopy: {
    flex: 1,
    minWidth: 0,
  },

  itemImg: {
    width: scale(54),
    height: scale(54),
    borderRadius: scale(8),
  },

  itemTitle: {
    fontSize: FONT_SIZES.sm,
    color: '#111111',
    fontWeight: '800',
  },

  itemSub: {
    fontSize: FONT_SIZES.sm,
    color: '#666666',
    marginTop: scale(4),
  },

  moreText: {
    fontSize: FONT_SIZES.sm,
    color: '#555555',
    marginTop: scale(8),
    textAlign: 'right',
    paddingRight: scale(6),
  },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: scale(16),
  },

  dateBlock: {
    flex: 1,
    paddingRight: scale(12),
  },

  date: {
    fontSize: FONT_SIZES.sm,
    color: '#555555',
    lineHeight: scale(23),
  },

  status: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    marginTop: scale(2),
  },

  price: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '800',
    color: '#000',
    marginTop: scale(2),
  },

  noteBox: {
    minHeight: scale(42),
    backgroundColor: '#FFF0F1',
    borderRadius: scale(8),
    paddingLeft: scale(14),
    paddingRight: scale(10),
    paddingVertical: scale(8),
    marginTop: scale(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: scale(10),
  },

  noteText: {
    fontSize: FONT_SIZES.xs,
    lineHeight: scale(16),
    color: '#111111',
    flex: 1,
  },

  noteIconWrap: {
    width: scale(42),
    height: scale(32),
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },

  completedActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: scale(16),
    paddingTop: scale(12),
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },

  feedbackContainer: {
    flex: 1,
  },

  feedbackLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: '#000000',
    marginBottom: scale(4),
  },

  review: {
    fontSize: FONT_SIZES.sm,
    color: '#EB5757',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },

  reorderButton: {
    backgroundColor: '#ed1c24',
    paddingHorizontal: scale(30),
    paddingVertical: scale(12),
    borderRadius: scale(12),
    marginLeft: scale(10),
  },

  reorderText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },

  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
  },
  ratingValueText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: '#000',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZES.sm,
    color: '#828282',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(8),
  },

  emptyText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },

  emptySubText: {
    fontSize: FONT_SIZES.xs,
    color: '#828282',
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
});


