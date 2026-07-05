import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';
import HomeScreen from './app/index';
import MyReportsScreen from './app/reports';
import NotificationScreen from './app/notifications';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './hooks/useToast';
import { ToastContainer } from './components/Toast';
import { COLORS, SIZES, SHADOWS } from './constants/theme';

type Tab = 'home' | 'reports' | 'notifications';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');

  return (
    <ErrorBoundary>
      <ToastProvider>
        <View style={styles.root}>
          {/* Screen Content */}
          <View style={styles.content}>
            {activeTab === 'home' ? (
              <HomeScreen />
            ) : activeTab === 'reports' ? (
              <MyReportsScreen onBack={() => setActiveTab('home')} />
            ) : (
              <NotificationScreen />
            )}
          </View>

          {/* Bottom Tab Bar */}
          <SafeAreaView style={styles.tabBarSafe}>
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={styles.tab}
                onPress={() => setActiveTab('home')}
                accessibilityLabel="Submit Report tab"
              >
                <Text style={[styles.tabIcon, activeTab === 'home' && styles.tabIconActive]}>📝</Text>
                <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>
                  Report
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tab}
                onPress={() => setActiveTab('reports')}
                accessibilityLabel="My Reports tab"
              >
                <Text style={[styles.tabIcon, activeTab === 'reports' && styles.tabIconActive]}>📋</Text>
                <Text style={[styles.tabLabel, activeTab === 'reports' && styles.tabLabelActive]}>
                  My Reports
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tab}
                onPress={() => setActiveTab('notifications')}
                accessibilityLabel="Notifications tab"
              >
                <Text style={[styles.tabIcon, activeTab === 'notifications' && styles.tabIconActive]}>🔔</Text>
                <Text style={[styles.tabLabel, activeTab === 'notifications' && styles.tabLabelActive]}>
                  Alerts
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
        <ToastContainer />
      </ToastProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  tabBarSafe: {
    backgroundColor: COLORS.surface,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingBottom: Platform.OS === 'android' ? SIZES.sm : 0,
    ...SHADOWS.small,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SIZES.sm,
    gap: 2,
  },
  tabIcon: {
    fontSize: 22,
    opacity: 0.4,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
