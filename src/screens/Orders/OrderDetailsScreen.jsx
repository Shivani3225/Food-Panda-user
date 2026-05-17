import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, MoreVertical, Phone } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import apiClient from '../../config/apiClient';
import { ORDER_ROUTES } from '../../config/routes';
import { toNumber } from '../../services/cartPricing';
import { translateField } from '../../services/translationService';
import { RefreshableWrapper } from '../../components/RefreshableWrapper';
import OrderRatingModule from '../../components/Rating/OrderRatingModule';
import { wp, hp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';
import { useOrderRealtime } from '../../hooks/useOrderRealtime';
import { AuthContext, useAuth } from '../../context/AuthContext';

import { CartContext } from '../../context/CartContext';
import { formatOrderDateTime } from '../Orders/OrdersScreen';
const FALLBACK_HEADER = require('../../assets/images/Noodle.png');

// Helper to extract string from translation object {en, de} or return string as-is
function getLocalizedText(value, fallback = '', lang = 'en') {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const result = value[lang] || value.en || value.de || value.ar || fallback;
    console.log(`🌐 [OrderDetails] Lang:${lang} | en:"${value.en}" → "${result}"`);
    return result;
  }
  return String(value);
}


function formatOptionsLine(item, t) {
  const parts = [];
  if (item?.selectedFlavor?.label) parts.push(getLocalizedText(item.selectedFlavor.label));
  if (Array.isArray(item?.addOns) && item.addOns.length > 0) {
    parts.push(
      item.addOns
        .map(a => getLocalizedText(a?.label))
        .filter(Boolean)
        .join(', '),
    );
  }
  return parts.join(' • ') || t('order_details.regular', 'Regular');
}

function imgSource(uri) {
  if (typeof uri === 'string' && uri.trim().length > 0) return { uri };
  return FALLBACK_HEADER;
}

const FALLBACK_DUMMY_PHONE = '9893678524';

