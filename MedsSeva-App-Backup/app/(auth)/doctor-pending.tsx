import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../src/theme/theme';

export default function DoctorPendingScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="stethoscope" size={44} color="#7C3AED" />
        </View>
        <Text style={styles.title}>Verification Pending</Text>
        <Text style={styles.subtitle}>
          Your Doctor registration and Medical Council credentials have been submitted for admin verification.
        </Text>

        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="shield-check-outline" size={20} color="#7C3AED" style={{ marginTop: 2 }} />
          <Text style={styles.infoText}>
            Our medical board verifies doctor registration numbers before activating consulting accounts. You will be notified once verification completes.
          </Text>
        </View>

        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(auth)/account-type')}>
          <Text style={styles.btnText}>Back to Account Selection</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: {
    backgroundColor: '#fff', borderRadius: 24, padding: 28,
    alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', ...SHADOWS.soft, width: '100%', maxWidth: 380,
  },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#F3E8FF',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#E9D5FF',
  },
  title: { fontSize: 22, fontWeight: '900', color: '#0F172A', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  infoBox: {
    flexDirection: 'row', gap: 10, backgroundColor: '#FAF5FF',
    borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E9D5FF', marginBottom: 24,
  },
  infoText: { fontSize: 13, color: '#6B21A8', lineHeight: 19, flex: 1 },
  btn: {
    backgroundColor: COLORS.primary, height: 50, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', width: '100%', ...SHADOWS.soft,
  },
  btnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
