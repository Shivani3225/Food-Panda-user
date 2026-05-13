/**
 * Reverse Geocoding utility to get human-readable address from coordinates
 * Uses Google Maps Geocoding API as primary and OpenStreetMap Nominatim as fallback
 */

import { GOOGLE_MAPS_API_KEY } from '@env';

export const getAddressFromCoordinates = async (latitude, longitude) => {
  console.log('🔍 [LocationUtils] Reverse geocoding:', latitude, longitude);

  // 1. Try Google Maps Geocoding API (Preferred for production/reliability)
  try {
    const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
    console.log('📡 [LocationUtils] Calling Google Geocoding...');
    const response = await fetch(googleUrl);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      console.log('✅ [LocationUtils] Google Geocoding success');
      let result = data.results.find(r => 
        r.types.includes('street_address') || 
        r.types.includes('premise') || 
        r.types.includes('subpremise') || 
        r.types.includes('point_of_interest') ||
        r.types.includes('route') ||
        r.types.includes('neighborhood')
      ) || data.results[0];
      const addressComponents = result.address_components;

      let city = '';
      let country = '';
      let zipCode = '';
      let road = '';
      let houseNumber = '';
      let sublocality = '';
      let state = ''; // Added state
      let neighborhood = '';

      addressComponents.forEach(component => {
        if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
          city = component.long_name;
        }
        if (component.types.includes('country')) {
          country = component.long_name;
        }
        if (component.types.includes('postal_code')) {
          zipCode = component.long_name;
        }
        if (component.types.includes('route')) {
          road = component.long_name;
        }
        if (component.types.includes('street_number')) {
          houseNumber = component.long_name;
        }
        if (component.types.includes('sublocality') || component.types.includes('sublocality_level_1') || component.types.includes('sublocality_level_2')) {
          if (!sublocality) sublocality = component.long_name;
        }
        if (component.types.includes('neighborhood')) {
          neighborhood = component.long_name;
        }
        if (component.types.includes('administrative_area_level_1')) { // Extract state
          state = component.long_name;
        }
      });

      // Build addressLine — use best available data
      let addressLine = '';
      // Prioritize house number and road for addressLine
      if (road) {
        addressLine = `${houseNumber ? houseNumber + ' ' : ''}${road}`;
      } else if (sublocality) {
        addressLine = sublocality;
      } else if (neighborhood) {
        addressLine = neighborhood;
      } else if (result.formatted_address) {
        // Take first part of formatted address (before first comma)
        addressLine = result.formatted_address.split(',')[0].trim();
      }

      return {
        houseNo: houseNumber || '',
        streetArea: sublocality || neighborhood || road || '', // Prioritize sublocality for 'Area' field
        landmark: neighborhood || sublocality || road || '',
        addressLine: addressLine,
        city: city || '',
        state: state || '',
        country: country || '',
        zipCode: zipCode || '',
        fullAddress: result.formatted_address || '',
      };
    }
    console.log('⚠️ [LocationUtils] Google Geocoding status:', data.status);
  } catch (error) {
    console.error('❌ [LocationUtils] Google Geocoding error:', error);
  }

  // 2. Fallback to OpenStreetMap Nominatim API
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FoodDeliveryApp/1.0',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.address) {
        const address = data.address;
        return {
          houseNo: address.house_number || '', // New: House number
          streetArea: address.road || address.pedestrian || address.suburb || address.neighbourhood || '', // New: Street/Area
          landmark: address.suburb || address.neighbourhood || '', // New: Landmark
          addressLine: address.road || address.pedestrian || '',
          city: address.city || address.town || address.village || address.state || '',
          state: address.state || '', // New: State
          country: address.country || '',
          zipCode: address.postcode || '',
          fullAddress: data.display_name || '',
        };
      }
    }
  } catch (error) {
    console.error('❌ [LocationUtils] Nominatim fallback error:', error);
  }

  // Final fallback: Return coordinates as strings
  return {
    addressLine: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
    city: '',
    country: '',
    zipCode: '',
    fullAddress: '',
  };
};

/**
 * Zip Code/Pincode se City/Area fetch karne ke liye utility
 */
