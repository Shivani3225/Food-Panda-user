import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  Modal,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { CartContext } from '../context/CartContext';
import { placeOrder } from '../services/orderService';
import { toNumber } from '../services/cartPricing';
import { CART_ROUTES } from '../config/routes';
import apiClient from '../config/apiClient';
import { useStripe } from '@stripe/stripe-react-native';
import { API_BASE_URL as ENV_BASE_URL } from '@env';


import {
  addAddress,
  deleteAddress,
  getAddresses,
  updateAddress,
} from '../services/addressService';
import OrderConfirmedModal from '../components/OrderConfirmedModal';
import DeliveryPickupSheet from '../components/DeliveryPickupSheet';
import AddressSheet from '../components/AddressSheet';
import PaymentMethodSheet from '../components/PaymentMethodSheet';
import { hp } from '../utils/responsive';
import { scale } from '../utils/scale';
import { FONT_SIZES } from '../theme/typography';
import { SPACING } from '../theme/spacing';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = (ENV_BASE_URL.endsWith('/') ? ENV_BASE_URL.slice(0, -1) : ENV_BASE_URL) + (ENV_BASE_URL.includes('/api') ? '' : '/api');


export default function ReviewOrderScreen() {
  const { t } = useTranslation();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const navigation = useNavigation();
  const route = useRoute();
  const { appliedCoupon: navCoupon, discount: navDiscount } = route.params || {};
  const {
    cart,
    totals,
    addOrder,
    checkout,
    setCheckout,
    address,
    setAddress,
    paymentMethod,
    setPaymentMethod,
    fetchCart,
  } = useContext(CartContext);

  const [activeSheet, setActiveSheet] = useState(null);
  const [deliveryNextStep, setDeliveryNextStep] = useState(null);
  const [sheetBackTarget, setSheetBackTarget] = useState({
    address: null,
    payment: null,
  });

  const [showModal, setShowModal] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [orderStatus, setOrderStatus] = useState('success');
  const [orderErrorMessage, setOrderErrorMessage] = useState('');

  const [leaveAtDoor, setLeaveAtDoor] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);
  const [tipLoading, setTipLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isProcessingStripe, setIsProcessingStripe] = useState(false);
  const { user, currencySymbol, currencyCode } = useAuth();

  const placeOrderTimerRef = useRef(null);

  const latestCartRef = useRef(cart);
  latestCartRef.current = cart;

  const latestCheckoutRef = useRef(checkout);
  latestCheckoutRef.current = checkout;

  const latestAddressRef = useRef(address);
  latestAddressRef.current = address;

  const latestPaymentMethodRef = useRef(paymentMethod);
  latestPaymentMethodRef.current = paymentMethod;

  const isAnySheetVisible = activeSheet !== null;
  const [addresses, setAddresses] = useState([]);

  const summary = useMemo(() => {
    const subtotal = toNumber(totals?.subtotal, 0);
    const deliveryFee = toNumber(totals?.delivery, 0);
    const tax = toNumber(totals?.tax, 0);
    const platformFee = toNumber(totals?.platformFee, 0);
    const packaging = toNumber(totals?.packaging, 0);
    const smallCartFee = toNumber(totals?.smallCartFee, 0);
    const discount = navDiscount ?? toNumber(totals?.discount, 0);
    const totalBeforeTip = subtotal + deliveryFee + tax + platformFee + packaging + smallCartFee - discount;
    const grandTotal = Math.max(0, totalBeforeTip + tipAmount);
    
    return {
      subtotal,
      delivery: deliveryFee,
      tax,
      serviceFee: platformFee,
      packaging,
      smallCartFee,
      discount,
      tip: tipAmount,
      totalBeforeTip,
      grandTotal,
    };
  }, [totals, tipAmount]);

  useEffect(() => {
    return () => {
      if (placeOrderTimerRef.current) {
        clearTimeout(placeOrderTimerRef.current);
        placeOrderTimerRef.current = null;
      }
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const unsubscribe = navigation.addListener('beforeRemove', e => {
        if (!showModal && !isAnySheetVisible && !isPlacing && !isProcessingStripe) return;
        e.preventDefault();
      });
      return unsubscribe;
    }, [navigation, showModal, isAnySheetVisible, isPlacing, isProcessingStripe]),
  );

  const normalizeAddress = useCallback(addr => {
    if (!addr) return null;
    return {
      id: addr._id || addr.id,
      label: addr.label,
      addressLine: addr.addressLine,
      city: addr.city,
      zipCode: addr.zipCode,
      location: addr.location,
      deliveryInstructions: addr.deliveryInstructions,
      isDefault: !!addr.isDefault,
    };
  }, []);

  const applyAddressList = useCallback(
    data => {
      const list = (data?.addresses || [])
        .map(normalizeAddress)
        .filter(Boolean);
      setAddresses(list);

      if (!address?.id && list.length > 0) {
        const defaultAddr = list.find(a => a.isDefault) || list[0];
        if (defaultAddr) setAddress(defaultAddr);
      }
      return list;
    },
    [address?.id, normalizeAddress, setAddress],
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const loadAddresses = async () => {
        try {
          const response = await getAddresses();
          if (active) applyAddressList(response);
        } catch (error) {
          console.error('Address fetch failed:', error?.message);
        }
      };
      loadAddresses();
      return () => {
        active = false;
      };
    }, [applyAddressList]),
  );

  const handleUpdateTip = useCallback(async (newTipAmount) => {
    setTipLoading(true);
    try {
      const response = await apiClient.put(CART_ROUTES.updateMeta, {
        tip: newTipAmount,
      });
      
      if (response?.data?.bill) {
        setTipAmount(response.data.bill.tip ?? newTipAmount);
      } else {
        setTipAmount(newTipAmount);
      }
    } catch (error) {
      console.error('Failed to update tip:', error?.message);
      setTipAmount(newTipAmount);
    } finally {
      setTipLoading(false);
    }
  }, []);

  const deleteOrder = async (orderId) => {
    try {
      const authToken = await AsyncStorage.getItem('auth_token');
      await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        }
      });
      console.log('Order deleted due to payment failure');
    } catch (error) {
      console.error('Failed to delete order:', error);
    }
  };

  const handleFinalizeOrder = async (finalPaymentMethod, stripePaymentIntentId = null) => {
    if (isPlacing || !latestCartRef.current?.length) return;
    setIsPlacing(true);

    const checkoutSnapshot = latestCheckoutRef.current;
    const addressSnapshot = latestAddressRef.current;
    const paymentSnapshot = finalPaymentMethod ?? latestPaymentMethodRef.current;

    const paymentCode = paymentSnapshot?.id || 'cod';
    
    const restaurantId = latestCartRef.current[0]?.restaurantId || latestCartRef.current[0]?.restaurant?._id;
    
    const formattedItems = latestCartRef.current.map(item => ({
      productId: item.productId || item._id,
      quantity: item.quantity,
      price: item.price,
      name: item.name
    }));
    
    const orderPayload = {
      restaurantId: restaurantId,
      items: formattedItems,
      addressId: addressSnapshot?.id,
      paymentMethod: paymentCode === 'stripe' ? 'online' : paymentCode,
      totalAmount: summary.grandTotal,
      tipAmount: tipAmount,
      discount: summary.discount,
      couponId: navCoupon?.id,
      currency: currencyCode,
      currencySymbol: currencySymbol,
      ...(stripePaymentIntentId && { paymentIntentId: stripePaymentIntentId }),
    };

    try {
      const response = await placeOrder(orderPayload);
      const apiOrder = response?.order || response?.data?.order || null;
      
      if (!apiOrder?._id) {
        throw new Error('Invalid order response from server');
      }
      
      const newOrderId = apiOrder._id;
      const cartRestaurant = latestCartRef.current[0]?.restaurant;
      const cartRestaurantName = latestCartRef.current[0]?.restaurantName || latestCartRef.current[0]?.restaurant?.name;

      addOrder({
        ...apiOrder,
        id: apiOrder._id,
        restaurant: apiOrder.restaurant || cartRestaurant,
        restaurantName: apiOrder.restaurantName || cartRestaurantName,
        totals: summary,
        checkout: checkoutSnapshot,
        address: addressSnapshot,
        paymentMethod: paymentSnapshot,
        leaveAtDoor,
      });
      
      await fetchCart();
      setOrderId(newOrderId);
      setOrderStatus('success');
      setOrderErrorMessage('');
      setShowModal(true);
    } catch (error) {
      let errorTitle = 'Order Failed';
      let errorMsg = t('review_order.placement_failed', 'Unable to place your order.');

      const errType = error?.response?.data?.type || error?.responseData?.type;
      const errReason = error?.response?.data?.reason || error?.responseData?.reason;
      const errMessage = error?.response?.data?.message || error?.responseData?.message;

      if (errType === 'restaurant_unavailable') {
        errorTitle = 'Restaurant Unavailable';
        errorMsg = errReason || 'Restaurant is currently closed.';
      } else if (errMessage) {
        errorMsg = errMessage;
      }
      
      Alert.alert(errorTitle, errorMsg);
      setOrderStatus('failed');
      setOrderErrorMessage(errorMsg);
      setOrderId('');
      setShowModal(true);
    } finally {
      setIsPlacing(false);
    }
  };

 const handleStripePayment = async () => {
  setIsProcessingStripe(true);
  
  try {
    const authToken = await AsyncStorage.getItem('auth_token');
    
    if (!authToken) {
      throw new Error('Authentication token not found.');
    }
    
    const addressSnapshot = latestAddressRef.current;
    
    if (!addressSnapshot?.id) {
      throw new Error('Please select a delivery address');
    }
    
    const restaurantId = latestCartRef.current[0]?.restaurantId || latestCartRef.current[0]?.restaurant?._id;
    
    if (!restaurantId) {
      throw new Error('Restaurant information not found.');
    }
    
    const formattedItems = latestCartRef.current.map(item => ({
      productId: item.productId || item._id,
      quantity: item.quantity,
      price: item.price,
      name: item.name
    }));
    
    const orderPayload = {
      restaurantId: restaurantId,
      items: formattedItems,
      addressId: addressSnapshot.id,
      paymentMethod: 'online',
      totalAmount: summary.grandTotal,
      tipAmount: tipAmount,
      discount: summary.discount,
      couponId: navCoupon?.id,
      orderStatus: 'pending_payment',
      currency: currencyCode,
      currencySymbol: currencySymbol,
    };
    
    const orderResponse = await placeOrder(orderPayload);
    const apiOrder = orderResponse?.order || orderResponse?.data?.order;
    
    if (!apiOrder?._id) {
      throw new Error('Invalid order response');
    }
    
    const newOrderId = apiOrder._id;
    
    // ✅ FIX: Use dynamic currency based on user location
    const currency = currencyCode?.toLowerCase() || 'eur';
    
    const paymentResponse = await fetch(`${API_BASE_URL}/payment/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        orderId: newOrderId,
        amount: Math.round(summary.grandTotal * 100),
        currency: currency, // ✅ Now sending 'eur'
      })
    });

    const paymentData = await paymentResponse.json();

    const secret = paymentData.clientSecret || paymentData.client_secret;
    const pKey = paymentData.publishableKey;

    console.log('[Stripe] Debugging Mismatch Error:', {
      check_this_key_in_App_jsx: pKey,
      secret_received: secret?.substring(0, 25) + '...',
      stripeAccountId: paymentData.stripeAccountId || 'None (Platform)'
    });

    if (!paymentResponse.ok) {
      console.error('[Stripe] Payment intent error:', paymentData);
      await deleteOrder(newOrderId);
      
      // ✅ Better error message for API key issues
      if (paymentData.error === 'Invalid API Key Provided') {
        throw new Error('Stripe configuration error. Please contact support.');
      }
      throw new Error(paymentData.message || 'Payment initialization failed');
    }

    if (!paymentData.clientSecret) {
      await deleteOrder(newOrderId);
      throw new Error('Invalid response from server');
    }

    // Extract PaymentIntent ID from the secret (part before _secret_)
    const extractedIntentId = secret.split('_secret_')[0];
    console.log('[Stripe] Extracted Intent ID:', extractedIntentId);

    const { error: initError } = await initPaymentSheet({
      paymentIntentClientSecret: secret,
      merchantDisplayName: 'Food Delivery',
      merchantCountryCode: (user?.countryCode || 'DE').toUpperCase(),
      stripeAccountId: paymentData.stripeAccountId || undefined,
      defaultBillingDetails: {
        name: user?.name || 'Customer',
        email: user?.email || '',
      },
    });

    if (initError) {
      await deleteOrder(newOrderId);
      throw new Error(initError.message || 'Failed to initialize payment');
    }

    const { error: presentError } = await presentPaymentSheet();

    if (presentError) {
      await deleteOrder(newOrderId);
      if (presentError.code === 'Canceled') {
        return;
      }
      throw new Error(presentError.message || 'Payment failed');
    }

    const updatePayload = {
      orderId: newOrderId,
      paymentIntentId: paymentData.paymentIntentId || paymentData.paymentIntent || extractedIntentId,
      paymentStatus: 'paid',
      orderStatus: 'confirmed'
    };
    
    try {
      await fetch(`${API_BASE_URL}/orders/update-payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(updatePayload)
      });
    } catch (updateError) {
      console.warn('Order update error:', updateError);
    }
    
    const cartRestaurant = latestCartRef.current[0]?.restaurant;
    const cartRestaurantName = latestCartRef.current[0]?.restaurantName || latestCartRef.current[0]?.restaurant?.name;

    addOrder({
      ...apiOrder,
      id: apiOrder._id,
      restaurant: apiOrder.restaurant || cartRestaurant,
      restaurantName: apiOrder.restaurantName || cartRestaurantName,
      totals: summary,
      checkout: latestCheckoutRef.current,
      address: addressSnapshot,
      paymentMethod: { id: 'stripe', label: 'Credit/Debit Card' },
      leaveAtDoor,
      paymentStatus: 'paid'
    });
    
    await fetchCart();
    setOrderId(newOrderId);
    setOrderStatus('success');
    setOrderErrorMessage('');
    setShowModal(true);
    
  } catch (error) {
    console.error('[Stripe] Payment error:', error);
    
    const errType = error?.response?.data?.type || error?.responseData?.type;
    const errReason = error?.response?.data?.reason || error?.responseData?.reason;

    if (errType === 'restaurant_unavailable') {
      Alert.alert(
        'Restaurant Unavailable',
        errReason || 'Restaurant is currently closed.',
      );
    } else {
      Alert.alert('Payment Failed', error?.message || 'Please try again');
    }
  } finally {
    setIsProcessingStripe(false);
  }
};
  const [isProcessingUpi, setIsProcessingUpi] = useState(false);
  const [upiTimer, setUpiTimer] = useState(60);

  const handleUpiPayment = async () => {
    setIsProcessingUpi(true);
    setUpiTimer(60);

    try {
      const authToken = await AsyncStorage.getItem('auth_token');
      if (!authToken) throw new Error('Authentication token not found.');

      const addressSnapshot = latestAddressRef.current;
      if (!addressSnapshot?.id) throw new Error('Please select a delivery address');

      const restaurantId = latestCartRef.current[0]?.restaurantId || latestCartRef.current[0]?.restaurant?._id;
      if (!restaurantId) throw new Error('Restaurant information not found.');

      // Create order first with pending_payment status
      const orderPayload = {
        restaurantId,
        items: latestCartRef.current.map(item => ({
          productId: item.productId || item._id,
          quantity: item.quantity,
          price: item.price,
          name: item.name
        })),
        addressId: addressSnapshot.id,
        paymentMethod: 'upi',
        totalAmount: summary.grandTotal,
        tipAmount,
        discount: summary.discount,
        couponId: navCoupon?.id,
        orderStatus: 'pending_payment',
        currency: currencyCode,
        currencySymbol,
      };

      const orderResponse = await placeOrder(orderPayload);
      const apiOrder = orderResponse?.order || orderResponse?.data?.order;
      if (!apiOrder?._id) throw new Error('Invalid order response');

      const newOrderId = apiOrder._id;
      setOrderId(newOrderId);

      // Open UPI App
      const vpa = 'foodpanda@upi'; // Placeholder VPA
      const payeeName = 'Food Panda';
      const amount = summary.grandTotal.toFixed(2);
      const upiUrl = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent('Order ' + newOrderId)}`;

      const canOpen = await Linking.canOpenURL(upiUrl);
      if (canOpen) {
        await Linking.openURL(upiUrl);
      } else {
        // If no UPI app, we still show the timer but maybe alert the user
        Alert.alert(t('payment.no_upi_app', 'No UPI App Found'), t('payment.install_upi', 'Please install a UPI app to complete payment.'));
      }

      // Start timer
      const interval = setInterval(() => {
        setUpiTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // In a real app, we would poll the backend here or wait for a socket
      // For this demo, we'll provide a "Verify Payment" button in the modal
      
    } catch (error) {
      console.error('UPI Payment Error:', error);
      Alert.alert('Payment Failed', error?.message || 'Please try again');
      setIsProcessingUpi(false);
    }
  };

  const handleVerifyUpiPayment = async () => {
    // Simulate verification
    setIsPlacing(true);
    try {
      // In real app: const response = await apiClient.get(`/orders/${orderId}/verify-payment`);
      // For now, simulate success
      setTimeout(async () => {
        const cartRestaurant = latestCartRef.current[0]?.restaurant;
        const cartRestaurantName = latestCartRef.current[0]?.restaurantName || latestCartRef.current[0]?.restaurant?.name;

        addOrder({
          id: orderId,
          restaurant: cartRestaurant,
          restaurantName: cartRestaurantName,
          totals: summary,
          checkout: latestCheckoutRef.current,
          address: latestAddressRef.current,
          paymentMethod: { id: 'upi', label: 'UPI' },
          leaveAtDoor,
          paymentStatus: 'paid'
        });

        await fetchCart();
        setOrderStatus('success');
        setOrderErrorMessage('');
        setIsProcessingUpi(false);
        setIsPlacing(false);
        setShowModal(true);
      }, 1500);
    } catch (error) {
      setIsPlacing(false);
      Alert.alert('Verification Failed', 'Payment not yet received. Please try again in a moment.');
    }
  };

  const handlePlaceOrderPress = () => {
    if (isPlacing || isProcessingStripe || isProcessingUpi || !latestCartRef.current?.length) return;

    const newErrors = {};
    let isValid = true;

    if (!latestCheckoutRef.current?.type) {
      newErrors.checkout = t('review_order.delivery_type_required', 'Please select delivery type');
      isValid = false;
    }

    if (!latestAddressRef.current?.id) {
      newErrors.address = t('review_order.address_required', 'Please select a delivery address');
      isValid = false;
    }

    if (!latestPaymentMethodRef.current?.id) {
      newErrors.payment = t('review_order.payment_required', 'Please select a payment method');
      isValid = false;
    }

    setErrors(newErrors);

    if (!isValid) return;

    if (latestPaymentMethodRef.current?.id === 'stripe') {
      handleStripePayment();
    } else if (latestPaymentMethodRef.current?.id === 'upi') {
      handleUpiPayment();
    } else {
      handleFinalizeOrder(latestPaymentMethodRef.current);
    }
  };

  const addressOptions = useMemo(() => addresses, [addresses]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
          <Image source={require('../assets/icons/Backarrow.png')} style={styles.backIcon} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('review_order.cart', 'Cart')}</Text>
        <View style={styles.headerRightSpace} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Address Section */}
        <View style={styles.sectionCard}>
          <Pressable
            style={styles.sectionTitleRow}
            onPress={() => {
              setSheetBackTarget({ address: null, payment: null });
              setActiveSheet('address');
            }}
          >
            <Text style={styles.sectionTitle}>{t('review_order.delivering_address', 'Delivering Address')}</Text>
            <ChevronRight size={18} color="#999" />
          </Pressable>

          <Pressable
            style={styles.addressRow}
            onPress={() => {
              setSheetBackTarget({ address: null, payment: null });
              setActiveSheet('address');
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.addressLabel}>
                {address?.label || t('review_order.select_address', 'Select address')}
              </Text>
              <Text style={styles.addressLine} numberOfLines={2}>
                {address?.addressLine || t('review_order.no_address', 'No address selected')}
              </Text>
            </View>
          </Pressable>

          <View style={styles.leaveRow}>
            <Text style={styles.leaveText}>{t('review_order.leave_at_door', 'Leave at the door')}</Text>
            <Switch
              value={leaveAtDoor}
              onValueChange={setLeaveAtDoor}
              trackColor={{ false: '#D9D9D9', true: '#D9D9D9' }}
              thumbColor={leaveAtDoor ? '#111' : '#FFF'}
            />
          </View>
          {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
        </View>

        {/* Tip Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('review_order.tip_rider', 'Tip your rider')}</Text>
          <Text style={styles.tipSub}>
            {t('review_order.tip_message', '100% of the tips go to your rider')}
          </Text>
          <View style={styles.tipRow}>
            {[0, 5, 10, 20].map(v => {
              const selected = tipAmount === v;
              const label = v === 0 ? t('review_order.not_now', 'Not Now') : `${currencySymbol}${v}.00`;
              return (
                <Pressable
                  key={String(v)}
                  onPress={() => handleUpdateTip(v)}
                  disabled={tipLoading}
                  style={[styles.tipChip, selected && styles.tipChipActive]}
                >
                  {tipLoading && selected ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={[styles.tipChipText, selected && styles.tipChipTextActive]}>
                      {label}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Payment Method Section - Shows selected method */}
        <View style={styles.sectionCard}>
          <Pressable
            style={styles.sectionTitleRow}
            onPress={() => {
              setSheetBackTarget({ address: null, payment: null });
              setActiveSheet('payment');
            }}
          >
            <Text style={styles.sectionTitle}>{t('review_order.payment_method', 'Payment Method')}</Text>
            <ChevronRight size={18} color="#999" />
          </Pressable>
          <Pressable
            style={styles.paymentRow}
            onPress={() => {
              setSheetBackTarget({ address: null, payment: null });
              setActiveSheet('payment');
            }}
          >
            {paymentMethod?.id ? (
              <View style={styles.paymentSelectedRow}>
                <View style={styles.paymentDot} />
                <Text style={styles.paymentValueSelected}>
                  {paymentMethod.label}
                </Text>
              </View>
            ) : (
              <Text style={styles.paymentValuePlaceholder}>
                {t('review_order.select_payment', 'Select payment method')}
              </Text>
            )}
          </Pressable>
          {errors.payment && <Text style={styles.errorText}>{errors.payment}</Text>}
        </View>

        {/* Bill Details Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('review_order.bill_details', 'Bill Details')}</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>{t('review_order.subtotal', 'Subtotal')}</Text>
            <Text style={styles.billValue}>{currencySymbol}{summary.subtotal.toFixed(2)}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>{t('review_order.delivery_fee', 'Delivery Fee')}</Text>
            <Text style={summary.delivery > 0 ? styles.billValue : styles.billFree}>
              {summary.delivery > 0 ? `${currencySymbol}${summary.delivery.toFixed(2)}` : t('review_order.free', 'Free')}
            </Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>{t('review_order.tax', 'Tax')}</Text>
            <Text style={styles.billValue}>{currencySymbol}{summary.tax.toFixed(2)}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>{t('review_order.packaging', 'Packaging')}</Text>
            <Text style={styles.billValue}>{currencySymbol}{summary.packaging.toFixed(2)}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>{t('review_order.service_fee', 'Service Fee')}</Text>
            <Text style={styles.billValue}>{currencySymbol}{summary.serviceFee.toFixed(2)}</Text>
          </View>

          {summary.smallCartFee > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>{t('review_order.small_cart_fee', 'Small Cart Fee')}</Text>
              <Text style={styles.billValue}>{currencySymbol}{summary.smallCartFee.toFixed(2)}</Text>
            </View>
          )}

          {summary.discount > 0 && (
            <View style={styles.billRow}>
              <View>
                <Text style={styles.offerMainLabel}>{t('review_order.offer_applied', 'Offer Applied')}</Text>
                <Text style={styles.offerRedLabel}>{navCoupon?.id || 'Discount Applied'}</Text>
              </View>
              <Text style={styles.offerValueText}>-{currencySymbol}{summary.discount.toFixed(2)}</Text>
            </View>
          )}

          <View style={styles.dashedLine} />

          {/* <View style={[styles.billRow, styles.billRowStrong]}>
            <Text style={styles.billStrong}>{t('review_order.total_before_tip', 'Total Before Tip')}</Text>
            <Text style={styles.billStrong}>{currencySymbol}{summary.totalBeforeTip.toFixed(2)}</Text>
          </View> */}

          {summary.tip > 0 && (
            <View style={[styles.billRow, styles.tipRowHighlight]}>
              <Text style={styles.tipLabel}>{t('review_order.tip_for_rider', 'Tip for Rider')}</Text>
              <Text style={styles.tipValue}>{currencySymbol}{summary.tip.toFixed(2)}</Text>
            </View>
          )}

          <View style={[styles.billRow, styles.billRowFinal]}>
            <Text style={styles.billFinal}>{t('review_order.grand_total', 'Grand Total')}</Text>
            <Text style={styles.billFinal}>{currencySymbol}{summary.grandTotal.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.termsText}>
          {t('review_order.agree_terms', 'By completing this order, I agree to all')}{' '}
          <Text style={styles.termsLink}>{t('review_order.terms_condition', 'terms & condition')}</Text>
        </Text>
        <View style={{ height: 140 }} />
      </ScrollView>

      <SafeAreaView style={styles.bottomBar} edges={[]}>
        <View style={styles.bottomLeft}>
          <Text style={styles.bottomTotal}>{currencySymbol}{summary.grandTotal.toFixed(2)}</Text>
          <Text style={styles.bottomSub}>{t('review_order.total_price', 'Total Price')}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.placeOrderBtn, pressed && styles.placeOrderPressed]}
          onPress={handlePlaceOrderPress}
          disabled={isPlacing || isProcessingStripe}
        >
          {(isPlacing || isProcessingStripe) ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.placeOrderText}>{t('review_order.place_order', 'Place Order')}</Text>
          )}
        </Pressable>
      </SafeAreaView>

      <DeliveryPickupSheet
        visible={activeSheet === 'delivery'}
        initialType={checkout?.type || 'delivery'}
        initialDate={checkout?.date || null}
        initialTime={checkout?.time || null}
        onClose={() => {
          setActiveSheet(null);
          setDeliveryNextStep(null);
        }}
        onAdd={payload => {
          setCheckout(payload);
          if (deliveryNextStep === 'address') {
            setSheetBackTarget({ address: 'delivery', payment: 'address' });
            setActiveSheet('address');
          } else {
            setActiveSheet(null);
          }
          setDeliveryNextStep(null);
        }}
      />

      <AddressSheet
        visible={activeSheet === 'address'}
        addresses={addressOptions}
        selectedAddressId={address?.id || null}
        onSelect={addr => {
          setAddress(addr);
          setErrors(prev => {
            const { address, ...rest } = prev;
            return rest;
          });
        }}
        onApply={addr => {
          setAddress(addr);
          setErrors(prev => {
            const { address, ...rest } = prev;
            return rest;
          });
          setActiveSheet(null);
        }}
        onAddAddress={async payload => {
          const response = await addAddress(payload);
          return applyAddressList(response);
        }}
        onUpdateAddress={async (id, payload) => {
          const response = await updateAddress(id, payload);
          return applyAddressList(response);
        }}
        onDeleteAddress={async id => {
          const response = await deleteAddress(id);
          return applyAddressList(response);
        }}
        onClose={() => setActiveSheet(sheetBackTarget.address ? sheetBackTarget.address : null)}
      />
   
      <PaymentMethodSheet
        visible={activeSheet === 'payment'}
        selectedId={paymentMethod?.id || null}
        onClose={() => setActiveSheet(sheetBackTarget.payment ? sheetBackTarget.payment : null)}
        onApply={(method) => {
          setPaymentMethod(method);
          setErrors(prev => {
            const { payment, ...rest } = prev;
            return rest;
          });
          setActiveSheet(null);
        }}
        onStripePayment={handleStripePayment}
        isProcessingStripe={isProcessingStripe || isProcessingUpi}
      />

      {/* UPI Processing Modal */}
      <Modal visible={isProcessingUpi} transparent animationType="fade">
        <View style={styles.upiModalOverlay}>
          <View style={styles.upiModalContent}>
            <Text style={styles.upiModalTitle}>{t('payment.processing_upi', 'UPI Payment Processing')}</Text>
            <View style={styles.upiTimerContainer}>
              <Text style={styles.upiTimerText}>{upiTimer}s</Text>
            </View>
            <Text style={styles.upiModalMessage}>
              {t('payment.upi_instruction', 'Please complete the payment in your UPI app. Do not close this screen.')}
            </Text>
            <ActivityIndicator size="large" color="#FF3D3D" style={{ marginVertical: 20 }} />
            
            <TouchableOpacity 
              style={[styles.upiVerifyBtn, isPlacing && { opacity: 0.7 }]} 
              onPress={handleVerifyUpiPayment}
              disabled={isPlacing}
            >
              {isPlacing ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.upiVerifyBtnText}>{t('payment.verify_payment', 'I have Paid')}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.upiCancelBtn} 
              onPress={() => setIsProcessingUpi(false)}
            >
              <Text style={styles.upiCancelBtnText}>{t('common.cancel', 'Cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <OrderConfirmedModal
        visible={showModal}
        orderId={orderId}
        status={orderStatus}
        errorMessage={orderErrorMessage}
        onViewDetails={() => {
          setShowModal(false);
          if (orderStatus === 'success') {
            navigation.navigate('OrderDetailsScreen', { orderId, fromScreen: 'ReviewOrder' });
          }
        }}
        onExploreMenu={() => {
          setShowModal(false);
          setTimeout(() => {
            if (orderStatus === 'success') {
              navigation.popToTop();
            } else {
              navigation.goBack();
            }
          }, 100);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    height: hp(7),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backBtn: { width: scale(32), height: scale(32), alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: FONT_SIZES.md, fontWeight: '700', color: '#111' },
  headerRightSpace: { width: scale(32) },
  backIcon: {
    width: scale(22),
    height: scale(22),
    resizeMode: 'contain',
  },
  scroll: { paddingBottom: hp(18) },
  sectionCard: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: '#EFEFEF', backgroundColor: '#FFF' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: '#111' },
  addressRow: { marginTop: SPACING.sm },
  addressLabel: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: '#111' },
  addressLine: { marginTop: scale(4), fontSize: FONT_SIZES.xs, fontWeight: '500', color: '#666', lineHeight: scale(16) },
  leaveRow: { marginTop: SPACING.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leaveText: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: '#111' },
  tipSub: { marginTop: SPACING.xs, fontSize: FONT_SIZES.xs, fontWeight: '500', color: '#777', lineHeight: scale(16) },
  tipRow: { marginTop: SPACING.sm, flexDirection: 'row', gap: SPACING.xs, flexWrap: 'wrap' },
  tipChip: { height: scale(34), paddingHorizontal: scale(14), borderRadius: scale(17), borderWidth: 1, borderColor: '#E5E5E5', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  tipChipActive: { backgroundColor: '#FF3D3D', borderColor: '#FF3D3D' },
  tipChipText: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: '#111' },
  tipChipTextActive: { color: '#FFF' },
  paymentRow: { marginTop: SPACING.sm },
  paymentSelectedRow: { flexDirection: 'row', alignItems: 'center' },
  paymentDot: { width: scale(8), height: scale(8), borderRadius: scale(4), backgroundColor: '#FF3D3D', marginRight: scale(8) },
  paymentValueSelected: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: '#111' },
  paymentValuePlaceholder: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: '#999' },
  billRow: { marginTop: SPACING.sm, flexDirection: 'row', justifyContent: 'space-between' },
  billLabel: { fontSize: FONT_SIZES.xs, fontWeight: '600', color: '#555' },
  billValue: { fontSize: FONT_SIZES.xs, fontWeight: '600', color: '#111' },
  billFree: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: '#E53935' },
  offerMainLabel: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: '#111' },
  offerRedLabel: { marginTop: scale(2), fontSize: scale(11), fontWeight: '700', color: '#FF3D3D' },
  offerValueText: { fontSize: FONT_SIZES.xs, fontWeight: '800', color: '#111' },
  dashedLine: { 
    marginTop: SPACING.md, 
    borderTopWidth: 1, 
    borderStyle: 'dashed', 
    borderColor: '#CCC',
  },
  billRowStrong: { marginTop: SPACING.md },
  billStrong: { fontSize: FONT_SIZES.sm, fontWeight: '800', color: '#111' },
  tipRowHighlight: { marginTop: SPACING.sm, paddingVertical: scale(8), paddingHorizontal: scale(10), backgroundColor: '#FFF5F5', borderRadius: scale(8), borderLeftWidth: scale(3), borderLeftColor: '#FF3D3D' },
  tipLabel: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: '#FF3D3D' },
  tipValue: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: '#FF3D3D' },
  billRowFinal: { marginTop: SPACING.md, paddingVertical: scale(8), paddingHorizontal: SPACING.sm, backgroundColor: '#111', borderRadius: scale(8) },
  billFinal: { fontSize: FONT_SIZES.sm, fontWeight: '800', color: '#FFF' },
  termsText: { marginTop: SPACING.md, paddingHorizontal: SPACING.lg, fontSize: FONT_SIZES.xs, fontWeight: '500', color: '#666', lineHeight: scale(16) },
  termsLink: { color: '#FF3D3D', fontWeight: '700', textDecorationLine: 'underline' },
  upiModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  upiModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  upiModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
    marginBottom: 16,
  },
  upiTimerContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FF3D3D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  upiTimerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF3D3D',
  },
  upiModalMessage: {
    textAlign: 'center',
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  upiVerifyBtn: {
    backgroundColor: '#FF3D3D',
    width: '100%',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  upiVerifyBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  upiCancelBtn: {
    padding: 12,
  },
  upiCancelBtnText: {
    color: '#999',
    fontWeight: '600',
  },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: SPACING.sm, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EEE' },
  bottomLeft: {},
  bottomTotal: { fontSize: FONT_SIZES.md, fontWeight: '800', color: '#111' },
  bottomSub: { marginTop: scale(2), fontSize: FONT_SIZES.xs, fontWeight: '500', color: '#777' },
  placeOrderBtn: { flex: 1, height: scale(48), borderRadius: scale(12), backgroundColor: '#FF3D3D', alignItems: 'center', justifyContent: 'center' },
  placeOrderText: { fontSize: FONT_SIZES.sm, fontWeight: '800', color: '#FFF' },
  placeOrderPressed: { opacity: 0.9 },
  submitErrorContainer: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xs, backgroundColor: '#FFF' },
  submitErrorText: { fontSize: FONT_SIZES.xs, fontWeight: '600', color: '#FF3D3D', textAlign: 'center' },
  errorText: { marginTop: SPACING.xs, fontSize: FONT_SIZES.xs, fontWeight: '600', color: '#FF3D3D' },
});