import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, SafeAreaView as RNSafeAreaView } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from './app/index';
import MyReportsScreen from './app/reports';
import NotificationScreen from './app/notifications';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './hooks/useToast';
import { ToastContainer } from './components/Toast';
import { ThemeProvider, useTheme } from './utils/theme';
import { SIZES, SHADOWS } from './constants/theme';

type Tab = 'home' | 'reports' | 'notifications';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
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
      <View style={[styles.tabBarSafe, { backgroundColor: colors.surface }]}>
        <View style={[
          styles.tabBar, 
          { 
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, SIZES.sm) : insets.bottom,
            shadowColor: colors.cardShadow,
          }
        ]}>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setActiveTab('home')}
            accessibilityLabel="Submit Report tab"
            accessibilityRole="button"
          >
            <Text style={[styles.tabIcon, activeTab === 'home' && styles.tabIconActive]}>📝</Text>
            <Text style={[
              styles.tabLabel, 
              { color: colors.textSecondary },
              activeTab === 'home' && { color: colors.primary, fontWeight: '700' }
            ]}>
              Report
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tab}
            onPress={() => setActiveTab('reports')}
            accessibilityLabel="My Reports tab"
            accessibilityRole="button"
          >
            <Text style={[styles.tabIcon, activeTab === 'reports' && styles.tabIconActive]}>📋</Text>
            <Text style={[
              styles.tabLabel, 
              { color: colors.textSecondary },
              activeTab === 'reports' && { color: colors.primary, fontWeight: '700' }
            ]}>
              My Reports
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tab}
            onPress={() => setActiveTab('notifications')}
            accessibilityLabel="Notifications tab"
            accessibilityRole="button"
          >
            <Text style={[styles.tabIcon, activeTab === 'notifications' && styles.tabIconActive]}>🔔</Text>
            <Text style={[
              styles.tabLabel, 
              { color: colors.textSecondary },
              activeTab === 'notifications' && { color: colors.primary, fontWeight: '700' }
            ]}>
              Alerts
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <ToastProvider>
            <AppContent />
            <ToastContainer />
          </ToastProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  tabBarSafe: {
    // Background color applied dynamically
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    ...SHADOWS.small,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SIZES.sm,
    gap: 2,
    minHeight: SIZES.touchTarget,
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
    fontWeight: '500',
  },
});
