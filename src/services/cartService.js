import apiClient from '../config/apiClient';
import { CART_ROUTES } from '../config/routes';

/**
 * Get current cart from backend
 */
export const getCart = async () => {
  try {
    console.log('Fetching cart from:', CART_ROUTES.getCart);
    const response = await apiClient.get(CART_ROUTES.getCart);
    console.log('Cart fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Cart fetch failed:', error?.message, error?.response?.status);
    
    // Handle specific error cases
    if (error?.response?.status === 404) {
      // No cart found - return empty
      console.log('Cart not found (404), returning empty cart');
      return { cart: null, bill: null, itemCount: 0 };
    }
    
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      console.log('Cart fetch requires authentication');
      // Return empty cart instead of throwing for auth errors
      return { cart: null, bill: null, itemCount: 0 };
    }
    
    // For network errors or any other error, return empty cart
    if (!error?.response) {
      console.error('🔴 Network error - Backend server not responding');
      console.error('Please ensure the backend server is running at:', 'https://api.waseeny.de');
      return { cart: null, bill: null, itemCount: 0 };
    }
    
    throw error;
  }
};

/**
 * Add item to cart
 * @param {Object} payload - { restaurantId, productId, quantity, variationId, addOnsIds, clearCart }
 */
export const addItemToCart = async (payload) => {
  try {
    console.log('🛒 cartService: Adding to cart:', { endpoint: CART_ROUTES.addItem, payload });
    const response = await apiClient.post(CART_ROUTES.addItem, payload);
    console.log('✅ cartService: Item added successfully:', response.data);
    return response.data;
  } catch (error) {
    const statusCode = error?.response?.status;
    const responseData = error?.response?.data;
    
    console.error('❌ cartService: Add to cart error:', {
      message: error?.message,
      status: statusCode,
      data: responseData,
    });
    
    // Handle restaurant conflict (409) - Check FIRST before any other condition
    if (statusCode === 409 && responseData?.conflict === true) {
      console.log('⚠️ cartService: CONFLICT 409 DETECTED!');
      console.log('  Current Restaurant:', responseData?.currentRestaurant);
      console.log('  New Restaurant:', responseData?.newRestaurant);
      
      const conflictResponse = {
        conflict: true,
        currentRestaurant: responseData?.currentRestaurant,
        newRestaurant: responseData?.newRestaurant,
        message: responseData?.message,
        requiresAction: responseData?.requiresAction,
      };
      
      console.log('✅ cartService: Returning conflict response:', conflictResponse);
      return conflictResponse;
    }
    
    if (statusCode === 401 || statusCode === 403) {
      const authError = new Error('Authentication failed. Please log in again.');
      authError.status = statusCode;
      throw authError;
    }
    
    // For network errors, provide helpful message
    if (!error?.response) {
      const networkError = new Error('🔴 Network error - Backend server not responding');
      networkError.status = 0;
      throw networkError;
    }
    
    throw error;
  }
};

/**
 * Remove item from cart
 * @param {string} itemId - Cart item ID
 */
export const removeItemFromCart = async (itemId) => {
  try {
    const endpoint = CART_ROUTES.removeItem.replace(':itemId', itemId);
    const response = await apiClient.delete(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update item quantity via dedicated endpoint
 * @param {string} itemId
 * @param {Object} payload - { action: 'increase'|'decrease' } OR { quantity: number }
 */
export const updateItemQuantity = async (itemId, payload) => {
  try {
    const endpoint = CART_ROUTES.updateQuantity.replace(':itemId', itemId);
    
    // Backend requires itemId in body as well as URL
    const requestBody = {
      itemId,
      ...payload
    };
    
    console.log('📤 cartService: Updating quantity:', { 
      endpoint, 
      itemId, 
      requestBody 
    });
    
    const response = await apiClient.patch(endpoint, requestBody);
    
    console.log('✅ cartService: Quantity updated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ cartService: Update quantity failed:', {
      itemId,
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data
    });
    
    // Enhanced error message
    if (error?.response?.status === 404) {
      const err = new Error('Item not found in cart');
      err.status = 404;
      throw err;
    }
    if (error?.response?.status === 400) {
      const err = new Error(error?.response?.data?.message || 'Invalid request');
      err.status = 400;
      throw err;
    }
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      const authError = new Error('Authentication failed. Please log in again.');
      authError.status = error?.response?.status;
      throw authError;
    }
    throw error;
  }
};
