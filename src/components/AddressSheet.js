import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Dimensions,
  Linking,
  Modal,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  ToastAndroid,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import Geolocation from '@react-native-community/geolocation';
import MapView, { Marker } from 'react-native-maps';
import { useLocation } from '../context/LocationContext';
import { getAddressFromCoordinates, getLocationByIP } from '../utils/locationUtils';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AddressSheet({
  visible,
  addresses,
  selectedAddressId,
  onSelect,
  onApply,
  onAddAddress,
  onUpdateAddress,
  onDeleteAddress,
  onClose,
}) {
  const { t } = useTranslation();
  const { location: globalLocation } = useLocation();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const list = useMemo(
    () => (Array.isArray(addresses) ? addresses : []),
    [addresses],
  );

  const [localSelectedId, setLocalSelectedId] = useState(
    selectedAddressId ?? null,
  );
  const [localList, setLocalList] = useState(list);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newLabel, setNewLabel] = useState('');
  const [newLine, setNewLine] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newZip, setNewZip] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [newLat, setNewLat] = useState('');
  const [newLng, setNewLng] = useState('');
  const [newIsDefault, setNewIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapCoords, setMapCoords] = useState(null);
  const [selectedMapCoords, setSelectedMapCoords] = useState(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: globalLocation?.latitude || 52.5200, // Use global location if available, fallback to Berlin
    longitude: globalLocation?.longitude || 13.4050,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const saveTimerRef = useRef(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    console.log('📍 Setting up Geolocation configuration');
    Geolocation.setRNConfiguration?.({
      skipPermissionRequests: false,
      authorizationLevel: 'whenInUse',
      locationProvider: 'auto',
    });
  }, []);

  useEffect(() => {
    if (!visible) return;
    console.log('📱 AddressSheet visible, resetting state');
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    setIsSaving(false);
    setLocalSelectedId(selectedAddressId ?? null);
    setLocalList(list);
    setIsAdding(false);
    setEditingId(null);
    setNewLabel('');
    setNewLine('');
    setNewCity('');
    setNewZip('');
    setNewInstructions('');
    setNewLat('');
    setNewLng('');
    setNewIsDefault(false);
    setIsFetchingLocation(false);
    setIsFetchingAddress(false);
    setShowMapPicker(false);
    setMapCoords(null);
    setSelectedMapCoords(null);
    
    // Stop watching location when sheet closes
    if (watchIdRef.current) {
      console.log('🛑 Clearing location watch');
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, [list, selectedAddressId, visible]);

  useEffect(() => {
    if (visible) {
      overlayOpacity.setValue(0);
      translateY.setValue(SCREEN_HEIGHT);
      
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          stiffness: 220,
          damping: 28,
          mass: 0.9,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true,
    );
    return () => {
      backHandler.remove();
      if (watchIdRef.current) {
        console.log('🛑 Cleaning up location watch on unmount');
        Geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [visible]);

  const canApply = !!localSelectedId;
  const canSave = newLine.trim().length > 0 && newCity.trim().length > 0;

  const requestLocationPermission = async () => {
    console.log('🔐 Checking location permissions...');
    
    if (Platform.OS === 'ios') {
      console.log('🍎 iOS platform - requesting authorization');
      const status = await Geolocation.requestAuthorization?.('whenInUse');
      const granted = status === 'granted';
      console.log(`iOS permission result: ${granted ? 'GRANTED' : 'DENIED'}`);
      return granted;
    }

    try {
      const hasFine = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      const hasCoarse = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      );
      
      console.log(`Android permission check - Fine: ${hasFine}, Coarse: ${hasCoarse}`);
      
      if (hasFine || hasCoarse) {
        console.log('✅ Location permissions already granted');
        return true;
      }

      console.log('📱 Requesting location permissions...');
      const grantedMap = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]);

      const fineResult =
        grantedMap?.[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
      const coarseResult =
        grantedMap?.[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION];

      console.log(`Permission results - Fine: ${fineResult}, Coarse: ${coarseResult}`);

      if (
        fineResult === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ||
        coarseResult === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
      ) {
        console.log('❌ Location permission permanently denied');
        const message = t('address.permission_denied_permanent', 'Location permission permanently denied. Please enable it from app settings.');
        ToastAndroid.show(message, ToastAndroid.LONG);
        Linking.openSettings?.();
        return false;
      }

      const granted = (
        fineResult === PermissionsAndroid.RESULTS.GRANTED ||
        coarseResult === PermissionsAndroid.RESULTS.GRANTED
      );
      
      console.log(`Permission granted: ${granted}`);
      return granted;
    } catch (error) {
      console.error('❌ Error checking permissions:', error);
      return false;
    }
  };

  const setCoordinateValues = async (latitude, longitude, shouldFetchAddress = true) => {
    console.log(`📍 Setting coordinates - Lat: ${latitude}, Lng: ${longitude}`);
    setNewLat(String(Number(latitude).toFixed(6)));
    setNewLng(String(Number(longitude).toFixed(6)));
    setMapCoords({ latitude, longitude });
    setSelectedMapCoords({ latitude, longitude });
    setMapRegion(prev => ({
      ...prev,
      latitude,
      longitude,
    }));
    
    // Fetch address from coordinates
    if (shouldFetchAddress) {
      await fetchAddressFromCoords(latitude, longitude);
    }
  };
  
  const fetchAddressFromCoords = async (latitude, longitude) => {
    if (isFetchingAddress) return;
    
    console.log('🏠 Fetching address from coordinates...');
    setIsFetchingAddress(true);
    
    try {
      const addressData = await getAddressFromCoordinates(latitude, longitude);
      console.log('📝 Address data received:', addressData);
      
      // Auto-fill the form fields
      if (addressData.addressLine) {
        setNewLine(addressData.addressLine);
      }
      if (addressData.city) {
        setNewCity(addressData.city);
      }
      if (addressData.zipCode) {
        setNewZip(addressData.zipCode);
      }
      
      const successMessage = t('address.address_fetched', 'Address details fetched successfully');
      if (Platform.OS === 'android') {
        ToastAndroid.show(successMessage, ToastAndroid.SHORT);
      } else {
        Toast.show({
          type: 'success',
          text1: t('address.location', 'Location'),
          text2: successMessage,
        });
      }
    } catch (error) {
      console.error('❌ Failed to fetch address:', error);
      const errorMessage = t('address.address_fetch_failed', 'Could not fetch address details. Please fill manually.');
      if (Platform.OS === 'android') {
        ToastAndroid.show(errorMessage, ToastAndroid.SHORT);
      } else {
        Toast.show({
          type: 'error',
          text1: t('address.location', 'Location'),
          text2: errorMessage,
        });
      }
    } finally {
      setIsFetchingAddress(false);
    }
  };

  const getCurrentPositionAsync = options => {
    console.log('📡 Getting current position with options:', options);
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(resolve, reject, options);
    });
  };

  const handleUseCurrentLocation = async () => {
    console.log('📍 Use current location button pressed');
    
    if (isFetchingLocation) {
      console.log('⏳ Already fetching location, skipping...');
      return;
    }

    console.log('🔐 Requesting location permission...');
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      console.log('❌ Location permission denied');
      const message = t('address.location_permission_denied', 'Location permission denied');
      if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.LONG);
      } else {
        Toast.show({
          type: 'error',
          text1: t('address.location', 'Location'),
          text2: message,
        });
      }
      return;
    }

    console.log('✅ Permission granted, fetching location...');
    setIsFetchingLocation(true);

    try {
      // Directly fetch location — no pre-check needed
      console.log('📡 Attempting to get location with HIGH accuracy...');
      let position;
      try {
        position = await getCurrentPositionAsync({
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
          forceRequestLocation: true,
          showLocationDialog: true,
        });
        console.log('✅ Location fetched with HIGH accuracy:', {
          latitude: position?.coords?.latitude,
          longitude: position?.coords?.longitude,
          accuracy: position?.coords?.accuracy,
        });
      } catch (firstError) {
        console.log(`⚠️ High accuracy failed (${firstError?.code}), falling back to LOW accuracy...`);
        position = await getCurrentPositionAsync({
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 10000,
          forceRequestLocation: true,
          showLocationDialog: true,
        });
        console.log('✅ Location fetched with LOW accuracy:', {
          latitude: position?.coords?.latitude,
          longitude: position?.coords?.longitude,
          accuracy: position?.coords?.accuracy,
        });
      }

      if (!position?.coords) {
        console.log('❌ No location data received');
        throw new Error('No location data received');
      }

      const { latitude, longitude } = position.coords;
      console.log(`🎯 Final coordinates - Lat: ${latitude}, Lng: ${longitude}`);
      
      await setCoordinateValues(latitude, longitude, true);

      const successMessage = t('address.location_fetched', 'Current location fetched successfully');
      console.log('✅ Location fetch successful!');
      if (Platform.OS === 'android') {
        ToastAndroid.show(successMessage, ToastAndroid.SHORT);
      } else {
        Toast.show({
          type: 'success',
          text1: t('address.location', 'Location'),
          text2: successMessage,
        });
      }
    } catch (error) {
      console.error('❌ Error fetching location:', error);
      
      console.log('🌐 Attempting IP location fallback...');
      try {
        const ipLocation = await getLocationByIP();
        if (ipLocation) {
          console.log('✅ IP location fallback success:', ipLocation);
          await setCoordinateValues(ipLocation.latitude, ipLocation.longitude, true);
          
          const successMsg = t('address.location_fetched_ip', 'Location fetched via IP');
          if (Platform.OS === 'android') {
            ToastAndroid.show(successMsg, ToastAndroid.SHORT);
          } else {
            Toast.show({
              type: 'success',
              text1: t('address.location', 'Location'),
              text2: successMsg,
            });
          }
          return; // Exit successfully
        }
      } catch (ipErr) {
        console.error('❌ IP location fallback failed:', ipErr);
      }

      let message = t('address.unable_to_fetch', 'Unable to fetch current location');
      
      if (error?.code === 1) {
        message = t('address.permission_denied', 'Location permission denied');
      } else if (error?.code === 2) {
        message = t('address.location_unavailable', 'Location unavailable. Please turn on GPS/Location services and try again.');
        if (Platform.OS === 'android') {
          Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
        }
      } else if (error?.code === 3) {
        message = t('address.timeout', 'Location request timed out. Please try again in an open area.');
      } else if (error?.message) {
        message = error.message;
      }

      if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.LONG);
      } else {
        Toast.show({
          type: 'error',
          text1: t('address.location', 'Location'),
          text2: message,
        });
      }
    } finally {
      console.log('🏁 Location fetch process completed');
      setIsFetchingLocation(false);
    }
  };

  const openMapPicker = () => {
    console.log('🗺️ Opening map picker');
    
    // Get current coordinates from form or use default
    let latitude = 28.6139; // Default Delhi
    let longitude = 77.2090;
    
    if (newLat && newLng && Number(newLat) !== 0 && Number(newLng) !== 0) {
      latitude = Number(newLat);
      longitude = Number(newLng);
      console.log(`Using form coordinates - Lat: ${latitude}, Lng: ${longitude}`);
    } else if (mapCoords) {
      latitude = mapCoords.latitude;
      longitude = mapCoords.longitude;
      console.log(`Using map coordinates - Lat: ${latitude}, Lng: ${longitude}`);
    } else {
      console.log(`Using default coordinates - Lat: ${latitude}, Lng: ${longitude}`);
    }
    
    setSelectedMapCoords({ latitude, longitude });
    setMapRegion({
      latitude,
      longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    });
    setShowMapPicker(true);
  };

  const handleMapLocationSelect = async () => {
    if (!selectedMapCoords) {
      console.log('❌ No coordinates selected on map');
      return;
    }
    console.log(`✅ Using map location - Lat: ${selectedMapCoords.latitude}, Lng: ${selectedMapCoords.longitude}`);
    // Coordinates set karo (address already tap pe fetch ho chuki hai)
    setNewLat(String(Number(selectedMapCoords.latitude).toFixed(6)));
    setNewLng(String(Number(selectedMapCoords.longitude).toFixed(6)));
    setMapCoords(selectedMapCoords);
    setShowMapPicker(false);
  };

  const handleSaveAddress = async () => {
    console.log('💾 Saving address...');
    console.log('Current form values:', {
      label: newLabel,
      addressLine: newLine,
      city: newCity,
      zipCode: newZip,
      lat: newLat,
      lng: newLng
    });
    
    if (!canSave || isSaving) {
      console.log('Cannot save - canSave:', canSave, 'isSaving:', isSaving);
      if (!canSave) {
        const message = t('address.fill_required_fields', 'Please fill Address and City');
        if (Platform.OS === 'android') {
          ToastAndroid.show(message, ToastAndroid.SHORT);
        } else {
          Toast.show({
            type: 'error',
            text1: t('common.error', 'Error'),
            text2: message,
          });
        }
      }
      return;
    }
    
    const lat = Number(newLat);
    const lng = Number(newLng);
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0;

    const ALLOWED_LABELS = ['Home', 'Work', 'Other'];
    const payload = {
      label: ALLOWED_LABELS.includes(newLabel.trim()) ? newLabel.trim() : 'Other',
      addressLine: newLine.trim(),
      city: newCity.trim(),
      zipCode: newZip.trim(),
      deliveryInstructions: newInstructions.trim() || undefined,
      isDefault: !!newIsDefault,
      location: hasCoords
        ? { type: 'Point', coordinates: [lng, lat] }
        : undefined,
    };

    console.log('Address payload:', payload);
    setIsSaving(true);
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      try {
        let nextList = localList;
        if (editingId) {
          console.log('Updating existing address, ID:', editingId);
          const response = await onUpdateAddress?.(editingId, payload);
          nextList = response || localList;
        } else {
          console.log('Adding new address');
          const response = await onAddAddress?.(payload);
          nextList = response || localList;
        }

        if (Array.isArray(nextList) && nextList.length > 0) {
          setLocalList(nextList);
          const selectedId = editingId || nextList[0]?.id || null;
          if (selectedId) {
            setLocalSelectedId(selectedId);
            const selected = nextList.find(a => a.id === selectedId);
            if (selected) onSelect?.(selected);
          }
        }
        console.log('Address saved successfully');
        
        // Close the form after successful save
        setIsAdding(false);
        setEditingId(null);
      } catch (error) {
        console.error('Save address error:', error);
        const errorMessage = error?.message || t('address.save_failed', 'Failed to save address');
        if (Platform.OS === 'android') {
          ToastAndroid.show(errorMessage, ToastAndroid.SHORT);
        } else {
          Toast.show({
            type: 'error',
            text1: t('common.error', 'Error'),
            text2: errorMessage,
          });
        }
      } finally {
        setIsSaving(false);
      }
    }, 350);
  };

  const startAdd = () => {
    console.log('➕ Starting add address mode');
    setIsAdding(true);
    setEditingId(null);
    setNewLabel('Home'); // default label
    setNewLine('');
    setNewCity('');
    setNewZip('');
    setNewInstructions('');
    
    // Use global location if available
    if (globalLocation) {
      console.log('📍 [AddressSheet] Defaulting to global location:', globalLocation);
      setNewLat(String(globalLocation.latitude));
      setNewLng(String(globalLocation.longitude));
      setMapCoords({ latitude: globalLocation.latitude, longitude: globalLocation.longitude });
      setSelectedMapCoords({ latitude: globalLocation.latitude, longitude: globalLocation.longitude });
      setMapRegion(prev => ({
        ...prev,
        latitude: globalLocation.latitude,
        longitude: globalLocation.longitude,
      }));
    } else {
      setNewLat('');
      setNewLng('');
    }
    
    setNewIsDefault(false);
    setSelectedMapCoords(globalLocation ? { latitude: globalLocation.latitude, longitude: globalLocation.longitude } : null);
    setShowMapPicker(false);
  };

  // Sync with global location if it becomes available while adding
  useEffect(() => {
    if (visible && isAdding && !editingId && globalLocation && (!newLat || Number(newLat) === 0)) {
      console.log('📍 [AddressSheet] Late sync with global location:', globalLocation);
      setCoordinateValues(globalLocation.latitude, globalLocation.longitude, true);
    }
  }, [globalLocation, isAdding, editingId, visible]);

  const startEdit = addr => {
    console.log('✏️ Editing address:', addr?.id);
    setIsAdding(true);
    setEditingId(addr?.id || null);
    setNewLabel(addr?.label || '');
    setNewLine(addr?.addressLine || '');
    setNewCity(addr?.city || '');
    setNewZip(addr?.zipCode || '');
    setNewInstructions(addr?.deliveryInstructions || '');
    const coords = addr?.location?.coordinates || [];
    setNewLng(coords[0] != null ? String(coords[0]) : '');
    setNewLat(coords[1] != null ? String(coords[1]) : '');
    setNewIsDefault(!!addr?.isDefault);
    if (coords[0] && coords[1]) {
      setSelectedMapCoords({ latitude: coords[1], longitude: coords[0] });
    }
  };

  const handleDelete = async addr => {
    console.log('🗑️ Deleting address:', addr?.id);
    if (!addr?.id) return;
    try {
      const response = await onDeleteAddress?.(addr.id);
      const nextList = response || localList.filter(x => x.id !== addr.id);
      setLocalList(nextList);
      if (String(localSelectedId) === String(addr.id)) {
        setLocalSelectedId(null);
      }
      const message = response?.message || t('address.removed', 'Address removed');
      console.log('Address deleted successfully');
      if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.SHORT);
      } else {
        Toast.show({
          type: 'success',
          text1: t('common.success', 'Success'),
          text2: message,
        });
      }
    } catch (error) {
      console.error('Delete address error:', error);
      const message = error?.message || t('address.failed_to_remove', 'Failed to remove address');
      if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.SHORT);
      } else {
        Toast.show({
          type: 'error',
          text1: t('common.error', 'Error'),
          text2: message,
        });
      }
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View style={styles.modalRoot}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('address.delivery_address', 'Delivery address')}</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {isAdding ? (
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>
                  {editingId ? t('address.edit_address', 'Edit address') : t('address.add_new', 'Add new address')}
                </Text>

                {/* Label Picker — fixed enum values */}
                <Text style={styles.labelPickerTitle}>{t('address.label', 'Label')}</Text>
                <View style={styles.labelPickerRow}>
                  {['Home', 'Work', 'Other'].map(opt => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.labelChip, newLabel === opt && styles.labelChipActive]}
                      onPress={() => setNewLabel(opt)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.labelChipText, newLabel === opt && styles.labelChipTextActive]}>
                        {opt === 'Home' ? '🏠 ' + t('address.home', 'Home')
                          : opt === 'Work' ? '💼 ' + t('address.work', 'Work')
                          : '📍 ' + t('address.other', 'Other')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  value={newLine}
                  onChangeText={setNewLine}
                  placeholder={t('address.address_placeholder', 'Address')}
                  placeholderTextColor="#9A9A9A"
                  style={[styles.input, styles.inputMultiline]}
                  multiline
                />
                <TextInput
                  value={newCity}
                  onChangeText={setNewCity}
                  placeholder={t('address.city_placeholder', 'City')}
                  placeholderTextColor="#9A9A9A"
                  style={styles.input}
                />
                <TextInput
                  value={newZip}
                  onChangeText={setNewZip}
                  placeholder={t('address.zip_placeholder', 'ZIP code')}
                  placeholderTextColor="#9A9A9A"
                  style={styles.input}
                />
                <TextInput
                  value={newInstructions}
                  onChangeText={setNewInstructions}
                  placeholder={t('address.instructions_placeholder', 'Delivery instructions')}
                  placeholderTextColor="#9A9A9A"
                  style={[styles.input, styles.inputMultiline]}
                  multiline
                />
                <View style={styles.locationActionsRow}>
                  <TouchableOpacity
                    style={styles.locationActionBtn}
                    onPress={handleUseCurrentLocation}
                    activeOpacity={0.9}
                    disabled={isFetchingLocation}
                  >
                    <Text style={styles.locationActionText}>
                      {isFetchingLocation
                        ? t('address.fetching_location', 'Fetching location...')
                        : t('address.use_current_location', '📍 Use current location')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.locationActionBtn}
                    onPress={openMapPicker}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.locationActionText}>{t('address.select_on_map', '🗺️ Select on map')}</Text>
                  </TouchableOpacity>
                </View>
                
                {isFetchingAddress && (
                  <View style={styles.fetchingAddressContainer}>
                    <ActivityIndicator size="small" color="#FF3D3D" />
                    <Text style={styles.fetchingAddressText}>Fetching address details...</Text>
                  </View>
                )}
                
                <View style={styles.coordRow}>
                  <TextInput
                    value={newLat}
                    onChangeText={setNewLat}
                    placeholder={t('address.latitude', 'Latitude')}
                    placeholderTextColor="#9A9A9A"
                    style={[styles.input, styles.inputHalf]}
                    keyboardType="numeric"
                  />
                  <TextInput
                    value={newLng}
                    onChangeText={setNewLng}
                    placeholder={t('address.longitude', 'Longitude')}
                    placeholderTextColor="#9A9A9A"
                    style={[styles.input, styles.inputHalf]}
                    keyboardType="numeric"
                  />
                </View>

                {showMapPicker && (
                  <View style={styles.mapPickerCard}>
                    <Text style={styles.mapPickerTitle}>{t('address.map_picker_title', 'Tap on map to select location')}</Text>
                    <MapView
                      style={styles.mapPicker}
                      region={mapRegion}
                      onPress={event => {
                        const { latitude, longitude } = event.nativeEvent.coordinate;
                        console.log(`🗺️ Map tapped - Lat: ${latitude}, Lng: ${longitude}`);
                        setNewLat(String(latitude.toFixed(6)));
                        setNewLng(String(longitude.toFixed(6)));
                        setSelectedMapCoords({ latitude, longitude });
                        setMapRegion(prev => ({ ...prev, latitude, longitude }));
                        // Address immediately fetch karo
                        fetchAddressFromCoords(latitude, longitude);
                      }}
                    >
                      {selectedMapCoords && (
                        <Marker
                          coordinate={selectedMapCoords}
                          draggable
                          onDrag={event => {
                            const { latitude, longitude } = event.nativeEvent.coordinate;
                            setNewLat(String(latitude.toFixed(6)));
                            setNewLng(String(longitude.toFixed(6)));
                            setNewLine('Updating location...');
                          }}
                          onDragEnd={event => {
                            const { latitude, longitude } = event.nativeEvent.coordinate;
                            console.log(`📍 Marker dragged to - Lat: ${latitude}, Lng: ${longitude}`);
                            setNewLat(String(latitude.toFixed(6)));
                            setNewLng(String(longitude.toFixed(6)));
                            setSelectedMapCoords({ latitude, longitude });
                            setMapRegion(prev => ({ ...prev, latitude, longitude }));
                            // Address immediately fetch karo
                            fetchAddressFromCoords(latitude, longitude);
                          }}
                        />
                      )}
                    </MapView>

                    <View style={styles.mapPickerActions}>
                      <TouchableOpacity
                        style={styles.mapSecondaryBtn}
                        onPress={() => {
                          console.log('🗺️ Closing map picker');
                          setShowMapPicker(false);
                        }}
                        activeOpacity={0.9}
                      >
                        <Text style={styles.mapSecondaryBtnText}>{t('address.close_map', 'Close')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.mapPrimaryBtn}
                        onPress={handleMapLocationSelect}
                        activeOpacity={0.9}
                      >
                        <Text style={styles.mapPrimaryBtnText}>{t('address.use_location', 'Use this location')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <View style={styles.defaultRow}>
                  <Text style={styles.defaultLabel}>{t('address.set_as_default', 'Set as default')}</Text>
                  <Switch
                    value={newIsDefault}
                    onValueChange={setNewIsDefault}
                    trackColor={{ false: '#D9D9D9', true: '#D9D9D9' }}
                    thumbColor={newIsDefault ? '#111' : '#FFF'}
                  />
                </View>
                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => {
                      console.log('❌ Cancelling address form');
                      if (saveTimerRef.current) {
                        clearTimeout(saveTimerRef.current);
                        saveTimerRef.current = null;
                      }
                      setIsSaving(false);
                      setIsAdding(false);
                      setEditingId(null);
                      setNewLabel('');
                      setNewLine('');
                      setNewCity('');
                      setNewZip('');
                      setNewInstructions('');
                      setNewLat('');
                      setNewLng('');
                      setNewIsDefault(false);
                      setShowMapPicker(false);
                      setSelectedMapCoords(null);
                    }}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.cancelText}>{t('common.cancel', 'Cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.saveBtn,
                      (!canSave || isSaving) && styles.saveBtnDisabled,
                    ]}
                    onPress={handleSaveAddress}
                    activeOpacity={0.9}
                    disabled={!canSave || isSaving}
                  >
                    <Text style={styles.saveText}>
                      {isSaving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : localList.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyTitle}>{t('address.no_saved_addresses', 'No saved addresses')}</Text>
                <Text style={styles.emptySub}>
                  {t('address.add_address_to_continue', 'Add an address to continue checkout.')}
                </Text>

                <TouchableOpacity
                  style={styles.addAddressBtn}
                  onPress={startAdd}
                  activeOpacity={0.9}
                >
                  <Text style={styles.addAddressText}>{t('address.add_new_address', '+ Add new address')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {localList.map(addr => {
                  const selected = addr.id === localSelectedId;
                  return (
                    <TouchableOpacity
                      key={addr.id}
                      activeOpacity={0.9}
                      style={[styles.card, selected && styles.cardSelected]}
                      onPress={() => {
                        console.log(`📌 Selected address: ${addr.id}`);
                        setLocalSelectedId(addr.id);
                        onSelect?.(addr);
                      }}
                    >
                      <View
                        style={[
                          styles.radioOuter,
                          selected && styles.radioOuterActive,
                        ]}
                      >
                        {selected && <View style={styles.radioInner} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.addrLabel}>
                          {String(addr.label || '').toLowerCase() === 'home' ? '🏠 ' :
                           String(addr.label || '').toLowerCase() === 'work' || String(addr.label || '').toLowerCase() === 'office' ? '💼 ' : '📍 '}
                          {addr.label || t('address.address', 'Address')}
                        </Text>
                        <Text numberOfLines={2} style={styles.addrLine}>
                          {addr.addressLine}
                        </Text>
                        {!!addr.city && (
                          <Text numberOfLines={1} style={styles.addrMeta}>
                            {addr.city} {addr.zipCode ? `- ${addr.zipCode}` : ''}
                          </Text>
                        )}
                        <View style={styles.addrActions}>
                          <TouchableOpacity
                            style={styles.addrActionBtn}
                            onPress={() => startEdit(addr)}
                            activeOpacity={0.9}
                          >
                            <Text style={styles.addrActionText}>{t('common.edit', 'Edit')}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.addrActionBtn}
                            onPress={() => handleDelete(addr)}
                            activeOpacity={0.9}
                          >
                            <Text style={styles.addrActionDelete}>{t('common.delete', 'Delete')}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={styles.addInline}
                  onPress={startAdd}
                  activeOpacity={0.9}
                >
                  <Text style={styles.addInlineText}>{t('address.add_new_address', '+ Add new address')}</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={{ height: 96 }} />
          </ScrollView>

          {!isAdding && (
            <View style={styles.bottomBar}>
              <TouchableOpacity
                onPress={() => {
                  if (!canApply) return;
                  const selected = localList.find(a => a.id === localSelectedId);
                  if (!selected) return;
                  console.log('✅ Applying selected address:', selected.id);
                  onApply?.(selected);
                }}
                style={[
                  styles.primaryBtn,
                  !canApply && styles.primaryBtnDisabled,
                ]}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryText}>{t('common.apply', 'Apply')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  // Label picker styles
  labelPickerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
    marginTop: 4,
  },
  labelPickerRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  labelChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  labelChipActive: {
    borderColor: '#FF3D3D',
    backgroundColor: '#FFF0F0',
  },
  labelChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  labelChipTextActive: {
    color: '#FF3D3D',
    fontWeight: '700',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    maxHeight: SCREEN_HEIGHT * 0.86,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  title: { fontSize: 16, fontWeight: '900', color: '#111' },
  close: {
    fontSize: 18,
    color: '#666',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  content: { padding: 16 },

  formCard: {
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#FFF',
    marginBottom: 12,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111',
    marginBottom: 10,
  },
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    paddingHorizontal: 12,
    color: '#111',
    fontSize: 13,
    marginBottom: 10,
  },
  inputMultiline: {
    height: 72,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  inputHalf: {
    flex: 1,
  },
  coordRow: {
    flexDirection: 'row',
    gap: 10,
  },
  locationActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  locationActionBtn: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#FF3D3D',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
  },
  locationActionText: {
    color: '#FF3D3D',
    fontWeight: '800',
    fontSize: 12,
  },
  fetchingAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    marginBottom: 10,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    gap: 8,
  },
  fetchingAddressText: {
    color: '#FF3D3D',
    fontSize: 12,
    fontWeight: '600',
  },
  mapPickerCard: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },
  mapPickerTitle: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
  },
  mapPicker: {
    width: '100%',
    height: 250,
  },
  mapPickerActions: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
  },
  mapSecondaryBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D8D8D8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F8F8',
  },
  mapSecondaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111',
  },
  mapPrimaryBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3D3D',
  },
  mapPrimaryBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFF',
  },
  defaultRow: {
    marginTop: 2,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  defaultLabel: { fontSize: 12, fontWeight: '700', color: '#111' },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    height: 42,
    minWidth: 92,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DADADA',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F7F7',
  },
  cancelText: { color: '#111', fontWeight: '800', fontSize: 12 },
  saveBtn: {
    paddingHorizontal: 16,
    height: 42,
    minWidth: 110,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3D3D',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveText: { color: '#FFF', fontWeight: '800', fontSize: 12 },

  emptyWrap: { paddingVertical: 26, alignItems: 'center' },
  emptyTitle: { fontWeight: '900', color: '#111', fontSize: 16 },
  emptySub: {
    marginTop: 8,
    color: '#777',
    fontWeight: '600',
    textAlign: 'center',
  },
  addAddressBtn: {
    marginTop: 16,
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FF3D3D',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAddressText: { color: '#FF3D3D', fontWeight: '900' },

  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEE',
    backgroundColor: '#FFF',
    marginBottom: 12,
  },
  cardSelected: { borderColor: '#FF3D3D', backgroundColor: '#FFF1F1' },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  radioOuterActive: { borderColor: '#FF3D3D' },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#FF3D3D',
  },
  addrLabel: { fontWeight: '900', color: '#111', fontSize: 13 },
  addrLine: {
    marginTop: 4,
    color: '#666',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 18,
  },
  addrMeta: {
    marginTop: 4,
    color: '#777',
    fontWeight: '600',
    fontSize: 11,
  },
  addrActions: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 12,
  },
  addrActionBtn: {
    paddingVertical: 2,
  },
  addrActionText: { color: '#111', fontWeight: '700', fontSize: 12 },
  addrActionDelete: { color: '#E53935', fontWeight: '700', fontSize: 12 },

  addInline: {
    marginTop: 4,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addInlineText: { color: '#FF3D3D', fontWeight: '900' },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderColor: '#EEE',
    padding: 16,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FF3D3D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryText: { color: '#FFF', fontWeight: '900', fontSize: 14 },
});