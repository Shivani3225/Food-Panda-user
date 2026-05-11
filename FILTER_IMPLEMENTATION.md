# Filter Implementation Documentation

## Overview
The filter system is now fully integrated with the homepage. Users can apply filters for vegetarian items, price range, and ratings. The filters work by making an API request to the `/api/search` endpoint with query parameters.

## API Endpoint
```
GET {{BASE_URL}}/api/search?q=pizza&isVeg=true&minPrice=100&maxPrice=500
```

### Query Parameters
- `q` (string, required): Search query (e.g., "pizza", "burger")
- `isVeg` (boolean, optional): Filter vegetarian items (true/false)
- `minPrice` (number, optional): Minimum price filter
- `maxPrice` (number, optional): Maximum price filter
- `rating` (number, optional): Minimum rating filter

## Response Structure
The API returns an object with a `results` property containing:
```json
{
  "results": {
    "restaurants": [],
    "products": [
      {
        "_id": "product_id",
        "name": {
          "en": "Product Name"
        },
        "description": {
          "en": "Product Description"
        },
        "image": "image_url",
        "basePrice": 299,
        "isVeg": true,
        "variations": [],
        "addOns": [],
        "seasonal": false,
        "restaurantId": "restaurant_id",
        "restaurantName": {
          "en": "Restaurant Name"
        },
        "restaurantImage": "restaurant_image_url",
        "restaurantBannerImage": "banner_image_url"
      }
    ]
  }
}
```

## Implementation Details

### 1. Filter Service (`src/services/filterService.js`)
Provides utilities for applying filters:

#### `applyFilters(query, filters)`
Main function to apply filters via API
```javascript
const results = await applyFilters('pizza', {
  isVeg: true,
  minPrice: 100,
  maxPrice: 500,
  rating: 4
});
```

#### `convertDrawerFiltersToAPI(drawerFilters)`
Converts UI filter format to API format
```javascript
const apiFilters = convertDrawerFiltersToAPI({
  selectedFood: {
    Vegetarian: true,
    Vegan: false,
    'Gluten Free': true,
    'Non Vegetarian': false
  },
  minPrice: '120',
  maxPrice: '900',
  rating: 'all'
});
```

### 2. HomePage Component Updates
Modified `src/screens/Home/HomePage.jsx` with:

#### New State Variables
- `isFilterApplied`: Tracks if filters are currently applied
- `currentSearchQuery`: Stores the current search query
- `isLoadingFilters`: Shows loading state while filters are being applied

#### New Handler Functions

##### `handleApplyFilters(drawerFilters)`
- Converts drawer filters to API format
- Calls the filter API
- Updates restaurants list with filtered results
- Shows success/error toast notifications
- Sets `isFilterApplied` to true

##### `handleResetFilters()`
- Clears all filter states
- Reloads home data to restore original restaurants
- Sets `isFilterApplied` to false
- Shows success toast notification

### 3. FilterDrawer Component
The existing FilterDrawer component now properly connects to the HomePage handlers:
- `onApply`: Calls `handleApplyFilters` with filter data
- `onReset`: Calls `handleResetFilters`
- `onClose`: Closes the filter drawer

## Filter Data Flow

```
User Opens Filter > FilterDrawer Opens
↓
User Selects Filters > Food Type, Price Range, Rating
↓
User Presses "Search" > handleApplyFilters()
↓
convertDrawerFiltersToAPI() > Format filters for API
↓
applyFilters(query, filters) > Call API
↓
Receive Results > Products from API
↓
Update restaurants state > Display filtered results
↓
Show Toast Notification > Success/Error message
```

## Usage Example

### Applying Filters
```javascript
// When user clicks "Search" in FilterDrawer
import { applyFilters, convertDrawerFiltersToAPI } from '../../services/filterService';

const drawerFilters = {
  selectedFood: {
    Vegetarian: true,
    Vegan: false,
    'Gluten Free': true,
    'Non Vegetarian': false
  },
  minPrice: '100',
  maxPrice: '500',
  rating: '4',
};

const apiFilters = convertDrawerFiltersToAPI(drawerFilters);
// {
//   isVeg: true,
//   minPrice: 100,
//   maxPrice: 500,
//   rating: '4'
// }

const results = await applyFilters('pizza', apiFilters);
// Response: { restaurants: [], products: [...] }
```

### Resetting Filters
```javascript
// When user clicks "Reset" in FilterDrawer
// Calls handleResetFilters() which:
// 1. Clears all filter state
// 2. Reloads original home data
// 3. Shows success message
```

## Key Features

✅ **Vegetarian Filter**: Filter items by food preference (Vegetarian, Vegan, Gluten-Free, Non-Vegetarian)
✅ **Price Range**: Filter by minimum and maximum price
✅ **Rating Filter**: Filter by minimum rating (1-5 stars)
✅ **Search Query**: Works with any search query (pizza, burger, etc.)
✅ **Toast Notifications**: Success/error feedback for user actions
✅ **Loading States**: Visual feedback while filters are being applied
✅ **Error Handling**: Graceful error handling with user-friendly messages
✅ **Filter Reset**: One-click reset to show all restaurants again

## Error Handling

The implementation includes comprehensive error handling:
- Network errors are caught and displayed as toast notifications
- Missing required fields are handled gracefully
- Invalid filter values are converted to appropriate defaults
- Console logging for debugging

## Testing

### Test Case 1: Apply Vegetarian Pizza Filter
1. Open homepage
2. Tap "Filter" button
3. Select "Vegetarian" in Food Preference
4. Enter price range: 100-500
5. Tap "Search"
6. Should see vegetarian pizza items only

### Test Case 2: Reset Filters
1. With filters applied, tap "Filter" button
2. Tap "Reset"
3. Should see all restaurants again

### Test Case 3: Multiple Filters
1. Select "Vegetarian" and "Gluten Free"
2. Set price: 200-800
3. Select 4-5 stars rating
4. Tap "Search"
5. Should see items matching all criteria

## Supported Filter Combinations

- Vegetarian items with price range
- Non-vegetarian items with price range
- Vegan items with rating filter
- Gluten-free items with all other filters
- Any combination of the above

## Notes

- Default search query is "pizza" if none is specified
- Filter results are displayed as a list replacing the regular restaurants
- The system gracefully handles empty results
- Toast notifications provide user feedback
- All filters are optional - users can apply partial filters
