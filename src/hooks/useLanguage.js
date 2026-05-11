import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import { clearTranslationCache } from '../services/translationService';

export const useLanguage = () => {
  const { t, i18n } = useTranslation();

  const changeLanguage = async (langCode) => {
    // Translation cache clear karo taaki naye language ke liye fresh translate ho
    clearTranslationCache();

    await i18n.changeLanguage(langCode);
    await AsyncStorage.setItem('@app_language', langCode);

    // Handle RTL for Arabic
    const isRTL = langCode === 'ar';
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
    }
  };

  const currentLanguage = i18n.language;

  return {
    t,
    currentLanguage,
    changeLanguage,
    isRTL: currentLanguage === 'ar',
  };
};