export const getCityFromZipCode = async (zipCode, countryName = '') => {
  if (!zipCode || zipCode.length < 3) return null;
  
  const fetchFromGoogle = async (q, componentsFilter = '') => {
    let url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${GOOGLE_MAPS_API_KEY}`;
    if (componentsFilter) url += `&components=${encodeURIComponent(componentsFilter)}`;
    const response = await fetch(url);
    return await response.json();
  };

  try {
    // 1. Pehle current country ke context mein search karein
    const query = countryName ? `${zipCode}, ${countryName}` : zipCode;
    let data = await fetchFromGoogle(query, `postal_code:${zipCode}`);

    // 2. Ultra Fallback (Broad Search): Agar strict postal_code filter se results nahi milte,
    // toh bina filters ke broad text search try karein. 
    // Yeh C1000 ya B2000 jaise alphanumeric codes ke liye zaroori hai.
    if (data.status === 'ZERO_RESULTS') {
      console.log('🔍 [LocationUtils] Zero results with strict filter, trying broad text search for:', zipCode);
      data = await fetchFromGoogle(zipCode);
    }

    // 3. Global Fallback for Generic results: Agar sirf country return ho (political result), 
    // toh global search try karein
    if (
      (data.status === 'ZERO_RESULTS' || 
      (data.status === 'OK' && data.results?.[0]?.types?.includes('country'))) && 
      countryName
    ) {
      console.log('🌐 [LocationUtils] Retrying with Global search for:', zipCode);
      data = await fetchFromGoogle(zipCode, `postal_code:${zipCode}`);
    }
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      console.log('📡 [LocationUtils] Google Formatted Address:', result.formatted_address);
      const components = result.address_components;
      let city = '';
      let sublocality = '';
      let country = '';
      let state = '';
      let town = '';
      let street = '';
      let district = ''; // administrative_area_level_2
      
      components.forEach(component => {
        const types = component.types;
        
        // Global Area detection (prioritize most specific)
        if (
          types.includes('neighborhood') || 
          types.includes('sublocality_level_2') || 
          types.includes('sublocality_level_3')
        ) {
          if (!sublocality) sublocality = component.long_name;
        } else if (types.includes('sublocality_level_1') && !sublocality) {
          sublocality = component.long_name;
        } else if (types.includes('sublocality') && !sublocality) {
          sublocality = component.long_name;
        } else if (types.includes('administrative_area_level_3') && !sublocality) {
          sublocality = component.long_name;
        } else if (types.includes('premise') && !sublocality) { // Specific building/complex
          sublocality = component.long_name;
        } else if (types.includes('colloquial_area') && !sublocality) { // Common local name
          sublocality = component.long_name;
        }
        
        // Global City detection (prioritize most specific)
        if (types.includes('locality') && !city) {
          city = component.long_name;
        } else if (types.includes('postal_town')) {
          town = component.long_name;
        }
        
        if (types.includes('administrative_area_level_2') && !district) district = component.long_name;
        if (types.includes('administrative_area_level_1') && !state) state = component.long_name;
        if (types.includes('country') && !country) country = component.long_name;
        if (types.includes('route')) street = component.long_name;
      });

      // Final City selection: Locality > Postal Town > District > State
      const finalCity = city || town || district || state || '';

      // Smart Area Fallback: Agar components mein area nahi hai, toh formatted_address ka use karein
      if (!sublocality && result.formatted_address) {
        const parts = result.formatted_address.split(',');
        const firstPart = parts[0].trim();
        
        const cityLower = finalCity.toLowerCase() || '';
        const firstLower = firstPart.toLowerCase();
        const countryLower = country.toLowerCase() || (countryName || '').toLowerCase(); // Use actual country or passed countryName
        const stateLower = state.toLowerCase() || '';
        const districtLower = district.toLowerCase() || '';
        const zipLower = zipCode.toLowerCase();

        // Agar formatted address ka pehla hissa City, State, Country, District ya Pincode nahi hai, toh wo Area hai
        if (
          firstLower !== cityLower && 
          firstLower !== countryLower && 
          firstLower !== stateLower &&
          firstLower !== districtLower &&
          firstLower !== zipLower && 
          !['india', 'pakistan', 'nepal', 'united states', 'united kingdom', 'germany', 'france', 'canada', 'australia'].includes(firstLower) // Add more common country names
        ) {
          sublocality = firstPart;
        }
      }

      return {
        city: finalCity,
        area: sublocality || '',
        state: state || '',
        street: street || '',
        country: country || '', // Return country for better context in AddressFormScreen
      };
    }
  } catch (error) {
    console.error('❌ [LocationUtils] Zip code geocoding error:', error);
  }
  return null;
};

/**
 * Search locations based on a text query
 */
export const searchLocations = async (query) => {
  if (!query || query.length < 3) return [];

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`;
    console.log('📡 [LocationUtils] Searching location:', query);
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results) {
      return data.results.map(result => ({
        description: result.formatted_address,
        placeId: result.place_id,
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
      }));
    }
    return [];
  } catch (error) {
    console.error('❌ [LocationUtils] Search error:', error);
    return [];
  }
};

/**
 * Fetch location based on IP address
 */
export const getLocationByIP = async () => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    if (data && data.latitude && data.longitude) {
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city,
        country: data.country_name,
        zipCode: data.postal,
        fullAddress: `${data.city}, ${data.country_name}`,
      };
    }
  } catch (error) {
    console.error('❌ [LocationUtils] IP location error:', error);
  }
  return null;
};
