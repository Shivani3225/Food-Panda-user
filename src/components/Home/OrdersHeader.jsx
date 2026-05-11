import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { hp, wp } from '../../utils/responsive';
import { fontScale } from '../../utils/scale';
import { FONT_SIZES as FONT } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';

/**
 * OrdersHeader - A header component for the Orders screen
 * styled similar to the Home/Search header.
 */
export const OrdersHeader = memo(({ 
  title, 
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {title || t('orders.your_orders', 'Your Orders')}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: hp(7),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontScale(20),
    fontWeight: '600',
    color: '#111',
  },
});