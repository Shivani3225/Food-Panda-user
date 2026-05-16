import React, { useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  StatusBar,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import apiClient from '../../config/apiClient';
import { USER_ROUTES } from '../../config/routes';
import { getHomeData } from '../../services/homeService';
import { convertDrawerFiltersToAPI } from '../../services/filterService';
import { translateText } from '../../services/translationService';
import Geolocation from '@react-native-community/geolocation';
import { CartContext } from '../../context/CartContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FavouritesContext } from '../../context/FavouritesContext';
import { AuthContext, useAuth } from '../../context/AuthContext';
import { Filter } from 'lucide-react-native';
import { useLocation } from '../../context/LocationContext';
import FilterDrawer from '../../components/FilterDrawer';
import Offers from './Offers';
import PickupScreen from './PickupScreen';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wp, hp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES as FONT } from '../../theme/typography';
import { getRatingAverage, getRatingCount } from '../../utils/ratingUtils';
import { getAddressFromCoordinates, calculateDistance } from '../../utils/locationUtils';
import { HomeHeader } from '../../components/Home/HomeHeader';
import { FoodCategoryList } from '../../components/Home/FoodCategoryList';
import { PromoCardList } from '../../components/Home/PromoCardList';
import { RestaurantListCard, RestaurantRecommendCard } from '../../components/Home/RestaurantCard';
import { SkeletonCard, SkeletonRecommendCard } from '../../components/Home/SkeletonLoaders';
import LocationPopup from '../../components/Home/LocationPopup';

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { width } = useWindowDimensions();
  const isSmallDevice = width < 360;
  const { isAuthenticated, authenticatedUser, setAuthenticatedUser } = useAuth() || {};
  const [restaurants, setRestaurants] = useState([]);
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [recommendedRestaurants, setRecommendedRestaurants] = useState([]);
  const [banners, setBanners] = useState([]);
  const [tabs, setTabs] = useState([
    t('home.restaurants', 'Restaurants'),
    t('home.offers', 'Offers'),
    t('home.pickup', 'Pick-up')
  ]);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(true);
  const isInitialLoadDone = useRef(false);
  const [activeTab, setActiveTab] = useState(t('home.restaurants', 'Restaurants'));
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { 
    location: globalLocation, 
    address: globalAddress, 
    gpsLocation,
    gpsAddress,
    permissionStatus, 
    isLoading: isLocationLoading,
    selectedAddress: lockedAddress,
    setSelectedAddress
  } = useLocation();
  const [userLocation, setUserLocation] = useState(null);
  const hasLocationPermission = permissionStatus === 'granted';
  const [pageNum, setPageNum] = useState(0);
  const itemsPerPage = 8;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [addressLabel, setAddressLabel] = useState(t('home.loading_location', 'Loading Location...')); // Initial state: Loading Current Location
  const [addressLine, setAddressLine] = useState(t('home.loading_address', 'loading address...')); // Initial state: Loading address details
  const [userData, setUserData] = useState(null);
  const [currentSearchQuery, setCurrentSearchQuery] = useState('');
  const { cartCount, setAddress: setCartAddress } = useContext(CartContext);
  const { isFavourite, toggleFavourite } = useContext(FavouritesContext);
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const hasAppliedSelectedAddressParam = useRef(false); // New ref to track param application
  const selectedAddressParam = route?.params?.selectedAddress;

  // Location Popup states
  const [isLocationPopupVisible, setIsLocationPopupVisible] = useState(false);
  const [currentCityName, setCurrentCityName] = useState('');
  const [defaultAddressInfo, setDefaultAddressInfo] = useState(null);
  const hasCheckedDistance = useRef(false);

  // Robust Image URL handling with Fallback - Moved to component level
  const getImageUrl = useCallback((img, type = 'Image') => {
    // Local placeholder image for reliability
    const localPlaceholder = require('../../assets/images/Food.png');

    if (!img || String(img).trim() === '') {
      return localPlaceholder;
    }

    const trimmed = String(img).trim();


    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return { uri: trimmed };
    }

    const baseUrl = apiClient.defaults.baseURL.replace(/\/+$/, '');
    const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return { uri: `${baseUrl}${path}` };
  }, []);

  // Memoize map restaurant function - STABLE VERSION
  const mapRestaurant = useCallback((item) => {
    const lang = i18n.language || 'en';

    const getName = (val) => {
      if (!val) return t('home.restaurant', 'Restaurant');
      if (typeof val === 'object') return val[lang] || val.en || val.de || val.ar || t('home.restaurant', 'Restaurant');
      return String(val);
    };

    const ratingAverage = getRatingAverage(item);
    const ratingCount = getRatingCount(item);

    // Distance calculation
    let rawDistance = item.distanceKm ?? item.distance ?? item.dist ?? item.location?.distance;
    const numericDist = typeof rawDistance === 'string' ? parseFloat(rawDistance) : Number(rawDistance);
    const hasValidDist = rawDistance != null && !isNaN(numericDist);

    const restaurantImage = getImageUrl(item.image, 'Restro-Icon');
    const restaurantBanner = getImageUrl(item.bannerImage || item.image, 'Restro-Banner');

    return {
      ...item,
      id: item._id || item.id,
      name: getName(item.name),
      cuisines: item.cuisine || [],
      image: restaurantImage,
      bannerImage: restaurantBanner,
      coverImage: restaurantBanner,
      ratingAverage,
      ratingCount,
      numericDist,
      hasValidDist,
      deliveryTime: (() => {
        const timeValue = item.deliveryTime;
        let timePart = '';
        if (!timeValue) timePart = `30-40 ${t('home.min', 'min')}`;
        else {
          const tVal = parseInt(timeValue);
          if (isNaN(tVal)) timePart = `${timeValue} ${t('home.min', 'min')}`;
          else {
            const lower = Math.max(10, Math.floor(tVal / 10) * 10);
            const upper = lower + 10;
            timePart = `${lower}-${upper} ${t('home.min', 'min')}`;
          }
        }
        const distPart = hasValidDist ? ` • 📍 ${numericDist.toFixed(1)} ${t('home.km', 'km')}` : '';
        return `🕒 ${timePart}${distPart}`;
      })(),
      isOpen: item.isActive === true && item.isTemporarilyClosed !== true,
      bestSeller: item.bestSeller || t('home.best_seller', 'Best Seller'),
    };
  }, [t, i18n.language, getImageUrl]);

  // Log restaurant mapping for debugging image paths
  useEffect(() => {
    if (restaurants.length > 0) {
      const firstRes = restaurants[0];
      console.log(`🍴 [Restaurant Image Check] Name: ${firstRes.name} | Image: ${firstRes.image} | Banner: ${firstRes.bannerImage}`);
    }
  }, [restaurants]);

  // Process home data - ROBUST VERSION
  const processHomeData = useCallback((data) => {
    if (!data) {
      setIsLoadingRestaurants(false);
      return;
    }

    try {
      // 1. Categories
      const rawCategories = data.categories || data.foodCategories || [];
      if (Array.isArray(rawCategories)) {
        const allCategory = {
          id: 'all',
          name: t('home.all', 'All'),
          title: t('home.all', 'All'),
          image: require('../../assets/images/Food.png'),
        };

        const apiCategories = rawCategories.map(cat => ({
          id: cat._id || cat.id,
          name: cat.name,
          title: cat.name,
          // Use getImageUrl to handle broken server paths for category images too
          image: getImageUrl(cat.image, 'Category'),
        }));

        setCategories([allCategory, ...apiCategories]);
        setIsLoadingCategories(false);
      }

      // 2. Banners
      if (Array.isArray(data.banners)) {
        setBanners(data.banners.filter(b => b?.isActive !== false));
      }

      // 3. Tabs
      if (Array.isArray(data.tabs)) {
        const translatedTabs = data.tabs.map(tab => {
          if (tab === 'Restaurants') return t('home.restaurants', 'Restaurants');
          if (tab === 'Offers') return t('home.offers', 'Offers');
          if (tab === 'Pick-up') return t('home.pickup', 'Pick-up');
          return tab;
        });
        setTabs(translatedTabs);
      }

      // 4. Restaurants Sections
      const sections = data.sections || data;

      // Recommended
      let recommendedRaw = sections.recommendedForYou || sections.recommended || [];
      let recommendedData = (Array.isArray(recommendedRaw) ? recommendedRaw : []).map(r => {
        const m = mapRestaurant(r);
        console.log(`🌟 [Recommended Restro] ${m.name} | URL: ${m.image}`);
        return m;
      });

      if (recommendedData.length === 0) {
        const fallbackSource = [
          ...(sections.popularRestaurants || []),
          ...(sections.recentRestaurants || []),
          ...(sections.exploreRestaurants || []).slice(0, 5),
        ];
        const uniqueFallback = Array.from(
          new Map(fallbackSource.filter(Boolean).map(r => [r._id || r.id, r])).values(),
        ).slice(0, 5);
        recommendedData = uniqueFallback.map(mapRestaurant);
      }
      setRecommendedRestaurants(recommendedData);

      // All / Explore
      const allRestaurants_raw = [
        ...(sections.exploreRestaurants || []),
        ...(sections.popularRestaurants || []),
        ...(sections.fastDelivery || []),
        ...(sections.freeDelivery || []),
        ...(sections.newOnPlatform || []),
        ...(sections.recentRestaurants || []),
        ...(Array.isArray(data.restaurants) ? data.restaurants : []),
      ];

      const uniqueRestaurants = Array.from(
        new Map(allRestaurants_raw.filter(Boolean).map(r => [r._id || r.id, r])).values(),
      );

      const mapped = uniqueRestaurants.map(r => {
        try {
          const m = mapRestaurant(r);
          console.log(`🏠 [Explore Restro] ${m.name} | URL: ${m.image}`);
          return m;
        } catch (e) {
          console.warn('Map error for restaurant:', r?.id, e.message);
          return null;
        }
      }).filter(Boolean);

      setAllRestaurants(mapped);
      setRestaurants(mapped.slice(0, itemsPerPage));
    } catch (err) {
      console.error('Error processing home data:', err);
    } finally {
      setIsLoadingRestaurants(false);
    }
  }, [mapRestaurant, t, itemsPerPage]);

  // Fetch home data
  const fetchHomeData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoadingRestaurants(true);

      // Use LocationContext as the single source of truth for the "Central Point"
      // Priority is already handled inside the Context (Selected Address > GPS > Storage)
      let finalLat = globalLocation?.latitude;
      let finalLng = globalLocation?.longitude;
      let finalCity = globalAddress?.city || null;

      // Temporary override for immediate parameter application (before context syncs)
      if (selectedAddressParam && selectedAddressParam.location?.coordinates) {
        finalLng = selectedAddressParam.location.coordinates[0];
        finalLat = selectedAddressParam.location.coordinates[1];
        finalCity = selectedAddressParam.city;
      } 

      if (!finalLat || !finalLng) {
        console.log('⚠️ [HomePage] No location available for fetching restaurants');
        setIsLoadingRestaurants(false);
        return;
      }

      console.log('📍 [HomePage] Fetching home data for central point:', { finalLat, finalLng, finalCity });

      // If we still don't have a city name but have coords, try reverse geocoding
      if (!finalCity && finalLat && finalLng) {
        try {
          const addrData = await getAddressFromCoordinates(finalLat, finalLng);
          finalCity = addrData.city;
        } catch (e) {
          console.warn('Geocoding failed for fetchHomeData');
        }
      }

      // Update local state for map/UI
      if (finalLat && finalLng) {
        setUserLocation({ latitude: finalLat, longitude: finalLng });
      }

      console.log(`🚀 [API-CALL] getHomeData -> Lat: ${finalLat}, Lng: ${finalLng}, City: ${finalCity}`);
      
      const data = await getHomeData({ lat: finalLat, lng: finalLng, city: finalCity });
      processHomeData(data);
      isInitialLoadDone.current = true;
    } catch (error) {
      console.error('fetchHomeData error:', error);
    } finally {
      setIsLoadingRestaurants(false);
    }
  }, [globalLocation, globalAddress, processHomeData, selectedAddressParam, t]);

  const getAddressUpdatedTime = useCallback((address) => {
    const rawDate = address?.updatedAt || address?.createdAt;
    const time = rawDate ? new Date(rawDate).getTime() : 0;
    return Number.isNaN(time) ? 0 : time;
  }, []);

  const getAddressLine = useCallback((address) => {
    if (!address) return '';
    return (
      address.streetArea ||
      address.area ||
      address.landmark ||
      address.addressLine ||
      address.fullAddress ||
      address.city ||
      ''
    );
  }, []);

  const pickHeaderAddress = useCallback((addresses) => {
    if (!Array.isArray(addresses) || addresses.length === 0) return null;
    const defaultAddress = addresses.find(addr => addr.isDefault === true);
    if (defaultAddress) return defaultAddress;

    const latestAddress = [...addresses].sort((a, b) => getAddressUpdatedTime(b) - getAddressUpdatedTime(a))[0];
    return getAddressUpdatedTime(latestAddress) > 0 ? latestAddress : addresses[addresses.length - 1];
  }, [getAddressUpdatedTime]);

  const applyHeaderAddress = useCallback((addresses) => {
    const headerAddress = pickHeaderAddress(addresses);
    if (!headerAddress) return false;

    const label = headerAddress.label || t('home.home', 'Home');
    const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);
    setAddressLabel(capitalizedLabel);
    setAddressLine(getAddressLine(headerAddress));
    return true;
  }, [getAddressLine, pickHeaderAddress, t]);

  const fetchUserData = useCallback(async () => {
    try {
      const [profileResult, addressesResult] = await Promise.allSettled([
        apiClient.get(USER_ROUTES.profile),
        apiClient.get(USER_ROUTES.addresses),
      ]);

      const response = profileResult.status === 'fulfilled' ? profileResult.value : null;
      const addressesResponse = addressesResult.status === 'fulfilled' ? addressesResult.value : null;
      const user = response?.data?.user || response?.data;
      const directAddresses = addressesResponse?.data?.addresses || addressesResponse?.data || [];
      const savedAddresses = Array.isArray(directAddresses) && directAddresses.length > 0
        ? directAddresses
        : (user?.savedAddresses || user?.addresses || []);
      setUserData(user ? { ...user, savedAddresses } : { savedAddresses });

      if (user && setAuthenticatedUser) {
        setAuthenticatedUser(null, { ...user, savedAddresses });
      }
    } catch (error) {
      console.warn('Error fetching user data:', error);
    }
  }, [setAuthenticatedUser]);

  useEffect(() => {
    if (selectedAddressParam) {
      console.log('📍 [HomePage] Applying selectedAddressParam and clearing navigation params');
      applyHeaderAddress([selectedAddressParam]);
      // Lock it in context so other screens (ReviewOrder, etc) use it
      setSelectedAddress(selectedAddressParam);
      if (setCartAddress) setCartAddress(selectedAddressParam);
      
      // Clear the param so it doesn't get re-applied on subsequent renders/refocus
      navigation.setParams({ selectedAddress: undefined });
    }
  }, [selectedAddressParam, setSelectedAddress, setCartAddress, applyHeaderAddress, navigation]);

  // Single source of truth for home data fetching
  const prevFetchCoords = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoadingRestaurants(false);
      return;
    }

    const runFetch = async () => {
      let lat = null;
      let lng = null;

      // Priority 1: Selected address from params (Explicit user action)
      if (selectedAddressParam && selectedAddressParam.location?.coordinates) {
        lng = selectedAddressParam.location.coordinates[0];
        lat = selectedAddressParam.location.coordinates[1];
        console.log('📍 [HomePage] Priority 1: Selected Param', { lat, lng });
      } 
      // Priority 2: Current GPS Location (The Real Truth)
      else if (globalLocation?.latitude && globalLocation?.longitude) {
        lat = globalLocation.latitude;
        lng = globalLocation.longitude;
        console.log('📍 [HomePage] Priority 2: Current GPS', { lat, lng });
      }
      // Priority 3: Fallback to saved address ONLY if GPS is missing
      else if (userData?.savedAddresses?.length > 0) {
        const defAddr = userData.savedAddresses.find(a => a.isDefault) || userData.savedAddresses[0];
        if (defAddr && defAddr.location?.coordinates) {
          lng = defAddr.location.coordinates[0];
          lat = defAddr.location.coordinates[1];
          console.log('📍 [HomePage] Priority 3: Saved Address fallback', { lat, lng });
        }
      }

      const prevLat = prevFetchCoords.current?.lat;
      const prevLng = prevFetchCoords.current?.lng;
      const latDiff = Math.abs((lat || 0) - (prevFetchCoords.current?.lat || 0));
      const lngDiff = Math.abs((lng || 0) - (prevFetchCoords.current?.lng || 0));
      
      // Check if the "Source of Truth" address object changed (e.g. from GPS to Home)
      const currentAddressId = lockedAddress?._id || lockedAddress?.id || 'gps';
      const addressIdChanged = currentAddressId !== prevFetchCoords.current?.addressId;

      if (!isInitialLoadDone.current || latDiff > 0.0001 || lngDiff > 0.0001 || addressIdChanged) {
        prevFetchCoords.current = { lat, lng, addressId: currentAddressId };
        
        // If address explicitly changed by user, force a hard refresh to show loading skeleton
        if (addressIdChanged) {
          setPageNum(0);
          setRestaurants([]); 
        }
        
        await fetchHomeData(!isInitialLoadDone.current || addressIdChanged);
      }

      // User profile fetch happens once
      if (!userData) {
        fetchUserData();
      }
    };

    runFetch();
  }, [isAuthenticated, globalLocation, fetchHomeData, fetchUserData, userData, selectedAddressParam, lockedAddress]);

  // Focus effect for profile only
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) fetchUserData();
    }, [fetchUserData, isAuthenticated])
  );

  useEffect(() => {
    const updateHeaderFromLocation = async () => {
      // 1. Priority: Explicitly selected address from navigation (immediate user intent)
      if (selectedAddressParam) {
        console.log('📍 [HomePage] Updating header with selectedAddressParam:', selectedAddressParam.label);
        let label = selectedAddressParam.label;
        if (typeof label === 'object') {
          label = label[i18n.language] || label.en || label.label || t('home.home', 'Home');
        }
        if (!label) label = t('home.home', 'Home');
        
        const capitalizedLabel = String(label).charAt(0).toUpperCase() + String(label).slice(1);
        setAddressLabel(capitalizedLabel);
        setAddressLine(getAddressLine(selectedAddressParam));
        return;
      }

      // 2. Priority: Locked/Chosen address from LocationContext
      if (lockedAddress) {
        console.log('📍 [HomePage] Updating header with lockedAddress:', lockedAddress.label);
        let label = lockedAddress.label;
        if (typeof label === 'object') {
          label = label[i18n.language] || label.en || label.label || t('home.home', 'Home');
        }
        if (!label) label = t('home.home', 'Home');

        const capitalizedLabel = String(label).charAt(0).toUpperCase() + String(label).slice(1);
        setAddressLabel(capitalizedLabel);
        setAddressLine(getAddressLine(lockedAddress));
        return;
      }

      // 3. Fallback: Use globally resolved GPS address from LocationContext
      if (globalAddress) {
        console.log('📍 [HomePage] Using GPS address for header:', globalAddress.city);
        setAddressLabel(t('home.current_location_label', 'Current Location'));
        const locality = globalAddress.streetArea || globalAddress.area || globalAddress.neighborhood || globalAddress.sublocality || globalAddress.landmark;
        if (locality) {
          setAddressLine(locality);
        } else if (globalAddress.city || globalAddress.country) {
          setAddressLine(`${globalAddress.city}${globalAddress.city && globalAddress.country ? ', ' : ''}${globalAddress.country}`);
        }
        return;
      }

      // 4. Manual Geocoding if GPS available but geocoding hasn't finished
      if (globalLocation && !isLocationLoading) {
        console.log('📍 [HomePage] Manually geocoding GPS location for header...');
        try {
          const data = await getAddressFromCoordinates(globalLocation.latitude, globalLocation.longitude);
          setAddressLabel(t('home.current_location_label', 'Current Location'));
          const locality = data.streetArea || data.area || data.neighborhood || data.sublocality || data.landmark;
          if (locality) {
            setAddressLine(locality);
          } else if (data.city || data.country) {
            setAddressLine(`${data.city}${data.city && data.country ? ', ' : ''}${data.country}`);
          }
        } catch (e) {
          console.error('Failed to geocode current location:', e);
        }
      }
    };
    updateHeaderFromLocation();
  }, [globalLocation, globalAddress, t, selectedAddressParam, lockedAddress, isLocationLoading]);

  // Distance check effect to show popup if > 2km
  useEffect(() => {
    const checkDistance = async () => {
      // Use GPS-only location for the distance check against default address
      if (!isAuthenticated || hasCheckedDistance.current || !gpsLocation || !gpsAddress || !userData?.savedAddresses || userData.savedAddresses.length === 0) {
        return;
      }

      const defaultAddr = userData.savedAddresses.find(a => a.isDefault) || userData.savedAddresses[0];
      if (defaultAddr && defaultAddr.location?.coordinates) {
        const [defLng, defLat] = defaultAddr.location.coordinates;
        const distance = calculateDistance(gpsLocation.latitude, gpsLocation.longitude, defLat, defLng);

        console.log(`📏 [Distance Check] GPS (${gpsLocation.latitude}, ${gpsLocation.longitude}) to Default Address (${defLat}, ${defLng}) distance: ${distance.toFixed(2)} km`);

        if (distance > 2) {
          const currentCity = gpsAddress.city || 'Indore';
          const defaultCity = defaultAddr.city || '';
          
          setCurrentCityName(currentCity);
          setDefaultAddressInfo(defaultAddr);
          setIsLocationPopupVisible(true);
        }
        // Mark as checked so we don't annoy the user multiple times in one session
        hasCheckedDistance.current = true;
      }
    };
    checkDistance();
  }, [isAuthenticated, gpsLocation, gpsAddress, userData]);

  const handleStayAtCurrentLocation = useCallback(() => {
    setIsLocationPopupVisible(false);
    // Explicitly clear selected address so we fall back to real-time GPS
    setSelectedAddress(null);
    if (setCartAddress) setCartAddress(null);
    
    // Force header refresh for immediate feedback
    if (gpsAddress) {
      setAddressLabel(t('home.current_location_label', 'Current Location'));
      const locality = gpsAddress.streetArea || gpsAddress.area || gpsAddress.neighborhood || gpsAddress.sublocality || gpsAddress.landmark;
      setAddressLine(locality || gpsAddress.city || '');
    }
  }, [setSelectedAddress, setCartAddress, gpsAddress, t]);

  const handleSetDefaultLocation = useCallback(() => {
    setIsLocationPopupVisible(false);
    navigation.navigate('Profile', { screen: 'AddressesScreen' });
  }, [navigation]);

  // Fail-safe for loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoadingRestaurants) {
        console.log('⏱️ [HomePage] Loading timeout reached, forcing UI render');
        setIsLoadingRestaurants(false);
      }
    }, 6000);
    return () => clearTimeout(timer);
  }, [isLoadingRestaurants]);

  // Load more restaurants
  const loadMoreRestaurants = useCallback(() => {
    if (pageNum * itemsPerPage < allRestaurants.length) {
      const nextPage = pageNum + 1;
      const startIndex = nextPage * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      setRestaurants([...restaurants, ...allRestaurants.slice(startIndex, endIndex)]);
      setPageNum(nextPage);
    }
  }, [pageNum, allRestaurants, restaurants]);

  // Toggle favorite
  const handleToggleFavorite = useCallback((restaurant) => {
    if (!restaurant) return;
    toggleFavourite?.({
      id: restaurant.id || restaurant._id,
      restaurantId: restaurant.id || restaurant._id,
      name: restaurant.name,
      image: restaurant.bannerImage || restaurant.image,
      restaurantName: restaurant.name,
      type: 'restaurant',
    });
  }, [toggleFavourite]);

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      setPageNum(0);
      
      // If user has explicitly selected an address, DO NOT overwrite it with GPS on refresh!
      if (!selectedAddressParam && !lockedAddress && globalLocation) {
        getAddressFromCoordinates(globalLocation.latitude, globalLocation.longitude)
          .then(data => {
            const loc = data.streetArea || data.area || data.neighborhood || data.sublocality || data.landmark;
            if (loc) {
              setAddressLine(loc);
              setAddressLabel(t('home.current_location_label', 'Current Location'));
            }
          }).catch(console.error);
      }
      
      await Promise.all([fetchHomeData(false), fetchUserData()]);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchHomeData, fetchUserData, selectedAddressParam, globalLocation, t]);

  // Build promo cards
  const promoCards = useMemo(() => {
    // 3 Premium Default Banners
    const defaultBanners = [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1543353071-873f17a7a088?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000&auto=format&fit=crop'
    ];

    if (banners.length > 0) {
      return banners.map((banner, index) => {
        const bannerImage = (banner?.image || '').trim();
        const isHttp = bannerImage.startsWith('http://') || bannerImage.startsWith('https://');

        let bannerUri = bannerImage;
        if (bannerImage && !isHttp) {
          const baseUrl = apiClient.defaults.baseURL.replace(/\/+$/, '');
          const path = bannerImage.startsWith('/') ? bannerImage : `/${bannerImage}`;
          bannerUri = `${baseUrl}${path}`;
        }

        // Fallback to one of the 3 default banners if API URI is problematic
        const fallbackImage = { uri: defaultBanners[index % defaultBanners.length] };

        return {
          id: banner._id || `banner-${index}`,
          // Since we know the current API images are 404, I'm prioritizing the default banners
          // so the user can see the UI properly. 
          image: { uri: defaultBanners[index % defaultBanners.length] },
          title: banner.title || t('promo.seasonal_favorites', 'Seasonal favorites are here'),
          subtitle: t('promo.try_something_new', 'try something new today !'),
          cta: t('promo.explore_now', 'Explore Now'),
          banner: banner,
        };
      });
    }

    // Default banners if API returns nothing
    return defaultBanners.map((url, index) => ({
      id: `def-banner-${index}`,
      image: { uri: url },
      title: index === 0 ? 'Fresh Flavors' : index === 1 ? 'Weekend Special' : 'Chef\'s Choice',
      subtitle: 'Enjoy exclusive deals on your favorite meals',
      cta: 'Order Now'
    }));
  }, [banners, t]);

  // Navigation handlers
  const handleProfilePress = useCallback(() => {
    const tabNav = navigation.getParent?.();
    if (tabNav?.navigate) {
      tabNav.navigate('Profile', { screen: 'ProfileHome' });
    }
  }, [navigation]);

  const handleCartPress = useCallback(() => navigation.navigate('Cart'), [navigation]);
  const handleNotificationPress = useCallback(() => navigation.navigate('HomeNotifications'), [navigation]);

  const handleSearchPress = useCallback(() => {
    const tabNav = navigation.getParent?.();
    const params = { autoFocus: true };
    if (tabNav?.navigate) {
      tabNav.navigate('Search', { screen: 'SearchHome', params });
    } else {
      navigation.navigate('SearchHome', params);
    }
  }, [navigation]);
  // Update handleCategoryPress (around line 350)
  const handleCategoryPress = useCallback((item) => {
    const tabNav = navigation.getParent?.();
    const isAllCategory = item.id === 'all' || item.name === 'All';

    // If "All" is selected, don't pass any category filter
    if (isAllCategory) {
      // Navigate to search with empty query or show all restaurants
      const params = { autoFocus: false };
      if (tabNav?.navigate) {
        tabNav.navigate('Search', { screen: 'SearchHome', params });
      } else {
        navigation.navigate('SearchHome', params);
      }
    } else {
      // Regular category behavior
      const params = {
        autoFocus: true,
        category: item.name,
        initialQuery: item.name
      };
      if (tabNav?.navigate) {
        tabNav.navigate('Search', { screen: 'SearchHome', params });
      } else {
        navigation.navigate('SearchHome', params);
      }
    }
  }, [navigation]);

  const handlePromoPress = useCallback((item) => {
    // Banner item mein restaurant aksar item.banner.restaurant ke andar hota hai
    const restaurant = item?.banner?.restaurant || item?.restaurant;
    if (restaurant) {
      const restaurantData = typeof restaurant === 'string' ? { _id: restaurant } : restaurant;
      navigation.navigate('RestaurantDetail', { restaurant: restaurantData });
    }
  }, [navigation]);

  const handleRestaurantPress = useCallback((item) => {
    if (item) {
      navigation.navigate('RestaurantDetail', { restaurant: item });
    }
  }, [navigation]);

  const handleSeeAllRecommended = useCallback(() => {
    navigation.navigate('RecommendedRestaurants', { recommendedRestaurants });
  }, [navigation, recommendedRestaurants]);

  const handleTabPress = useCallback(setActiveTab, [setActiveTab]);
  const handleTryAgain = useCallback(async () => {
    setIsRefreshing(true);
    await fetchHomeData(true);
    setIsRefreshing(false);
  }, [fetchHomeData]);

  const handleApplyFilters = useCallback(async (drawerFilters) => {
    try {
      const searchQuery = drawerFilters?.searchQuery || currentSearchQuery;
      const apiFilters = convertDrawerFiltersToAPI(drawerFilters);

      let loc = globalLocation;
      if (selectedAddressParam && selectedAddressParam.location?.coordinates) {
        const [lng, lat] = selectedAddressParam.location.coordinates;
        loc = { latitude: lat, longitude: lng };
      } else if (!globalLocation && userData?.savedAddresses) {
        const defAddr = userData.savedAddresses.find(a => a.isDefault) || userData.savedAddresses[0];
        if (defAddr && defAddr.location?.coordinates) {
          const [lng, lat] = defAddr.location.coordinates;
          loc = { latitude: lat, longitude: lng };
        }
      }

      console.log('🏠 [HomePage] Applying Filters:', { searchQuery, apiFilters, userLocation: loc });

      navigation.navigate('FilteredResults', {
        drawerFilters,
        searchQuery,
        apiFilters,
        userLocation: loc
      });
      setIsFilterOpen(false);
    } catch (error) {
      console.error('❌ Filter error:', error?.message);
      Toast.show({
        type: 'error',
        text1: t('common.error', 'Error'),
        text2: error?.message || t('home.filter_failed', 'Failed to apply filters'),
        duration: 2000,
      });
    }
  }, [navigation, currentSearchQuery, globalLocation, t, selectedAddressParam, userData]);

  const handleResetFilters = useCallback(async () => {
    try {
      setPageNum(0);
      await fetchHomeData(true);
    } catch (error) {
      console.error('Reset filters error:', error);
    }
  }, [fetchHomeData]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#ed1c24']} tintColor="#ed1c24" />
          }
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 200;
            if (isCloseToBottom && restaurants.length > 0) {
              loadMoreRestaurants();
            }
          }}
          scrollEventThrottle={400}
        >
          <HomeHeader
            addressLabel={addressLabel}
            addressLine={addressLine}
            userData={userData}
            cartCount={cartCount}
            tabs={tabs}
            activeTab={activeTab}
            isSmallDevice={isSmallDevice}
            onProfilePress={handleProfilePress}
            onCartPress={handleCartPress}
            onNotificationPress={handleNotificationPress}
            onSearchPress={handleSearchPress}
            onTabPress={handleTabPress}
            onAddressPress={() => navigation.navigate('Profile', { screen: 'AddressesScreen' })}
          />

          {activeTab === t('home.offers', 'Offers') ? (
            <Offers />
          ) : activeTab === t('home.pickup', 'Pick-up') ? (
            <PickupScreen />
          ) : (
            <>
              <FoodCategoryList
                categories={categories}
                isLoading={isLoadingCategories}
                selectedCategoryId={selectedCategoryId}
                onCategoryPress={handleCategoryPress}
              />
              <PromoCardList promoCards={promoCards} onPromoPress={handlePromoPress} />

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('home.recommended_for_you', 'Recommended For You')}</Text>
                <TouchableOpacity style={styles.allItemsButton} activeOpacity={0.85} onPress={handleSeeAllRecommended}>
                  <Text style={styles.allItemsText}>{t('home.view_all', 'View All')}</Text>
                </TouchableOpacity>
              </View>

              {isLoadingRestaurants ? (
                <FlatList
                  horizontal
                  data={Array(3).fill(null)}
                  keyExtractor={(_, index) => `skeleton-recommend-${index}`}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recommendList}
                  renderItem={() => <SkeletonRecommendCard />}
                />
              ) : recommendedRestaurants.length > 0 ? (
                <FlatList
                  horizontal
                  data={recommendedRestaurants}
                  keyExtractor={item => item.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recommendList}
                  renderItem={({ item }) => (
                    <RestaurantRecommendCard
                      item={item}
                      isFavorite={isFavourite?.(item.id, 'restaurant')}
                      onPress={() => handleRestaurantPress(item)}
                      onFavoritePress={() => handleToggleFavorite(item)}
                    />
                  )}
                />
              ) : null}

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('home.explore_restaurants', 'Explore Restaurants')}</Text>
                <View style={styles.sortActions}>
                  <TouchableOpacity activeOpacity={0.85} onPress={() => setIsFilterOpen(true)}>
                    <Filter size={scale(18)} color="#ed1c24" />
                  </TouchableOpacity>
                </View>
              </View>

              {isLoadingRestaurants ? (
                <View style={{ marginBottom: hp(5) }}>
                  {Array(6).fill(null).map((_, index) => (
                    <SkeletonCard key={`skeleton-${index}`} />
                  ))}
                  <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: hp(1.5) }}>
                    <ActivityIndicator size="small" color="#ed1c24" />
                    <Text style={{ marginTop: hp(1), color: '#8E8E93', fontSize: FONT.xs }}>
                      {t('home.loading_restaurants', 'Loading restaurants...')}
                    </Text>
                  </View>
                </View>
              ) : restaurants.length > 0 ? (
                <View style={{ paddingBottom: hp(8) }}>
                  {restaurants.map((item) => (
                    <RestaurantListCard
                      key={item.id}
                      item={item}
                      isFavorite={isFavourite?.(item.id, 'restaurant')}
                      onPress={() => handleRestaurantPress(item)}
                      onFavoritePress={() => handleToggleFavorite(item)}
                    />
                  ))}
                  <View style={{ height: hp(2) }} />
                </View>
              ) : (
                <View style={styles.emptyResults}>
                  <TouchableOpacity
                    style={styles.tryAgainBtn}
                    onPress={handleTryAgain}
                  >
                    <Text style={styles.tryAgainText}>{t('home.try_again', 'Try Again')}</Text>
                  </TouchableOpacity>
                </View>
              )}
              <View style={{ height: hp(10) }} />
            </>
          )}
        </ScrollView>
      </View>
      <FilterDrawer visible={isFilterOpen} onClose={() => setIsFilterOpen(false)} onReset={handleResetFilters} onApply={handleApplyFilters} />
      
      <LocationPopup
        visible={isLocationPopupVisible}
        onClose={() => setIsLocationPopupVisible(false)}
        currentCity={currentCityName}
        defaultCity={defaultAddressInfo?.city || ''}
        onStay={handleStayAtCurrentLocation}
        onSetDefault={handleSetDefaultLocation}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  sectionHeader: {
    marginTop: hp(3.75),
    paddingHorizontal: wp(4.44),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: FONT.md + scale(2),
    fontWeight: '600',
  },
  allItemsButton: {
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.5),
    borderRadius: scale(10),
    backgroundColor: '#FFF5F5',
    alignSelf: 'center',
  },
  allItemsText: {
    fontSize: FONT.xs,
    color: '#ed1c24',
    fontWeight: '600',
  },
  sortActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2.78),
  },
  recommendList: {
    paddingLeft: wp(4.44),
    marginTop: hp(1.75),
    paddingBottom: hp(2),
  },
  emptyResults: {
    height: hp(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  tryAgainBtn: {
    paddingHorizontal: wp(8),
    paddingVertical: hp(1.5),
    backgroundColor: '#ed1c24',
    borderRadius: scale(10),
  },
  tryAgainText: {
    color: '#FFFFFF',
    fontSize: FONT.sm,
    fontWeight: '700',
  },
});
