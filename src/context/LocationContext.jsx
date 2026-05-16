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

    const getPos = (highAccuracy) => new Promise((resolve, reject) => {
      console.log(`📡 [Location] Fetching (HighAccuracy: ${highAccuracy})...`);
      Geolocation.getCurrentPosition(
        resolve,
        reject,
        { 
          enableHighAccuracy: highAccuracy, 
          timeout: highAccuracy ? 15000 : 10000, 
          maximumAge: highAccuracy ? 0 : 60000 
        }
      );
    });

    const updateContextData = async (position, sourceLabel) => {
      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      
      console.log(`📍 [LocationContext] ${sourceLabel} DATA RECEIVED:`, JSON.stringify(coords));
      setLocation(coords);
      
      try {
        const addrData = await getAddressFromCoordinates(coords.latitude, coords.longitude);
        console.log(`🌍 [LocationContext] ${sourceLabel} Address Obtained:`, addrData.city);
        setAddress(addrData);
      } catch (addrErr) {
        console.warn(`🌍 [LocationContext] Failed to geocode ${sourceLabel} address:`, addrErr);
      }
      setIsLoading(false);
      return coords;
    };

    try {
      // 1. PHASE 1: Network First (Fast)
      let networkPosition;
      try {
        networkPosition = await getPos(false);
        await updateContextData(networkPosition, 'NETWORK');
      } catch (networkErr) {
        console.warn('📍 [LocationContext] Network fetch failed:', networkErr.message);
      }

      // 2. PHASE 2: GPS Upgrade (Accurate - Background)
      // We don't 'await' this for UI speed, but we trigger it
      const upgradeToGPS = async () => {
        try {
          const gpsPosition = await getPos(true);
          await updateContextData(gpsPosition, 'GPS-UPGRADE');
        } catch (gpsErr) {
          console.log('📍 [LocationContext] GPS Upgrade failed or timed out.');
        }
      };

      upgradeToGPS(); // Run in background

      // Return the network coords (or null if it failed) so HomePage can proceed
      return networkPosition ? {
        latitude: networkPosition.coords.latitude,
        longitude: networkPosition.coords.longitude,
      } : null;

    } catch (err) {
      console.warn('📍 [LocationContext] All location phases failed:', err.message);
      let msg = 'Unable to get location';
      setError(msg);
      setIsLoading(false);
      throw err;
    }
  }, []);

  useEffect(() => {
    let watchId = null;

    const initLocation = async () => {
      console.log('🌍 [Location] Initializing global location tracking...');
      const hasPermission = await requestPermission();
      
      if (hasPermission) {
        try {
          await fetchLocation();
          
          // Start watching position for more accurate updates
          watchId = Geolocation.watchPosition(
            async (position) => {
              const coords = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };
              console.log('📡 [LocationContext] WATCH UPDATE:', JSON.stringify(coords));
              setLocation(coords);
              
              try {
                const addrData = await getAddressFromCoordinates(coords.latitude, coords.longitude);
                setAddress(addrData);
              } catch (e) {
                console.warn('Watch geocode failed');
              }
            },
            (err) => {
              console.log('Watch error:', err);
              // If high accuracy watch fails, we don't necessarily want to kill it, 
              // but we log it for debugging.
            },
            { 
              enableHighAccuracy: true, 
              distanceFilter: 10, // More frequent updates (every 10m)
              interval: 5000, 
              fastestInterval: 2000 
            }
          );
        } catch (e) {
          console.log('🌍 [Location] Initial fetch failed.');
        }
      } else {
        setIsLoading(false);
      }
    };

    initLocation();

    return () => {
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
      }
    };
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


