import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../src/theme/theme';
import { apiService } from '../../src/services/api';

export default function PartnerPendingScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [partnerStatus, setPartnerStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'BLOCKED' | 'CORRECTION_REQUIRED'>('PENDING');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [correctionReason, setCorrectionReason] = useState<string | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const data = await apiService.getPartnerProfile();
      if (data && data.approvalStatus) {
        setPartnerStatus(data.approvalStatus);
        setRejectionReason(data.rejectionReason || null);
        setCorrectionReason(data.correctionReason || null);

        if (data.approvalStatus === 'APPROVED') {
          router.replace('/(partner)/home');
        }
      }
    } catch (e) {
      // User might be unauthenticated, fallback to local PENDING state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Checking partner verification status...</Text>
        </View>
      );
    }

    if (partnerStatus === 'APPROVED') {
      return (
        <>
          <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
            <MaterialCommunityIcons name="check-decagram" size={44} color="#059669" />
          </View>
          <Text style={styles.title}>Account Approved!</Text>
          <Text style={styles.subtitle}>
            Your Pathology Partner profile has been verified and approved by the MedsSeva Admin Board.
          </Text>

          <TouchableOpacity style={styles.loginBtn} onPress={() => router.replace('/(partner)/home')}>
            <Text style={styles.loginBtnText}>Go to Partner Dashboard</Text>
          </TouchableOpacity>
        </>
      );
    }

    if (partnerStatus === 'CORRECTION_REQUIRED') {
      return (
        <>
          <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
            <MaterialCommunityIcons name="alert-decagram-outline" size={44} color="#D97706" />
          </View>
          <Text style={styles.title}>Correction Required</Text>
          <Text style={styles.subtitle}>
            The Admin team requested changes before approving your Pathology Partner application.
          </Text>

          <View style={[styles.infoBox, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
            <MaterialCommunityIcons name="message-alert-outline" size={20} color="#B45309" />
            <Text style={[styles.infoText, { color: '#B45309' }]}>
              {correctionReason || 'Please review and re-upload the requested documents or update lab details.'}
            </Text>
          </View>

          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(auth)/partner-register')}>
            <Text style={styles.loginBtnText}>Update & Resubmit Onboarding</Text>
          </TouchableOpacity>
        </>
      );
    }

    if (partnerStatus === 'REJECTED') {
      return (
        <>
          <View style={[styles.iconCircle, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <MaterialCommunityIcons name="close-circle-outline" size={44} color="#DC2626" />
          </View>
          <Text style={styles.title}>Application Rejected</Text>
          <Text style={styles.subtitle}>
            Your partner application could not be verified by the admin team.
          </Text>

          <View style={[styles.infoBox, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#DC2626" />
            <Text style={[styles.infoText, { color: '#991B1B' }]}>
              Reason: {rejectionReason || 'Documents or registration credentials failed verification.'}
            </Text>
          </View>

          <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/(auth)/account-type')}>
            <Text style={styles.homeBtnText}>Back to Account Selection</Text>
          </TouchableOpacity>
        </>
      );
    }

    if (partnerStatus === 'SUSPENDED' || partnerStatus === 'BLOCKED') {
      return (
        <>
          <View style={[styles.iconCircle, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <MaterialCommunityIcons name="shield-lock-outline" size={44} color="#DC2626" />
          </View>
          <Text style={styles.title}>Account {partnerStatus === 'BLOCKED' ? 'Blocked' : 'Suspended'}</Text>
          <Text style={styles.subtitle}>
            Your Pathology Partner account is currently {partnerStatus.toLowerCase()} by administration.
          </Text>

          <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/(auth)/account-type')}>
            <Text style={styles.homeBtnText}>Back to Account Selection</Text>
          </TouchableOpacity>
        </>
      );
    }

    // Default PENDING
    return (
      <>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="clock-outline" size={44} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Application Under Review</Text>
        <Text style={styles.subtitle}>
          Your Pathology Partner application & onboarding documents have been submitted and are currently under review by the MedsSeva Admin Team.
        </Text>

        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="shield-check-outline" size={20} color="#0369A1" />
          <Text style={styles.infoText}>
            Verification takes 24-48 hours. Once approved, your account will be activated to accept diagnostic lab referrals.
          </Text>
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={checkStatus}>
          <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
          <Text style={styles.refreshBtnText}>Check Live Status</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/(auth)/account-type')}>
          <Text style={styles.homeBtnText}>Back to Account Selection</Text>
        </TouchableOpacity>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.card}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#F8FAFC',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 24, padding: 28,
    alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', ...SHADOWS.soft, width: '100%', maxWidth: 420,
  },
  centerBox: { alignItems: 'center', paddingVertical: 20 },
  loadingText: { marginTop: 12, fontSize: 13, color: '#64748B', fontWeight: '600' },
  iconCircle: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: '#F0FDFA',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#CCFBF1', marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: '900', color: '#0F172A', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 21, marginBottom: 20 },
  infoBox: {
    flexDirection: 'row', backgroundColor: '#F0F9FF', borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: '#BAE6FD',
    alignItems: 'flex-start', gap: 10, marginBottom: 24, width: '100%',
  },
  infoText: { fontSize: 13, color: '#0369A1', lineHeight: 19, flex: 1 },
  loginBtn: {
    backgroundColor: COLORS.primary, height: 50, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', width: '100%', marginBottom: 12, ...SHADOWS.soft,
  },
  loginBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  refreshBtn: {
    backgroundColor: COLORS.primary, height: 48, borderRadius: 14,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 8, width: '100%', marginBottom: 12, ...SHADOWS.soft,
  },
  refreshBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  homeBtn: {
    height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    width: '100%', borderWidth: 1.5, borderColor: '#CBD5E1',
  },
  homeBtnText: { fontSize: 14, fontWeight: '700', color: '#475569' },
});