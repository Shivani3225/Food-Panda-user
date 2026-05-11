// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import en from './en.json';
import de from './de.json';
import ar from './ar.json';

const LANGUAGE_KEY = '@app_language';

// Custom detector for React Native
const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage) {
        callback(savedLanguage);
      } else {
        // Fallback to device language
        const RNLocalize = require('react-native-localize');
        const locales = RNLocalize.getLocales();
        const deviceLang = locales[0]?.languageCode || 'en';
        callback(deviceLang);
      }
    } catch (error) {
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lng);
    } catch (error) {
      console.log('Error saving language:', error);
    }
  }
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
      ar: { translation: ar }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already safes from XSS
      defaultVariables: {
        currencySymbol: '€'
      }
    },
    react: {
      useSuspense: false, // Better for React Native
    }
  });

export const updateI18nVariables = (variables) => {
  i18n.options.interpolation.defaultVariables = {
    ...i18n.options.interpolation.defaultVariables,
    ...variables
  };
};

export default i18n;