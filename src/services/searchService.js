import apiClient from '../config/apiClient';
import { SEARCH_ROUTES } from '../config/routes';

/**
 * Search for restaurants and products with filters
 * @param {string} query - Search query
 * @param {object} filters - Filter options (isVeg, minPrice, maxPrice, etc.)
 * @returns {Promise} Search results with restaurants and products
 */
export const searchRestaurantsAndProducts = async (query, filters = {}) => {
  try {
    const queryParams = new URLSearchParams({ q: query, ...filters });
    const url = `${SEARCH_ROUTES.search}?${queryParams.toString()}`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Search error:', error?.message);
    throw error;
  }
};

/**
 * Get search suggestions based on query
 * @param {string} query - Search query
 * @returns {Promise} Array of suggestions (restaurants or dishes)
 */
export const getSearchSuggestions = async (query) => {
  try {
    const queryParams = new URLSearchParams({ q: query });
    const url = `${SEARCH_ROUTES.suggestions}?${queryParams.toString()}`;
    const response = await apiClient.get(url);
    // Return array directly or from data property
    return Array.isArray(response.data) ? response.data : response.data?.suggestions || [];
  } catch (error) {
    console.error('Search suggestions error:', error?.message);
    throw error;
  }
};
