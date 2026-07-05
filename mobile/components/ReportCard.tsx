import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Grievance } from '../services/api';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

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

function getRelativeTime(isoString: string | null): string {
  if (!isoString) return 'Unknown date';
  try {
    // Neo4j datetime format: 2026-07-03T00:00:00.000000000Z
    const date = new Date(isoString.split('[')[0]); // strip timezone label if present
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch {
    return 'Unknown date';
  }
}

interface ReportCardProps {
  report: Grievance;
  onPress?: () => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({ report, onPress }) => {
  const categoryColor = CATEGORY_COLORS[report.category] ?? CATEGORY_COLORS['Other'];
  const statusConfig = STATUS_CONFIG[report.status] ?? { color: '#64748B', bg: '#F1F5F9', label: report.status };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress} 
      disabled={!onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Report for ${report.category}. Status: ${statusConfig.label}`}
    >
      {/* Top row: category badge + time */}
      <View style={styles.topRow}>
        <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
          <Text style={styles.categoryText}>{report.category}</Text>
        </View>
        <Text style={styles.time}>{getRelativeTime(report.createdAt)}</Text>
      </View>

      {/* Description */}
      <Text style={styles.description} numberOfLines={3}>
        {report.description || 'No description provided.'}
      </Text>

      {/* Bottom row: status chip */}
      <View style={styles.bottomRow}>
        <View style={[styles.statusChip, { backgroundColor: statusConfig.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
        {report.lat != null && report.lng != null && (
          <Text style={styles.coords}>
            {Number(report.lat).toFixed(4)}, {Number(report.lng).toFixed(4)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...SHADOWS.small,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  time: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  description: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: SIZES.md,
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
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  coords: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});
