import apiClient from '../config/apiClient';
import { COUPON_ROUTES } from '../config/routes';

/**
 * Fetch all available promotional codes / coupons
 */
export const getCoupons = async () => {
  try {
    const response = await apiClient.get(COUPON_ROUTES.getCoupons);
    return response.data;
  } catch (error) {
    console.error('Error fetching coupons:', error);
    throw error;
  }
};
