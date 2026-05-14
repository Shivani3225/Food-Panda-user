import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../screens/Onboarding/SplashScreen';
import LanguageSelectScreen from '../screens/Onboarding/LanguageSelectScreen';
import OnBoarding from '../screens/Onboarding/OnBoarding';
import ForgetPass from '../screens/Auth/ForgetPass';
import CreatePassword from '../screens/Auth/CreatePassword';
import Verify from '../screens/Auth/Verify';
import LoginScreen from '../screens/Auth/LoginScreen';
import Signup from '../screens/Auth/Signup';
import FoodPreference from '../screens/Onboarding/FoodPreference';
import HomePage from '../screens/Home/HomePage.jsx';
import PrivacyPolicy from '../screens/Profile/PrivacyPolicy';
import TermsConditionScreen from '../screens/Profile/TermsConditionScreen';
import TabNavigator from './TabNavigator';
import { useAuth } from '../context/AuthContext';
import TrackOrder from '../screens/Orders/TrackOrder';

const Stack = createNativeStackNavigator();



export default function AppNavigator() {
  const { isAuthenticated, loading: isLoading, user } = useAuth();
  
  console.log('[AppNavigator] Auth State:', { 
    isAuthenticated, 
    isLoading, 
    hasUser: !!user,
    userName: user?.name 
  });

  // Show loading state
  if (isLoading) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Auth Stack - User NOT logged in
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="LanguageSelect" component={LanguageSelectScreen} />
            <Stack.Screen name="OnBoarding" component={OnBoarding} />
            <Stack.Screen name="LoginScreen" component={LoginScreen} />
            <Stack.Screen name="Signup" component={Signup} />
            <Stack.Screen name="ForgetPass" component={ForgetPass} />
            <Stack.Screen name="CreatePassword" component={CreatePassword} />
            <Stack.Screen name="Verify" component={Verify} />
            <Stack.Screen name="FoodPreference" component={FoodPreference} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
            <Stack.Screen name="TrackOrder" component={TrackOrder} />
            <Stack.Screen
              name="TermsConditionScreen"
              component={TermsConditionScreen}
            />
          </>
        ) : (
          // App Stack - User IS logged in
          <>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen name="FoodPreference" component={FoodPreference} />
            <Stack.Screen name="LoginScreen" component={LoginScreen} />
            <Stack.Screen name="Signup" component={Signup} />
            <Stack.Screen name="ForgetPass" component={ForgetPass} />
            <Stack.Screen name="CreatePassword" component={CreatePassword} />
            <Stack.Screen name="Verify" component={Verify} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
