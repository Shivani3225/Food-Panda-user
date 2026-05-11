import React, { memo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { scale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';

export const SearchBar = memo(({ value, onChangeText, placeholder = 'Search Dish Name....' }) => {
  const { t } = useTranslation();
  
  // Check if placeholder is a translation key
  const translatedPlaceholder = placeholder && (placeholder.startsWith('common.') || 
    placeholder.startsWith('home.') || 
    placeholder.startsWith('search.'))
    ? t(placeholder, placeholder)
    : placeholder;

  return (
    <View style={styles.searchBox}>
      <Search size={18} color="#9AA0A6" />
      <TextInput
        style={styles.searchInput}
        placeholder={translatedPlaceholder}
        placeholderTextColor="#9AA0A6"
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
});

export const CategoryPills = memo(({ categories, activeCategory, onCategoryPress }) => {
  const { t } = useTranslation();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.catRow}
    >
      {(categories || []).map(cat => {
        // Handle both string and object category formats
        const categoryId = typeof cat === 'object' ? cat.id : cat;
        const categoryName = typeof cat === 'object' ? cat.name : cat;
        const categoryNameKey = typeof cat === 'object' ? cat.nameKey : null;
        
        // Get translated category name
        let displayName = categoryName;
        if (categoryNameKey) {
          displayName = t(categoryNameKey, categoryName);
        } else if (typeof cat === 'string') {
          // If category is a string, try to translate it using categories prefix
          displayName = t(`categories.${cat.toLowerCase()}`, cat);
        }
        
        return (
          <TouchableOpacity key={categoryId} onPress={() => onCategoryPress(categoryId)}>
            <View
              style={[
                styles.catPill,
                activeCategory === categoryId && styles.catPillActive,
              ]}
            >
              <Text
                style={[
                  styles.catText,
                  activeCategory === categoryId && styles.catTextActive,
                ]}
              >
                {displayName}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  searchBox: {
    margin: SPACING.lg,
    backgroundColor: '#F2F4F7',
    borderRadius: scale(14),
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    color: '#111',
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    paddingVertical: 0,
  },
  catRow: {
    paddingLeft: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  catPill: {
    marginRight: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: scale(9),
    borderRadius: scale(18),
    backgroundColor: '#F2F4F7',
  },
  catPillActive: {
    backgroundColor: '#FF3D3D',
  },
  catText: {
    color: '#6F6F6F',
    fontWeight: '800',
    fontSize: FONT_SIZES.xs,
  },
  catTextActive: {
    color: '#FFF',
  },
});