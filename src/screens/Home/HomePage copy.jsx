import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ImageBackground,
  FlatList,
  TouchableOpacity,
  Dimensions,
  TextInput,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { foodOptions } from '../../Data/foodOptions';
import apiClient from '../../config/apiClient';
import { Heart, MapPin, Search, Star } from 'lucide-react-native';
import { CartContext } from '../../context/CartContext';
import FilterDrawer from '../../components/FilterDrawer';
import Offers from './Offers';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  
  return <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />;

 
  return (
    <View style={styles.safe}>
        <StatusBar hidden />
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* HEADER + SEARCH + TABS */}
          <ImageBackground
            source={require('../../assets/images/BgImagee.png')}
            style={styles.headerBg}
            imageStyle={styles.headerBgImage}
            resizeMode="cover"
          >
            <View style={styles.headerGlass}>
              <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                  <MapPin size={18} color="#111111" />
                  <View style={styles.addressBlock}>
                    <Text style={styles.homeLabel}>Home</Text>
                    <Text style={styles.location}>13 Amsterdam st</Text>
                  </View>
                </View>

                <View style={styles.headerRight}>
                  <TouchableOpacity
                    style={styles.avatarRing}
                    activeOpacity={0.85}
                    onPress={() => {
                      const tabNav = useNavigation.getParent?.();
                      if (tabNav?.navigate) {
                        tabNav.navigate('Profile', {
                          screen: 'ProfileHome',
                        });
                      }
                    }}
                  >
                    <Image
                      source={require('../../assets/icons/user.png')}
                      style={styles.avatarImg}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('Cart')}
                  >
                    <Image source={require('../../assets/icons/cart.png')} style={styles.headerIcon} />
                    {cartCount > 0 ? (
                      <View style={styles.cartBadge} pointerEvents="none">
                        <Text style={styles.cartBadgeText}>
                          {cartCount > 99 ? '99+' : String(cartCount)}
                        </Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    activeOpacity={0.85}
                    onPress={() => {
                      const tabNav = navigation.getParent?.();
                      if (tabNav?.navigate) {
                        tabNav.navigate('Profile', {
                          screen: 'NotificationSettings',
                        });
                      }
                    }}
                  >
                    <Image source={require('../../assets/icons/bell.png')} style={styles.headerIcon} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.searchBox}
                activeOpacity={0.9}
                onPress={() => {
                  const tabNav = navigation.getParent?.();
                  if (tabNav?.navigate) {
                    tabNav.navigate('Search', {
                      screen: 'SearchHome',
                      params: { autoFocus: true },
                    });
                  } else {
                    navigation.navigate('SearchHome', {
                      autoFocus: true,
                    });
                  }
                }}
              >
                <Search size={18} color="#9E9E9E" />
                <TextInput
                  placeholder="Search Dish name..."
                  placeholderTextColor="#9E9E9E"
                  style={styles.searchInput}
                  editable={false}
                />
              </TouchableOpacity>

              <View style={styles.tabs}>
                {['Restaurants', 'Offers', 'Pick-up'].map(label => {
                  const isActive = activeTab === label;
                  return (
                    <TouchableOpacity
                      key={label}
                      style={styles.tabItem}
                      activeOpacity={0.85}
                      onPress={() => setActiveTab(label)}
                    >
                      <Text
                        style={isActive ? styles.tabTextActive : styles.tabText}
                      >
                        {label}
                      </Text>
                      {isActive ? <View style={styles.tabUnderline} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ImageBackground>

          {activeTab === 'Offers' ? (
            <Offers />
          ) : (
            <>
              {/* FOOD CATEGORIES */}
              <FlatList
                horizontal
                data={foodOptions}
                keyExtractor={item => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.foodList}
                renderItem={({ item }) => (
                  <View style={styles.foodItem}>
                    <Image source={item.image} style={styles.foodImage} />
                    <Text style={styles.foodTitle}>{item.title}</Text>
                  </View>
                )}
              />

              {/* PROMO (X-axis scroll) */}
              <FlatList
                horizontal
                data={promoCards}
                keyExtractor={item => item.id}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
                contentContainerStyle={styles.promoList}
                snapToInterval={Math.round(width * 0.82) + 12}
                decelerationRate="fast"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.promoCard}
                    onPress={() => {
                      if (item.restaurant) {
                        navigation.navigate('RestaurantDetail', {
                          restaurant: item.restaurant,
                        });
                      }
                    }}
                  >
                    <Image source={item.image} style={styles.promoImage} />
                    <View style={styles.promoShade} />
                    <View style={styles.promoOverlay}>
                      <Text style={styles.promoTitle}>{item.title}</Text>
                      <Text style={styles.promoSub}>{item.subtitle}</Text>
                      <View style={styles.promoBtn}>
                        <Text style={styles.promoBtnText}>{item.cta}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              />

              {/* RECOMMENDED */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recommended For You</Text>
                <Text style={styles.viewAll}>View All</Text>
              </View>

              <FlatList
                horizontal
                data={restaurants}
                keyExtractor={item => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recommendList}
                renderItem={({ item }) =>
                  (() => {
                    const cuisineText = Array.isArray(item?.cuisines)
                      ? item.cuisines.join(', ')
                      : item?.cuisine ||
                        item?.category ||
                        'Pizza, Italian, Fast Food';
                    const distanceText = item?.distance
                      ? `${item.distance} away`
                      : '1.2 km away';
                    const timeText = item?.deliveryTime || '20 - 30 minutes';
                    const ratingValue = item?.rating ?? '5.0';
                    const ratingCount = item?.ratingCount || '2.7k';
                    const bestSellerText =
                      item?.bestSeller || 'Best Seller: Cheese Burst Pizza';
                    const isFavorite = favorites.has(item.id);

                    return (
                      <TouchableOpacity
                        style={styles.recommendCard}
                        onPress={() =>
                          navigation.navigate('RestaurantDetail', {
                            restaurant: item,
                          })
                        }
                      >
                        <View style={styles.recommendImageWrap}>
                          <Image
                            source={{ uri: item.coverImage }}
                            style={styles.recommendImage}
                          />
                          <TouchableOpacity
                            style={styles.favBtn}
                            activeOpacity={0.8}
                            onPress={() => toggleFavorite(item.id)}
                          >
                            <Heart
                              size={16}
                              color={isFavorite ? '#FF3B30' : '#111111'}
                              fill={isFavorite ? '#FF3B30' : 'none'}
                            />
                          </TouchableOpacity>
                          <View style={styles.imageDots}>
                            {Array.from({ length: 6 }).map((_, index) => (
                              <View
                                key={`dot-${index}`}
                                style={
                                  index === 4
                                    ? [styles.dot, styles.dotActive]
                                    : styles.dot
                                }
                              />
                            ))}
                          </View>
                        </View>
                        <View style={styles.recommendBody}>
                          <View style={styles.recommendTitleRow}>
                            <Text
                              style={styles.recommendTitle}
                              numberOfLines={1}
                            >
                              {item.name}
                            </Text>
                            <View style={styles.ratingRow}>
                              <Star size={14} color="#F5A623" fill="#F5A623" />
                              <Text style={styles.ratingValue}>
                                {ratingValue}
                              </Text>
                              <Text style={styles.ratingCount}>
                                ({ratingCount})
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.recommendMeta} numberOfLines={1}>
                            {cuisineText}
                          </Text>
                          <Text
                            style={styles.recommendSubMeta}
                            numberOfLines={1}
                          >
                            {distanceText} | {timeText}
                          </Text>
                          <View style={styles.bestSellerPill}>
                            <Text
                              style={styles.bestSellerText}
                              numberOfLines={1}
                            >
                              {bestSellerText}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })()
                }
              />

              {/* EXPLORE */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Explore Restaurants</Text>
                <View style={styles.sortActions}>
                  <TouchableOpacity activeOpacity={0.85} onPress={() => {}}>
                    <Text style={styles.sortText}>Sort</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setIsFilterOpen(true)}
                  >
                    <Text style={styles.sortText}>Filter</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {restaurants.map(item => {
                const cuisineText = Array.isArray(item?.cuisines)
                  ? item.cuisines.join(', ')
                  : item?.cuisine ||
                    item?.category ||
                    'Pizza, Italian, Fast Food';
                const distanceText = item?.distance
                  ? `${item.distance} away`
                  : '1.2 km away';
                const timeText = item?.deliveryTime || '20 - 30 minutes';
                const ratingValue = item?.rating ?? '5.0';
                const ratingCount = item?.ratingCount || '2.7k';
                const bestSellerText =
                  item?.bestSeller || 'Best Seller: Cheese Burst Pizza';
                const isFavorite = favorites.has(item.id);

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.listCard}
                    activeOpacity={0.9}
                    onPress={() =>
                      navigation.navigate('RestaurantDetail', {
                        restaurant: item,
                      })
                    }
                  >
                    <View style={styles.listImageWrap}>
                      <Image
                        source={{ uri: item.coverImage }}
                        style={styles.listImage}
                      />
                      <TouchableOpacity
                        style={styles.listFavBtn}
                        activeOpacity={0.8}
                        onPress={() => toggleFavorite(item.id)}
                      >
                        <Heart
                          size={16}
                          color={isFavorite ? '#FF3B30' : '#111111'}
                          fill={isFavorite ? '#FF3B30' : 'none'}
                        />
                      </TouchableOpacity>
                      <View style={styles.listImageDots}>
                        {Array.from({ length: 6 }).map((_, index) => (
                          <View
                            key={`list-dot-${index}`}
                            style={
                              index === 4
                                ? [styles.listDot, styles.listDotActive]
                                : styles.listDot
                            }
                          />
                        ))}
                      </View>
                    </View>
                    <View style={styles.listBody}>
                      <View style={styles.listTitleRow}>
                        <Text style={styles.listTitle} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <View style={styles.listRatingRow}>
                          <Star size={14} color="#F5A623" fill="#F5A623" />
                          <Text style={styles.listRatingValue}>
                            {ratingValue}
                          </Text>
                          <Text style={styles.listRatingCount}>
                            ({ratingCount})
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.listMeta} numberOfLines={1}>
                        {cuisineText}
                      </Text>
                      <Text style={styles.listSubMeta} numberOfLines={1}>
                        {distanceText} | {timeText}
                      </Text>
                      <View style={styles.listBestSellerPill}>
                        <Text
                          style={styles.listBestSellerText}
                          numberOfLines={1}
                        >
                          {bestSellerText}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}

              <View style={{ height: 40 }} />
            </>
          )}
        </ScrollView>
      </View>
      <FilterDrawer
        visible={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onReset={() => {}}
        onApply={() => {}}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    overflow:'hidden'
  },

  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  headerBg: {
    height: 250,
    paddingTop: 16,
    paddingBottom: 8,
    overflow: 'hidden',
  },

  headerBgImage: {
    opacity: 0.45,
    resizeMode: 'cover',
    alignSelf: 'flex-start',
  },

  headerGlass: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },

  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FF3D3D',
  },

  cartBadgeText: {
    color: '#FF3D3D',
    fontSize: 10,
    fontWeight: '800',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 40,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  addressBlock: {
    paddingTop: 1,
  },

  homeLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },

  location: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
    color: '#111111',
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  avatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  avatarImg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    resizeMode: 'cover',
  },

  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    tintColor: '#FFFFFF',
  },

  searchBox: {
    marginTop: 14,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111111',
    paddingVertical: 0,
  },

  tabs: {
    flexDirection: 'row',
    marginTop: 18,
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 12,
  },

  tabText: {
    fontSize: 16,
    color: '#111111',
    fontWeight: '700',
    opacity: 0.65,
  },

  tabTextActive: {
    fontSize: 16,
    color: '#111111',
    fontWeight: '700',
    opacity: 1,
  },

  tabUnderline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -15,
    height: 2,
    backgroundColor: '#FF3B30',
  },

  foodList: {
    paddingLeft: 16,
    marginTop: 18,
    paddingBottom: 4,
  },

  foodItem: {
    alignItems: 'center',
    marginRight: 15,
    width: 90,
    height: 110,
    backgroundColor: '#FDEEEE',
    borderRadius: 22,
    paddingTop: 14,
    paddingBottom: 12,
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  foodImage: {
    width: 60,
    height: 60,
    borderRadius: 32,
    marginBottom: 10,
  },

  foodTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2A2A2A',
  },

  promoList: {
    paddingLeft: 16,
    paddingRight: 6,
    marginTop: 18,
  },

  promoCard: {
    width: Math.round(width * 0.82),
    marginRight: 12,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },

  promoImage: {
    width: '100%',
    height: 150,
  },

  promoShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  promoOverlay: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
  },

  promoTitle: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '400',
  },

  promoSub: {
    color: '#FFFFFF',
    fontSize: 23,
    marginTop: 2,
    fontWeight: '400',
  },

  promoBtn: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },

  promoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111111',
  },

  sectionHeader: {
    marginTop: 30,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },

  viewAll: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
  },

  sortText: {
    fontSize: 16,
    color: '#8E8E93',
    gap: 4,
  },
  sortActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  recommendList: {
    paddingLeft: 16,
    marginTop: 14,
    paddingBottom: 16,
  },

  recommendCard: {
    width: 260,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    marginRight: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
    overflow: 'visible',
  },

  recommendImageWrap: {
    position: 'relative',
    padding: 5,
  },

  recommendImage: {
    width: '100%',
    height: 145,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderRadius: 18,
  },

  favBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },

  imageDots: {
    position: 'absolute',
    right: 12,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },

  dotActive: {
    width: 16,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },

  recommendBody: {
    padding: 12,
  },

  recommendTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  recommendTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
    flex: 1,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  ratingValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
  },

  ratingCount: {
    fontSize: 12,
    color: '#6E6E6E',
  },

  recommendMeta: {
    fontSize: 13,
    color: '#6E6E6E',
    marginTop: 6,
  },

  recommendSubMeta: {
    fontSize: 13,
    color: '#6E6E6E',
    marginTop: 6,
  },

  bestSellerPill: {
    marginTop: 10,
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

  listCard: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    overflow: 'visible',
  },

  listImageWrap: {
    position: 'relative',
  },

  listImage: {
    width: '100%',
    height: 155,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },

  listFavBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },

  listImageDots: {
    position: 'absolute',
    right: 12,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  listDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },

  listDotActive: {
    width: 16,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },

  listBody: {
    padding: 12,
  },

  listTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
    flex: 1,
  },

  listRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  listRatingValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
  },

  listRatingCount: {
    fontSize: 12,
    color: '#6E6E6E',
  },

  listMeta: {
    fontSize: 13,
    color: '#6E6E6E',
    marginTop: 6,
  },

  listSubMeta: {
    fontSize: 13,
    color: '#6E6E6E',
    marginTop: 6,
  },

  listBestSellerPill: {
    marginTop: 10,
    backgroundColor: '#FDEEEE',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },

  listBestSellerText: {
    fontSize: 12,
    color: '#5B3B3B',
    fontWeight: '600',
  },

  priceText: {
    fontSize: 12,
    color: '#6E6E6E',
    marginTop: 4,
  },
});