import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { SIZES, SHADOWS } from '../constants/theme';
import { useTheme } from '../utils/theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const PrimaryButton = React.memo<PrimaryButtonProps>(({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: colors.primary, shadowColor: colors.cardShadow },
        (disabled || loading) && { backgroundColor: colors.disabledBackground, shadowOpacity: 0, elevation: 0 },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator color={colors.textSecondary} />
      ) : (
        <Text style={[
          styles.text, 
          { color: colors.surface },
          (disabled || loading) && { color: colors.disabled }, 
          textStyle
        ]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  button: {
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: SIZES.touchTarget,
    width: '100%',
    ...SHADOWS.small,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
