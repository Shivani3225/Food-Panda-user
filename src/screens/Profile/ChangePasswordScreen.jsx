import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { TextInput } from 'react-native';
import apiClient from '../../config/apiClient';
import { USER_ROUTES } from '../../config/routes';

const { width, height } = Dimensions.get('window');

const FIGMA_WIDTH = 313;
const SCALE = width / FIGMA_WIDTH;

const s = v => v * SCALE;

const ChangePasswordScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const nextErrors = {};

    if (!currentPassword.trim()) {
      nextErrors.currentPassword = t('change_password.current_password_required', 'Current password is required');
    }

    if (!newPassword.trim()) {
      nextErrors.newPassword = t('change_password.new_password_required', 'New password is required');
    }

    if (!confirmPassword.trim()) {
      nextErrors.confirmPassword = t('change_password.confirm_password_required', 'Please confirm your new password');
    } else if (newPassword && confirmPassword !== newPassword) {
      nextErrors.confirmPassword = t('change_password.passwords_do_not_match', 'Passwords do not match');
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleUpdatePassword = async () => {
    if (!validate()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await apiClient.put(USER_ROUTES.changePassword, {
        currentPassword,
        newPassword,
      });

      Toast.show({
        type: 'topSuccess',
        text1: t('common.success', 'Success'),
        text2: t('change_password.password_updated', 'Password updated successfully!'),
        position: 'top',
      });
      setTimeout(() => navigation.goBack(), 600);
    } catch (error) {
      const message =
        error?.response?.data?.message || t('change_password.update_failed', 'Failed to update password');
      Toast.show({
        type: 'topError',
        text1: t('common.error', 'Error'),
        text2: message,
        position: 'top',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const PasswordInput = ({ label, value, onChangeText, placeholder, show, setShow, error }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, error && styles.inputError]}>
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={!show}
          placeholderTextColor="#9CA3AF"
        />
        <TouchableOpacity onPress={() => setShow(!show)} style={styles.eyeIcon}>
          {show ? <Eye size={20} color="#9CA3AF" /> : <EyeOff size={20} color="#9CA3AF" />}
        </TouchableOpacity>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('change_password.title', 'Change Password')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Subtitle */}
        <Text style={styles.subtitle}>
          {t('change_password.subtitle', 'Set a new password in just a few steps.')}
        </Text>

        {/* Input Fields */}
        <View style={styles.inputBlock}>
          <PasswordInput
            label={t('change_password.current_password_label', 'Current Password')}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="........."
            show={showCurrent}
            setShow={setShowCurrent}
            error={errors.currentPassword}
          />
          <PasswordInput
            label={t('change_password.new_password_label', 'New Password')}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="........."
            show={showNew}
            setShow={setShowNew}
            error={errors.newPassword}
          />
          <PasswordInput
            label={t('change_password.confirm_password_label', 'Confirm New Password')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="........."
            show={showConfirm}
            setShow={setShowConfirm}
            error={errors.confirmPassword}
          />
        </View>

        {/* Button */}
        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleUpdatePassword}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.buttonText}>{t('change_password.update_button', 'Update Password')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChangePasswordScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },

  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 32,
  },

  inputBlock: {
    width: '100%',
  },

  inputContainer: {
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#fff',
  },

  inputError: {
    borderColor: '#E41C26',
  },

  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },

  eyeIcon: {
    padding: 4,
  },

  errorText: {
    fontSize: 12,
    color: '#E41C26',
    marginTop: 4,
    fontWeight: '500',
  },

  button: {
    width: '100%',
    height: 56,
    backgroundColor: '#E41C26',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },

  buttonDisabled: {
    backgroundColor: '#FCA5A5',
  },

  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});