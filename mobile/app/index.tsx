import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Platform, StatusBar, Alert } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
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

export default function HomeScreen() {
  const [gpsStatus, setGpsStatus] = React.useState<GPSStatus>('searching');
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = React.useState<string | null>(null);
  
  const { showToast } = useToast();

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
    } catch (err: any) {
      showToast(err.message || 'An unexpected error occurred.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [recordingUri, imageUri, latitude, longitude, showToast]);

  if (submitSuccess) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', padding: SIZES.lg }]}>
        <View style={styles.successContainer}>
          <Text style={styles.successTitle}>Success</Text>
          <Text style={styles.successMessage}>{submitSuccess}</Text>
          <PrimaryButton title="Start New Report" onPress={handleReset} />
        </View>
      </SafeAreaView>
    );
  }

  const isSubmitDisabled = !recordingUri || !imageUri || latitude === null || longitude === null || isSubmitting;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">SovereignCivic</Text>
          <Text style={styles.description}>
            Secure, verifiable reporting for public service operations.
          </Text>
        </View>

        {!hasPermission && (
          <PermissionWarningCard onGrantPermission={handleGrantPermissions} />
        )}

        {error && <ErrorBanner message={error} />}
        {gpsError && <ErrorBanner message={gpsError} />}
        {cameraError && <ErrorBanner message={cameraError} />}

        <LocationStatusCard status={gpsStatus} />
        
        {gpsStatus === 'acquired' && latitude && longitude && (
          <Text style={styles.coordinatesText}>
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
            <Text style={styles.recordingStatusText}>Recording... {durationFormatted}</Text>
          ) : recordingUri ? (
            <Text style={styles.recordingStatusText}>Finished recording ({durationFormatted})</Text>
          ) : (
            <Text style={styles.recordingStatusText}>Tap to start recording</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flexGrow: 1,
    padding: SIZES.lg,
  },
  header: {
    marginBottom: SIZES.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: SIZES.xs,
  },
  description: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  recordingStatusContainer: {
    alignItems: 'center',
    marginTop: SIZES.lg,
  },
  recordingStatusText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  coordinatesText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
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
    backgroundColor: COLORS.surface,
    padding: SIZES.xl,
    borderRadius: SIZES.md,
    alignItems: 'center',
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.success,
    marginBottom: SIZES.md,
  },
  successMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.xl,
    lineHeight: 24,
  }
});
