import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView as RNSafeAreaView,
  ActivityIndicator, TouchableOpacity, Platform, StatusBar, RefreshControl,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SIZES, SHADOWS } from '../constants/theme';
import { ReportCard } from '../components/ReportCard';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { useMyReports } from '../hooks/useMyReports';
import ComplaintDetailsScreen from './ComplaintDetailsScreen';
import { Grievance } from '../services/api';
import { useTheme } from '../utils/theme';

const CITIZEN_ID = 'dummy-citizen-123'; // matches what the submit form sends

interface MyReportsScreenProps {
  onBack: () => void;
}

export default function MyReportsScreen({ onBack }: MyReportsScreenProps) {
  const { reports, loading, isRefreshing, error, refresh } = useMyReports(CITIZEN_ID);
  const [selectedReport, setSelectedReport] = useState<Grievance | null>(null);
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<any>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Show FAB when scrolled down more than 200px
  const fabOpacity = scrollY.interpolate({
    inputRange: [0, 200, 300],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });
  
  const fabTranslateY = scrollY.interpolate({
    inputRange: [0, 200, 300],
    outputRange: [50, 50, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    refresh();
  }, []);

  const scrollToTop = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📂</Text>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Reports Yet</Text>
        <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
          Your submitted grievances will appear here once they have been processed.
        </Text>
        <TouchableOpacity 
          style={[styles.emptyButton, { backgroundColor: colors.primary }]}
          onPress={onBack}
        >
          <Text style={styles.emptyButtonText}>Report an Issue</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (selectedReport) {
    return <ComplaintDetailsScreen report={selectedReport} onBack={() => setSelectedReport(null)} />;
  }

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
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
          <Text style={[styles.headerTitle, { color: colors.primary }]}>My Reports</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{reports.length} grievance{reports.length !== 1 ? 's' : ''} filed</Text>
        </View>
        <TouchableOpacity onPress={refresh} style={styles.refreshButton} disabled={loading || isRefreshing}>
          {isRefreshing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.refreshIcon, { color: colors.primary }, (loading || isRefreshing) && { opacity: 0.4 }]}>↻</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={[styles.errorBanner, { backgroundColor: colors.errorBackground, borderBottomColor: colors.error }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity onPress={refresh}>
            <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading State */}
      {loading && reports.length === 0 && (
        <View style={styles.listContent}>
          {[1, 2, 3].map((key) => (
            <View key={key} style={[styles.skeletonCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
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
      <Animated.FlatList
        ref={flatListRef}
        data={reports}
        keyExtractor={(item: any, index: number) => `${item.id}-${index}`}
        renderItem={({ item }: { item: any }) => <ReportCard report={item} onPress={() => setSelectedReport(item)} />}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 80, SIZES.md) }]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={loading && reports.length > 0}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            title="Refreshing reports..."
            titleColor={colors.primary}
          />
        }
      />
      
      {/* Scroll to Top FAB */}
      <Animated.View style={[
        styles.fabContainer, 
        { 
          opacity: fabOpacity, 
          transform: [{ translateY: fabTranslateY }],
          bottom: insets.bottom > 0 ? insets.bottom + 20 : 20,
        }
      ]}>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.cardShadow }]}
          onPress={scrollToTop}
          activeOpacity={0.8}
          accessibilityLabel="Scroll to top"
        >
          <Text style={styles.fabIcon}>↑</Text>
        </TouchableOpacity>
      </Animated.View>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshIcon: {
    fontSize: 24,
    fontWeight: '700',
  },
  listContent: {
    padding: SIZES.md,
    flexGrow: 1,
  },
  skeletonCard: {
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.xl,
    paddingTop: SIZES.giant,
  },
  emptyIcon: {
    fontSize: 72,
    marginBottom: SIZES.md,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: SIZES.sm,
  },
  emptyMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SIZES.xl,
  },
  emptyButton: {
    paddingHorizontal: SIZES.xl,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radius,
    ...SHADOWS.small,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
  },
  errorText: {
    fontSize: 13,
    flex: 1,
    marginRight: SIZES.sm,
  },
  retryText: {
    fontWeight: '700',
    fontSize: 13,
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 100,
  },
  fab: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  fabIcon: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
