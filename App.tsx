import React from 'react';
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

const App = () => {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
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