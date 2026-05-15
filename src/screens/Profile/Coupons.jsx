import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Search } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import CouponDetailsDrawer from '../../components/CouponDetailsDrawer';
import { useAuth } from '../../context/AuthContext';
import { getCoupons as fetchCouponsFromApi } from '../../services/couponService';


export default function Coupons() {
  const { t } = useTranslation();
  const { currencySymbol } = useAuth();
  const navigation = useNavigation();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchCouponsFromApi();
      const promoList = Array.isArray(data) ? data : data?.promocodes || [];
      setCoupons(promoList);
      setError(null);
    } catch (err) {
      console.error('Error fetching coupons:', err);
      setError('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const list = useMemo(() => {
    if (!query.trim()) return coupons;
    const q = query.toLowerCase();
    return coupons.filter(c => {
      const code = (c.code || c.id || '').toLowerCase();
      const title = (c.title || '').toLowerCase();
      const description = (c.description || c.terms || '').toLowerCase();
      return code.includes(q) || title.includes(q) || description.includes(q);
    });
  }, [query, coupons]);

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
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#E53935" />
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchCoupons}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : list.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>{t('favourite.no_dishes', 'No coupons yet')}</Text>
          </View>
        ) : (
          list.map(item => (
            <View key={item._id || item.id} style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.cardLeft}>
                  <Text style={styles.cardTitle}>{item.title || item.code}</Text>
                  <Text style={styles.amountText}>
                    {item.discountType === 'percentage' 
                      ? `${item.discountValue}% OFF` 
                      : `${currencySymbol}${item.discountValue || item.amount}`}
                  </Text>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>
                      {t('coupons.min_spend', 'Min spend')} {currencySymbol}{item.minOrderValue || item.minSpend || 0}
                    </Text>
                    {item.expirationDate && (
                      <>
                        <Text style={styles.metaDot}>•</Text>
                        <Text style={styles.metaText}>
                          {t('coupons.use_by', 'Use by')} {new Date(item.expirationDate).toLocaleDateString()}
                        </Text>
                      </>
                    )}
                  </View>

                  <View style={styles.codeRow}>
                    <Text style={styles.codeText}>{item.code || item.id}</Text>
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
                  {t('coupons.terms_header', 'Terms:')} {item.description || item.terms || 'T&C Apply'}
                </Text>
              </View>
            </View>
          ))
        )}
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
    textAlign: 'center',
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
  centerBox: {
    paddingVertical: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 12,
    backgroundColor: '#E53935',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFF',
    fontWeight: '700',
  },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, color: '#999', textAlign: 'center' },
});