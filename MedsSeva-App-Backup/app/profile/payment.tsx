import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { showError } from '../../src/store/toastStore';
import { ConfirmSheet } from '../../src/components/ConfirmSheet';
import { apiService } from '../../src/services/api';
import { RootState } from '../../src/store';
import { CardBrand } from '../../src/utils/cardUtils';

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useSelector((state: RootState) => state.auth.user);
  const mobile = user?.mobile || '';

  const [deleteCardTarget, setDeleteCardTarget] = React.useState<string | null>(null);
  const [deleteUpiTarget, setDeleteUpiTarget] = React.useState<string | null>(null);

  const { data: cards = [], isLoading: cardsLoading } = useQuery({
    queryKey: ['paymentMethods', mobile],
    queryFn: () => apiService.getPaymentMethods(mobile),
    enabled: !!mobile,
  });

  const { data: upis = [], isLoading: upisLoading } = useQuery({
    queryKey: ['upiMethods', mobile],
    queryFn: () => apiService.getUpiMethods(mobile),
    enabled: !!mobile,
  });

  const primaryUpi = (upis as any[]).find((u) => u.isPrimary);

  const setDefaultCardMutation = useMutation({
    mutationFn: (id: string) => apiService.setDefaultPaymentMethod(id, mobile),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['paymentMethods', mobile] }),
    onError: () => showError('Could not set default card.'),
  });

  const removeCardMutation = useMutation({
    mutationFn: (id: string) => apiService.removePaymentMethod(id, mobile),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['paymentMethods', mobile] }),
    onError: () => showError('Could not remove card.'),
  });

  const setPrimaryUpiMutation = useMutation({
    mutationFn: (id: string) => apiService.setPrimaryUpi(id, mobile),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['upiMethods', mobile] }),
    onError: () => showError('Could not update primary UPI.'),
  });

  const removeUpiMutation = useMutation({
    mutationFn: (id: string) => apiService.removeUpiMethod(id, mobile),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['upiMethods', mobile] }),
    onError: () => showError('Could not remove UPI ID.'),
  });

  const confirmDeleteCard = () => {
    if (!deleteCardTarget) return;
    removeCardMutation.mutate(deleteCardTarget);
    setDeleteCardTarget(null);
  };

  const confirmDeleteUpi = () => {
    if (!deleteUpiTarget) return;
    removeUpiMutation.mutate(deleteUpiTarget);
    setDeleteUpiTarget(null);
  };

  const isLoading = cardsLoading || upisLoading;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
    <ScreenWrapper contentContainerStyle={styles.scrollContent}>
          {primaryUpi && (
            <>
              <Text style={styles.sectionTitle}>Preferred Method</Text>
              <View style={styles.preferredCard}>
                <LinearGradient
                  colors={[COLORS.primary, '#0a7a7c']}
                  style={styles.preferredInner}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.preferredLeft}>
                    <View style={styles.preferredIconBox}>
                      <MaterialCommunityIcons name="bank-outline" size={22} color={COLORS.primary} />
                    </View>
                    <View style={{ marginLeft: 14 }}>
                      <Text style={styles.preferredActiveLabel}>ACTIVE CHOICE</Text>
                      <Text style={styles.preferredName}>{primaryUpi.provider} UPI</Text>
                    </View>
                  </View>
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                  </View>
                </LinearGradient>
                <View style={styles.preferredBottom}>
                  <View>
                    <Text style={styles.preferredLinkedLabel}>linked to</Text>
                    <Text style={styles.preferredLinkedValue}>{primaryUpi.upiId}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.changeBtn}
                    onPress={() => router.push('/profile/add-upi')}
                  >
                    <Text style={styles.changeBtnText}>Change</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Saved UPI IDs</Text>
            <TouchableOpacity onPress={() => router.push('/profile/add-upi')} style={styles.addNewBtn}>
              <MaterialCommunityIcons name="plus" size={16} color={COLORS.primary} />
              <Text style={styles.addNewBtnText}>Add New</Text>
            </TouchableOpacity>
          </View>

          {(upis as any[]).length === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons name="link-off" size={32} color="#CBD5E1" />
              <Text style={styles.emptyText}>No linked UPI IDs</Text>
            </View>
          ) : (
            <View style={styles.listCard}>
              {(upis as any[]).map((upi: any, index: number) => (
                <View key={upi.id}>
                  {index > 0 && <View style={styles.divider} />}
                  <TouchableOpacity
                    style={styles.upiRow}
                    activeOpacity={0.7}
                    onPress={() => !upi.isPrimary && setPrimaryUpiMutation.mutate(upi.id)}
                    onLongPress={() => setDeleteUpiTarget(upi.id)}
                  >
                    <View style={styles.upiIconBox}>
                      <MaterialCommunityIcons name="bank-outline" size={20} color="#64748B" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.upiName}>{upi.provider}</Text>
                      <Text style={styles.upiValue}>{upi.upiId}</Text>
                    </View>
                    {!upi.isPrimary && (
                      <TouchableOpacity
                        onPress={() => setPrimaryUpiMutation.mutate(upi.id)}
                        style={styles.setDefaultBtn}
                      >
                        <Text style={styles.setDefaultText}>Set as Default</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => setDeleteUpiTarget(upi.id)}
                      style={styles.deleteIconBtn}
                    >
                      <MaterialCommunityIcons name="delete-outline" size={20} color="#94A3B8" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={[styles.sectionRow, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>Saved Cards</Text>
          </View>

          {(cards as any[]).length === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons name="credit-card-off-outline" size={32} color="#CBD5E1" />
              <Text style={styles.emptyText}>No saved cards</Text>
            </View>
          ) : (
            <View style={styles.listCard}>
              {(cards as any[]).map((card: any, index: number) => {
                return (
                  <View key={card.id}>
                    {index > 0 && <View style={styles.divider} />}
                    <View style={styles.cardRow}>
                      <View style={styles.cardRowLeft}>
                        {card.isPrimary && (
                          <View style={styles.primaryChip}>
                            <Text style={styles.primaryChipText}>PRIMARY</Text>
                          </View>
                        )}
                        <Text style={styles.cardBankName}>{card.cardBrand} Card</Text>
                        <Text style={styles.cardBrandSub}>{card.cardBrand} • Debit Card</Text>
                        <View style={styles.cardMeta}>
                          <View>
                            <Text style={styles.cardMetaLabel}>CARD NUMBER</Text>
                            <Text style={styles.cardMetaValue}>•••• {card.last4}</Text>
                          </View>
                          <View style={{ marginLeft: 24 }}>
                            <Text style={styles.cardMetaLabel}>EXPIRES</Text>
                            <Text style={styles.cardMetaValue}>{card.expiry}</Text>
                          </View>
                        </View>
                        {!card.isPrimary && (
                          <TouchableOpacity onPress={() => setDefaultCardMutation.mutate(card.id)}>
                            <Text style={styles.setDefaultText}>Set as Default</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() => setDeleteCardTarget(card.id)}
                        style={styles.deleteIconBtn}
                      >
                        <MaterialCommunityIcons name="delete-outline" size={20} color="#94A3B8" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <TouchableOpacity
            style={styles.addMethodBtn}
            onPress={() => router.push('/profile/add-card')}
          >
            <MaterialCommunityIcons name="plus-circle-outline" size={22} color={COLORS.primary} />
            <Text style={styles.addMethodBtnText}>Add New Payment Method</Text>
          </TouchableOpacity>

      <View style={{ height: 40 }} />
        </ScreenWrapper>
      )}

      <ConfirmSheet
        visible={!!deleteCardTarget}
        title="Remove Card"
        message="Are you sure you want to remove this card?"
        confirmLabel="Remove"
        confirmDestructive
        onConfirm={confirmDeleteCard}
        onCancel={() => setDeleteCardTarget(null)}
      />

      <ConfirmSheet
        visible={!!deleteUpiTarget}
        title="Remove UPI ID"
        message="Are you sure you want to remove this UPI ID?"
        confirmLabel="Remove"
        confirmDestructive
        onConfirm={confirmDeleteUpi}
        onCancel={() => setDeleteUpiTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 45,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { padding: 8 },
  headerTitle: { ...TYPOGRAPHY.h2, color: '#fff' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 50 },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  addNewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addNewBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  preferredCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.primary,
    ...SHADOWS.soft,
  },
  preferredInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  preferredLeft: { flexDirection: 'row', alignItems: 'center' },
  preferredIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  preferredActiveLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
  },
  preferredName: { fontSize: 16, fontWeight: '800', color: '#fff' },
  defaultBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  defaultBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  preferredBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  preferredLinkedLabel: { fontSize: 11, color: '#94A3B8' },
  preferredLinkedValue: { fontSize: 13, fontWeight: '600', color: '#0F172A', marginTop: 2 },
  changeBtn: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  changeBtnText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  listCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 16 },
  upiRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  upiIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  upiName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  upiValue: { fontSize: 12, color: '#64748B', marginTop: 2 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 16 },
  cardRowLeft: { flex: 1 },
  primaryChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,109,111,0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  primaryChipText: { fontSize: 9, fontWeight: '800', color: COLORS.primary, letterSpacing: 0.5 },
  cardBankName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  cardBrandSub: { fontSize: 12, fontStyle: 'italic', color: '#64748B', marginTop: 2 },
  cardMeta: { flexDirection: 'row', marginTop: 12, marginBottom: 8 },
  cardMetaLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardMetaValue: { fontSize: 13, fontWeight: '600', color: '#0F172A' },
  setDefaultBtn: { marginRight: 8 },
  setDefaultText: { fontSize: 13, fontWeight: '600', color: COLORS.primary, marginTop: 4 },
  deleteIconBtn: { padding: 4, marginLeft: 8 },
  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 28,
    alignItems: 'center',
  },
  emptyText: { fontSize: 13, color: '#94A3B8', marginTop: 10, fontWeight: '500' },
  addMethodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(0,128,128,0.02)',
    marginTop: 20,
  },
  addMethodBtnText: { color: COLORS.primary, fontWeight: '700', marginLeft: 8, fontSize: 14 },
});