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
import { ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { translateField } from '../../services/translationService';

import { CartContext } from '../../context/CartContext';
import { useNavigation } from '@react-navigation/native';
import { wp, hp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';

const FALLBACK_ITEM_IMAGE = require('../../assets/images/Noodle.png');

export function formatOrderDateTime(isoString, t, options = {}) {
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

  const day = String(date.getDate()).padStart(2, '0'); // Pad day with leading zero
  const month = months[date.getMonth()]; // Translated month name
  // const year = date.getFullYear(); // Year is not explicitly requested in "24, may" format

  const hours24 = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = ((hours24 + 11) % 12) + 1;
  const formattedTime = `${hours12}:${minutes}${ampm}`;

  if (options.formatKey === 'order_details.on_date_at_time') {
    const datePart = `${date.getDate()} , ${month.toLowerCase()}`; // e.g., "24 , may"
    const timePart = `${hours12}:${minutes} ${ampm.toLowerCase()}`; // e.g., "2:00 pm"
    return t('order_details.on_date_at_time', 'on {{date}} at {{time}}', {
      date: datePart,
      time: timePart,
    });
  }

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
  const [statusFilter, setStatusFilter] = useState('All');
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
  }, []);

  const data = useMemo(() => {
    return (orders || [])
      .filter(o => !!o?.deliveryAddress)
      .map(o => {
        const ui = deriveStatusUi(o, t);
        return { ...o, ...ui };
      })
      .filter(o => {
        if (statusFilter === 'All') return true;
        if (statusFilter === 'Ongoing') return o.status === t('orders.status.ongoing', 'Ongoing') || o.status === t('orders.status.preparing', 'Preparing');
        if (statusFilter === 'Completed') return o.completed === true;
        if (statusFilter === 'Cancelled') return o.status === t('orders.status.cancelled', 'Cancelled');
        return true;
      });
  }, [orders, statusFilter, t]);

  const handleFilterChange = useCallback((status) => {
    setStatusFilter(status);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.header}>{t('orders.your_orders', 'Your Orders')}</Text>

      <View style={styles.filterContainer}>
        {[
          { key: 'All', label: t('orders.filter.all', 'All') },
          { key: 'Ongoing', label: t('orders.filter.ongoing', 'Ongoing') },
          { key: 'Completed', label: t('orders.filter.completed', 'Completed') },
          { key: 'Cancelled', label: t('orders.filter.cancelled', 'Cancelled') }
        ].map(status => (
          <TouchableOpacity
            key={status.key}
            style={[styles.filterChip, statusFilter === status.key && styles.filterChipActive]}
            onPress={() => handleFilterChange(status.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, statusFilter === status.key && styles.filterChipTextActive]}>
              {status.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>{t('orders.loading', 'Loading your orders...')}</Text>
        </View>
      ) : data.length === 0 ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ed1c24']} />}
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
          renderItem={({ item }) => <OrderCard item={item} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF3D3D']} />}
        />
      )}
    </SafeAreaView>
  );
}

const OrderCard = memo(function OrderCard({ item }) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en';
  const { currencySymbol } = useAuth();
  const navigation = useNavigation();

  // Robust restaurant name resolution similar to OrderDetailsScreen
  const getResolvedRestaurantName = useCallback(() => {
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
  const [displayName, setDisplayName] = useState(initialName);

  // Sync displayName if item or language changes
  useEffect(() => {
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

  const items = Array.isArray(item?.items) ? item.items : [];
  const shownItems = items.slice(0, 2);
  const remainingCount = Math.max(0, items.length - shownItems.length);
  const cuisineLine = items.map(it => it?.name || it?.productName).filter(Boolean).slice(0, 3).join(', ');
  const { dateLine1, dateLine2 } = formatOrderDateTime(item?.createdAt, t);
  const total = item?.totalAmount || 0;

  return (
    <Pressable style={styles.card} onPress={() => navigation.navigate("OrderDetailsScreen", { orderId: item._id || item.id })}>
      <View style={styles.rowBetween}>
        <View>
          <Text style={styles.restaurant}>{displayName}</Text>
          <Text style={styles.cuisine} numberOfLines={1}>{cuisineLine || '—'}</Text>
        </View>
        <ChevronRight size={18} color="#BDBDBD" />
      </View>
      <View style={styles.itemsWrapper}>
        {shownItems.map((it, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Image source={getImageSource(it?.image)} style={styles.itemImg} />
            <View>
              <Text style={styles.itemTitle}>{it?.name || t('orders.item', 'Item')}</Text>
              <Text style={styles.itemSub}>{it?.quantity ? `${t('orders.qty', 'Qty')}: ${it.quantity}` : '—'}</Text>
            </View>
          </View>
        ))}
        {remainingCount > 0 && <Text style={styles.moreText}>{t('orders.more_items', '+{{count}} More', { count: remainingCount })}</Text>}
      </View>
      <View style={styles.rowBetween}>
        <View>
          {!!dateLine1 && <Text style={styles.date}>{dateLine1}</Text>}
          <Text style={[styles.status, { color: item.statusColor }]}>{item.status}</Text>
        </View>
        <Text style={styles.price}>{Number(total).toFixed(2)} {currencySymbol}</Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: SPACING.lg },
  header: { marginTop: hp(2), marginBottom: SPACING.lg, fontSize: FONT_SIZES.lg, fontWeight: '600', textAlign: 'center', color: '#000000' },
  filterContainer: { flexDirection: 'row', marginBottom: SPACING.lg, gap: SPACING.sm, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: scale(20), backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
  filterChipActive: { backgroundColor: '#ed1c24', borderColor: '#ed1c24' },
  filterChipText: { fontSize: FONT_SIZES.xs, fontWeight: '500', color: '#666666' },
  filterChipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  card: { borderWidth: 1, borderColor: '#EEEEEE', borderRadius: scale(12), padding: SPACING.md, marginBottom: SPACING.lg },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  restaurant: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: '#000' },
  cuisine: { fontSize: FONT_SIZES.xs, color: '#828282', marginTop: scale(2) },
  itemsWrapper: { marginVertical: SPACING.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: scale(6) },
  itemImg: { width: scale(36), height: scale(36), borderRadius: scale(6), marginRight: SPACING.sm },
  itemTitle: { fontSize: FONT_SIZES.xs, color: '#000' },
  itemSub: { fontSize: FONT_SIZES.xs, color: '#828282' },
  moreText: { fontSize: FONT_SIZES.xs, color: '#828282', marginLeft: scale(44), marginTop: scale(2) },
  date: { fontSize: FONT_SIZES.xs, color: '#828282' },
  status: { fontSize: FONT_SIZES.xs, fontWeight: '600', marginTop: scale(4) },
  price: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: '#000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: SPACING.sm, fontSize: FONT_SIZES.sm, color: '#828282' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: wp(8) },
  emptyText: { fontSize: FONT_SIZES.md, fontWeight: '600', color: '#000000', textAlign: 'center' },
  emptySubText: { fontSize: FONT_SIZES.xs, color: '#828282', marginTop: SPACING.sm, textAlign: 'center' },
});
