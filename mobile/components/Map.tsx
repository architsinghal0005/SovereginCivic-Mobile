import React from 'react';
import MapView, { Marker, MapViewProps } from 'react-native-maps';
import { StyleSheet, View } from 'react-native';

interface MapComponentProps extends MapViewProps {
  latitude: number;
  longitude: number;
}

export const MapComponent = ({ latitude, longitude, ...props }: MapComponentProps) => {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        {...props}
      >
        <Marker 
          coordinate={{ latitude, longitude }} 
          title="Location"
        />
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  }
});
