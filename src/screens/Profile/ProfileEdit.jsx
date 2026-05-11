import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  TextInput,
  Modal,
  FlatList,
  PermissionsAndroid,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, ChevronDown } from 'lucide-react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import MaterialTextInput from '../../components/input/MaterialTextInput';
import useHideTabBar from "../../utils/hooks/useHideTabBar";
import apiClient from '../../config/apiClient';
import { USER_ROUTES } from '../../config/routes';
import { updateUserProfile, verifyProfileOtp, resendProfileOtp } from '../../services/userService';
import OTPVerificationModal from '../../components/OTPVerificationModal';
import { useCountries } from '../../context/CountryContext';
import { clearTranslationCache } from '../../services/translationService';
import AsyncStorage from '@react-native-async-storage/async-storage';



const ProfileScreen = () => {
  const { t, i18n } = useTranslation();
  const { countries } = useCountries();
  const navigation = useNavigation();
  useHideTabBar(navigation);

  // Profile data states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [language, setLanguage] = useState('en');
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageFile, setProfileImageFile] = useState(null);

  // Country code states
  const [selectedCountry, setSelectedCountry] = useState(countries[0] || {});
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');

  // Original values for comparison
  const [originalData, setOriginalData] = useState({});

  // Loading states
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // OTP modal states
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(null);

  // Fetch user profile on mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Parse mobile number to extract country code and number
  const parseMobileNumber = (fullMobileNumber) => {
    if (!fullMobileNumber) return { country: countries[0] || {}, number: '' };

    for (const country of countries) {
      // Check both dialCode and code (with +)
      if (fullMobileNumber.startsWith(country.fullCode) || fullMobileNumber.startsWith(country.dialCode)) {
        const prefix = fullMobileNumber.startsWith(country.fullCode) ? country.fullCode : country.dialCode;
        const number = fullMobileNumber.substring(prefix.length);
        return { country, number };
      }
    }

    return { country: countries[0] || {}, number: fullMobileNumber };
  };

  const fetchUserProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const response = await apiClient.get(USER_ROUTES.profile);
      const user = response?.data?.user || response?.data;

      // Split name into first and last name
      const fullName = user?.name || '';
      const nameParts = fullName.trim().split(/\s+/);
      const fName = nameParts[0] || '';
      const lName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      setFirstName(fName);
      setLastName(lName);
      setEmail(user?.email || '');

      const fullMobile = user?.mobile || '';
      const { country, number } = parseMobileNumber(fullMobile);
      setSelectedCountry(country);
      setMobileNumber(number);
      setMobile(fullMobile);

      setLanguage(user?.language || 'en');
      setProfileImage(user?.profilePic || null);

      setOriginalData({
        firstName: fName,
        lastName: lName,
        email: user?.email || '',
        mobile: fullMobile,
        language: user?.language || 'en',
        countryCode: country.code,
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      Alert.alert(t('common.error', 'Error'), t('profile.load_failed', 'Failed to load profile data'));
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      t('profile.change_photo_title', 'Change Profile Picture'),
      t('profile.choose_option', 'Choose an option'),
      [
        { text: t('profile.take_photo', 'Take Photo'), onPress: openCamera },
        { text: t('profile.choose_gallery', 'Choose from Gallery'), onPress: openGallery },
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const openCamera = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: t('profile.camera_permission_title', 'Camera Permission'),
            message: t('profile.camera_permission_msg', 'App needs access to your camera to take a profile picture.'),
            buttonNeutral: t('common.ask_me_later', 'Ask Me Later'),
            buttonNegative: t('common.cancel', 'Cancel'),
            buttonPositive: t('common.ok', 'OK'),
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(t('common.error', 'Error'), t('profile.camera_permission_denied', 'Camera permission denied'));
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }

    const options = { mediaType: 'photo', quality: 0.8, maxWidth: 1000, maxHeight: 1000, includeBase64: false, saveToPhotos: false };
    launchCamera(options, handleImageResponse);
  };

  const openGallery = () => {
    const options = { mediaType: 'photo', quality: 0.8, maxWidth: 1000, maxHeight: 1000, includeBase64: false };
    launchImageLibrary(options, handleImageResponse);
  };

  const handleImageResponse = (response) => {
    if (response.didCancel) return;
    if (response.errorCode) {
      Alert.alert(t('common.error', 'Error'), t('profile.image_picker_failed', 'Failed to pick image. Please try again.'));
      return;
    }
    if (response.assets && response.assets.length > 0) {
      const asset = response.assets[0];
      setProfileImage(asset.uri);
      setProfileImageFile({ uri: asset.uri, type: asset.type || 'image/jpeg', name: asset.fileName || `profile_${Date.now()}.jpg` });
    }
  };

  const validateMobileNumber = (number, country) => {
    if (!country || !number) return false;
    
    // Length check
    const isLengthValid = number.length >= country.minLength && number.length <= country.maxLength;
    if (!isLengthValid) {
      console.log(`📱 [ProfileEdit] Mobile Length Invalid: ${number.length} for ${country.country}`);
      return false;
    }

    // India specific check (Starts with 6, 7, 8, or 9)
    if (country.code === 'IN' && !/^[6-9]/.test(number)) {
      console.log(`📱 [ProfileEdit] Indian Mobile Start Digit Invalid: ${number}`);
      return false;
    }

    console.log(`📱 [ProfileEdit] Mobile Validation Passed: ${number} for ${country.country}`);
    return true;
  };

  const handleMobileChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    const limited = cleaned.slice(0, selectedCountry.maxLength);
    setMobileNumber(limited);
    setMobile(`${selectedCountry.fullCode}${limited}`);
  };

  const handleUpdateProfile = async () => {
    console.log('🔍 [ProfileEdit] Validating inputs...', { firstName, lastName, email, mobileNumber });

    if (!firstName.trim()) {
      Alert.alert(t('common.error', 'Error'), t('profile.firstname_required', 'Please enter your first name'));
      return;
    }
    if (!lastName.trim()) {
      Alert.alert(t('common.error', 'Error'), t('profile.lastname_required', 'Please enter your last name'));
      return;
    }
    if (!mobileNumber.trim()) {
      Alert.alert(t('common.error', 'Error'), t('profile.mobile_required', 'Please enter your mobile number'));
      return;
    }
    if (!validateMobileNumber(mobileNumber, selectedCountry)) {
      console.log(`❌ [ProfileEdit] Invalid mobile number: ${mobileNumber} (Length: ${mobileNumber.length}) for ${selectedCountry.country}`);
      Alert.alert(
        t('common.error', 'Error'),
        t('profile.invalid_mobile', `Mobile number ${mobileNumber} is invalid for ${selectedCountry.country}. It should be ${selectedCountry.minLength === selectedCountry.maxLength ? selectedCountry.minLength : selectedCountry.minLength + '-' + selectedCountry.maxLength} digits long (currently ${mobileNumber.length} digits).`)
      );
      return;
    }
    if (!email.trim()) {
      Alert.alert(t('common.error', 'Error'), t('profile.email_required', 'Please enter your email'));
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      console.log(`❌ [ProfileEdit] Invalid email address: ${email}`);
      Alert.alert(
        t('common.error', 'Error'),
        t('profile.invalid_email', `The email address "${email}" is invalid. Please enter a valid email format like name@example.com.`)
      );
      return;
    }

    console.log('✅ [ProfileEdit] Validation passed');
    const fullMobileNumber = `${selectedCountry.fullCode}${mobileNumber}`;
    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    try {
      setIsUpdating(true);
      const formData = new FormData();

      if (firstName !== originalData.firstName || lastName !== originalData.lastName) {
        formData.append('name', fullName);
      }

      const emailChanged = email.trim() !== originalData.email;
      const mobileChanged = fullMobileNumber !== originalData.mobile;

      if (emailChanged) formData.append('email', email.trim());

      if (emailChanged || mobileChanged) {
        formData.append('mobile', fullMobileNumber);
        formData.append('countryCode', selectedCountry.code);
        formData.append('country', selectedCountry.country);
      }

      if (language !== originalData.language) formData.append('language', language);
      if (profileImageFile) formData.append('profilePic', profileImageFile);

      console.log('📤 [ProfileEdit] Sending update payload...', {
        firstName,
        lastName,
        fullName,
        email: email.trim(),
        mobile: fullMobileNumber,
        language,
        emailChanged,
        mobileChanged
      });

      const response = await updateUserProfile(formData);

      console.log('📥 [ProfileEdit] API Response:', response);

      if (response?.requiresOTP) {
        setPendingUpdate(response);
        setShowOTPModal(true);
        Alert.alert(
          t('profile.verification_required', 'Verification Required'),
          response?.message || t('profile.verification_message', 'Please verify your changes with the OTP sent to your email/mobile')
        );
      } else {
        // Change language if updated
        if (language !== originalData.language) {
          console.log('🌐 [ProfileEdit] Changing language to:', language);
          clearTranslationCache();
          await AsyncStorage.setItem('@app_language', language);
          i18n.changeLanguage(language);
        }

        Alert.alert(t('common.success', 'Success'), t('profile.update_success', 'Profile updated successfully!'), [
          { text: t('common.ok', 'OK'), onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(t('common.error', 'Error'), error?.response?.data?.message || t('profile.update_failed', 'Failed to update profile'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleVerifyOTP = async (otp) => {
    try {
      setIsVerifying(true);
      await verifyProfileOtp(otp);

      // Change language if it was part of the update
      if (language !== originalData.language) {
        console.log('🌐 [ProfileEdit] Changing language after OTP verification to:', language);
        clearTranslationCache();
        await AsyncStorage.setItem('@app_language', language);
        i18n.changeLanguage(language);
      }

      setShowOTPModal(false);
      Alert.alert(t('common.success', 'Success'), t('profile.update_success', 'Profile updated successfully!'), [
        { text: t('common.ok', 'OK'), onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert(t('common.error', 'Error'), error?.response?.data?.message || t('profile.invalid_otp', 'Invalid OTP'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await resendProfileOtp();
      Alert.alert(t('common.success', 'Success'), t('profile.otp_resent', 'OTP resent successfully'));
    } catch (error) {
      Alert.alert(t('common.error', 'Error'), t('profile.otp_resend_failed', 'Failed to resend OTP'));
    }
  };

  const renderCountryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => {
        setSelectedCountry(item);
        setShowCountryPicker(false);
        setMobileNumber('');
        setMobile('');
      }}
    >
      <Text style={styles.countryFlag}>{item.flag}</Text>
      <View style={styles.countryInfo}>
        <Text style={styles.countryName}>{item.country}</Text>
        <Text style={styles.countryCode}>{item.code}</Text>
      </View>
      {selectedCountry.code === item.code && <Text style={styles.checkmark}>✓</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <ArrowLeft size={22} color="#000" />
            </TouchableOpacity>
            <Text style={styles.title}>{t('profile.title', 'Profile')}</Text>
            <View style={{ width: 24 }} />
          </View>

          {isLoadingProfile ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ed1c24" />
              <Text style={styles.loadingText}>{t('profile.loading', 'Loading profile...')}</Text>
            </View>
          ) : (
            <>
              <View style={styles.profileImageContainer}>
                <View style={styles.imageWrapper}>
                  <Image source={profileImage ? { uri: profileImage } : require('../../assets/icons/user.png')} style={styles.profileImage} />
                  <TouchableOpacity style={styles.cameraButton} onPress={showImagePickerOptions} activeOpacity={0.8}>
                    <Camera size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={showImagePickerOptions}>
                  <Text style={styles.changePhotoText}>{t('profile.change_photo', 'Change Profile Picture')}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.form}>
                <MaterialTextInput
                  label={t('profile.first_name', 'First Name')}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder={t('profile.first_name_placeholder', 'Enter First Name')}
                  autoCapitalize="words"
                />
                <MaterialTextInput
                  label={t('profile.last_name', 'Last Name')}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder={t('profile.last_name_placeholder', 'Enter Last Name')}
                  autoCapitalize="words"
                />
                <MaterialTextInput label={t('profile.email', 'Email')} value={email} onChangeText={setEmail} placeholder={t('profile.email_placeholder', 'Enter your email')} keyboardType="email-address" autoCapitalize="none" />

                <View style={styles.mobileContainer}>
                  <Text style={styles.mobileLabel}>{t('profile.mobile_number', 'Mobile Number')}</Text>
                  <View style={styles.mobileInputWrapper}>
                    <TouchableOpacity style={styles.countryCodeSelector} onPress={() => setShowCountryPicker(true)}>
                      <Text style={styles.countryFlagSmall}>{selectedCountry.flag}</Text>
                      <Text style={styles.countryCodeText}>{selectedCountry.fullCode}</Text>
                      <ChevronDown size={14} color="#666" />
                    </TouchableOpacity>
                    <TextInput style={styles.mobileInput} value={mobileNumber} onChangeText={handleMobileChange} placeholder={t('profile.mobile_placeholder', 'Enter your mobile number')} keyboardType="phone-pad" maxLength={selectedCountry.maxLength} placeholderTextColor="#999" />
                  </View>
                  <Text style={styles.hintText}>{selectedCountry.country} ({selectedCountry.maxLength} digits)</Text>
                </View>

                <View style={styles.languageContainer}>
                  <Text style={styles.languageLabel}>{t('profile.language', 'Language')}</Text>
                  <View style={styles.languageButtons}>
                    <TouchableOpacity style={[styles.languageButton, language === 'en' && styles.languageButtonActive]} onPress={() => setLanguage('en')}>
                      <Text style={[styles.languageButtonText, language === 'en' && styles.languageButtonTextActive]}>{t('profile.languages.english', 'English')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.languageButton, language === 'de' && styles.languageButtonActive]} onPress={() => setLanguage('de')}>
                      <Text style={[styles.languageButtonText, language === 'de' && styles.languageButtonTextActive]}>{t('profile.languages.german', 'German')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.languageButton, language === 'ar' && styles.languageButtonActive]} onPress={() => setLanguage('ar')}>
                      <Text style={[styles.languageButtonText, language === 'ar' && styles.languageButtonTextActive]}>{t('profile.languages.arabic', 'Arabic')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </>
          )}
        </ScrollView>

        {!isLoadingProfile && (
          <TouchableOpacity style={[styles.updateButton, isUpdating && styles.updateButtonDisabled]} onPress={handleUpdateProfile} activeOpacity={0.9} disabled={isUpdating}>
            {isUpdating ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.updateButtonText}>{t('profile.update_profile', 'Update Profile')}</Text>}
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>

      <Modal visible={showCountryPicker} animationType="slide" transparent={true} onRequestClose={() => setShowCountryPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('profile.select_country', 'Select Country')}</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}><Text style={styles.closeButton}>✕</Text></TouchableOpacity>
            </View>
            <FlatList data={countries} keyExtractor={(item) => item.code} renderItem={renderCountryItem} showsVerticalScrollIndicator={false} />
          </View>
        </View>
      </Modal>

      <OTPVerificationModal visible={showOTPModal} onClose={() => setShowOTPModal(false)} onVerify={handleVerifyOTP} onResend={handleResendOTP} loading={isVerifying} title={t('profile.verify_update', 'Verify Profile Update')} message={pendingUpdate?.message || t('profile.otp_message', 'Enter the OTP sent to your email/mobile')} />
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingVertical: 30, paddingHorizontal: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 16, fontSize: 14, color: '#666666' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '600', color: '#000000' },
  profileImageContainer: { alignItems: 'center', marginBottom: 30 },
  imageWrapper: { position: 'relative', marginBottom: 10 },
  profileImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#F0F0F0' },
  cameraButton: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: '#ed1c24', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFFFFF', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  changePhotoText: { fontSize: 14, color: '#ed1c24', fontWeight: '600' },
  form: { marginBottom: 40 },
  mobileContainer: { marginBottom: 16 },
  mobileLabel: { fontSize: 14, color: '#666666', marginBottom: 8, fontWeight: '500' },
  mobileInputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D9E0F2', backgroundColor: '#F2F2F2', borderRadius: 12, overflow: 'hidden' },
  countryCodeSelector: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14, backgroundColor: '#E8E8E8', borderRightWidth: 1, borderRightColor: '#D9E0F2', gap: 6 },
  countryFlagSmall: { fontSize: 18 },
  countryCodeText: { fontSize: 14, fontWeight: '500', color: '#333' },
  mobileInput: { flex: 1, fontSize: 14, color: '#000', paddingHorizontal: 14, paddingVertical: 14 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  hintText: { fontSize: 11, color: '#999', marginTop: 4, marginLeft: 2 },
  languageContainer: { marginTop: 20 },
  languageLabel: { fontSize: 14, color: '#666666', marginBottom: 12, fontWeight: '500' },
  languageButtons: { flexDirection: 'row', gap: 10 },
  languageButton: { flex: 1, height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center' },
  languageButtonActive: { backgroundColor: '#ed1c24', borderColor: '#ed1c24' },
  languageButtonText: { fontSize: 14, color: '#666666', fontWeight: '500' },
  languageButtonTextActive: { color: '#FFFFFF', fontWeight: '600' },
  updateButton: { height: 50, backgroundColor: '#ed1c24', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginHorizontal: 20, marginBottom: 20 },
  updateButtonDisabled: { backgroundColor: '#CCCCCC' },
  updateButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#111' },
  closeButton: { fontSize: 20, color: '#999', padding: 4 },
  countryItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  countryFlag: { fontSize: 30, marginRight: 12 },
  countryInfo: { flex: 1 },
  countryName: { fontSize: 16, fontWeight: '500', color: '#111' },
  countryCode: { fontSize: 13, color: '#666', marginTop: 2 },
  checkmark: { fontSize: 18, color: '#ed1c24', fontWeight: 'bold' },
});