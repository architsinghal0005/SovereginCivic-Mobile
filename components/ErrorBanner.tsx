import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';

interface ErrorBannerProps {
  message: string;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message }) => {
  if (!message) return null;

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="alert-circle" size={20} color={COLORS.error} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorBackground,
    padding: SIZES.sm,
    borderRadius: SIZES.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
    marginVertical: SIZES.sm,
  },
  text: {
    marginLeft: SIZES.sm,
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});
