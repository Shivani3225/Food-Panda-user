import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomePage from '../screens/Home/HomePage.jsx';
import FilteredResultsScreen from '../screens/FilteredResultsScreen';
import RestaurantDetail from '../screens/Orders/RestaurantDetail';
import CartScreen from '../screens/Cart';
import Favourite from '../screens/Favourite';
import ReviewOrderScreen from '../screens/ReviewOrderScreen';
import OrderDetailsScreen from '../screens/Orders/OrderDetailsScreen';
import NotificationSettings from '../screens/Profile/NotificationSettings';
import HomeNotifications from '../screens/Home/HomeNotifications';
import RecommendedRestaurants from '../screens/Home/RecommendedRestaurants';
import RequestRefundScreen from '../screens/Orders/RequestRefundScreen';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomePage" component={HomePage} />

      <Stack.Screen name="FilteredResults" component={FilteredResultsScreen} />

      <Stack.Screen name="RestaurantDetail" component={RestaurantDetail} />

      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Favourite" component={Favourite} />
      <Stack.Screen name="ReviewOrderScreen" component={ReviewOrderScreen} />
      <Stack.Screen name="OrderDetailsScreen" component={OrderDetailsScreen} />
      <Stack.Screen name="HomeNotifications" component={HomeNotifications} />
      <Stack.Screen name="RecommendedRestaurants" component={RecommendedRestaurants} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettings} />
      <Stack.Screen name="RequestRefundScreen" component={RequestRefundScreen} />
    </Stack.Navigator>
  );
}
