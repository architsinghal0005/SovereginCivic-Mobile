import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SIZES } from '../constants/theme';
import { useTheme } from '../utils/theme';
import type { RootStackParamList } from '../navigation/types';

type WelcomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const features = [
  {
    icon: 'map-marker-radius' as const,
    title: 'Live GPS Location',
    description: 'Automatically captures the complaint location.',
  },
  {
    icon: 'microphone-outline' as const,
    title: 'Voice Complaint',
    description: 'Report problems without typing.',
  },
  {
    icon: 'image-outline' as const,
    title: 'Image Evidence',
    description: 'Attach photos for better verification.',
  },
  {
    icon: 'robot-outline' as const,
    title: 'AI Smart Processing',
    description: 'AI categorizes complaints and identifies recurring civic issues.',
  },
];

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentOffset = useRef(new Animated.Value(24)).current;
  const illustrationScale = useRef(new Animated.Value(0.94)).current;

  const isCompact = width < 420;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(contentOffset, {
        toValue: 0,
        duration: 550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(illustrationScale, {
        toValue: 1,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [contentOffset, contentOpacity, illustrationScale]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: isCompact ? SIZES.md : SIZES.lg, paddingBottom: SIZES.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: colors.cardShadow,
              opacity: contentOpacity,
              transform: [{ translateY: contentOffset }],
            },
          ]}
        >
          <View style={styles.topSection}>
            <View style={[styles.logoBadge, { backgroundColor: colors.primary + '14' }]}>
              <MaterialCommunityIcons name="domain" size={34} color={colors.primary} />
            </View>

            <Text style={[styles.title, { color: colors.text }]}>SovereignCivic</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              AI-powered Civic Grievance Reporting System
            </Text>
          </View>

          <Animated.View
            style={[
              styles.heroWrap,
              {
                transform: [{ scale: illustrationScale }],
              },
            ]}
          >
            <View style={[styles.heroPanel, { backgroundColor: colors.primary + '0D' }]}>
              <View style={[styles.heroGlow, { backgroundColor: colors.primary + '1A' }]} />
              <View style={styles.heroCloud} />

              <View style={styles.cityBand}>
                <View style={[styles.road, { backgroundColor: colors.primary }]} />
                <View style={[styles.roadDash, { backgroundColor: colors.surface }]} />
                <View style={[styles.waterBand, { backgroundColor: colors.primary + '26' }]} />

                <View style={[styles.building, styles.buildingTall, { backgroundColor: colors.primary }]} />
                <View style={[styles.building, styles.buildingMid, { backgroundColor: colors.primaryHover }]} />
                <View style={[styles.building, styles.buildingShort, { backgroundColor: colors.primary }]} />
              </View>

              <View style={styles.heroCenterBadge}>
                <View style={[styles.heroCenterRing, { borderColor: colors.primary + '33' }]} />
                <View style={[styles.heroCenterCore, { backgroundColor: colors.surface }]}>
                  <MaterialCommunityIcons name="account-group" size={42} color={colors.primary} />
                </View>
              </View>

              <View style={[styles.pulseChip, styles.pulseTopLeft, { backgroundColor: colors.surface }]}>
                <MaterialCommunityIcons name="water" size={18} color={colors.primary} />
                <Text style={[styles.pulseText, { color: colors.textSecondary }]}>Water</Text>
              </View>
              <View style={[styles.pulseChip, styles.pulseTopRight, { backgroundColor: colors.surface }]}>
                <MaterialCommunityIcons name="lightbulb-outline" size={18} color={colors.primary} />
                <Text style={[styles.pulseText, { color: colors.textSecondary }]}>Lights</Text>
              </View>
              <View style={[styles.pulseChip, styles.pulseBottomLeft, { backgroundColor: colors.surface }]}>
                <MaterialCommunityIcons name="road-variant" size={18} color={colors.primary} />
                <Text style={[styles.pulseText, { color: colors.textSecondary }]}>Roads</Text>
              </View>
              <View style={[styles.pulseChip, styles.pulseBottomRight, { backgroundColor: colors.surface }]}>
                <MaterialCommunityIcons name="robot-outline" size={18} color={colors.primary} />
                <Text style={[styles.pulseText, { color: colors.textSecondary }]}>AI</Text>
              </View>
            </View>
          </Animated.View>

          <View style={styles.aboutSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About SovereignCivic</Text>
            <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
              SovereignCivic empowers citizens to report civic issues using voice, images and live location. The platform automatically classifies complaints using AI, detects recurring infrastructure problems through graph analytics, and routes them to the appropriate authorities for faster resolution.
            </Text>
          </View>

          <View style={styles.featuresSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Features</Text>
            <View style={styles.featuresGrid}>
              {features.map((feature) => (
                <View
                  key={feature.title}
                  style={[
                    styles.featureCard,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                    isCompact ? styles.featureCardCompact : null,
                  ]}
                >
                  <View style={[styles.featureIconWrap, { backgroundColor: colors.primary + '12' }]}>
                    <MaterialCommunityIcons name={feature.icon} size={24} color={colors.primary} />
                  </View>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>{feature.title}</Text>
                  <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                    {feature.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <Pressable
            onPress={() => navigation.replace('Main')}
            android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
            style={({ pressed }) => [
              styles.ctaButton,
              { backgroundColor: colors.primary, shadowColor: colors.cardShadow },
              pressed && styles.ctaPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Get started and open the main dashboard"
          >
            <Text style={[styles.ctaText, { color: colors.surface }]}>Get Started</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: SIZES.lg,
  },
  card: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    borderRadius: 28,
    borderWidth: 1,
    padding: SIZES.lg,
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  logoBadge: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.md,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: SIZES.xs,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 420,
  },
  heroWrap: {
    marginBottom: SIZES.lg,
  },
  heroPanel: {
    borderRadius: 28,
    minHeight: 280,
    overflow: 'hidden',
    padding: SIZES.lg,
    justifyContent: 'center',
  },
  heroGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -40,
    right: -30,
  },
  heroCloud: {
    position: 'absolute',
    width: 90,
    height: 24,
    borderRadius: 12,
    top: 24,
    left: 28,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  cityBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 98,
  },
  road: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 22,
  },
  roadDash: {
    position: 'absolute',
    width: 92,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    bottom: 8,
  },
  waterBand: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 22,
    height: 16,
    borderRadius: 10,
  },
  building: {
    position: 'absolute',
    bottom: 22,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  buildingTall: {
    left: 32,
    width: 54,
    height: 88,
    opacity: 0.95,
  },
  buildingMid: {
    left: 102,
    width: 42,
    height: 64,
    opacity: 0.9,
  },
  buildingShort: {
    right: 34,
    width: 62,
    height: 56,
    opacity: 0.88,
  },
  heroCenterBadge: {
    alignSelf: 'center',
    width: 148,
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCenterRing: {
    position: 'absolute',
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 1,
  },
  heroCenterCore: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  pulseChip: {
    position: 'absolute',
    minWidth: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  pulseText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pulseTopLeft: {
    top: 42,
    left: 24,
  },
  pulseTopRight: {
    top: 42,
    right: 24,
  },
  pulseBottomLeft: {
    bottom: 28,
    left: 24,
  },
  pulseBottomRight: {
    bottom: 28,
    right: 24,
  },
  aboutSection: {
    marginBottom: SIZES.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: SIZES.sm,
  },
  aboutText: {
    fontSize: 15,
    lineHeight: 24,
  },
  featuresSection: {
    marginBottom: SIZES.lg,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SIZES.md,
  },
  featureCard: {
    width: '48%',
    borderRadius: 22,
    borderWidth: 1,
    padding: SIZES.md,
    minHeight: 156,
  },
  featureCardCompact: {
    width: '100%',
  },
  featureIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.sm,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 13,
    lineHeight: 20,
  },
  ctaButton: {
    minHeight: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  ctaPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.95,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});