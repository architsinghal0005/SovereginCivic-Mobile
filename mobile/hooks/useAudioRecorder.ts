import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';

export const useAudioRecorder = () => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [durationMillis, setDurationMillis] = useState<number>(0);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [recording]);

  const requestPermission = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const permission = await Audio.requestPermissionsAsync();
      setHasPermission(permission.status === 'granted');
      if (permission.status !== 'granted') {
        setError('Microphone permission denied.');
      }
    } catch (err) {
      setError('Failed to request permission.');
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setRecordingUri(null);
      setDurationMillis(0);

      if (!hasPermission) {
        const permission = await Audio.requestPermissionsAsync();
        if (permission.status !== 'granted') {
          setError('Microphone permission is required to record.');
          setHasPermission(false);
          setIsLoading(false);
          return;
        }
        setHasPermission(true);
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);

      recording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording) {
          setDurationMillis(status.durationMillis);
        }
      });
      
    } catch (err) {
      console.error('Failed to start recording', err);
      setError('Failed to start recording.');
    } finally {
      setIsLoading(false);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      setIsLoading(true);
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      const uri = recording.getURI();
      setRecordingUri(uri);
      setRecording(null);
    } catch (err) {
      console.error('Failed to stop recording', err);
      setError('Failed to stop recording.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetAudio = () => {
    setRecordingUri(null);
    setDurationMillis(0);
    setError(null);
  };

  const formatDuration = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return {
    isRecording,
    isLoading,
    hasPermission,
    recordingUri,
    durationFormatted: formatDuration(durationMillis),
    error,
    requestPermission,
    startRecording,
    stopRecording,
    resetAudio,
  };
};
