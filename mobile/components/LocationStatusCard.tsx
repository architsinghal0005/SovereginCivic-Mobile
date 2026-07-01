import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

export type GPSStatus = 'searching' | 'acquired' | 'denied' | 'off';

interface LocationStatusCardProps {
  status: GPSStatus;
}

export const LocationStatusCard = React.memo<LocationStatusCardProps>(({ status }) => {
  const getStatusInfo = () => {
    switch (status) {
      case 'acquired':
        return {
          icon: 'crosshairs-gps',
          color: COLORS.success,
          text: 'GPS Location Acquired',
          bgColor: COLORS.surface,
          borderColor: COLORS.success,
        };
      case 'searching':
        return {
          icon: 'crosshairs-question',
          color: COLORS.warning,
          text: 'Acquiring GPS Signal...',
          bgColor: COLORS.warningBackground,
          borderColor: COLORS.warning,
        };
      case 'denied':
        return {
          icon: 'crosshairs-off',
          color: COLORS.error,
          text: 'Location Access Denied',
          bgColor: COLORS.errorBackground,
          borderColor: COLORS.error,
        };
      case 'off':
      default:
        return {
          icon: 'crosshairs-off',
          color: COLORS.disabled,
          text: 'GPS is Disabled',
          bgColor: COLORS.disabledBackground,
          borderColor: COLORS.border,
        };
    }
  };

  const info = getStatusInfo();

  return (
    <View style={[styles.container, { backgroundColor: info.bgColor, borderColor: info.borderColor }]}>
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
