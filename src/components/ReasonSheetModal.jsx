import React, { useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
  BackHandler,
} from 'react-native';
import { useTranslation } from 'react-i18next';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ReasonSheetModal({
  visible,
  reasons,
  selectedReason,
  onSelect,
  onClose,
}) {
  const { t } = useTranslation();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = React.useState(false);

  // Get translated reason text if reason is a translation key
  const getTranslatedReason = (reason) => {
    if (typeof reason === 'string') {
      // Check if it's a translation key
      if (reason.startsWith('reasons.') || reason.startsWith('common.')) {
        return t(reason, reason);
      }
      return reason;
    }
    // If reason is an object with translation keys
    if (typeof reason === 'object') {
      return reason.labelKey ? t(reason.labelKey, reason.label) : reason.label;
    }
    return reason;
  };

  // Get reason value for selection
  const getReasonValue = (reason) => {
    if (typeof reason === 'string') {
      return reason;
    }
    if (typeof reason === 'object') {
      return reason.value || reason.id || reason.label;
    }
    return reason;
  };

  useEffect(() => {
    if (!visible) {
      setShouldRender(false);
      return undefined;
    }

    overlayOpacity.setValue(0);
    translateY.setValue(SCREEN_HEIGHT);
    
    requestAnimationFrame(() => {
      setShouldRender(true);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(overlayOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            stiffness: 220,
            damping: 28,
            mass: 0.9,
            useNativeDriver: true,
          }),
        ]).start();
      });
    });

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true,
    );
    return () => backHandler.remove();
  }, [visible, overlayOpacity, translateY]);

  if (!shouldRender) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Animated.View style={[styles.modalOverlay, { opacity: overlayOpacity }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.sheetHandleWrap}>
            <TouchableOpacity style={styles.sheetClose} onPress={onClose}>
              <Text style={styles.sheetCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sheetTitle}>{t('reasons.title', 'Reasons')}</Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetList}
          >
            {reasons.map((reason, index) => {
              const reasonValue = getReasonValue(reason);
              const isSelected = selectedReason === reasonValue;
              const displayText = getTranslatedReason(reason);
              
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.reasonRow}
                  onPress={() => onSelect(reasonValue)}
                >
                  <Text style={styles.reasonText}>{displayText}</Text>
                  <View
                    style={[
                      styles.radioOuter,
                      isSelected && styles.radioOuterSelected,
                    ]}
                  >
                    {isSelected ? <View style={styles.radioInner} /> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 18,
    maxHeight: '70%',
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  sheetClose: {
    top: -50,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetCloseText: {
    fontSize: 16,
    color: '#111827',
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  sheetList: {
    paddingBottom: 8,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  reasonText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    marginRight: 12,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#EF4444',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
});