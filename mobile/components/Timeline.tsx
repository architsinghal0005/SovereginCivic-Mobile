import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import { TimelineStep } from '../utils/timeline';

interface TimelineProps {
  steps: TimelineStep[];
}

const TimelineItem = ({ step, index, isLast }: { step: TimelineStep; index: number; isLast: boolean }) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: 1,
      duration: 400,
      delay: index * 150, // Staggered animation
      useNativeDriver: true,
    }).start();
  }, [animValue, index]);

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0]
  });

  const opacity = animValue;

  return (
    <Animated.View style={[styles.stepContainer, { opacity, transform: [{ translateY }] }]}>
      <View style={styles.indicatorContainer}>
        <View style={[styles.dot, step.completed && styles.dotCompleted]}>
          {step.completed && <Text style={styles.checkmark}>✓</Text>}
        </View>
        {!isLast && <View style={[styles.line, step.completed && styles.lineCompleted]} />}
      </View>
      <View style={styles.labelContainer}>
        <Text style={[styles.label, step.current && styles.labelCurrent, !step.completed && styles.labelPending]}>
          {step.label}
        </Text>
      </View>
    </Animated.View>
  );
};

export const Timeline = ({ steps }: TimelineProps) => {
  return (
    <View style={styles.container}>
      {steps.map((step, index) => (
        <TimelineItem 
          key={step.id} 
          step={step} 
          index={index} 
          isLast={index === steps.length - 1} 
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SIZES.sm,
  },
  stepContainer: {
    flexDirection: 'row',
  },
  indicatorContainer: {
    alignItems: 'center',
    width: 30,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  dotCompleted: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  checkmark: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginVertical: -2,
    minHeight: 25,
  },
  lineCompleted: {
    backgroundColor: COLORS.primary,
  },
  labelContainer: {
    flex: 1,
    paddingLeft: SIZES.sm,
    paddingBottom: SIZES.lg,
  },
  label: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: -2,
  },
  labelCurrent: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  labelPending: {
    color: COLORS.textSecondary,
  },
});
