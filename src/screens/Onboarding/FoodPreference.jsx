import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ImageBackground,
  TouchableOpacity,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { foodOptions } from '../../Data/foodOptions';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { wp, hp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES as FONT } from '../../theme/typography';

const HORIZONTAL_PADDING = wp(4.44);
const GAP = wp(3.33);
const BUTTON_HEIGHT = hp(6.75);

export default function FoodPreferences({ route }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState([]);
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { setAuthenticatedUser } = useAuth();

  const flow = route?.params?.flow || 'profile'; // 'onboarding' or 'profile'

  const numColumns = width < 340 ? 2 : 3;

  const cardSize = useMemo(() => {
    const availableWidth = width - HORIZONTAL_PADDING * 2 - GAP * (numColumns - 1);
    return Math.floor(availableWidth / numColumns);
  }, [numColumns, width]);

  const buttonBottom = Math.max(insets.bottom + hp(1.5), hp(2));
  const gridBottomPadding = BUTTON_HEIGHT + buttonBottom + hp(2);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('LoginScreen');
  };

  const toggleSelect = id => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id],
    );
  };

  const renderItem = ({ item }) => {
    const active = selected.includes(item.id);

    // Get translated title if titleKey exists
    const itemTitle = item.titleKey
      ? t(item.titleKey, item.title)
      : item.title;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => toggleSelect(item.id)}
        style={{ width: cardSize }}
      >
        <ImageBackground
          source={item.image}
          style={[styles.card, { width: cardSize, height: cardSize }]}
          imageStyle={styles.cardImage}
        >
          <View style={styles.overlay} />
          <Text style={styles.cardText}>{itemTitle}</Text>
          {active && <View style={styles.activeBorder} />}
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* HEADER */}
      <TouchableOpacity
        style={styles.header}
        onPress={handleBack}
      >
        <ArrowLeft size={22} color="#000" />
      </TouchableOpacity>

      {/* TITLE */}
      <Text style={styles.title}>{t('food_preferences.title', 'Food Preferences')}</Text>

      {/* SUBTITLE */}
      <Text style={styles.subtitle}>
        {t('food_preferences.subtitle', 'Choose your favorite food types and dietary preferences to personalize your menu and get recommendations you\'ll love.')}
      </Text>

      {/* GRID */}
      <FlatList
        key={numColumns}
        data={foodOptions}
        keyExtractor={i => i.id}
        numColumns={numColumns}
        columnWrapperStyle={{ gap: GAP, justifyContent: 'center' }}
        contentContainerStyle={[styles.grid, { paddingBottom: gridBottomPadding }]}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />

      {/* BUTTON */}
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.button, { bottom: buttonBottom }]}
        onPress={() => {
          Toast.show({
            type: 'topSuccess',
            text1: t('food_preferences.saved_title', 'Preferences Saved'),
            text2: t('food_preferences.saved_message', 'Your food preferences have been saved'),
            position: 'top',
            visibilityTime: 2000,
            autoHide: true,
          });
          setTimeout(async () => {
            console.log('FoodPreference Continue timeout triggered. Flow:', flow);
            if (flow === 'onboarding') {
              const { token, user } = route?.params || {};
              console.log('FoodPreference token exists:', !!token, 'user exists:', !!user);
              if (token) {
                try {
                  console.log('FoodPreference received user:', user);
                  console.log('FoodPreference received countryCode:', user?.countryCode);
                  console.log('Calling setAuthenticatedUser...');
                  await setAuthenticatedUser(token, user);
                  console.log('setAuthenticatedUser completed. Resetting navigation to MainTabs...');
                  navigation.dispatch(
                    CommonActions.reset({
                      index: 0,
                      routes: [{ name: 'MainTabs' }],
                    })
                  );
                } catch (err) {
                  console.error('Error in setAuthenticatedUser:', err);
                }
              } else {
                console.log('No token found, navigating to LoginScreen');
                navigation.replace('LoginScreen');
              }
            } else {
              console.log('Flow is profile, navigating back or to LoginScreen');
              // Existing user from profile - go back
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.replace('LoginScreen');
              }
            }
          }, 500);
        }}
      >
        <Text style={styles.buttonText}>{t('common.continue', 'Continue')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: HORIZONTAL_PADDING,
  },

  header: {
    marginTop: hp(1.25),
  },

  title: {
    marginTop: hp(2.25),
    fontSize: FONT.xl + scale(4),
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },

  subtitle: {
    marginTop: hp(0.75),
    fontSize: FONT.xs,
    color: '#6F6F6F',
    textAlign: 'center',
    lineHeight: hp(2.25),
    paddingHorizontal: wp(3.33),
  },

  grid: {
    marginTop: hp(2.75),
    rowGap: GAP,
    alignItems: 'center',
  },

  card: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardImage: {
    borderRadius: scale(16),
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderRadius: scale(16),
  },

  cardText: {
    color: '#FFF',
    fontSize: scale(11),
    fontWeight: '600',
    textAlign: 'center',
    zIndex: 2,
  },

  activeBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: scale(2.5),
    borderColor: '#ed1c24',
    borderRadius: scale(16),
  },

  button: {
    position: 'absolute',
    left: HORIZONTAL_PADDING,
    right: HORIZONTAL_PADDING,
    height: BUTTON_HEIGHT,
    backgroundColor: '#FF2D2D',
    borderRadius: scale(27),
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    color: '#FFF',
    fontSize: FONT.sm,
    fontWeight: '700',
  },
});