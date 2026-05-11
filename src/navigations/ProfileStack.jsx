import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileHome from '../screens/Profile/ProfileHome';
import FaqScreen from '../screens/Profile/FaqScreen';
import NotificationSettings from '../screens/Profile/NotificationSettings';
import ContactSupport from '../screens/Profile/ContactSupport';
import ChangePasswordScreen from '../screens/Profile/ChangePasswordScreen';
import DeleteAccountPopUp from '../screens/Profile/DeleteAccountPopUp';
import ProfileEdit from '../screens/Profile/ProfileEdit';
import AddAddressScreen from '../screens/Profile/AddAddressScreen';
import AddressesScreen from '../screens/Profile/AddressesScreen';
import AddressFormScreen from '../screens/Profile/AddressFormScreen';
import PaymentSetting from '../screens/Profile/ProfilePaymentSet';
import PrivacyPolicy from '../screens/Profile/PrivacyPolicy';
import TermsConditionScreen from '../screens/Profile/TermsConditionScreen';
import DeleteAccountScreen from '../screens/Profile/DeleteAccountScreen';
import DeletionComplete from '../screens/Profile/DeletionComplete';
import NewAddress from '../screens/Profile/NewAddress';
import Coupons from '../screens/Profile/Coupons';
import WalletProfile from '../screens/Profile/WalletProfile';
import Favourite from '../screens/Favourite';
import RestaurantDetail from '../screens/Orders/RestaurantDetail';
import RatePastOrders from '../screens/Orders/RatePastOrders';
import OrderDetailsScreen from '../screens/Orders/OrderDetailsScreen';
import RealtimeDebugScreen from '../screens/Debug/RealtimeDebugScreen';
import TokenDebugScreen from '../screens/Debug/TokenDebugScreen';
import FoodPreference from '../screens/Onboarding/FoodPreference';

const Stack = createNativeStackNavigator();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={ProfileHome} />
      <Stack.Screen name="FaqScreen" component={FaqScreen} />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettings}
      />
      <Stack.Screen name="ContactSupport" component={ContactSupport} />
      <Stack.Screen
        name="ChangePasswordScreen"
        component={ChangePasswordScreen}
      />
      <Stack.Screen name="DeleteAccountPopUp" component={DeleteAccountPopUp} />

      {/* Profile shortcuts */}
      <Stack.Screen name="ProfileEdit" component={ProfileEdit} />
      <Stack.Screen name="AddressesScreen" component={AddressesScreen} />
      <Stack.Screen name="AddAddressScreen" component={AddAddressScreen} />
      <Stack.Screen name="AddressFormScreen" component={AddressFormScreen} />
      <Stack.Screen name="NewAddress" component={NewAddress} />
      <Stack.Screen name="PaymentSetting" component={PaymentSetting} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
      <Stack.Screen
        name="TermsConditionScreen"
        component={TermsConditionScreen}
      />
      <Stack.Screen
        name="DeleteAccountScreen"
        component={DeleteAccountScreen}
      />
      <Stack.Screen name="Coupons" component={Coupons} />
      <Stack.Screen name="WalletProfile" component={WalletProfile} />
      <Stack.Screen name="DeletionComplete" component={DeletionComplete} />
      <Stack.Screen name="Favourite" component={Favourite} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetail} />
      <Stack.Screen name="FoodPreference" component={FoodPreference} />
      <Stack.Screen name="RatePastOrders" component={RatePastOrders} />
      <Stack.Screen name="OrderDetailsScreen" component={OrderDetailsScreen} />
      <Stack.Screen name="RealtimeDebug" component={RealtimeDebugScreen} />
      <Stack.Screen name="TokenDebug" component={TokenDebugScreen} />
    </Stack.Navigator>
  );
}
