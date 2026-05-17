import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  BackHandler,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Image, Platform } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const RATINGS = [5, 4, 3, 2, 1];

const getDeliveryTimes = (t) => [
  { label: t('filter.fastest', 'Fastest'), value: 'fastest' },
  { label: t('filter.within_15_min', 'Within 15 min'), value: '15' },
  { label: t('filter.within_30_min', 'Within 30 min'), value: '30' },
];

const getCuisines = (t) => [
  t('filter.indian', 'Indian'),
  t('filter.chinese', 'Chinese'),
  t('filter.italian', 'Italian'),
  t('filter.burger', 'Burger'),
  t('filter.pizza', 'Pizza'),
  t('filter.mexican', 'Mexican'),
  t('filter.thai', 'Thai'),
  t('filter.continental', 'Continental'),
];

const getDietary = (t) => [
  t('filter.vegetarian', 'Vegetarian'),
  t('filter.vegan', 'Vegan'),
  t('filter.halal', 'Halal'),
];

const PRICE_MIN = 50;
const PRICE_MAX = 800;

export default function FilterBottomSheet({
  visible,
  onClose,
  onApply,
  initialFilters,
}) {
  const { t } = useTranslation();
  const { currencySymbol } = useAuth();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = React.useState(false);

  const DELIVERY_TIMES = getDeliveryTimes(t);
  const CUISINES = getCuisines(t);
  const DIETARY = getDietary(t);

  const [rating, setRating] = useState(initialFilters?.rating || null);
  const [deliveryTime, setDeliveryTime] = useState(
    initialFilters?.deliveryTime || null,
  );
  const [cuisines, setCuisines] = useState(initialFilters?.cuisines || []);
  const [dietary, setDietary] = useState(initialFilters?.dietary || []);
  const [price, setPrice] = useState(
    initialFilters?.price || { min: PRICE_MIN, max: PRICE_MAX },
  );

  useEffect(() => {
    if (!visible) {
      setShouldRender(false);
      return undefined;
    }

    // Reset to initial position
    overlayOpacity.setValue(0);
    translateY.setValue(SCREEN_HEIGHT);
    
    // Wait for next frame before rendering and animating
    requestAnimationFrame(() => {
      setShouldRender(true);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(overlayOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            stiffness: 220,
            damping: 28,
            mass: 0.9,
            useNativeDriver: true,
          }),
        ]).start();
      });
    });

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true,
    );
    return () => backHandler.remove();
  }, [visible, overlayOpacity, translateY]);

  const clearAll = () => {
    setRating(null);
    setDeliveryTime(null);
    setCuisines([]);
    setDietary([]);
    setPrice({ min: PRICE_MIN, max: PRICE_MAX });
  };

  const toggleCuisine = cuisine => {
    setCuisines(prev =>
      prev.includes(cuisine)
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine],
    );
  };

  const toggleDietary = option => {
    setDietary(prev =>
      prev.includes(option)
        ? prev.filter(o => o !== option)
        : [...prev, option],
    );
  };

  const handleApply = () => {
    onApply({ rating, deliveryTime, cuisines, dietary, price });
    onClose();
  };

  if (!shouldRender) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Animated.View style={[styles.dimArea, { opacity: overlayOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <SafeAreaView style={{flex:1}} edges={['top','bottom']}>
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.headerBack} hitSlop={10}>
                <Image 
                  source={require('../assets/icons/Backarrow.png')} 
                  style={styles.backIconImage} 
                />
              </TouchableOpacity>
              <Text style={styles.title}>{t('filter.title', 'Filters')}</Text>
              <TouchableOpacity onPress={clearAll} hitSlop={15} style={styles.clearAllPressable}>
                <Text style={styles.clearAll}>{t('filter.reset', 'Reset')}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionTitle}>{t('filter.rating', 'Rating')}</Text>
              <View style={styles.pillsRow}>
                {RATINGS.map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.pill, rating === r && styles.pillSelected]}
                    onPress={() => setRating(r)}
                  >
                    <Text style={styles.pillText}>{'⭐ ' + r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>{t('filter.delivery_time', 'Delivery Time')}</Text>
              <View style={styles.pillsRow}>
                {DELIVERY_TIMES.map(dt => (
                  <TouchableOpacity
                    key={dt.value}
                    style={[
                      styles.pill,
                      deliveryTime === dt.value && styles.pillSelected,
                    ]}
                    onPress={() => setDeliveryTime(dt.value)}
                  >
                    <Text style={styles.pillText}>{dt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>{t('filter.cuisines', 'Cuisines')}</Text>
              <View style={styles.chipsRow}>
                {CUISINES.map(cuisine => (
                  <TouchableOpacity
                    key={cuisine}
                    style={[
                      styles.chip,
                      cuisines.includes(cuisine) && styles.chipSelected,
                    ]}
                    onPress={() => toggleCuisine(cuisine)}
                  >
                    <Text style={styles.chipText}>{cuisine}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>{t('filter.dietary_options', 'Dietary Options')}</Text>
              <View style={styles.pillsRow}>
                {DIETARY.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.pill, dietary.includes(option) && styles.pillSelected]}
                    onPress={() => toggleDietary(option)}
                  >
                    <Text style={styles.pillText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>

            </ScrollView>
            <View style={styles.bottomBar}>
              <TouchableOpacity style={styles.showBtn} onPress={handleApply}>
                <Text style={styles.showBtnText}>{t('filter.show_results', 'Show Results')}</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dimArea: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
    minHeight: 520,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F2',
  },
  backIconImage: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
    tintColor: '#111111',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
  },
  clearAllPressable: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearAll: {
    color: '#ed1c24',
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 18,
    marginBottom: 8,
    color: '#222',
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  pill: {
    backgroundColor: '#f5f5f5',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  pillSelected: {
    backgroundColor: '#E23744',
    borderColor: '#E23744',
  },
  pillText: {
    color: '#222',
    fontWeight: 'bold',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  chip: {
    backgroundColor: '#f5f5f5',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  chipSelected: {
    backgroundColor: '#E23744',
    borderColor: '#E23744',
  },
  chipText: {
    color: '#222',
    fontWeight: 'bold',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 8,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#888',
    width: 48,
    textAlign: 'center',
  },
  bottomBar: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  showBtn: {
    backgroundColor: '#E23744',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E23744',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  showBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5,
  },
});