import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Heart, Tag, Wallet } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import DeleteAccountPopUp from './DeleteAccountPopUp';
import LogoutPopUp from './LogoutPopUp';
import LoadingModal from '../../components/LoadingModal';
import apiClient from '../../config/apiClient';
import { USER_ROUTES } from '../../config/routes';
import { wp, hp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';

const { width } = Dimensions.get('window');

// Cache timeout (30 seconds)
const CACHE_TIMEOUT = 30000;

function ProfileHome() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { logout, currencySymbol, setAuthenticatedUser } = useAuth();
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Cache ref to track last fetch time
  const lastFetchTimeRef = useRef(null);

  const rootNavigation = useMemo(() => {
    let current = navigation;
    while (current?.getParent?.()) {
      const parent = current.getParent();
      if (!parent) break;
      current = parent;
    }
    return current;
  }, [navigation]);

  // Fetch user profile - with caching to prevent repeated API calls
  const fetchUserProfile = useCallback(async (bypassCache = false) => {
    const now = Date.now();
    
    // Check if data is already cached and fresh
    if (!bypassCache && lastFetchTimeRef.current && (now - lastFetchTimeRef.current) < CACHE_TIMEOUT) {
      return; // Data is fresh, skip API call
    }

    try {
      setIsLoadingProfile(true);
      const response = await apiClient.get(USER_ROUTES.profile);
      const user = response?.data?.user || response?.data;
      console.log('👤 [ProfileHome] User Profile Response:', user);
      setUserData(user);
      lastFetchTimeRef.current = now; 
      // Crucial: Update AuthContext with the fetched user data
      if (user && setAuthenticatedUser) {
        await setAuthenticatedUser(null, user);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [setAuthenticatedUser]);

  // Fetch profile when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
    }, [fetchUserProfile])
  );

  // Fetch profile on mount
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);

      // Clear token from AsyncStorage and auth state
      await logout();

      rootNavigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'LoginScreen' }],
        }),
      );
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  }, [logout, rootNavigation]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchUserProfile(true);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchUserProfile]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <LoadingModal visible={isLoggingOut} message={t('profile.logging_out', 'Logging out...')} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#E41C26']}
            tintColor="#E41C26"
          />
        }
      >
        {/* Header with Profile */}
        <View style={styles.header}>
        </View>

        {/* Quick Actions Cards */}
        <View style={styles.ImageContainer}>
          <View style={styles.avatarWrapper}>
            <Image
              source={
                userData?.profilePic
                  ? { uri: userData.profilePic }
                  : require('../../assets/icons/user.png')
              }
              style={styles.avatar}
            />
          </View>
          {isLoadingProfile ? (
            <ActivityIndicator color="#E41C26" style={{ marginTop: 12 }} />
          ) : (
            <>
              <Text style={styles.name}>{userData?.name || t('profile.user', 'User')}</Text>
              <Text style={styles.phone}>
                📞 {(() => {
                  const mobile = userData?.mobile || '';
                  if (!mobile) return t('common.na', 'N/A');
                  
                  // Common country codes
                  const codes =
                   ['+49', '+91', '+966', '+1', '+44', '+971'];
                  for (const code of codes) {
                    if (mobile.startsWith(code)) {
                      return `${code} ${mobile.substring(code.length)}`;
                    }
                  }
                  return mobile;
                })()}
              </Text>
            </>
          )}
        </View>
        <View style={styles.quickActionsContainer}>

          <TouchableOpacity
            style={styles.quickActionCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Favourite')}
          >
            <View style={styles.iconCircle}>
              <Heart size={20} color="#E41C26" />
            </View>
            <Text style={styles.quickActionText}>{t('profile.favourites', 'Favourites')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Coupons')}
          >
            <View style={styles.iconCircle}>
              <Tag size={20} color="#E41C26" />
            </View>
            <Text style={styles.quickActionText}>{t('profile.coupons', 'Coupons')}</Text>
          </TouchableOpacity>
        </View>

        {/* Wallet Card */}
        <TouchableOpacity
          style={styles.walletCard}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('WalletProfile')}
        >
          <View style={styles.walletLeft}>
            <View style={styles.iconCircle}>
              <Wallet size={20} color="#E41C26" />
            </View>
            <Text style={styles.walletText}>{t('profile.wallet', 'Wallet')}</Text>
          </View>
          <Text style={styles.walletAmount}>
            {currencySymbol}{userData?.walletBalance?.toFixed(2) || '0.00'}
          </Text>
        </TouchableOpacity>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.account', 'Account')}</Text>
          <View style={styles.sectionCard}>
            <MenuItem
              title={t('profile.your_profile', 'Your Profile')}
              onPress={() => navigation.navigate('ProfileEdit')}
            />
            <MenuItem
              title={t('profile.delivery_address', 'Delivery Address')}
              onPress={() => navigation.navigate('AddressesScreen')}
            />
            <MenuItem
              title={t('profile.food_preference', 'Food Preference')}
              onPress={() => navigation.navigate('FoodPreference', { flow: 'profile' })}
            />
            <MenuItem
              title={t('profile.rate_past_orders', 'Rate Past Orders')}
              onPress={() => navigation.navigate('RatePastOrders')}
              isLast
            />
          </View>
        </View>

        {/* Help & Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.help_support', 'Help & Support')}</Text>
          <View style={styles.sectionCard}>
            <MenuItem
              title={t('profile.faq', "FAQ's")}
              onPress={() => navigation.navigate('FaqScreen')}
            />
            <MenuItem
              title={t('profile.contact_support', 'Contact Support')}
              onPress={() => navigation.navigate('ContactSupport')}
              isLast
            />
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.settings', 'Settings')}</Text>
          <View style={styles.sectionCard}>
            <MenuItem
              title={t('profile.notification_settings', 'Notification Settings')}
              onPress={() => navigation.navigate('NotificationSettings')}
            />
            <MenuItem
              title={t('profile.payment_setting', 'Payment Setting')}
              onPress={() => navigation.navigate('PaymentSetting')}
            />
            <MenuItem
              title={t('profile.change_password', 'Change Password')}
              onPress={() => navigation.navigate('ChangePasswordScreen')}
            />
            <MenuItem
              title={t('profile.delete_account', 'Delete Account')}
              onPress={() => setShowDeletePopup(true)}
              isLast
            />
          </View>
        </View>

        {/* About App Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.about_app', 'About App')}</Text>
          <View style={styles.sectionCard}>
            <MenuItem
              title={t('profile.privacy_policy', 'Privacy Policy')}
              onPress={() => navigation.navigate('PrivacyPolicy')}
            />
            <MenuItem
              title={t('profile.terms_conditions', 'Terms & Condition')}
              onPress={() => navigation.navigate('TermsConditionScreen')}
            />
            <MenuItem
              title={t('profile.logout', 'Logout')}
              onPress={() => setShowLogoutPopup(true)}
              isLast
            />
          </View>
        </View>
      </ScrollView>

      {/* Delete Account Popup */}
      <DeleteAccountPopUp
        visible={showDeletePopup}
        onClose={() => setShowDeletePopup(false)}
        onDelete={() => {
          setShowDeletePopup(false);
          setTimeout(() => {
            navigation.navigate('DeleteAccountScreen');
          }, 0);
        }}
      />

      {/* Logout Popup */}
      <LogoutPopUp
        visible={showLogoutPopup}
        onClose={() => setShowLogoutPopup(false)}
        onLogout={() => {
          setShowLogoutPopup(false);
          handleLogout();
        }}
      />
    </SafeAreaView>
  );
}

