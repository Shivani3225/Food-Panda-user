import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { login, checkVerificationStatus, socialLogin } from '../../services/authService';
import LogoIcon from '../../assets/icons/LogoIcon.svg';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import MaterialTextInput from "../../components/input/MaterialTextInput";
import { useAuth } from '../../context/AuthContext';
import { wp, hp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES as FONT } from '../../theme/typography';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const navigation = useNavigation();
  const route = useRoute();
  const { login: authLogin, setAuthenticatedUser } = useAuth();

  useEffect(() => {
    const prefillEmail = route?.params?.email || route?.params?.prefillEmail;
    if (prefillEmail) setEmail(prefillEmail);
  }, [route?.params?.email, route?.params?.prefillEmail]);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '884532670354-ik8pvdtj2a1abrcco0ukie0annl2j8om.apps.googleusercontent.com',
      offlineAccess: true,
    });
  }, []);

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      await GoogleSignin.hasPlayServices();
      const { data } = await GoogleSignin.signIn();

      if (data?.idToken) {
        // Call your backend service to authenticate with Google
        // Example: const result = await socialLogin('google', data.idToken);
        console.log('Google ID Token:', data.idToken);

        Toast.show({
          type: 'topSuccess',
          text1: t('login.success_title', 'Login Successful'),
          text2: `Welcome ${data.user.name}`,
        });
        navigation.replace('MainTabs');
      }
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the login flow');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Signing in already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Toast.show({ type: 'error', text1: 'Play Services not available' });
      } else {
        console.error('Google Sign-In Error:', error);
        // If you see DEVELOPER_ERROR here, check your SHA-1 and Web Client ID
        Toast.show({
          type: 'error',
          text1: 'Google Sign-In Failed',
          text2: error.code === '7' || error.message.includes('DEVELOPER_ERROR')
            ? 'Configuration error. Check SHA-1/WebClientID.'
            : error.message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = text => {
    const value = text ?? '';
    const digitsOnly = value.replace(/\D/g, '');
    if (value.length > 0 && digitsOnly.length === value.length) {
      setEmail(digitsOnly.slice(0, 16));
      return;
    }
    setEmail(value);
  };

  const validate = () => {
    let valid = true;

    if (!email) {
      setEmailError(t('validation.email_required', 'Email is required'));
      valid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError(t('validation.invalid_email', 'Enter a valid email'));
      valid = false;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError(t('validation.password_required', 'Password is required'));
      valid = false;
    } else if (password.length < 6) {
      setPasswordError(t('validation.password_min_length', 'Password must be at least 6 characters'));
      valid = false;
    } else {
      setPasswordError('');
    }
    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setIsLoading(true);

    try {
      const result = await authLogin(email, password);
      console.log("Login result", result);

      if (result.success) {
        Toast.show({
          type: 'topSuccess',
          text1: t('login.success_title', 'Login Successful'),
          text2: t('login.success_message', 'Welcome back!'),
        });
        navigation.replace('MainTabs');
      } else {
        Toast.show({
          type: 'error',
          text1: t('login.failed_title', 'Login Failed'),
          text2: result.message || t('login.failed_message', 'Invalid credentials'),
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('login.error_title', 'Something went wrong'),
        text2: t('login.error_message', 'Please try again'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
          <LogoIcon width={wp(50)} height={hp(18.75)} style={styles.logo} />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{t('login.welcome_back', 'Welcome Back!')}</Text>
          <Text style={styles.subtitle}>
            {t('login.subtitle', 'Log in to continue your meal journey')}
          </Text>

          <MaterialTextInput
            label={t('login.email_label', 'Email')}
            value={email}
            onChangeText={handleEmailChange}
            placeholder={t('login.email_placeholder', 'Enter your email')}
            keyboardType="email-address"
            autoCapitalize="none"
            error={!!emailError}
            errorText={emailError}
          />

          <MaterialTextInput
            label={t('login.password_label', 'Password')}
            value={password}
            onChangeText={setPassword}
            placeholder={t('login.password_placeholder', 'Enter your password')}
            showPasswordToggle
            error={!!passwordError}
            errorText={passwordError}
          />

          <Text
            style={styles.forgot}
            onPress={() => navigation.navigate('ForgetPass')}
          >
            {t('login.forgot_password', 'Forgot password?')}
          </Text>

          <Pressable
            style={[styles.btn, isLoading && styles.btnDisabled]}
            onPress={handleLogin}
          >
            <Text style={styles.btnText}>
              {isLoading ? t('common.logging_in', 'Logging in...') : t('login.login_button')}
            </Text>
          </Pressable>

          {<View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>{t('login.or', 'or')}</Text>
            <View style={styles.orLine} />
          </View>}

          {<Pressable style={styles.googleBtn} onPress={signInWithGoogle}>
            <Image
              source={require('../../assets/icons/google.png')}
              style={styles.googleIcon}
              resizeMode="contain"
            />
            <Text style={styles.googleText}>
              {t('login.continue_google', 'Continue with Google')}
            </Text>
          </Pressable>}

          <Text style={styles.footer}>
            {t('login.no_account', 'Don’t have an account?')}{' '}
            <Text
              style={styles.register}
              onPress={() => navigation.navigate('Signup')}
            >
              {t('login.register_now', 'Register Now')}
            </Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
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

  logo: {
    alignSelf: 'center',
    width: wp(50),
    height: hp(11.25),
    marginTop: hp(6.25),
  },

  content: {
    flex: 1,
    paddingHorizontal: wp(6.67),
    paddingTop: hp(22.5),
    zIndex: 1,
  },

  title: {
    fontSize: FONT.xxl,
    fontWeight: '600',
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

  forgot: {
    fontSize: FONT.xs,
    color: '#666',
    textAlign: 'right',
    marginBottom: hp(2.5),
  },

  btn: {
    backgroundColor: '#ed1c24',
    borderRadius: scale(16),
    paddingVertical: hp(2.25),
    alignItems: 'center',
  },

  btnDisabled: {
    opacity: 0.7,
  },

  btnText: {
    color: '#FFF',
    fontSize: FONT.md,
    fontWeight: '600',
  },

  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: hp(2),
    columnGap: wp(3.33),
  },

  orLine: {
    flex: 1,
    height: hp(0.125),
    backgroundColor: '#E9ECF3',
  },

  orText: {
    color: '#999',
    fontSize: FONT.xs,
  },

  googleBtn: {
    borderWidth: 1,
    borderColor: '#E3E7F0',
    backgroundColor: '#FFF',
    borderRadius: scale(12),
    paddingVertical: hp(1.75),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    columnGap: wp(2.78),
    marginBottom: hp(1.5),
  },

  googleIcon: {
    width: wp(5),
    height: hp(2.25),
  },

  googleText: {
    fontSize: FONT.sm,
    color: '#333',
  },

  footer: {
    textAlign: 'center',
    marginTop: hp(1.25),
    fontSize: FONT.xs,
    color: '#666',
    marginBottom: hp(2.5),
  },

  register: {
    color: '#ed1c24',
    fontWeight: '600',
  },
});