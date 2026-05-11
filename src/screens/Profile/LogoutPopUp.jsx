import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Trash2, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LogoutPopUp = ({ visible, onClose, onLogout }) => {
  const { t } = useTranslation();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Overlay */}
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          {/* Close */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <X size={18} color={'#9E9E9E'} />
          </TouchableOpacity>

          <View style={styles.row}>
            {/* Icon */}
            <View style={styles.iconCircle}>
              <Trash2 size={22} color={"#E41C26"} />
            </View>
            <View style={styles.textContainer}>
              {/* Title */}
              <Text style={styles.title}>
                {t('profile.logout_title', 'Log Out')}
              </Text>

              {/* Message */}
              <Text style={styles.message}>
                {t('profile.logout_confirmation', 'Are you sure you want to Logout')}
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>
                {t('common.cancel', 'Cancel')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
              <Text style={styles.logoutText}>
                {t('profile.logout_button', 'Logout')}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

export default LogoutPopUp;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  container: {
    width: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },

  closeBtn: {
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 10,
    elevation: 10,
  },

  closeText: {
    fontSize: 18,
    color: '#9E9E9E',
  },

  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFEAEA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
    marginRight: 8,
  },

  icon: {
    fontSize: 22,
    color: '#E41C26',
  },

  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1C',
  },

  message: {
    fontSize: 13,
    color: '#8E8E8E',
    marginTop: 6,
    flexWrap: 'wrap',
    flexShrink: 1,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 4,
  },

  textContainer: {
    flex: 1,
    minWidth: 0,
  },

  actions: {
    flexDirection: 'row',
    marginTop: 22,
  },

  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingVertical: 10,
    marginRight: 8,
    alignItems: 'center',
  },

  cancelText: {
    fontSize: 14,
    color: '#1C1C1C',
    fontWeight: '500',
  },

  logoutBtn: {
    flex: 1,
    backgroundColor: '#E41C26',
    borderRadius: 10,
    paddingVertical: 10,
    marginLeft: 8,
    alignItems: 'center',
  },

  logoutText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
