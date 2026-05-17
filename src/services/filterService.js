import apiClient from '../config/apiClient';

/**
 * Apply filters to search results
 * @param {string} query - Search query (e.g., "pizza")
 * @param {object} filters - Filter options
 * @param {boolean} filters.isVeg - Filter vegetarian items (true/false)
 * @param {number} filters.minPrice - Minimum price
 * @param {number} filters.maxPrice - Maximum price
 * @param {number} filters.minRating - Minimum rating
 * @param {string} filters.sortBy - Sort order (price_asc, price_desc, rating_desc, newest)
 * @returns {Promise} Filtered search results
 */
export const applyFilters = async (query, filters = {}) => {
  try {
    const params = {};
    if (query && query.trim() !== '') {
      params.q = query.trim();
    }

    // Add price range filters if specified
    if (filters.minPrice !== undefined && filters.minPrice !== null && filters.minPrice > 0) {
      params.minPrice = parseInt(filters.minPrice, 10);
    }

    if (filters.maxPrice !== undefined && filters.maxPrice !== null && filters.maxPrice > 0) {
      params.maxPrice = parseInt(filters.maxPrice, 10);
    }

    // Add minimum rating filter if specified (backend expects minRating)
    const minRatingSource = filters.minRating ?? filters.rating;
    if (minRatingSource !== undefined && minRatingSource !== null && minRatingSource !== 'all') {
      const normalizedMinRating = parseInt(minRatingSource, 10);
      if (!isNaN(normalizedMinRating) && normalizedMinRating >= 1 && normalizedMinRating <= 5) {
        params.minRating = normalizedMinRating;
      }
    }

    // Add sort parameter if specified
    if (filters.sortBy && filters.sortBy !== 'relevance') {
      params.sortBy = filters.sortBy;
    }

    // Add all other filters to params
    Object.keys(filters).forEach(key => {
      if (!['minPrice', 'maxPrice', 'minRating', 'sortBy', 'rating'].includes(key)) {
        params[key] = filters[key];
      }
    });

    console.log('🚀 [FilterService] API Call:', {
      url: '/api/search',
      params
    });

    // Use axios params to properly encode the query string
    const response = await apiClient.get('/api/search', { params });

    return response.data?.results || response.data;
  } catch (error) {
    if (__DEV__) {
      console.error('Filter API error:', error?.response?.data || error?.message);
    }
    throw error;
  }
};

/**
 * Convert filter drawer data to API filter format
 * @param {object} drawerFilters - Filter data from FilterDrawer
 * @returns {object} Formatted filters for API
 */
export const convertDrawerFiltersToAPI = (drawerFilters) => {
  const apiFilters = {};

  // Check if we have valid filter data
  if (!drawerFilters) {
    return apiFilters;
  }

  // Handle sort by parameter - map UI values to API parameter names
  if (drawerFilters.sortBy && drawerFilters.sortBy !== 'relevance') {
    const sortMap = {
      'delivery_time': 'delivery_time',
      'rating_high_low': 'rating_desc',
      'cost_low_high': 'price_asc',
      'cost_high_low': 'price_desc',
      'newest': 'newest',
    };

    const apiSortValue = sortMap[drawerFilters.sortBy];
    if (apiSortValue) {
      apiFilters.sortBy = apiSortValue;
    }
  }

  // Handle price range
  if (drawerFilters.minPrice !== undefined && drawerFilters.minPrice !== null && drawerFilters.minPrice !== '') {
    const minPrice = typeof drawerFilters.minPrice === 'number'
      ? drawerFilters.minPrice
      : parseInt(drawerFilters.minPrice, 10);
    if (!isNaN(minPrice) && minPrice > 0) {
      apiFilters.minPrice = minPrice;
    }
  }

  if (drawerFilters.maxPrice !== undefined && drawerFilters.maxPrice !== null && drawerFilters.maxPrice !== '') {
    const maxPrice = typeof drawerFilters.maxPrice === 'number'
      ? drawerFilters.maxPrice
      : parseInt(drawerFilters.maxPrice, 10);
    if (!isNaN(maxPrice) && maxPrice > 0) {
      apiFilters.maxPrice = maxPrice;
    }
  }

  // Handle rating (minimum stars)
  if (drawerFilters.rating) {
    const normalizedRating = typeof drawerFilters.rating === 'number'
      ? drawerFilters.rating
      : parseFloat(drawerFilters.rating);

    if (!isNaN(normalizedRating) && normalizedRating >= 1 && normalizedRating <= 5) {
      apiFilters.minRating = normalizedRating;
    }
  }

  // Handle Time Filter
  if (drawerFilters.timeFilter) {
    apiFilters.timeFilter = drawerFilters.timeFilter;
  }

  // Handle Offers
  if (drawerFilters.offers && drawerFilters.offers.length > 0) {
    apiFilters.offers = drawerFilters.offers.join(',');
  }

  // Handle Cost for Two
  if (drawerFilters.costForTwo) {
    apiFilters.costForTwo = drawerFilters.costForTwo;
  }

  // Handle Food Preference
  if (drawerFilters.foodPreference && drawerFilters.foodPreference.length > 0) {
    apiFilters.foodType = drawerFilters.foodPreference.join(',');
    const hasVeg = drawerFilters.foodPreference.includes('veg') || drawerFilters.foodPreference.includes('vegan');
    const hasNonVeg = drawerFilters.foodPreference.includes('non_veg');
    if (hasVeg && !hasNonVeg) {
      apiFilters.isVeg = true;
    } else if (!hasVeg && hasNonVeg) {
      apiFilters.isVeg = false;
    }
  }

  // Handle Cuisines
  if (drawerFilters.cuisines && drawerFilters.cuisines.length > 0) {
    apiFilters.cuisine = drawerFilters.cuisines.join(',');
  }

  // Handle Additional Filters
  if (drawerFilters.additionalFilters && drawerFilters.additionalFilters.length > 0) {
    drawerFilters.additionalFilters.forEach(filter => {
      apiFilters[filter] = true;
    });
  }

  // Handle Location
  if (drawerFilters.radius) {
    apiFilters.radius = drawerFilters.radius;
  }
  if (drawerFilters.isNearby) {
    apiFilters.nearby = true;
  }

  return apiFilters;
};

/**
 * Get default filter values
 * @returns {object} Default filter object
 */
export const getDefaultFilters = () => ({
  isVeg: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  minRating: undefined,
});
