import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  ScrollView,
  Platform,
  Linking,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PaymentSettingScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    holderName: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    upiId: '',
  });

  const [savedCards, setSavedCards] = useState([
    { id: '1', title: t('payment.credit_card', 'Credit Card'), type: 'credit', isDefault: true },
    { id: '2', title: t('payment.debit_card', 'Debit Card'), type: 'debit', isDefault: true },
  ]);

  const [savedUpi, setSavedUpi] = useState([
    {
      id: 'u1',
      title: t('payment.google_pay', 'Google Pay UPI'),
      icon: require('../../assets/icons/googlepay.png'),
    },
    {
      id: 'u2',
      title: t('payment.phonepe', 'PhonePe UPI'),
      icon: require('../../assets/icons/paypal.png'),
    },
  ]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const cards = await AsyncStorage.getItem('saved_cards');
        const upis = await AsyncStorage.getItem('saved_upis');
        
        if (cards) {
          const parsedCards = JSON.parse(cards);
          // Keep default cards and append saved ones
          setSavedCards([
            { id: '1', title: t('payment.credit_card', 'Credit Card'), type: 'credit', isDefault: true },
            { id: '2', title: t('payment.debit_card', 'Debit Card'), type: 'debit', isDefault: true },
            ...parsedCards.filter(c => !c.isDefault)
          ]);
        }
        
        if (upis) {
          const parsedUpis = JSON.parse(upis);
          setSavedUpi([
            { id: 'u1', title: t('payment.google_pay', 'Google Pay UPI'), icon: require('../../assets/icons/googlepay.png') },
            { id: 'u2', title: t('payment.phonepe', 'PhonePe UPI'), icon: require('../../assets/icons/paypal.png') },
            ...parsedUpis.filter(u => u.id !== 'u1' && u.id !== 'u2')
          ]);
        }
      } catch (e) {
        console.error('Failed to load payment data', e);
      }
    };
    loadData();
  }, [t]);

  const updateForm = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const { holderName, cardNumber, expiry, cvv, upiId } = formData;

    if (selectedType === 'upi') {
      if (!upiId.trim() || !upiId.includes('@')) {
        Toast.show({ type: 'error', text1: t('common.error', 'Error'), text2: t('payment.invalid_upi', 'Please enter a valid UPI ID') });
        return;
      }
      const appIcon = formData.upiApp === 'googlepay' 
        ? require('../../assets/icons/googlepay.png') 
        : require('../../assets/icons/paypal.png');
      
      const newItem = { 
        id: Date.now().toString(), 
        title: upiId, 
        type: 'upi',
        provider: formData.upiApp,
        token: upiId,
        icon: appIcon 
      };
      const updated = [...savedUpi, newItem];
      setSavedUpi(updated);
      await AsyncStorage.setItem('saved_upis', JSON.stringify(updated));
    } else {
      const cleanCardNumber = cardNumber.replace(/\s/g, '');
      if (!holderName.trim()) {
        Toast.show({ type: 'error', text1: t('common.error', 'Error'), text2: t('payment.enter_holder_name', 'Enter card holder name') });
        return;
      }
      if (cleanCardNumber.length < 16) {
        Toast.show({ type: 'error', text1: t('common.error', 'Error'), text2: t('payment.invalid_card', 'Card number must be 16 digits') });
        return;
      }

      // Improved Luhn Algorithm
      let sum = 0;
      let shouldDouble = false;
      for (let i = cleanCardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cleanCardNumber.charAt(i), 10);
        if (shouldDouble) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }
        sum += digit;
        shouldDouble = !shouldDouble;
      }
      
      if (sum % 10 !== 0) {
        Toast.show({ 
          type: 'error', 
          text1: t('common.error', 'Error'), 
          text2: t('payment.invalid_card_checksum', 'Please enter a valid card number') 
        });
        return;
      }

      if (expiry.length < 5) {
        Toast.show({ type: 'error', text1: t('common.error', 'Error'), text2: t('payment.invalid_expiry', 'Enter valid expiry (MM/YY)') });
        return;
      }
      const [month, year] = expiry.split('/');
      const m = parseInt(month, 10);
      if (m < 1 || m > 12) {
        Toast.show({ type: 'error', text1: t('common.error', 'Error'), text2: t('payment.invalid_month', 'Month must be between 01 and 12') });
        return;
      }
      if (cvv.length < 3) {
        Toast.show({ type: 'error', text1: t('common.error', 'Error'), text2: t('payment.invalid_cvv', 'Enter valid CVV') });
        return;
      }

      const masked = `**** **** **** ${cleanCardNumber.slice(-4)}`;
      const newItem = { 
        id: Date.now().toString(), 
        title: masked, 
        type: 'card', 
        provider: 'Card',
        last4: cleanCardNumber.slice(-4),
        holderName: holderName
      };
      const updated = [...savedCards, newItem];
      setSavedCards(updated);
      // Save only non-default cards to storage
      const cardsToSave = updated.filter(c => !c.isDefault);
      await AsyncStorage.setItem('saved_cards', JSON.stringify(cardsToSave));
    }

    Toast.show({
      type: 'success',
      text1: t('common.success', 'Success'),
      text2: t('payment.save_success', 'Payment details saved successfully'),
      position: 'top',
      visibilityTime: 3000,
    });
    setSelectedType(null);
    setFormData({ holderName: '', cardNumber: '', expiry: '', cvv: '', upiId: '', upiApp: 'googlepay' });
    
    // Refresh data
    const cards = await AsyncStorage.getItem('saved_cards');
    const upis = await AsyncStorage.getItem('saved_upis');
    if (cards) {
      const parsedCards = JSON.parse(cards);
      setSavedCards([
        { id: '1', title: t('payment.credit_card', 'Credit Card'), type: 'credit', isDefault: true },
        { id: '2', title: t('payment.debit_card', 'Debit Card'), type: 'debit', isDefault: true },
        ...parsedCards.filter(c => !c.isDefault)
      ]);
    }
    if (upis) {
      const parsedUpis = JSON.parse(upis);
      setSavedUpi([
        { id: 'u1', title: t('payment.google_pay', 'Google Pay UPI'), icon: require('../../assets/icons/googlepay.png') },
        { id: 'u2', title: t('payment.phonepe', 'PhonePe UPI'), icon: require('../../assets/icons/paypal.png') },
        ...parsedUpis.filter(u => u.id !== 'u1' && u.id !== 'u2')
      ]);
    }
  };

  const handleUpiPress = async (item) => {
    setLoading(true);

    // Artificial delay for "processing" feel
    setTimeout(async () => {
      let url = '';
      const upiId = item.token || item.title || '';
      const payeeName = 'Food Panda';
      
      // Construct a basic UPI URL
      const baseUpiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&cu=INR&am=0`;

      if (item.id === 'u1' || item.provider === 'googlepay') {
        url = Platform.OS === 'ios' ? `gpay://upi/pay?pa=${upiId}` : baseUpiUrl;
      } else if (item.id === 'u2' || item.provider === 'phonepe') {
        url = Platform.OS === 'ios' ? `phonepe://pay?pa=${upiId}` : baseUpiUrl;
      } else {
        url = baseUpiUrl;
      }

      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          // Fallback to generic upi:// if specific app fails
          const genericSupported = await Linking.canOpenURL(baseUpiUrl);
          if (genericSupported) {
            await Linking.openURL(baseUpiUrl);
          } else {
            Toast.show({
              type: 'error',
              text1: t('common.error', 'Error'),
              text2: t('payment.app_not_found', 'Selected UPI app is not installed on this device'),
            });
          }
        }
      } catch (err) {
        console.error('An error occurred', err);
        Toast.show({
          type: 'error',
          text1: t('common.error', 'Error'),
          text2: t('payment.upi_error', 'Failed to open UPI app'),
        });
      } finally {
        setLoading(false);
      }
    }, 800);
  };

  const handleCloseForm = () => {
    setSelectedType(null);
  };

  const getFormTitle = () => {
    if (selectedType === 'upi') {
      return t('payment.add_upi_id', 'Add UPI ID');
    }
    if (selectedType === 'credit') {
      return t('payment.credit_card_details', 'Credit Card Details');
    }
    if (selectedType === 'debit') {
      return t('payment.debit_card_details', 'Debit Card Details');
    }
    return '';
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={22} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>Payment Setting</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('payment.cards', 'Cards')}</Text>

          <FlatList
            data={savedCards}
            scrollEnabled={false}
            keyExtractor={item => item.id}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.row}
                onPress={() => setSelectedType(item.type)}
                activeOpacity={0.7}
              >
                <Text style={styles.rowText}>{item.title}</Text>
                {item.isDefault ? (
                  <Plus size={20} color="#000" strokeWidth={2.5} />
                ) : (
                  <View style={styles.savedBadge}>
                    <Text style={styles.savedBadgeText}>{t('payment.saved', 'Saved')}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('payment.upi', 'UPI')}</Text>

          <FlatList
            data={[...savedUpi, { id: 'add', title: t('payment.add_new_upi', 'Add new UPI ID'), isAdd: true, type: 'upi' }]}
            scrollEnabled={false}
            keyExtractor={item => item.id}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => {
              if (item.isAdd) {
                return (
                  <TouchableOpacity
                    style={styles.row}
                    onPress={() => setSelectedType(item.type)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.rowText}>{item.title}</Text>
                    <Plus size={20} color="#000" strokeWidth={2.5} />
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => handleUpiPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowLeft}>
                    <View style={styles.iconContainer}>
                      <Image source={item.icon} style={styles.icon} />
                    </View>
                    <Text style={styles.rowText}>{item.title}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Dynamic Form */}
        {selectedType && (
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>{getFormTitle()}</Text>
              <TouchableOpacity onPress={handleCloseForm}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedType === 'upi' ? (
              <>
                <View style={styles.upiSelector}>
                  <TouchableOpacity 
                    style={[styles.upiOption, formData.upiApp === 'googlepay' && styles.upiOptionActive]}
                    onPress={() => updateForm('upiApp', 'googlepay')}
                  >
                    <Image source={require('../../assets/icons/googlepay.png')} style={styles.upiIcon} />
                    <Text style={[styles.upiOptionText, formData.upiApp === 'googlepay' && styles.upiOptionTextActive]}>GPay</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.upiOption, formData.upiApp === 'phonepe' && styles.upiOptionActive]}
                    onPress={() => updateForm('upiApp', 'phonepe')}
                  >
                    <Image source={require('../../assets/icons/paypal.png')} style={styles.upiIcon} />
                    <Text style={[styles.upiOptionText, formData.upiApp === 'phonepe' && styles.upiOptionTextActive]}>PhonePe</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  placeholder={t('payment.upi_id_placeholder', 'Enter UPI ID')}
                  style={styles.input}
                  placeholderTextColor="#999"
                  value={formData.upiId}
                  onChangeText={(val) => updateForm('upiId', val)}
                />
              </>
            ) : (
              <>
                <TextInput
                  placeholder={t('payment.card_holder_name', 'Card Holder Name')}
                  style={styles.input}
                  placeholderTextColor="#999"
                  value={formData.holderName}
                  onChangeText={(val) => {
                    const filtered = val.replace(/[^a-zA-Z\s]/g, '');
                    updateForm('holderName', filtered);
                  }}
                />

                <TextInput
                  placeholder={t('payment.card_number', 'Card Number')}
                  style={styles.input}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                  maxLength={16}
                  value={formData.cardNumber}
                  onChangeText={(val) => {
                    const filtered = val.replace(/[^0-9]/g, '');
                    updateForm('cardNumber', filtered);
                  }}
                />

                <View style={styles.rowInputs}>
                  <TextInput
                    placeholder={t('payment.expiry_date', 'MM/YY')}
                    style={[styles.input, styles.smallInput]}
                    placeholderTextColor="#999"
                    maxLength={5}
                    value={formData.expiry}
                    onChangeText={(val) => {
                      let filtered = val.replace(/[^0-9/]/g, '');
                      if (filtered.length === 2 && !filtered.includes('/') && formData.expiry.length === 1) {
                        filtered += '/';
                      }
                      updateForm('expiry', filtered);
                    }}
                  />

                  <TextInput
                    placeholder={t('payment.cvv', 'CVV')}
                    style={[styles.input, styles.smallInput]}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                    maxLength={3}
                    value={formData.cvv}
                    onChangeText={(val) => {
                      const filtered = val.replace(/[^0-9]/g, '');
                      updateForm('cvv', filtered);
                    }}
                  />
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
            >
              <Text style={styles.saveBtnText}>{t('common.save', 'Save')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Loading Overlay */}
      {loading && (
        <Modal transparent animationType="fade">
          <View style={styles.loaderOverlay}>
            <View style={styles.loaderContent}>
              <ActivityIndicator size="large" color="#E41C26" />
              <Text style={styles.loaderText}>{t('common.processing', 'Processing...')}</Text>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },

  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },

  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    zIndex: -1,
  },

  sectionCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    paddingVertical: 12,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  row: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },

  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rowText: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },

  iconContainer: {
    width: 36,
    height: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#fff',

  },

  icon: {
    width: 28,
    height: 18,
    resizeMode: 'contain',
  },

  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },

  formCard: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  closeIcon: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: '600',
  },

  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },

  input: {
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    fontSize: 14,
    color: '#000',
    backgroundColor: '#FAFAFA',
  },

  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  smallInput: {
    width: '48%',
  },

  saveBtn: {
    backgroundColor: '#E41C26',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },

  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  loaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loaderContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },

  loaderText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  upiSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  upiOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    gap: 8,
  },
  upiOptionActive: {
    borderColor: '#E41C26',
    backgroundColor: '#FFF5F5',
  },
  upiIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  upiOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  upiOptionTextActive: {
    color: '#E41C26',
  },
  savedBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  savedBadgeText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
  },
});