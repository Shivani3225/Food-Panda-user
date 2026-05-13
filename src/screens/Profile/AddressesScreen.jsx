import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Edit2, Trash2 } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import useHideTabBar from '../../utils/hooks/useHideTabBar';
import apiClient from '../../config/apiClient';
import { USER_ROUTES } from '../../config/routes';

const { width, height } = Dimensions.get('window');

const getAddressLabels = (t) => ({
  home: t('address_labels.home', 'Home'),
  office: t('address_labels.office', 'Office'),
  work: t('address_labels.work', 'Work'),
  other: t('address_labels.other', 'Other'),
});

export default function AddressesScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  useHideTabBar(navigation);

  const ADDRESS_LABELS = getAddressLabels(t);

  // Fetch addresses from API
  const fetchAddresses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(USER_ROUTES.addresses);
      const addressData = response?.data?.addresses || response?.data || [];
      
      // Map API response to match component expectations
      const formattedAddresses = Array.isArray(addressData)
        ? addressData.map((addr) => ({
            id: addr._id || Math.random().toString(),
            _id: addr._id,
            label: addr.label?.toLowerCase() || 'other',
            addressLine: addr.addressLine || '',
            city: addr.city || '',
            zipCode: addr.zipCode || '',
            deliveryInstructions: addr.deliveryInstructions || '',
            isDefault: addr.isDefault || false,
            coordinates: addr.location?.coordinates || [],
            location: addr.location,
            fullAddress: `${addr.addressLine}, ${addr.city}, ${addr.zipCode}`,
          }))
        : [];
        
      // De-duplicate addresses based on addressLine and city
      const uniqueAddresses = [];
      const seenAddresses = new Set();
      
      formattedAddresses.forEach(addr => {
        // Use a more robust key: just alphanumeric characters from addressLine
        const cleanAddress = (addr.addressLine || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanCity = (addr.city || '').toLowerCase().trim();
        const key = `${cleanAddress}-${cleanCity}`;
        
        if (!seenAddresses.has(key) && cleanAddress) {
          seenAddresses.add(key);
          uniqueAddresses.push(addr);
        } else if (!cleanAddress) {
          // If no address line, just push it (fallback)
          uniqueAddresses.push(addr);
        }
      });
      
      setAddresses(uniqueAddresses);
    } catch (err) {
      console.error('Error fetching addresses:', err);
      setError(err.message);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch addresses on mount
  useEffect(() => {
    fetchAddresses();
  }, []);

  // Refetch when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchAddresses();
    }, [])
  );

  const handleSelectAddress = (address) => {
    // Navigate to AddAddressScreen with the address data for editing
    navigation.navigate('AddAddressScreen', { address });
  };

  const handleAddNewAddress = () => {
    // Navigate to AddAddressScreen for adding new address
    navigation.navigate('AddAddressScreen');
  };

  const handleDeleteAddress = async (id) => {
    Alert.alert(
      t('addresses.delete_confirm_title', 'Delete Address'),
      t('addresses.delete_confirm_message', 'Are you sure you want to delete this address?'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('common.delete', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              // Use the endpoint from routes
              const endpoint = USER_ROUTES.addressById.replace(':id', id);
              await apiClient.delete(endpoint);
              fetchAddresses();
              Alert.alert(t('common.success', 'Success'), t('addresses.deleted_message', 'Address deleted successfully'));
            } catch (err) {
              console.error('Error deleting address:', err);
              Alert.alert(t('common.error', 'Error'), err.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handlePickAddressForDelivery = (address) => {
    // Navigate back to the Home screen and pass the selected address
    navigation.navigate('Home', {
      screen: 'HomePage',
      params: { selectedAddress: address }
    });
  };

  const renderAddressItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.addressItem}
      activeOpacity={0.8}
      onPress={() => handlePickAddressForDelivery(item)}
    >
      <View style={styles.badgeRow}>
        <View style={styles.labelBadge}>
          <Text style={styles.labelBadgeText}>
            {ADDRESS_LABELS[item.label?.toLowerCase()] || item.label}
          </Text>
        </View>
        {item.isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultBadgeText}>{t('addresses.default', 'Default')}</Text>
          </View>
        )}
      </View>
      <Text style={styles.addressText} numberOfLines={2}>
        {item.fullAddress}
      </Text>
      {item.deliveryInstructions && (
        <Text style={styles.instructionsText} numberOfLines={1}>
          📝 {item.deliveryInstructions}
        </Text>
      )}
      
      {/* Action Buttons */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleSelectAddress(item)}
          activeOpacity={0.7}
        >
          <Edit2 size={16} color="#E41C26" />
          <Text style={styles.actionBtnText}>{t('common.edit', 'Edit')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => handleDeleteAddress(item._id)} // Use _id for API
          activeOpacity={0.7}
        >
          <Trash2 size={16} color="#FF4D4F" />
          <Text style={[styles.actionBtnText, styles.deleteBtnText]}>{t('common.delete', 'Delete')}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>{t('addresses.no_addresses', 'No Addresses Found')}</Text>
      <Text style={styles.emptySubtitle}>
        {t('addresses.add_first_address', 'Add your first delivery address to get started')}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={24} color="#000" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('addresses.title', 'Addresses')}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E41C26" />
          </View>
        ) : (
          <FlatList
            data={addresses}
            renderItem={renderAddressItem}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            scrollEnabled={true}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.listContent,
              addresses.length === 0 && { flex: 1 },
            ]}
            ListEmptyComponent={renderEmptyState}
            scrollEventThrottle={16}
          />
        )}

        {/* Add New Address Button */}
        <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddNewAddress}
            activeOpacity={0.85}
          >
            <MapPin size={22} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.addButtonText}>{t('addresses.add_address', 'Add New Address')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.04,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e8e8e8',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: width > 400 ? 20 : 18,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.3,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContent: {
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.02,
    paddingTop: height * 0.015,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width * 0.1,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 21,
    fontWeight: '500',
  },
  addressItem: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 16,
    padding: width * 0.045,
    marginBottom: height * 0.018,
    backgroundColor: '#fafafa',
    minHeight: 100,
    justifyContent: 'flex-start',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  labelBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.8,
    borderColor: '#E41C26',
  },
  labelBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E41C26',
    letterSpacing: 0.2,
  },
  defaultBadge: {
    backgroundColor: '#E41C26',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  defaultBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 21,
    fontWeight: '500',
    marginBottom: 6,
  },
  instructionsText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
    marginTop: 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E41C26',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E41C26',
  },
  deleteBtn: {
    borderColor: '#FF4D4F',
  },
  deleteBtnText: {
    color: '#FF4D4F',
  },
  buttonContainer: {
    paddingHorizontal: width * 0.04,
    paddingTop: 16,
    backgroundColor: '#fff',
  },
  addButton: {
    backgroundColor: '#E41C26',
    borderRadius: 14,
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.04,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: 4,
    shadowColor: '#E41C26',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  addButtonIcon: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginRight: 8,
    lineHeight: 24,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});