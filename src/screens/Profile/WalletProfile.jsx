import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, DollarSign } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getWallet } from '../../services/walletService';
import { useAuth } from '../../context/AuthContext';

export default function WalletProfile() {
  const { t } = useTranslation();
  const { currencySymbol } = useAuth();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  const [walletData, setWalletData] = useState({
    balance: 0,
    transactions: [],
  });

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getWallet();
      
      setWalletData({
        balance: data?.balance ?? data?.walletBalance ?? 0,
        transactions: data?.transactions ?? [],
      });
    } catch (err) {
      console.error('Failed to fetch wallet data:', err);
      setError(t('wallet.load_error', 'Failed to load wallet data. Please try again.'));
      Toast.show({
        type: 'topError',
        text1: t('common.error', 'Error'),
        text2: t('wallet.load_failed', 'Failed to load wallet data'),
        position: 'top',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    fetchWalletData();
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={20} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('wallet.title', 'Wallet')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#E41C26" />
          <Text style={styles.loaderText}>{t('wallet.loading', 'Loading wallet...')}</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
            <Text style={styles.retryBtnText}>{t('common.retry', 'Retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshing={isFetching}
          onRefresh={fetchWalletData}
        >
          <View style={styles.balanceCard}>
            <Text style={styles.balanceValue}>
              {walletData.balance.toFixed(2)} {currencySymbol}
            </Text>
            <Text style={styles.balanceLabel}>{t('wallet.total_balance', 'Total Wallet Balance')}</Text>
            <View style={styles.balanceGlow} />
            <View style={styles.balanceGlowSmall} />
          </View>

          <Text style={styles.sectionTitle}>
            {walletData.transactions.length > 0
              ? t('wallet.all_transactions', 'All Transactions')
              : t('wallet.no_transactions', 'No Transactions')}
          </Text>

          {walletData.transactions.length > 0 ? (
            walletData.transactions.map(item => (
              <View key={item.id} style={styles.txCard}>
                <View style={styles.txLeft}>
                  <View style={styles.txIconWrap}>
                    <DollarSign size={14} color="#111" />
                  </View>
                  <View style={styles.txMeta}>
                    <Text style={styles.txId}>#{item.id}</Text>
                    <Text style={styles.txTitle}>
                      {item.titleKey ? t(item.titleKey, item.title || t('wallet.transaction', 'Transaction')) : (item.title || t('wallet.transaction', 'Transaction'))}
                    </Text>
                    <Text style={styles.txMethod}>
                      {item.methodKey ? t(item.methodKey, item.method || t('wallet.payment', 'Payment')) : (item.method || t('wallet.payment', 'Payment'))}
                    </Text>
                  </View>
                </View>
                <View style={styles.txRight}>
                  <Text style={styles.txDate}>{item.date}</Text>
                  <Text style={styles.txAmount}>
                    {typeof item.amount === 'number'
                      ? item.amount.toFixed(2)
                      : item.amount} {currencySymbol}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {t('wallet.empty_message', 'No transactions yet. Your transactions will appear here.')}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    backgroundColor: '#FFF',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
    color: '#111',
    fontSize: 16,
  },
  headerSpacer: { width: 36 },

  scroll: { padding: 14, paddingBottom: 24 },

  balanceCard: {
    height: 120,
    borderRadius: 14,
    backgroundColor: '#E41C26',
    padding: 16,
    overflow: 'hidden',
  },
  balanceValue: { color: '#FFF', fontSize: 26, fontWeight: '800' },
  balanceLabel: { marginTop: 4, color: '#FFE7E7', fontSize: 11 },
  balanceGlow: {
    position: 'absolute',
    right: -20,
    top: -10,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  balanceGlowSmall: {
    position: 'absolute',
    right: 20,
    bottom: -20,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },

  sectionTitle: {
    marginTop: 14,
    marginBottom: 8,
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },

  txCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  txLeft: { flexDirection: 'row', alignItems: 'center' },
  txIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  txMeta: { gap: 2 },
  txId: { fontSize: 9, color: '#777' },
  txTitle: { fontSize: 12, color: '#111', fontWeight: '700' },
  txMethod: { fontSize: 10, color: '#8E8E8E' },

  txRight: { alignItems: 'flex-end' },
  txDate: { fontSize: 9, color: '#8E8E8E', marginBottom: 4 },
  txAmount: { fontSize: 12, color: '#111', fontWeight: '700' },

  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loaderText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#E41C26',
    textAlign: 'center',
    fontWeight: '500',
  },
  retryBtn: {
    backgroundColor: '#E41C26',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },

  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E8E',
    textAlign: 'center',
    fontWeight: '500',
  },
});