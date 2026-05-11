import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { scale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';

const FeedbackInput = ({ 
  value = '', 
  onChangeText, 
  placeholder = 'Share your experience...',
  maxLength = 300,
  label = 'Feedback',
  showCharCount = true,
  required = false
}) => {
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);

  // Check if label is a translation key
  const translatedLabel = label && (label.startsWith('common.') || 
    label.startsWith('feedback.') || 
    label.startsWith('profile.'))
    ? t(label, label)
    : label;

  // Check if placeholder is a translation key
  const translatedPlaceholder = placeholder && (placeholder.startsWith('common.') || 
    placeholder.startsWith('feedback.') || 
    placeholder.startsWith('placeholder.'))
    ? t(placeholder, placeholder)
    : placeholder;

  // Helper text translation
  const helperText = t('feedback.helper_text', 'Your feedback helps us improve our service');

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>
          {translatedLabel}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
        {showCharCount && (
          <Text style={[
            styles.charCount,
            value.length >= maxLength && styles.charCountLimit
          ]}>
            {value.length}/{maxLength}
          </Text>
        )}
      </View>

      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={translatedPlaceholder}
        placeholderTextColor="#999999"
        multiline
        maxLength={maxLength}
        textAlignVertical="top"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />

      <Text style={styles.helperText}>
        {helperText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.2,
  },
  required: {
    color: '#E53935',
  },
  charCount: {
    fontSize: FONT_SIZES.xs,
    color: '#9CA3AF',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  charCountLimit: {
    color: '#E53935',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: scale(12),
    padding: SPACING.md,
    fontSize: FONT_SIZES.sm,
    color: '#1A1A1A',
    minHeight: scale(90),
    backgroundColor: '#FFFFFF',
    lineHeight: scale(20),
  },
  inputFocused: {
    borderColor: '#E53935',
    backgroundColor: '#FFFFFF',
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  helperText: {
    fontSize: FONT_SIZES.xs,
    color: '#9CA3AF',
    marginTop: SPACING.xs,
    fontStyle: 'normal',
    letterSpacing: 0.2,
  },
});

export default FeedbackInput;