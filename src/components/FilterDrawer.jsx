import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Animated,
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  TextInput,
  Dimensions,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { wp, hp } from '../utils/responsive';
import { scale } from '../utils/scale';
import { Star, ArrowLeft } from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

const getSortOptions = (t) => [
  { id: 'relevance', label: t('filter.relevance', 'Relevance') },
  { id: 'delivery_time', label: t('filter.delivery_time', 'Delivery Time (Fastest)') },
  { id: 'rating_high_low', label: t('filter.rating_high_low', 'Rating (High to Low)') },
  { id: 'cost_low_high', label: t('filter.cost_low_high', 'Cost: Low to High') },
  { id: 'cost_high_low', label: t('filter.cost_high_low', 'Cost: High to Low') },
];

const getTimeFilterOptions = (t) => [
  { id: 'fast_delivery', label: t('filter.fast_delivery', 'Fast Delivery (< 30 mins)') },
  { id: 'schedule_order', label: t('filter.schedule_order', 'Schedule Order') },
];

const getRatingOptions = () => [
  { id: 4.5, label: '4.5 ⭐ & above' },
  { id: 4.0, label: '4.0 ⭐ & above' },
  { id: 3.5, label: '3.5 ⭐ & above' },
];

const getOfferOptions = (t) => [
  { id: 'b1g1', label: t('filter.buy1get1', 'Buy 1 Get 1') },
  { id: 'deals', label: t('filter.deals', 'Deals of the Day') },
  { id: 'free_delivery', label: t('filter.free_delivery', 'Free Delivery') },
];

const getCostOptions = () => [
  { id: '0-200', label: '₹', range: '0–200' },
  { id: '200-500', label: '₹₹', range: '200–500' },
  { id: '500-1000', label: '₹₹₹', range: '500–1000' },
  { id: '1000+', label: '₹₹₹₹', range: '1000+' },
];

const getFoodPreferenceOptions = (t) => [
  { id: 'veg', label: t('filter.veg', 'Veg Only') },
  { id: 'non_veg', label: t('filter.non_veg', 'Non-Veg') },
  { id: 'vegan', label: t('filter.vegan', 'Vegan') },
];

const getAdditionalFilterOptions = (t) => [
  { id: 'pure_veg', label: t('filter.pure_veg', 'Pure Veg Restaurants') },
  { id: 'open_now', label: t('filter.open_now', 'Open Now') },
  { id: 'outdoor_seating', label: t('filter.outdoor_seating', 'Outdoor Seating') },
  { id: 'new_on_platform', label: t('filter.new_on_platform', 'New on Platform') },
];

const getRadiusOptions = () => [
  { id: 1, label: '1 km' },
  { id: 3, label: '3 km' },
  { id: 5, label: '5 km' },
  { id: 10, label: '10 km' },
];

const MIN_PRICE_RANGE = 0;
const MAX_PRICE_RANGE = 5000;
const MIN_PRICE_GAP = 50;

