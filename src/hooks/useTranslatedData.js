import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { translateText, translateField } from '../services/translationService';

/**
 * Single text translate karo
 * @param {string|object} value - Plain string ya {en, de, ar} object
 * @returns {string} translated text
 */
export const useTranslatedText = (value) => {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const srcText = typeof value === 'object'
    ? (value?.[lang] || value?.en || value?.de || value?.ar || '')
    : (value || '');

  const [translated, setTranslated] = useState(srcText);
  const prevRef = useRef({ value: null, lang: null });

  useEffect(() => {
    if (!srcText) { setTranslated(''); return; }
    if (lang === 'en') { setTranslated(srcText); return; }
    // Already translated same value+lang
    if (prevRef.current.value === srcText && prevRef.current.lang === lang) return;

    // Agar object mein lang key hai to directly use karo
    if (typeof value === 'object' && value?.[lang]) {
      setTranslated(value[lang]);
      prevRef.current = { value: srcText, lang };
      return;
    }

    let cancelled = false;
    translateText(srcText, lang).then(result => {
      if (!cancelled) {
        setTranslated(result);
        prevRef.current = { value: srcText, lang };
      }
    });
    return () => { cancelled = true; };
  }, [srcText, lang]);

  return translated;
};

/**
 * Array of strings translate karo
 * @param {string[]} arr
 * @returns {string[]} translated array
 */
export const useTranslatedArray = (arr) => {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const [translated, setTranslated] = useState(arr || []);

  useEffect(() => {
    if (!arr?.length) { setTranslated([]); return; }
    if (lang === 'en') { setTranslated(arr); return; }

    let cancelled = false;
    Promise.all(arr.map(item => {
      const src = typeof item === 'object'
        ? (item?.[lang] || item?.en || item?.de || item?.ar || '')
        : String(item || '');
      if (!src) return Promise.resolve('');
      if (typeof item === 'object' && item?.[lang]) return Promise.resolve(item[lang]);
      return translateText(src, lang);
    })).then(results => {
      if (!cancelled) setTranslated(results);
    });
    return () => { cancelled = true; };
  }, [JSON.stringify(arr), lang]);

  return translated;
};

/**
 * Object ke specific fields translate karo
 * @param {object} obj
 * @param {string[]} fields - e.g. ['name', 'description']
 * @returns {object} translated object
 */
export const useTranslatedObject = (obj, fields) => {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const [translated, setTranslated] = useState(obj);

  useEffect(() => {
    if (!obj) { setTranslated(null); return; }
    if (lang === 'en') { setTranslated(obj); return; }

    let cancelled = false;
    const updates = {};
    Promise.all(fields.map(async field => {
      if (obj[field]) {
        updates[field] = await translateField(obj[field], lang);
      }
    })).then(() => {
      if (!cancelled) setTranslated({ ...obj, ...updates });
    });
    return () => { cancelled = true; };
  }, [JSON.stringify(obj), lang]);

  return translated;
};
