import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AppNotification } from '../services/api';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

interface NotificationCardProps {
  notification: AppNotification;
  onPress: () => void;
}

export const NotificationCard = ({ notification, onPress }: NotificationCardProps) => {
  return (
    <TouchableOpacity 
      style={[styles.card, notification.read ? styles.cardRead : styles.cardUnread]} 
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Notification: ${notification.message}. ${notification.read ? 'Read' : 'Unread'}`}
      activeOpacity={0.7}
    >
      <View style={styles.contentContainer}>
        {!notification.read && <View style={styles.unreadDot} />}
        <View style={styles.textContainer}>
          <Text style={styles.message} numberOfLines={2}>{notification.message}</Text>
          <Text style={styles.subtext}>Ticket ID: {notification.ticketId} • {new Date(notification.timestamp).toLocaleString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...SHADOWS.small,
  },
  cardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  cardRead: {
    opacity: 0.7,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginTop: 5,
    marginRight: SIZES.sm,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SIZES.xs,
    lineHeight: 22,
  },
  subtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
