import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  PermissionsAndroid
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Camera, Check, Plus, Trash2 } from 'lucide-react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import apiClient from '../../config/apiClient';
import { useAuth } from '../../context/AuthContext';
import { scale } from '../../utils/scale';
import { wp, hp } from '../../utils/responsive';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';

function getLocalizedText(value, fallback = '', lang = 'en') {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return value[lang] || value['en'] || Object.values(value)[0] || fallback;
  }
  return fallback;
}

export default function RequestRefundScreen() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n?.language || 'en';
  const navigation = useNavigation();
  const route = useRoute();
  const { currencySymbol } = useAuth() || {};

  const orderId = route?.params?.orderId;
  const order = route?.params?.orderData;

  const [selectedItems, setSelectedItems] = useState([]); // List of { productId, quantity, reason }
  const [refundAll, setRefundAll] = useState(false);
  const [note, setNote] = useState('');
  const [images, setImages] = useState([]); // Array of { uri, type, name }
  const [submitting, setSubmitting] = useState(false);

  const items = Array.isArray(order?.items) ? order.items : [];

  // Toggle item selection
  const handleToggleItem = (item) => {
    const productId = item?.product?._id || item?.product?.id || item?.id;
    const exists = selectedItems.find(si => si.productId === productId);

    if (exists) {
      setSelectedItems(prev => prev.filter(si => si.productId !== productId));
      setRefundAll(false);
    } else {
      setSelectedItems(prev => [
        ...prev,
        {
          productId,
          quantity: item.quantity || item.qty || 1,
          reason: 'quality_issue',
          name: item.name,
          price: item.price
        }
      ]);
    }
  };

  // Toggle Refund All
  const handleToggleAll = () => {
    if (refundAll) {
      setSelectedItems([]);
      setRefundAll(false);
    } else {
      const allSelected = items.map(item => ({
        productId: item?.product?._id || item?.product?.id || item?.id,
        quantity: item.quantity || item.qty || 1,
        reason: 'quality_issue',
        name: item.name,
        price: item.price
      }));
      setSelectedItems(allSelected);
      setRefundAll(true);
    }
  };

  // Ask for camera permission on Android
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: t('cameraPermissionTitle', 'Camera Permission'),
            message: t('cameraPermissionMessage', 'App needs access to your camera'),
            buttonNeutral: t('askMeLater', 'Ask Me Later'),
            buttonNegative: t('cancel', 'Cancel'),
            buttonPositive: t('ok', 'OK'),
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  // Handle camera selection
  const handleLaunchCamera = async (index) => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert(t('error', 'Error'), t('cameraPermissionRequired', 'Camera permission is required'));
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1000,
      maxHeight: 1000
    };

    launchCamera(options, (response) => {
      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        const newImg = {
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `evidence_${Date.now()}.jpg`
        };

        setImages(prev => {
          const next = [...prev];
          next[index] = newImg;
          return next.filter(Boolean);
        });
      }
    });
  };

  // Handle gallery selection
  const handleLaunchGallery = (index) => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1000,
      maxHeight: 1000
    };

    launchImageLibrary(options, (response) => {
      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        const newImg = {
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `evidence_${Date.now()}.jpg`
        };

        setImages(prev => {
          const next = [...prev];
          next[index] = newImg;
          return next.filter(Boolean);
        });
      }
    });
  };

  const handleGridPress = (index) => {
    Alert.alert(
      t('chooseOption', 'Choose an option'),
      t('imageSourceMessage', 'Where would you like to select the evidence image from?'),
      [
        { text: t('takePhoto', 'Take Photo'), onPress: () => handleLaunchCamera(index) },
        { text: t('chooseFromGallery', 'Choose from Gallery'), onPress: () => handleLaunchGallery(index) },
        { text: t('cancel', 'Cancel'), style: 'cancel' }
      ]
    );
  };

  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, idx) => idx !== index));
  };

  // Submit Refund Request
  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      Alert.alert(t('error', 'Error'), t('refund_select_item_err', 'Please select at least one item for refund'));
      return;
    }

    if (!note.trim()) {
      Alert.alert(t('error', 'Error'), t('refund_note_required', 'Description/Note is required to explain the issue'));
      return;
    }

    const activeImages = images.filter(Boolean);
    if (activeImages.length < 3) {
      Alert.alert(t('error', 'Error'), t('refund_min_images_err', 'At least 3 images of the order are required as evidence proof'));
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('orderId', orderId);
      formData.append('note', note.trim());
      
      // Standardize payload key to match backend
      formData.append('items', JSON.stringify(selectedItems));

      activeImages.forEach((img, idx) => {
        formData.append('evidenceImages', {
          uri: Platform.OS === 'ios' ? img.uri.replace('file://', '') : img.uri,
          type: img.type || 'image/jpeg',
          name: img.name || `evidence_${idx}_${Date.now()}.jpg`
        });
      });

      console.log('📤 Submitting Refund Request via multipart/form-data...');
      
      const response = await apiClient.post('/user/refund-request', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      if (response?.data?.success) {
        Alert.alert(
          t('success', 'Success'),
          t('refund_submit_success', 'Your refund request was submitted successfully for review.'),
          [{ text: t('ok', 'OK'), onPress: () => navigation.pop(2) }]
        );
      } else {
        throw new Error(response?.data?.message || 'Submission failed');
      }
    } catch (err) {
      console.error('❌ Error submitting refund request:', err);
      Alert.alert(
        t('error', 'Error'),
        err?.response?.data?.message || err?.message || t('refund_submit_failed', 'Failed to submit refund request')
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Render 6 Grid Boxes
  const renderGridBoxes = () => {
    const grid = [];
    for (let i = 0; i < 6; i++) {
      const img = images[i];
      grid.push(
        <View key={i} style={styles.gridBox}>
          {img ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: img.uri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeBadge}
                onPress={() => handleRemoveImage(i)}
                activeOpacity={0.8}
              >
                <Trash2 size={12} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleGridPress(i)}
              activeOpacity={0.8}
            >
              <Plus size={20} color="#828282" />
              <Text style={styles.addButtonText}>{t('add', 'Add')}</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    return <View style={styles.gridContainer}>{grid}</View>;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('refund_portal', 'Refund Portal')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Step 1: Select Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('refund_step1', '1. Select Items for Refund')}</Text>
          
          <TouchableOpacity
            style={styles.allSelectorRow}
            onPress={handleToggleAll}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, refundAll && styles.checkboxActive]}>
              {refundAll && <Check size={14} color="#FFF" />}
            </View>
            <Text style={styles.allSelectorText}>{t('refund_all_items', 'Select All Items (Whole Order)')}</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {items.map((item, idx) => {
            const itemProdId = item?.product?._id || item?.product?.id || item?.id;
            const isSelected = !!selectedItems.find(si => si.productId === itemProdId);
            return (
              <TouchableOpacity
                key={itemProdId || idx}
                style={styles.itemRow}
                onPress={() => handleToggleItem(item)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                  {isSelected && <Check size={14} color="#FFF" />}
                </View>
                <View style={styles.itemMeta}>
                  <Text style={styles.itemName}>{getLocalizedText(item?.name, 'Item', currentLang)}</Text>
                  <Text style={styles.itemQty}>Qty: {item.quantity || item.qty || 1}</Text>
                </View>
                <Text style={styles.itemPrice}>
                  {((item.price || 0) * (item.quantity || item.qty || 1)).toFixed(2)} {currencySymbol}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Step 2: Upload Evidence */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('refund_step2', '2. Evidence Proof (Min 3 / Max 6)')}</Text>
          <Text style={styles.cardSubtitle}>
            {t('refund_evidence_desc', 'Please upload at least 3 photos clearly highlighting issues like packaging leaks, wrong items, or burnt food.')}
          </Text>

          {renderGridBoxes()}

          <View style={styles.badgeRow}>
            <Text style={styles.imageCountText}>
              Uploaded: <Text style={{ fontWeight: '800', color: images.length >= 3 ? '#2E7D32' : '#C62828' }}>{images.length}/6</Text>
            </Text>
            {images.length < 3 && (
              <Text style={styles.requiredBadge}>* At least 3 required</Text>
            )}
          </View>
        </View>

        {/* Step 3: Explanation */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('refund_step3', '3. Describe the Issue')}</Text>
          <TextInput
            style={styles.noteInput}
            multiline
            numberOfLines={4}
            value={note}
            onChangeText={setNote}
            placeholder={t('refund_note_placeholder', 'Please provide detailed info to help restaurant & admin audit the issue faster (e.g. food was fully burnt)...')}
            placeholderTextColor="#888"
          />
        </View>
      </ScrollView>

      {/* Action Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, (selectedItems.length === 0 || images.length < 3 || !note.trim()) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting || selectedItems.length === 0 || images.length < 3 || !note.trim()}
          activeOpacity={0.9}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              {t('submit_refund_claim', 'Submit Refund Claim')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    height: scale(56),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: scale(17),
    fontWeight: '700',
    color: '#111111',
  },
  scroll: {
    flex: 1,
    padding: SPACING.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    padding: scale(16),
    marginBottom: scale(16),
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  cardTitle: {
    fontSize: scale(14),
    fontWeight: '700',
    color: '#111111',
    marginBottom: scale(6),
  },
  cardSubtitle: {
    fontSize: scale(11.5),
    color: '#666666',
    lineHeight: scale(16),
    marginBottom: scale(16),
  },
  allSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(10),
  },
  allSelectorText: {
    fontSize: scale(13.5),
    fontWeight: '700',
    color: '#ed1c24',
    marginLeft: scale(10),
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F3F3',
    marginVertical: scale(6),
  },
  checkbox: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(6),
    borderWidth: 1.5,
    borderColor: '#CCCCCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    borderColor: '#ed1c24',
    backgroundColor: '#ed1c24',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(12),
    borderBottomWidth: 0.5,
    borderBottomColor: '#F3F3F3',
  },
  itemMeta: {
    flex: 1,
    marginLeft: scale(10),
  },
  itemName: {
    fontSize: scale(13),
    fontWeight: '600',
    color: '#333333',
  },
  itemQty: {
    fontSize: scale(11.5),
    color: '#828282',
    marginTop: scale(2),
  },
  itemPrice: {
    fontSize: scale(13),
    fontWeight: '700',
    color: '#111111',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: scale(10),
    marginBottom: scale(10),
  },
  gridBox: {
    width: wp(26),
    height: wp(26),
    borderRadius: scale(12),
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  addButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: scale(10),
    color: '#828282',
    fontWeight: '600',
    marginTop: scale(4),
  },
  previewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeBadge: {
    position: 'absolute',
    top: scale(4),
    right: scale(4),
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: scale(8),
  },
  imageCountText: {
    fontSize: scale(12),
    color: '#333333',
  },
  requiredBadge: {
    fontSize: scale(11.5),
    color: '#C62828',
    fontWeight: '600',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: scale(12),
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    fontSize: scale(13),
    color: '#111111',
    backgroundColor: '#FAFAFA',
    minHeight: scale(80),
    textAlignVertical: 'top',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    padding: scale(16),
  },
  submitButton: {
    height: scale(48),
    backgroundColor: '#ed1c24',
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  submitButtonText: {
    fontSize: scale(14),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
