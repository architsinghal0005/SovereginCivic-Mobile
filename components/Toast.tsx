import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useToast } from '../hooks/useToast';

export const ToastContainer: React.FC = () => {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} message={toast.message} type={toast.type} />
      ))}
    </View>
  );
};

const ToastItem: React.FC<{ message: string; type: 'success' | 'error' | 'info' }> = ({ message, type }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    };
  }, []);

  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return COLORS.success;
      case 'error': return COLORS.error;
      default: return COLORS.primary;
    }
  };

  return (
    <Animated.View 
      style={[
        styles.toast, 
        { backgroundColor: getBackgroundColor(), opacity, transform: [{ translateY }] }
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: SIZES.lg,
    right: SIZES.lg,
    zIndex: 9999,
    alignItems: 'center',
    gap: SIZES.sm,
  },
  toast: {
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.lg,
    borderRadius: SIZES.radius,
    minWidth: '80%',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  text: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
