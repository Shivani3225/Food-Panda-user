import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import ReasonSheetModal from '../../components/ReasonSheetModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import useHideTabBar from '../../utils/hooks/useHideTabBar';
import { deleteAccount } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';

const getChecklist = (t) => [
  {
    id: '1',
    title: t('delete_account.pending_orders', 'Pending Orders'),
    desc: t('delete_account.pending_orders_desc', 'Make sure you don’t have any active or pending deliveries.'),
  },
  {
    id: '2',
    title: t('delete_account.saved_addresses', 'Saved Addresses & Payment Methods'),
    desc: t('delete_account.saved_addresses_desc', 'These will be permanently erased.'),
  },
  {
    id: '3',
    title: t('delete_account.order_history', 'Order History'),
    desc: t('delete_account.order_history_desc', 'You will lose access to past receipts and order details.'),
  },
  {
    id: '4',
    title: t('delete_account.wallet_credits', 'Wallet / Credits / Coupons'),
    desc: t('delete_account.wallet_credits_desc', 'Any remaining balance, discounts, or rewards will be lost.'),
  },
  {
    id: '5',
    title: t('delete_account.recovery', 'Recovery'),
    desc: t('delete_account.recovery_desc', 'Once deleted, your account and data cannot be restored.'),
  },
];

const getReasons = (t) => [
  t('delete_account.reason_break', 'I’m taking a break from this platform'),
  t('delete_account.reason_not_useful', 'I don’t find the service useful anymore'),
  t('delete_account.reason_privacy', 'I’m concerned about my privacy'),
  t('delete_account.reason_duplicate', 'I created a duplicate account'),
  t('delete_account.reason_support', 'I’m not satisfied with the customer support'),
  t('delete_account.reason_results', 'I didn’t get the results I expected'),
  t('delete_account.reason_alternative', 'I found an alternative service I prefer'),
  t('delete_account.reason_technical', 'Technical issues or bugs'),
  t('delete_account.reason_other', 'Other (Please specify)'),
];

export default function DeleteAccountScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user } = useAuth();
  useHideTabBar(navigation);
  const [reasonVisible, setReasonVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);
  const [customReason, setCustomReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const checklist = useMemo(() => getChecklist(t), [t]);
  const reasons = useMemo(() => getReasons(t), [t]);

  const isOtherSelected = selectedReason === t('delete_account.reason_other', 'Other (Please specify)');
  const isDeleteDisabled = !selectedReason || (isOtherSelected && !customReason.trim()) || isDeleting;

  const handleDeleteAccount = async () => {
    if (isDeleteDisabled) return;

    setIsDeleting(true);
    try {
      const finalReason = isOtherSelected ? customReason.trim() : selectedReason;
      await deleteAccount(finalReason);
      // Navigate to completion screen after successful deletion
      navigation.navigate('DeletionComplete');
    } catch (error) {
      console.error('Error deleting account:', error);
      Toast.show({
        type: 'topError',
        text1: t('common.error', 'Error'),
        text2: error?.response?.data?.message || t('delete_account.delete_failed', 'Failed to delete account. Please try again.'),
        position: 'top',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.pointRow}>
      <Text style={styles.bullet}>•</Text>
      <Text style={styles.pointText}>
        <Text style={styles.pointTitle}>{item.title}</Text>
        <Text style={styles.pointDesc}> — {item.desc}</Text>
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={require('../../assets/icons/Backarrow.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('delete_account.title', 'Delete Account')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* Avatar */}
        <Image
          source={user?.profilePic ? { uri: user.profilePic } : require('../../assets/icons/user.png')}
          style={styles.avatar}
        />

        <Text style={styles.name}>{user?.name || t('profile.user', 'User')}</Text>

        <Text style={styles.subText}>
          {t('delete_account.help_text', 'Help us understand why you’re deactivating your account.')}
        </Text>

        <Text style={styles.label}>{t('delete_account.reason_label', 'Reason*')}</Text>

        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setReasonVisible(true)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.dropdownText,
              selectedReason && styles.dropdownTextSelected,
            ]}
          >
            {selectedReason || t('delete_account.select_reason', 'Select Reason')}
          </Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        {isOtherSelected && (
          <TextInput
            style={styles.customReasonInput}
            placeholder={t('delete_account.enter_custom_reason', 'Please type your reason here')}
            placeholderTextColor="#9CA3AF"
            value={customReason}
            onChangeText={setCustomReason}
            multiline
            textAlignVertical="top"
          />
        )}

        <Text style={styles.sectionTitle}>
          {t('delete_account.checklist_title', 'Things to Check Before Deleting an Account:')}
        </Text>

        <FlatList
          data={checklist}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          scrollEnabled={false}
        />

        <TouchableOpacity
          style={[
            styles.deleteBtn,
            isDeleteDisabled && styles.deleteBtnDisabled,
          ]}
          disabled={isDeleteDisabled}
          onPress={handleDeleteAccount}
        >
          {isDeleting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text
              style={[
                styles.deleteText,
                isDeleteDisabled && styles.deleteTextDisabled,
              ]}
            >
              {t('delete_account.delete_button', 'Delete Account')}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <ReasonSheetModal
        visible={reasonVisible}
        reasons={reasons}
        selectedReason={selectedReason}
        onSelect={reason => {
          setSelectedReason(reason);
          setReasonVisible(false);
        }}
        onClose={() => setReasonVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  container: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  /* HEADER */
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },

  headerSpacer: {
    width: 22,
    height: 22,
  },

  /* AVATAR */
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignSelf: 'center',
    marginTop: 12,
  },

  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    alignSelf: 'center',
    marginTop: 8,
  },

  subText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#0F172A',
    fontWeight: '600',
    marginTop: 14,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    marginTop: 14,
  },

  /* DROPDOWN */
  dropdown: {
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  dropdownTextSelected: {
    color: '#111827',
  },
  arrow: {
    fontSize: 20,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  customReasonInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginTop: 12,
    padding: 12,
    fontSize: 15,
    color: '#111827',
    minHeight: 80,
    backgroundColor: '#FAFAFA',
  },

  /* SECTION */
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 6,
  },

  list: {
    paddingBottom: 16,
  },

  pointRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  bullet: {
    fontSize: 22,
    marginRight: 6,
    lineHeight: 20,
  },
  pointText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#374151',
  },
  pointTitle: {
    fontWeight: '600',
    color: '#111827',
  },
  pointDesc: {
    fontWeight: '400',
    color: '#6B7280',
  },

  /* BUTTON */
  deleteBtn: {
    height: 48,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  deleteBtnDisabled: {
    backgroundColor: '#FCA5A5',
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteTextDisabled: {
    color: '#FFF5F5',
  },
});