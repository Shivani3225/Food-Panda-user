import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Image,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeStack from './HomeStack';
import OrdersStack from './OrdersStack';
import SearchStack from './SearchStack';
import ProfileStack from './ProfileStack';

import HomeIcon from '../assets/icons/home.png';
import OrdersIcon from '../assets/icons/orders.png';
import SearchIcon from '../assets/icons/search.png';
import UserIcon from '../assets/icons/user.png';

const Tab = createBottomTabNavigator();

const TAB_ICONS = [HomeIcon, OrdersIcon, SearchIcon, UserIcon];

// Fully custom tab bar — red top border only on the active tab
function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom, height: 60 + insets.bottom }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!event.defaultPrevented) {
            let targetScreen = undefined;
            if (route.name === 'Home') targetScreen = 'HomePage';
            else if (route.name === 'Orders') targetScreen = 'OrdersHome';
            else if (route.name === 'Search') targetScreen = 'SearchHome';
            else if (route.name === 'Profile') targetScreen = 'ProfileHome';

            if (targetScreen) {
              navigation.navigate(route.name, { screen: targetScreen });
            } else {
              navigation.navigate(route.name);
            }
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
          >
            {/* Red top indicator — only on focused tab */}
            <View
              style={[
                styles.activeIndicator,
                { backgroundColor: isFocused ? '#FF3D3D' : 'transparent' },
              ]}
            />

            <Image
              source={TAB_ICONS[index]}
              style={[
                styles.icon,
                { tintColor: isFocused ? '#FF3D3D' : '#A5A5A5' },
              ]}
              resizeMode="contain"
            />

            <Text
              style={[
                styles.label,
                { color: isFocused ? '#111111' : '#A5A5A5' },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    height: 60,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    paddingBottom: 6,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 0,
  },
  icon: {
    width: 22,
    height: 22,
    marginBottom: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
});

export default function TabNavigator() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ tabBarLabel: t('tabs.home', 'Home') }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersStack}
        options={{ tabBarLabel: t('tabs.orders', 'Orders') }}
      />
      <Tab.Screen
        name="Search"
        component={SearchStack}
        options={{ tabBarLabel: t('tabs.search', 'Search') }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{ tabBarLabel: t('tabs.profile', 'Profile') }}
      />
    </Tab.Navigator>
  );
}