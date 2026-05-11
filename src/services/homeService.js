import apiClient from '../config/apiClient';
import { HOME_ROUTES } from '../config/routes';

/**
 * Get home page data including banners, categories, and restaurant sections
 * @param {Object} params - Query parameters
 * @param {number} params.lat - Latitude for location-based data
 * @param {number} params.lng - Longitude for location-based data
 * @returns {Promise<Object>} Home data with banners, categories, sections, and tabs
 */
export const getHomeData = async ({ lat, lng } = {}) => {
  const params = {};
  if (lat !== undefined && lng !== undefined) {
    params.lat = lat;
    params.lng = lng;
  }

  console.log('🌍 [HomeService] Calling API with params:', params);
  console.log('🌍 [HomeService] Full URL:', `${apiClient.defaults.baseURL}${HOME_ROUTES.getHomeData}`);
  
  const response = await apiClient.get(HOME_ROUTES.getHomeData, { params });
  
  console.log('✅ [HomeService] Response received:', {
    status: response.status,
    hasBanners: !!response?.data?.banners,
    bannersCount: response?.data?.banners?.length,
    hasCategories: !!response?.data?.categories,
    categoriesCount: response?.data?.categories?.length,
    hasSections: !!response?.data?.sections,
    sections: Object.keys(response?.data?.sections || {}),
  });
  
  // Log detailed section counts
  if (response?.data?.sections) {
    console.log('📊 [HomeService] Section details:', {
      recommendedForYou: response.data.sections.recommendedForYou?.length || 0,
      exploreRestaurants: response.data.sections.exploreRestaurants?.length || 0,
      popularRestaurants: response.data.sections.popularRestaurants?.length || 0,
      fastDelivery: response.data.sections.fastDelivery?.length || 0,
      freeDelivery: response.data.sections.freeDelivery?.length || 0,
      newOnPlatform: response.data.sections.newOnPlatform?.length || 0,
      recentRestaurants: response.data.sections.recentRestaurants?.length || 0,
    });
  }
  
  return response?.data ?? {};
};
