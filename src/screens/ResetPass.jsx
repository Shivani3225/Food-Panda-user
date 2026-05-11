import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import LogoIcon from '../assets/icons/LogoIcon.svg';
import { useNavigation } from '@react-navigation/native';

const ResetPassword = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  // Hooks - always at top level
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Validation and navigation
  const handleCreate = () => {
    if (!newPassword || !confirmPassword) {
      Toast.show({
        type: 'topError',
        text1: t('common.error', 'Error'),
        text2: t('reset_password.fill_both_fields', 'Please fill both fields'),
        position: 'top',
      });
      return;
    }
    if (newPassword.length < 6) {
      Toast.show({
        type: 'topError',
        text1: t('common.error', 'Error'),
        text2: t('reset_password.password_length', 'Password must be at least 6 characters'),
        position: 'top',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'topError',
        text1: t('common.error', 'Error'),
        text2: t('reset_password.passwords_mismatch', 'Passwords do not match'),
        position: 'top',
      });
      return;
    }

    // Success alert
    Toast.show({
      type: 'topSuccess',
      text1: t('common.success', 'Success'),
      text2: t('reset_password.success_message', 'Your password has been reset successfully!'),
      position: 'top',
    });
    setTimeout(() => navigation.navigate('MainPage'), 600);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <ArrowLeft size={22} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.skip}>{t('reset_password.skip', 'Skip')}</Text>
            </TouchableOpacity>
          </View>

          {/* Logo */}
          <LogoIcon width={130} height={65} style={styles.logo} />

          {/* Title */}
          <Text style={styles.title}>{t('reset_password.title', 'Reset Your Password')}</Text>
          <Text style={styles.subtitle}>
            {t('reset_password.subtitle', 'Password must be different from previous one')}
          </Text>

          {/* New Password */}
          <Text style={styles.label}>{t('reset_password.new_password_label', 'New Password')}</Text>
          <View style={styles.inputBox}>
            <Lock size={18} color="#888" />
            <TextInput
              placeholder={t('reset_password.new_password_placeholder', 'Enter New Password')}
              placeholderTextColor="#999"
              secureTextEntry={!showNew}
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              cursorColor="#000"
              selectionColor="#E41E26"
            />
            <TouchableOpacity onPress={() => setShowNew(!showNew)}>
              {showNew ? (
                <EyeOff size={18} color="#888" />
              ) : (
                <Eye size={18} color="#888" />
              )}
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <Text style={styles.label}>{t('reset_password.confirm_password_label', 'Confirm Password')}</Text>
          <View style={styles.inputBox}>
            <Lock size={18} color="#888" />
            <TextInput
              placeholder={t('reset_password.confirm_password_placeholder', 'Confirm Password')}
              placeholderTextColor="#999"
              secureTextEntry={!showConfirm}
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              cursorColor="#000"
              selectionColor="#E41E26"
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
              {showConfirm ? (
                <EyeOff size={18} color="#888" />
              ) : (
                <Eye size={18} color="#888" />
              )}
            </TouchableOpacity>
          </View>

          {/* Illustration */}
          <Image
            source={require('../assets/images/Closed.jpg')}
            style={styles.illustration}
            resizeMode="contain"
          />

          {/* Button */}
          <TouchableOpacity style={styles.button} onPress={handleCreate}>
            <Text style={styles.buttonText}>{t('reset_password.create_button', 'Create')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ResetPassword;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ed1c24',
  },

  container: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    flexGrow: 1,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    alignItems: 'center',
  },

  skip: {
    fontSize: 14,
    color: '#000',
  },

  logo: {
    width: 130,
    height: 65,
    alignSelf: 'center',
    marginTop: 10,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 15,
  },

  subtitle: {
    fontSize: 13,
    color: '#777',
    textAlign: 'center',
    marginTop: 5,
  },

  label: {
    fontSize: 12,
    marginTop: 20,
    marginBottom: 6,
  },

  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 10,
  },

  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#000',
  },

  illustration: {
    width: '100%',
    height: 200,
    marginTop: 25,
  },

  button: {
    height: 50,
    backgroundColor: '#E41E26',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});