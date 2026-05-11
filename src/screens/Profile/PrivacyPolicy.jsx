import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacyPolicyScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.root}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={require('../../assets/icons/Backarrow.png')}
            style={styles.back}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('privacy_policy.title', 'Privacy Policy')}</Text>
      </View>

      {/* CONTENT */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.textBlock}>
          {t('privacy_policy.section1', 'At FoodPanda, we take your privacy seriously. We collect your personal information to provide and improve our services, process your orders, and communicate with you. Your data is stored securely and is only shared with our restaurant partners and delivery riders to fulfill your orders.')}
        </Text>

        <Text style={styles.textBlockBold}>
          {t('privacy_policy.section2_title', 'How We Use Your Information')}
        </Text>

        <Text style={styles.textBlock}>
          {t('privacy_policy.section2', 'We use the information we collect to operate, maintain, and provide the features of our application. We also use your information to personalize your experience, understand and analyze the usage trends, and improve our platform\'s functionality.')}
        </Text>

        <Text style={styles.textBlock}>
          {t('privacy_policy.section3', 'We implement a variety of security measures to maintain the safety of your personal information. Your data is protected behind secured networks and is only accessible by a limited number of persons who have special access rights.')}
        </Text>

        <Text style={styles.textBlock}>
          {t('privacy_policy.section4', 'By using our app, you consent to our privacy policy. If we decide to change our privacy policy, we will post those changes on this page. If you have any questions or concerns, please contact our support team.')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },

  back: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    marginRight: 22,
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 40,
  },

  textBlock: {
    fontSize: 13,
    lineHeight: 20,
    color: '#4B5563',
    marginBottom: 14,
  },

  textBlockBold: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 14,
  },
});