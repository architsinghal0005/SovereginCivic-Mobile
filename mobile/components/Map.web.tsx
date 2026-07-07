import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const MapComponent = (props: any) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Map is not supported on web.</Text>
      <Text style={styles.text}>Lat: {props.latitude}</Text>
      <Text style={styles.text}>Lng: {props.longitude}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
  },
  text: {
    color: '#64748b',
    fontSize: 14,
  }
});
