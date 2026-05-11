import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { PermissionsAndroid, Platform, Linking, ToastAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { getAddressFromCoordinates } from '../utils/locationUtils';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null); // Stores { city, country, fullAddress }
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState('undetermined');

  useEffect(() => {
    if (Platform.OS === 'android') {
      Geolocation.setRNConfiguration({
        skipPermissionRequests: false,
        authorizationLevel: 'whenInUse',
        locationProvider: 'auto',
      });
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        console.log('🔐 [Location] Checking/Requesting Android permissions...');
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);
        
        const isGranted = 
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED ||
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;

        if (isGranted) {
          setPermissionStatus('granted');
          return true;
        } else {
          const isNeverAsk = 
            granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ||
            granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN;
          
          setPermissionStatus(isNeverAsk ? 'never_ask_again' : 'denied');
          
          if (isNeverAsk) {
            ToastAndroid.show('Please enable location permission in App Settings', ToastAndroid.LONG);
          } else {
            ToastAndroid.show('Location permission is required', ToastAndroid.SHORT);
          }
          
          return false;
        }
      } catch (err) {
        console.error('Location permission error:', err);
        return false;
      }
    }
    setPermissionStatus('granted');
    return true;
  }, []);

  const fetchLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      console.log('📡 [Location] Starting getCurrentPosition fetch...');
      Geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          console.log('📍 [LocationContext] Global Location Obtained:', coords);
          setLocation(coords);
          
          // Fetch human-readable address globally
          try {
            const addrData = await getAddressFromCoordinates(coords.latitude, coords.longitude);
            console.log('🌍 [LocationContext] Global Address Obtained:', addrData.city, addrData.country);
            setAddress(addrData);
          } catch (addrErr) {
            console.warn('🌍 [LocationContext] Failed to geocode global address:', addrErr);
          }

          setIsLoading(false);
          resolve(coords);
        },
        (err) => {
          console.warn('📍 [LocationContext] Error obtaining location:', err.code, err.message);
          
          let msg = 'Unable to get location';
          if (err.code === 2) msg = 'Location is turned off. Please turn on GPS.';
          if (err.code === 3) msg = 'Location request timed out.';
          
          ToastAndroid.show(msg, ToastAndroid.SHORT);
          setError(msg);
          setIsLoading(false);
          reject(err);
        },
        { 
          enableHighAccuracy: false, 
          timeout: 15000, 
          maximumAge: 10000 
        }
      );
    });
  }, []);

  useEffect(() => {
    const initLocation = async () => {
      console.log('🌍 [Location] Initializing global location tracking...');
      const hasPermission = await requestPermission();
      
      if (hasPermission) {
        try {
          await fetchLocation();
        } catch (e) {
          console.log('🌍 [Location] Initial fetch failed.');
        }
      } else {
        setIsLoading(false);
      }
    };

    initLocation();
  }, [requestPermission, fetchLocation]);

  return (
    <LocationContext.Provider
      value={{
        location,
        address, // New: Globally available address
        error,
        isLoading,
        permissionStatus,
        fetchLocation,
        requestPermission
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);


