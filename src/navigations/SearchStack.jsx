import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Search from '../screens/Search/Search';
import RestaurantDetail from '../screens/Orders/RestaurantDetail';
import Favourite from '../screens/Favourite';

const Stack = createNativeStackNavigator();

export default function SearchStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SearchHome" component={Search} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetail} />
      <Stack.Screen name="Favourite" component={Favourite} />
    </Stack.Navigator>
  );
}
