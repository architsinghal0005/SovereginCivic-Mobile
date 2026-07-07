import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  ActivityIndicator, TouchableOpacity, Platform, StatusBar, RefreshControl,
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { ReportCard } from '../components/ReportCard';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { useMyReports } from '../hooks/useMyReports';
import ComplaintDetailsScreen from './ComplaintDetailsScreen';
import { Grievance } from '../services/api';

const CITIZEN_ID = 'dummy-citizen-123'; // matches what the submit form sends

interface MyReportsScreenProps {
  onBack: () => void;
}

export default function MyReportsScreen({ onBack }: MyReportsScreenProps) {
  const { reports, loading, isRefreshing, error, refresh } = useMyReports(CITIZEN_ID);
  const [selectedReport, setSelectedReport] = useState<Grievance | null>(null);

  useEffect(() => {
    refresh();
  }, []);

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyTitle}>No Reports Yet</Text>
        <Text style={styles.emptyMessage}>
          Your submitted grievances will appear here once they have been processed.
        </Text>
      </View>
    );
  };

  if (selectedReport) {
    return <ComplaintDetailsScreen report={selectedReport} onBack={() => setSelectedReport(null)} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} accessibilityLabel="Go back">
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>My Reports</Text>
          <Text style={styles.headerSubtitle}>{reports.length} grievance{reports.length !== 1 ? 's' : ''} filed</Text>
        </View>
        <TouchableOpacity onPress={refresh} style={styles.refreshButton} disabled={loading || isRefreshing}>
          {isRefreshing ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text style={[styles.refreshIcon, (loading || isRefreshing) && { opacity: 0.4 }]}>↻</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading State */}
      {loading && reports.length === 0 && (
        <View style={styles.listContent}>
          {[1, 2, 3].map((key) => (
            <View key={key} style={styles.skeletonCard}>
              <View style={styles.skeletonTopRow}>
                <SkeletonLoader style={styles.skeletonBadge} />
                <SkeletonLoader style={styles.skeletonTime} />
              </View>
              <SkeletonLoader style={styles.skeletonDesc1} />
              <SkeletonLoader style={styles.skeletonDesc2} />
              <View style={styles.skeletonBottomRow}>
                <SkeletonLoader style={styles.skeletonStatus} />
                <SkeletonLoader style={styles.skeletonCoords} />
              </View>
            </View>
          ))}
        </View>
      )}

      {/* List */}
      <FlatList
        data={reports}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item }) => <ReportCard report={item} onPress={() => setSelectedReport(item)} />}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading && reports.length > 0}
            onRefresh={refresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      />
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshIcon: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: '700',
  },
  listContent: {
    padding: SIZES.md,
    flexGrow: 1,
  },
  skeletonCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...SHADOWS.small,
  },
  skeletonTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.md,
  },
  skeletonBadge: { width: 80, height: 20 },
  skeletonTime: { width: 60, height: 16 },
  skeletonDesc1: { width: '100%', height: 16, marginBottom: 8 },
  skeletonDesc2: { width: '80%', height: 16, marginBottom: SIZES.md },
  skeletonBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skeletonStatus: { width: 100, height: 24, borderRadius: 12 },
  skeletonCoords: { width: 120, height: 14 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SIZES.md,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    marginTop: SIZES.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.xl,
    paddingTop: SIZES.giant,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: SIZES.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  emptyMessage: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.errorBackground,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    flex: 1,
    marginRight: SIZES.sm,
  },
  retryText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
  },
});
