import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { FavouritesContext } from '../../context/FavouritesContext';
import { RestaurantListCard } from '../../components/Home/RestaurantCard';
import { wp, hp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES as FONT } from '../../theme/typography';

export default function RecommendedRestaurants() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { isFavourite, toggleFavourite } = useContext(FavouritesContext);
  const recommendedRestaurants = route.params?.recommendedRestaurants || [];

  const handleRestaurantPress = (item) => {
    navigation.navigate('RestaurantDetail', {
      restaurant: item,
    });
  };

  const handleToggleFavorite = async (item) => {
    try {
      await toggleFavourite(item, 'restaurant');
    } catch (error) {
      console.error('Toggle favourite error:', error?.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Image source={require('../../assets/icons/Backarrow.png')} style={styles.backIcon} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>{t('home.recommended', 'Recommended')}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {recommendedRestaurants.length > 0 ? (
        <FlatList
          data={recommendedRestaurants}
          keyExtractor={(item, index) => item?.id || `recommended-${index}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <RestaurantListCard
              item={item}
              isFavorite={isFavourite?.(item.id, 'restaurant')}
              onPress={() => handleRestaurantPress(item)}
              onFavoritePress={() => handleToggleFavorite(item)}
            />
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {t('recommended.no_items', 'No recommendations available')}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: hp(11), 
    paddingHorizontal: 16,
    paddingTop: hp(4), 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backIcon: {
    width: scale(22),
    height: scale(22),
    resizeMode: 'contain',
  },
  backText: { // This style is no longer directly used for the back button, but kept for reference if needed elsewhere.
    fontSize: FONT.sm,
    color: '#ed1c24',
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    color: '#111111',
    fontWeight: '600',
  },
  headerSpacer: {
    width: 30,
  },
  listContent: {
    paddingTop: hp(2),
    paddingBottom: hp(4),
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(8),
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: FONT.sm,
    textAlign: 'center',
  },
});