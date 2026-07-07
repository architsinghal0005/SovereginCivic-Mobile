import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Platform, StatusBar } from 'react-native';
import { SIZES, SHADOWS } from '../constants/theme';
import { useTheme } from '../utils/theme';
import { NotificationCard } from '../components/NotificationCard';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { useNotifications } from '../hooks/useNotifications';

const CITIZEN_ID = 'dummy-citizen-123';

export default function NotificationScreen() {
  const { colors } = useTheme();
  const { notifications, loading, error, refresh, markAsRead } = useNotifications(CITIZEN_ID);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer} accessible={true} accessibilityLabel="No notifications yet">
        <Text style={styles.emptyIcon}>📭</Text>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Notifications</Text>
        <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>You're all caught up!</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, shadowColor: colors.cardShadow }]}>
        <Text style={[styles.headerTitle, { color: colors.primary }]} accessibilityRole="header">Notifications</Text>
      </View>

      {error && (
        <View style={[styles.errorBanner, { backgroundColor: colors.errorBackground }]} accessible={true}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity onPress={refresh} accessibilityRole="button" accessibilityLabel="Retry fetching notifications">
            <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && notifications.length === 0 && (
        <View style={styles.listContent}>
          {[1, 2, 3, 4].map((key) => (
            <View key={key} style={[styles.skeletonCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
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
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
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
    marginBottom: SIZES.sm,
  },
  emptyMessage: {
    fontSize: 15,
  },
  errorBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SIZES.md,
  },
  errorText: {
  },
  retryText: {
    fontWeight: '700',
  },
});

