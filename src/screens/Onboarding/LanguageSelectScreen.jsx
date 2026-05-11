import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as RNLocalize from 'react-native-localize';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LogoIcon from '../../assets/icons/LogoIcon.svg';

const { width, height } = Dimensions.get('window');

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'German' },
  { code: 'ar', label: 'عربي' },
];

export default function LanguageSelectScreen() {
  const [selected, setSelected] = useState('en');
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('@app_language');
        if (savedLanguage) {
          setSelected(savedLanguage);
          await i18n.changeLanguage(savedLanguage);
        } else {
          const locales = RNLocalize.getLocales();
          if (locales.length > 0) {
            const deviceLang = locales[0].languageCode;
            const found = LANGUAGES.find(l => l.code === deviceLang);
            if (found) {
              setSelected(found.code);
              await i18n.changeLanguage(found.code);
            }
          }
        }
      } catch (error) {
        console.log('Error loading language:', error);
      }
    };
    
    loadLanguage();
  }, [i18n]);

  const handleLanguageChange = async (langCode) => {
    setSelected(langCode);
    await i18n.changeLanguage(langCode);
    await AsyncStorage.setItem('@app_language', langCode);
  };

  const handleSelect = () => {
    navigation.replace('OnBoarding', { language: selected });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Image
              source={require('../../assets/images/FoodCurve.png')}
              style={styles.topImage}
              resizeMode="cover"
            />
          </View>

          {/* CONTENT */}
          <View style={styles.content}>
            <Text style={styles.title}>
              {t('language.select_title')}
            </Text>
            <Text style={styles.subtitle}>
              {t('language.select_subtitle')}
            </Text>
            
            {LANGUAGES.map(lang => (
              <Pressable
                key={lang.code}
                onPress={() => handleLanguageChange(lang.code)}
                style={[
                  styles.langCard,
                  selected === lang.code && styles.langSelected,
                ]}
              >
                <Text
                  style={[
                    styles.langText,
                    selected === lang.code && styles.langTextSelected,
                  ]}
                >
                  {t(`language.languages.${lang.code}`)}
                </Text>
                {selected === lang.code && (
                  <View style={styles.checkCircle}>
                    <Check size={16} color="#111" strokeWidth={3} />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </ScrollView>
        
        <View style={styles.btnWrapper}>
          <TouchableOpacity
            style={styles.btn}
            onPress={handleSelect}
          >
            <Text style={styles.btnText}>
              {t('language.get_started', 'Get Started')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  header: {
    width: '100%',
    height: height * 0.42,
    borderBottomLeftRadius: width,
    borderBottomRightRadius: width,
    overflow: 'hidden',
  },
  topImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 10,
    marginBottom: 26,
  },
  langCard: {
    borderWidth: 1,
    borderColor: '#DADADA',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  langSelected: {
    backgroundColor: '#000',
    borderColor: '#000',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  langText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  langTextSelected: {
    color: '#FFF',
    fontWeight: '700',
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnWrapper: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: 'transparent',
  },
  btn: {
    backgroundColor: '#ed1c24',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 0,
  },
  btnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});