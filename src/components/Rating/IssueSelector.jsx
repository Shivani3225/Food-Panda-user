import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { CheckCircle, Circle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { scale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';

const ISSUE_TYPES = [
  { id: 'wrong_order', labelKey: 'issues.wrong_order', label: 'Wrong Order Delivered' },
  { id: 'missing_items', labelKey: 'issues.missing_items', label: 'Missing Items' },
  { id: 'cold_food', labelKey: 'issues.cold_food', label: 'Food Was Cold' },
  { id: 'poor_quality', labelKey: 'issues.poor_quality', label: 'Poor Quality' },
  { id: 'late_delivery', labelKey: 'issues.late_delivery', label: 'Late Delivery' },
  { id: 'poor_packaging', labelKey: 'issues.poor_packaging', label: 'Poor Packaging' },
  { id: 'rider_behavior', labelKey: 'issues.rider_behavior', label: 'Rider Behavior' },
  { id: 'other', labelKey: 'issues.other', label: 'Other Issue' },
];

const IssueSelector = ({ 
  selectedIssue = null,
  onIssueSelect,
  description = '',
  onDescriptionChange,
  label = 'Report an Issue'
}) => {
  const { t } = useTranslation();
  const [showDescription, setShowDescription] = useState(false);

  // Check if label is a translation key
  const translatedLabel = label && (label.startsWith('common.') || 
    label.startsWith('issues.') || 
    label.startsWith('feedback.'))
    ? t(label, label)
    : label;

  const handleIssueSelect = (issueId) => {
    onIssueSelect(issueId);
    setShowDescription(issueId === 'other' || issueId !== null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{translatedLabel}</Text>
      <Text style={styles.subtitle}>
        {t('issues.select_issue_subtitle', 'Select the issue you faced with this order')}
      </Text>

      <View style={styles.issueList}>
        {ISSUE_TYPES.map((issue) => {
          const isSelected = selectedIssue === issue.id;
          
          return (
            <TouchableOpacity
              key={issue.id}
              style={[
                styles.issueItem,
                isSelected && styles.issueItemSelected
              ]}
              onPress={() => handleIssueSelect(issue.id)}
              activeOpacity={0.7}
            >
              <View style={styles.issueContent}>
                {isSelected ? (
                  <CheckCircle size={22} color="#DC2626" fill="#DC2626" strokeWidth={2} />
                ) : (
                  <Circle size={22} color="#D1D5DB" strokeWidth={2} />
                )}
                <Text style={[
                  styles.issueLabel,
                  isSelected && styles.issueLabelSelected
                ]}>
                  {t(issue.labelKey, issue.label)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {(showDescription || selectedIssue) && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionLabel}>
            {t('issues.additional_details', 'Additional Details (Optional)')}
          </Text>
          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={onDescriptionChange}
            placeholder={t('issues.description_placeholder', 'Please provide more details about the issue...')}
            placeholderTextColor="#999999"
            multiline
            maxLength={300}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>
            {description.length}/300
          </Text>
        </View>
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
  issueList: {
    gap: SPACING.sm,
  },
  issueItem: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: scale(12),
    padding: SPACING.md,
    backgroundColor: '#FFFFFF',
  },
  issueItemSelected: {
    borderColor: '#E53935',
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  issueContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  issueLabel: {
    fontSize: FONT_SIZES.sm,
    color: '#374151',
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  issueLabelSelected: {
    color: '#DC2626',
    fontWeight: '700',
  },
  descriptionContainer: {
    marginTop: SPACING.md,
  },
  descriptionLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: SPACING.sm,
    letterSpacing: -0.2,
  },
  descriptionInput: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: scale(12),
    padding: SPACING.md,
    fontSize: FONT_SIZES.sm,
    color: '#1A1A1A',
    minHeight: scale(80),
    backgroundColor: '#FFFFFF',
    lineHeight: scale(20),
  },
  charCount: {
    fontSize: FONT_SIZES.xs,
    color: '#9CA3AF',
    marginTop: SPACING.xs,
    textAlign: 'right',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default IssueSelector;