import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Search as SearchIcon, RotateCcw, X } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';
import { searchRestaurantsAndProducts, getSearchSuggestions } from '../../services/searchService';
import { getRestaurantDetails } from '../../services/restaurantService';
import { translateText } from '../../services/translationService';
import { wp, hp } from '../../utils/responsive';
import { scale, fontScale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';
import { useLocation } from '../../context/LocationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FALLBACK_IMAGE = require('../../assets/images/Noodle.png');
const SEARCH_DEBOUNCE_DELAY = 500;
const RECENT_SEARCHES_KEY = '@recent_searches';

export default function SearchScreen() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en';
  const { currencySymbol } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const inputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const skipDebounceRef = useRef(false);
  const abortControllerRef = useRef(null);
  const { location, address } = useLocation();
  const currentRequestIdRef = useRef(0);
  
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ restaurants: [], products: [] });
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [fetchingRestaurantId, setFetchingRestaurantId] = useState(null);

  // Load recent searches from storage
  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const saved = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  };

  const saveRecentSearches = async (searches) => {
    try {
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
    } catch (error) {
      console.error('Failed to save recent searches:', error);
    }
  };

  const addToRecentSearches = (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length === 0) return;
    
    const trimmedTerm = searchTerm.trim();
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item !== trimmedTerm);
      const updated = [trimmedTerm, ...filtered].slice(0, 5);
      saveRecentSearches(updated);
      return updated;
    });
  };

  const clearRecentSearches = async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const removeRecentSearch = async (searchTerm) => {
    const updated = recentSearches.filter(item => item !== searchTerm);
    setRecentSearches(updated);
    await saveRecentSearches(updated);
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        console.log('🧹 Cleaning up - Aborting all in-flight requests');
        abortControllerRef.current.abort();
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        if (abortControllerRef.current) {
          console.log('📴 Screen blur - Aborting in-flight requests');
          abortControllerRef.current.abort();
        }
        setQuery('');
        setSuggestions([]);
      };
    }, []),
  );

  useEffect(() => {
    if (route?.params?.autoFocus) {
      const timer = setTimeout(() => {
        inputRef.current?.focus?.();
      }, 80);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [route?.params?.autoFocus]);

  // Handle initial category/query from route params
  useEffect(() => {
    const initialQuery = route?.params?.initialQuery || route?.params?.category;
    if (initialQuery) {
      console.log('📂 Category selected:', initialQuery);
      skipDebounceRef.current = true;
      setQuery(initialQuery);
      triggerSearch(initialQuery);
    }
  }, [route?.params?.initialQuery, route?.params?.category]);

  // Function to trigger search immediately (used for category clicks)
  const triggerSearch = async (searchQuery) => {
    if (searchQuery.trim().length === 0) return;

    try {
      if (abortControllerRef.current) {
        console.log('❌ Cancelling previous search request...');
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const currentRequestId = ++currentRequestIdRef.current;
      
      setLoading(true);
      const trimmedQuery = searchQuery.trim();
      console.log('🔍 Instant search for:', trimmedQuery, '(Request #' + currentRequestId + ')');
      
      const locationParams = {
        lat: location?.latitude,
        lng: location?.longitude,
        city: address?.city
      };

      try {
        console.log('💡 Fetching suggestions...');
        const suggestionPromise = getSearchSuggestions(trimmedQuery, locationParams);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(t('search.suggestions_timeout', 'Suggestions timeout'))), 3000)
      );
      const sug = await Promise.race([suggestionPromise, timeoutPromise]);
        
        if (currentRequestId === currentRequestIdRef.current && !abortControllerRef.current.signal.aborted) {
          console.log('✅ Suggestions fetched:', sug?.length || 0);
          if (sug?.length > 0) {
            console.log('🔍 [Search] Raw suggestion[0]:', JSON.stringify(sug[0], null, 2));
          }
          setSuggestions(Array.isArray(sug) ? sug : []);
        }
      } catch (sugError) {
        if (currentRequestId === currentRequestIdRef.current && !abortControllerRef.current.signal.aborted) {
          console.warn('⚠️ Suggestions error (non-blocking):', sugError?.message);
          setSuggestions([]);
        }
      }
      
      try {
        console.log('🍽️ Fetching search results...');
        const resultsPromise = searchRestaurantsAndProducts(trimmedQuery, {}, locationParams);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error(t('search.search_timeout', 'Search timeout'))), 5000)
        );
        const results = await Promise.race([resultsPromise, timeoutPromise]);
        
        if (currentRequestId === currentRequestIdRef.current && !abortControllerRef.current.signal.aborted) {
          console.log('✅ Search results fetched:', {
            restaurants: results?.results?.restaurants?.length || 0,
            products: results?.results?.products?.length || 0,
          });
          if (results?.results?.restaurants?.length > 0) {
            console.log('🔍 [Search] Raw restaurant[0]:', JSON.stringify(results.results.restaurants[0], null, 2));
          }
          if (results?.results?.products?.length > 0) {
            console.log('🔍 [Search] Raw product[0]:', JSON.stringify(results.results.products[0], null, 2));
          }
          setSearchResults({
            restaurants: results?.results?.restaurants || [],
            products: results?.results?.products || [],
          });
        }
      } catch (searchError) {
        if (currentRequestId === currentRequestIdRef.current && !abortControllerRef.current.signal.aborted) {
          console.error('❌ Search error:', searchError?.message);
          setSearchResults({ restaurants: [], products: [] });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Debounce search with proper request cancellation
  useEffect(() => {
    if (skipDebounceRef.current) {
      skipDebounceRef.current = false;
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (abortControllerRef.current) {
      console.log('❌ Cancelling previous debounced search...');
      abortControllerRef.current.abort();
    }

    searchTimeoutRef.current = setTimeout(async () => {
      if (query.trim().length > 0) {
        try {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
          abortControllerRef.current = new AbortController();
          const currentRequestId = ++currentRequestIdRef.current;

          setLoading(true);
          const trimmedQuery = query.trim();
          console.log('🔍 Debounced search for:', trimmedQuery, '(Request #' + currentRequestId + ')');
          
          try {
            console.log('💡 Fetching suggestions...');
            const locationParams = {
              lat: location?.latitude,
              lng: location?.longitude,
              city: address?.city
            };
            
            const suggestionPromise = getSearchSuggestions(trimmedQuery, locationParams);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error(t('search.suggestions_timeout', 'Suggestions timeout'))), 3000)
            );
            const sug = await Promise.race([suggestionPromise, timeoutPromise]);
            
            if (currentRequestId === currentRequestIdRef.current && !abortControllerRef.current.signal.aborted) {
              console.log('✅ Suggestions fetched:', sug?.length || 0);
              setSuggestions(Array.isArray(sug) ? sug : []);
            }
          } catch (sugError) {
            if (currentRequestId === currentRequestIdRef.current && !abortControllerRef.current.signal.aborted) {
              console.warn('⚠️ Suggestions error (non-blocking):', sugError?.message);
              setSuggestions([]);
            }
          }
          
          try {
            console.log('🍽️ Fetching search results...');
            const resultsPromise = searchRestaurantsAndProducts(trimmedQuery, {}, {
              lat: location?.latitude,
              lng: location?.longitude,
              city: address?.city
            });
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error(t('search.search_timeout', 'Search timeout'))), 5000)
            );
            const results = await Promise.race([resultsPromise, timeoutPromise]);
            
            if (currentRequestId === currentRequestIdRef.current && !abortControllerRef.current.signal.aborted) {
              console.log('✅ Search results fetched:', {
                restaurants: results?.results?.restaurants?.length || 0,
                products: results?.results?.products?.length || 0,
              });
              setSearchResults({
                restaurants: results?.results?.restaurants || [],
                products: results?.results?.products || [],
              });
            }
          } catch (searchError) {
            if (currentRequestId === currentRequestIdRef.current && !abortControllerRef.current.signal.aborted) {
              console.error('❌ Search error:', searchError?.message);
              setSearchResults({ restaurants: [], products: [] });
            }
          }
        } catch (error) {
          console.error('❌ Unexpected error:', error?.message);
          setSearchResults({ restaurants: [], products: [] });
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      } else {
        setSuggestions([]);
        setSearchResults({ restaurants: [], products: [] });
      }
    }, SEARCH_DEBOUNCE_DELAY);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, t]);

  // Combine results: suggestions first, then full search results
  const results = useMemo(() => {
    if (query.trim().length === 0) return [];

    const list = [];
    const addedIds = new Set();

    if (Array.isArray(suggestions) && suggestions.length > 0) {
      console.log('📋 Adding suggestions to results:', suggestions.length);
      suggestions.forEach(suggestion => {
        try {
          if (!suggestion || !suggestion.id) {
            console.warn('⚠️ Invalid suggestion:', suggestion);
            return;
          }

          if (addedIds.has(suggestion.id)) return;
          addedIds.add(suggestion.id);

          if (suggestion.type === 'restaurant') {
            list.push({
              type: 'restaurant',
              id: suggestion.id,
              restaurant: suggestion,
              title: suggestion.text || suggestion.name?.[currentLang] || suggestion.name?.en || suggestion.name,
              subtitle: suggestion.cuisines?.join(', ') || t('search.restaurant', 'Restaurant'),
              image: suggestion.image,
              isFromSuggestions: true,
            });
          } else if (suggestion.type === 'dish') {
            const restaurantId = 
              suggestion?.restaurantId || 
              suggestion?.restaurant_id;

            list.push({
              type: 'dish',
              id: suggestion.id,
              product: {
                ...suggestion,
                restaurantId: restaurantId,
              },
              title: suggestion.text || suggestion.name?.[currentLang] || suggestion.name?.en || suggestion.name,
              subtitle: suggestion.restaurantName?.[currentLang] || suggestion.restaurantName?.en || suggestion.restaurantName || t('search.dish', 'Dish'),
              image: suggestion.image,
              isFromSuggestions: true,
            });
          }
        } catch (err) {
          console.warn('⚠️ Error processing suggestion:', err?.message, suggestion);
        }
      });
    }

    if (Array.isArray(searchResults.restaurants)) {
      searchResults.restaurants.forEach(restaurant => {
        if (!restaurant?._id) {
          console.warn('⚠️ Restaurant missing _id:', restaurant);
          return;
        }

        if (addedIds.has(restaurant._id)) return;
        addedIds.add(restaurant._id);

        list.push({
          type: 'restaurant',
          id: restaurant._id,
          restaurant,
          title: restaurant.name?.[currentLang] || restaurant.name?.en || restaurant.name,
          subtitle: restaurant.cuisines?.join(', ') || t('search.restaurant', 'Restaurant'),
          image: restaurant.image,
        });
      });
    }

    if (Array.isArray(searchResults.products)) {
      searchResults.products.forEach(product => {
        if (!product?._id) {
          console.warn('⚠️ Product missing _id:', product);
          return;
        }

        if (addedIds.has(product._id)) return;
        addedIds.add(product._id);

        const restaurantId = 
          product?.restaurantId || 
          product?.restaurant_id || 
          product?.restaurant?._id ||
          product?.restaurant?.id;

        if (!restaurantId) {
          console.warn('⚠️ Product missing restaurantId:', product?.name);
        }

        list.push({
          type: 'dish',
          id: product._id,
          product: {
            ...product,
            restaurantId: restaurantId,
          },
          title: product.name?.[currentLang] || product.name?.en || product.name,
          subtitle: product.restaurantName?.[currentLang] || product.restaurantName?.en || product.restaurant?.name?.[currentLang] || product.restaurant?.name?.en || t('search.dish', 'Dish'),
          image: product.image,
          price: product.basePrice,
        });
      });
    }

    console.log('📊 Final results count:', list.length);
    console.log(`🌐 [Search] Lang:${currentLang} | Sample titles:`, list.slice(0, 3).map(i => i.title));
    return list;
  }, [query, suggestions, searchResults, t, currentLang]);

  // Translated results — async translate titles when language is not 'en'
  const [translatedResults, setTranslatedResults] = useState([]);

  useEffect(() => {
    if (currentLang === 'en' || results.length === 0) {
      setTranslatedResults(results);
      return;
    }

    let cancelled = false;

    const translateAll = async () => {
      const translated = await Promise.all(
        results.map(async (item) => {
          try {
            const translatedTitle = await translateText(item.title, currentLang);
            const translatedSubtitle = item.subtitle
              ? await translateText(item.subtitle, currentLang)
              : item.subtitle;
            return { ...item, title: translatedTitle, subtitle: translatedSubtitle };
          } catch {
            return item;
          }
        })
      );
      if (!cancelled) {
        console.log(`✅ [Search] Translated ${translated.length} results to ${currentLang}`);
        setTranslatedResults(translated);
      }
    };

    translateAll();
    return () => { cancelled = true; };
  }, [results, currentLang]);

  const handleResultPress = async (item) => {
    addToRecentSearches(item.title);

    if (item.type === 'restaurant' && item.restaurant) {
      console.log('🍽️ Navigating to restaurant:', item.restaurant.name?.en || item.restaurant.name);
      
      navigation.getParent?.()
        ? navigation.getParent().navigate('Home', {
            screen: 'RestaurantDetail',
            params: { restaurant: item.restaurant },
          })
        : navigation.navigate('RestaurantDetail', {
            restaurant: item.restaurant,
          });
    } else if (item.type === 'dish' && item.product) {
      let restaurantId = 
        item.product?.restaurantId || 
        item.product?.restaurant_id || 
        item.restaurantId || 
        item.restaurant_id;
      
      console.log('📦 Dish product structure:', {
        hasRestaurantId: !!item.product?.restaurantId,
        hasRestaurantId_snake: !!item.product?.restaurant_id,
        allProductKeys: Object.keys(item.product || {}),
        productData: item.product,
      });

      if (!restaurantId) {
        console.error('❌ No restaurantId found in dish data:', item);
        Toast.show({
          type: 'topError',
          text1: t('search.restaurant_info_missing_title', 'Restaurant Info Missing'),
          text2: t('search.restaurant_info_missing_message', 'Could not find restaurant information for this dish. Please try another dish or search.'),
          position: 'top',
        });
        return;
      }

      try {
        setFetchingRestaurantId(item.id);
        console.log('📍 Fetching restaurant details for dish (ID:', restaurantId, ')');
        
        const restaurantData = await getRestaurantDetails(restaurantId);
        
        console.log('✅ Restaurant details fetched:', restaurantData?.name?.en || restaurantData?.name);
        
        navigation.getParent?.()
          ? navigation.getParent().navigate('Home', {
              screen: 'RestaurantDetail',
              params: { 
                restaurant: restaurantData,
                initialProductId: item.product?._id || item.product?.id || item.id
              },
            })
          : navigation.navigate('RestaurantDetail', {
              restaurant: restaurantData,
              initialProductId: item.product?._id || item.product?.id || item.id
            });
      } catch (error) {
        console.error('❌ Error fetching restaurant details:', error?.message);
        Toast.show({
          type: 'topError',
          text1: t('common.error', 'Error'),
          text2: t('search.load_restaurant_failed', 'Failed to load restaurant details. Please try again.'),
          position: 'top',
        });
      } finally {
        setFetchingRestaurantId(null);
      }
    }
  };

  const handleTagPress = (tag) => {
    skipDebounceRef.current = true;
    setQuery(tag);
    triggerSearch(tag);
    addToRecentSearches(tag);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* UPDATED HEADER - Removed Back Button & Increased Font Size */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('search.title', 'Search')}</Text>
      </View>

      <View style={styles.contentWrapper}>
        {/* SEARCH BAR */}
        <View style={styles.searchBox}>
          <SearchIcon size={22} color="#9E9E9E" />
          <TextInput
            placeholder={t('search.placeholder', 'Search Dish name & Restaurant...')}
            placeholderTextColor="#9E9E9E"
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            ref={inputRef}
          />
          {query.length > 0 ? (
            <TouchableOpacity
              style={styles.clearBtn}
              activeOpacity={0.8}
              onPress={() => {
                if (abortControllerRef.current) {
                  console.log('❌ Clear button - Aborting in-flight requests');
                  abortControllerRef.current.abort();
                  abortControllerRef.current = null;
                }
                if (searchTimeoutRef.current) {
                  clearTimeout(searchTimeoutRef.current);
                  searchTimeoutRef.current = null;
                }
                setQuery('');
                setSuggestions([]);
                setSearchResults({ restaurants: [], products: [] });
              }}
            >
              <X size={18} color="#9E9E9E" />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {query.trim().length > 0 ? (
            <>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#FF3D3D" />
                  <Text style={styles.loadingText}>{t('search.searching', 'Searching...')}</Text>
                </View>
              ) : results.length === 0 ? (
                <Text style={styles.emptyText}>{t('search.no_results', 'No results found.')}</Text>
              ) : (
                <>
                  <Text style={styles.sectionTitle}>
                    {t('search.results', 'Results')} ({translatedResults.length})
                  </Text>
                  {translatedResults.map(item => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.resultRow}
                      activeOpacity={0.85}
                      onPress={() => handleResultPress(item)}
                      disabled={fetchingRestaurantId === item.id}
                    >
                      <Image
                        source={
                          item.image && typeof item.image === 'string'
                            ? { uri: item.image }
                            : FALLBACK_IMAGE
                        }
                        style={styles.resultImage}
                      />
                      <View style={styles.resultContent}>
                        <Text style={styles.resultTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.resultSub} numberOfLines={1}>
                          {item.subtitle}
                        </Text>
                        {typeof item.price === 'number' ? (
                          <Text style={styles.resultPrice}>
                            {currencySymbol} {item.price.toFixed(0)}
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.resultTypeContainer}>
                        {fetchingRestaurantId === item.id ? (
                          <ActivityIndicator size="small" color="#FF3D3D" />
                        ) : (
                          <Text style={styles.resultType}>
                            {item.type === 'restaurant' 
                              ? t('search.restaurant_type', 'Restaurant') 
                              : t('search.dish_type', 'Dish')}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </>
          ) : (
            <>
              {/* RECENT SEARCHES SECTION */}
              {recentSearches.length > 0 && (
                <View style={styles.recentSection}>
                  <View style={styles.recentHeader}>
                    <Text style={styles.sectionTitle}>
                      {t('search.recent_searches', 'Your Recent Searches')}
                    </Text>
                    <TouchableOpacity onPress={clearRecentSearches}>
                      <Text style={styles.clearAllText}>
                        {t('search.clear_all', 'Clear All')}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {recentSearches.map((search, index) => (
                    <TouchableOpacity
                      key={String(index)}
                      style={styles.recentItem}
                      activeOpacity={0.8}
                      onPress={() => {
                        setQuery(search);
                        triggerSearch(search);
                      }}
                    >
                      <View style={styles.recentIconContainer}>
                        <RotateCcw size={16} color="#6E6E6E" />
                      </View>
                      <Text style={styles.recentText}>{search}</Text>
                      <TouchableOpacity
                        style={styles.removeRecentBtn}
                        onPress={() => removeRecentSearch(search)}
                      >
                        <X size={14} color="#9E9E9E" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* POPULAR SEARCHES SECTION */}
              <View style={styles.popularSection}>
                <Text style={[styles.sectionTitle, { marginTop: 0 }]}>
                  {t('search.popular_searches', 'Popular Searches')}
                </Text>

                <View style={styles.tagWrapper}>
                  <Tag
                    label={t('search.pizza_tag', 'Pizza')}
                    onPress={() => handleTagPress('Pizza')}
                  />
                  <Tag
                    label={t('search.burger_tag', 'Burger')}
                    onPress={() => handleTagPress('Burger')}
                  />
                  <Tag
                    label={t('search.margherita_tag', 'Margherita')}
                    onPress={() => handleTagPress('Margherita')}
                  />
                  <Tag
                    label={t('search.italian_tag', 'Italian')}
                    onPress={() => handleTagPress('Italian')}
                  />
                  <Tag
                    label={t('search.fast_food_tag', 'Fast Food')}
                    onPress={() => handleTagPress('Fast Food')}
                  />
                  <Tag
                    label={t('search.spicy_wings_tag', 'Spicy Wings')}
                    onPress={() => handleTagPress('Spicy Wings')}
                  />
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/* TAG COMPONENT */
const Tag = ({ label, onPress }) => (
  <TouchableOpacity style={styles.tag} activeOpacity={0.8} onPress={onPress}>
    <Text style={styles.tagText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: hp(7),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backBtn: {
    width: scale(32),
    height: scale(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: scale(22),
    height: scale(22),
    resizeMode: 'contain',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontScale(20),
    fontWeight: '600',
    color: '#111',
  },
  headerRightSpace: {
    width: scale(32),
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: hp(2),
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: scale(52),
    borderRadius: scale(26),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: scale(14),
    marginBottom: SPACING.xxl,
  },

  input: {
    flex: 1,
    marginLeft: scale(10),
    fontSize: fontScale(15),
    color: '#000',
    paddingVertical: 0,
  },
  
  clearBtn: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6E6E6E',
    marginBottom: SPACING.md,
  },

  recentSection: {
    marginBottom: SPACING.xxl,
  },

  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },

  clearAllText: {
    fontSize: fontScale(13),
    color: '#FF3D3D',
    fontWeight: '500',
  },

  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(14),
    paddingVertical: scale(4),
  },

  recentIconContainer: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  recentText: {
    flex: 1,
    marginLeft: scale(10),
    fontSize: 14,
    color: '#000',
  },

  removeRecentBtn: {
    padding: scale(6),
  },

  popularSection: {
    marginBottom: SPACING.xxl,
  },

  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(40),
  },

  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.xs,
    color: '#6E6E6E',
  },

  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  
  resultImage: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(10),
    backgroundColor: '#F4F4F4',
  },
  
  resultContent: {
    flex: 1,
    marginLeft: scale(10),
  },
  
  resultTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: '#111',
  },
  
  resultSub: {
    marginTop: scale(2),
    fontSize: fontScale(10),
    color: '#6E6E6E',
  },
  
  resultPrice: {
    marginTop: scale(4),
    fontSize: fontScale(10),
    color: '#111',
    fontWeight: '600',
  },
  
  resultType: {
    fontSize: fontScale(8),
    color: '#9E9E9E',
  },
  
  resultTypeContainer: {
    minWidth: scale(50),
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  
  emptyText: {
    fontSize: fontScale(10),
    color: '#9E9E9E',
    marginBottom: scale(10),
  },

  tagWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(10),
  },

  tag: {
    backgroundColor: '#FFECEC',
    paddingHorizontal: scale(14),
    paddingVertical: scale(6),
    borderRadius: scale(6),
  },

  tagText: {
    fontSize: fontScale(14),
    fontWeight: '500',
    color: '#000',
  },
});