import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Platform, StatusBar } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { NotificationCard } from '../components/NotificationCard';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { useNotifications } from '../hooks/useNotifications';

const CITIZEN_ID = 'dummy-citizen-123';

export default function NotificationScreen() {
  const { notifications, loading, error, refresh, markAsRead } = useNotifications(CITIZEN_ID);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer} accessible={true} accessibilityLabel="No notifications yet">
        <Text style={styles.emptyIcon}>📭</Text>
        <Text style={styles.emptyTitle}>No Notifications</Text>
        <Text style={styles.emptyMessage}>You're all caught up!</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">Notifications</Text>
      </View>

      {error && (
        <View style={styles.errorBanner} accessible={true}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refresh} accessibilityRole="button" accessibilityLabel="Retry fetching notifications">
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && notifications.length === 0 && (
        <View style={styles.listContent}>
          {[1, 2, 3, 4].map((key) => (
            <View key={key} style={styles.skeletonCard}>
              <View style={styles.skeletonContent}>
                <SkeletonLoader style={styles.skeletonDot} />
                <View style={styles.skeletonTextContainer}>
                  <SkeletonLoader style={styles.skeletonMessage} />
                  <SkeletonLoader style={styles.skeletonSubtext} />
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item, index) => `${item.ticketId}-${item.timestamp}-${index}`}
        renderItem={({ item }) => (
          <NotificationCard 
            notification={item} 
            onPress={() => markAsRead(item.ticketId, item.timestamp)} 
          />
        )}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading && notifications.length > 0}
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
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
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
  skeletonContent: {
    flexDirection: 'row',
  },
  skeletonDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    marginRight: SIZES.sm,
  },
  skeletonTextContainer: {
    flex: 1,
  },
  skeletonMessage: { width: '90%', height: 16, marginBottom: SIZES.sm },
  skeletonSubtext: { width: '60%', height: 14 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: SIZES.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  errorBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.errorBackground,
    padding: SIZES.md,
  },
  errorText: {
    color: COLORS.error,
  },
  retryText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
