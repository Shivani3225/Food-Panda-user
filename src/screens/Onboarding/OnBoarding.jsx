import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Pressable, TouchableOpacity, FlatList, Dimensions, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { wp, hp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES as FONT } from '../../theme/typography';

const { width } = Dimensions.get('window');

const ONBOARDING_DATA = [
  {
    id: '1',
    titleKey: 'ordering.title',
    subtitleKey: 'ordering.subtitle',
    image: require('../../assets/images/foodWell.png'),
  },
  {
    id: '2',
    titleKey: 'ordering.title_2', // Make sure these keys exist in your translation files
    subtitleKey: 'ordering.subtitle_2',
    image: require('../../assets/images/foodWell.png'), // Placeholder
  },
  {
    id: '3',
    titleKey: 'ordering.title_3',
    subtitleKey: 'ordering.subtitle_3',
    image: require('../../assets/images/foodWell.png'), // Placeholder
  },
];

export default function EasyOrderingScreen() {
  const navigation = useNavigation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  // Auto-slide logic
  useEffect(() => {
    const timer = setInterval(() => {
      if (currentIndex < ONBOARDING_DATA.length - 1) {
        flatListRef.current?.scrollToIndex({
          index: currentIndex + 1,
          animated: true,
        });
      } else {
        flatListRef.current?.scrollToIndex({
          index: 0,
          animated: true,
        });
      }
    }, 3000); // 3 seconds interval

    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigation.replace('MainTabs');
    } else {
      navigation.replace('LoginScreen');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_DATA}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(newIndex);
        }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ width: width }}>
            <Image
              source={item.image}
              style={styles.topImage}
              resizeMode="cover"
            />
            <View style={styles.content}>
              <Text style={styles.title}>{t(item.titleKey)}</Text>
              <Text style={styles.subtitle}>{t(item.subtitleKey)}</Text>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        {/* Pagination */}
        <View style={styles.dots}>
          {ONBOARDING_DATA.map((_, index) => (
            <View 
              key={index} 
              style={[styles.dot, currentIndex === index && styles.active]} 
            />
          ))}
        </View>

        {/* Button */}
        <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
          <Text style={styles.buttonText}>{t('ordering.button', 'Get Started')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  topImage: {
    width: wp(100),
    height: hp(55),
    borderBottomLeftRadius: wp(100),
    borderBottomRightRadius: wp(100),
    overflow: 'hidden',
  },

  content: {
    alignItems: 'center',
    paddingHorizontal: wp(8.33),
    paddingTop: hp(5),
  },
  footer: {
    paddingHorizontal: wp(8.33),
    paddingBottom: hp(5),
    alignItems: 'center',
  },

  title: {
    fontSize: FONT.xxl,
    fontWeight: '700',
    color: '#111',
    marginBottom: hp(1.5),
  },

  subtitle: {
    fontSize: FONT.sm,
    color: '#777',
    textAlign: 'center',
    lineHeight: hp(2.75),
  },

  dots: {
    flexDirection: 'row',
    marginTop: hp(3.125),
    marginBottom: hp(5),
  },

  dot: {
    width: wp(5),
    height: hp(0.5),
    backgroundColor: '#ddd',
    borderRadius: scale(10),
    marginHorizontal: wp(1.11),
  },

  active: {
    backgroundColor: '#ed1c24',
    width: wp(7.22),
  },

  button: {
    width: '100%',
    backgroundColor: '#ed1c24',
    paddingVertical: hp(2),
    borderRadius: scale(14),
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontSize: FONT.md,
    fontWeight: '600',
  },
});