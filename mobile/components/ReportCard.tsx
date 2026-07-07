import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Grievance } from '../services/api';
import { SIZES, SHADOWS } from '../constants/theme';
import { useTheme } from '../utils/theme';
import { formatRelativeDate } from '../utils/date';
import { CONFIG, getFullUrl } from '../constants/config';

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

interface ReportCardProps {
  report: Grievance;
  onPress?: () => void;
  currentCitizenId?: string;
}

export const ReportCard: React.FC<ReportCardProps> = ({ report, onPress, currentCitizenId = 'dummy-citizen-123' }) => {
  const { colors, isDark } = useTheme();
  const categoryColor = CATEGORY_COLORS[report.category] ?? CATEGORY_COLORS['Other'];
  
  // Adjust status colors slightly for dark mode if needed, or keep the config
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

  const isMyReport = report.citizenId === currentCitizenId;
  const ownershipBadgeColor = isMyReport ? colors.primary : colors.textSecondary;
  const ownershipBadgeText = isMyReport ? 'My Report' : 'Other Citizen';
  const ownershipBgColor = isMyReport ? (isDark ? '#003355' : '#E0F2FE') : (isDark ? '#334155' : '#F1F5F9');

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]} 
      onPress={onPress} 
      disabled={!onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Report for ${report.category}. Status: ${statusConfig.label}`}
    >
      {/* Top row: category badge + ownership badge + time */}
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
            <Text style={styles.categoryText}>{report.category}</Text>
          </View>
          <View style={[styles.ownershipBadge, { backgroundColor: ownershipBgColor }]}>
            <Text style={[styles.ownershipText, { color: ownershipBadgeColor }]}>{ownershipBadgeText}</Text>
          </View>
        </View>
        <Text style={[styles.time, { color: colors.textSecondary }]}>{formatRelativeDate(report.createdAt)}</Text>
      </View>

      {/* Description & Thumbnail */}
      <View style={styles.middleRow}>
        <Text style={[styles.description, { color: colors.text }]} numberOfLines={3}>
          {displayDescription}
        </Text>
        {report.imageUrl && (
          <Image 
            source={{ 
              uri: getFullUrl(report.imageUrl),
              headers: { 'ngrok-skip-browser-warning': 'true' }
            }} 
            style={styles.thumbnail} 
          />
        )}
      </View>

      {/* Bottom row: status chip */}
      <View style={styles.bottomRow}>
        <View style={[styles.statusChip, { backgroundColor: isDark ? `${statusConfig.color}20` : statusConfig.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
        {report.lat != null && report.lng != null && (
          <Text style={[styles.coords, { color: colors.textSecondary }]}>
            {Number(report.lat).toFixed(4)}, {Number(report.lng).toFixed(4)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...SHADOWS.medium,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
    gap: 6,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  ownershipBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  ownershipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  time: {
    fontSize: 11,
    marginLeft: SIZES.sm,
  },
  middleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.md,
    gap: SIZES.sm,
  },
  description: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
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
    fontSize: 12,
    fontWeight: '700',
  },
  coords: {
    fontSize: 11,
  },
});
