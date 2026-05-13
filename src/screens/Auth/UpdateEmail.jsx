import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import MaterialTextInput from '../../components/input/MaterialTextInput';
import Toast from 'react-native-toast-message';
import { wp, hp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES as FONT } from '../../theme/typography';

export default function UpdateEmail() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const [email, setEmail] = useState(route.params?.email || '');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (emailValue) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValue) {
      return t('validation.email_required', 'Email is required');
    }
    if (!emailRegex.test(emailValue)) {
      return t('validation.invalid_email', 'Enter a valid email');
    }
    return '';
  };

  const handleUpdate = () => {
    const emailValue = email.trim();
    const error = validateEmail(emailValue);
    
    if (error) {
      setEmailError(error);
      return;
    }

    setEmailError('');
    
    // In a real scenario, you might want to call an API to update the email
    // For now, we just go back to Verify with the new email
    navigation.navigate('Verify', { 
      ...route.params,
      email: emailValue,
      autoResend: true // Trigger a resend to the new email if applicable
    });
    
    Toast.show({
      type: 'success',
      text1: t('common.success', 'Success'),
      text2: t('profile.email_updated', 'Email updated successfully'),
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.innerContainer}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                activeOpacity={0.85}
                style={styles.backBtn}
              >
                <ArrowLeft size={20} color="#111" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>
                {t('otp.change_email', 'Change Email')}
              </Text>
              <View style={styles.headerRightSpace} />
            </View>

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.content}>
                <Text style={styles.desc}>
                  {t('profile.enter_new_email', 'Enter your new email address')}
                </Text>

                <MaterialTextInput
                  label={t('forget_password.email_label', 'Email')}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('forget_password.email_placeholder', 'Enter your email')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={!!emailError}
                  errorText={emailError}
                />

                <TouchableOpacity
                  style={[styles.btn, isLoading && styles.btnDisabled]}
                  activeOpacity={0.9}
                  onPress={handleUpdate}
                  disabled={isLoading}
                >
                  <Text style={styles.btnText}>
                    {t('common.update', 'Update')}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF' },
  container: { flex: 1 },
  innerContainer: { flex: 1 },
  header: {
    height: hp(7),
    paddingHorizontal: wp(3.89),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: wp(11.11),
    height: hp(5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: FONT.md, fontWeight: '700', color: '#111' },
  headerRightSpace: { width: wp(11.11) },
  scrollContent: { paddingBottom: hp(3) },
  content: {
    marginTop: hp(4),
    paddingHorizontal: wp(5),
  },
  desc: {
    fontSize: FONT.sm,
    color: '#666',
    marginBottom: hp(2.5),
  },
  btn: {
    marginTop: hp(3),
    height: hp(6.75),
    backgroundColor: '#ed1c24',
    borderRadius: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFF', fontSize: FONT.md, fontWeight: '700' },
});
