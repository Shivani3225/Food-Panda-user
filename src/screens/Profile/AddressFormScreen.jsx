import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin } from 'lucide-react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import useHideTabBar from '../../utils/hooks/useHideTabBar';
import apiClient from '../../config/apiClient';
import { USER_ROUTES } from '../../config/routes';
import { AuthContext, useAuth } from '../../context/AuthContext'; // Import AuthContext
import { getCityFromZipCode } from '../../utils/locationUtils';

const { width, height } = Dimensions.get('window');

const getAddressTypes = (t) => [t('address_form.home', 'Home'), t('address_form.work', 'Work'), `+ ${t('address_form.add_new', 'Add New')}`];

const normalizeLabelForApi = (label) => {
  const key = String(label || '').trim().toLowerCase();
  if (key === 'home') return 'Home';
  if (key === 'work') return 'Work';
  if (key === 'office') return 'Office';
  if (key === 'other') return 'Other';
  return 'Other';
};

const POSTCODE_RULES = {
  'india': { regex: /^[1-9][0-9]{5}$/, keyboard: 'number-pad', max: 6 },
  'germany': { regex: /^[0-9]{5}$/, keyboard: 'number-pad', max: 5 },
  'united states': { regex: /^\d{5}(-\d{4})?$/, keyboard: 'number-pad', max: 10 },
  'united kingdom': { regex: /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i, keyboard: 'default', max: 8 },
  'france': { regex: /^[0-9]{5}$/, keyboard: 'number-pad', max: 5 },
  'pakistan': { regex: /^[0-9]{5}$/, keyboard: 'number-pad', max: 5 },
};

const validateZip = (zip, country) => {
  const countryKey = String(country || '').trim().toLowerCase();
  const rule = POSTCODE_RULES[countryKey];
  if (rule) return rule.regex.test(zip.trim());
  return /^[a-z0-9\s-]{3,10}$/i.test(zip.trim());
};

