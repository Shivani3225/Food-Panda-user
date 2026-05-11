import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import LogoIcon from '../../assets/icons/LogoIcon.svg';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  const navigation = useNavigation();
  const { isInitialized, isAuthenticated } = useAuth();


  useEffect(() => {
    if (!isInitialized) return;

    const timer = setTimeout(() => {
      navigation.replace('LanguageSelect');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation, isInitialized]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />

      {/* LOGO */}
      <LogoIcon
        width={width * 0.72}
        height={width * 0.32}
        style={styles.logo}
      />

      {/* RED CURVE (SVG) */}
      <View style={styles.svgContainer}>
        <Svg
          width={width}
          height={height * 0.6}
          viewBox="0 0 375 300"
          preserveAspectRatio="none"
        >
          <Path
            d="
              M0 80
              C 90 0, 285 0, 375 80
              L 375 300
              L 0 300
              Z
            "
            fill="#ed1c24"
          />
        </Svg>
      </View>

     
      <Image
        source={require('../../assets/images/Noodle.png')}
        style={styles.noodle}
        resizeMode="contain"
      />
    </SafeAreaView>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
  },

  logo: {
    width: width * 0.72,
    height: width * 0.32,
    marginTop: height * 0.18,
    zIndex: 10,
  },

  svgContainer: {
    position: 'absolute',
    bottom: 0,
    width: width,
    height: height * 0.6,
  },

  noodle: {
    position: 'absolute',
    bottom: height * 0.099,
    right: 0,
    width: width * 0.99,
    height: width * 0.95,
    zIndex: 5,
  },
});
