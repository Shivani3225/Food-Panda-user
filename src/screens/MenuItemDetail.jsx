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

export default function MenuItemDetail() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { menuItem, restaurant } = route.params || {};
  const [qty, setQty] = useState(1);
  const { addToCart } = useContext(CartContext);

  if (!menuItem) return null;

  // Get translated name if nameKey exists
  const itemName = menuItem?.nameKey 
    ? t(menuItem.nameKey, menuItem.name)
    : menuItem?.name || t('menu_item.default_name', 'Menu Item');

  // Get translated description if descriptionKey exists
  const itemDescription = menuItem?.descriptionKey 
    ? t(menuItem.descriptionKey, menuItem.description)
    : menuItem?.description || '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TouchableOpacity
        style={styles.close}
        onPress={() => navigation.goBack()}
      >
        <X size={22} color="#555" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <Image source={{ uri: menuItem.image }} style={styles.image} />
        <Text style={styles.title}>{itemName}</Text>
        <Text style={styles.price}>₱ {menuItem.price}</Text>
        {itemDescription && (
          <Text style={styles.desc}>{itemDescription}</Text>
        )}
      </ScrollView>

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
            addToCart({ ...menuItem, qty, restaurantId: restaurant?.id });
            navigation.navigate('Address', { item: menuItem, qty });
          }}
        >
          <Text style={styles.addText}>{t('menu_item.add_to_cart', 'Add to Cart')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  close: { position: 'absolute', top: 40, right: 16, zIndex: 10, padding: 8 },
  image: { width: '100%', height: 300 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E53935',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  desc: { fontSize: 14, color: '#666', paddingHorizontal: 16, marginTop: 8 },
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
  qtyBtn: { fontSize: 20, width: 24, textAlign: 'center' },
  qty: { marginHorizontal: 12, fontWeight: '700', fontSize: 16 },
  addBtn: {
    flex: 1,
    backgroundColor: '#E53935',
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  addText: { color: '#FFF', fontWeight: '700' },
});