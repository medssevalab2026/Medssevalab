import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { RootState } from '../../src/store';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';

export default function SuccessScreen() {
  const router = useRouter();
  const booking = useSelector((state: RootState) => state.booking);
  
const recentBooking = booking.pastBookings?.[0] || { id: '', bookingCode: '', date: 'TBD', time: 'TBD', paymentMethod: null, status: 'PENDING', collectionMode: 'HOME' };
const isLabVisit = recentBooking.collectionMode === 'LAB' || recentBooking.collectionMode === 'lab';
  const isPending = !recentBooking.status || recentBooking.status === 'PENDING';
  const isCashAtHome = recentBooking.paymentMethod === 'cash';

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        
        <Animated.View style={[styles.iconCircle, { transform: [{ scale: scaleAnim }] }]}>
          <MaterialCommunityIcons name="check" size={64} color="#fff" />
        </Animated.View>
<Animated.Text style={[styles.title, { opacity: opacityAnim }]}>
          {isLabVisit
            ? 'Booking Received!'
            : isPending
            ? 'Booking Request Submitted'
            : 'Booking Confirmed!'}
        </Animated.Text>
        <Animated.Text style={[styles.subtitle, { opacity: opacityAnim }]}>
          {isLabVisit
            ? 'Visit the selected branch at your scheduled date and time. Show your Booking Code at the reception.'
            : isPending
            ? 'Your booking request has been received successfully. Our team will verify your booking and assign a phlebotomist shortly.'
            : 'Your tests have been scheduled and payment received successfully.'}
        </Animated.Text>

        <Animated.View style={[styles.detailsCard, { opacity: opacityAnim }]}>
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booking Code</Text>
            <Text style={styles.detailValue}>{recentBooking.bookingCode || recentBooking.id}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Scheduled Date</Text>
            <Text style={styles.detailValue}>{recentBooking.date}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time Slot</Text>
            <Text style={styles.detailValue}>{recentBooking.time}</Text>
          </View>
        </Animated.View>

      </View>

      <Animated.View style={[styles.footer, { opacity: opacityAnim }]}>
 <TouchableOpacity 
          style={styles.trackBtn} 
          onPress={() => router.push(isLabVisit ? `/tracking/lab/${recentBooking.id}` : `/tracking/${recentBooking.id}`)}
        >
          <MaterialCommunityIcons name="map-marker-path" size={20} color={COLORS.textLight} />
          <Text style={styles.trackBtnText}>Track Booking</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.homeBtn} 
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
    ...SHADOWS.glow,
  },
  title: {
    ...TYPOGRAPHY.hero,
    color: COLORS.textLight,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textLight,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 40,
  },
  detailsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    ...SHADOWS.soft,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  detailValue: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textDark,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  trackBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.textDark,
    paddingVertical: 16,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  trackBtnText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textLight,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  homeBtn: {
    paddingVertical: 16,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  homeBtnText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textLight,
    fontWeight: 'bold',
  }
});
