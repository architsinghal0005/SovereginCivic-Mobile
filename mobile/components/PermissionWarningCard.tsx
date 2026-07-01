import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import { PrimaryButton } from './PrimaryButton';

interface PermissionWarningCardProps {
  onGrantPermission: () => void;
  title?: string;
  description?: string;
}

export const PermissionWarningCard: React.FC<PermissionWarningCardProps> = ({
  onGrantPermission,
  title = "Permissions Required",
  description = "This application requires Camera, Microphone, and Location access to function properly in public service contexts.",
}) => {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="shield-alert" size={48} color={COLORS.warning} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <PrimaryButton title="Grant Permissions" onPress={onGrantPermission} style={styles.button} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    padding: SIZES.lg,
    borderRadius: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.warning,
    alignItems: 'center',
    marginVertical: SIZES.md,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SIZES.sm,
    marginBottom: SIZES.xs,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.md,
    lineHeight: 20,
  },
  button: {
    marginTop: SIZES.sm,
  },
});
