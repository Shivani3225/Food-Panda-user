import React, { useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  TextInput,
  FlatList,
  Keyboard,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Search, X, MapPin } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import useHideTabBar from '../../utils/hooks/useHideTabBar';
import { useLocation } from '../../context/LocationContext';
import { getAddressFromCoordinates, searchLocations } from '../../utils/locationUtils';

const { width, height } = Dimensions.get('window');

export default function AddAddressScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const { location: globalLocation, address: globalAddress } = useLocation();
  const address = route?.params?.address;
  const isEditing = !!address;

  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const searchDebounce = useRef(null);

  const initialLat = Number(address?.coordinates?.[1]) || globalLocation?.latitude || 25.276987;
  const initialLng = Number(address?.coordinates?.[0]) || globalLocation?.longitude || 55.296249;

  const [mapRegion, setMapRegion] = useState({
    latitude: initialLat,
    longitude: initialLng,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  });

  const initialAddressText = useMemo(() => {
    if (address?.fullAddress) return address.fullAddress;
    if (globalAddress) return `${globalAddress.city}${globalAddress.city && globalAddress.country ? ', ' : ''}${globalAddress.country}`;
    return t('address.set_coordinates_prompt', 'Picking your location...');
  }, [address, globalAddress, t]);

  const [selectedAddressText, setSelectedAddressText] = useState(initialAddressText);
  const [fullAddressData, setFullAddressData] = useState(null);
  const debounceTimer = useRef(null);

  useHideTabBar(navigation);

  React.useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  React.useEffect(() => {
    if (globalLocation && !isEditing && !address?.coordinates) {
      console.log('📍 [AddAddressScreen] Syncing with global location:', globalLocation);
      setCoordinates(globalLocation.latitude, globalLocation.longitude, true);
    }
  }, [globalLocation, isEditing, address?.coordinates]);

  const fetchAddress = async (lat, lng) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    setSelectedAddressText(t('address.fetching', 'Fetching location...'));

    debounceTimer.current = setTimeout(async () => {
      setIsFetchingAddress(true);
      try {
        const data = await getAddressFromCoordinates(lat, lng);
        setFullAddressData(data);

        if (data.city || data.country) {
          const displayAddress = `${data.city}${data.city && data.country ? ', ' : ''}${data.country}`;
          setSelectedAddressText(displayAddress);
        } else {
          setSelectedAddressText(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
      } catch (e) {
        console.error('❌ [AddAddress] Fetch error:', e);
        setSelectedAddressText(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      } finally {
        setIsFetchingAddress(false);
      }
    }, 200);
  };

  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);

    if (text.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    searchDebounce.current = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchLocations(text);
      setSearchResults(results);
      setIsSearching(false);
    }, 600);
  };

  const handleSelectSearchResult = (result) => {
    setSearchResults([]);
    setSearchQuery(result.description);
    Keyboard.dismiss();
    setCoordinates(result.latitude, result.longitude, true);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    Keyboard.dismiss();
  };

  const setCoordinates = (latitude, longitude, shouldAnimate = false) => {
    const latDiff = Math.abs(mapRegion.latitude - latitude);
    const lngDiff = Math.abs(mapRegion.longitude - longitude);

    if (latDiff < 0.00001 && lngDiff < 0.00001 && !shouldAnimate) {
      return;
    }

    const nextRegion = {
      latitude,
      longitude,
      latitudeDelta: mapRegion.latitudeDelta,
      longitudeDelta: mapRegion.longitudeDelta,
    };

    if (shouldAnimate) {
      setMapRegion(nextRegion);
      mapRef.current?.animateToRegion?.(nextRegion, 350);
    }

    fetchAddress(latitude, longitude);
  };

  const handleContinue = () => {
    // Safety check for navigation
    if (!navigation) {
      console.error('Navigation object is undefined');
      return;
    }

    const updatedAddress = {
      ...(address || {}),
      _id: address?._id || address?.id,
      coordinates: [mapRegion.longitude, mapRegion.latitude], // [lng, lat]

      // Map geocoded fields explicitly
      addressLine: fullAddressData?.addressLine || '',
      houseNo: fullAddressData?.houseNo || '',
      streetArea: fullAddressData?.streetArea || fullAddressData?.addressLine || '',
      landmark: fullAddressData?.landmark || '',
      city: fullAddressData?.city || '',
      state: fullAddressData?.state || '',
      zipCode: fullAddressData?.zipCode || '',
      country: fullAddressData?.country || '',
      fullAddress: fullAddressData?.fullAddress || selectedAddressText,
    };

    console.log('📤 [AddAddress] Sending data to form:', JSON.stringify(updatedAddress, null, 2));

    try {
      navigation.navigate('AddressFormScreen', { address: updatedAddress });
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', 'Unable to proceed. Please try again.');
    }
  };

  const handleRegionChange = (region) => {
    setMapRegion(region);
    if (!isMoving) {
      setIsMoving(true);
    }
  };

  const handleRegionChangeComplete = region => {
    setMapRegion(region);
    setIsMoving(false);
    fetchAddress(region.latitude, region.longitude);
  };

  const handleMapPress = event => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setCoordinates(latitude, longitude, true);
  };

  // New: Handle location selection press
  const handleLocationPress = () => {
    if (isFetchingAddress) {
      Alert.alert(
        t('common.info', 'Info'),
        t('address.waiting_for_location', 'Please wait while we fetch the location details.')
      );
      return;
    }

    // You can add additional logic here like:
    // - Show full address details
    // - Open address editing modal
    // - Copy to clipboard
    // For now, just show the full address
    if (fullAddressData?.fullAddress) {
      Alert.alert(
        t('address.full_address', 'Full Address'),
        String(fullAddressData.fullAddress || ''),
        [{ text: t('common.ok', 'OK'), style: 'cancel' }]
      );
    }
  };

  const handleMapReady = () => {
    console.log('Map is ready');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.outer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              try {
                navigation.goBack();
              } catch (error) {
                console.error('Navigation back error:', error);
              }
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {isEditing ? t('address.edit_address', 'Edit Address') : t('address.add_new', 'Add New Address')}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Map Container */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            onRegionChange={handleRegionChange}
            onRegionChangeComplete={handleRegionChangeComplete}
            onPress={handleMapPress}
            onMapReady={handleMapReady}
            initialRegion={{
              latitude: initialLat,
              longitude: initialLng,
              latitudeDelta: 0.04,
              longitudeDelta: 0.04,
            }}
          />

          {/* Fixed Center Pin */}
          <View style={styles.centerPinContainer} pointerEvents="none">
            <View style={styles.pinWrapper}>
              <MapPin size={40} color="#E41C26" fill="#E41C2633" />
              <View style={styles.pinShadow} />
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { top: height * 0.08 }]}>
          <View style={styles.searchBar}>
            <Search size={20} color="#999" style={{ marginLeft: 12 }} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('address.search_placeholder', 'Search for area, street...')}
              value={searchQuery}
              onChangeText={handleSearch}
              placeholderTextColor="#999"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={{ padding: 8 }}>
                <X size={18} color="#666" />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <View style={styles.resultsList}>
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.placeId}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.resultItem}
                    onPress={() => handleSelectSearchResult(item)}
                  >
                    <MapPin size={18} color="#666" style={{ marginRight: 12 }} />
                    <Text style={styles.resultText} numberOfLines={2}>
                      {item.description}
                    </Text>
                  </TouchableOpacity>
                )}
                style={{ maxHeight: 250 }}
              />
            </View>
          )}
          {isSearching && (
            <View style={styles.loadingDropdown}>
              <ActivityIndicator size="small" color="#E41C26" />
            </View>
          )}
        </View>

        {/* Bottom Card */}
        <View style={[styles.bottomCard, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.cardTitle}>{t('address.selected_location', 'Selected Location')}</Text>

          {/* Make the location row pressable */}
          <TouchableOpacity
            style={styles.locationRow}
            onPress={handleLocationPress}
            activeOpacity={0.7}
            disabled={isFetchingAddress || isMoving}
          >
            <View style={styles.dot} />
            {isFetchingAddress || isMoving ? (
              <View style={styles.fetchingContainer}>
                <ActivityIndicator size="small" color="#E41C26" />
                <Text style={styles.fetchingText}>
                  {isMoving ? t('address.selecting_location', 'Selecting location...') : t('address.fetching', 'Fetching address...')}
                </Text>
              </View>
            ) : (
              <Text style={styles.address} numberOfLines={3}>
                {selectedAddressText}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, (isFetchingAddress || isMoving) && styles.btnDisabled]}
            onPress={handleContinue}
            activeOpacity={0.85}
            disabled={isFetchingAddress || isMoving}
          >
            <Text style={styles.btnText}>
              {isEditing ? t('address.update_address', 'Update Address') : t('common.continue', 'Continue')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },

  outer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 0,
    overflow: 'hidden',
  },

  header: {
    height: height * 0.065,
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: width * 0.04,
    borderBottomWidth: 1,
    borderColor: '#EFEFEF',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },

  title: {
    fontSize: width > 400 ? 18 : 16,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.3,
  },

  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  centerPinContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  pinWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40, // Offset to make the bottom tip of pin align with center
  },
  pinShadow: {
    width: 6,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 3,
    marginTop: -2,
  },
  fetchingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  fetchingText: {
    fontSize: 14,
    color: '#999',
    marginLeft: 10,
    fontStyle: 'italic',
  },

  bottomCard: {
    backgroundColor: '#fff',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.02,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    marginBottom: 12,
    marginLeft: 4,
  },

  locationRow: {
    flexDirection: 'row',
    marginBottom: height * 0.02,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: width * 0.04,
    marginHorizontal: 0,
    backgroundColor: '#fafafa',
    borderColor: '#e8e8e8',
    minHeight: 80,
  },

  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E41C26',
    marginRight: width * 0.03,
    marginTop: 2,
    flexShrink: 0,
  },

  address: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 22,

    fontWeight: '500',
  },

  btn: {
    height: height * 0.065,
    minHeight: 50,
    backgroundColor: '#E41C26',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#E41C26',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  btnDisabled: {
    opacity: 0.6,
  },

  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Search Styles
  searchContainer: {
    position: 'absolute',
    left: width * 0.04,
    right: width * 0.04,
    zIndex: 1000,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    height: 50,
    paddingHorizontal: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#000',
  },
  resultsList: {
    backgroundColor: '#fff',
    marginTop: 8,
    borderRadius: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  resultText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  loadingDropdown: {
    backgroundColor: '#fff',
    marginTop: 5,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    elevation: 5,
  },
});