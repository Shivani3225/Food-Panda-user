import React from 'react';
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

// Your Stripe publishable key
// IMPORTANT: Re-copy this from Stripe Dashboard. It looks too long/malformed.
const STRIPE_PUBLISHABLE_KEY = "pk_live_51SyGTiC3ztosLCHOUsZzE11TFVPLeLYG0yHAoBdhfisZcb16N1U46YSgZLys2UOLL1tULBHU13zdGd9JypVZJM8500oiAmRSeJ";

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
                  <Toast config={toastConfig} />
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