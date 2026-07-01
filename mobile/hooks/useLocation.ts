import { useState, useCallback } from 'react';
import * as Location from 'expo-location';

export const useLocation = () => {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);

  const fetchLocation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status !== 'granted') {
        setError('Location permission denied.');
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLatitude(location.coords.latitude);
      setLongitude(location.coords.longitude);
      setAccuracy(location.coords.accuracy);
      
    } catch (err) {
      setError('Failed to fetch location. Please ensure GPS is enabled.');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    latitude,
    longitude,
    accuracy,
    loading,
    error,
    hasPermission,
    fetchLocation,
  };
};
