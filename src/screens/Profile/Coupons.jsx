import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Search } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import CouponDetailsDrawer from '../../components/CouponDetailsDrawer';
import { useAuth } from '../../context/AuthContext';

const getCoupons = (t) => [
  {
    id: 'PICHAPIE',
    title: t('coupons.shakeys_offer', "500 off in Shakey's Pizza"),
    titleKey: 'coupons.shakeys_offer',
    amount: 500,
    minSpend: 1000,
    expires: t('coupons.expires_jan_2026', '31 Jan 2026'),
    expiresKey: 'coupons.expires_jan_2026',
    terms: t('coupons.terms_new_users', 'Terms valid for new users only. One-time use.'),
    termsKey: 'coupons.terms_new_users',
  },
  {
    id: 'PICHAPIE-2',
    title: t('coupons.shakeys_offer', "500 off in Shakey's Pizza"),
    titleKey: 'coupons.shakeys_offer',
    amount: 500,
    minSpend: 1000,
    expires: t('coupons.expires_jan_2026', '31 Jan 2026'),
    expiresKey: 'coupons.expires_jan_2026',
    terms: t('coupons.terms_new_users', 'Terms valid for new users only. One-time use.'),
    termsKey: 'coupons.terms_new_users',
  },
  {
    id: 'PICHAPIE-3',
    title: t('coupons.shakeys_offer', "500 off in Shakey's Pizza"),
    titleKey: 'coupons.shakeys_offer',
    amount: 500,
    minSpend: 1000,
    expires: t('coupons.expires_jan_2026', '31 Jan 2026'),
    expiresKey: 'coupons.expires_jan_2026',
    terms: t('coupons.terms_new_users', 'Terms valid for new users only. One-time use.'),
    termsKey: 'coupons.terms_new_users',
  },
  {
    id: 'PICHAPIE-4',
    title: t('coupons.shakeys_offer', "500 off in Shakey's Pizza"),
    titleKey: 'coupons.shakeys_offer',
    amount: 500,
    minSpend: 1000,
    expires: t('coupons.expires_jan_2026', '31 Jan 2026'),
    expiresKey: 'coupons.expires_jan_2026',
    terms: t('coupons.terms_new_users', 'Terms valid for new users only. One-time use.'),
    termsKey: 'coupons.terms_new_users',
  },
  {
    id: 'PICHAPIE-5',
    title: t('coupons.shakeys_offer', "500 off in Shakey's Pizza"),
    titleKey: 'coupons.shakeys_offer',
    amount: 500,
    minSpend: 1000,
    expires: t('coupons.expires_jan_2026', '31 Jan 2026'),
    expiresKey: 'coupons.expires_jan_2026',
    terms: t('coupons.terms_new_users', 'Terms valid for new users only. One-time use.'),
    termsKey: 'coupons.terms_new_users',
  },
];

export default function Coupons() {
  const { t } = useTranslation();
  const { currencySymbol } = useAuth();
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  const COUPONS = useMemo(() => getCoupons(t), [t]);

  const list = useMemo(() => {
    if (!query.trim()) return COUPONS;
    const q = query.toLowerCase();
    return COUPONS.filter(c =>
      [c.id, c.title, c.terms].some(v => v.toLowerCase().includes(q)),
    );
  }, [query, COUPONS]);

  const handleUseNow = useCallback((coupon) => {
    if (!coupon) return;
    setSelectedCoupon(coupon);
  }, []);

  const handleApplyCoupon = useCallback((coupon) => {
    if (!coupon) return;
    
    // Show feedback to user
    Toast.show({
      type: 'success',
      text1: t('coupons.copied', 'Promo code copied!'),
      text2: `${coupon.id} ${t('coupons.is_ready', 'is ready to use')}`,
      position: 'bottom',
    });

    // Close the modal
    setSelectedCoupon(null);
    
    // Optional: Navigate to Home/Cart if needed
    // navigation.navigate('MainTabs', { screen: 'Home' });
  }, [t]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={20} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('coupons.title', 'Coupons')}</Text>
      </View>

      <View style={styles.searchWrap}>
        <Search size={16} color="#B9B9B9" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('coupons.search_placeholder', 'Search Coupon...')}
          placeholderTextColor="#B9B9B9"
          style={styles.searchInput}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {list.map(item => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardContent}>
              <View style={styles.cardLeft}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.amountText}>{currencySymbol}{item.amount.toFixed(2)}</Text>

                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>
                    {t('coupons.min_spend', 'Min spend')} {currencySymbol}{item.minSpend.toFixed(2)}
                  </Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.metaText}>
                    {t('coupons.use_by', 'Use by')} {item.expires}
                  </Text>
                </View>

                <View style={styles.codeRow}>
                  <Text style={styles.codeText}>{item.id}</Text>
                  <Pressable
                    style={styles.useBtn}
                    onPress={() => handleUseNow(item)}
                    android_ripple={{ color: '#FF4444', borderless: false }}
                  >
                    <Text style={styles.useBtnText}>{t('coupons.use_now', 'Use Now')}</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.cardRight}>
                <Text style={styles.percent}>%</Text>
              </View>
            </View>

            {/* Light Blue Terms Banner */}
            <View style={styles.termsBanner}>
              <Text style={styles.termsText}>
                {t('coupons.terms_header', 'Terms:')} {item.terms}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <CouponDetailsDrawer
        visible={!!selectedCoupon}
        coupon={selectedCoupon}
        onClose={() => setSelectedCoupon(null)}
        onUseNow={handleApplyCoupon}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },

  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  headerTitle: { 
    flex: 1, 
    textAlign: 'center', 
    fontSize: 18, 
    fontWeight: '800',
    color: '#111',
    marginRight: 40, // To center title properly offsetting the back button
  },

  searchWrap: {
    margin: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  searchInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: 12,
    color: '#111',
  },

  scroll: { paddingHorizontal: 12, paddingBottom: 16 },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
  },
  cardContent: {
    padding: 12,
    flexDirection: 'row',
  },
  cardLeft: { flex: 1, paddingRight: 8 },
  cardTitle: { fontSize: 13, color: '#222', fontWeight: '700' },
  amountText: { marginTop: 4, fontSize: 20, fontWeight: '800', color: '#111' },
  metaRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 10, color: '#8C8C8C' },
  metaDot: { marginHorizontal: 6, color: '#BDBDBD' },

  codeRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: 'dashed',
    borderColor: '#CCC',
    padding: 6,
    backgroundColor: '#F9F9F9',
  },
  codeText: {
    fontSize: 11,
    color: '#444',
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    letterSpacing: 0.8,
  },
  useBtn: {
    backgroundColor: '#E53935',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
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
    color: '#1976D2', // Darker Blue for text
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
    color: '#F0F0F0',
    fontWeight: '800',
  },
});