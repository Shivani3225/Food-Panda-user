import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { RotateCcw, Gift, ShoppingBag, Repeat } from 'lucide-react-native';
import LogoIcon from '../assets/icons/LogoIcon.svg';

export default function WasPayRewards() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container} edges={['top']}> 
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Logo */}
      <LogoIcon width={120} height={40} style={styles.logo} />

      {/* Card */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t('rewards.title', 'Pay and earn rewards with')}</Text>

          <Image
            source={{ uri: 'https://via.placeholder.com/80x80' }}
            style={styles.giftImg}
          />
        </View>

        <Text style={styles.subTitle}>{t('rewards.wallet_active', 'Your wallet is now active')}</Text>

        {/* Feature 1 */}
        <View style={styles.item}>
          <RotateCcw size={22} color="#E53935" />
          <View style={styles.itemText}>
            <Text style={styles.itemTitle}>{t('rewards.refund_instant', 'Receive refunds instantly')}</Text>
            <Text style={styles.itemDesc}>
              {t('rewards.refund_desc', 'Banks take up to 45 days to process your refund but pandapay only takes seconds! See your refund in your balance instantly.')}
            </Text>
          </View>
        </View>

        {/* Feature 2 */}
        <View style={styles.item}>
          <Gift size={22} color="#E53935" />
          <View style={styles.itemText}>
            <Text style={styles.itemTitle}>{t('rewards.cashback', 'Earn cashback for your orders')}</Text>
            <Text style={styles.itemDesc}>
              {t('rewards.cashback_desc', 'When you pay with pandapay, you can enjoy cashbacks and discounts in your balance on exclusive promotions.')}
            </Text>
          </View>
        </View>

        {/* Feature 3 */}
        <View style={styles.item}>
          <ShoppingBag size={22} color="#E53935" />
          <View style={styles.itemText}>
            <Text style={styles.itemTitle}>{t('rewards.one_click', 'One-click checkout')}</Text>
            <Text style={styles.itemDesc}>
              {t('rewards.one_click_desc', 'Use your pandapay balance with ease and convenience to pay for orders across food delivery, pick-up and shops.')}
            </Text>
          </View>
        </View>

        {/* Feature 4 */}
        <View style={styles.item}>
          <Repeat size={22} color="#E53935" />
          <View style={styles.itemText}>
            <Text style={styles.itemTitle}>{t('rewards.transfer_refunds', 'Transfer your refunds')}</Text>
            <Text style={styles.itemDesc}>
              {t('rewards.transfer_refunds_desc', 'Read our pandapay Terms and conditions')}
            </Text>
          </View>
        </View>

        {/* Button */}
        <TouchableOpacity style={styles.btn}>
          <Text style={styles.btnText}>{t('rewards.explore', 'Explore Waspay')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  logo: {
    width: 120,
    height: 40,
    alignSelf: 'center',
    marginVertical: 20,
  },
  card: {
    backgroundColor: '#F3F6F7',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  giftImg: {
    width: 70,
    height: 70,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    width: '65%',
  },
  subTitle: {
    fontSize: 13,
    color: '#777',
    marginTop: 6,
    marginBottom: 16,
  },
  item: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  itemText: {
    marginLeft: 12,
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
  },
  itemDesc: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
    lineHeight: 16,
  },
  btn: {
    backgroundColor: '#E53935',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  btnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});