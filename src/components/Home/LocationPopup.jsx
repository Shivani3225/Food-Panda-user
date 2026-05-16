import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MapPin, X } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const LocationPopup = ({ visible, onClose, currentCity, defaultCity, onStay, onSetDefault }) => {
  const { t } = useTranslation();

  // Clean city names by removing common suffix like "Division", "District"
  const cleanCity = (name) => {
    if (!name) return '';
    return name.replace(/\s(Division|District|Region|State|City)\b/gi, '').trim();
  };

  const displayCurrentCity = cleanCity(currentCity) || 'Indore';
  const displayDefaultCity = cleanCity(defaultCity) || 'Pune';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Close Icon */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <X size={20} color={'#BDBDBD'} />
          </TouchableOpacity>

          <View style={styles.content}>
            {/* Header Icon */}
            <View style={styles.iconCircle}>
              <MapPin size={24} color={"#ed1c24"} fill="#ed1c24" fillOpacity={0.1} />
            </View>
            
            <View style={styles.textContainer}>
              <Text style={styles.title}>
                {t('home.location_popup_title', 'Update Delivery Location?')}
              </Text>

              <Text style={styles.message}>
                {t('home.location_popup_message', 'Your current location is {{city}}, but your default is set to {{defaultCity}}. Would you like to stay here or change it?', { city: displayCurrentCity, defaultCity: displayDefaultCity })}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity 
                style={styles.stayBtn} 
                onPress={onStay}
                activeOpacity={0.8}
            >
              <Text style={styles.stayText}>
                {t('home.stay_location', 'Stay Here')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.setBtn} 
                onPress={onSetDefault}
                activeOpacity={0.8}
            >
              <Text style={styles.setText}>
                {t('home.set_default_btn', 'Set Default')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default LocationPopup;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.82,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 15,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 10,
  },
  content: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111111',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 5,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  stayBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  stayText: {
    fontSize: 14,
    color: '#555555',
    fontWeight: '700',
  },
  setBtn: {
    flex: 1,
    backgroundColor: '#ed1c24',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
