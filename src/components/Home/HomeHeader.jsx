import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ImageBackground,
} from 'react-native';
import {
  MapPin,
  Search,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { hp, wp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES as FONT } from '../../theme/typography';

export const HomeHeader = memo(({
  addressLabel,
  addressLine,
  userData,
  cartCount,
  tabs,
  activeTab,
  isSmallDevice,
  onProfilePress,
  onCartPress,
  onNotificationPress,
  onSearchPress,
  onTabPress,
  onAddressPress,
}) => {
  const { t } = useTranslation();
  const [avatarError, setAvatarError] = React.useState(false);

  React.useEffect(() => {
    setAvatarError(false);
  }, [userData?.profilePic]);

  return (
    <ImageBackground
      source={require('../../assets/images/BgImagee.png')}
      style={styles.headerBg}
      imageStyle={styles.headerBgImage}
      resizeMode="cover"
    >
      <View style={styles.headerGlass}>
        <View
          style={[
            styles.headerRow,
            isSmallDevice && styles.headerRowCompact,
          ]}
        >
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.addressBlock} 
              activeOpacity={0.7} 
              onPress={onAddressPress}
            >
              <Text style={styles.homeLabel} numberOfLines={1} ellipsizeMode="tail">
                {t(addressLabel, addressLabel)}
              </Text>
              <View style={styles.locationRow}>
                <MapPin size={16} color="#111111" />
                <Text style={styles.location} numberOfLines={1} ellipsizeMode="tail">
                  {addressLine}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.avatarRing}
              activeOpacity={0.85}
              onPress={onProfilePress}
            >
              <Image
                source={
                  userData?.profilePic && !avatarError
                    ? { uri: userData.profilePic }
                    : require('../../assets/icons/user.png')
                }
                style={styles.avatarImg}
                onError={() => setAvatarError(true)}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.85}
              onPress={onCartPress}
            >
              <Image source={require('../../assets/icons/Cart.png')} style={styles.headerIcon} />
              {cartCount > 0 ? (
                <View style={styles.cartBadge} pointerEvents="none">
                  <Text style={styles.cartBadgeText}>
                    {cartCount > 99 ? '99+' : String(cartCount)}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.85}
              onPress={onNotificationPress}
            >
              <Image source={require('../../assets/icons/bell.png')} style={styles.headerIcon} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.searchBox,
            isSmallDevice && styles.searchBoxCompact,
          ]}
          activeOpacity={0.9}
          onPress={onSearchPress}
        >
          <Search size={18} color="#9E9E9E" />
          <TextInput
            placeholder={t('home.search_placeholder')}
            placeholderTextColor="#9E9E9E"
            style={styles.searchInput}
            editable={false}
          />
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
});

const styles = StyleSheet.create({
  headerBg: {
    paddingTop: hp(0),
    paddingBottom: hp(0.5),
    overflow: 'hidden',
  },
  headerBgImage: {
    opacity: 0.45,
    resizeMode: 'cover',
    alignSelf: 'flex-start',
  },
  headerGlass: {
    paddingBottom: hp(2),
    backgroundColor: 'transparent',
  },
  cartBadge: {
    position: 'absolute',
    top: hp(-0.75),
    right: wp(-1.67),
    minWidth: wp(5),
    height: hp(2.25),
    paddingHorizontal: wp(1.39),
    borderRadius: scale(9),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: scale(2),
    borderColor: '#ed1c24',
  },
  cartBadgeText: {
    color: '#ed1c24',
    fontSize: FONT.xs + scale(-2),
    fontWeight: '800',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: hp(2.5),
    paddingHorizontal: wp(4.44),
  },
  headerRowCompact: {
    paddingTop: hp(1.75),
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
    paddingRight: wp(2.22),
  },
  addressBlock: {
    width: '100%',
  },
  homeLabel: {
    fontSize: FONT.xs + scale(-1),
    color: '#8E8E93',
    lineHeight: scale(14),
    includeFontPadding: false,
    marginBottom: hp(0.25),
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.67),
  },
  location: {
    fontSize: FONT.sm + scale(1),
    fontWeight: '600',
    marginTop: 0,
    color: '#111111',
    lineHeight: scale(18),
    includeFontPadding: false,
    flexShrink: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3.33),
  },
  avatarRing: {
    width: wp(11.11),
    height: wp(11.11),
    borderRadius: scale(56),
    borderWidth: scale(2),
    borderColor: '#ed1c24',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  avatarImg: {
    width: wp(9.44),
    height: wp(9.44),
    borderRadius: scale(47),
    resizeMode: 'cover',
  },
  actionBtn: {
    width: wp(11.11),
    height: wp(11.11),
    borderRadius: scale(56),
    backgroundColor: '#ed1c24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    width: scale(24),
    height: scale(24),
    resizeMode: 'contain',
    tintColor: '#FFFFFF',
  },
  searchBox: {
    marginTop: hp(1.75),
    height: hp(6.5),
    borderRadius: scale(26),
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: scale(1),
    borderColor: 'rgba(0,0,0,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4.44),
    marginHorizontal: wp(4.44),
    gap: wp(2.78),
  },
  searchBoxCompact: {
    height: hp(5.75),
    marginTop: hp(1.25),
  },
  searchInput: {
    flex: 1,
    fontSize: FONT.sm,
    color: '#111111',
    paddingVertical: 0,
  },
  tabs: {
    flexDirection: 'row',
    marginTop: hp(2.25),
  },
  tabsCompact: {
    marginTop: hp(1.5),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: hp(1.5),
    paddingBottom: hp(1),
  },
  tabItemCompact: {
    paddingTop: hp(1.25),
    paddingBottom: hp(0.75),
  },
  tabText: {
    fontSize: FONT.sm + scale(2),
    color: '#111111',
    fontWeight: '700',
    opacity: 0.65,
  },
  tabTextActive: {
    fontSize: FONT.sm + scale(2),
    color: '#111111',
    fontWeight: '700',
    opacity: 1,
  },
  tabTextCompact: {
    fontSize: FONT.sm + scale(1),
  },
  tabUnderline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: hp(0.25),
    backgroundColor: '#ed1c24',
  },
});