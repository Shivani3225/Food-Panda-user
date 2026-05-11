// FILTER IMPLEMENTATION QUICK REFERENCE GUIDE

// ============================================
// 1. BASIC FILTER API CALL
// ============================================

import { applyFilters } from './src/services/filterService';

// Simple pizza filter with vegetarian option
const results = await applyFilters('pizza', {
  isVeg: true,
  minPrice: 100,
  maxPrice: 500
});

// ============================================
// 2. CONVERT DRAWER FILTERS TO API FORMAT
// ============================================

import { convertDrawerFiltersToAPI } from './src/services/filterService';

const drawerFilters = {
  selectedFood: {
    Vegetarian: true,
    Vegan: false,
    'Gluten Free': false,
    'Non Vegetarian': false
  },
  minPrice: '100',
  maxPrice: '500',
  rating: '4', // or 'all'
  area: 'Select area',
  radius: 'Select radius'
};

const apiFilters = convertDrawerFiltersToAPI(drawerFilters);
// Returns: { isVeg: true, minPrice: 100, maxPrice: 500, rating: '4' }

// ============================================
// 3. HANDLE IN HomePage.jsx
// ============================================

const handleApplyFilters = useCallback(async (drawerFilters) => {
  try {
    setIsLoadingFilters(true);
    
    const apiFilters = convertDrawerFiltersToAPI(drawerFilters);
    const searchQuery = currentSearchQuery || 'pizza';
    
    const results = await applyFilters(searchQuery, apiFilters);
    
    // Handle products from results
    if (results?.products && Array.isArray(results.products)) {
      const mappedProducts = results.products.map(product => ({
        ...product,
        id: product._id || product.id,
      }));
      
      setRestaurants(mappedProducts);
      setAllRestaurants(mappedProducts);
      setIsFilterApplied(true);
    }
  } catch (error) {
    console.error('Filter error:', error);
    Toast.show({
      type: 'error',
      text1: 'Filter Error',
      text2: error?.message || 'Failed to apply filters'
    });
  } finally {
    setIsLoadingFilters(false);
  }
}, [currentSearchQuery]);

// ============================================
// 4. API ENDPOINT FORMAT
// ============================================

// Full URL example:
// https://api.waseeny.de/api/search?q=pizza&isVeg=true&minPrice=100&maxPrice=500

// Query Parameters:
// - q: "pizza" (search query)
// - isVeg: true/false (vegetarian filter)
// - minPrice: 100 (minimum price)
// - maxPrice: 500 (maximum price)
// - rating: 4 (minimum rating, 1-5 or 'all')

// ============================================
// 5. EXPECTED RESPONSE
// ============================================

{
  results: {
    restaurants: [],
    products: [
      {
        _id: "product_id",
        name: { en: "Margherita Pizza" },
        description: { en: "Classic pizza" },
        image: "https://...",
        basePrice: 299,
        isVeg: true,
        restaurantId: "restaurant_id",
        restaurantName: { en: "My Restaurant" },
        restaurantImage: "https://...",
        restaurantBannerImage: "https://..."
      }
    ]
  }
}

// ============================================
// 6. FILTER COMBINATIONS
// ============================================

// Vegetarian pizzas under 300 rupees
await applyFilters('pizza', {
  isVeg: true,
  maxPrice: 300
});

// Non-vegetarian items, 4+ stars, 200-500 price
await applyFilters('burger', {
  isVeg: false,
  minPrice: 200,
  maxPrice: 500,
  rating: '4'
});

// All Gluten-free items (represented by isVeg=true filter)
await applyFilters('gluten-free', {
  isVeg: true
});

// ============================================
// 7. ERROR HANDLING
// ============================================

try {
  const results = await applyFilters('pizza', { isVeg: true });
  if (!results?.products || results.products.length === 0) {
    Toast.show({
      type: 'info',
      text1: 'No Results',
      text2: 'No items matching your filters'
    });
  }
} catch (error) {
  console.error('Filter error:', error);
  Toast.show({
    type: 'error',
    text1: 'Error',
    text2: error?.message || 'Failed to apply filters'
  });
}

// ============================================
// 8. STATE MANAGEMENT IN HomePage
// ============================================

const [isFilterApplied, setIsFilterApplied] = useState(false);
const [currentSearchQuery, setCurrentSearchQuery] = useState('');
const [isLoadingFilters, setIsLoadingFilters] = useState(false);

// When filter applied:
setIsFilterApplied(true);
setCurrentSearchQuery('pizza');
setIsLoadingFilters(true); // while API call

// When filter reset:
setIsFilterApplied(false);
setCurrentSearchQuery('');
setIsLoadingFilters(false);

// ============================================
// 9. FILTER DRAWER INTEGRATION
// ============================================

<FilterDrawer
  visible={isFilterOpen}
  onClose={() => setIsFilterOpen(false)}
  onReset={handleResetFilters}
  onApply={handleApplyFilters}
/>

// onApply receives drawerFilters object:
// {
//   selectedFood: { Vegetarian, Vegan, Gluten Free, Non Vegetarian },
//   rating: string,
//   minPrice: string,
//   maxPrice: string,
//   area: string,
//   radius: string
// }

// ============================================
// 10. COMPLETE EXAMPLE: APPLYING FILTERS
// ============================================

import { applyFilters, convertDrawerFiltersToAPI } from '../../services/filterService';

export const exampleFilterWorkflow = async () => {
  // Step 1: Get filter data from UI
  const userFilters = {
    selectedFood: {
      Vegetarian: true,
      Vegan: false,
      'Gluten Free': true,
      'Non Vegetarian': false
    },
    minPrice: '100',
    maxPrice: '500',
    rating: '4'
  };

  try {
    // Step 2: Convert to API format
    const apiFilters = convertDrawerFiltersToAPI(userFilters);
    console.log('API Filters:', apiFilters);
    // Output: { isVeg: true, minPrice: 100, maxPrice: 500, rating: '4' }

    // Step 3: Apply filters with search query
    const searchQuery = 'pizza';
    const results = await applyFilters(searchQuery, apiFilters);

    // Step 4: Handle results
    if (results?.products) {
      console.log(`Found ${results.products.length} items`);
      
      // Map products for display
      const displayItems = results.products.map(product => ({
        id: product._id,
        name: product.name.en,
        price: product.basePrice,
        restaurant: product.restaurantName.en,
        image: product.image
      }));

      // Step 5: Update state and display
      setRestaurants(displayItems);
      setIsFilterApplied(true);
      
      return displayItems;
    }
  } catch (error) {
    console.error('Filter failed:', error);
    throw error;
  }
};
