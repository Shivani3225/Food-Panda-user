import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import useHideTabBar from '../../utils/hooks/useHideTabBar';

const getFaqData = (t) => [
  {
    id: '1',
    title: t('faq.place_order_title', 'How do I place an order?'),
    open: true,
    desc: t('faq.place_order_desc', 'You can browse the menu, add items to your cart, and proceed to checkout. Select your location and preferred payment method to confirm the order.'),
  },
  {
    id: '2',
    title: t('faq.track_order_title', 'How can I track my order?'),
    open: true,
    desc: t('faq.track_order_desc', 'After placing your order, go to the Orders section to view real-time updates on your delivery status and estimated arrival time.'),
  },
  {
    id: '3',
    title: t('faq.cancel_order_title', 'Can I change or cancel my order after placing it?'),
    open: true,
    desc: t('faq.cancel_order_desc', 'Order changes or cancellations depend on the restaurant’s policy and the order status. Please contact customer support as soon as possible for assistance.'),
  },
  {
    id: '4',
    title: t('faq.apply_coupon_title', 'How do I apply a coupon code?'),
    open: true,
    desc: t('faq.apply_coupon_desc', 'You can enter your coupon code at checkout in the promo code section before completing your payment.'),
  },
  {
    id: '5',
    title: t('faq.track_order2_title', 'How can I track my order?'),
    open: true,
    desc: t('faq.track_order2_desc', 'Track your order in the Orders section. You will see updates on preparation, pickup, and delivery in real time.'),
  },
  {
    id: '6',
    title: t('faq.order_status_title', 'How can I check my order status?'),
    open: true,
    desc: t('faq.order_status_desc', 'You can always check the status of your order in the Orders tab. Notifications will also keep you updated.'),
  },
];

export default function FaqScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  useHideTabBar(navigation);
  const [searchQuery, setSearchQuery] = useState('');
  
  const faqData = useMemo(() => getFaqData(t), [t]);
  
  const [faqs, setFaqs] = useState(faqData);

  // Update faqs when language changes
  React.useEffect(() => {
    setFaqs(getFaqData(t));
  }, [t]);

  const toggle = id => {
    setFaqs(prev =>
      prev.map(item => (item.id === id ? { ...item, open: !item.open } : item)),
    );
  };

  // Filter FAQs based on search query
  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return faqs;
    const query = searchQuery.toLowerCase().trim();
    return faqs.filter(item => 
      item.title.toLowerCase().includes(query) || 
      item.desc.toLowerCase().includes(query)
    );
  }, [faqs, searchQuery]);

  const renderItem = ({ item }) => {
    return (
      <View style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.row}
          onPress={() => toggle(item.id)}
        >
          <Text style={styles.question}>{item.title}</Text>
          <Image
            source={
              item.open
                ? require('../../assets/icons/close.png')
                : require('../../assets/icons/plus.png')
            }
            style={styles.icon}
          />
        </TouchableOpacity>

        {item.open && <Text style={styles.answer}>{item.desc}</Text>}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={require('../../assets/icons/Backarrow.png')}
            style={styles.back}
          />
        </TouchableOpacity>
        <Text style={styles.title}>{t('faq.title', "Faq's")}</Text>
      </View>

      {/* SUBTITLE */}
      <Text style={styles.subtitle}>
        {t('faq.subtitle', 'Find quick answers to common questions about orders, payments, delivery, and more.')}
      </Text>

      {/* SEARCH */}
      <View style={styles.searchBox}>
        <Image
          source={require('../../assets/icons/search.png')}
          style={styles.searchIcon}
        />
        <TextInput
          placeholder={t('faq.search_placeholder', 'Search ...')}
          placeholderTextColor="#A1A1A1"
          style={styles.input}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* FAQ LIST */}
      <FlatList
        data={filteredFaqs}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {t('faq.no_results', 'No results found')}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 12,
  },

  back: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },

  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 110,
  },

  subtitle: {
    fontSize: 20,
    marginTop: 4,
    marginBottom: 16,
  },

  searchBox: {
    width: '100%',
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E4E4E4',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 16,
  },

  searchIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
    marginRight: 8,
  },

  input: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },

  list: {
    paddingBottom: 30,
  },

  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  question: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    width: '85%',
  },

  icon: {
    width: 14,
    height: 14,
    resizeMode: 'contain',
  },

  answer: {
    fontSize: 12,
    color: '#7A7A7A',
    lineHeight: 18,
    marginTop: 10,
  },

  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});