import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Minus, Plus, ShoppingCart } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const AddToCart = () => {
  const { t } = useTranslation();
  const { currencySymbol } = useAuth();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <ArrowLeft size={22} />
            <Text style={styles.headerTitle}>{t('add_to_cart.title', 'Add to Cart')}</Text>
          </View>

          {/* Food Info */}
          <View style={styles.foodRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.foodTitle}>
                {t('add_to_cart.cheeseburger_meal', 'Cheeseburger w\nFries Small Meal')}
              </Text>
              <Text style={styles.foodSub}>
                {t('add_to_cart.meal_description', 'Cream Small Fries & Drink')}
              </Text>
              <Text style={styles.price}>{currencySymbol}129</Text>
            </View>

            <Image
              source={require('../assets/images/Food.png')}
              style={styles.foodImg}
              resizeMode="contain"
            />
          </View>

          {/* Choose Fries */}
          <Text style={styles.sectionTitle}>{t('add_to_cart.choose_fries', 'Choose your Fries')}</Text>

          <View style={styles.optionBox}>
            <View style={styles.optionRow}>
              <View style={[styles.checkbox, styles.checkboxActive]}>
                <View style={styles.checkboxInner} />
              </View>
              <Text style={styles.optionText}>{t('add_to_cart.regular_fries', 'Regular Fries')}</Text>
              <View style={styles.qtyBox}>
                <TouchableOpacity><Text style={styles.qtyBtnText}>−</Text></TouchableOpacity>
                <Text style={styles.qty}>1</Text>
                <TouchableOpacity><Text style={styles.qtyBtnText}>+</Text></TouchableOpacity>
              </View>
            </View>

            <View style={styles.optionRow}>
              <View style={styles.checkbox} />
              <Text style={styles.optionText}>{t('add_to_cart.curly_fries', 'Curly Fries')}</Text>
              <Text style={styles.extra}>{currencySymbol}10</Text>
            </View>

            <View style={styles.optionRow}>
              <View style={styles.checkbox} />
              <Text style={styles.optionText}>{t('add_to_cart.potato_wedges', 'Potato Wedges')}</Text>
              <Text style={styles.extra}>{currencySymbol}15</Text>
            </View>
          </View>

          {/* Special Instructions */}
          <Text style={styles.sectionTitle}>{t('add_to_cart.special_instructions', 'Special Instructions')}</Text>
          <TextInput
            placeholder={t('add_to_cart.instructions_placeholder', 'Enter your recipe')}
            style={styles.input}
            placeholderTextColor="#999"
          />

          {/* Extras */}
          <View style={styles.extraRow}>
            <View style={styles.radio} />
            <Text style={styles.optionText}>{t('add_to_cart.extra_ketchup', `Extra Ketchup (${currencySymbol}5)`)}</Text>
            <ShoppingCart size={18} />
          </View>

          <View style={styles.extraRow}>
            <View style={styles.radio} />
            <Text style={styles.optionText}>
              {t('add_to_cart.coke_fries_combo', `Regular Coke + Large Fries (${currencySymbol}30)`)}
            </Text>
            <Text style={styles.extra}>{currencySymbol}30</Text>
          </View>

          <View style={styles.extraRow}>
            <View style={styles.radio} />
            <Text style={styles.optionText}>{t('add_to_cart.corn_salad', `Corn Salad (${currencySymbol}40)`)}</Text>
            <Text style={styles.extra}>{currencySymbol}60</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <Text style={styles.total}>{currencySymbol}129</Text>
        <TouchableOpacity style={styles.cartBtn}>
          <Text style={styles.cartText}>{t('add_to_cart.add_to_cart', 'Add to Cart')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default AddToCart;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  container: {
    padding: 16,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },

  foodRow: {
    flexDirection: 'row',
    marginVertical: 10,
  },

  foodTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  foodSub: {
    fontSize: 13,
    color: '#777',
    marginVertical: 4,
  },

  price: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 5,
  },

  foodImg: {
    width: 140,
    height: 140,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 10,
  },

  optionBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 10,
  },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },

  checkboxActive: {
    borderColor: '#E41E26',
    backgroundColor: '#E41E26',
  },
  checkboxInner: {
    width: 8,
    height: 8,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#999',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  optionText: {
    flex: 1,
    fontSize: 14,
  },

  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E41E26',
  },
  qtyBtnText: {
    color: '#E41E26',
    fontSize: 18,
    fontWeight: 'bold',
  },

  qty: {
    marginHorizontal: 8,
    fontWeight: '600',
  },

  extra: {
    fontSize: 13,
    fontWeight: '600',
  },

  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    height: 45,
    paddingHorizontal: 12,
    marginBottom: 10,
  },

  extraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginVertical: 5,
  },

  bottomBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
  },

  total: {
    fontSize: 18,
    fontWeight: '700',
  },

  cartBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#E41E26',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },

  cartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});