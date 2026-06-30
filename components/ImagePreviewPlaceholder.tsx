import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';

interface ImagePreviewPlaceholderProps {
  label?: string;
  imageUri?: string | null;
  onPress?: () => void;
  onRemove?: () => void;
}

export const ImagePreviewPlaceholder: React.FC<ImagePreviewPlaceholderProps> = ({
  label = 'Tap to take a photo',
  imageUri,
  onPress,
  onRemove,
}) => {
  return (
    <View style={styles.container}>
      {imageUri ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
          <View style={styles.overlayControls}>
            <TouchableOpacity style={styles.controlButton} onPress={onPress} accessibilityLabel="Retake photo">
              <MaterialCommunityIcons name="camera-retake" size={24} color={COLORS.surface} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.controlButton, styles.removeButton]} onPress={onRemove} accessibilityLabel="Remove photo">
              <MaterialCommunityIcons name="delete" size={24} color={COLORS.surface} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.placeholderContainer} onPress={onPress} activeOpacity={0.7}>
          <MaterialCommunityIcons name="camera-outline" size={48} color={COLORS.disabled} />
          <Text style={styles.text}>{label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 250,
    marginVertical: SIZES.md,
    borderRadius: SIZES.md,
    overflow: 'hidden',
  },
  placeholderContainer: {
    flex: 1,
    backgroundColor: COLORS.disabledBackground,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: SIZES.md,
  },
  text: {
    marginTop: SIZES.sm,
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  imageContainer: {
    flex: 1,
    borderRadius: SIZES.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlayControls: {
    position: 'absolute',
    bottom: SIZES.md,
    right: SIZES.md,
    flexDirection: 'row',
    gap: SIZES.sm,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    backgroundColor: 'rgba(220, 38, 38, 0.8)', // Semi-transparent error color
  }
});
