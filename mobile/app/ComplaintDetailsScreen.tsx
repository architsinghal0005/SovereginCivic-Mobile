import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Platform, StatusBar } from 'react-native';
import { Audio } from 'expo-av';
import MapView, { Marker } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Grievance } from '../services/api';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { Timeline } from '../components/Timeline';
import { getTimelineForStatus } from '../utils/timeline';

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
};

function formatDate(isoString: string | null): string {
  if (!isoString) return 'Unknown date';
  try {
    const date = new Date(isoString.split('[')[0]);
    return date.toLocaleString();
  } catch {
    return 'Unknown date';
  }
}

export default function ComplaintDetailsScreen({ report, onBack }: ComplaintDetailsScreenProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mapError, setMapError] = useState(false);

  const categoryColor = CATEGORY_COLORS[report.category] ?? CATEGORY_COLORS['Other'];
  const statusConfig = STATUS_CONFIG[report.status] ?? { color: '#64748B', bg: '#F1F5F9', label: report.status };

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
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: report.audioUrl },
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} accessibilityLabel="Go back">
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Complaint Details</Text>
          <Text style={styles.headerSubtitle}>ID: {report.id}</Text>
        </View>
        <View style={styles.refreshButton} />
      </View>

      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        <View style={styles.topSection}>
          <View style={[styles.statusChip, { backgroundColor: statusConfig.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
          <Text style={styles.timestamp}>{formatDate(report.createdAt)}</Text>
        </View>

        <View style={styles.categorySection}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
            <Text style={styles.categoryText}>{report.category}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Status Timeline</Text>
          <Timeline steps={getTimelineForStatus(report.status)} />
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="text" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Description</Text>
          </View>
          <Text style={styles.descriptionText}>
            {report.description || 'No description provided.'}
          </Text>
        </View>

        {report.imageUrl && (
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <MaterialCommunityIcons name="image" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Image</Text>
            </View>
            <Image source={{ uri: report.imageUrl }} style={styles.image} resizeMode="cover" />
          </View>
        )}

        {report.audioUrl && (
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <MaterialCommunityIcons name="microphone" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Audio</Text>
            </View>
            <TouchableOpacity style={styles.audioButton} onPress={toggleAudio} activeOpacity={0.7}>
              <MaterialCommunityIcons name={isPlaying ? "pause" : "play"} size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.audioButtonText}>{isPlaying ? 'Pause Audio' : 'Play Audio'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {(report.lat != null && report.lng != null) && (
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <MaterialCommunityIcons name="map-marker" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Location (GPS)</Text>
            </View>
            {!mapError ? (
              <View style={styles.mapContainer} accessible={true} accessibilityLabel="Map showing the complaint location">
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: Number(report.lat),
                    longitude: Number(report.lng),
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                >
                  <Marker 
                    coordinate={{ latitude: Number(report.lat), longitude: Number(report.lng) }} 
                    title="Complaint Location"
                  />
                </MapView>
              </View>
            ) : (
              <View>
                <Text style={styles.coords}>Latitude: {report.lat}</Text>
                <Text style={styles.coords}>Longitude: {report.lng}</Text>
              </View>
            )}
          </View>
        )}

        {report.citizenId && (
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <MaterialCommunityIcons name="account" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Citizen Info</Text>
            </View>
            <Text style={styles.citizenText}>Citizen ID: {report.citizenId}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.small,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: COLORS.background,
  },
  backArrow: {
    fontSize: 22,
    color: COLORS.primary,
    fontWeight: '700',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
  },
  container: {
    flexGrow: 1,
    padding: SIZES.md,
    paddingBottom: SIZES.xxl,
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
    color: COLORS.textSecondary,
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
    backgroundColor: COLORS.surface,
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
    color: COLORS.text,
    marginLeft: 8,
  },
  descriptionText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 24,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: SIZES.sm,
    backgroundColor: COLORS.border,
    marginTop: SIZES.xs,
  },
  audioButton: {
    backgroundColor: COLORS.primary,
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
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  citizenText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
