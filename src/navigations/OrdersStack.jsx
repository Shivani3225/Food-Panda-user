import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OrdersPage from '../screens/Orders/OrdersPage';
import OrderDetailsScreen from '../screens/Orders/OrderDetailsScreen';
import RestaurantDetail from '../screens/Orders/RestaurantDetail';
import TrackOrder from '../screens/Orders/TrackOrder';
import RatePastOrders from '../screens/Orders/RatePastOrders';
import ChatScreen from '../screens/Orders/ChatScreen';
import RequestRefundScreen from '../screens/Orders/RequestRefundScreen';

const Stack = createNativeStackNavigator();

export default function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrdersHome" component={OrdersPage} />
      <Stack.Screen name="OrderDetailsScreen" component={OrderDetailsScreen} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetail} />
      <Stack.Screen name="TrackOrder" component={TrackOrder} />
      <Stack.Screen name="RatePastOrders" component={RatePastOrders} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} />
      <Stack.Screen name="RequestRefundScreen" component={RequestRefundScreen} />
    </Stack.Navigator>
  );
}