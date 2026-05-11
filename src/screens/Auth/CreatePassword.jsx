import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import MaterialTextInput from '../../components/input/MaterialTextInput';
import { ArrowLeft } from 'lucide-react-native';
import { resetPassword } from '../../services/authService';
import { wp, hp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES as FONT } from '../../theme/typography';

const ChangePasswordScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const routeObj = useRoute();
  const flow = routeObj?.params?.flow;
  const email = routeObj?.params?.email;
  const resetToken = routeObj?.params?.resetToken;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (password) => {
    if (password.length < 6 || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      return t('validation.password_requirements', 'Password must be 6+ chars with 1 uppercase letter and 1 number');
    }
    return '';
  };

  const handleUpdatePassword = async () => {
    const passwordValue = newPassword.trim();
    const confirmValue = confirmPassword.trim();
    let hasError = false;

    const passwordError = validatePassword(passwordValue);
    if (passwordError) {
      setNewPasswordError(passwordError);
      hasError = true;
    } else {
      setNewPasswordError('');
    }

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
      Toast.show({
        type: 'topError',
        text1: t('change_password.invalid_password_title', 'Invalid Password'),
        text2: t('change_password.fix_fields', 'Please fix the highlighted fields'),
        position: 'top',
        autoHide: true,
        visibilityTime: 3000,
      });
      return;
    }

    setIsLoading(true);

    // Reset password flow (forgot password)
    if (flow === 'forget' && resetToken) {
      try {
        await resetPassword({ 
          resetToken, 
          newPassword: passwordValue 
        });

        Toast.show({
          type: 'topSuccess',
          text1: t('change_password.reset_success_title', 'Password Reset Successful'),
          text2: t('change_password.reset_success_message', 'You can now login with your new password'),
          position: 'top',
          autoHide: true,
          visibilityTime: 2000,
          props: { showLoader: true },
          onHide: () => navigation.replace('LoginScreen'),
        });
      } catch (error) {
        const errMsg = error?.response?.data?.message || error?.message || '';
        Toast.show({
          type: 'error',
          text1: t('change_password.reset_failed_title', 'Password Reset Failed'),
          text2: errMsg || t('change_password.reset_failed_message', 'Unable to reset password'),
          position: 'top',
          autoHide: true,
          visibilityTime: 3000,
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Regular password update flow
    Toast.show({
      type: 'topSuccess',
      text1: t('change_password.password_updated_title', 'Password Updated'),
      text2: t('change_password.password_updated_message', 'Your password has been changed'),
      position: 'top',
      autoHide: true,
      visibilityTime: 3000,
      props: { showLoader: true },
      onHide: () => {
        if (flow === 'signup') {
          navigation.replace('FoodPreference', { email, flow: 'onboarding' });
        } else {
          navigation.replace('LoginScreen');
        }
      },
    });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.replace('LoginScreen'))}
          activeOpacity={0.85}
          style={styles.backBtn}
        >
          <ArrowLeft size={20} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('change_password.title', 'Change Password')}</Text>
      </View>

      {/* Input Fields */}
      <View style={styles.inputBlock}>
        <MaterialTextInput
          label={t('change_password.new_password_label', 'Password')}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder={t('change_password.new_password_placeholder', 'Enter new password')}
          showPasswordToggle
          error={!!newPasswordError}
          errorText={newPasswordError}
        />
        <MaterialTextInput
          label={t('change_password.confirm_password_label', 'Confirm Password')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder={t('change_password.confirm_password_placeholder', 'Confirm new password')}
          showPasswordToggle
          error={!!confirmPasswordError}
          errorText={confirmPasswordError}
        />
      </View>

      {/* Button */}
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleUpdatePassword}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? t('common.updating', 'Updating...') : t('change_password.update_button', 'Update Password')}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default ChangePasswordScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingLeft: wp(5.56),
    paddingRight: wp(5.56),
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(2.75),
  },

  backBtn: {
    padding: scale(4),
  },

  title: {
    fontSize: FONT.md,
    fontWeight: '600',
    color: '#000000',
    marginLeft: wp(3.33),
  },

  inputBlock: {
    width: '100%',
    marginTop: hp(3.75),
  },

  button: {
    width: '100%',
    height: hp(5.5),
    backgroundColor: '#ed1c24',
    borderRadius: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(3.25),
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    fontSize: FONT.xs,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});