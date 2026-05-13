import React, { createContext, useCallback, useMemo, useState, useEffect } from 'react';
import Toast from 'react-native-toast-message';
import { useAuth } from './AuthContext';
import { useRef } from 'react';

import { ConflictModal } from '../components/ConflictModal';
import {
  buildCartLineId,
  calculateCartLineTotals,
  calculateCartTotals,
  toNumber,
} from '../services/cartPricing';
import {
  getCart,
  addItemToCart,
  removeItemFromCart,
  updateItemQuantity,
} from '../services/cartService';
import { getOrders as fetchOrdersFromAPI } from '../services/orderService';
import { onSocketEvent } from '../services/realtime/socketClient';

export const CartContext = createContext({});

function normalizeLegacyItemToCartLine(raw) {
  if (!raw) return null;

 
  const quantity = toNumber(raw.quantity ?? raw.qty ?? 1, 1);

  const basePrice = toNumber(raw.basePrice ?? raw.price ?? 0, 0);
  const selectedFlavor = raw.selectedFlavor ?? null;
  const addOns = raw.addOns ?? raw.frequentlyBoughtTogether ?? [];

  const menuItemId = raw.menuItemId ?? raw.itemId ?? raw.id;
  const restaurantId = raw.restaurantId ?? raw.restaurant?.id ?? null;

  const id =
    raw.cartLineId ||
    raw.id ||
    buildCartLineId({
      restaurantId,
      menuItemId,
      selectedFlavorId: selectedFlavor?.id ?? null,
      addOnIds: Array.isArray(addOns) ? addOns.map(a => a?.id) : [],
    });

  const { unitTotal, totalPrice } = calculateCartLineTotals({
    basePrice,
    selectedFlavor,
    addOns,
    quantity,
  });

  return {
    id,
    menuItemId,
    name: raw.name,
    image: raw.image,
    basePrice,
    price: basePrice,
    selectedFlavor,
    addOns,
    quantity,
    qty: quantity,
    unitTotal,
    totalPrice,

    restaurantId,
    restaurantName: raw.restaurantName ?? raw.restaurant?.name,
    restaurant: raw.restaurant,
  };
}

