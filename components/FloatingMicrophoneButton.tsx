import React from 'react';
import { TouchableOpacity, StyleSheet, View, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';

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
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          isRecording && styles.recordingButton,
          disabled && styles.disabledButton,
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
          color={COLORS.surface} 
        />
      </TouchableOpacity>
      {isRecording && (
        <View style={styles.recordingIndicatorContainer}>
           <View style={styles.recordingDot} />
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
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordingButton: {
    backgroundColor: COLORS.error,
  },
  disabledButton: {
    backgroundColor: COLORS.disabledBackground,
    shadowOpacity: 0,
    elevation: 0,
  },
  recordingIndicatorContainer: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: COLORS.surface,
    padding: 4,
    borderRadius: 12,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.error,
  },
});
