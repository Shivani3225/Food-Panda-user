import apiClient from '../config/apiClient';
import { FAVORITE_ROUTES } from '../config/routes';

/**
 * Get user's favorite restaurants
 * @returns {Promise<Array>} Array of favorite restaurants
 */
export const getFavoriteRestaurants = async () => {
  try {
    const response = await apiClient.get(FAVORITE_ROUTES.getFavoriteRestaurants);
    return response?.data?.favorites || [];
  } catch (error) {
    console.error('Error fetching favorite restaurants:', error);
    throw error;
  }
};

/**
 * Toggle favorite status for a restaurant
 * @param {string} restaurantId - The ID of the restaurant
 * @returns {Promise<Object>} Response with isFavorite status
 */
export const toggleFavoriteRestaurant = async (restaurantId) => {
  try {
    const url = FAVORITE_ROUTES.toggleFavoriteRestaurant.replace(':id', restaurantId);
    const response = await apiClient.post(url);
    return response?.data || {};
  } catch (error) {
    console.error('Error toggling favorite restaurant:', error);
    throw error;
  }
};

/**
 * Get user's favorite products/menu items
 * @returns {Promise<Array>} Array of favorite products
 */
export const getFavoriteProducts = async () => {
  try {
    const response = await apiClient.get(FAVORITE_ROUTES.getFavoriteProducts);
    return response?.data?.favorites || [];
  } catch (error) {
    console.error('Error fetching favorite products:', error);
    throw error;
  }
};

/**
 * Toggle favorite status for a product/menu item
 * @param {string} productId - The ID of the product
 * @returns {Promise<Object>} Response with isFavorite status
 */
export const toggleFavoriteProduct = async (productId) => {
  try {
    const url = FAVORITE_ROUTES.toggleFavoriteProduct.replace(':id', productId);
    const response = await apiClient.post(url);
    return response?.data || {};
  } catch (error) {
    console.error('Error toggling favorite product:', error);
    throw error;
  }
};
