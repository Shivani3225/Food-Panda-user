import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { CartContext } from '../context/CartContext';

export default function ProductDetail() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { item } = route.params || {};

  const [qty, setQty] = useState(1);
  const { addToCart } = useContext(CartContext);
  const ratingValue = typeof item?.rating === 'number'
    ? item.rating
    : (item?.rating?.average ?? 0);
  const reviewsCount = typeof item?.rating?.count === 'number'
    ? item.rating.count
    : (item?.reviews ?? 0);

  if (!item) return null;

  // Get translated name if nameKey exists
  const itemName = item?.nameKey 
    ? t(item.nameKey, item.name)
    : item?.name || t('product.default_name', 'Product');

  // Get translated description if descriptionKey exists
  const itemDescription = item?.descriptionKey 
    ? t(item.descriptionKey, item.description)
    : item?.description || '';

  // Get translated cuisines if they have translation keys
  const getCuisinesText = () => {
    if (!item?.cuisines || item.cuisines.length === 0) {
      return '';
    }
    const translatedCuisines = item.cuisines.map(cuisine => {
      if (typeof cuisine === 'string') {
        const cuisineKey = `categories.${cuisine.toLowerCase()}`;
        return t(cuisineKey, cuisine);
      }
      return cuisine;
    });
    return translatedCuisines.join(' • ');
  };

  const cuisinesText = getCuisinesText();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* CLOSE BUTTON */}
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => navigation.goBack()}
      >
        <X size={24} color="#555" />
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* IMAGE */}
        <Image
          source={{ uri: item.image }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* TITLE */}
        <Text style={styles.title}>{itemName}</Text>

        {/* RATING */}
        <Text style={styles.rating}>
          ⭐ {ratingValue} ({reviewsCount})
        </Text>

        {/* CUISINES */}
        {cuisinesText ? (
          <Text style={styles.desc}>{cuisinesText}</Text>
        ) : null}

        <View style={styles.divider} />

        {/* DESCRIPTION (optional, if item has more info) */}
        {itemDescription && (
          <Text style={styles.desc}>{itemDescription}</Text>
        )}
      </ScrollView>

      {/* BOTTOM BAR */}
      <View style={styles.bottomBar}>
        <View style={styles.qtyBox}>
          <TouchableOpacity onPress={() => qty > 1 && setQty(qty - 1)}>
            <Text style={styles.qtyBtn}>−</Text>
          </TouchableOpacity>

          <Text style={styles.qty}>{qty}</Text>

          <TouchableOpacity onPress={() => setQty(qty + 1)}>
            <Text style={styles.qtyBtn}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            addToCart({ ...item, qty });
            navigation.navigate('Address', { item, qty });
          }}
        >
          <Text style={styles.addText}>{t('product.add_to_cart', 'Add to Cart')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  closeBtn: {
    position: 'absolute',
    top: 40,
    right: 16,
    zIndex: 10,
    backgroundColor: '#EEE',
    borderRadius: 20,
    padding: 8,
  },
  image: {
    width: '100%',
    height: 300,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginTop: 8,
    color: '#E53935',
  },
  desc: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 16,
    marginHorizontal: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#EEE',
    backgroundColor: '#FFF',
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
  },
  qtyBtn: {
    fontSize: 20,
    width: 24,
    textAlign: 'center',
  },
  qty: {
    marginHorizontal: 12,
    fontWeight: '700',
    fontSize: 16,
  },
  addBtn: {
    flex: 1,
    backgroundColor: '#E53935',
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  addText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
});