export default React.memo(ProfileHome);

const MenuItem = React.memo(({ title, onPress, isLast }) => (
  <TouchableOpacity
    activeOpacity={0.7}
    style={[styles.menuItem, isLast && styles.menuItemLast]}
    onPress={onPress}
  >
    <Text style={styles.menuItemText}>{title}</Text>
    <Text style={styles.chevron}>›</Text>
  </TouchableOpacity>
));

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFF',
  },

  scrollContent: {
    paddingBottom: SPACING.lg,
  },

  /* Header */
  header: {
    backgroundColor: '#E41C26',
    paddingTop: scale(60),
    paddingBottom: SPACING.lg,
    height: hp(20),
    alignItems: 'center',
    borderBottomLeftRadius: scale(24),
    borderBottomRightRadius: scale(24),
  },

  avatarWrapper: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },

  avatar: {
    width: scale(74),
    height: scale(74),
    borderRadius: scale(37),
  },

  name: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: '#000',
  },

  phone: {
    fontSize: FONT_SIZES.xs,
    color: '#000',
    marginTop: scale(4),
    opacity: 0.9,
  },

  ImageContainer: {
    marginTop: scale(-58),
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  /* Quick Actions */
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    zIndex: 10,
  },

  quickActionCard: {
    flex: 1,
    marginTop: scale(20),
    backgroundColor: '#FDF8F8',
    borderRadius: scale(12),
    paddingVertical: scale(8),
    alignItems: 'center',
    justifyContent:'center',
    borderWidth: 1,
    borderColor: '#00000024',
    flexDirection:'row'
  },

  iconCircle: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  quickActionText: {
    fontSize: FONT_SIZES.xs,
    color: '#333333',
    fontWeight: '600',
  },

  /* Wallet Card */
  walletCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FDF8F8',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    padding: SPACING.lg,
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: '#00000024'
  },

  walletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },

  walletText: {
    fontSize: FONT_SIZES.sm,
    color: '#333333',
    fontWeight: '600',
  },

  walletAmount: {
    fontSize: FONT_SIZES.sm,
    color: '#E41C26',
    fontWeight: '700',
  },

  /* Sections */
  section: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },

  sectionTitle: {
    fontSize: FONT_SIZES.xs,
    color: '#999999',
    fontWeight: '600',
    marginBottom: SPACING.xs,
    marginLeft: scale(4),
  },

  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(12),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#00000024'
  },

  /* Menu Items */
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },

  menuItemLast: {
    borderBottomWidth: 0,
  },

  menuItemText: {
    fontSize: FONT_SIZES.sm,
    color: '#333333',
    fontWeight: '500',
  },

  chevron: {
    fontSize: FONT_SIZES.lg,
    color: '#CCCCCC',
    fontWeight: '300',
  },
});
