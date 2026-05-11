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

export default function TermsConditionScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={require('../../assets/icons/Backarrow.png')}
            style={styles.back}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('terms.title', 'Terms & Condition')}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.textBlock}>
          {t('terms.section1', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu turpis molestie, dictum est a, mattis tellus. Sed dignissim, metus nec fringilla accumsan, risus sem sollicitudin lacus, ut interdum tellus elit sed risus. Maecenas eget condimentum velit, sit amet feugiat lectus. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Praesent auctor purus luctus enim egestas, ac scelerisque ante pulvinar. Donec ut rhoncus ex. Suspendisse ac rhoncus nisl, eu tempor urna. Curabitur vel bibendum lorem.')}
        </Text>

        <Text style={styles.textBlockBold}>
          {t('terms.section2_title', 'Morem ipsum dolor sit amet, consectetur')}
        </Text>

        <Text style={styles.textBlock}>
          {t('terms.section2', 'adipiscing elit. Etiam eu turpis molestie, dictum est a, mattis tellus. Sed dignissim, metus nec fringilla accumsan, risus sem sollicitudin lacus, ut interdum tellus elit sed risus. Maecenas eget condimentum velit, sit amet feugiat lectus. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Praesent auctor purus luctus enim egestas, ac scelerisque ante pulvinar. Donec ut rhoncus ex. Suspendisse ac rhoncus nisl, eu tempor urna. Curabitur vel bibendum lorem.')}
        </Text>

        <Text style={styles.textBlock}>
          {t('terms.section3', 'adipiscing elit. Etiam eu turpis molestie, dictum est a, mattis tellus. Sed dignissim, metus nec fringilla accumsan, risus sem sollicitudin lacus, ut interdum tellus elit sed risus.')}
        </Text>

        <Text style={styles.textBlock}>
          {t('terms.section4', 'adipiscing elit. Etiam eu turpis molestie, dictum est a, mattis tellus. Sed dignissim, metus nec fringilla accumsan, risus sem sollicitudin lacus, ut interdum tellus elit sed risus.')}
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