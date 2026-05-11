import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { TextInput as PaperTextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Material UI TextInput Component with External Label
 * Supports single line and multiline inputs
 */
const MaterialTextInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  mode = 'outlined',
  secureTextEntry = false,
  error = false,
  errorText = '',
  keyboardType = 'default',
  showPasswordToggle = false,
  style,
  autoCapitalize = 'sentences',
  multiline = false,           
  numberOfLines = 1,   
  ...rest
}) => {
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Check if label is a translation key
  const translatedLabel = label && (label.startsWith('common.') || 
    label.startsWith('auth.') || 
    label.startsWith('profile.') ||
    label.startsWith('validation.'))
    ? t(label, label)
    : label;

  // Check if placeholder is a translation key
  const translatedPlaceholder = placeholder && (placeholder.startsWith('common.') || 
    placeholder.startsWith('auth.') || 
    placeholder.startsWith('profile.') ||
    placeholder.startsWith('placeholder.'))
    ? t(placeholder, placeholder)
    : placeholder;

  // Check if errorText is a translation key
  const translatedErrorText = errorText && (errorText.startsWith('common.') || 
    errorText.startsWith('validation.') || 
    errorText.startsWith('auth.'))
    ? t(errorText, errorText)
    : errorText;

  return (
    <View style={[styles.container, style]}>
      {/* External Label (above input) */}
      {translatedLabel && (
        <Text style={styles.externalLabel}>{translatedLabel}</Text>
      )}

      <PaperTextInput
        // No internal label to avoid duplication
        value={value}
        onChangeText={onChangeText}
        placeholder={translatedPlaceholder}
        mode={mode}
        secureTextEntry={showPasswordToggle ? !showPassword : secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        error={error}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error && styles.inputError,
          multiline && styles.inputMultiline,
        ]}
        theme={{
          colors: {
            primary: '#000000',
            error: '#ed1c24',
            placeholder: '#9E9E9E',
            text: '#000000',
            background: isFocused ? '#FFFFFF' : '#F2F2F2',
          },
          roundness: 12,
        }}
        outlineColor="#E0E0E0"
        activeOutlineColor="#FF3B30"
        textColor="#000000"
        cursorColor="#ed1c24"
        selectionColor="rgba(237, 28, 36, 0.3)"
        contentStyle={[
          styles.inputContent,
          multiline && styles.inputContentMultiline,
        ]}
        right={
          showPasswordToggle && !multiline ? (
            <PaperTextInput.Icon
              icon={() => (
                <TouchableOpacity
                  onPress={() => setShowPassword(prev => !prev)}
                >
                  <Image
                    source={
                      showPassword
                        ? require('../../assets/icons/hide.png')
                        : require('../../assets/icons/view.png')
                    }
                    style={styles.eyeIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              )}
            />
          ) : null
        }
        {...rest}
      />

      {/* Error Text */}
      {error && translatedErrorText ? (
        <Text style={styles.errorText}>{translatedErrorText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  // External label above input
  externalLabel: {
    fontSize: 13,
    color: '#555',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#FFFFFF',
    fontSize: 14,
  },
  inputFocused: {
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    backgroundColor: '#FFF5F5',
  },
  // Multiline specific styles
  inputMultiline: {
    minHeight: 100,
    maxHeight: 200,
  },
  inputContent: {
    paddingHorizontal: 14,
  },
  inputContentMultiline: {
    paddingTop: 12,
    paddingBottom: 12,
  },
  eyeIcon: {
    width: 18,
    height: 18,
    tintColor: '#9AA0A6',
  },
  errorText: {
    color: '#ed1c24',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
  },
});

export default MaterialTextInput;