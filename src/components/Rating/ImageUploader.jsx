import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Camera, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { scale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';

const ImageUploader = ({ 
  images = [], 
  onImagesChange, 
  maxImages = 5,
  label = 'Add Photos'
}) => {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);

  // Check if label is a translation key
  const translatedLabel = label && (label.startsWith('common.') || 
    label.startsWith('image_uploader.') || 
    label.startsWith('feedback.'))
    ? t(label, label)
    : label;

  const pickImages = async () => {
    if (images.length >= maxImages) {
      Alert.alert(
        t('image_uploader.limit_reached_title', 'Limit Reached'),
        t('image_uploader.limit_reached_message', `You can only upload up to ${maxImages} images.`)
      );
      return;
    }

    try {
      const options = {
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: maxImages - images.length,
        includeBase64: false,
      };

      const result = await launchImageLibrary(options);

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        Alert.alert(
          t('common.error', 'Error'),
          result.errorMessage || t('image_uploader.pick_error', 'Failed to pick images')
        );
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const newImages = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `image_${Date.now()}.jpg`,
          fileSize: asset.fileSize,
        }));

        onImagesChange([...images, ...newImages]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert(
        t('common.error', 'Error'),
        t('image_uploader.pick_error_retry', 'Failed to pick images. Please try again.')
      );
    }
  };

  const removeImage = (index) => {
    const updatedImages = images.filter((_, i) => i !== index);
    onImagesChange(updatedImages);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{translatedLabel}</Text>
      <Text style={styles.subtitle}>
        {t('image_uploader.images_selected', { current: images.length, max: maxImages })}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {images.map((image, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image source={{ uri: image.uri }} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeImage(index)}
              activeOpacity={0.8}
            >
              <X size={14} color="#FFFFFF" strokeWidth={3} />
            </TouchableOpacity>
          </View>
        ))}

        {images.length < maxImages && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={pickImages}
            activeOpacity={0.7}
          >
            <Camera size={24} color="#9CA3AF" strokeWidth={2} />
            <Text style={styles.addButtonText}>
              {t('image_uploader.add_photo', 'Add Photo')}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {images.length === 0 && (
        <Text style={styles.helperText}>
          {t('image_uploader.helper_text', 'Help others by sharing photos of your order')}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: scale(4),
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: FONT_SIZES.xs,
    color: '#6B7280',
    marginBottom: SPACING.sm,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  scrollContent: {
    paddingVertical: SPACING.xs,
    gap: SPACING.md,
  },
  imageContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(12),
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  removeButton: {
    position: 'absolute',
    top: scale(-4),
    right: scale(-4),
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  addButton: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(12),
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  addButtonText: {
    fontSize: FONT_SIZES.xs,
    color: '#6B7280',
    marginTop: SPACING.xs,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  helperText: {
    fontSize: FONT_SIZES.xs,
    color: '#9CA3AF',
    marginTop: SPACING.xs,
    fontStyle: 'normal',
    letterSpacing: 0.2,
  },
});

export default ImageUploader;