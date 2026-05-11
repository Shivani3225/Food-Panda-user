import apiClient from '../config/apiClient';
import { ORDER_ROUTES } from '../config/routes';

export const getOrders = async () => {
  try {
    const response = await apiClient.get(ORDER_ROUTES.getOrders);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getOrderById = async (orderId) => {
  try {
    const url = ORDER_ROUTES.getOrderById.replace(':id', orderId);
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const placeOrder = async orderData => {
  try {
    const response = await apiClient.post(ORDER_ROUTES.placeOrder, orderData);
    return response.data;
  } catch (error) {
    console.error('Error placing order:', error);
    throw error;
  }
};

export function generateOrderId(prefix = 'ORD') {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${yyyy}${mm}${dd}-${rand}`;
}

export const rateOrder = async (orderId, ratingData) => {
  try {
    const url = ORDER_ROUTES.rateOrder.replace(':id', orderId);
    const response = await apiClient.post(url, ratingData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const rateRestaurant = async (restaurantId, ratingData) => {
  try {
    const url = ORDER_ROUTES.rateRestaurant.replace(':id', restaurantId);
    const response = await apiClient.post(url, ratingData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const rateRider = async (riderId, ratingData) => {
  try {
    const url = ORDER_ROUTES.rateRider.replace(':id', riderId);
    const response = await apiClient.post(url, ratingData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const reportOrderIssue = async (orderId, issueData) => {
  try {
    const url = ORDER_ROUTES.reportIssue.replace(':id', orderId);
    const response = await apiClient.post(url, issueData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const uploadOrderPhotos = async (orderId, images) => {
  try {
    const url = ORDER_ROUTES.uploadOrderPhotos.replace(':id', orderId);
    
    const formData = new FormData();
    images.forEach((image, index) => {
      formData.append('photos', {
        uri: image.uri,
        type: image.type,
        name: image.name,
      });
    });

    const response = await apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    throw error;
  }
};
