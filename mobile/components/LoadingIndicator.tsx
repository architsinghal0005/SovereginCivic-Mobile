import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SIZES } from '../constants/theme';
import { useTheme } from '../utils/theme';

interface LoadingIndicatorProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  message, 
  fullScreen = false 
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, fullScreen && [styles.fullScreen, { backgroundColor: colors.background }]]}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message && <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SIZES.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
  },
  message: {
    marginTop: SIZES.sm,
    fontSize: 14,
  },
});
