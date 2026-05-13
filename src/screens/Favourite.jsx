import React, { useContext, useMemo, useCallback, memo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Heart, Star, MapPin, Clock, Plus } from 'lucide-react-native';

import { FavouritesContext } from '../context/FavouritesContext';
import { CartContext } from '../context/CartContext';
import { toNumber } from '../services/cartPricing';
import { useAuth } from '../context/AuthContext';

import { SafeAreaView } from 'react-native-safe-area-context';
import { hp, wp } from '../utils/responsive';
import { scale } from '../utils/scale';
import { RestaurantListCard } from '../components/Home/RestaurantCard';

const FALLBACK_IMG = require('../assets/images/Food.png');

function imgSource(uri) {
  // Handle local resource IDs (from require)
  if (typeof uri === 'number') return uri;

  // Handle already formatted object sources
  if (typeof uri === 'object' && uri?.uri) return uri;

  if (typeof uri === 'string' && uri.trim().length > 0) {
    const trimmed = uri.trim();
    // Force fallback if path contains '/uploads/' (currently broken on backend)
    if (trimmed.includes('/uploads/')) {
      return FALLBACK_IMG;
    }
    // Check if it's a full URL or needs base URL
    if (trimmed.startsWith('http')) {
      return { uri: trimmed };
    }
    // If it's a relative path, we'd need baseUrl here, but for now fallback is safer
    return FALLBACK_IMG;
  }

  return FALLBACK_IMG;
}

function getLocalizedText(value, t) {
  if (!value) return '';
  if (typeof value === 'object') {
    return value.en || value.de || value.ar || '';
  }
  return String(value);
}