export default function FilterDrawer({ visible, onClose, onReset, onApply }) {
  const { t } = useTranslation();
  const { currencySymbol } = useAuth();
  const translateX = useRef(new Animated.Value(screenWidth)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const drawerWidth = useMemo(() => Math.min(screenWidth, 360), []);

  const SORT_OPTIONS = useMemo(() => getSortOptions(t), [t]);

  const [minPrice, setMinPrice] = useState(MIN_PRICE_RANGE);
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE_RANGE);
  const [sortBy, setSortBy] = useState('relevance');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Filter States
  const [timeFilter, setTimeFilter] = useState(null);
  const [rating, setRating] = useState(null);
  const [offers, setOffers] = useState([]);
  const [costForTwo, setCostForTwo] = useState(null);
  const [foodPreference, setFoodPreference] = useState([]);
  const [additionalFilters, setAdditionalFilters] = useState([]);
  const [radius, setRadius] = useState(null);
  const [isNearby, setIsNearby] = useState(false);
  const [selectedCuisines, setSelectedCuisines] = useState([]);

  const CUISINE_OPTIONS = useMemo(() => [
    'Indian', 'Chinese', 'Italian', 'Burger', 'Pizza', 'Mexican', 'Thai', 'Continental'
  ], []);

  const TIME_OPTIONS = useMemo(() => getTimeFilterOptions(t), [t]);
  const RATING_OPTIONS = useMemo(() => getRatingOptions(), []);
  const OFFER_OPTIONS = useMemo(() => getOfferOptions(t), [t]);
  const COST_OPTIONS = useMemo(() => getCostOptions(), []);
  const FOOD_OPTIONS = useMemo(() => getFoodPreferenceOptions(t), [t]);
  const ADDITIONAL_OPTIONS = useMemo(() => getAdditionalFilterOptions(t), [t]);
  const RADIUS_OPTIONS = useMemo(() => getRadiusOptions(), []);

  useEffect(() => {
    if (visible) {
      translateX.setValue(screenWidth);
      overlayOpacity.setValue(0);

      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: screenWidth - drawerWidth,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(overlayOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: screenWidth,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, drawerWidth, translateX, overlayOpacity]);

  const handleReset = () => {
    setMinPrice(MIN_PRICE_RANGE);
    setMaxPrice(MAX_PRICE_RANGE);
    setSortBy('relevance');
    setSearchQuery('');
    setTimeFilter(null);
    setRating(null);
    setOffers([]);
    setCostForTwo(null);
    setFoodPreference([]);
    setAdditionalFilters([]);
    setRadius(null);
    setIsNearby(false);
    setSelectedCuisines([]);
    if (onReset) {
      onReset();
    }
  };

  const handleApply = () => {
    console.log('🔍 [FilterDrawer] Applying filters:', {
      searchQuery,
      sortBy,
      isNearby,
      radius,
      rating,
      offers,
      costForTwo,
      foodPreference,
      additionalFilters,
      selectedCuisines,
    });

    const safeMinPrice = Math.max(MIN_PRICE_RANGE, Number(minPrice) || MIN_PRICE_RANGE);
    const safeMaxPrice = Math.min(MAX_PRICE_RANGE, Number(maxPrice) || MAX_PRICE_RANGE);
    const normalizedMinPrice = Math.min(safeMinPrice, safeMaxPrice - MIN_PRICE_GAP);
    const normalizedMaxPrice = Math.max(safeMaxPrice, normalizedMinPrice + MIN_PRICE_GAP);

    const hasCustomPriceRange =
      normalizedMinPrice > MIN_PRICE_RANGE || normalizedMaxPrice < MAX_PRICE_RANGE;

    const filterData = {
      searchQuery: searchQuery.trim(),
      sortBy,
      minPrice: hasCustomPriceRange ? normalizedMinPrice : null,
      maxPrice: hasCustomPriceRange ? normalizedMaxPrice : null,
      timeFilter,
      rating,
      offers,
      costForTwo,
      foodPreference,
      additionalFilters,
      radius,
      isNearby,
      cuisines: selectedCuisines,
    };

    if (onApply) {
      onApply(filterData);
    }
    if (onClose) {
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: overlayOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View
        style={[
          styles.drawer,
          {
            width: drawerWidth,
            transform: [{ translateX }],
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={onClose} style={styles.headerBack}>
            <ArrowLeft size={24} color="#111111" strokeWidth={3} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('filter.filter', 'Filter')}</Text>
          <Pressable onPress={handleReset} hitSlop={10}>
            <Text style={styles.headerReset}>{t('filter.reset', 'Reset')}</Text>
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* SORT BY */}
          {/* <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('filter.sort_by', 'SORT BY')}</Text>
            <View style={styles.sortOptions}>
              {SORT_OPTIONS.map(option => {
                const isActive = sortBy === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setSortBy(option.id)}
                    style={[
                      styles.sortOption,
                      isActive && styles.sortOptionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.sortOptionText,
                        isActive && styles.sortOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View> */}

          {/* TIME FILTER */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('filter.time_filter', 'TIME FILTER')}</Text>
            <View style={styles.chipContainer}>
              {TIME_OPTIONS.map(option => {
                const isActive = timeFilter === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setTimeFilter(isActive ? null : option.id)}
                    style={[styles.chip, isActive && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* RESTAURANT RATING */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('filter.rating', 'RESTAURANT RATING')}</Text>
            <View style={styles.chipContainer}>
              {RATING_OPTIONS.map(option => {
                const isActive = rating === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setRating(isActive ? null : option.id)}
                    style={[styles.chip, isActive && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* OFFERS */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('filter.offers', 'OFFERS')}</Text>
            <View style={styles.chipContainer}>
              {OFFER_OPTIONS.map(option => {
                const isActive = offers.includes(option.id);
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => {
                      if (isActive) {
                        setOffers(offers.filter(o => o !== option.id));
                      } else {
                        setOffers([...offers, option.id]);
                      }
                    }}
                    style={[styles.chip, isActive && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* COST FOR TWO */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('filter.cost_for_two', 'COST FOR TWO')}</Text>
            <View style={styles.rangeButtonContainer}>
              {COST_OPTIONS.map(option => {
                const isActive = costForTwo === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setCostForTwo(isActive ? null : option.id)}
                    style={[styles.rangeButton, isActive && styles.rangeButtonActive]}
                  >
                    <Text style={[styles.rangeButtonLabel, isActive && styles.rangeButtonLabelActive]}>
                      {option.label}
                    </Text>
                    <Text style={[styles.rangeButtonText, isActive && styles.rangeButtonTextActive]}>
                      {option.range}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* FOOD PREFERENCE */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('filter.food_preference', 'FOOD PREFERENCE')}</Text>
            <View style={styles.chipContainer}>
              {FOOD_OPTIONS.map(option => {
                const isActive = foodPreference.includes(option.id);
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => {
                      if (isActive) {
                        setFoodPreference(foodPreference.filter(p => p !== option.id));
                      } else {
                        setFoodPreference([...foodPreference, option.id]);
                        if (option.id === 'non_veg') {
                          setAdditionalFilters(prev => prev.filter(f => f !== 'pure_veg'));
                        }
                      }
                    }}
                    style={[styles.chip, isActive && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ADDITIONAL FILTERS */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('filter.additional', 'ADDITIONAL FILTERS')}</Text>
            <View style={styles.chipContainer}>
              {ADDITIONAL_OPTIONS.map(option => {
                const isActive = additionalFilters.includes(option.id);
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => {
                      if (isActive) {
                        setAdditionalFilters(additionalFilters.filter(f => f !== option.id));
                      } else {
                        setAdditionalFilters([...additionalFilters, option.id]);
                        if (option.id === 'pure_veg' && foodPreference === 'non_veg') {
                          setFoodPreference(null);
                        }
                      }
                    }}
                    style={[styles.chip, isActive && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* LOCATION FILTER */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('filter.location', 'LOCATION FILTER')}</Text>
            <View style={styles.nearbyRow}>
              <Text style={styles.nearbyText}>{t('filter.nearby', 'Nearby Restaurants')}</Text>
              <Switch
                value={isNearby}
                onValueChange={setIsNearby}
                trackColor={{ false: '#767577', true: '#ed1c24' }}
                thumbColor={isNearby ? '#f4f3f4' : '#f4f3f4'}
              />
            </View>
            
            <Text style={[styles.cardTitle, { marginTop: 15 }]}>{t('filter.radius', 'Area Radius')}</Text>
            <View style={styles.chipContainer}>
              {RADIUS_OPTIONS.map(option => {
                const isActive = radius === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setRadius(isActive ? null : option.id)}
                    style={[styles.chip, isActive && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* CUISINES */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('filter.cuisines', 'CUISINES')}</Text>
            <View style={styles.chipContainer}>
              {CUISINE_OPTIONS.map(cuisine => {
                const isActive = selectedCuisines.includes(cuisine);
                return (
                  <Pressable
                    key={cuisine}
                    onPress={() => {
                      if (isActive) {
                        setSelectedCuisines(selectedCuisines.filter(c => c !== cuisine));
                      } else {
                        setSelectedCuisines([...selectedCuisines, cuisine]);
                      }
                    }}
                    style={[styles.chip, isActive && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {cuisine}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>



          <Pressable style={styles.searchBtn} onPress={handleApply}>
            <Text style={styles.searchBtnText}>{t('filter.search', 'Search')}</Text>
          </Pressable>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    paddingTop: Platform.OS === 'ios' ? 56 : 28,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerBack: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F2',
  },
  backIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111111',
  },
  headerReset: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ed1c24',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111111',
    backgroundColor: '#F9F9F9',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 10,
  },
  sortOptions: {
    gap: 8,
  },
  sortOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
  },
  sortOptionActive: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFECEC',
  },
  sortOptionText: {
    fontSize: 13,
    color: '#6E6E6E',
    fontWeight: '500',
  },
  sortOptionTextActive: {
    color: '#FF3B30',
    fontWeight: '700',
  },
  sliderContainer: {
    marginBottom: 16,
    gap: 16,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#6E6E6E',
    marginBottom: 6,
    fontWeight: '500',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderValueText: {
    fontSize: 13,
    color: '#FF6B35',
    fontWeight: '700',
    marginTop: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 36,
    width: (screenWidth - 120) / 2,
  },
  currency: {
    color: '#6E6E6E',
    fontSize: 13,
  },
  priceInput: {
    flex: 1,
    paddingLeft: 4,
    fontSize: 13,
    color: '#111111',
    paddingVertical: 0,
  },
  priceDash: {
    color: '#6E6E6E',
    fontSize: 16,
    paddingHorizontal: 8,
  },
  searchBtn: {
    marginTop: 6,
    marginBottom: 20,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F2',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  chipActive: {
    backgroundColor: '#FFF0F0',
    borderColor: '#ed1c24',
  },
  chipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#ed1c24',
    fontWeight: '600',
  },
  rangeButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  rangeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F2F2F2',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  rangeButtonActive: {
    backgroundColor: '#FFF0F0',
    borderColor: '#ed1c24',
  },
  rangeButtonLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  rangeButtonLabelActive: {
    color: '#ed1c24',
  },
  rangeButtonText: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  rangeButtonTextActive: {
    color: '#ed1c24',
  },
  nearbyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  nearbyText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});