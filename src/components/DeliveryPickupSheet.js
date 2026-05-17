import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function buildDateOptions(t) {
  const now = new Date();
  const days = [0, 1, 2, 3].map(offset => {
    const d = new Date(now);
    d.setDate(now.getDate() + offset);
    const label =
      offset === 0
        ? t('delivery.today', 'Today')
        : offset === 1
        ? t('delivery.tomorrow', 'Tomorrow')
        : d.toLocaleDateString(undefined, {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
          });
    return {
      id: String(offset),
      label,
      value: d.toISOString().slice(0, 10),
    };
  });
  return days;
}

const getTimeOptions = (t) => [
  { id: 't1', label: t('delivery.asap', 'ASAP'), value: 'ASAP' },
  { id: 't2', label: '12:00 - 12:30', value: '12:00-12:30' },
  { id: 't3', label: '12:30 - 13:00', value: '12:30-13:00' },
  { id: 't4', label: '13:00 - 13:30', value: '13:00-13:30' },
  { id: 't5', label: '13:30 - 14:00', value: '13:30-14:00' },
  { id: 't6', label: '14:00 - 14:30', value: '14:00-14:30' },
  { id: 't7', label: '14:30 - 15:00', value: '14:30-15:00' },
  { id: 't8', label: '15:00 - 15:30', value: '15:00-15:30' },
];