export default function OrderDetailsScreen() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en';
  const navigation = useNavigation();
  const { fetchOrders: fetchOrdersFromCartContext } = useContext(CartContext);
  const route = useRoute();
  const { isAuthenticated, currencySymbol } = useAuth() || {};
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const orderId = route?.params?.orderId;
  const orderData = route?.params?.orderData;
  const fromScreen = route?.params?.fromScreen;

  const handleBackPress = () => {
    if (fromScreen === 'ReviewOrder' || fromScreen === 'Cart') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs', params: { screen: 'Home' } }],
      });
    } else {
      navigation.goBack();
    }
  };

  const getPhoneCandidates = sourceOrder => [
    sourceOrder?.callContacts?.primaryPhone,
    sourceOrder?.callContacts?.riderPhone,
    sourceOrder?.riderPhone,
    sourceOrder?.rider?.phone,
    sourceOrder?.rider?.user?.mobile,
    sourceOrder?.callContacts?.restaurantPhone,
    sourceOrder?.restaurantPhone,
    sourceOrder?.restaurant?.phone,
    sourceOrder?.restaurant?.contactNumber,
    sourceOrder?.restaurant?.mobile,
    sourceOrder?.restaurant?.owner?.mobile,
    sourceOrder?.callContacts?.customerPhone,
    sourceOrder?.customer?.phone,
    sourceOrder?.customer?.mobile,
  ];

  const getRiderNumber = sourceOrder => {
    const riderCandidates = [
      sourceOrder?.riderPhone,
      sourceOrder?.rider?.phone,
      sourceOrder?.rider?.user?.mobile,
    ];

    const firstValid = riderCandidates
      .map(value => String(value || '').trim())
      .find(Boolean);

    if (!firstValid) {
      return null;
    }

    return firstValid.replace(/(?!^)\+/g, '').replace(/[^\d+]/g, '');
  };

  const getRestaurantNumber = sourceOrder => {
    const restaurantCandidates = [
      sourceOrder?.callContacts?.restaurantPhone,
      sourceOrder?.restaurantPhone,
      sourceOrder?.restaurant?.phone,
      sourceOrder?.restaurant?.contactNumber,
      sourceOrder?.restaurant?.mobile,
      sourceOrder?.restaurant?.owner?.mobile,
    ];

    const firstValid = restaurantCandidates
      .map(value => String(value || '').trim())
      .find(Boolean);

    if (!firstValid) {
      return null;
    }

    return firstValid.replace(/(?!^)\+/g, '').replace(/[^\d+]/g, '');
  };

  const getCallButtonLabel = sourceOrder =>
    getRestaurantNumber(sourceOrder)
      ? t('order_details.call_now', 'Call Now')
      : (getRiderNumber(sourceOrder)
        ? t('order_details.call_rider', 'Call Rider')
        : t('order_details.call_now', 'Call Now'));

  const hasContactData = sourceOrder =>
    getPhoneCandidates(sourceOrder)
      .map(value => String(value || '').trim())
      .some(Boolean);

  const fetchOrder = useCallback(async (forceApi = false) => {
    if (!orderId) return;

    const hasBillData = orderData && (
      orderData?.itemTotal !== undefined ||
      orderData?.totalAmount !== undefined ||
      orderData?.deliveryFee !== undefined
    );

    if (orderData && hasBillData && !forceApi && hasContactData(orderData)) {
      console.log('[OrderDetailsScreen] 📦 Using passed orderData');
      setOrder(orderData);
      return;
    }

    try {
      const url = ORDER_ROUTES.getOrderById.replace(':id', orderId);
      const response = await apiClient.get(url);
      const fetchedOrder = response?.data?.order || response?.data?.data || response?.data;
      let normalizedOrder = fetchedOrder;
      if (fetchedOrder?.bill && typeof fetchedOrder.bill === 'object') {
        normalizedOrder = {
          ...fetchedOrder,
          itemTotal: fetchedOrder.itemTotal ?? fetchedOrder.bill.itemTotal ?? fetchedOrder.bill.items,
          deliveryFee: fetchedOrder.deliveryFee ?? fetchedOrder.bill.deliveryFee ?? fetchedOrder.bill.delivery,
          tax: fetchedOrder.tax ?? fetchedOrder.bill.tax,
          platformFee: fetchedOrder.platformFee ?? fetchedOrder.bill.platformFee ?? fetchedOrder.bill.fees,
          totalAmount: fetchedOrder.totalAmount ?? fetchedOrder.bill.totalAmount ?? fetchedOrder.bill.total,
        };
      }
      setOrder(normalizedOrder);
    } catch (error) {
      console.error('[OrderDetailsScreen] ❌ Error fetching order:', error);
      setOrder(null);
    }
  }, [orderData, orderId]);

  useEffect(() => {
    if (!orderId || !isAuthenticated) {
      setLoading(false);
      return;
    }

    const loadOrder = async () => {
      setLoading(true);
      await fetchOrder();
      setLoading(false);
    };

    loadOrder();
  }, [fetchOrder, orderId, isAuthenticated]);

  const appendTimelineEvent = (prevOrder, status, message) => {
    const currentTimeline = Array.isArray(prevOrder?.timeline) ? prevOrder.timeline : [];
    const nextEvent = {
      status,
      label: status,
      description: message || t('order_details.updated_to', 'Order updated to {{status}}', { status }),
      timestamp: new Date().toISOString(),
      by: 'system',
    };
    return [...currentTimeline, nextEvent];
  };

  useOrderRealtime(orderId, {
    onOrderStatus: payload => {
      const nextStatus = payload?.status;
      if (!nextStatus) return;
      setOrder(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          status: nextStatus,
          timeline: appendTimelineEvent(prev, nextStatus, payload?.message),
        };
      });
    },
    onOrderStatusUpdated: payload => {
      const nextStatus = payload?.newStatus || payload?.status;
      if (!nextStatus) return;
      setOrder(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          status: nextStatus,
          timeline: appendTimelineEvent(prev, nextStatus, payload?.message),
        };
      });
    },
    onOrderCancelled: payload => {
      setOrder(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'cancelled',
          cancellationReason: payload?.reason || prev?.cancellationReason,
          timeline: appendTimelineEvent(prev, 'cancelled', payload?.reason || t('order_details.order_cancelled', 'Order was cancelled')),
        };
      });
    },
    onRiderAssigned: payload => {
      setOrder(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          status: payload?.status || prev?.status,
          rider: {
            ...(prev?.rider || {}),
            _id: payload?.riderId || prev?.rider?._id,
            name: payload?.riderName || prev?.rider?.name,
          },
          timeline: appendTimelineEvent(prev, payload?.status || 'assigned', payload?.message),
        };
      });
    },
    onRiderLocation: payload => {
      setOrder(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          riderLiveLocation: payload?.riderLocation || payload,
          eta: payload?.eta || prev?.eta,
        };
      });
    },
  });

  const items = Array.isArray(order?.items) ? order.items : [];
  const first = items[0];

  const computedSubtotal = items.reduce(
    (sum, item) => sum + toNumber(item?.price, 0) * toNumber(item?.quantity ?? item?.qty, 1),
    0,
  );

  const restaurantName =
    getLocalizedText(order?.restaurant?.name, '', currentLang) ||
    getLocalizedText(order?.restaurant?.title, '', currentLang) ||
    getLocalizedText(order?.restaurantName, '', currentLang) ||
    getLocalizedText(order?.restaurant_name, '', currentLang) ||
    getLocalizedText(order?.shopName, '', currentLang) ||
    getLocalizedText(order?.vendorName, '', currentLang) ||
    (typeof order?.restaurant === 'string' ? order.restaurant : '') ||
    getLocalizedText(order?.restaurant?.restaurantName, '', currentLang) ||
    getLocalizedText(orderData?.restaurant?.name, '', currentLang) ||
    getLocalizedText(orderData?.restaurantName, '', currentLang) ||
    getLocalizedText(items[0]?.restaurant?.name, '', currentLang) ||
    getLocalizedText(items[0]?.product?.restaurant?.name, '', currentLang) ||
    getLocalizedText(items[0]?.restaurantName, '', currentLang) ||
    t('order_details.restaurant', 'Restaurant');

  console.log('🍽️ [OrderDetails] Restaurant Data:', {
    orderRest: order?.restaurant,
    orderRestName: order?.restaurantName,
    finalResolvedName: restaurantName
  });

  const restaurantTags =
    (Array.isArray(order?.restaurant?.cuisine) ? order.restaurant.cuisine.map(c => getLocalizedText(c, '', currentLang)).join(', ') : '') ||
    getLocalizedText(order?.restaurantTags, '', currentLang) ||
    (Array.isArray(items[0]?.restaurant?.cuisine) ? items[0].restaurant.cuisine.map(c => getLocalizedText(c, '', currentLang)).join(', ') : '') ||
    t('order_details.default_cuisine', 'Pizza, Italian, Fast Food');

  // Async translate agar language English nahi hai
  const [translatedRestaurantName, setTranslatedRestaurantName] = React.useState(restaurantName);
  const [translatedRestaurantTags, setTranslatedRestaurantTags] = React.useState(restaurantTags);

  React.useEffect(() => {
    if (!restaurantName) return;

    if (currentLang === 'en') {
      setTranslatedRestaurantName(restaurantName);
      setTranslatedRestaurantTags(restaurantTags);
      return;
    }

    translateField(order?.restaurant?.name || order?.restaurantName, currentLang)
      .then(v => { if (v) setTranslatedRestaurantName(v); else setTranslatedRestaurantName(restaurantName); })
      .catch(err => { console.error('Error translating restaurant name:', err); setTranslatedRestaurantName(restaurantName); });

    const tagsSource = order?.restaurant?.cuisine?.[0] || order?.restaurantTags;
    if (tagsSource) {
      translateField(tagsSource, currentLang)
        .then(v => { if (v) setTranslatedRestaurantTags(v); else setTranslatedRestaurantTags(restaurantTags); })
        .catch(err => { console.error('Error translating tags:', err); setTranslatedRestaurantTags(restaurantTags); });
    }
  }, [currentLang, order, restaurantName, restaurantTags]);

  const restaurantImage =
    order?.restaurant?.image ||
    order?.restaurant?.bannerImage ||
    order?.restaurantImage ||
    first?.restaurant?.image ||
    first?.image;

  const subtotal = toNumber(order?.itemTotal, 0) || computedSubtotal;
  const delivery = toNumber(order?.deliveryFee, 0);
  const tax = toNumber(order?.tax, 0);
  const packaging = toNumber(order?.packaging ?? order?.packagingFee, 0);
  const serviceFee = toNumber(order?.platformFee, 0);
  const discount = toNumber(order?.discount, 0);
  const tip = toNumber(order?.tip, 0);

  const computedGrandTotal = subtotal + delivery + tax + packaging + serviceFee - discount + tip;
  const grandTotal = toNumber(order?.totalAmount, 0) || computedGrandTotal;

  const totals = {
    subtotal,
    delivery,
    tax,
    packaging,
    serviceFee,
    smallCartFee: 0,
    discount,
    tip,
    totalBeforeTip: subtotal + tax + delivery + serviceFee - discount,
    grandTotal,
  };

  // Get status from timeline or fallback to status-based mapping
  const getStatusLine = () => {
    if (Array.isArray(order?.timeline) && order.timeline.length > 0) {
      const latestEntry = order.timeline[order.timeline.length - 1];
      if (latestEntry?.description) {
        return getLocalizedText(latestEntry.description);
      }
      if (latestEntry?.label) {
        return getLocalizedText(latestEntry.label);
      }
    }

    const statusMessages = {
      placed: t('order_status.placed', 'Your order has been placed'),
      accepted: t('order_status.accepted', 'Restaurant has accepted your order'),
      preparing: t('order_status.preparing', 'Your food is being prepared'),
      ready: t('order_status.ready', 'Your order is ready for pickup'),
      assigned: t('order_status.assigned', 'Rider has been assigned to your order'),
      picked_up: t('order_status.picked_up', 'Your order is on its way'),
      delivery_arrived: t('order_status.delivery_arrived', 'Rider has arrived at your location'),
      delivered: t('order_status.delivered', 'Your order has been delivered'),
      cancelled: t('order_status.cancelled', 'Your order was cancelled'),
      failed: t('order_status.failed', 'Order payment failed'),
    };

    return statusMessages[order?.status] || t('order_status.processing', 'Processing your order');
  };

  const statusLine = getStatusLine();

  const getCallNumber = (sourceOrder = order) => {
    const candidates = getPhoneCandidates(sourceOrder);
    const firstValid = candidates
      .map(value => String(value || '').trim())
      .find(Boolean);
    if (!firstValid) return null;
    return firstValid.replace(/(?!^)\+/g, '').replace(/[^\d+]/g, '');
  };

  const handleCallNow = async () => {
    const phoneNumber =
      getRestaurantNumber(order) ||
      getRiderNumber(order) ||
      getCallNumber(order) ||
      FALLBACK_DUMMY_PHONE;

    try {
      await Linking.openURL(`tel:${phoneNumber}`);
    } catch (error) {
      Alert.alert(
        t('order_details.unable_to_call', 'Unable to Call'),
        t('order_details.call_error', 'Could not open the phone dialer. Please try again.')
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E53935" />
          <Text style={styles.loadingText}>{t('order_details.fetching_order', 'Fetching your order...')}</Text>
        </View>
      ) : !order ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('order_details.order_not_found', 'Order not found')}</Text>
        </View>
      ) : (
        <>
          <View style={styles.imageWrapper}>
            <ImageBackground
              source={imgSource(restaurantImage)}
              style={styles.headerImage}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.9)', '#FFFFFF']}
                locations={[0.35, 0.75, 1]}
                style={styles.headerFade}
              />

              <View style={styles.headerTopBar}>
                <TouchableOpacity
                  style={styles.backBtn}
                  activeOpacity={0.85}
                  onPress={handleBackPress}
                >
                  <ArrowLeft size={20} color="#111" />
                </TouchableOpacity>
              </View>

              <View style={styles.imageContent}>
                <View style={styles.headerInfoRow}>
                  <View style={styles.headerTextBlock}>
                    <Text style={styles.restaurantImageName}>{translatedRestaurantName}</Text>
                    <Text style={styles.restaurantImageTags}>{translatedRestaurantTags}</Text>
                    <TouchableOpacity
                      style={styles.menuLink}
                      activeOpacity={0.7}
                      onPress={() => {
                        const res = order?.restaurantData || order?.restaurant;
                        if (res?._id || res?.id) {
                          navigation.navigate('RestaurantDetail', { restaurant: res });
                        }
                      }}
                    >
                      <Text style={styles.menuLinkText}>{t('order_details.menu', 'Menu')} &gt;</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.callButton} activeOpacity={0.85} onPress={handleCallNow}>
                    <Phone size={14} color="#FFFFFF" />
                    <Text style={styles.callButtonText}>{getCallButtonLabel(order)}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ImageBackground>
          </View>

          <RefreshableWrapper
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            onRefresh={() => fetchOrder(true)}
          >
            <View style={styles.statusSection}>
              <Text style={styles.statusText}>🔥 “{statusLine}”</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t('order_details.items', 'Items')} ({items.length})
              </Text>

              {items.map((item, index) => {
                const lineTotal = toNumber(item?.price, 0) * toNumber(item?.quantity ?? item?.qty, 1);
                const itemImage = item?.product?.image || item?.image;
                const subLine = formatOptionsLine(item, t);

                return (
                  <View style={styles.itemRow} key={item?._id ?? item?.id ?? `item-${index}`}>
                    <Image source={imgSource(itemImage)} style={styles.itemThumb} />
                    <View style={styles.itemContent}>
                      <Text style={styles.itemName}>{getLocalizedText(item?.name, 'Item')}</Text>
                      <Text style={styles.itemSub}>{subLine}</Text>
                    </View>
                    <Text style={styles.price}>{toNumber(lineTotal, 0).toFixed(2)} {currencySymbol}</Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.billSection}>
              <View style={styles.billCard}>
                <Text style={styles.infoTitle}>{t('order_details.bill_details', 'Bill Details')}</Text>
                <View style={styles.billRowBordered}>
                  <Text style={styles.billLabel}>{t('order_details.subtotal', 'Subtotal')}</Text>
                  <Text style={styles.billValue}>{currencySymbol}{totals.subtotal.toFixed(2)}</Text>
                </View>

                <View style={styles.billRowBordered}>
                  <Text style={styles.billLabel}>{t('order_details.standard_delivery', 'Standard Delivery')}</Text>
                  {totals.delivery === 0 ? (
                    <Text style={styles.deliveryFree}>{t('order_details.free', 'Free')}</Text>
                  ) : (
                    <Text style={styles.billValue}>{currencySymbol}{totals.delivery.toFixed(2)}</Text>
                  )}
                </View>

                <View style={styles.billRowBordered}>
                  <Text style={styles.billLabel}>{t('order_details.service_fee', 'Service Fee')}</Text>
                  <Text style={styles.billValue}>{currencySymbol}{totals.serviceFee.toFixed(2)}</Text>
                </View>

                <View style={styles.billRowGap}>
                  <Text style={styles.billStrong}>{t('order_details.grand_total', 'Grand Total')}</Text>
                  <Text style={styles.billStrong}>{currencySymbol}{totals.grandTotal.toFixed(2)}</Text>
                </View>

                {totals.discount > 0 && (
                  <View style={styles.billRow}>
                    <Text style={styles.couponLabel}>
                      {t('order_details.coupon_applied', 'Coupon Applied')} - {order?.couponId || order?.couponCode || 'DISCOUNT'}
                    </Text>
                    <Text style={styles.billValue}>-{currencySymbol}{totals.discount.toFixed(2)}</Text>
                  </View>
                )}

                <View style={styles.billRow}>
                  <Text style={styles.billStrong}>{t('order_details.paid', 'Paid')}</Text>
                  <Text style={styles.billStrong}>{currencySymbol}{totals.grandTotal.toFixed(2)}</Text>
                </View>

                {totals.discount > 0 && (
                  <View style={styles.savingsBanner}>
                    <Text style={styles.savingsBannerText}>
                      {t('order_details.savings_hurray', 'Hurray! You saved {{symbol}}{{amount}} on this order', {
                        symbol: currencySymbol,
                        amount: totals.discount.toFixed(2)
                      })}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoBlock}>
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={styles.infoTitle}>{t('order_details.delivering_address', 'Delivering Address')}</Text>
                    <Text style={styles.address}>
                      {order?.deliveryAddress?.addressLine || order?.address?.addressLine || order?.address || t('order_details.address_not_available', 'Address not available')}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.trackOrderButton}
                    onPress={() => navigation.navigate('TrackOrder', { orderId: order?._id || order?.id })}
                  >
                    <Text style={styles.trackOrderButtonText}>{t('order_details.track_order', 'Track Order')}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.infoBlockCompact}>
                <Text style={styles.infoLabel}>{t('order_details.order_id', 'Order ID')}</Text>
                <Text style={styles.infoValue}>#{order?.id || order?._id || 'N/A'}</Text>
              </View>

              <View style={styles.infoBlockCompact}>
                <Text style={styles.infoLabel}>{t('order_details.payment_method', 'Payment Method')}</Text>
                <Text style={styles.infoValue}>
                  {(() => {
                    const rawMethod = order?.paymentMethod || order?.payment || '';
                    const method = (typeof rawMethod === 'object' ? rawMethod?.method : String(rawMethod)).toLowerCase();

                    let methodLabel = '';
                    if (method === 'cod' || method === 'cash')
                      methodLabel = t('order_details.cash_on_delivery', 'Cash on Delivery');
                    else if (method === 'card' || method === 'stripe' || method === 'credit_card')
                      methodLabel = t('order_details.credit_debit_card', 'Credit Card');
                    else if (method === 'wallet')
                      methodLabel = t('order_details.wallet', 'Wallet');
                    else if (method === 'upi' || method === 'gpay' || method === 'phonepe')
                      methodLabel = t('order_details.upi', 'UPI');
                    else
                      methodLabel = typeof rawMethod === 'object' ? rawMethod?.method : String(rawMethod);

                    return `${t('order_details.via', 'Via')} ${methodLabel || t('order_details.not_specified', 'Not specified')}`;
                  })()}
                </Text>
              </View>

              <View style={styles.infoBlockCompact}>
                <Text style={styles.infoLabel}>{t('order_details.payment_time_date', 'Payment Time & Date')}</Text>
                <Text style={styles.infoValue}>
                  {(() => {
                    const raw = order?.createdAt || order?.paidAt;
                    if (!raw) return t('order_details.not_available', '—');
                    const result = formatOrderDateTime(raw, t, { formatKey: 'order_details.on_date_at_time' });
                    return typeof result === 'string' ? result : t('order_details.not_available', '—');
                  })()}
                </Text>
              </View>
            </View>

            {order?.refund && order.refund.status && order.refund.status !== 'none' ? (
              <View style={styles.refundStatusCard}>
                <Text style={styles.refundStatusTitle}>🛡️ {t('order_details.refund_details', 'Refund Details')}</Text>
                <View style={styles.rowBetween}>
                  <Text style={styles.refundStatusLabel}>{t('order_details.refund_status', 'Refund Status')}</Text>
                  <Text style={[
                    styles.refundStatusValue,
                    order.refund.status === 'completed' || order.refund.status === 'processed' ? styles.refundSuccess : styles.refundPending
                  ]}>
                    {order.refund.status === 'completed' || order.refund.status === 'processed' 
                      ? t('order_details.refund_completed', 'Processed (Credited to Wallet)') 
                      : t('order_details.refund_pending', 'Refund Under Review')}
                  </Text>
                </View>
                <View style={[styles.rowBetween, { marginTop: scale(6) }]}>
                  <Text style={styles.refundStatusLabel}>{t('order_details.refund_amount', 'Amount')}</Text>
                  <Text style={styles.refundStatusAmount}>{order.refund.amount?.toFixed(2)} {currencySymbol}</Text>
                </View>
                {order.refund.note && (
                  <Text style={styles.refundNote}>* {order.refund.note}</Text>
                )}
              </View>
            ) : (
              order?.status === 'delivered' && (
                <View style={{ marginHorizontal: SPACING.lg, marginBottom: SPACING.md }}>
                  <TouchableOpacity
                    style={styles.requestRefundButton}
                    onPress={() => navigation.navigate('RequestRefundScreen', { orderId: order?._id || order?.id, orderData: order })}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.requestRefundButtonText}>🛡️ {t('order_details.request_refund', 'Request Item/Order Refund')}</Text>
                  </TouchableOpacity>
                </View>
              )
            )}

            {order?.status === 'delivered' && (
              <OrderRatingModule
                order={order}
                onSuccess={async () => {
                  fetchOrder();
                  if (fetchOrdersFromCartContext) {
                    await fetchOrdersFromCartContext();
                  }
                }}
              />
            )}
          </RefreshableWrapper>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    gap: SPACING.lg,
  },

  loadingText: {
    fontSize: FONT_SIZES.sm,
    color: '#666666',
    fontWeight: '500',
    marginTop: SPACING.md,
  },

  imageWrapper: {
    height: hp(30),
    width: '100%',
  },

  headerImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  headerFade: {
    ...StyleSheet.absoluteFillObject,
  },

  headerTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: scale(24),
    paddingBottom: scale(10),
  },

  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  backBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  moreBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  imageContent: {
    position: 'absolute',
    bottom: 0,
    left: SPACING.lg,
    right: SPACING.lg,
    paddingBottom: scale(14),
  },

  headerInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  headerTextBlock: {
    flex: 1,
    paddingRight: SPACING.md,
  },

  restaurantImageName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: '#111111',
    marginBottom: SPACING.xs,
  },

  restaurantImageTags: {
    fontSize: FONT_SIZES.sm,
    color: '#666666',
    marginBottom: SPACING.md,
  },

  menuLink: {
    alignSelf: 'flex-start',
    paddingVertical: scale(6),
  },

  menuLinkText: {
    color: '#E53935',
    fontSize: scale(14),
    fontWeight: '700',
  },

  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E53935',
    paddingHorizontal: SPACING.md,
    paddingVertical: scale(8),
    borderRadius: scale(8),
    gap: SPACING.xs,
  },

  callButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },

  scrollContent: {
    paddingBottom: scale(30),
  },

  statusSection: {
    backgroundColor: '#FDEEEE',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    paddingHorizontal: scale(14),
    paddingVertical: SPACING.md,
    borderRadius: scale(16),
  },

  statusText: {
    fontSize: FONT_SIZES.xs,
    color: '#111111',
    textAlign: 'center',
  },

  section: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderColor: '#F3F3F3',
  },

  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: '#000000',
    marginBottom: SPACING.md,
  },

  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingVertical: scale(2),
  },

  itemThumb: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(10),
    marginRight: SPACING.sm,
    backgroundColor: '#F3F3F3',
  },

  itemContent: {
    flex: 1,
    marginRight: SPACING.sm,
  },

  itemName: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    color: '#000000',
    marginBottom: scale(2),
  },

  itemSub: {
    fontSize: FONT_SIZES.xs - 1,
    color: '#828282',
  },

  price: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: '#000000',
  },

  billSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },

  billCard: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: scale(12),
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: '#FFFFFF',
  },

  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: scale(8),
  },

  billRowBordered: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: scale(10),
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },

  billRowGap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: scale(20),
    paddingBottom: scale(8),
  },

  billLabel: {
    fontSize: scale(13),
    color: '#555555',
    fontWeight: '400',
  },

  billValue: {
    fontSize: scale(13),
    color: '#000000',
    fontWeight: '700',
  },

  billStrong: {
    fontSize: scale(14),
    color: '#000000',
    fontWeight: '800',
  },

  deliveryFree: {
    fontSize: scale(13),
    color: '#ed1c24',
    fontWeight: '500',
  },

  grandTotal: {
    fontSize: FONT_SIZES.xs,
    color: '#000000',
    fontWeight: '700',
  },

  couponRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
    paddingVertical: scale(2),
  },

  couponLabel: {
    fontSize: FONT_SIZES.xs,
    color: '#4F4F4F',
    fontStyle: 'italic',
  },

  couponValue: {
    fontSize: FONT_SIZES.xs,
    color: '#EB5757',
    fontWeight: '500',
  },

  paidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: scale(2),
  },

  paidLabel: {
    fontSize: FONT_SIZES.xs,
    color: '#4F4F4F',
    fontWeight: '600',
  },

  paidValue: {
    fontSize: FONT_SIZES.xs,
    color: '#000000',
    fontWeight: '700',
  },

  savingsBanner: {
    backgroundColor: '#FDEEEE',
    paddingVertical: scale(8),
    paddingHorizontal: scale(12),
    borderRadius: scale(8),
    marginTop: scale(12),
    borderWidth: 0.5,
    borderColor: '#FADADA',
  },
  savingsBannerText: {
    color: '#ed1c24',
    fontSize: scale(12),
    fontWeight: '600',
    textAlign: 'center',
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  infoCard: {
    marginHorizontal: SPACING.lg,
    marginTop: scale(6),
    marginBottom: SPACING.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDEDED',
    borderRadius: scale(16),
    paddingHorizontal: scale(14),
    paddingVertical: SPACING.md,
  },

  infoBlock: {
    paddingVertical: scale(8),
  },

  infoBlockCompact: {
    paddingVertical: scale(10),
  },

  divider: {
    height: 1,
    backgroundColor: '#EFEFEF',
    backgroundColor: '#F8F8F8',
  },

  infoTitle: {
    fontSize: scale(15),
    fontWeight: '700',
    color: '#000000',
    marginBottom: scale(6),
  },

  trackOrderButton: {
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
    borderRadius: scale(8),
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  trackOrderButtonText: {
    fontSize: scale(13),
    color: '#000000',
    fontWeight: '500',
  },

  address: {
    fontSize: scale(12),
    color: '#555555',
    lineHeight: scale(18),
  },

  infoLabel: {
    fontSize: scale(15),
    fontWeight: '700',
    color: '#000000',
    marginBottom: scale(4),
  },

  infoValue: {
    fontSize: scale(12),
    color: '#555555',
  },

  requestRefundButton: {
    backgroundColor: '#ed1c24',
    height: scale(46),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ed1c24',
  },

  requestRefundButtonText: {
    color: '#FFFFFF',
    fontSize: scale(13.5),
    fontWeight: '700',
  },

  refundStatusCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: '#FFF9F9',
    borderWidth: 1.5,
    borderColor: '#FFCDD2',
    borderRadius: scale(14),
    paddingHorizontal: scale(14),
    paddingVertical: scale(12),
  },

  refundStatusTitle: {
    fontSize: scale(14),
    fontWeight: '700',
    color: '#D32F2F',
    marginBottom: scale(8),
  },

  refundStatusLabel: {
    fontSize: scale(12),
    color: '#555555',
  },

  refundStatusValue: {
    fontSize: scale(12),
    fontWeight: '700',
  },

  refundStatusAmount: {
    fontSize: scale(13),
    fontWeight: '800',
    color: '#111111',
  },

  refundSuccess: {
    color: '#2E7D32',
  },

  refundPending: {
    color: '#EF6C00',
  },

  refundNote: {
    fontSize: scale(11),
    fontStyle: 'italic',
    color: '#666666',
    marginTop: scale(8),
    borderTopWidth: 0.5,
    borderTopColor: '#FFCDD2',
    paddingTop: scale(4),
  },
});