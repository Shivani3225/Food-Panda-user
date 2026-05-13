import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import MaterialTextInput from '../../components/input/MaterialTextInput';
import Toast from 'react-native-toast-message';
import { forgotPasswordInitiate } from '../../services/authService';
import { wp, hp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES as FONT } from '../../theme/typography';
import { useCountries } from '../../context/CountryContext';

export default function ForgetPass() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { countries } = useCountries();
  const [mobile, setMobile] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries[0] || {});
  const [showCountryPicker, setShowCountryPicker] = useState(false);

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

  const handleSendOtp = async () => {
    const mobileValue = mobile.trim();
    if (!mobileValue) {
      setMobileError(t('validation.mobile_required', 'Mobile number is required'));
      return;
    }
    if (!validateMobileNumber(mobileValue, selectedCountry)) {
      setMobileError(t('validation.invalid_mobile', 'Enter a valid mobile number'));
      return;
    }

    setMobileError('');

    try {
      setIsLoading(true);
      const fullMobile = `${selectedCountry.fullCode}${mobileValue}`;
      const response = await forgotPasswordInitiate({ mobile: fullMobile });

      Toast.show({
        type: 'topSuccess',
        text1: t('forget_password.otp_sent_title', 'OTP Sent Successfully'),
        text2: t('forget_password.otp_sent_message', 'Check your mobile to continue'),
        position: 'top',
        visibilityTime: 2000,
        autoHide: true,
        props: { showLoader: true },
        onHide: () =>
          navigation.navigate('Verify', {
            flow: 'forget',
            mobile: fullMobile,
            email: response?.email || ''
          }),
      });
    } catch (error) {
      const errMsg = error?.response?.data?.message || error?.message || '';

      Toast.show({
        type: 'error',
        text1: t('forget_password.otp_failed_title', 'Failed to Send OTP'),
        text2: errMsg || t('forget_password.otp_failed_message', 'Unable to send OTP'),
        position: 'top',
        autoHide: true,
        visibilityTime: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderCountryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => {
        setSelectedCountry(item);
        setShowCountryPicker(false);
        setMobile('');
        if (mobileError) setMobileError('');
      }}
    >
      <Text style={styles.countryFlag}>{item.flag}</Text>
      <View style={styles.countryInfo}>
        <Text style={styles.countryName}>{item.country}</Text>
        <Text style={styles.countryCode}>{item.code}</Text>
      </View>
      {selectedCountry.code === item.code && (
        <Text style={styles.checkmark}>✓</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.innerContainer}>

            <View style={styles.heroWrap} pointerEvents="none">
              <View style={styles.heroCircle} />
              <Image
                source={require('../../assets/images/message.png')}
                style={styles.heroImg}
                resizeMode="contain"
              />
            </View>


            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                activeOpacity={0.85}
                style={styles.backBtn}
              >
                <ArrowLeft size={20} color="#111" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>
                {t('forget_password.title', 'Forgot Password')}
              </Text>
              <View style={styles.headerRightSpace} />
            </View>

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >

              <View style={styles.heroSpacer} />


              <View style={styles.content}>
                <Text style={styles.desc}>
                  {t('forget_password.description', 'Enter your registered mobile number and we\'ll send you an OTP to reset your password')}
                </Text>

                <View style={styles.mobileContainer}>
                  <Text style={styles.mobileLabel}>{t('forget_password.mobile_label', 'Mobile Number')}</Text>
                  <View style={[styles.mobileInputWrapper, mobileError && styles.inputWrapperError]}>
                    <TouchableOpacity
                      style={styles.countryCodeSelector}
                      onPress={() => setShowCountryPicker(true)}
                    >
                      <Text style={styles.countryFlagSmall}>{selectedCountry.flag}</Text>
                      <Text style={styles.countryCodeText}>{selectedCountry.fullCode}</Text>
                      <Text style={styles.dropdownArrow}>▼</Text>
                    </TouchableOpacity>

                    <TextInput
                      style={[styles.mobileInput, mobileError && styles.inputError]}
                      value={mobile}
                      onChangeText={handleMobileChange}
                      placeholder={t('forget_password.mobile_placeholder', 'Enter your Mobile Number')}
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

                <TouchableOpacity
                  style={[styles.btn, isLoading && styles.btnDisabled]}
                  activeOpacity={0.9}
                  onPress={handleSendOtp}
                  disabled={isLoading}
                >
                  <Text style={styles.btnText}>
                    {isLoading ? t('common.sending', 'Sending...') : t('forget_password.send_otp', 'Send OTP')}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

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
            <FlatList
              data={countries}
              keyExtractor={(item) => item.code}
              renderItem={renderCountryItem}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF' },
  container: { flex: 1, backgroundColor: '#FFF' },
  innerContainer: { flex: 1 },

  header: {
    height: hp(7),
    paddingHorizontal: wp(3.89),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  backBtn: {
    width: wp(11.11),
    height: hp(5),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -hp(0.6),
  },
  headerTitle: { fontSize: FONT.md, fontWeight: '800', color: '#111' },
  headerRightSpace: { width: wp(11.11) },

  scrollContent: {
    paddingBottom: hp(3),
  },

  heroWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: hp(37.5),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 0,
  },
  heroCircle: {
    position: 'absolute',
    width: wp(144.44),
    height: hp(75),
    borderRadius: wp(72.22),
    top: hp(-38.75),
    backgroundColor: 'rgba(255,61,61,0.06)',
  },
  heroImg: {
    width: wp(69.44),
    height: hp(31.25),
    marginTop: hp(-1.25),
  },
  heroSpacer: {
    height: hp(27.5),
  },

  content: {
    marginTop: hp(5),
    paddingHorizontal: wp(5),
    backgroundColor: '#FFF',
    position: 'relative',
    zIndex: 2,
    elevation: 0,
  },
  desc: {
    fontSize: FONT.md,
    fontWeight: '800',
    color: '#111',
    lineHeight: hp(2.75),
    marginBottom: hp(2.5),
  },
  btn: {
    marginTop: hp(2.25),
    height: hp(6.75),
    backgroundColor: '#ed1c24',
    borderRadius: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: { color: '#FFF', fontSize: FONT.sm, fontWeight: '900' },

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
  countryFlagSmall: {
    fontSize: 18,
    marginRight: 6,
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
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  countryFlag: {
    fontSize: 30,
    marginRight: 12,
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