export const CartProvider = ({ children }) => {
  const { isAuthenticated, isInitialized, realtimeReady } = useAuth();
  const [cart, setCart] = useState([]);
  const [backendCart, setBackendCart] = useState(null);
  const [bill, setBill] = useState(null);
  const [orders, setOrders] = useState([]);
  const [checkout, setCheckout] = useState({
    type: 'delivery',
    date: null,
    time: null,
  });
  const [address, setAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking'); 
  
 
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictData, setConflictData] = useState(null);
  const [pendingConflictPayload, setPendingConflictPayload] = useState(null);
  const [conflictModalLoading, setConflictModalLoading] = useState(false);
  const [freshCartResolvedAt, setFreshCartResolvedAt] = useState(0);


  const quantityUpdateTimers = useRef({});
  const pendingQuantities = useRef({});
  const cartRef = useRef([]);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);


  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      console.log('CartContext: Fetching cart...');
      const data = await getCart();
      console.log('CartContext: Cart data received:', data);
      
      if (data?.cart) {
        setBackendStatus('online');
        setBackendCart(data.cart);
        setBill(data.bill);
   
        const transformedItems = (data.cart.items || []).map(item => {
          console.log('📦 Transforming cart item:', {
            name: item.name,
            variation: item.variation,
            addOns: item.addOns,
            price: item.price,
            quantity: item.quantity,
            basePrice: item.basePrice,
            product: item.product,
          });

          // Calculate base price by subtracting variation and addon prices from total price
          const variationPrice = item.variation?.price || 0;
          const addOnsPrice = Array.isArray(item.addOns) 
            ? item.addOns.reduce((sum, addon) => sum + (addon.price || 0), 0)
            : 0;
          
          // If backend sends basePrice, use it; otherwise calculate it
          const actualBasePrice = item.basePrice ?? item.product?.basePrice ?? (item.price - variationPrice - addOnsPrice);

          console.log('💰 Price breakdown:', {
            totalPrice: item.price,
            variationPrice,
            addOnsPrice,
            calculatedBasePrice: actualBasePrice,
          });

          return {
            id: item._id,
            menuItemId: item.product,
            productId: item.product,
            name: item.name,
            image: item.image || item.product?.image || '',
            basePrice: actualBasePrice,
            price: item.price,
            quantity: item.quantity,
            qty: item.quantity,
            selectedFlavor: item.variation ? {
              id: item.variation._id || item.variation,
              _id: item.variation._id || item.variation,
              label: item.variation.name?.en || item.variation.name || 'Variation',
              name: item.variation.name,
              price: item.variation.price || 0,
              priceDelta: item.variation.price || 0,
            } : null,
            addOns: Array.isArray(item.addOns) ? item.addOns.map(addon => ({
              id: addon._id || addon,
              _id: addon._id || addon,
              label: addon.name?.en || addon.name || 'Add-on',
              name: addon.name,
              price: addon.price || 0,
            })) : [],
            unitTotal: item.price,
            totalPrice: item.price * item.quantity,
            restaurantId: data.cart.restaurant?._id,
            restaurantName: data.cart.restaurant?.name?.en || 'Restaurant',
            restaurant: data.cart.restaurant,
          };
        });

        console.log('✅ CartContext: Transformed items with details:', transformedItems.map(i => ({
          name: i.name,
          variation: i.selectedFlavor?.label,
          addOns: i.addOns?.map(a => a.label),
          totalPrice: i.totalPrice,
        })));
        setCart(transformedItems);
      } else {
        console.log('CartContext: No cart data, clearing cart');
        setBackendStatus('online'); 
        setCart([]);
        setBackendCart(null);
        setBill(null);
      }
    } catch (error) {
      console.error('CartContext: Error fetching cart:', error?.message, error?.status);
      
      if (!error?.response) {
        setBackendStatus('offline');
      }
      if (error?.status === 401 || error?.status === 403) {
        console.log('CartContext: Authentication error while fetching cart');
      }
      
      setCart([]);
      setBackendCart(null);
      setBill(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleConflict = useCallback((conflictData, payload, onSuccess) => {
    const { currentRestaurant, newRestaurant } = conflictData;
    
    console.log('CartContext: Showing conflict modal for restaurants:', {
      current: currentRestaurant?.name,
      new: newRestaurant?.name,
    });
    
    
    setConflictData(conflictData);
    setPendingConflictPayload(payload);
    setShowConflictModal(true);
  }, []);

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      console.log('CartContext: User authenticated, fetching cart');
      fetchCart();
    } else if (isInitialized && !isAuthenticated) {
      console.log('CartContext: User not authenticated, clearing cart');
      setCart([]);
      setBackendCart(null);
      setBill(null);
    }
  }, [fetchCart, isAuthenticated, isInitialized]);

  const updateCartItem = useCallback(async (oldId, newItem) => {
    console.log('🧪 CartContext: updateCartItem initiated', { oldId, newItem });
    try {
      setLoading(true);
      
      console.log('🧪 CartContext: Removing old item:', oldId);
      await removeFromCart(oldId);
      
      console.log('🧪 CartContext: Adding new item:', newItem);
      const result = await addToCart(newItem);
      
      return result;
    } catch (error) {
      console.error('❌ CartContext: updateCartItem failed:', error);
      await fetchCart();
      const errorMessage = error?.response?.data?.message || error.message || 'Update failed';
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [removeFromCart, addToCart, fetchCart]);

  const addToCart = useCallback(async (rawItem) => {
    try {
      setLoading(true);
      console.log('📦 CartContext: Adding item to cart:', rawItem);
      
      const restaurantId = rawItem.restaurantId || rawItem.restaurant?.id || rawItem.restaurant?._id;
      const productId = rawItem.menuItemId || rawItem.productId || rawItem.id;
      const quantity = rawItem.quantity || rawItem.qty || 1;
      
      // Check if variationId is already provided (new format)
      let variationId = rawItem.variationId;
      // Fallback to old format
      if (!variationId) {
        variationId = rawItem.selectedFlavor?.id || rawItem.selectedFlavor?._id || null;
      }
      
      // Check if addOnsIds is already provided (new format)
      let addOnsIds = rawItem.addOnsIds;
      if (!addOnsIds || !Array.isArray(addOnsIds)) {
        // Fallback to old format
        addOnsIds = (rawItem.addOns || []).map(a => a?.id || a?._id).filter(Boolean);
      }

      const payload = {
        restaurantId,
        productId,
        quantity,
        addOnsIds: addOnsIds || [],
      };

      // Only include variationId if it exists
      if (variationId) {
        payload.variationId = variationId;
      }

      // Only include notes if provided
      if (rawItem.notes && rawItem.notes.trim()) {
        payload.notes = rawItem.notes.trim();
      }

      console.log('📤 CartContext: Sending payload to API:', JSON.stringify(payload, null, 2));
      const result = await addItemToCart(payload);
      console.log('📥 CartContext: API result received:', result);

      
      if (result && result.conflict === true) {
        console.log('⚠️ CartContext: CONFLICT DETECTED IN RESULT!');
        console.log('  Current Restaurant:', result.currentRestaurant?.name);
        console.log('  New Restaurant:', result.newRestaurant?.name);
        
        setLoading(false);
        
      
        console.log('CartContext: Setting conflict modal state...');
        setConflictData({
          currentRestaurant: result.currentRestaurant,
          newRestaurant: result.newRestaurant,
        });
        setPendingConflictPayload(payload);
        setShowConflictModal(true);
        console.log('✅ CartContext: Modal should now be visible');
        
        return { conflict: true };
      }

      
      if (result?.cart) {
        console.log('✅ CartContext: Item added successfully');
        setBackendCart(result.cart);
        setBill(result.bill);
        await fetchCart();
        return { success: true };
      }
      
    
      console.warn('⚠️ CartContext: Unexpected response format:', result);
      return { error: true };
    } catch (error) {
      console.error('❌ CartContext: Error adding to cart:', error?.message, error?.status);
      if (error?.status === 401 || error?.status === 403) {
        Toast.show({
          type: 'topError',
          text1: 'Session Expired',
          text2: 'Please log in again.',
          position: 'top',
        });
      } else if (error?.message?.includes('Network')) {
        
        console.warn('CartContext: Network error caught, not showing alert');
      } else {
        Toast.show({
          type: 'topError',
          text1: 'Error',
          text2: error?.message || 'Failed to add item to cart',
          position: 'top',
        });
      }
      return { error: true };
    } finally {
      setLoading(false);
    }
  }, [fetchCart]);

  const removeFromCart = useCallback(async (id) => {
    try {
      setLoading(true);
      await removeItemFromCart(id);
      await fetchCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
      Toast.show({
        type: 'topError',
        text1: 'Error',
        text2: 'Failed to remove item',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  }, [fetchCart]);

  const clearCart = useCallback(async () => {
    try {
      setLoading(true);
      
      for (const item of cart) {
        await removeItemFromCart(item.id);
      }
      setCart([]);
      setBackendCart(null);
      setBill(null);
      setCheckout({ type: 'delivery', date: null, time: null });
      setAddress(null);
      setPaymentMethod(null);
    } catch (error) {
      console.error('Error clearing cart:', error);
    } finally {
      setLoading(false);
    }
  }, [cart]);

  const clearCheckoutFlow = useCallback(() => {
    setCheckout({ type: 'delivery', date: null, time: null });
    setAddress(null);
    setPaymentMethod(null);
  }, []);

  const addOrder = useCallback(order => {
    if (!order) return;
    setOrders(prev => [order, ...prev]);
  }, []);

  const getOrderById = useCallback(
    orderId => orders.find(o => o.id === orderId),
    [orders],
  );

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      console.log('CartContext: Fetching orders... (initial loading state)');
      const data = await fetchOrdersFromAPI();
      console.log('CartContext: Orders API response:', {
        responseStructure: Object.keys(data || {}),
        ordersArray: data?.orders,
        ordersLength: Array.isArray(data?.orders) ? data.orders.length : 'N/A',
        fullResponse: data,
      });
      
      if (Array.isArray(data?.orders) || Array.isArray(data)) {
        const ordersList = Array.isArray(data?.orders) ? data.orders : data;
        console.log('🟢 CartContext: Setting orders array with', ordersList.length, 'items');
        setOrders(ordersList);
      } else if (data?.data && Array.isArray(data.data)) {
        console.log('🟢 CartContext: Setting orders from data.data with', data.data.length, 'items');
        setOrders(data.data);
      } else {
        console.log('🔴 CartContext: No orders array found in response:', data);
        setOrders([]);
      }
    } catch (error) {
      console.error('🔴 CartContext: Error fetching orders:', {
        message: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        fullError: error,
      });
      
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        console.log('🔴 CartContext: Authentication error (401/403) - User may not be logged in');
      } else if (error?.response?.status === 404) {
        console.log('🔴 CartContext: Orders endpoint not found (404) - Backend may not have this endpoint yet');
      }
      
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !realtimeReady) {
      return;
    }

    const toId = (value) => (value?.toString ? value.toString() : String(value || ''));

    const resolvePayloadOrderId = (payload) => {
      return toId(
        payload?.orderId ||
        payload?._id ||
        payload?.id ||
        payload?.order?._id ||
        payload?.order?.id,
      );
    };

    const patchOrder = (payload, updater) => {
      const targetOrderId = resolvePayloadOrderId(payload);
      if (!targetOrderId) {
        return;
      }

      setOrders((prev) => {
        if (!Array.isArray(prev) || prev.length === 0) {
          return prev;
        }

        let changed = false;
        const next = prev.map((order) => {
          const currentId = toId(order?._id || order?.id);
          if (currentId !== targetOrderId) {
            return order;
          }

          changed = true;
          return updater(order);
        });

        return changed ? next : prev;
      });
    };

    const unsubs = [
      onSocketEvent('order:status', (payload) => {
        const nextStatus = payload?.status;
        if (!nextStatus) return;
        patchOrder(payload, (order) => ({
          ...order,
          status: nextStatus,
        }));
      }),
      onSocketEvent('order:status_updated', (payload) => {
        const nextStatus = payload?.newStatus || payload?.status;
        if (!nextStatus) return;
        patchOrder(payload, (order) => ({
          ...order,
          status: nextStatus,
        }));
      }),
      onSocketEvent('order:cancelled', (payload) => {
        patchOrder(payload, (order) => ({
          ...order,
          status: 'cancelled',
          cancellationReason: payload?.reason || order?.cancellationReason,
        }));
      }),
      onSocketEvent('order:rider_assigned', (payload) => {
        patchOrder(payload, (order) => ({
          ...order,
          status: payload?.status || order?.status,
          rider: {
            ...(order?.rider || {}),
            _id: payload?.riderId || order?.rider?._id,
            name: payload?.riderName || order?.rider?.name,
          },
        }));
      }),
      onSocketEvent('rider:location_updated', (payload) => {
        patchOrder(payload, (order) => ({
          ...order,
          riderLiveLocation: payload?.riderLocation || payload,
          eta: payload?.eta || order?.eta,
        }));
      }),
      onSocketEvent('rider:location', (payload) => {
        patchOrder(payload, (order) => ({
          ...order,
          riderLiveLocation: payload?.riderLocation || payload,
          eta: payload?.eta || order?.eta,
        }));
      }),
    ].filter(Boolean);

    return () => {
      unsubs.forEach((unsubscribe) => unsubscribe?.());
    };
  }, [isAuthenticated, realtimeReady]);

  const setItemQuantity = useCallback(async (id, quantity) => {
    const item = cart.find(i => i.id === id);
    if (!item) {
      Toast.show({
        type: 'topError',
        text1: 'Error',
        text2: 'Item not found in cart',
        position: 'top',
      });
      return;
    }

    try {
      setLoading(true);
      const result = await updateItemQuantity(id, {
        quantity: Math.max(1, Number(quantity)),
      });
      if (result?.cart) {
        await fetchCart();
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      Toast.show({
        type: 'topError',
        text1: 'Error',
        text2: error?.message || 'Failed to update quantity',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  }, [cart, fetchCart]);

  const incrementItem = useCallback((id) => {
    console.log('🔼 Increment - non-blocking');

    const matchId = String(id);
    const currentCart = Array.isArray(cartRef.current) ? cartRef.current : [];
    const item = currentCart.find(i =>
      String(i.id) === matchId ||
      String(i.menuItemId ?? i.productId ?? '') === matchId,
    );
    if (!item) return;

    const resolvedId = item.id;
    // Use the latest pending quantity if it exists, otherwise use the current item quantity
    const baseQty = pendingQuantities.current[resolvedId] ?? toNumber(item.quantity, 1);
    const newQty = baseQty + 1;
    const unitPrice = item.price || item.basePrice || 0;

    pendingQuantities.current[resolvedId] = newQty;

    
    setCart(prevCart =>
      prevCart.map(it =>
        String(it.id) === String(resolvedId)
          ? { ...it, quantity: newQty, qty: newQty, totalPrice: unitPrice * newQty }
          : it
      )
    );

    
    if (quantityUpdateTimers.current[resolvedId]) {
      clearTimeout(quantityUpdateTimers.current[resolvedId]);
    }

    quantityUpdateTimers.current[resolvedId] = setTimeout(async () => {
      try {
        console.log('📡 API sync increment');
        const finalQty = pendingQuantities.current[resolvedId];
        if (!Number.isFinite(finalQty)) return;
        const result = await updateItemQuantity(resolvedId, { quantity: finalQty });
        if (result?.cart) {
          const byId = new Map(
            (result.cart.items || []).map(it => [String(it._id), it]),
          );
          setCart(prev =>
            prev.map(it => {
              const backend = byId.get(String(it.id));
              if (!backend) return it;
              const qty = toNumber(backend.quantity, it.quantity);
              const price = it.price || it.basePrice || 0;
              return {
                ...it,
                quantity: qty,
                qty,
                totalPrice: price * qty,
              };
            }),
          );
          setBackendCart(result.cart);
          setBill(result.bill);
          console.log('✅ Synced');
        }
      } catch (err) {
        console.error('❌ Sync failed');
      }
    }, 350);
  }, []);

  const decrementItem = useCallback((id) => {
    console.log('🔽 Decrement - non-blocking');

    const matchId = String(id);
    const currentCart = Array.isArray(cartRef.current) ? cartRef.current : [];
    const item = currentCart.find(i =>
      String(i.id) === matchId ||
      String(i.menuItemId ?? i.productId ?? '') === matchId,
    );
    if (!item) return;

    const resolvedId = item.id;
    // Use the latest pending quantity if it exists, otherwise use the current item quantity
    const baseQty = pendingQuantities.current[resolvedId] ?? toNumber(item.quantity, 1);
    const currentQty = baseQty;
    const unitPrice = item.price || item.basePrice || 0;

    if (currentQty <= 1) {
      if (quantityUpdateTimers.current[resolvedId]) {
        clearTimeout(quantityUpdateTimers.current[resolvedId]);
        delete quantityUpdateTimers.current[resolvedId];
      }
      delete pendingQuantities.current[resolvedId];
      setCart(prevCart =>
        prevCart.filter(it => String(it.id) !== String(resolvedId))
      );
      removeFromCart(resolvedId);
      return;
    }

    const newQty = currentQty - 1;
    pendingQuantities.current[resolvedId] = newQty;

    setCart(prevCart =>
      prevCart.map(it =>
        String(it.id) === String(resolvedId)
          ? { ...it, quantity: newQty, qty: newQty, totalPrice: unitPrice * newQty }
          : it
      )
    );

   
    if (quantityUpdateTimers.current[resolvedId]) {
      clearTimeout(quantityUpdateTimers.current[resolvedId]);
    }

    quantityUpdateTimers.current[resolvedId] = setTimeout(async () => {
      try {
        console.log('📡 API sync decrement');
        const finalQty = pendingQuantities.current[resolvedId];
        if (!Number.isFinite(finalQty)) return;
        const result = await updateItemQuantity(resolvedId, { quantity: finalQty });
        if (result?.cart) {
          const byId = new Map(
            (result.cart.items || []).map(it => [String(it._id), it]),
          );
          setCart(prev =>
            prev.map(it => {
              const backend = byId.get(String(it.id));
              if (!backend) return it;
              const qty = toNumber(backend.quantity, it.quantity);
              const price = it.price || it.basePrice || 0;
              return {
                ...it,
                quantity: qty,
                qty,
                totalPrice: price * qty,
              };
            }),
          );
          setBackendCart(result.cart);
          setBill(result.bill);
          console.log('✅ Synced');
        }
      } catch (err) {
        console.error('❌ Sync failed');
      }
    }, 350);
  }, [removeFromCart]);

 
  const handlePlaceCurrentOrder = useCallback(() => {
    console.log('CartContext: User chose to place current order');
    setShowConflictModal(false);
    setConflictData(null);
    setPendingConflictPayload(null);
  }, []);

  const handleFreshCart = useCallback(async () => {
    try {
      setConflictModalLoading(true);
      setFreshCartResolvedAt(Date.now());
      console.log('CartContext: User chose fresh cart, clearing and adding new item');
      
      if (!pendingConflictPayload) {
        console.error('CartContext: No pending payload for fresh cart');
        return;
      }

      const result = await addItemToCart({ ...pendingConflictPayload, clearCart: true });
      
      console.log('CartContext: Fresh cart result:', result);
      if (result?.cart) {
        setBackendCart(result.cart);
        setBill(result.bill);
        
       
        setShowConflictModal(false);
        setConflictData(null);
        setPendingConflictPayload(null);
        
        
        await fetchCart();
      }
    } catch (error) {
      console.error('CartContext: Error in fresh cart:', error?.message);
      Toast.show({
        type: 'topError',
        text1: 'Error',
        text2: error?.message || 'Failed to add item',
        position: 'top',
      });
    } finally {
      setConflictModalLoading(false);
    }
  }, [pendingConflictPayload, fetchCart]);

  const cartCount = useMemo(
    () => cart.reduce((s, it) => s + toNumber(it.quantity, 1), 0),
    [cart],
  );

  const totals = useMemo(() => {
    const localTotals = calculateCartTotals(cart);
    if (bill) {
      const subtotal = toNumber(localTotals.subtotal, 0);
      const discount = toNumber(bill.discount, 0);
      const tax = toNumber(bill.tax, 0);
      const delivery = toNumber(bill.deliveryFee, 0);
      const packaging = toNumber(bill.packaging, 0);
      const platformFee = toNumber(bill.platformFee, 0);
      const grandTotal = subtotal + delivery + tax + packaging + platformFee - discount;

      console.log('💵 CartContext Bill Details:', {
        subtotal,
        discount,
        tax,
        delivery,
        packaging,
        platformFee,
        grandTotal,
        itemsCount: cart.length,
      });

      return {
        subtotal,
        discount,
        tax,
        delivery,
        packaging,
        platformFee,
        grandTotal,
      };
    }
    return localTotals;
  }, [cart, bill]);

  const cartState = useMemo(
    () => ({
      items: cart,
      address,
      paymentMethod,
      checkout,
      totals: {
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        delivery: totals.delivery,
        packaging: totals.packaging,
        platformFee: totals.platformFee,
        grandTotal: totals.grandTotal,
      },
      bill,
      backendCart,
    }),
    [address, cart, checkout, paymentMethod, totals, bill, backendCart],
  );

  return (
    <>
      <ConflictModal
        visible={showConflictModal}
        currentRestaurant={conflictData?.currentRestaurant}
        newRestaurant={conflictData?.newRestaurant}
        onPlaceOrder={handlePlaceCurrentOrder}
        onFreshCart={handleFreshCart}
        loading={conflictModalLoading}
      />
      <CartContext.Provider
        value={{
          cart,
          cartState,
          orders,
          cartCount,
          totals,
          bill,
          backendCart,
          loading,
          backendStatus,
          addToCart,
          updateCartItem,
          addOrder,
          getOrderById,
          fetchOrders,
          freshCartResolvedAt,
          checkout,
          setCheckout,
          address,
          setAddress,
          paymentMethod,
          setPaymentMethod,
          clearCheckoutFlow,
          removeFromCart,
          clearCart,
          setItemQuantity,
          incrementItem,
          decrementItem,
          fetchCart,
        }}
      >
        {children}
      </CartContext.Provider>
    </>
  );
};

export default CartContext;
