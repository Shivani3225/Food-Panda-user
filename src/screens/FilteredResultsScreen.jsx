import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { useRoute, useNavigation } from '@react-navigation/native';
import { applyFilters, convertDrawerFiltersToAPI } from '../services/filterService';
import { RestaurantListCard } from '../components/Home/RestaurantCard';
import { ProductCard } from '../components/ProductCard';
import { useLocation } from '../context/LocationContext';
import { SkeletonCard } from '../components/Home/SkeletonLoaders';
import { wp, hp } from '../utils/responsive';
import { scale } from '../utils/scale';
import { FONT_SIZES as FONT } from '../theme/typography';
import { useAuth } from '../context/AuthContext';


export default function FilteredResultsScreen() {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const { drawerFilters, searchQuery, apiFilters: propsApiFilters, userLocation: routeLocation } = route.params || {};
  const { location: globalLocation } = useLocation();
  const userLocation = routeLocation || globalLocation;
  const { currencySymbol } = useAuth(); // For potential use in ProductCard if needed

  const [filteredItems, setFilteredItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageNum, setPageNum] = useState(0);
  const itemsPerPage = 8;

  const parseNumeric = useCallback((value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }, []);

  const resolveRestaurantRatingAverage = useCallback((product) => {
    const candidates = [
      product?.restaurantRating,
      product?.restaurantRatingAverage,
      product?.restaurant?.rating?.average,
      product?.restaurant?.ratingAverage,
      product?.restaurant?.rating,
      product?.restaurantData?.rating?.average,
      product?.restaurantData?.ratingAverage,
      product?.restaurantData?.rating,
      product?.rating,
      product?.ratingAverage,
    ];

    for (const candidate of candidates) {
      const parsed = parseNumeric(candidate);
      if (parsed !== null) {
        return parsed;
      }
    }

    return null;
  }, [parseNumeric]);

  const resolveRestaurantRatingCount = useCallback((product) => {
    const candidates = [
      product?.restaurantRatingCount,
      product?.restaurant?.rating?.count,
      product?.restaurant?.ratingCount,
      product?.restaurantData?.rating?.count,
      product?.restaurantData?.ratingCount,
      product?.ratingCount,
      product?.reviewsCount,
    ];

    for (const candidate of candidates) {
      const parsed = parseNumeric(candidate);
      if (parsed !== null) {
        return parsed;
      }
    }

    return null;
  }, [parseNumeric]);

  // Sort function to apply frontend sorting
  const applySorting = useCallback((products, sortBy) => {
    if (!products || products.length === 0) {
      return products || [];
    }

    if (!sortBy || sortBy === 'relevance') {
      return products;
    }

    const sortedProducts = [...products];

    switch (sortBy) {
      case 'price_asc':
      case 'price_low_high':
      case 'cost_low_high':
        sortedProducts.sort((a, b) => {
          const priceA = a.averageCost || a.costForTwo || a.price || 0;
          const priceB = b.averageCost || b.costForTwo || b.price || 0;
          return priceA - priceB;
        });
        return sortedProducts;

      case 'price_desc':
      case 'price_high_low':
      case 'cost_high_low':
        sortedProducts.sort((a, b) => {
          const priceA = a.averageCost || a.costForTwo || a.price || 0;
          const priceB = b.averageCost || b.costForTwo || b.price || 0;
          return priceB - priceA;
        });
        return sortedProducts;

      case 'rating_desc':
      case 'rating':
      case 'rating_high_low':
        sortedProducts.sort((a, b) => {
          const ratingA = a.ratingAverage || 0;
          const ratingB = b.ratingAverage || 0;
          return ratingB - ratingA;
        });
        return sortedProducts;

      case 'delivery_time':
        sortedProducts.sort((a, b) => {
          const timeA = parseInt(a.deliveryTime) || 999;
          const timeB = parseInt(b.deliveryTime) || 999;
          return timeA - timeB;
        });
        return sortedProducts;

      case 'newest':
        sortedProducts.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        return sortedProducts;

      default:
        return sortedProducts;
    }
  }, []);

  // Helper function to format time and distance, similar to HomePage.jsx
  const formatTimeAndDistance = useCallback((item) => {
    const loc = userLocation || globalLocation;

    // Robust distance extraction from API
    let rawDistance = 
      item.distanceKm ?? 
      item.distance ?? 
      item.dist ?? 
      item.dist_km ?? 
      item.distance_km ?? 
      item.location?.distance;

    // Fallback: If API distance is not available, calculate from coordinates
    if (rawDistance == null && loc && item.location?.coordinates) {
      try {
        const [resLng, resLat] = item.location.coordinates;
        const userLat = loc.latitude;
        const userLng = loc.longitude;

        if (resLat && resLng && userLat && userLng) {
          const R = 6371; // Earth's radius in km
          const dLat = (resLat - userLat) * (Math.PI / 180);
          const dLon = (resLng - userLng) * (Math.PI / 180);
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(userLat * (Math.PI / 180)) * Math.cos(resLat * (Math.PI / 180)) * 
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          rawDistance = R * c;
        }
      } catch (e) {
        console.warn('Manual distance calculation error in FilteredResults:', e);
      }
    }

    const numericDist = typeof rawDistance === 'string' ? parseFloat(rawDistance) : Number(rawDistance);
    const hasValidDist = rawDistance != null && !isNaN(numericDist);
    
    const timeValue = item.deliveryTime;
    let timePart = '';
    
    if (timeValue) {
      if (typeof timeValue === 'string' && (timeValue.includes('-') || timeValue.includes(' '))) {
        timePart = `${timeValue} ${t('home.min', 'min')}`;
      } else {
        const tVal = parseInt(timeValue);
        if (isNaN(tVal)) {
          timePart = `${timeValue} ${t('home.min', 'min')}`;
        } else {
          const lower = Math.max(10, Math.floor(tVal / 10) * 10);
          const upper = lower + 10;
          timePart = `${lower}-${upper} ${t('home.min', 'min')}`;
        }
      }
    }

    const clockIcon = timePart ? '🕒 ' : '';
    const distPart = hasValidDist ? `📍 ${numericDist.toFixed(1)} ${t('home.km', 'km')}` : '';
    
    if (timePart && distPart) {
      return `${clockIcon}${timePart} • ${distPart}`;
    }
    return timePart ? `${clockIcon}${timePart}` : distPart || '';
  }, [userLocation, globalLocation, t]);

  // Fetch filtered results
  const fetchFilteredResults = useCallback(async () => {
    try {
      setIsLoading(true);

      // Convert drawer filters to API format (prefer precomputed filters from route)
      const apiFilters = propsApiFilters || convertDrawerFiltersToAPI(drawerFilters || {});

      // Add coordinates if available for nearby filtering
      if (userLocation) {
        apiFilters.lat = userLocation.latitude;
        apiFilters.lng = userLocation.longitude;
      }

      console.log('🔍 [FilteredResultsScreen] Fetching results with:', { searchQuery, apiFilters });

      // Call the filter API
      const results = await applyFilters(searchQuery, apiFilters);
      console.log('✅ [FilteredResultsScreen] API Response results:', {
        hasProducts: !!results?.products,
        productsCount: results?.products?.length || 0,
        hasRestaurants: !!results?.restaurants,
        restaurantsCount: results?.restaurants?.length || 0,
        rawResults: results // Log full results for debugging
      });

      const restaurantsList = Array.isArray(results?.restaurants) ? results.restaurants : [];
      const restaurantRatingMap = new Map();

      restaurantsList.forEach(restaurant => {
        const restaurantId = String(restaurant?._id || restaurant?.id || '');
        if (!restaurantId) {
          return;
        }

        const resolvedAverage = parseNumeric(
          restaurant?.rating?.average ?? restaurant?.ratingAverage ?? restaurant?.restaurantRating ?? restaurant?.rating
        );
        const resolvedCount = parseNumeric(
          restaurant?.rating?.count ?? restaurant?.ratingCount ?? restaurant?.restaurantRatingCount
        );

        restaurantRatingMap.set(restaurantId, {
          ratingAverage: resolvedAverage,
          ratingCount: resolvedCount,
        });
      });

      // Map results for display - Prioritize Restaurants as requested by user
      if (results?.restaurants && Array.isArray(results.restaurants) && results.restaurants.length > 0) {
        console.log('🏘️ [FilteredResultsScreen] Mapping restaurants for display');
        
        let restaurantsToMap = results.restaurants;

        // --- STRICT FRONTEND FILTERING CHAIN ---
        
        // 1. Rating Filter
        if (drawerFilters?.rating) {
          const minRating = parseFloat(drawerFilters.rating);
          console.log(`⭐ [Filter] Applying Min Rating: ${minRating}`);
          restaurantsToMap = restaurantsToMap.filter(rest => {
            const rating = parseFloat(rest.rating?.average || rest.ratingAverage || 0);
            const match = rating >= minRating;
            const restName = rest.name?.en || rest.name || 'Unknown';
            if (!match) console.log(`   ❌ [Rating] ${restName}: ${rating} < ${minRating}`);
            return match;
          });
        }

        // 2. Price Range Filter
        if (drawerFilters?.minPrice !== undefined || drawerFilters?.maxPrice !== undefined) {
          const min = drawerFilters.minPrice || 0;
          const max = drawerFilters.maxPrice || 5000;
          console.log(`💰 [Filter] Applying Price Range: ${min}-${max}`);
          restaurantsToMap = restaurantsToMap.filter(rest => {
            const cost = parseFloat(rest.averageCost || rest.costForTwo || rest.price || 0);
            const match = cost >= min && cost <= max;
            const restName = rest.name?.en || rest.name || 'Unknown';
            if (!match) console.log(`   ❌ [Price] ${restName}: ${cost} not in ${min}-${max}`);
            return match;
          });
        }

        // 2.5 Cost For Two Filter
        if (drawerFilters?.costForTwo) {
          const range = drawerFilters.costForTwo;
          let min = 0;
          let max = 100000;
          if (range === '0-200') { max = 200; }
          else if (range === '200-500') { min = 200; max = 500; }
          else if (range === '500-1000') { min = 500; max = 1000; }
          else if (range === '1000+') { min = 1000; }
          
          console.log(`💰 [Filter] Applying Cost For Two: ${min}-${max}`);
          restaurantsToMap = restaurantsToMap.filter(rest => {
            const rawCost = rest.averageCost || rest.costForTwo || rest.price || 0;
            const cost = parseFloat(String(rawCost).replace(/[^0-9.]/g, '')) || 0;
            const match = cost >= min && cost <= max;
            const restName = rest.name?.en || rest.name || 'Unknown';
            if (!match) console.log(`   ❌ [CostForTwo] ${restName}: ${cost} not in ${min}-${max}`);
            return match;
          });
        }

        // 3. Fast Delivery (< 30 mins)
        if (drawerFilters?.timeFilter === 'fast_delivery') {
          console.log('⏱️ [Filter] Applying Fast Delivery (<30m)');
          restaurantsToMap = restaurantsToMap.filter(rest => {
            const rawTime = rest.deliveryTime;
            let match = false;
            if (rawTime) {
              if (typeof rawTime === 'string' && rawTime.includes('-')) {
                const parts = rawTime.split('-');
                const upperLimit = parseInt(parts[1] || parts[0]);
                match = !isNaN(upperLimit) && upperLimit < 30;
              } else {
                const time = parseInt(rawTime);
                match = !isNaN(time) && time < 30;
              }
            }
            const restName = rest.name?.en || rest.name || 'Unknown';
            if (!match) console.log(`   ❌ [Time] ${restName}: ${rawTime} > 30`);
            return match;
          });
        }

        // 4. Free Delivery
        if (drawerFilters?.offers?.includes('free_delivery')) {
          console.log('🚚 [Filter] Applying Free Delivery');
          restaurantsToMap = restaurantsToMap.filter(rest => {
            const fee = parseFloat(rest.deliveryFee ?? rest.delivery_fee ?? NaN);
            const isFree = fee === 0 || rest.freeDelivery === true || rest.hasFreeDelivery === true;
            const restName = rest.name?.en || rest.name || 'Unknown';
            if (!isFree) console.log(`   ❌ [Fee] ${restName}: fee=${fee}`);
            return isFree;
          });
        }

        // 5. Radius / Nearby Filter
        if (drawerFilters?.isNearby || drawerFilters?.radius) {
          const maxRadius = drawerFilters.radius || 5;
          console.log(`📍 [Filter] Applying Radius: ${maxRadius}km`);
          restaurantsToMap = restaurantsToMap.filter(rest => {
            const dist = parseFloat(rest.distanceKm || rest.distance || rest.dist || 0);
            const match = dist <= maxRadius;
            const restName = rest.name?.en || rest.name || 'Unknown';
            if (!match) console.log(`   ❌ [Distance] ${restName}: ${dist}km > ${maxRadius}km`);
            return match;
          });
        }

        // 6. Food Preference (Veg/Non-Veg/Vegan)
        if (drawerFilters?.foodPreference && drawerFilters.foodPreference.length > 0) {
          const selectedPrefs = drawerFilters.foodPreference;
          console.log(`🥬 [Filter] Applying Preferences: ${selectedPrefs.join(', ')}`);
          restaurantsToMap = restaurantsToMap.filter(rest => {
            const resPref = String(rest.foodPreference || rest.foodType || rest.type || '').toLowerCase();
            const isVeg = rest.isVeg;
            
            return selectedPrefs.some(pref => {
              if (pref === 'veg') {
                return isVeg === true || resPref === 'veg' || resPref === 'pure_veg' || resPref === 'both';
              } else if (pref === 'non_veg' || pref === 'non-veg') {
                return isVeg === false || resPref === 'non_veg' || resPref === 'non-veg' || resPref === 'both' || resPref === 'meat';
              } else if (pref === 'vegan') {
                return resPref === 'vegan';
              }
              return false;
            });
          });
        }

        // 7. Cuisines Filter
        if (drawerFilters?.cuisines && drawerFilters.cuisines.length > 0) {
          const selected = drawerFilters.cuisines.map(c => c.toLowerCase());
          console.log(`🍜 [Filter] Applying Cuisines: ${selected.join(', ')}`);
          restaurantsToMap = restaurantsToMap.filter(rest => {
            const resCuisines = (rest.cuisines || rest.cuisine || []).map(c => String(c).toLowerCase());
            const match = selected.some(s => resCuisines.includes(s));
            const restName = rest.name?.en || rest.name || 'Unknown';
            if (!match) console.log(`   ❌ [Cuisines] ${restName}: ${resCuisines.join(', ')} not in ${selected.join(', ')}`);
            return match;
          });
        }

        console.log(`✅ [Filter Results] ${restaurantsToMap.length} restaurants match all selected criteria.`);
        restaurantsToMap.forEach(r => console.log(`   🏠 [Final List Item] ${r.name?.en || r.name}`));

        const mappedRestaurants = restaurantsToMap.map(rest => {
          const restaurantId = rest._id || rest.id;
          return {
            ...rest,
            id: restaurantId,
            isRestaurant: true,
            // Ensure compatibility with RestaurantListCard
            name: rest.name?.en || rest.name,
            cuisines: rest.cuisine || [],
            image: rest.image || rest.bannerImage || '',
            ratingAverage: rest.rating?.average || rest.ratingAverage || 0,
            ratingCount: rest.rating?.count || rest.ratingCount || 0,
            deliveryTime: formatTimeAndDistance(rest), // Apply formatting here
            isOpen: rest.isActive !== false && rest.isTemporarilyClosed !== true,
          };
        });
        // Apply frontend sorting based on drawerFilters.sortBy
        const sortedRestaurants = applySorting(mappedRestaurants, drawerFilters?.sortBy || 'relevance');
        setFilteredItems(sortedRestaurants);
      } else if (results?.products && Array.isArray(results.products) && results.products.length > 0) {
        // Fallback to products if no restaurants found
        console.log('📦 [FilteredResultsScreen] No restaurants found, mapping products instead');
        const mappedProducts = results.products.map(product => {
          const restaurantId = String(product.restaurantId || product.restaurant?._id || product.restaurant || '');
          const restaurantRatingMeta = restaurantRatingMap.get(restaurantId);

          const restaurantRatingAverage = resolveRestaurantRatingAverage(product);
          const restaurantRatingCount = resolveRestaurantRatingCount(product);

          const finalRestaurantRatingAverage =
            restaurantRatingAverage !== null ? restaurantRatingAverage : (restaurantRatingMeta?.ratingAverage ?? null);
          const finalRestaurantRatingCount =
            restaurantRatingCount !== null ? restaurantRatingCount : (restaurantRatingMeta?.ratingCount ?? null);

          return {
            ...product,
            id: product._id || product.id, // Ensure product ID is set
            isRestaurant: false,
            name: product.name?.en || product.name,
            description: product.description?.en || product.description,
            price: product.basePrice,
            image: product.image,
            isVeg: product.isVeg,
            ratingAverage: finalRestaurantRatingAverage,
            ratingCount: finalRestaurantRatingCount,
            deliveryTime: formatTimeAndDistance(product), // Apply formatting here
            restaurant: {
              id: product.restaurantId || product.restaurant?._id || null,
              name: product.restaurantName?.en || product.restaurantName,
              image: product.restaurantImage,
              bannerImage: product.restaurantBannerImage,
              ratingAverage: finalRestaurantRatingAverage,
              ratingCount: finalRestaurantRatingCount,
            },
          };
        });

        // Apply frontend sorting based on drawerFilters.sortBy
        const sortedProducts = applySorting(mappedProducts, drawerFilters?.sortBy || 'relevance');
        setFilteredItems(sortedProducts);
      } else {
        setFilteredItems([]);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Fetch filtered results error:', error?.message);
        console.error('Error response:', error?.response?.data);
      }

      Toast.show({
        type: 'error',
        text1: t('common.error', 'Error'),
        text2: error?.message || t('filter_results.fetch_error', 'Failed to fetch filtered results'),
        duration: 2000,
      });

      // Don't go back on error, let user try again
    } finally {
      setIsLoading(false);
    }
  }, [
    searchQuery,
    drawerFilters,
    navigation,
    applySorting,
    parseNumeric,
    propsApiFilters,
    resolveRestaurantRatingAverage,
    resolveRestaurantRatingCount,
    t,
    formatTimeAndDistance,
    userLocation,
  ]);

  // Load more items
  const loadMoreItems = useCallback(() => {
    const newPageNum = pageNum + 1;
    const startIndex = newPageNum * itemsPerPage;

    if (startIndex < filteredItems.length) {
      setPageNum(newPageNum);
    }
  }, [pageNum, filteredItems.length]);

  // Paginated items
  const displayedItems = useMemo(() => {
    return filteredItems.slice(0, (pageNum + 1) * itemsPerPage);
  }, [filteredItems, pageNum]);

  // Handle restaurant press
  const handleRestaurantPress = useCallback((item) => {
    // If it's a restaurant, pass the item itself. If it's a product, pass the nested restaurant object.
    const restaurantData = item.isRestaurant ? item : item.restaurant;
    
    if (restaurantData) {
      navigation.navigate('RestaurantDetail', {
        restaurant: restaurantData,
      });
    } else {
      console.warn('⚠️ [FilteredResultsScreen] Could not find restaurant data for navigation');
    }
  }, [navigation]);

  // Handle back
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  React.useEffect(() => {
    fetchFilteredResults();
  }, [fetchFilteredResults]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Image 
            source={require('../assets/icons/Backarrow.png')} 
            style={styles.backIconImage} 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('filter_results.title', 'Filter Results')}</Text>
        <View style={styles.placeholder} />
      </View>



      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <FlatList
            data={Array(6).fill(null)}
            keyExtractor={(_, index) => `skeleton-${index}`}
            scrollEnabled={false}
            renderItem={() => <SkeletonCard />}
            contentContainerStyle={styles.listContent}
          />
        </View>
      ) : displayedItems.length > 0 ? (
        <FlatList
          data={displayedItems}
          keyExtractor={item => String(item.id)}
          scrollEnabled={true}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            item.isRestaurant ? (
              <RestaurantListCard
                item={item}
                onPress={() => handleRestaurantPress(item)}
              />
            ) : (
              <ProductCard
                item={item}
                onPress={() => handleRestaurantPress(item)}
              />
            )
          )}
          onEndReached={loadMoreItems}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            <View style={styles.footer}>
              {filteredItems.length > displayedItems.length && (
                <Text style={styles.loadMore}>
                  {t('filter_results.more_items', '{{count}} more items...', { count: filteredItems.length - displayedItems.length })}
                </Text>
              )}
            </View>
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>{t('filter_results.no_results_title', 'No Results Found')}</Text>
          <Text style={styles.emptyMessage}>
            {t('filter_results.no_results_message', 'No items matching your filters. Try adjusting your search criteria.')}
          </Text>
          <TouchableOpacity
            onPress={fetchFilteredResults}
          >
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4.44),
    paddingVertical: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    marginTop: scale(20),
  },
  backButton: {
    paddingVertical: hp(1),
    paddingHorizontal: wp(2),
  },
  backIconImage: {
    width: scale(22),
    height: scale(22),
    resizeMode: 'contain',
  },
  backText: {
    fontSize: FONT.md,
    fontWeight: '600',
    color: '#111111',
  },
  headerTitle: {
    fontSize: FONT.lg,
    fontWeight: '700',
    color: '#111111',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: wp(8),
  },
  filterInfo: {
    flexDirection: 'row',
    paddingHorizontal: wp(4.44),
    paddingVertical: hp(1),
    backgroundColor: '#F9F9F9',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  filterLabel: {
    fontSize: FONT.sm,
    fontWeight: '600',
    color: '#8E8E93',
  },
  filterValue: {
    fontSize: FONT.sm,
    color: '#111111',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: wp(4.44),
    paddingVertical: hp(1),
    paddingBottom: hp(5),
  },
  footer: {
    paddingVertical: hp(2),
    alignItems: 'center',
  },
  loadMore: {
    fontSize: FONT.sm,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(8),
  },
  emptyTitle: {
    fontSize: FONT.lg,
    fontWeight: '700',
    color: '#111111',
    marginBottom: hp(1),
  },
  emptyMessage: {
    fontSize: FONT.sm,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: hp(3),
  },
  retryButton: {
    paddingHorizontal: wp(8),
    paddingVertical: hp(1.5),
    backgroundColor: '#ed1c24',
    borderRadius: scale(8),
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: FONT.sm,
  },
});