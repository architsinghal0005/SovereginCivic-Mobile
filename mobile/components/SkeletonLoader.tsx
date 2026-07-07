import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../utils/theme';

interface SkeletonLoaderProps {
  style?: ViewStyle;
}

export const SkeletonLoader = ({ style }: SkeletonLoaderProps) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const { colors } = useTheme();

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View style={[styles.skeleton, { backgroundColor: colors.border }, style, { opacity }]} />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    borderRadius: 4,
  },
});
