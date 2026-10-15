import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../src/theme/theme';

export default function PhlebotomistPendingScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="clock-outline" size={44} color="#D97706" />
        </View>
        <Text style={styles.title}>Application Under Review</Text>
        <Text style={styles.subtitle}>
          Your Phlebotomist partner application has been submitted successfully and is currently under review by the MedsSeva Admin Team.
        </Text>

        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information-outline" size={20} color="#D97706" style={{ marginTop: 2 }} />
          <Text style={styles.infoText}>
            Our team verifies identity documents and qualifications before activating collection accounts. You will receive an SMS/email update once approved.
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
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#FEF3C7',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#FDE68A',
  },
  title: { fontSize: 22, fontWeight: '900', color: '#0F172A', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  infoBox: {
    flexDirection: 'row', gap: 10, backgroundColor: '#FFFBEB',
    borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#FDE68A', marginBottom: 24,
  },
  infoText: { fontSize: 13, color: '#92400E', lineHeight: 19, flex: 1 },
  btn: {
    backgroundColor: COLORS.primary, height: 50, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', width: '100%', ...SHADOWS.soft,
  },
  btnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
