import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import i18n from 'i18next';

const normalizeObjectLiteral = (value) => {
  if (!value || typeof value !== 'string') return null;

  try {
    const withQuotedKeys = value.replace(/([{,]\s*)([a-zA-Z_$][\w$]*)(\s*:)/g, '$1"$2"$3');
    return JSON.parse(withQuotedKeys);
  } catch {
    const keyMatch = value.match(/(?:^|[\s,{])(en|de|ar|label|name|title|text|message)\s*:\s*("([^"]*)"|'([^']*)')/i);
    if (keyMatch) {
      const key = keyMatch[1];
      const extractedValue = keyMatch[3] ?? keyMatch[4] ?? '';
      return { [key]: extractedValue };
    }

    const firstQuotedValue = value.match(/"([^"]*)"|'([^']*)'/);
    if (firstQuotedValue) {
      return { en: firstQuotedValue[1] ?? firstQuotedValue[2] ?? '' };
    }

    return null;
  }
};

// Helper function to get current language
const getCurrentLanguage = () => {
  return i18n.language || 'en';
};

// Helper function to translate text if it's a translation key
const translateIfNeeded = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  // Check if text is a translation key (starts with common prefixes)
  const isTranslationKey = text.startsWith('common.') || 
    text.startsWith('order_rating.') || 
    text.startsWith('cart.') || 
    text.startsWith('rating.') ||
    text.startsWith('auth.') ||
    text.startsWith('validation.') ||
    text.startsWith('restaurant.') ||
    text.startsWith('reviews.') ||
    text.startsWith('feedback.') ||
    text.startsWith('image_uploader.') ||
    text.startsWith('issues.') ||
    text.startsWith('conflict.') ||
    text.startsWith('coupon.') ||
    text.startsWith('delete_confirmation.') ||
    text.startsWith('delivery.');
  
  if (isTranslationKey && i18n.exists(text)) {
    return i18n.t(text);
  }
  
  return text;
};

const sanitizeLocalizedObjectLiterals = (text) => {
  if (typeof text !== 'string' || !text.includes('{')) return translateIfNeeded(text) || '';

  return text.replace(/\{[^{}]*\}/g, (match) => {
    const parsed = normalizeObjectLiteral(match);
    if (!parsed || typeof parsed !== 'object') return match;

    const resolved = normalizeToastText(parsed);
    return resolved || match;
  });
};

const normalizeToastText = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return sanitizeLocalizedObjectLiterals(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (Array.isArray(value)) {
    return value
      .map(item => normalizeToastText(item))
      .filter(Boolean)
      .join(', ');
  }

  if (typeof value === 'object') {
    // First try to get translation for current language
    const currentLang = getCurrentLanguage();
    const currentLangValue = normalizeToastText(value?.[currentLang]);
    if (currentLangValue) return currentLangValue;
    
    // Fallback to prioritized keys
    const prioritizedKeys = ['en', 'de', 'ar', 'label', 'name', 'title', 'text', 'message'];

    for (const key of prioritizedKeys) {
      const candidate = normalizeToastText(value?.[key]);
      if (candidate) return candidate;
    }

    const firstValue = Object.values(value).find(item => item !== null && item !== undefined);
    return normalizeToastText(firstValue);
  }

  return '';
};

// Helper to create toast config with translation support
const createToastConfig = (type, stylesObj) => {
  return ({ text1 = '', text2 = '', props = {} } = {}) => {
    // Translate text1 and text2 if they are translation keys
    const translatedText1 = translateIfNeeded(text1);
    const translatedText2 = translateIfNeeded(text2);
    
    const title = normalizeToastText(translatedText1);
    const message = normalizeToastText(translatedText2);
    const isError = type === 'topError' || type === 'error';

    return (
      <View style={[stylesObj.container, isError && stylesObj.errorContainer]}>
        {props?.showLoader !== false && type !== 'info' && type !== 'topError' && type !== 'error' && (
          <ActivityIndicator size="small" color="#ed1c24" style={stylesObj.loader} />
        )}
        <View style={stylesObj.textWrap}>
          {!!title && <Text style={[stylesObj.title, isError && stylesObj.errorTitle]}>{title}</Text>}
          {!!message && <Text style={stylesObj.message}>{message}</Text>}
        </View>
        <TouchableOpacity
          onPress={() => Toast.hide()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={stylesObj.closeBtn}
        >
          <Text style={stylesObj.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  };
};

// Define styles first
const styles = StyleSheet.create({
  container: {
    width: '92%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  textWrap: {
    flex: 1,
    paddingRight: 10,
  },
  loader: {
    marginRight: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  message: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    fontSize: 14,
    color: '#999',
  },
  errorContainer: {
    borderColor: '#FCA5A5',
  },
  errorTitle: {
    color: '#B91C1C',
  },
});

// Then create toast config using the defined styles
export const toastConfig = {
  topSuccess: createToastConfig('topSuccess', styles),
  success: createToastConfig('success', styles),
  topError: createToastConfig('topError', styles),
  error: createToastConfig('error', styles),
  info: createToastConfig('info', styles),
};

export default toastConfig;