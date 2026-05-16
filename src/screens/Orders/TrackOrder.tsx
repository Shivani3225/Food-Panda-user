import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  SafeAreaView,
  Dimensions,
  Linking
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import MapView, { Marker } from 'react-native-maps';
import { Phone, MessageSquare } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../config/apiClient';

const { width } = Dimensions.get('window');

const OrderTracking = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t, i18n } = useTranslation();
  const { currencySymbol } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ratingModal, setRatingModal] = useState({
    visible: false,
    orderId: null,
    rating: 5,
    comment: ''
  });

  const isRTL = i18n.language === 'ar';
  const textAlign = isRTL ? 'right' : 'left';

  const handleCall = async () => {
    const order = orders[0];
    if (!order) return;

    const phoneNumber =
      order.rider?.phone ||
      order.rider?.user?.mobile ||
      order.restaurant?.phone ||
      order.restaurant?.contactNumber ||
      order.restaurant?.mobile;

    if (!phoneNumber) {
      Alert.alert(t('common.error', 'Error'), t('orders.no_phone', 'No contact number available'));
      return;
    }

    try {
      await Linking.openURL(`tel:${phoneNumber}`);
    } catch (error) {
      Alert.alert(t('common.error', 'Error'), t('orders.call_failed', 'Failed to open dialer'));
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      console.log('📡 [TrackOrder] Fetching orders from: /api/orders/my-orders');
      const response = await apiClient.get('/api/orders/my-orders');
      console.log('✅ [TrackOrder] Orders fetched successfully:', response.data.orders?.length || 0, 'orders found');
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error("❌ [TrackOrder] Error fetching orders:", error?.response?.data || error.message);
      Alert.alert(t('common.error', 'Error'), t('orders.fetch_failed', 'Failed to load orders'));
    } finally {
      setLoading(false);
    }
  };

  const handleRateOrder = (orderId) => {
    setRatingModal({
      visible: true,
      orderId,
      rating: 5,
      comment: ''
    });
  };

  const submitRating = async () => {
    if (isSubmitting) return;
    const { orderId, rating, comment } = ratingModal;

    try {
      setIsSubmitting(true);
      await apiClient.post('/api/reviews', {
        orderId: orderId,
        restaurantRating: rating,
        riderRating: rating,
        comment
      });
      Alert.alert(t('common.success', 'Success'), t('orders.thank_you_rating', 'Thank you for your rating!'));
      setRatingModal({ ...ratingModal, visible: false });
    } catch (error) {
      Alert.alert(t('common.error', 'Error'), error.response?.data?.message || t('orders.rating_failed', 'Failed to submit rating'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefundRequest = async (orderId, total) => {
    Alert.prompt(
      t('orders.refund_request', 'Refund Request'),
      t('orders.refund_reason', 'Reason for refund:'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('common.submit', 'Submit'),
          onPress: async (reason) => {
            if (!reason) return;
            try {
              setIsSubmitting(true);
              const response = await apiClient.post('/api/users/refund-request', {
                orderId,
                reason
              });
              Alert.alert(t('common.success', 'Success'), response.data.message);
            } catch (error) {
              Alert.alert(t('common.error', 'Error'), error.response?.data?.message || t('orders.refund_failed', 'Refund request failed'));
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const getActiveStep = (status) => {
    const s = status?.toLowerCase();
    if (['placed'].includes(s)) return 0;
    if (['accepted'].includes(s)) return 1;
    if (['preparing', 'ready', 'picked_up', 'out_for_delivery'].includes(s)) return 2;
    if (['delivered'].includes(s)) return 3;
    return 0;
  };

  const getLangText = (data) => {
    if (!data) return '';
    if (typeof data === 'string') return data;
    if (typeof data === 'object') {
      return data.en || data.En || data.EN || Object.values(data).find(v => typeof v === 'string') || '';
    }
    return String(data);
  };

  const formatOrders = () => {
    return orders.map(o => ({
      id: o._id,
      restaurant: o.restaurant?.name || t('orders.restaurant', 'Restaurant'),
      restaurantData: o.restaurant,
      category: Array.isArray(o.restaurant?.cuisine) ? o.restaurant.cuisine.join(', ') : t('orders.food', 'Food'),
      items: o.items?.map(i => i.name) || [],
      moreItems: Math.max(0, (o.items?.length || 0) - 2),
      date: new Date(o.createdAt).toLocaleDateString(i18n.language, { day: '2-digit', month: 'short' }),
      time: new Date(o.createdAt).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' }),
      status: o.status.charAt(0).toUpperCase() + o.status.slice(1),
      statusColor: o.status === 'delivered' ? 'green' : (o.status === 'cancelled' ? 'red' : 'orange'),
      total: `${(o.totalAmount || 0).toFixed(2)} ${currencySymbol}`,
      rawStatus: o.status,
      rider: o.rider
    }));
  };

  const formattedOrders = formatOrders();
  const latestOrder = formattedOrders[0];
  const activeStep = latestOrder ? getActiveStep(latestOrder.rawStatus) : 0;
  const showMap = latestOrder && ['accepted', 'preparing', 'ready', 'picked_up', 'out_for_delivery'].includes(latestOrder.rawStatus.toLowerCase());

  const STEPS = [
    { emoji: '🧾', label: 'orders.order_step' },
    { emoji: '👨‍🍳', label: 'orders.preparing_step' },
    { emoji: '🛵', label: 'orders.on_the_way_step' },
    { emoji: '📦', label: 'orders.delivered_step' },
  ];

  const ProgressStepper = ({ activeStep }) => (
    <View style={styles.stepperContainer}>
      <View style={styles.emojiRow}>
        {STEPS.map((step, index) => (
          <View key={index} style={styles.stepColumn}>
            <Text style={styles.emojiText}>{step.emoji}</Text>
          </View>
        ))}
      </View>

      <View style={styles.progressRow}>
        {STEPS.map((_, index) => (
          <View key={index} style={styles.stepColumn}>
            <View style={styles.linesContainer}>
              <View style={[
                styles.progressLine,
                index === 0 && { backgroundColor: 'transparent' },
                index <= activeStep && index !== 0 && styles.progressLineActive
              ]} />
              <View style={[
                styles.progressLine,
                index === STEPS.length - 1 && { backgroundColor: 'transparent' },
                index < activeStep && styles.progressLineActive
              ]} />
            </View>
            <View style={[
              styles.progressDot,
              index <= activeStep && styles.progressDotActive
            ]} />
          </View>
        ))}
      </View>
    </View>
  );

  const OrderCard = ({ order, onRate, onRefund }) => {
    const statusColors = {
      preparing: '#f5a623',
      ongoing: '#e62e2e',
      delivered: '#2cb87e'
    };
    const statusKey = (order.status || '').toLowerCase();
    const statusColor = statusColors[statusKey] || '#888';

    // Get translated status
    const getTranslatedStatus = () => {
      const statusMap = {
        'placed': t('orders.status_placed', 'Placed'),
        'accepted': t('orders.status_accepted', 'Accepted'),
        'preparing': t('orders.status_preparing', 'Preparing food & searching for rider'),
        'ready': t('orders.status_ready', 'Ready'),
        'picked_up': t('orders.status_picked_up', 'Rider is on the way'),
        'out_for_delivery': t('orders.status_out_for_delivery', 'Rider is on the way'),
        'delivered': t('orders.status_delivered', 'Delivered'),
        'cancelled': t('orders.status_cancelled', 'Cancelled')
      };
      return statusMap[statusKey] || order.status;
    };

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => {
          if (order.restaurantData) {
            navigation.navigate('MainTabs', {
              screen: 'Home',
              params: {
                screen: 'RestaurantDetail',
                params: { restaurant: order.restaurantData }
              }
            });
          } else {
            navigation.navigate('MainTabs', { screen: 'Home' });
          }
        }}
        activeOpacity={0.9}
      >
        <View style={styles.cardInner}>
          {/* Restaurant header */}
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.restaurantName} numberOfLines={1}>
                {getLangText(order.restaurant)}
              </Text>
              <Text style={styles.restaurantCategory} numberOfLines={1}>
                {order.category}
              </Text>
            </View>
            <Text style={styles.chevronIcon}>▶</Text>
          </View>

          {/* Items row */}
          <View style={styles.itemsRow}>
            {order.items.slice(0, 2).map((item, index) => (
              <View key={index} style={styles.itemContainer}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {getLangText(item)}
                  </Text>
                  <Text style={styles.itemSub}>{t('orders.original', 'Original')}</Text>
                </View>
                <View style={[styles.foodImage, { backgroundColor: index === 0 ? '#f5e6cc' : '#f0e8d8' }]}>
                  <Text style={styles.foodEmoji}>🍔</Text>
                </View>
              </View>
            ))}
            {order.moreItems > 0 && (
              <Text style={styles.moreItems}>{t('orders.more_items', { count: order.moreItems })}</Text>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.dateText}>{t('orders.order_placed_on', 'Order placed on')} {order.date}</Text>
            <Text style={styles.timeText}>{order.time}</Text>
          </View>
          <Text style={styles.totalText}>{order.total}</Text>
        </View>

        {/* Status badge */}
        <Text style={[styles.statusText, { color: statusColor }]}>
          {getTranslatedStatus()}
        </Text>

        {/* Action buttons for delivered orders */}
        {statusKey === 'delivered' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rateButton]}
              onPress={() => onRate(order.id)}
            >
              <Text style={styles.actionButtonText}>{t('orders.rate_order', 'Rate Order')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.refundButton]}
              onPress={() => onRefund(order.id, order.total)}
            >
              <Text style={styles.actionButtonText}>{t('orders.refund', 'Refund')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action buttons for active orders (Chat) */}
        {['accepted', 'preparing', 'ready', 'picked_up', 'out_for_delivery'].includes(statusKey) && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.chatButton]}
              onPress={() => {
                navigation.navigate('ChatScreen', {
                  orderId: order.id,
                  receiverId: order.rider?.user?._id || order.restaurantData?._id,
                  receiverName: order.rider?.user?.name || getLangText(order.restaurant),
                });
              }}
            >
              <Text style={styles.actionButtonText}>{t('orders.chat', 'Chat')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const RatingModal = () => (
    <Modal
      visible={ratingModal.visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setRatingModal({ ...ratingModal, visible: false })}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t('orders.rate_experience', 'Rate your Experience')}</Text>

          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((num) => (
              <TouchableOpacity
                key={num}
                onPress={() => setRatingModal({ ...ratingModal, rating: num })}
              >
                <Text style={[
                  styles.starText,
                  num <= ratingModal.rating && styles.starActive
                ]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.commentInput}
            placeholder={t('orders.rating_placeholder', 'Tell us more about the food and delivery...')}
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={ratingModal.comment}
            onChangeText={(text) => setRatingModal({ ...ratingModal, comment: text })}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setRatingModal({ ...ratingModal, visible: false })}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel', 'Cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.submitButton]}
              onPress={submitRating}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? t('common.submitting', 'Submitting...') : t('common.submit', 'Submit Rating')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e62e2e" />
        <Text style={styles.loadingText}>{t('common.loading', 'Loading orders...')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Image
            source={require('../../assets/icons/Backarrow.png')}
            style={styles.backIconImage}
          />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('orders.my_orders', 'My Orders')}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.contentContainer}>
        {/* Map View takes background */}
        {showMap && (
          <MapView
            style={styles.fullMap}
            initialRegion={{
              latitude: latestOrder.rider?.currentLocation?.coordinates?.[1] || latestOrder.restaurantData?.location?.coordinates?.[1] || 52.5200,
              longitude: latestOrder.rider?.currentLocation?.coordinates?.[0] || latestOrder.restaurantData?.location?.coordinates?.[0] || 13.4050,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            {latestOrder.rider?.currentLocation?.coordinates && (
              <Marker
                coordinate={{
                  latitude: latestOrder.rider.currentLocation.coordinates[1],
                  longitude: latestOrder.rider.currentLocation.coordinates[0],
                }}
                title={t('orders.rider', 'Rider')}
                description={t('orders.rider_desc', 'Your delivery partner')}
              />
            )}
            {latestOrder.restaurantData?.location?.coordinates && (
              <Marker
                coordinate={{
                  latitude: latestOrder.restaurantData.location.coordinates[1],
                  longitude: latestOrder.restaurantData.location.coordinates[0],
                }}
                title={getLangText(latestOrder.restaurant)}
                description={t('orders.restaurant_desc', 'Restaurant location')}
                pinColor="green"
              />
            )}
          </MapView>
        )}

        {/* Floating Swiggy Card */}
        {formattedOrders.length > 0 ? (
          <View style={styles.floatingCard}>
            <View style={styles.cardStatusRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.swiggyStatusTitle}>
                  {latestOrder.status === 'picked_up' ? t('orders.rider_on_way', 'Partner is on the way') : t('orders.preparing', 'Preparing your order')}
                </Text>
                <Text style={styles.swiggyStatusSub}>
                  {latestOrder.status === 'picked_up' ? t('orders.rider_desc', 'Partner is on the way to your location') : t('orders.preparing_desc', 'Partner will be assigned when food is just about ready')}
                </Text>
              </View>
              <View style={styles.timeBox}>
                <Text style={styles.countdownText}>15</Text>
                <Text style={styles.countdownLabel}>mins</Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.cardActionsRow}>
              <View style={styles.pillActions}>
                <TouchableOpacity style={styles.pillActionBtn} onPress={handleCall}>
                  <Phone size={18} color="#666" />
                </TouchableOpacity>

                <View style={styles.verticalDivider} />

                <TouchableOpacity
                  style={styles.pillActionBtn}
                  onPress={() => {
                    navigation.navigate('ChatScreen', {
                      orderId: latestOrder.id,
                      receiverId: latestOrder.rider?.user?._id || latestOrder.restaurantData?._id,
                      receiverName: latestOrder.rider?.user?.name || getLangText(latestOrder.restaurant),
                    });
                  }}
                >
                  <MessageSquare size={18} color="#666" />
                </TouchableOpacity>

                <View style={styles.verticalDivider} />

                <View style={styles.pillActionBtn}>
                  {latestOrder.rider?.image ? (
                    <Image
                      source={{ uri: latestOrder.rider.image }}
                      style={styles.smallRiderAvatar}
                    />
                  ) : (
                    <Image
                      source={require('../../assets/icons/rider_avatar.jpg')}
                      style={styles.smallRiderAvatar}
                    />
                  )}
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyText}>{t('orders.no_orders', 'No orders found')}</Text>
          </View>
        )}
      </View>

      {/* Rating Modal */}
      <RatingModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
  fullMap: {
    ...StyleSheet.absoluteFillObject,
  },
  floatingCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cardStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  swiggyStatusTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
    marginBottom: 4,
  },
  swiggyStatusSub: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  timeBox: {
    backgroundColor: '#0F8A5F',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
    minWidth: 65,
  },
  countdownText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
  countdownLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginTop: -2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  pillActions: {
    flexDirection: 'row',
    backgroundColor: '#F6F6F6',
    borderRadius: 25,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  pillActionBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#E0E0E0',
  },
  smallRiderAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
  },
  mapContainer: {
    height: 300,
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginTop: 10,
  },
  backButton: {
    padding: 4,
  },
  backIconImage: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  headerSpacer: {
    width: 30,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  stepperContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stepColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  emojiText: {
    fontSize: 28,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 14,
  },
  linesContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
    borderWidth: 2.5,
    borderColor: '#e62e2e',
    zIndex: 1,
  },
  progressDotActive: {
    backgroundColor: '#e62e2e',
  },
  progressLine: {
    flex: 1,
    height: 2.5,
    backgroundColor: '#e62e2e',
    opacity: 0.15,
  },
  progressLineActive: {
    opacity: 1,
  },
  ordersContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  cardInner: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 3,
  },
  restaurantCategory: {
    fontSize: 12.5,
    color: '#888',
  },
  chevronIcon: {
    fontSize: 14,
    color: '#111',
  },
  itemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemInfo: {
    alignItems: 'flex-end',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111',
  },
  itemSub: {
    fontSize: 11.5,
    color: '#888',
  },
  foodImage: {
    width: 52,
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodEmoji: {
    fontSize: 28,
  },
  moreItems: {
    fontSize: 13,
    color: '#555',
    marginLeft: 'auto',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 13,
    color: '#444',
  },
  timeText: {
    fontSize: 13,
    color: '#444',
  },
  totalText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  rateButton: {
    backgroundColor: '#48c479',
  },
  refundButton: {
    backgroundColor: '#666',
  },
  chatButton: {
    backgroundColor: '#E41C26',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  reorderButton: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  reorderGradient: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  reorderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: width - 48,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  starText: {
    fontSize: 36,
    color: '#ddd',
  },
  starActive: {
    color: '#f5a623',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    fontSize: 14,
    fontFamily: 'System',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#e62e2e',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 60,
    color: '#ccc',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 12,
  },
});

export default OrderTracking;