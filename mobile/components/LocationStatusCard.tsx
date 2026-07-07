import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SIZES, SHADOWS } from '../constants/theme';
import { useTheme } from '../utils/theme';

export type GPSStatus = 'searching' | 'acquired' | 'denied' | 'off';

interface LocationStatusCardProps {
  status: GPSStatus;
}

export const LocationStatusCard = React.memo<LocationStatusCardProps>(({ status }) => {
  const { colors } = useTheme();

  const getStatusInfo = () => {
    switch (status) {
      case 'acquired':
        return {
          icon: 'crosshairs-gps',
          color: colors.success,
          text: 'GPS Location Acquired',
          bgColor: colors.surface,
          borderColor: colors.success,
        };
      case 'searching':
        return {
          icon: 'crosshairs-question',
          color: colors.warning,
          text: 'Acquiring GPS Signal...',
          bgColor: colors.warningBackground,
          borderColor: colors.warning,
        };
      case 'denied':
        return {
          icon: 'crosshairs-off',
          color: colors.error,
          text: 'Location Access Denied',
          bgColor: colors.errorBackground,
          borderColor: colors.error,
        };
      case 'off':
      default:
        return {
          icon: 'crosshairs-off',
          color: colors.disabled,
          text: 'GPS is Disabled',
          bgColor: colors.disabledBackground,
          borderColor: colors.border,
        };
    }
  };

  const info = getStatusInfo();

  return (
    <View style={[styles.container, { backgroundColor: info.bgColor, borderColor: info.borderColor, shadowColor: colors.cardShadow }]}>
      <MaterialCommunityIcons name={info.icon as any} size={24} color={info.color} />
      <Text style={[styles.text, { color: info.color }]}>{info.text}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.md,
    borderRadius: SIZES.radius,
    marginVertical: SIZES.sm,
    borderWidth: 1,
    ...SHADOWS.small,
  },
  text: {
    marginLeft: SIZES.sm,
    fontSize: 14,
    fontWeight: '600',
  },
});
