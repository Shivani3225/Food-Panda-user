import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import AppNavigator from './src/navigations/AppNavigator';
import { CartProvider } from './src/context/CartContext';
import { FavouritesProvider } from './src/context/FavouritesContext';
import { AuthProvider } from './src/context/AuthContext';
import { NetworkProvider } from './src/context/NetworkContext';
import { CountryProvider } from './src/context/CountryContext';
import { LocationProvider } from './src/context/LocationContext';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/components/Toasters/popup';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import OfflineBanner from './src/components/OfflineBanner';
import './src/locales/i18n';
import { STRIPE_PUBLISHABLE_KEY } from '@env';
import apiClient from './src/config/apiClient';

const App = () => {
  const [publishableKey, setPublishableKey] = useState(STRIPE_PUBLISHABLE_KEY);

  useEffect(() => {
    const fetchKey = async () => {
      try {
        const res = await apiClient.get('/api/settings');
        if (res.data?.paymentSettings?.stripePublishableKey) {
          setPublishableKey(res.data.paymentSettings.stripePublishableKey);
          console.log('✅ Loaded dynamic Stripe publishable key:', res.data.paymentSettings.stripePublishableKey);
        }
      } catch (e) {
        console.log('⚠️ Failed to load dynamic publishable key, using env fallback:', e.message);
      }
    };
    fetchKey();
  }, []);

  return (
    <StripeProvider publishableKey={publishableKey}>
      <SafeAreaProvider>
        <NetworkProvider>
          <AuthProvider>
            <LocationProvider>
              <CountryProvider>
              <CartProvider>
                <FavouritesProvider>
                  <OfflineBanner />
                  <AppNavigator />
                  <Toast 
                    config={toastConfig} 
                    topOffset={Platform.OS === 'ios' ? 60 : 40}
                    bottomOffset={60}
                  />
                </FavouritesProvider>
              </CartProvider>
              </CountryProvider>
            </LocationProvider>
          </AuthProvider>
        </NetworkProvider>
      </SafeAreaProvider>
    </StripeProvider>
  );
};

export default App;