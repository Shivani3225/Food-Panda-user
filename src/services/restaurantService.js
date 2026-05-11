// src/services/restaurantService.js
import apiClient from '../config/apiClient';
import { RESTAURANT_ROUTES } from '../config/routes';

export const getRestaurantDetails = async id => {
  try {
    const response = await apiClient.get(
      RESTAURANT_ROUTES.getDetails.replace(':id', id),
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getRestaurantMenu = async restaurantId => {
  try {
    const response = await apiClient.get(
      RESTAURANT_ROUTES.getMenu.replace(':restaurantId', restaurantId),
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