export default function DeliveryPickupSheet({
  visible,
  initialType = 'delivery',
  initialDate = null,
  initialTime = null,
  onClose,
  onAdd,
}) {
  const { t } = useTranslation();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const dateOptions = useMemo(() => buildDateOptions(t), [t]);
  const TIME_OPTIONS = useMemo(() => getTimeOptions(t), [t]);

  const [type, setType] = useState(initialType);
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);

  const selectedDateLabel =
    dateOptions.find(opt => opt.value === date)?.label || t('delivery.select_date', 'Select Date');
  const selectedTimeLabel =
    TIME_OPTIONS.find(opt => opt.value === time)?.label || t('delivery.select_time', 'Select Time');

  useEffect(() => {
    if (!visible) return;
    setType(initialType || 'delivery');
    setDate(initialDate);
    setTime(initialTime);
    setShowDateDropdown(false);
    setShowTimeDropdown(false);
  }, [visible, initialDate, initialTime, initialType]);

  useEffect(() => {
    if (visible) {
      overlayOpacity.setValue(0);
      translateY.setValue(SCREEN_HEIGHT);
      
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
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true,
    );
    return () => backHandler.remove();
  }, [visible]);

  const canAdd = !!type && !!date && !!time;

  const handleSelectDate = (option) => {
    setDate(option.value);
    setShowDateDropdown(false);
  };

  const handleSelectTime = (option) => {
    setTime(option.value);
    setShowTimeDropdown(false);
  };

  const toggleDateDropdown = () => {
    setShowTimeDropdown(false);
    setShowDateDropdown(!showDateDropdown);
  };

  const toggleTimeDropdown = () => {
    setShowDateDropdown(false);
    setShowTimeDropdown(!showTimeDropdown);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View style={styles.modalRoot}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <Pressable 
            style={StyleSheet.absoluteFill} 
            onPress={() => {
              setShowDateDropdown(false);
              setShowTimeDropdown(false);
            }}
          />
        </Animated.View>

        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.8}
            style={styles.closeFloating}
          >
            <Text style={styles.closeFloatingText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>{t('delivery.delivery_pickup', 'Delivery / Pick-up')}</Text>
          </View>

          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => setType('delivery')}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.tabText,
                  type === 'delivery' && styles.tabTextActive,
                ]}
              >
                {t('delivery.delivery', 'Delivery')}
              </Text>
              {type === 'delivery' && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => setType('pickup')}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.tabText,
                  type === 'pickup' && styles.tabTextActive,
                ]}
              >
                {t('delivery.pickup', 'Pick-up')}
              </Text>
              {type === 'pickup' && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          </View>

          {/* Date Field */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>
              {type === 'pickup' 
                ? t('delivery.pickup_date', 'Pick-up Date') 
                : t('delivery.delivery_date', 'Delivery Date')}
            </Text>
            <TouchableOpacity
              style={[
                styles.selectRow,
                showDateDropdown && styles.selectRowActive,
              ]}
              onPress={toggleDateDropdown}
              activeOpacity={0.9}
            >
              <Text style={styles.selectValue}>{selectedDateLabel}</Text>
              <Text style={[
                styles.chevron,
                showDateDropdown && styles.chevronUp,
              ]}>
                ⌄
              </Text>
            </TouchableOpacity>

            {showDateDropdown && (
              <View style={styles.dropdown}>
                <ScrollView 
                  style={styles.dropdownScroll}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                >
                  {dateOptions.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.dropdownItem,
                        date === option.value && styles.dropdownItemActive,
                      ]}
                      onPress={() => handleSelectDate(option)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          date === option.value && styles.dropdownItemTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {date === option.value && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Time Field */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>
              {type === 'pickup' 
                ? t('delivery.pickup_time', 'Pick-up Time') 
                : t('delivery.delivery_time', 'Delivery Time')}
            </Text>
            <TouchableOpacity
              style={[
                styles.selectRow,
                showTimeDropdown && styles.selectRowActive,
              ]}
              onPress={toggleTimeDropdown}
              activeOpacity={0.9}
            >
              <Text style={styles.selectValue}>{selectedTimeLabel}</Text>
              <Text style={[
                styles.chevron,
                showTimeDropdown && styles.chevronUp,
              ]}>
                ⌄
              </Text>
            </TouchableOpacity>

            {showTimeDropdown && (
              <View style={styles.dropdown}>
                <ScrollView 
                  style={styles.dropdownScroll}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                >
                  {TIME_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.dropdownItem,
                        time === option.value && styles.dropdownItemActive,
                      ]}
                      onPress={() => handleSelectTime(option)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          time === option.value && styles.dropdownItemTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {time === option.value && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.bottomBar}>
            <TouchableOpacity
              onPress={() => {
                if (!canAdd) return;
                onAdd?.({ type, date, time });
              }}
              style={[styles.primaryBtn, !canAdd && styles.primaryBtnDisabled]}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryText}>{t('common.add', 'Add')}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 16,
    overflow: 'visible',
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 10,
  },
  title: { fontSize: 16, fontWeight: '900', color: '#111' },
  closeFloating: {
    position: 'absolute',
    top: -50,
    alignSelf: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeFloatingText: {
    fontSize: 18,
    color: '#111',
  },

  tabsRow: {
    flexDirection: 'row',
    marginTop: 4,
    marginHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabText: { fontWeight: '700', color: '#8E8E8E', fontSize: 13 },
  tabTextActive: { color: '#111' },
  tabUnderline: {
    height: 2,
    backgroundColor: '#FF3D3D',
    width: '70%',
    marginTop: 8,
    borderRadius: 2,
  },

  fieldBlock: {
    marginTop: 14,
    marginHorizontal: 16,
    zIndex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#4F4F4F',
    fontWeight: '600',
    marginBottom: 8,
  },
  selectRow: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectRowActive: {
    borderColor: '#FF3D3D',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  selectValue: {
    fontSize: 12,
    color: '#4F4F4F',
    fontWeight: '600',
  },
  chevron: { 
    fontSize: 16, 
    color: '#999',
    transform: [{ rotate: '0deg' }],
  },
  chevronUp: {
    transform: [{ rotate: '180deg' }],
  },

  dropdown: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FF3D3D',
    borderTopWidth: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    maxHeight: 200,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  dropdownItemActive: {
    backgroundColor: '#FFF5F5',
  },
  dropdownItemText: {
    fontSize: 12,
    color: '#4F4F4F',
    fontWeight: '600',
  },
  dropdownItemTextActive: {
    color: '#FF3D3D',
    fontWeight: '700',
  },
  checkmark: {
    fontSize: 14,
    color: '#FF3D3D',
    fontWeight: 'bold',
  },

  bottomBar: {
    marginTop: 6,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FF3D3D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryText: { color: '#FFF', fontWeight: '900', fontSize: 14 },
});