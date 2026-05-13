import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

// Coupon data with translation keys
const COUPONS = [
  {
    id: 'PICHAPIE',
    titleKey: 'offers.shakeys_pizza_offer',
    title: "500 off in Shakey's Pizza",
    amount: 500,
    minSpend: 1000,
    expiresKey: 'offers.expires_jan_2026',
    expires: '31 Jan 2026',
    termsKey: 'offers.terms_new_users',
    terms: 'Terms valid for new users only. One-time use.',
  },
  {
    id: 'PICHAPIE-2',
    titleKey: 'offers.shakeys_pizza_offer',
    title: "500 off in Shakey's Pizza",
    amount: 500,
    minSpend: 1000,
    expiresKey: 'offers.expires_jan_2026',
    expires: '31 Jan 2026',
    termsKey: 'offers.terms_new_users',
    terms: 'Terms valid for new users only. One-time use.',
  },
  {
    id: 'PICHAPIE-3',
    titleKey: 'offers.shakeys_pizza_offer',
    title: "500 off in Shakey's Pizza",
    amount: 500,
    minSpend: 1000,
    expiresKey: 'offers.expires_jan_2026',
    expires: '31 Jan 2026',
    termsKey: 'offers.terms_new_users',
    terms: 'Terms valid for new users only. One-time use.',
  },
  {
    id: 'PICHAPIE-4',
    titleKey: 'offers.shakeys_pizza_offer',
    title: "500 off in Shakey's Pizza",
    amount: 500,
    minSpend: 1000,
    expiresKey: 'offers.expires_jan_2026',
    expires: '31 Jan 2026',
    termsKey: 'offers.terms_new_users',
    terms: 'Terms valid for new users only. One-time use.',
  },
  {
    id: 'PICHAPIE-5',
    titleKey: 'offers.shakeys_pizza_offer',
    title: "500 off in Shakey's Pizza",
    amount: 500,
    minSpend: 1000,
    expiresKey: 'offers.expires_jan_2026',
    expires: '31 Jan 2026',
    termsKey: 'offers.terms_new_users',
    terms: 'Terms valid for new users only. One-time use.',
  },
];

export default function Offers() {
  const { t } = useTranslation();
  const { currencySymbol } = useAuth();
  const navigation = useNavigation();
  const [query, setQuery] = useState('');

  const list = useMemo(() => {
    if (!query.trim()) return COUPONS;
    const q = query.toLowerCase();
    return COUPONS.filter(c =>
      [c.id, c.title, c.terms].some(v => v.toLowerCase().includes(q)),
    );
  }, [query]);

  const handleUseNow = (coupon) => {
    // Navigate to restaurant listing or apply coupon
    console.log('Using coupon:', coupon.id);
    // You can add navigation logic here
    // navigation.navigate('Restaurants', { coupon: coupon.id });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <ChevronLeft size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('offers.title', 'Offers')}</Text>
        <View style={styles.headerSpacer} />
      </View> */}

      <View style={styles.searchWrap}>
        <Search size={18} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder={t('offers.search_placeholder', 'Search offers...')}
          placeholderTextColor="#999"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {list.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {t('offers.no_offers_found', 'No offers found')}
            </Text>
          </View>
        ) : (
          list.map(item => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.cardLeft}>
                  <Text style={styles.cardTitle}>
                    {t(item.titleKey, item.title)}
                  </Text>
                  <Text style={styles.amountText}>
                    {item.amount.toFixed(2)} {currencySymbol}
                  </Text>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>
                      {t('offers.min_spend', 'Min spend')} {item.minSpend.toFixed(2)} {currencySymbol}
                    </Text>
                    <Text style={styles.metaDot}>•</Text>
                    <Text style={styles.metaText}>
                      {t('offers.use_by', 'Use by')} {t(item.expiresKey, item.expires)}
                    </Text>
                  </View>

                  <View style={styles.codeRow}>
                    <Text style={styles.codeText}>{item.id}</Text>
                    <TouchableOpacity 
                      activeOpacity={0.9} 
                      style={styles.useBtn}
                      onPress={() => handleUseNow(item)}
                    >
                      <Text style={styles.useBtnText}>
                        {t('offers.use_now', 'Use Now')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.cardRight}>
                  <Text style={styles.percent}>%</Text>
                </View>
              </View>

              {/* Light Blue Terms Banner */}
              <View style={styles.termsBanner}>
                <Text style={styles.termsText}>
                  {t('offers.terms_header', 'Terms:')} {t(item.termsKey, item.terms)}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFF' },

  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontWeight: '700', fontSize: 16 },
  headerSpacer: { width: 36 },

  searchWrap: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    backgroundColor: '#FFF',
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#111',
    paddingVertical: 0,
  },

  scroll: { paddingHorizontal: 12, paddingBottom: 16 },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  cardLeft: { flex: 1, paddingRight: 8 },
  cardTitle: { fontSize: 14, color: '#222', fontWeight: '700' },
  amountText: { marginTop: 4, fontSize: 16, fontWeight: '800' },
  metaRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 10, color: '#8C8C8C' },
  metaDot: { marginHorizontal: 6, color: '#BDBDBD' },

  codeRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeText: {
    fontSize: 10,
    color: '#444',
    borderWidth: 1,
    borderColor: '#EEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    letterSpacing: 0.6,
  },
  useBtn: {
    backgroundColor: '#E53935',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  useBtnText: { color: '#FFF', fontSize: 10, fontWeight: '800' },

  termsBanner: {
    backgroundColor: '#E3F2FD', // Light Blue
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#BBDEFB',
  },
  termsText: {
    fontSize: 10,
    color: '#1976D2', // Darker Blue
    fontWeight: '500',
    lineHeight: 14,
  },

  cardRight: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percent: {
    fontSize: 40,
    color: '#EDEDED',
    fontWeight: '800',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});