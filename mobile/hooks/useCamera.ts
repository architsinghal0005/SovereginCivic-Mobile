import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';

export const useCamera = () => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status !== 'granted') {
        setError('Camera permission denied. The app cannot take photos without access to your camera.');
      }
    } catch (err) {
      setError('Failed to request camera permission.');
    } finally {
      setLoading(false);
    }
  }, []);

  const takePhoto = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!hasPermission) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          setError('Camera permission denied. The app cannot take photos without access to your camera.');
          setHasPermission(false);
          setLoading(false);
          return;
        }
        setHasPermission(true);
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      setError('An error occurred while trying to open the camera.');
    } finally {
      setLoading(false);
    }
  }, [hasPermission]);

  const removePhoto = useCallback(() => {
    setImageUri(null);
  }, []);

  return {
    imageUri,
    hasPermission,
    loading,
    error,
    requestPermission,
    takePhoto,
    removePhoto,
  };
};
