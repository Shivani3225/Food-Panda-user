import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity, // Keep TouchableOpacity for the cards
  Image,
} from 'react-native';
import { hp, wp } from '../../utils/responsive';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { Clock } from 'lucide-react-native';
import { FONT_SIZES as FONT } from '../../theme/typography';

export default function PickupScreen() {
  const { t } = useTranslation(); // Initialize useTranslation

  // dummy data (replace with API later)
  const restaurants = [
    {
      id: '1',
      nameKey: 'pickup.pizza_hut',
      name: 'Pizza Hut',
      addressKey: 'pickup.city_mall_address',
      address: 'Near City Mall',
      lat: 37.78825,
      lng: -122.4324,
      timeValue: '20-25',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591',
    },
    {
      id: '2',
      nameKey: 'pickup.burger_king',
      name: 'Burger King',
      addressKey: 'pickup.main_market_address',
      address: 'Main Market Street',
      lat: 37.78925,
      lng: -122.4224,
      timeValue: '15-20',
      image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add',
    },
  ];

  return (
    <View style={styles.container}>
      {/* 📍 Nearby Title */}
      <Text style={styles.sectionTitle}>{t('home.nearby_restaurants', 'Nearby Restaurants')}</Text>

      {/* 🍔 List */}
      <View>
        {restaurants.map((item) => (
          <TouchableOpacity key={item.id} style={styles.card}>
            <View style={styles.cardLeft}>
              <Image 
                source={{ uri: item.image }} 
                style={styles.restaurantImage}
                defaultSource={require('../../assets/images/Food.png')}
              />
            </View>

            <View style={styles.cardRight}>
              <Text style={styles.name}>{t(item.nameKey, item.name)}</Text>
              <Text style={styles.address}>{t(item.addressKey, item.address)}</Text>
              <View style={styles.timeRow}>
                <Clock size={14} color="#ed1c24" />
                <Text style={styles.time}>{item.timeValue} {t('home.mins', 'mins')}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  sectionTitle: {
    fontSize: FONT.lg,
    fontWeight: '700',
    marginHorizontal: wp(4),
    marginBottom: hp(1),
    marginTop: hp(2),
  },

  card: {
    flexDirection: 'row',
    marginHorizontal: wp(4),
    marginBottom: hp(1.5),
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: wp(3),
    elevation: 3,
  },

  cardLeft: {
    marginRight: wp(3),
  },

  restaurantImage: {
    width: wp(18),
    height: wp(18),
    borderRadius: 12,
  },

  cardRight: {
    flex: 1,
    justifyContent: 'center',
  },

  name: {
    fontSize: FONT.md,
    fontWeight: '600',
  },

  address: {
    fontSize: FONT.sm,
    color: '#777',
    marginTop: hp(0.3),
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(0.5),
  },
  time: {
    fontSize: FONT.sm,
    color: '#ed1c24',
    marginLeft: 4,
    fontWeight: '500',
  },
});