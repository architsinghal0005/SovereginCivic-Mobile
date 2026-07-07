import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Platform, StatusBar, TouchableOpacity, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SIZES } from '../constants/theme';
import { useTheme } from '../utils/theme';
import { 
  PrimaryButton, 
  FloatingMicrophoneButton, 
  ImagePreviewPlaceholder, 
  LocationStatusCard, 
  ErrorBanner, 
  PermissionWarningCard,
  GPSStatus
} from '../components';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useLocation } from '../hooks/useLocation';
import { useCamera } from '../hooks/useCamera';
import { submitGrievanceReport } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useTicketPolling } from '../hooks/useTicketPolling';

export default function HomeScreen() {
  const { colors, themeMode, setTheme } = useTheme();
  
  const [gpsStatus, setGpsStatus] = useState<GPSStatus>('searching');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  
  const { showToast } = useToast();
  const { status: ticketStatus } = useTicketPolling(reportId);

  const {
    isRecording,
    isLoading,
    hasPermission,
    recordingUri,
    durationFormatted,
    error,
    requestPermission,
    startRecording,
    stopRecording,
    resetAudio,
  } = useAudioRecorder();

  const {
    latitude,
    longitude,
    accuracy,
    loading: gpsLoading,
    error: gpsError,
    fetchLocation,
  } = useLocation();

  const {
    imageUri,
    error: cameraError,
    takePhoto,
    removePhoto,
  } = useCamera();

  // Attempt to request permission on mount if not already granted
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
    fetchLocation();
  }, []);

  const handleGrantPermissions = () => {
    requestPermission();
    fetchLocation();
  };

  useEffect(() => {
    if (gpsLoading) {
      setGpsStatus('searching');
    } else if (latitude !== null && longitude !== null) {
      setGpsStatus('acquired');
    } else if (gpsError) {
      setGpsStatus('denied');
    }
  }, [gpsLoading, latitude, longitude, gpsError]);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleReset = () => {
    setSubmitSuccess(null);
    setReportId(null);
    resetAudio();
    removePhoto();
    // GPS and permissions remain acquired for next report
  };

  const handleSubmit = React.useCallback(async () => {
    if (!recordingUri || !imageUri || latitude === null || longitude === null) {
      showToast('Please provide audio, an image, and allow location before submitting.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitSuccess(null);
      
      const response = await submitGrievanceReport({
        audioUri: recordingUri,
        imageUri: imageUri,
        latitude: latitude,
        longitude: longitude,
      });
      
      setSubmitSuccess('Report submitted successfully! Thank you for your civic contribution.');
      if (response.reportId) {
        setReportId(response.reportId);
      }
    } catch (err: any) {
      showToast(err.message || 'An unexpected error occurred.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [recordingUri, imageUri, latitude, longitude, showToast]);

  const renderSettingsModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isSettingsVisible}
      onRequestClose={() => setIsSettingsVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Settings</Text>
            <TouchableOpacity onPress={() => setIsSettingsVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>App Theme</Text>
          
          <View style={styles.themeOptionsRow}>
            {(['system', 'light', 'dark'] as const).map(mode => (
              <TouchableOpacity 
                key={mode}
                style={[
                  styles.themeOption, 
                  { borderColor: colors.border, backgroundColor: colors.background },
                  themeMode === mode && { borderColor: colors.primary, backgroundColor: colors.primary + '15' }
                ]}
                onPress={() => setTheme(mode)}
              >
                <MaterialCommunityIcons 
                  name={mode === 'system' ? 'theme-light-dark' : mode === 'light' ? 'white-balance-sunny' : 'moon-waning-crescent'} 
                  size={24} 
                  color={themeMode === mode ? colors.primary : colors.textSecondary} 
                />
                <Text style={[
                  styles.themeOptionText, 
                  { color: themeMode === mode ? colors.primary : colors.textSecondary },
                  themeMode === mode && { fontWeight: 'bold' }
                ]}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  if (submitSuccess) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background, justifyContent: 'center', padding: SIZES.lg }]}>
        <View style={[styles.successContainer, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
          <MaterialCommunityIcons name="check-circle" size={64} color={colors.success} style={{ marginBottom: SIZES.sm }} />
          <Text style={[styles.successTitle, { color: colors.success }]}>Success</Text>
          <Text style={[styles.successMessage, { color: colors.textSecondary }]}>{submitSuccess}</Text>
          
          {reportId && (
            <View style={{ marginBottom: SIZES.xl, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 4 }}>Live Ticket Status:</Text>
              <View style={{ backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                <Text style={{ color: colors.surface, fontWeight: 'bold' }}>{ticketStatus}</Text>
              </View>
            </View>
          )}

          <PrimaryButton title="Start New Report" onPress={handleReset} />
        </View>
      </SafeAreaView>
    );
  }

  const isSubmitDisabled = !recordingUri || !imageUri || latitude === null || longitude === null || isSubmitting;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.title, { color: colors.primary }]} accessibilityRole="header">SovereignCivic</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Secure, verifiable reporting for public service operations.
            </Text>
          </View>
          <TouchableOpacity onPress={() => setIsSettingsVisible(true)} accessibilityLabel="Open Settings">
            <MaterialCommunityIcons name="cog" size={28} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {!hasPermission && (
          <PermissionWarningCard onGrantPermission={handleGrantPermissions} />
        )}

        {error && <ErrorBanner message={error} />}
        {gpsError && <ErrorBanner message={gpsError} />}
        {cameraError && <ErrorBanner message={cameraError} />}

        <LocationStatusCard status={gpsStatus} />
        
        {gpsStatus === 'acquired' && latitude && longitude && (
          <Text style={[styles.coordinatesText, { color: colors.textSecondary }]}>
            Lat: {latitude.toFixed(6)}, Lon: {longitude.toFixed(6)} (±{accuracy?.toFixed(1)}m)
          </Text>
        )}
        
        {gpsError && !gpsLoading && (
          <PrimaryButton 
            title="Retry GPS" 
            onPress={fetchLocation} 
            style={styles.retryButton} 
            textStyle={{fontSize: 14}}
          />
        )}

        <ImagePreviewPlaceholder 
          imageUri={imageUri}
          onPress={takePhoto}
          onRemove={removePhoto}
        />

        <View style={styles.recordingStatusContainer}>
          {isRecording ? (
            <Text style={[styles.recordingStatusText, { color: colors.text }]}>Recording... {durationFormatted}</Text>
          ) : recordingUri ? (
            <Text style={[styles.recordingStatusText, { color: colors.text }]}>Finished recording ({durationFormatted})</Text>
          ) : (
            <Text style={[styles.recordingStatusText, { color: colors.text }]}>Tap to start recording</Text>
          )}
        </View>

        <View style={styles.microphoneContainer}>
          <FloatingMicrophoneButton 
            onPress={toggleRecording} 
            isRecording={isRecording}
            disabled={!hasPermission || isLoading}
          />
        </View>

        <PrimaryButton 
          title={isSubmitting ? "Submitting..." : "Submit Report"} 
          onPress={handleSubmit} 
          disabled={isSubmitDisabled}
          loading={isSubmitting}
          style={styles.submitButton}
        />
      </ScrollView>
      {renderSettingsModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flexGrow: 1,
    padding: SIZES.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.lg,
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: SIZES.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: SIZES.xs,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  recordingStatusContainer: {
    alignItems: 'center',
    marginTop: SIZES.lg,
  },
  recordingStatusText: {
    fontSize: 18,
    fontWeight: '600',
  },
  coordinatesText: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: SIZES.sm,
    marginBottom: SIZES.sm,
  },
  retryButton: {
    marginVertical: SIZES.sm,
    minHeight: 36,
    paddingVertical: SIZES.sm,
  },
  microphoneContainer: {
    alignItems: 'center',
    marginVertical: SIZES.lg,
    flex: 1,
    justifyContent: 'center',
  },
  submitButton: {
    marginTop: 'auto',
    marginBottom: SIZES.xl,
  },
  successContainer: {
    padding: SIZES.xl,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: SIZES.md,
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: SIZES.xl,
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SIZES.lg,
  },
  modalContent: {
    borderRadius: SIZES.radius,
    padding: SIZES.lg,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: SIZES.md,
    textTransform: 'uppercase',
  },
  themeOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SIZES.sm,
  },
  themeOption: {
    flex: 1,
    padding: SIZES.md,
    borderRadius: SIZES.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  themeOptionText: {
    marginTop: SIZES.xs,
    fontSize: 12,
  },
});

