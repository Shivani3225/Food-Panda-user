import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import LogoIcon from '../assets/icons/LogoIcon.svg';

const FirstNextScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <LogoIcon width={260} height={260} style={styles.logo} />

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('WelcomeScreen')}
        >
          <Text style={styles.buttonText}>{t('first_next.get_started', 'Get Started')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  logo: {
    width: 260,
    height: 260,
  },

  button: {
    position: 'absolute',
    bottom: 30,
    width: '90%',
    height: 50,
    backgroundColor: '#E41E26',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FirstNextScreen;