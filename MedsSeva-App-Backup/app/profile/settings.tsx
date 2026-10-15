import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { ConfirmSheet } from '../../src/components/ConfirmSheet';
import { performLogout } from '../../src/utils/logout';
import { apiService } from '../../src/services/api';
import { showError, showSuccess } from '../../src/store/toastStore';

type SectionItem = {
  icon: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  destructive?: boolean;
};

function SettingsRow({ icon, label, subtitle, onPress, destructive }: SectionItem) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.rowIcon, destructive && styles.rowIconDestructive]}>
        <MaterialCommunityIcons
          name={icon as any}
          size={20}
          color={destructive ? COLORS.danger : COLORS.primary}
        />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>{label}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={destructive ? COLORS.danger : '#CBD5E1'}
      />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [showLogoutSheet, setShowLogoutSheet] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await apiService.deleteAccount();
      setShowDeleteSheet(false);
      showSuccess('Your account has been deleted successfully.');
      await performLogout();
    } catch (err: any) {
      setShowDeleteSheet(false);
      const msg = err.response?.data?.error || 'Failed to delete account. Please try again.';
      showError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

  <ScreenWrapper contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionLabel}>PROFILE</Text>
        <View style={styles.group}>
          <SettingsRow
            icon="account-edit-outline"
            label="Edit Profile"
            subtitle="Update your personal information"
            onPress={() => router.push('/profile/edit')}
          />
        </View>

        <Text style={styles.sectionLabel}>SECURITY</Text>
        <View style={styles.group}>
          <SettingsRow
            icon="lock-reset"
            label="Change Password"
            onPress={() => router.push('/profile/info?type=help&title=Change Password')}
          />
        </View>

        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.group}>
          <SettingsRow
            icon="logout"
            label="Log Out"
            onPress={() => setShowLogoutSheet(true)}
            destructive
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="delete-outline"
            label="Delete Account"
            subtitle="Permanently remove your account"
            onPress={() => setShowDeleteSheet(true)}
            destructive
          />
        </View>

        <Text style={styles.versionText}>App Version 1.0.0 (Build 42)</Text>
    </ScreenWrapper>

      <ConfirmSheet
        visible={showLogoutSheet}
        title="Log Out"
        message="Are you sure you want to log out of your account?"
        confirmLabel="Log Out"
        cancelLabel="Cancel"
        confirmDestructive
        onConfirm={() => {
          setShowLogoutSheet(false);
          performLogout();
        }}
        onCancel={() => setShowLogoutSheet(false)}
      />

      <ConfirmSheet
        visible={showDeleteSheet}
        title="Delete Account"
        message="This will permanently delete your medical history, reports, and active bookings. This action cannot be reversed."
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete Account'}
        cancelLabel="Keep Account"
        confirmDestructive
        onConfirm={handleDeleteAccount}
        onCancel={() => !isDeleting && setShowDeleteSheet(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  scroll: {
    padding: 20,
    paddingBottom: 48,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
    marginTop: 4,
  },
  group: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(0,109,111,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  rowIconDestructive: {
    backgroundColor: '#FEF2F2',
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  rowLabelDestructive: {
    color: COLORS.danger,
  },
  rowSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 68,
  },
  versionText: {
    fontSize: 12,
    color: '#CBD5E1',
    textAlign: 'center',
    marginTop: 8,
  },
});