import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { showError } from '../../src/store/toastStore';
import { apiService } from '../../src/services/api';
import { RootState } from '../../src/store';

const UPI_PROVIDERS = ['GPay', 'PhonePe', 'Paytm', 'BHIM'];
const UPI_HANDLES = ['@okaxis', '@ybl', '@paytm', '@upi', '@okicici'];

export default function AddUpiScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useSelector((state: RootState) => state.auth.user);
  const mobile = user?.mobile || '';

  const [newUpiId, setNewUpiId] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('GPay');

  const addUpiMutation = useMutation({
    mutationFn: (data: { mobile: string; upiId: string; provider: string }) =>
      apiService.addUpiMethod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upiMethods', mobile] });
      router.back();
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.error || 'Failed to link UPI ID.';
      showError(msg);
    },
  });

  const handleLinkUpi = () => {
    if (!newUpiId.includes('@') || newUpiId.trim().length < 5) {
      showError('Please enter a valid UPI handle (e.g. user@bank).');
      return;
    }
    addUpiMutation.mutate({ mobile, upiId: newUpiId.trim(), provider: selectedProvider });
  };

const saveButton = (
    <TouchableOpacity
      style={[styles.saveBtn, addUpiMutation.isPending && { opacity: 0.7 }]}
      activeOpacity={0.8}
      onPress={handleLinkUpi}
      disabled={addUpiMutation.isPending}
    >
      {addUpiMutation.isPending ? (
        <ActivityIndicator color="#FFF" />
      ) : (
        <Text style={styles.saveBtnText}>Link UPI ID</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Link UPI ID</Text>
        <View style={{ width: 40 }} />
      </View>

  <ScreenWrapper
        scrollViewStyle={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        bottomButton={saveButton}
      >
        <View style={styles.illustrationBox}>
          <MaterialCommunityIcons name="bank-transfer" size={48} color={COLORS.primary} />
          <Text style={styles.illustrationTitle}>Link Your UPI</Text>
          <Text style={styles.illustrationSub}>
            Pay instantly for your bookings using any UPI app
          </Text>
        </View>

        <Text style={styles.inputLabel}>Select App Provider</Text>
        <View style={styles.chipRow}>
          {UPI_PROVIDERS.map((prov) => (
            <TouchableOpacity
              key={prov}
              style={[styles.chip, selectedProvider === prov && styles.chipActive]}
              onPress={() => setSelectedProvider(prov)}
            >
              <Text style={[styles.chipText, selectedProvider === prov && styles.chipTextActive]}>
                {prov}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.inputLabel}>Enter UPI Address</Text>
        <View style={styles.inputField}>
          <MaterialCommunityIcons
            name="at"
            size={20}
            color={COLORS.primary}
            style={{ marginRight: 10 }}
          />
          <TextInput
            placeholder="mobilenumber@ybl or username@okaxis"
            autoCapitalize="none"
            value={newUpiId}
            onChangeText={setNewUpiId}
            style={styles.textInput}
            placeholderTextColor="#94A3B8"
            autoCorrect={false}
          />
        </View>

        <Text style={styles.quickFillHeader}>Quick autofill handles:</Text>
        <View style={styles.chipRow}>
          {UPI_HANDLES.map((tail) => (
            <TouchableOpacity
              key={tail}
              style={styles.miniChip}
              onPress={() => {
                const base = newUpiId.split('@')[0] || '';
                setNewUpiId(`${base}${tail}`);
              }}
            >
              <Text style={styles.miniChipText}>{tail}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.secureNote}>
          <MaterialCommunityIcons name="shield-check-outline" size={14} color="#64748B" />
          <Text style={styles.secureNoteText}>
            Your UPI ID is encrypted and stored securely.
          </Text>
        </View>

<View style={{ height: 40 }} />
      </ScreenWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 45,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { padding: 8 },
  headerTitle: { ...TYPOGRAPHY.h2, color: '#fff', fontSize: 18 },
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 20, paddingBottom: 60 },
  illustrationBox: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.soft,
  },
  illustrationTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 6,
  },
  illustrationSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    marginTop: 4,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  textInput: { flex: 1, fontSize: 15, color: '#0F172A', fontWeight: '500' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  chipTextActive: { color: '#fff' },
  miniChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  miniChipText: { fontSize: 11, color: COLORS.primary, fontWeight: '700' },
  quickFillHeader: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    marginBottom: 20,
    gap: 8,
  },
  secureNoteText: { fontSize: 11, color: '#64748B', flex: 1 },
  saveBtn: {
    backgroundColor: COLORS.primary,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});