import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { registerVerify, resendOtp, forgotPasswordVerifyOTP, forgotPasswordResendOTP } from '../../services/authService';
import { clearPendingSignup, getPendingSignup } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { wp, hp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES as FONT } from '../../theme/typography';

export default function OtpVerificationScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { setAuthenticatedUser } = useAuth();
  const flow = route.params?.flow ?? 'signup';
  const email = route.params?.email ?? '';
  const mobileFromParams = route.params?.mobile ?? '';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [mobile, setMobile] = useState(mobileFromParams);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(null);
  const inputs = useRef([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const formatTime = (timeInSeconds) => {
    if (timeInSeconds === 0) return '0 sec';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    console.log('📬 [Verify] Route Params:', route.params);
    console.log('🌍 [Verify] Route countryCode:', route.params?.countryCode);
    if (timer > 0) {
      const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (!mobileFromParams) {
      getPendingSignup()
        .then(data => {
          if (data?.mobile) {
            setMobile(data.mobile);
          }
        })
        .catch(() => undefined);
    }

    if (route.params?.autoResend && !isResending) {
      setTimeout(() => {
        if (!isResending) handleResend();
      }, 400);
    }
  }, [mobileFromParams, route.params?.autoResend, isResending, handleResend]);

  const handleChange = (text, i) => {
    const numericText = text.replace(/[^0-9]/g, '');
    let newOtp = [...otp];
    newOtp[i] = numericText;
    setOtp(newOtp);
    if (numericText && i < 5) inputs.current[i + 1].focus();
  };

  const handleKeyPress = (e, i) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[i] && i > 0) {
      inputs.current[i - 1].focus();
    }
  };

  const isOtpComplete = otp.every(d => d !== '');

  const handleVerify = async () => {
    if (!isOtpComplete || isLoading) return;

    const otpValue = otp.join('');

    if (flow === 'forget') {
      try {
        setIsLoading(true);
        const response = await forgotPasswordVerifyOTP({
          email,
          mobile,
          otp: otpValue
        });

        const resetToken = response?.resetToken;
        if (!resetToken) {
          throw new Error('Reset token not received');
        }

        Toast.show({
          type: 'topSuccess',
          text1: t('otp.verified_title', 'OTP Verified'),
          text2: t('otp.set_new_password', 'Please set your new password'),
          position: 'top',
          autoHide: true,
          visibilityTime: 2000,
          props: { showLoader: true },
          onHide: () => {
            navigation.replace('CreatePassword', { resetToken, flow });
          },
        });
      } catch (error) {
        const errMsg = error?.response?.data?.message || error?.message || '';
        Toast.show({
          type: 'error',
          text1: t('otp.verification_failed_title', 'OTP Verification Failed'),
          text2: errMsg || t('otp.invalid_otp', 'Invalid or expired OTP'),
          position: 'top',
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const mobileValue = (mobile ?? '').trim();

    if (!mobileValue) {
      Toast.show({
        type: 'error',
        text1: t('otp.mobile_missing_title', 'Mobile number missing'),
        text2: t('otp.mobile_missing_message', 'Please go back and try signup again.'),
        position: 'top',
      });
      return;
    }

    try {
      setIsLoading(true);
      const data = await registerVerify({ 
        mobile: mobileValue, 
        otp: otpValue,
        countryCode: route.params?.countryCode 
      });
      await clearPendingSignup();

      const token = data?.token || data?.accessToken || data?.data?.token;
      const user = data?.user || data?.data?.user;

      // Delaying authentication to prevent MainTabs from flashing before FoodPreference
      // We will pass the token and user to FoodPreference to authenticate after it's done.

      Toast.show({
        type: 'topSuccess',
        text1: t('otp.verified_success_title', 'OTP Verified Successfully'),
        text2: t('otp.please_wait', 'Please wait...'),
        position: 'top',
        autoHide: true,
        visibilityTime: 2000,
        props: { showLoader: true },
        onHide: () => {
          // Ensure countryCode is in the user object if available from params
          const updatedUser = {
            ...user,
            countryCode: user?.countryCode || route.params?.countryCode
          };
          navigation.replace('FoodPreference', { email, flow: 'onboarding', token, user: updatedUser });
        },
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('otp.verification_failed_title', 'OTP Verification Failed'),
        text2: error?.message || t('otp.unable_to_verify', 'Unable to verify OTP'),
        position: 'top',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = useCallback(async () => {
    if (isResending || timer > 0) return;
    try {
      setIsResending(true);
      const payload = { mobile: mobile ?? '', email: email ?? '' };

      if (flow === 'forget') {
        await forgotPasswordResendOTP(payload);
      } else {
        await resendOtp(payload);
      }

      setTimer(30);
      Toast.show({
        type: 'topSuccess',
        text1: t('otp.otp_sent_title', 'OTP Sent'),
        text2: t('otp.otp_sent_message', 'Please check your messages'),
        position: 'top'
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: t('otp.resend_failed_title', 'Resend Failed'),
        text2: err?.message || t('otp.unable_to_resend', 'Unable to resend OTP'),
        position: 'top'
      });
    } finally {
      setIsResending(false);
    }
  }, [isResending, timer, mobile, email, flow, t]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Image
        source={require('../../assets/images/BgImgRotate.png')}
        style={styles.bgImage}
        resizeMode="cover"
      />
      <View style={styles.gradientOverlay} />

      <TouchableOpacity
        style={styles.backButton}
        onPress={() =>
          navigation.canGoBack()
            ? navigation.goBack()
            : navigation.navigate('Signup')
        }
      >
        <ArrowLeft size={22} color="#333" />
      </TouchableOpacity>

      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.content}>
          <Text style={styles.title}>{t('otp.title', 'OTP Verification')}</Text>
          <Text style={styles.description}>
            {t('otp.description', 'An OTP has been sent to your registered mobile number. Please enter it to continue.')}
          </Text>

          <View style={styles.timerContainer}>
            <Text style={styles.timer}>{formatTime(timer)}</Text>
          </View>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => (inputs.current[index] = ref)}
                style={[
                  styles.otpBox,
                  digit !== '' && styles.filledOtpBox,
                  focusedIndex === index && styles.focusedOtpBox,
                ]}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={text => handleChange(text, index)}
                onKeyPress={e => handleKeyPress(e, index)}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(null)}
                cursorColor="#000"
                selectionColor="#000"
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.button, (!isOtpComplete || isLoading) && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={!isOtpComplete || isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading
                ? t('common.verifying', 'Verifying...')
                : flow === 'forget'
                ? t('common.submit', 'Submit')
                : t('otp.get_started', 'Get Started')}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t('otp.did_not_receive', "Didn't receive OTP?")}{' '}
              <Text
                style={[styles.resendText, (timer > 0 || isResending) && styles.resendDisabled]}
                onPress={timer === 0 && !isResending ? handleResend : undefined}
              >
                {isResending ? t('common.resending', 'Resending...') : t('otp.resend', 'Resend')}
              </Text>
            </Text>

            <TouchableOpacity
              style={styles.changeEmailButton}
              onPress={() => navigation.navigate('ForgetPass')}
            >
              <Text style={styles.changeEmailText}>{t('otp.change_email', 'Change Email')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  bgImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },
  gradientOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  backButton: {
    position: 'absolute',
    top: hp(6.25),
    left: wp(5.56),
    zIndex: 10,
    width: wp(11.11),
    height: hp(5),
    borderRadius: wp(5.56),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hp(0.25) },
    shadowOpacity: 0.1,
    shadowRadius: scale(3),
    elevation: 3,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(6.67),
  },
  content: {
    width: '100%',
    maxWidth: wp(111.11),
    paddingHorizontal: wp(8.89),
    paddingVertical: hp(2.5),
    marginBottom: hp(6.25),
  },
  title: {
    fontSize: FONT.xxl + scale(4),
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: hp(1.5),
    letterSpacing: -0.5,
  },
  description: {
    fontSize: FONT.xs,
    color: '#666666',
    textAlign: 'center',
    lineHeight: hp(2.5),
    marginBottom: hp(4),
    paddingHorizontal: wp(2.22),
  },
  timerContainer: {
    marginBottom: hp(1.5),
  },
  timer: {
    fontSize: FONT.lg + scale(2),
    fontWeight: '700',
    color: '#ed1c24',
    textAlign: 'center',
    letterSpacing: 1,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: wp(3.33),
    marginBottom: hp(5),
    width: '100%',
  },
  otpBox: {
    width: wp(11.11),
    height: hp(5),
    backgroundColor: '#F8F8F8',
    borderRadius: scale(10),
    fontSize: FONT.xs,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filledOtpBox: {
    borderColor: '#ed1c24',
    backgroundColor: '#FFF',
    borderWidth: 2,
  },
  focusedOtpBox: {
    borderColor: '#000000',
    borderWidth: 2,
    backgroundColor: '#FFF',
  },
  button: {
    width: '100%',
    backgroundColor: '#ed1c24',
    borderRadius: scale(16),
    paddingVertical: hp(1.875),
    alignItems: 'center',
    marginBottom: hp(3),
    shadowColor: '#ed1c24',
    shadowOffset: { width: 0, height: hp(0.5) },
    shadowOpacity: 0.3,
    shadowRadius: scale(8),
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#f9a5a8',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontSize: FONT.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    alignItems: 'center',
    width: '100%',
  },
  footerText: {
    fontSize: FONT.sm,
    color: '#666666',
    textAlign: 'center',
    marginBottom: hp(1.5),
  },
  resendText: {
    color: '#ed1c24',
    fontWeight: '700',
  },
  resendDisabled: {
    color: '#999999',
    fontWeight: '400',
  },
  changeEmailButton: {
    paddingVertical: hp(1),
  },
  changeEmailText: {
    fontSize: FONT.sm,
    color: '#ed1c24',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});