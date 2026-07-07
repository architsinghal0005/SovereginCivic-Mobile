import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, SafeAreaView as RNSafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MapComponent } from '../components/Map';
import { Grievance } from '../services/api';
import { SIZES, SHADOWS } from '../constants/theme';
import { useTheme } from '../utils/theme';
import { Timeline } from '../components/Timeline';
import { getTimelineForStatus } from '../utils/timeline';
import { CONFIG, getFullUrl } from '../constants/config';

interface ComplaintDetailsScreenProps {
  report: Grievance;
  onBack: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Road Infrastructure': '#7C3AED',
  'Water Supply':        '#0EA5E9',
  'Sewage Management':   '#78716C',
  'Garbage':             '#16A34A',
  'Street Lighting':     '#F59E0B',
  'Electricity':         '#EF4444',
  'Public Safety':       '#DC2626',
  'Other':               '#64748B',
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  PENDING:     { color: '#D97706', bg: '#FFFBEB', label: 'Pending' },
  IN_PROGRESS: { color: '#0EA5E9', bg: '#E0F2FE', label: 'In Progress' },
  RESOLVED:    { color: '#059669', bg: '#D1FAE5', label: 'Resolved' },
  ESCALATED:   { color: '#DC2626', bg: '#FEE2E2', label: 'Escalated' },
};

import { formatDateIST } from '../utils/date';

export default function ComplaintDetailsScreen({ report, onBack }: ComplaintDetailsScreenProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mapError, setMapError] = useState(false);

  const categoryColor = CATEGORY_COLORS[report.category] ?? CATEGORY_COLORS['Other'];
  const statusConfig = STATUS_CONFIG[report.status] ?? { color: '#64748B', bg: isDark ? '#334155' : '#F1F5F9', label: report.status };

  let displayDescription = report.description || 'No description provided.';
  if (typeof report.description === 'string' && report.description.trim().startsWith('{') && report.description.trim().endsWith('}')) {
    try {
      const parsed = JSON.parse(report.description);
      if ('transcript' in parsed) {
        displayDescription = parsed.transcript?.trim() ? parsed.transcript : 'Voice report submitted (processing transcript...)';
      }
    } catch (e) {
      // Fallback
    }
  }

  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  const toggleAudio = async () => {
    if (!report.audioUrl) return;

    if (isPlaying) {
      if (sound) {
        await sound.pauseAsync();
      }
      setIsPlaying(false);
    } else {
      if (sound) {
        await sound.playAsync();
      } else {
        try {
          const audioUriToPlay = getFullUrl(report.audioUrl);
          const { sound: newSound } = await Audio.Sound.createAsync(
            { 
              uri: audioUriToPlay,
              headers: { 'ngrok-skip-browser-warning': 'true' }
            },
            { shouldPlay: true }
          );
          newSound.setOnPlaybackStatusUpdate((status: any) => {
            if (status.isLoaded && status.didJustFinish) {
              setIsPlaying(false);
              newSound.setPositionAsync(0);
            }
          });
          setSound(newSound);
        } catch (err) {
          console.error("Failed to load or play audio", err);
          return;
        }
      }
      setIsPlaying(true);
    }
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[
        styles.header, 
        { 
          backgroundColor: colors.surface, 
          borderBottomColor: colors.border,
          paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + SIZES.sm,
        }
      ]}>
        <TouchableOpacity onPress={onBack} style={[styles.backButton, { backgroundColor: colors.background }]} accessibilityLabel="Go back">
          <Text style={[styles.backArrow, { color: colors.primary }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>Complaint Details</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>ID: {report.id}</Text>
        </View>
        <View style={styles.refreshButton} />
      </View>

      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: Math.max(insets.bottom + 20, SIZES.xxl) }]} bounces={false}>
        <View style={styles.topSection}>
          <View style={[styles.statusChip, { backgroundColor: isDark ? `${statusConfig.color}20` : statusConfig.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
          <Text style={[styles.timestamp, { color: colors.textSecondary }]}>{formatDateIST(report.createdAt)}</Text>
        </View>

        <View style={styles.categorySection}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
            <Text style={styles.categoryText}>{report.category}</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>Status Timeline</Text>
          <Timeline steps={getTimelineForStatus(report.status)} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="text" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
          </View>
          <Text style={[styles.descriptionText, { color: colors.text }]}>
            {displayDescription}
          </Text>
        </View>

        {report.imageUrl && (
          <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
            <View style={styles.sectionHeaderRow}>
              <MaterialCommunityIcons name="image" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Image</Text>
            </View>
            <Image 
              source={{ 
                uri: getFullUrl(report.imageUrl),
                headers: { 'ngrok-skip-browser-warning': 'true' }
              }} 
              style={[styles.image, { backgroundColor: colors.border }]} 
              resizeMode="cover" 
            />
          </View>
        )}

        {report.audioUrl && (
          <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
            <View style={styles.sectionHeaderRow}>
              <MaterialCommunityIcons name="microphone" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Audio</Text>
            </View>
            <TouchableOpacity style={[styles.audioButton, { backgroundColor: colors.primary }]} onPress={toggleAudio} activeOpacity={0.7}>
              <MaterialCommunityIcons name={isPlaying ? "pause" : "play"} size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.audioButtonText}>{isPlaying ? 'Pause Audio' : 'Play Audio'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {(report.lat != null && report.lng != null) && (
          <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
            <View style={styles.sectionHeaderRow}>
              <MaterialCommunityIcons name="map-marker" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Location (GPS)</Text>
            </View>
            {!mapError ? (
              <View style={styles.mapContainer} accessible={true} accessibilityLabel="Map showing the complaint location">
                <MapComponent
                  latitude={Number(report.lat)}
                  longitude={Number(report.lng)}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                />
              </View>
            ) : (
              <View>
                <Text style={[styles.coords, { color: colors.textSecondary }]}>Latitude: {report.lat}</Text>
                <Text style={[styles.coords, { color: colors.textSecondary }]}>Longitude: {report.lng}</Text>
              </View>
            )}
          </View>
        )}

        {report.citizenId && (
          <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
            <View style={styles.sectionHeaderRow}>
              <MaterialCommunityIcons name="account" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Citizen Info</Text>
            </View>
            <Text style={[styles.citizenText, { color: colors.textSecondary }]}>Citizen ID: {report.citizenId}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    ...SHADOWS.small,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  backArrow: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
  },
  container: {
    flexGrow: 1,
    padding: SIZES.md,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  timestamp: {
    fontSize: 13,
  },
  categorySection: {
    alignItems: 'flex-start',
    marginBottom: SIZES.lg,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  card: {
    borderRadius: SIZES.md,
    padding: SIZES.lg,
    marginBottom: SIZES.md,
    ...SHADOWS.small,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: SIZES.sm,
    marginTop: SIZES.xs,
  },
  audioButton: {
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
    borderRadius: SIZES.radius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.xs,
  },
  audioButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  mapContainer: {
    height: 200,
    width: '100%',
    borderRadius: SIZES.sm,
    overflow: 'hidden',
    marginTop: SIZES.xs,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  coords: {
    fontSize: 14,
    marginBottom: 4,
  },
  citizenText: {
    fontSize: 14,
  },
});