export default function AddressFormScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { setAuthenticatedUser } = useAuth() || {}; // Use setAuthenticatedUser
  const address = route?.params?.address;
  const isEditing = !!address;

  const [customLabel, setCustomLabel] = useState(address?.label && !['home', 'work', 'office'].includes(address.label.toLowerCase()) ? address.label : '');

  const ADDRESS_TYPES = getAddressTypes(t);

  const [formData, setFormData] = useState({
    houseNo: address?.houseNo || '',
    streetArea: address?.streetArea || address?.addressLine || '',
    landmark: address?.landmark || '',
    city: address?.city || '',
    state: address?.state || '',
    zipCode: address?.zipCode || '',
    label: address?.label || 'home',
  });
  const [selectedLabel, setSelectedLabel] = useState(
    address?.label?.toLowerCase() || 'home'
  );
  const [isDefault, setIsDefault] = useState(address?.isDefault || false);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useHideTabBar(navigation);

  // Update form data when address params change (e.g. returning from Map Picker)
  React.useEffect(() => {
    if (address) {
      setFormData(prev => ({
        ...prev,
        houseNo: address.houseNo || prev.houseNo,
        streetArea: address.streetArea || address.addressLine || prev.streetArea,
        city: address.city || prev.city,
        state: address.state || prev.state,
        zipCode: address.zipCode || prev.zipCode,
        landmark: address.landmark || prev.landmark,
      }));
    }
  }, [address]);

  // Zip Code change hone par City/State auto-fill karne ke liye Effect
  React.useEffect(() => {
    const autoFillCity = async () => {
      const zip = formData.zipCode.trim();
      const countryName = address?.country || '';

      if (validateZip(zip, countryName)) {
        console.log(`🚀 [AddressForm] Fetching location for: ${zip}, ${countryName}`);
        const locationData = await getCityFromZipCode(zip, countryName);

        if (locationData) {
          console.log('✅ [AddressForm] Location data received:', locationData);
          setFormData(prev => ({
            ...prev,
            city: prev.city || locationData.city,
            state: prev.state || locationData.state,
            landmark: prev.landmark || locationData.area,
            streetArea: prev.streetArea || locationData.street || locationData.area,
          }));

          // Clear errors for fields that were just filled
          setErrors(prev => {
            const nextErrors = { ...prev };
            if (locationData.city) delete nextErrors.city;
            if (locationData.state) delete nextErrors.state;
            if (locationData.area || locationData.street) delete nextErrors.streetArea;
            delete nextErrors.zipCode;
            return nextErrors;
          });
        } else {
          // If API returns no results, it's an invalid pincode (like 111000, 999999)
          console.log(`❌ [AddressForm] No location found for: ${zip}`);
          setErrors(prev => ({ ...prev, zipCode: 'pincode is invalid write valid pincode' }));
        }
      } else if (zip.length > 0) {
        setErrors(prev => ({ ...prev, zipCode: 'pincode is invalid write valid pincode' }));
      }
    };

    const timer = setTimeout(autoFillCity, 600); // Debounce
    return () => clearTimeout(timer);
  }, [formData.zipCode, address?.country]);

  const handleInputChange = (field, value) => {
    let finalValue = value;
    if (field === 'zipCode') {
      const countryName = address?.country?.toLowerCase() || '';
      const rule = POSTCODE_RULES[countryName];

      // 1. Character restriction
      if (rule?.keyboard === 'number-pad') {
        finalValue = value.replace(/[^0-9]/g, '');
        // Special case: India pincode can't start with 0
        if (countryName === 'india' && finalValue.startsWith('0')) {
          finalValue = finalValue.substring(1);
        }
      } else {
        finalValue = value.replace(/[^a-zA-Z0-9\s-]/g, '');
      }

      // 2. Length restriction
      if (rule?.max && finalValue.length > rule.max) {
        finalValue = finalValue.substring(0, rule.max);
      }

      // 3. Real-time error message
      if (finalValue.length > 0 && !validateZip(finalValue, countryName)) {
        setErrors(prev => ({ ...prev, zipCode: 'pincode is invalid write valid pincode' }));
      } else {
        setErrors(prev => ({ ...prev, zipCode: '' }));
      }
    }

    setFormData(prev => ({ ...prev, [field]: finalValue }));
    if (field !== 'zipCode' && errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.houseNo.trim())
      newErrors.houseNo = t('address_form.house_no_required', 'House No. is required');
    if (!formData.streetArea.trim())
      newErrors.streetArea = t('address_form.street_area_required', 'Street/Area is required');
    if (!formData.city.trim()) newErrors.city = t('address_form.city_required', 'City is required');
    if (!formData.state.trim()) newErrors.state = t('address_form.state_required', 'State is required');
    if (!formData.zipCode.trim()) newErrors.zipCode = t('address_form.zip_required', 'Zip code is required');
    else {
      const zip = formData.zipCode.trim();
      const countryName = address?.country || '';
      if (!validateZip(zip, countryName)) {
        newErrors.zipCode = 'pincode is invalid write valid pincode';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const refreshAuthenticatedUser = async (responseData) => {
    if (!setAuthenticatedUser) return;

    if (responseData?.user) {
      await setAuthenticatedUser(null, responseData.user);
      console.log('[AddressForm] AuthContext updated with response user data.');
      return;
    }

    try {
      const profileResponse = await apiClient.get(USER_ROUTES.profile);
      const latestUser = profileResponse?.data?.user || profileResponse?.data;
      if (latestUser) {
        await setAuthenticatedUser(null, latestUser);
        console.log('[AddressForm] AuthContext refreshed from profile.');
      }
    } catch (profileError) {
      console.warn('[AddressForm] Could not refresh profile after address save:', profileError?.message);
    }
  };

  const handleAddAddress = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);

      const payload = {
        houseNo: formData.houseNo.trim(),
        streetArea: formData.streetArea.trim(),
        landmark: formData.landmark.trim(),
        addressLine: `${formData.houseNo.trim()}, ${formData.streetArea.trim()}`,
        city: formData.city.trim(),
        state: formData.state.trim(),
        zipCode: formData.zipCode.trim(),
        label: selectedLabel === 'other' ? (customLabel.trim() || 'Other') : normalizeLabelForApi(selectedLabel),
        isDefault,
        ...(address?.coordinates && {
          location: {
            type: 'Point',
            coordinates: address.coordinates,
          },
        }),
      };

      let response;

      const addressId = address?._id || address?.id;

      const savedAddressForHome = {
        ...(address || {}),
        ...payload,
        _id: addressId,
        id: addressId,
        updatedAt: new Date().toISOString(),
      };

      if (isEditing && addressId) {
        const updateUrl = USER_ROUTES.addressById.replace(':id', addressId);
        response = await apiClient.put(updateUrl, payload);
        Toast.show({
          type: 'topSuccess',
          text1: t('common.success', 'Success'),
          text2: t('address_form.address_updated', 'Address updated successfully!'),
          position: 'top',
        });
      } else {
        response = await apiClient.post(USER_ROUTES.addresses, payload);
        const responseAddress = response?.data?.address || response?.data?.savedAddress || response?.data;
        savedAddressForHome._id = responseAddress?._id || responseAddress?.id || savedAddressForHome._id;
        savedAddressForHome.id = savedAddressForHome._id;
        Toast.show({
          type: 'topSuccess',
          text1: t('common.success', 'Success'),
          text2: t('address_form.address_added', 'Address added successfully!'),
          position: 'top',
        });
      }

      console.log('Address saved:', response?.data);
      await refreshAuthenticatedUser(response?.data);

      setTimeout(() => {
        navigation.dispatch(
          CommonActions.navigate({
            name: 'Home',
            params: {
              screen: 'HomePage',
              params: {
                selectedAddress: savedAddressForHome,
                addressUpdatedAt: Date.now(),
              },
            },
          })
        );
      }, 600);

    } catch (error) {
      console.error('Error saving address:', error);
      const errorMsg =
        error?.response?.data?.message ||
        error.message ||
        t('address_form.save_failed', 'Failed to save address. Please try again.');
      Toast.show({
        type: 'topError',
        text1: t('common.error', 'Error'),
        text2: errorMsg,
        position: 'top',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getAddressDisplay = () => {
    return address?.fullAddress ||
      t('address_form.no_location_selected', 'No location selected. Please select from map.');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t('address_form.add_new_address', 'Add New Address')}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Address Section */}
          <View style={styles.addressSection}>
            <Text style={styles.sectionTitle}>{t('address_form.selected_location', 'Selected Location')}</Text>

            {/* Location Display */}
            <TouchableOpacity
              style={styles.locationBox}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('AddAddressScreen', { address })}
            >
              <View style={styles.locationHeader}>
                <MapPin size={18} color="#E41C26" strokeWidth={2.5} />
                <Text style={styles.locationBoxTitle}>{t('address_form.map_location', 'Map Location')}</Text>
              </View>
              <Text style={styles.locationText}>{getAddressDisplay()}</Text>
            </TouchableOpacity>
          </View>

          {/* Location Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('address_form.location_details', 'Location Details')}</Text>

            {/* House / Flat / Building No Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  errors.houseNo && styles.inputError,
                ]}
                placeholder={t('address_form.house_no_placeholder', 'House / Flat / Building No.')}
                placeholderTextColor="#999"
                value={formData.houseNo}
                onChangeText={(value) => handleInputChange('houseNo', value)}
              />
              {errors.houseNo && (
                <Text style={styles.errorText}>{errors.houseNo}</Text>
              )}
            </View>

            {/* Area Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  errors.streetArea && styles.inputError,
                ]}
                placeholder={t('address_form.area_placeholder', 'Area')}
                placeholderTextColor="#999"
                value={formData.streetArea}
                onChangeText={(value) => handleInputChange('streetArea', value)}
              />
              {errors.streetArea && (
                <Text style={styles.errorText}>{errors.streetArea}</Text>
              )}
            </View>

            {/* City Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, errors.city && styles.inputError]}
                placeholder={t('address_form.city_placeholder', 'City')}
                placeholderTextColor="#999"
                value={formData.city}
                onChangeText={(value) => handleInputChange('city', value)}
              />
              {errors.city && (
                <Text style={styles.errorText}>{errors.city}</Text>
              )}
            </View>

            {/* State Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, errors.state && styles.inputError]}
                placeholder={t('address_form.state_placeholder', 'State')}
                placeholderTextColor="#999"
                value={formData.state}
                onChangeText={(value) => handleInputChange('state', value)}
              />
              {errors.state && (
                <Text style={styles.errorText}>{errors.state}</Text>
              )}
            </View>

            {/* Zip Code Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  errors.zipCode && styles.inputError,
                ]}
                placeholder={t('address_form.zip_placeholder', 'Zip Code')}
                placeholderTextColor="#999"
                value={formData.zipCode}
                keyboardType={POSTCODE_RULES[address?.country?.toLowerCase()]?.keyboard || 'default'}
                maxLength={POSTCODE_RULES[address?.country?.toLowerCase()]?.max || 10}
                autoCapitalize={address?.country?.toLowerCase() === 'united kingdom' ? 'characters' : 'none'}
                onChangeText={(value) => handleInputChange('zipCode', value)}
              />
              {errors.zipCode && (
                <Text style={styles.errorText}>{errors.zipCode}</Text>
              )}
            </View>

            {/* Landmark Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={t('address_form.landmark_placeholder', 'Landmark (Optional)')}
                placeholderTextColor="#999"
                value={formData.landmark}
                onChangeText={(value) => handleInputChange('landmark', value)}
              />
            </View>
          </View>

          {/* Save Address As Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('address_form.save_as', 'Save Address as')}</Text>

            <View style={styles.tagsContainer}>
              {ADDRESS_TYPES.map((type) => {
                let isSelected = false;

                if (type === t('address_form.home', 'Home') && selectedLabel === 'home') isSelected = true;
                if (type === t('address_form.work', 'Work') && selectedLabel === 'work') isSelected = true;
                if (type === `+ ${t('address_form.add_new', 'Add New')}` && selectedLabel === 'other') isSelected = true;

                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.tag, isSelected && styles.tagActive]}
                    onPress={() => {
                      if (type === t('address_form.home', 'Home')) setSelectedLabel('home');
                      else if (type === t('address_form.work', 'Work')) setSelectedLabel('work');
                      else setSelectedLabel('other');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        isSelected && styles.tagTextActive,
                      ]}
                    >
                      {type === `+ ${t('address_form.add_new', 'Add New')}` && selectedLabel === 'other' && customLabel ? customLabel : type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Custom Label Input - Only shows if 'Other' (+ Add New) is selected */}
          {selectedLabel === 'other' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('address_form.custom_label', 'Label Name')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('address_form.custom_label_placeholder', 'e.g. Gym, Cafe, Friend\'s House')}
                placeholderTextColor="#999"
                value={customLabel}
                onChangeText={setCustomLabel}
              />
            </View>
          )}

          {/* Set as Default */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.defaultRow}
              onPress={() => setIsDefault(!isDefault)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  isDefault && styles.checkboxActive,
                ]}
              >
                {isDefault && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={styles.defaultText}>
                {t('address_form.set_as_default', 'Set as default delivery address')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Add Address Button */}
        <View style={[styles.buttonsContainer, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={[styles.addButton, isSaving && styles.addButtonDisabled]}
            onPress={handleAddAddress}
            activeOpacity={0.85}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.addButtonText}>
                {isEditing ? t('address_form.save_changes', 'Save Changes') : t('address_form.add_address', 'Add Address')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.04,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: width > 400 ? 18 : 16,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: width * 0.04,
    paddingTop: height * 0.02,
    paddingBottom: height * 0.02,
  },
  addressSection: {
    marginBottom: height * 0.025,
  },
  section: {
    marginBottom: height * 0.025,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  locationBox: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: width * 0.04,
    backgroundColor: '#f9f9f9',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationBoxTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E41C26',
    marginLeft: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 21,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.018,
    fontSize: 14,
    color: '#000',
    backgroundColor: '#fff',
    fontWeight: '500',
  },
  inputError: {
    borderColor: '#E41C26',
  },
  errorText: {
    color: '#E41C26',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    backgroundColor: '#fff',
    minWidth: width * 0.28,
    alignItems: 'center',
  },
  tagActive: {
    backgroundColor: '#E41C26',
    borderColor: '#E41C26',
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  tagTextActive: {
    color: '#fff',
  },
  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxActive: {
    borderColor: '#E41C26',
    backgroundColor: '#E41C26',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  defaultText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  buttonsContainer: {
    paddingHorizontal: width * 0.04,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  addButton: {
    backgroundColor: '#E41C26',
    borderRadius: 12,
    paddingVertical: height * 0.017,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#E41C26',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addButtonDisabled: {
    backgroundColor: '#cc1a22',
    opacity: 0.8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
