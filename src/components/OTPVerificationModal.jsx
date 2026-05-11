import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  BackHandler,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

const OTPVerificationModal = ({
  visible,
  onClose,
  onVerify,
  onResend,
  loading = false,
  title,
  message,
}) => {
  const { t } = useTranslation();
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const [shouldRender, setShouldRender] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const inputRefs = useRef([]);

  // Get translated title
  const translatedTitle = title 
    ? (title.startsWith('otp.') || title.startsWith('common.'))
      ? t(title, title)
      : title
    : t('otp.verify_update', 'Verify Your Update');

  // Get translated message
  const translatedMessage = message
    ? (message.startsWith('otp.') || message.startsWith('common.'))
      ? t(message, message)
      : message
    : t('otp.enter_otp_message', 'Enter the OTP sent to your email/mobile');

  useEffect(() => {
    if (!visible) {
      setShouldRender(false);
      setOtp('');
      return undefined;
    }

    overlayOpacity.setValue(0);
    scale.setValue(0.8);
    
    requestAnimationFrame(() => {
      setShouldRender(true);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(overlayOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            stiffness: 220,
            damping: 20,
            useNativeDriver: true,
          }),
        ]).start();
      });
    });

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onClose();
        return true;
      }
    );
    return () => backHandler.remove();
  }, [visible, overlayOpacity, scale, onClose]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setResendDisabled(false);
    }
  }, [countdown]);

  const handleResend = () => {
    setResendDisabled(true);
    setCountdown(60);
    onResend();
  };

  const handleVerify = () => {
    if (otp.length === 6) {
      onVerify(otp);
    }
  };

  const handleOtpChange = (value, index) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    
    if (numericValue.length <= 1) {
      const newOtp = otp.split('');
      newOtp[index] = numericValue;
      const updatedOtp = newOtp.join('');
      setOtp(updatedOtp);

      if (numericValue && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  if (!visible || !shouldRender) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.centeredView, { opacity: overlayOpacity }]}>
        <Animated.View style={[styles.modalView, { transform: [{ scale }] }]}>
          <Text style={styles.headerText}>{translatedTitle}</Text>
          
          <View style={styles.contentView}>
            <Text style={styles.messageText}>{translatedMessage}</Text>
            
            <View style={styles.otpContainer}>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={styles.otpInput}
                  value={otp[index] || ''}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!loading}
                />
              ))}
            </View>

            <TouchableOpacity
              onPress={handleResend}
              disabled={resendDisabled || loading}
              style={styles.resendButton}
            >
              <Text style={[
                styles.resendText,
                (resendDisabled || loading) && styles.resendTextDisabled
              ]}>
                {resendDisabled 
                  ? t('otp.resend_in', 'Resend in {{seconds}}s', { seconds: countdown })
                  : t('otp.resend', 'Resend OTP')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.btnSecondaryText}>
                {t('common.cancel', 'Cancel')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btn, 
                styles.btnPrimary,
                (loading || otp.length !== 6) && styles.btnDisabled
              ]}
              onPress={handleVerify}
              disabled={loading || otp.length !== 6}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.btnPrimaryText}>
                  {t('otp.verify', 'Verify')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    width: Math.min(width - 40, 400),
  },
  headerText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 16,
  },
  contentView: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    width: '100%',
  },
  messageText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  otpInput: {
    flex: 1,
    height: 50,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#111111',
    backgroundColor: '#FAFAFA',
  },
  resendButton: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  resendText: {
    fontSize: 14,
    color: '#E41C26',
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: '#999999',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 20,
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: '#E41C26',
  },
  btnSecondary: {
    backgroundColor: '#F5F5F5',
  },
  btnDisabled: {
    backgroundColor: '#CCCCCC',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  btnSecondaryText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OTPVerificationModal;