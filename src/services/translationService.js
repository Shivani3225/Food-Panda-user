import apiClient from '../config/apiClient';

// Cache: { "text::targetLang": "translatedText" }
const translationCache = new Map();

/**
 * Ek text ko target language mein translate karo
 */
export const translateText = async (text, targetLang) => {
  if (!text || !targetLang) return text || '';
  if (targetLang === 'en') return text;

  const cacheKey = `${text}::${targetLang}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  try {
    console.log(`📡 [TranslationService] Calling API: "${text}" → ${targetLang}`);
    const res = await apiClient.post('/api/translation/translate', {
      text,
      to: targetLang,
    });
    const translated = res?.data?.translatedText || text;
    console.log(`✅ [TranslationService] "${text}" → "${translated}"`);
    translationCache.set(cacheKey, translated);
    return translated;
  } catch (error) {
    console.warn(`❌ [TranslationService] Failed: "${text}" → ${targetLang}:`, error?.message);
    return text;
  }
};

/**
 * Multi-language object { en, de, ar } se current language ka text nikalo
 * Agar nahi milta to backend se translate karo
 */
export const getLocalizedTextAsync = async (value, lang = 'en') => {
  if (!value) return '';
  if (typeof value !== 'object') {
    const text = String(value);
    if (lang === 'en') return text;
    return await translateText(text, lang);
  }
  if (value[lang]) return value[lang];
  const sourceText = value.en || value.de || value.ar || '';
  if (!sourceText) return '';
  if (lang === 'en') return sourceText;
  return await translateText(sourceText, lang);
};

/**
 * Synchronous — cache se ya fallback
 */
export const getLocalizedText = (value, lang = 'en') => {
  if (!value) return '';
  if (typeof value !== 'object') return String(value);
  return value[lang] || value.en || value.de || value.ar || '';
};

/**
 * Kisi bhi string ya multi-lang object ko translate karo
 * @param {string|object} value
 * @param {string} lang
 */
export const translateField = async (value, lang) => {
  if (!value || lang === 'en') return getLocalizedText(value, lang);
  if (typeof value === 'object') {
    if (value[lang]) return value[lang];
    const src = value.en || value.de || value.ar || '';
    return src ? await translateText(src, lang) : '';
  }
  return await translateText(String(value), lang);
};

/**
 * Ek restaurant/item object ke specified fields ko translate karo
 * @param {object} obj - Object to translate
 * @param {string[]} fields - Fields to translate (e.g. ['name', 'description'])
 * @param {string} lang - Target language
 */
export const translateObject = async (obj, fields, lang) => {
  if (!obj || lang === 'en') return obj;
  const updates = {};
  await Promise.all(fields.map(async field => {
    if (obj[field]) {
      updates[field] = await translateField(obj[field], lang);
    }
  }));
  return { ...obj, ...updates };
};

/**
 * Array of objects ke specified fields translate karo
 * @param {object[]} arr
 * @param {string[]} fields
 * @param {string} lang
 */
export const translateArray = async (arr, fields, lang) => {
  if (!arr?.length || lang === 'en') return arr || [];
  return Promise.all(arr.map(item => translateObject(item, fields, lang)));
};

/**
 * Cache clear karo (language change hone par)
 */
export const clearTranslationCache = () => {
  translationCache.clear();
};
