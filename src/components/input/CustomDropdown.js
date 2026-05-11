import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';

const CustomDropdown = ({
  label,
  placeholder = 'Select an option',
  value,
  onSelect,
  options = [],
  error = '',
  style,
  dropdownIcon,
}) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  const handleSelect = (item) => {
    onSelect(item);
    setIsVisible(false);
  };

  const selectedOption = options.find(opt => opt.value === value);
  
  // Check if placeholder is a translation key or a string
  const placeholderText = placeholder.startsWith('common.') || placeholder.startsWith('dropdown.') 
    ? t(placeholder, placeholder)
    : placeholder;
  
  const displayText = selectedOption 
    ? (selectedOption.labelKey ? t(selectedOption.labelKey, selectedOption.label) : selectedOption.label)
    : placeholderText;

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>
          {label.startsWith('common.') || label.startsWith('dropdown.') 
            ? t(label, label)
            : label}
        </Text>
      )}
      
      <Pressable
        style={[
          styles.dropdownButton,
          error ? styles.dropdownButtonError : null,
        ]}
        onPress={() => setIsVisible(true)}
      >
        <Text
          style={[
            styles.dropdownText,
            !selectedOption && styles.placeholderText,
          ]}
        >
          {displayText}
        </Text>
        
        {dropdownIcon ? (
          <Image source={dropdownIcon} style={styles.icon} />
        ) : (
          <Text style={styles.arrowIcon}>▼</Text>
        )}
      </Pressable>

      {error ? (
        <Text style={styles.errorText}>
          {error.startsWith('common.') || error.startsWith('validation.') 
            ? t(error, error)
            : error}
        </Text>
      ) : null}

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {label && (label.startsWith('common.') || label.startsWith('dropdown.')
                  ? t(label, label)
                  : label || t('common.select', 'Select'))}
              </Text>
              <Pressable
                onPress={() => setIsVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.optionItem,
                    value === item.value && styles.optionItemSelected,
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      value === item.value && styles.optionTextSelected,
                    ]}
                  >
                    {item.labelKey 
                      ? t(item.labelKey, item.label)
                      : item.label}
                  </Text>
                  {value === item.value && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </Pressable>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 8,
    fontWeight: '700',
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#9CA3AF',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownButtonError: {
    borderColor: '#ed1c24',
  },
  dropdownText: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  placeholderText: {
    color: '#9AA3AF',
  },
  icon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    tintColor: '#6B7280',
  },
  arrowIcon: {
    fontSize: 12,
    color: '#6B7280',
  },
  errorText: {
    color: '#ed1c24',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    width: '85%',
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: '300',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionItemSelected: {
    backgroundColor: '#FEF2F2',
  },
  optionText: {
    fontSize: 15,
    color: '#374151',
  },
  optionTextSelected: {
    color: '#ed1c24',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 18,
    color: '#ed1c24',
    fontWeight: '700',
  },
});

export default CustomDropdown;