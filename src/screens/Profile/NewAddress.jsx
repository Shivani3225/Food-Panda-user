import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

const AddNewAddressScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('address.add_new', 'Add New Address')}
        </Text>
      </View>

      {/* Map */}
      <Image
        source={require('../../assets/images/BgImg.png')}
        style={styles.map}
        resizeMode="cover"
      />

      {/* Bottom Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {t('address.add_address', 'Add Address')}
        </Text>

        {/* Selected Address */}
        <View style={styles.addressBox}>
          <View style={styles.radioOuter}>
            <View style={styles.radioInner} />
          </View>
          <Text style={styles.addressText}>
            Logistics Park, Dubai Industrial City, Dubai, United Arab Emirates
          </Text>
        </View>

        {/* Location Details */}
        <Text style={styles.sectionLabel}>
          {t('address.location_details', 'Location Details')}
        </Text>

        <View style={styles.input}>
          <Text style={styles.placeholder}>
            {t('address.street_placeholder', 'Street/House Number')}
          </Text>
        </View>

        <View style={styles.input}>
          <Text style={styles.placeholder}>
            {t('address.apt_placeholder', 'Apt no, Suite, Floor')}
          </Text>
        </View>

        {/* Save Address As */}
        <Text style={styles.sectionLabel}>
          {t('address.save_as', 'Save Address as')}
        </Text>

        <View style={styles.tagRow}>
          <View style={styles.tagActive}>
            <Text style={styles.tagActiveText}>
              {t('address.home', 'Home')}
            </Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>
              {t('address.work', 'Work')}
            </Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>
              {t('address.add_new_tag', '+ Add New')}
            </Text>
          </View>
        </View>

        {/* Button */}
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>
            {t('address.button', 'Add Address')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default AddNewAddressScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /* Header */
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#000000',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 8,
  },

  /* Map */
  map: {
    width: '100%',
    height: 230,
  },

  /* Card */
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2A44',
    marginBottom: 16,
  },

  /* Address Box */
  addressBox: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#1F2A44',
    borderRadius: 12,
    padding: 12,
    alignItems: 'flex-start',
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#1F2A44',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1F2A44',
  },
  addressText: {
    fontSize: 14,
    color: '#1F2A44',
    marginLeft: 10,
    lineHeight: 20,
    flex: 1,
  },

  /* Section */
  sectionLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 20,
    marginBottom: 8,
  },

  /* Inputs */
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  placeholder: {
    fontSize: 14,
    color: '#9CA3AF',
  },

  /* Tags */
  tagRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  tagActive: {
    borderWidth: 1,
    borderColor: '#1F2A44',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
  },
  tagActiveText: {
    fontSize: 14,
    color: '#1F2A44',
    fontWeight: '500',
  },
  tag: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
  },
  tagText: {
    fontSize: 14,
    color: '#6B7280',
  },

  /* Button */
  button: {
    height: 52,
    backgroundColor: '#EF1C25',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
