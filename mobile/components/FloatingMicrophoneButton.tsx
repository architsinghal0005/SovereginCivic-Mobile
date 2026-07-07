import React from 'react';
import { TouchableOpacity, StyleSheet, View, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SIZES } from '../constants/theme';
import { useTheme } from '../utils/theme';

interface FloatingMicrophoneButtonProps {
  onPress: () => void;
  isRecording?: boolean;
  disabled?: boolean;
}

export const FloatingMicrophoneButton: React.FC<FloatingMicrophoneButtonProps> = ({
  onPress,
  isRecording = false,
  disabled = false,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: colors.primary, shadowColor: colors.text },
          isRecording && { backgroundColor: colors.error },
          disabled && { backgroundColor: colors.disabledBackground, shadowOpacity: 0, elevation: 0 },
        ]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={isRecording ? "Stop Recording" : "Start Recording"}
        accessibilityState={{ disabled }}
      >
        <MaterialCommunityIcons 
          name={isRecording ? "stop" : "microphone"} 
          size={48} 
          color={colors.surface} 
        />
      </TouchableOpacity>
      {isRecording && (
        <View style={[styles.recordingIndicatorContainer, { backgroundColor: colors.surface }]}>
           <View style={[styles.recordingDot, { backgroundColor: colors.error }]} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SIZES.xl,
  },
  button: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordingIndicatorContainer: {
    position: 'absolute',
    top: -10,
    right: -10,
    padding: 4,
    borderRadius: 12,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
