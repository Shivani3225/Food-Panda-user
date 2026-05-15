import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { registerInitiate, checkVerificationStatus } from '../../services/authService';
import { savePendingSignup } from '../../services/storage';
import MaterialTextInput from '../../components/input/MaterialTextInput';
import { useAuth } from '../../context/AuthContext';
import { wp, hp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES as FONT } from '../../theme/typography';
import { useCountries } from '../../context/CountryContext';



export default function CreateAccountScreen() {
  const { t } = useTranslation();
  const { countries } = useCountries();
  const navigation = useNavigation();
  const { setAuthenticatedUser } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Country code states
  const [selectedCountry, setSelectedCountry] = useState(countries[0] || {});
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');

  const filteredCountries = React.useMemo(() => {
    if (!countrySearchQuery.trim()) return countries;
    const q = countrySearchQuery.toLowerCase();
    return countries.filter(c => 
      (c.country?.toLowerCase() || '').includes(q) || 
      (c.code?.toLowerCase() || '').includes(q) || 
      (c.fullCode?.toLowerCase() || '').includes(q)
    );
  }, [countries, countrySearchQuery]);
  useEffect(() => {
    if (countries.length > 0 && !selectedCountry.code) {
      setSelectedCountry(countries[0]);
    }
  }, [countries]);

  const handleFirstNameChange = text => {
    const value = text ?? '';
    setFirstName(value.replace(/[^a-zA-Z\s]/g, ''));
  };

  const handleLastNameChange = text => {
    const value = text ?? '';
    setLastName(value.replace(/[^a-zA-Z\s]/g, ''));
  };

  const validateMobileNumber = (number, country) => {
    if (!country || !number) return false;
    return number.length >= country.minLength && number.length <= country.maxLength;
  };

  const handleMobileChange = (text) => {
    const value = text ?? '';
    const digitsOnly = value.replace(/\D/g, '');
    const limited = digitsOnly.slice(0, selectedCountry.maxLength);
    setMobile(limited);
    if (mobileError) setMobileError('');
  };

  const handleCreateAccount = async () => {
    if (isLoading) {
      return;
    }

    const firstNameValue = firstName.trim();
    const lastNameValue = lastName.trim();
    const emailValue = email.trim();
    const mobileValue = mobile.trim();
    const passwordValue = password.trim();
    const confirmValue = confirmPassword.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    let hasError = false;

    // First Name Validation
    if (!firstNameValue) {
      setFirstNameError(t('validation.first_name_required', 'First name is required'));
      hasError = true;
    } else if (firstNameValue.length < 2) {
      setFirstNameError(t('validation.first_name_min', 'First name must be at least 2 characters'));
      hasError = true;
    } else {
      setFirstNameError('');
    }

    // Last Name Validation
    if (!lastNameValue) {
      setLastNameError(t('validation.last_name_required', 'Last name is required'));
      hasError = true;
    } else if (lastNameValue.length < 2) {
      setLastNameError(t('validation.last_name_min', 'Last name must be at least 2 characters'));
      hasError = true;
    } else {
      setLastNameError('');
    }

    // Email Validation
    if (!emailValue) {
      setEmailError(t('validation.email_required', 'Email is required'));
      hasError = true;
    } else if (!emailRegex.test(emailValue)) {
      setEmailError(t('validation.invalid_email', 'Enter a valid email address'));
      hasError = true;
    } else {
      setEmailError('');
    }

    // Mobile Validation with country code
    if (!mobileValue) {
      setMobileError(t('validation.mobile_required', 'Mobile number is required'));
      hasError = true;
    } else if (!validateMobileNumber(mobileValue, selectedCountry)) {
      setMobileError(t('validation.invalid_mobile', `Enter a valid ${selectedCountry.country} mobile number (${selectedCountry.minLength}-${selectedCountry.maxLength} digits)`));
      hasError = true;
    } else {
      setMobileError('');
    }

    // Password Validation
    if (!passwordValue) {
      setPasswordError(t('validation.password_required', 'Password is required'));
      hasError = true;
    } else if (
      passwordValue.length < 6 ||
      !/[A-Z]/.test(passwordValue) ||
      !/\d/.test(passwordValue)
    ) {
      setPasswordError(
        t('validation.password_requirements', 'Password must be 6+ chars with 1 uppercase letter and 1 number')
      );
      hasError = true;
    } else {
      setPasswordError('');
    }

    // Confirm Password Validation
    if (!confirmValue) {
      setConfirmPasswordError(t('validation.confirm_password_required', 'Confirm password is required'));
      hasError = true;
    } else if (confirmValue !== passwordValue) {
      setConfirmPasswordError(t('validation.passwords_do_not_match', 'Passwords do not match'));
      hasError = true;
    } else {
      setConfirmPasswordError('');
    }

    if (hasError) {
      return;
    }

    try {
      setIsLoading(true);
      const fullMobile = `${selectedCountry.fullCode}${mobileValue}`;
      console.log('Sending registration request for:', fullMobile);

      const data = {
        name: `${firstNameValue} ${lastNameValue}`,
        email: emailValue,
        mobile: fullMobile,
        password: passwordValue,
        countryCode: selectedCountry.code,
        country: selectedCountry.country
      };

      await registerInitiate(data);

      await savePendingSignup({ email: emailValue, mobile: fullMobile });

      console.log('🚀 [Signup] Navigating to Verify with countryCode:', selectedCountry.code);
      Toast.show({
        type: 'topSuccess',
        text1: t('signup.success_title', 'Account Created Successfully'),
        text2: t('signup.success_message', 'Verify your account to continue'),
        position: 'top',
        autoHide: true,
        visibilityTime: 3000,
        props: { showLoader: true },
        onHide: () =>
          navigation.replace('Verify', {
            flow: 'signup',
            email: emailValue,
            mobile: fullMobile,
            countryCode: selectedCountry.code,
          }),
      });
    } catch (error) {
      const errMsg = error?.response?.data?.message || error?.message || '';

      if (/already|exists/i.test(errMsg)) {
        try {
          const status = await checkVerificationStatus({ email: emailValue, mobile: `${selectedCountry.fullCode}${mobile}` });
          const isVerified = status?.verified ?? status?.isVerified ?? false;
          const returnedMobile = status?.mobile || `${selectedCountry.fullCode}${mobile}`;

          if (!isVerified) {
            Toast.show({
              type: 'info',
              text1: t('signup.pending_title', 'Account Pending Verification'),
              text2: t('signup.pending_message', 'Please complete verification to continue'),
              position: 'top',
              autoHide: true,
              visibilityTime: 3000,
              onHide: () =>
                navigation.replace('Verify', {
                  flow: 'signup',
                  email: emailValue,
                  mobile: returnedMobile,
                  autoResend: true,
                }),
            });
            return;
          }

          Toast.show({
            type: 'info',
            text1: t('signup.exists_title', 'Account Already Exists'),
            text2: t('signup.exists_message', 'Please login to continue'),
            position: 'top',
            autoHide: true,
            visibilityTime: 3000,
            onHide: () => navigation.replace('LoginScreen', { email: emailValue }),
          });
          return;
        } catch (innerErr) {
          // Fall through to default error
        }
      }

      Toast.show({
        type: 'error',
        text1: t('signup.failed_title', 'Signup Failed'),
        text2: errMsg || t('signup.failed_message', 'Unable to create account'),
        position: 'top',
        autoHide: true,
        visibilityTime: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderCountryItem = ({ item }) => {
    const displayCode = item.fullCode?.startsWith('+') ? item.fullCode : 
                       item.dialCode ? (item.dialCode.startsWith('+') ? item.dialCode : `+${item.dialCode}`) : 
                       item.code;
    
    return (
      <TouchableOpacity
        style={styles.countryItem}
        onPress={() => {
          setSelectedCountry(item);
          setShowCountryPicker(false);
          setMobile('');
          if (mobileError) setMobileError('');
        }}
      >
        <Image 
          source={{ uri: `https://flagcdn.com/w40/${item.code?.toLowerCase() || 'un'}.png` }} 
          style={styles.countryFlagImage} 
        />
        <View style={styles.countryInfo}>
          <Text style={styles.countryName}>{item.country} ({displayCode})</Text>
        </View>
        {selectedCountry.code === item.code && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/BgImg.png')}
            style={styles.topImage}
            resizeMode="cover"
            blurRadius={2}
          />
          <View style={styles.headerOverlay} />
          <View style={styles.headerBottomFade} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{t('signup.title', 'Create Your Account')}</Text>
          <Text style={styles.subtitle}>
            {t('signup.subtitle', 'Sign up to explore delicious meals and get them delivered to your location')}
          </Text>

          <MaterialTextInput
            label={t('signup.first_name', 'First Name')}
            value={firstName}
            onChangeText={handleFirstNameChange}
            placeholder={t('signup.first_name_placeholder', 'Enter First Name')}
            autoCapitalize="words"
            error={!!firstNameError}
            errorText={firstNameError}
          />

          <MaterialTextInput
            label={t('signup.last_name', 'Last Name')}
            value={lastName}
            onChangeText={handleLastNameChange}
            placeholder={t('signup.last_name_placeholder', 'Enter Last Name')}
            autoCapitalize="words"
            error={!!lastNameError}
            errorText={lastNameError}
          />

          <MaterialTextInput
            label={t('signup.email', 'Email')}
            value={email}
            onChangeText={setEmail}
            placeholder={t('signup.email_placeholder', 'Enter your email')}
            keyboardType="email-address"
            autoCapitalize="none"
            error={!!emailError}
            errorText={emailError}
          />

          {/* Mobile Number with Country Code Dropdown */}
          <View style={styles.mobileContainer}>
            <Text style={styles.mobileLabel}>{t('signup.mobile', 'Mobile Number')}</Text>
            <View style={[styles.mobileInputWrapper, mobileError && styles.inputWrapperError]}>
              <TouchableOpacity
                style={styles.countryCodeSelector}
                onPress={() => setShowCountryPicker(true)}
              >
                <Image 
                  source={{ uri: `https://flagcdn.com/w40/${selectedCountry.code?.toLowerCase() || 'un'}.png` }} 
                  style={styles.countryFlagSmallImage} 
                />
                <Text style={styles.countryCodeText}>
                  {selectedCountry.fullCode?.startsWith('+') ? selectedCountry.fullCode : 
                   selectedCountry.dialCode ? (selectedCountry.dialCode.startsWith('+') ? selectedCountry.dialCode : `+${selectedCountry.dialCode}`) : 
                   '+1'}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>

              <TextInput
                style={[styles.mobileInput, mobileError && styles.inputError]}
                value={mobile}
                onChangeText={handleMobileChange}
                placeholder={t('signup.mobile_placeholder', 'Enter your Mobile Number')}
                keyboardType="phone-pad"
                maxLength={selectedCountry.maxLength}
                placeholderTextColor="#999"
              />
            </View>
            {mobileError ? <Text style={styles.errorText}>{mobileError}</Text> : null}
            <Text style={styles.hintText}>
              {selectedCountry.country} ({selectedCountry.maxLength} digits)
            </Text>
          </View>

          <MaterialTextInput
            label={t('signup.password', 'Password')}
            value={password}
            onChangeText={setPassword}
            placeholder={t('signup.password_placeholder', 'Enter your password')}
            showPasswordToggle
            error={!!passwordError}
            errorText={passwordError}
          />

          <MaterialTextInput
            label={t('signup.confirm_password', 'Confirm Password')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder={t('signup.confirm_password_placeholder', 'Confirm your password')}
            showPasswordToggle
            error={!!confirmPasswordError}
            errorText={confirmPasswordError}
          />

          <Pressable
            style={[styles.btn, isLoading && styles.btnDisabled]}
            onPress={handleCreateAccount}
          >
            <Text style={styles.btnText}>
              {isLoading ? t('common.creating', 'Creating...') : t('signup.create_button', 'Create Account')}
            </Text>
          </Pressable>

          <View style={styles.footerBlock}>
            <Text style={styles.terms}>
              {t('signup.agree_to', 'I agree to the')}{' '}
              <Text
                style={styles.link}
                onPress={() => navigation.navigate('TermsConditionScreen')}
              >
                {t('signup.terms_conditions', 'Terms & Conditions')}
              </Text>{' '}
              {t('signup.and', 'and')}{' '}
              <Text
                style={styles.link}
                onPress={() => navigation.navigate('PrivacyPolicy')}
              >
                {t('signup.privacy_policy', 'Privacy Policy')}
              </Text>
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 }}>
              <Text style={styles.footer}>
                {t('signup.have_account', 'Already have an account?')}{' '}
              </Text>
              <TouchableOpacity 
                onPress={() => navigation.replace('LoginScreen')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.register}>
                  {t('signup.login', 'Login')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('common.select_country', 'Select Country')}</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder={t('common.search', 'Search...')}
                value={countrySearchQuery}
                onChangeText={setCountrySearchQuery}
                placeholderTextColor="#999"
              />
            </View>
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              renderItem={renderCountryItem}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFF',
  },

  container: {
    flex: 1,
  },

  header: {
    width: '100%',
    height: hp(66),
    overflow: 'hidden',
    borderBottomLeftRadius: scale(34),
    borderBottomRightRadius: scale(34),
    position: 'absolute',
  },

  topImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },

  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },

  headerBottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: hp(8.75),
    backgroundColor: 'rgba(255,255,255,0.72)',
  },

  content: {
    paddingHorizontal: wp(6.67),
    paddingTop: hp(11.25),
    paddingBottom: hp(6),
    zIndex: 1,
  },

  title: {
    fontSize: FONT.xxl,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111',
  },

  subtitle: {
    fontSize: FONT.sm,
    color: '#777',
    textAlign: 'center',
    marginTop: hp(1),
    marginBottom: hp(2.75),
  },

  // Mobile number styles
  mobileContainer: {
    marginBottom: 16,
  },
  mobileLabel: {
    fontSize: 13,
    color: '#555',
    marginBottom: 6,
    fontWeight: '500',
  },
  mobileInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9E0F2',
    backgroundColor: '#F2F2F2',
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  inputWrapperError: {
    borderColor: '#E11D2E',
    borderWidth: 1,
  },
  countryCodeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#E8E8E8',
    borderRightWidth: 1,
    borderRightColor: '#D9E0F2',
  },
  countryFlagSmallImage: {
    width: 20,
    height: 15,
    marginRight: 6,
    borderRadius: 2,
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginRight: 4,
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#666',
  },
  mobileInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  inputError: {
    borderColor: '#E11D2E',
  },
  errorText: {
    color: '#E11D2E',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
  },
  hintText: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    marginLeft: 2,
  },

  btn: {
    backgroundColor: '#ed1c24',
    borderRadius: scale(16),
    paddingVertical: hp(2.25),
    alignItems: 'center',
    marginTop: hp(1.25),
  },

  btnDisabled: {
    opacity: 0.7,
  },

  btnText: {
    color: '#FFF',
    fontSize: FONT.md,
    fontWeight: '600',
  },

  footerBlock: {
    marginTop: hp(2.5),
  },

  terms: {
    textAlign: 'center',
    fontSize: FONT.xs,
    color: '#777',
    marginBottom: hp(2),
  },

  link: {
    color: '#ed1c24',
    fontWeight: '600',
  },

  footer: {
    textAlign: 'center',
    fontSize: FONT.xs,
    color: '#666',
  },

  register: {
    color: '#ed1c24',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: hp(70),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  closeButton: {
    fontSize: 20,
    color: '#999',
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchInput: {
    backgroundColor: '#F2F2F2',
    borderRadius: scale(8),
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  countryFlagImage: {
    width: 30,
    height: 20,
    marginRight: 12,
    borderRadius: 2,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111',
  },
  countryCode: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  checkmark: {
    fontSize: 18,
    color: '#E11D2E',
    fontWeight: 'bold',
  },
});