// Redesigned Restaurant Card Component
const RestaurantCard = memo(({
  restaurant,
  onPress,
  onToggleFavourite,
  t
}) => {
  const [imgSrc, setImgSrc] = useState(imgSource(restaurant.image));
  const restaurantName = getLocalizedText(restaurant.name, t);
  const cuisines = Array.isArray(restaurant.cuisines)
    ? restaurant.cuisines.join(', ')
    : (restaurant.cuisine || '');

  return (
    <TouchableOpacity
      style={styles.newRestCard}
      activeOpacity={0.95}
      onPress={onPress}
    >
      <View style={styles.cardImageContainer}>
        <Image
          source={imgSrc}
          style={styles.newRestImg}
          onError={() => setImgSrc(FALLBACK_IMG)}
        />
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.heartOverlay}
          onPress={(e) => {
            e.stopPropagation();
            onToggleFavourite();
          }}
        >
          <Heart size={20} color="#FF3D3D" fill="#FF3D3D" />
        </TouchableOpacity>

        {/* Pagination Dots Dummy */}
        <View style={styles.dotsContainer}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>

      <View style={styles.cardInfo}>
        <View style={styles.nameRow}>
          <Text numberOfLines={1} style={styles.newName}>{restaurantName}</Text>
          <View style={styles.ratingBox}>
            <Star size={14} color="#FF9500" fill="#FF9500" />
            <Text style={styles.ratingText}>
              {restaurant.ratingAverage || '5.0'}
              <Text style={styles.ratingCount}> ({restaurant.ratingCount || '1.2k'})</Text>
            </Text>
          </View>
        </View>

        <Text numberOfLines={1} style={styles.newCuisines}>{cuisines || 'Fast Food, Italian'}</Text>

        <View style={styles.detailsRow}>
          <Text style={styles.detailText}>{restaurant.distance || '1.2 km'} away</Text>
          <View style={styles.dotSeparator} />
          <Text style={styles.detailText}>{restaurant.deliveryTime || '20-30'} minutes</Text>
        </View>

        <View style={styles.bestSellerTag}>
          <Text style={styles.bestSellerText}>
            Best Seller: <Text style={{ fontWeight: '600' }}>{restaurant.bestSeller || 'Cheese Burst Pizza'}</Text>
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// Item Card Component (Horizontal design as per mockup)
const DishCard = memo(({
  item,
  onPress,
  onToggleFavourite,
  onAddToCart,
  t,
  currencySymbol
}) => {
  const [imgSrc, setImgSrc] = useState(imgSource(item.image));
  const itemName = getLocalizedText(item.name, t);
  const itemDesc = getLocalizedText(item.description, t);

  return (
    <TouchableOpacity
      style={styles.dishCard}
      activeOpacity={0.95}
      onPress={onPress}
    >
      <View style={styles.dishImageContainer}>
        <Image
          source={imgSrc}
          style={styles.dishImg}
          onError={() => setImgSrc(FALLBACK_IMG)}
        />
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.dishHeartOverlay}
          onPress={(e) => {
            e.stopPropagation();
            onToggleFavourite();
          }}
        >
          <Heart size={16} color="#FF3D3D" fill="#FF3D3D" />
        </TouchableOpacity>
      </View>

      <View style={styles.dishInfo}>
        <Text style={styles.dishPrice}>{currencySymbol}{toNumber(item.price, 0).toFixed(2)}</Text>
        <Text numberOfLines={1} style={styles.dishName}>{itemName}</Text>
        <Text numberOfLines={2} style={styles.dishDesc}>{itemDesc || 'Delicious dish prepared with fresh ingredients'}</Text>

        <View style={styles.reorderedTag}>
          <Text style={styles.reorderedText}>Highly Reordered</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.addDishBtn} activeOpacity={0.7} onPress={onAddToCart}>
        <Plus size={20} color="#000" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

export default function Favourite() {
  const { t } = useTranslation();
  const { currencySymbol } = useAuth();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('Restaurant');

  const { favourites, favouritesCount, toggleFavourite, isLoading } =
    useContext(FavouritesContext);
    
  const { addToCart } = useContext(CartContext);

  const { restaurants, products } = useMemo(() => {
    const res = [];
    const prod = [];
    (Array.isArray(favourites) ? favourites : []).forEach(f => {
      if (f.type === 'restaurant') {
        const dist = f.distance || '1.2';
        const time = f.deliveryTime || '20-30';

        res.push({
          ...f,
          // Process image through imgSource to handle 404s and broken paths
          bannerImage: imgSource(f.bannerImage || f.image),
          ratingAverage: f.ratingAverage || 5.0,
          ratingCount: f.ratingCount || 0,
          deliveryTime: `🕒 ${time} min  •  📍 ${dist} km`,
          cuisines: f.cuisines || ['Pizza', 'Italian'],
        });
      }
      else prod.push(f);
    });
    return { restaurants: res, products: prod };
  }, [favourites]);

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleGoBack}>
          <ArrowLeft size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('favourite.title', 'Favourites')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Restaurant' && styles.activeTab]}
          onPress={() => setActiveTab('Restaurant')}
        >
          <Text style={[styles.tabText, activeTab === 'Restaurant' && styles.activeTabText]}>
            {t('favourite.restaurant_tab', 'Restaurant')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Dishes' && styles.activeTab]}
          onPress={() => setActiveTab('Dishes')}
        >
          <Text style={[styles.tabText, activeTab === 'Dishes' && styles.activeTabText]}>
            {t('favourite.dishes_tab', 'Dishes')}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#FF3D3D" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {activeTab === 'Restaurant' ? (
            restaurants.length > 0 ? (
              restaurants.map(r => (
                <RestaurantListCard
                  key={r.id}
                  item={r}
                  isFavorite={true}
                  onFavoritePress={() => toggleFavourite(r)}
                  onPress={() => navigation.navigate('RestaurantDetail', { restaurant: r })}
                />
              ))
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>{t('favourite.no_restaurants', 'No favourite restaurants yet')}</Text>
              </View>
            )
          ) : (
            products.length > 0 ? (
              products.map(p => (
                <DishCard
                  key={p.id}
                  item={p}
                  t={t}
                  currencySymbol={currencySymbol}
                  onToggleFavourite={() => toggleFavourite(p)}
                  onAddToCart={() => addToCart(p)}
                  onPress={() => {
                    navigation.navigate('RestaurantDetail', {
                      restaurant: {
                        id: p.restaurantId,
                        _id: p.restaurantId,
                        name: p.restaurantName || t('restaurant.default_name', 'Restaurant'),
                      }
                    });
                  }}
                />
              ))
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>{t('favourite.no_dishes', 'No favourite dishes yet')}</Text>
              </View>
            )
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF' },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
  },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000' },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FF3D3D',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#000',
    fontWeight: '700',
  },

  scrollContent: { paddingVertical: 16, paddingBottom: 40 },

  // New Design Cards
  newRestCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    // Subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardImageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  newRestImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heartOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    width: 20,
    backgroundColor: '#FFF',
  },

  cardInfo: {
    padding: 16,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  newName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
    flex: 1,
    marginRight: 8,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  ratingCount: {
    fontSize: 13,
    fontWeight: '400',
    color: '#666',
  },
  newCuisines: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CCC',
    marginHorizontal: 8,
  },
  bestSellerTag: {
    marginTop: 8,
    backgroundColor: '#FDEEEE',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  bestSellerText: {
    fontSize: 12,
    color: '#5B3B3B',
    fontWeight: '600',
  },
  dishPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    marginBottom: 4,
  },

  // Dishes Tab Styles (Mockup 2)
  dishCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
  },
  dishImageContainer: {
    width: wp(28),
    height: wp(28),
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F9F9F9',
  },
  dishImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  dishHeartOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  dishInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  dishName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  dishDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  reorderedTag: {
    backgroundColor: '#FFF1F1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  reorderedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF4C4C',
  },
  addDishBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, color: '#999', textAlign: 'center' },
});
