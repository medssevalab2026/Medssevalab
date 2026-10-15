import React, { useState, useMemo } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { showError } from '../../src/store/toastStore';
import { apiService } from '../../src/services/api';
import { RootState } from '../../src/store';
import {
  detectCardBrand,
  luhnCheck,
  formatCardNumber,
  validateExpiry,
  validateHolder,
  BRAND_COLORS,
  BRAND_ICONS,
  CardBrand,
} from '../../src/utils/cardUtils';

interface FieldError {
  cardNumber: string | null;
  expiry: string | null;
  cvv: string | null;
  holder: string | null;
}

export default function AddCardScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useSelector((state: RootState) => state.auth.user);
  const mobile = user?.mobile || '';

  const [rawCardNumber, setRawCardNumber] = useState('');
  const [displayCardNumber, setDisplayCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldError>({
    cardNumber: null,
    expiry: null,
    cvv: null,
    holder: null,
  });
  const [touched, setTouched] = useState({
    cardNumber: false,
    expiry: false,
    cvv: false,
    holder: false,
  });

  const detectedBrand = useMemo(() => detectCardBrand(rawCardNumber), [rawCardNumber]);
  const maxCardLength = useMemo(() => Math.max(...detectedBrand.lengths), [detectedBrand]);
  const cvvMax = detectedBrand.cvvLength;

  const brandColors = useMemo(
    () => BRAND_COLORS[detectedBrand.name as CardBrand] ?? BRAND_COLORS['Unknown'],
    [detectedBrand.name]
  );
  const brandLabel = useMemo(
    () => BRAND_ICONS[detectedBrand.name as CardBrand] ?? '••',
    [detectedBrand.name]
  );

  const addCardMutation = useMutation({
    mutationFn: (data: any) => apiService.addPaymentMethod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods', mobile] });
      router.back();
    },
    onError: () => showError('Failed to save card. Please try again.'),
  });

  const handleCardNumberChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, maxCardLength);
    const brand = detectCardBrand(digits);
    const formatted = formatCardNumber(digits, brand);
    setRawCardNumber(digits);
    setDisplayCardNumber(formatted);
    if (digits.length >= 13) {
      const isValid = luhnCheck(digits);
      const isCompleteLength = brand.lengths.includes(digits.length);
      if (!isValid || !isCompleteLength) {
        setFieldErrors((p) => ({ ...p, cardNumber: 'Invalid card number' }));
      } else {
        setFieldErrors((p) => ({ ...p, cardNumber: null }));
      }
    } else {
      setFieldErrors((p) => ({ ...p, cardNumber: null }));
    }
  };

  const handleExpiryChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 4);
    let formatted = digits;
    if (digits.length >= 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    setCardExpiry(formatted);
    if (digits.length === 4) {
      const result = validateExpiry(formatted);
      setFieldErrors((p) => ({ ...p, expiry: result.error }));
    } else {
      setFieldErrors((p) => ({ ...p, expiry: null }));
    }
  };

  const handleCVVChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, cvvMax);
    setCardCVV(digits);
    if (digits.length > 0 && digits.length < cvvMax) {
      setFieldErrors((p) => ({ ...p, cvv: `CVV must be ${cvvMax} digits` }));
    } else {
      setFieldErrors((p) => ({ ...p, cvv: null }));
    }
  };

  const handleHolderChange = (text: string) => {
    const filtered = text.replace(/[^a-zA-Z\s.\-']/g, '');
    setCardHolder(filtered);
    if (filtered.length > 0) {
      const result = validateHolder(filtered);
      setFieldErrors((p) => ({ ...p, holder: result.error }));
    } else {
      setFieldErrors((p) => ({ ...p, holder: null }));
    }
  };

  const handleAddCard = () => {
    setTouched({ cardNumber: true, expiry: true, cvv: true, holder: true });
    const brand = detectCardBrand(rawCardNumber);
    const isValidLength = brand.lengths.includes(rawCardNumber.length);
    const isLuhn = luhnCheck(rawCardNumber);
    const expiryResult = validateExpiry(cardExpiry);
    const holderResult = validateHolder(cardHolder);
    const errors: FieldError = {
      cardNumber: !rawCardNumber || !isValidLength || !isLuhn ? 'Invalid card number' : null,
      expiry: expiryResult.error,
      cvv: cardCVV.length !== cvvMax ? `CVV must be ${cvvMax} digits` : null,
      holder: holderResult.error,
    };
    setFieldErrors(errors);
    if (Object.values(errors).some((e) => e !== null)) return;
    addCardMutation.mutate({
      mobile,
      cardBrand: brand.name,
      last4: rawCardNumber.slice(-4),
      holder: cardHolder.trim().toUpperCase(),
      expiry: cardExpiry,
    });
  };

  const renderFieldStatus = (field: keyof FieldError, value: string, minLen: number) => {
    if (!touched[field] && !value) return null;
    if (fieldErrors[field]) {
      return <Text style={styles.fieldError}>✗ {fieldErrors[field]}</Text>;
    }
    if (value.length >= minLen) {
      return <Text style={styles.fieldSuccess}>✓ Valid</Text>;
    }
    return null;
  };

const saveButton = (
    <TouchableOpacity
      style={[styles.saveBtn, addCardMutation.isPending && { opacity: 0.7 }]}
      activeOpacity={0.8}
      onPress={handleAddCard}
      disabled={addCardMutation.isPending}
    >
      {addCardMutation.isPending ? (
        <ActivityIndicator color="#FFF" />
      ) : (
        <Text style={styles.saveBtnText}>Save Card Securely</Text>
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
        <Text style={styles.headerTitle}>Add Credit / Debit Card</Text>
        <View style={{ width: 40 }} />
      </View>

<ScreenWrapper
        scrollViewStyle={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        bottomButton={saveButton}
      >
        <View style={styles.cardPreviewWrapper}>
          <LinearGradient
            colors={brandColors}
            style={styles.cardPreview}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.cardPreviewTop}>
              <MaterialCommunityIcons name="integrated-circuit-chip" size={28} color="#E2E8F0" />
              <Text style={styles.cardPreviewBrand}>{brandLabel}</Text>
            </View>
            <Text style={styles.cardPreviewNumber}>
              {displayCardNumber || '•••• •••• •••• ••••'}
            </Text>
            <View style={styles.cardPreviewBottom}>
              <Text style={styles.cardPreviewVal}>{cardHolder || 'CARD HOLDER NAME'}</Text>
              <Text style={styles.cardPreviewVal}>{cardExpiry || 'MM/YY'}</Text>
            </View>
          </LinearGradient>
        </View>

        <Text style={styles.inputLabel}>Card Number</Text>
        <View
          style={[
            styles.inputField,
            touched.cardNumber && fieldErrors.cardNumber ? styles.inputFieldError : null,
            touched.cardNumber && !fieldErrors.cardNumber && rawCardNumber.length >= 13
              ? styles.inputFieldSuccess
              : null,
          ]}
        >
          <MaterialCommunityIcons
            name="credit-card-outline"
            size={20}
            color={touched.cardNumber && fieldErrors.cardNumber ? '#EF4444' : COLORS.primary}
            style={{ marginRight: 10 }}
          />
          <TextInput
            placeholder="0000 0000 0000 0000"
            keyboardType="numeric"
            value={displayCardNumber}
            onChangeText={handleCardNumberChange}
            onBlur={() => setTouched((p) => ({ ...p, cardNumber: true }))}
            style={styles.textInput}
            placeholderTextColor="#94A3B8"
          />
        </View>
        {renderFieldStatus('cardNumber', rawCardNumber, 13)}

        <View style={styles.rowFields}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.inputLabel}>Expiry Date</Text>
            <View
              style={[
                styles.inputField,
                touched.expiry && fieldErrors.expiry ? styles.inputFieldError : null,
                touched.expiry && !fieldErrors.expiry && cardExpiry.length === 5
                  ? styles.inputFieldSuccess
                  : null,
              ]}
            >
              <TextInput
                placeholder="MM/YY"
                keyboardType="numeric"
                value={cardExpiry}
                onChangeText={handleExpiryChange}
                onBlur={() => setTouched((p) => ({ ...p, expiry: true }))}
                maxLength={5}
                style={styles.textInput}
                placeholderTextColor="#94A3B8"
              />
            </View>
            {renderFieldStatus('expiry', cardExpiry, 5)}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>CVV {cvvMax === 4 ? '(4 digits)' : ''}</Text>
            <View
              style={[
                styles.inputField,
                touched.cvv && fieldErrors.cvv ? styles.inputFieldError : null,
                touched.cvv && !fieldErrors.cvv && cardCVV.length === cvvMax
                  ? styles.inputFieldSuccess
                  : null,
              ]}
            >
              <TextInput
                placeholder={cvvMax === 4 ? '••••' : '•••'}
                keyboardType="numeric"
                secureTextEntry
                maxLength={cvvMax}
                value={cardCVV}
                onChangeText={handleCVVChange}
                onBlur={() => setTouched((p) => ({ ...p, cvv: true }))}
                style={styles.textInput}
                placeholderTextColor="#94A3B8"
              />
            </View>
            {renderFieldStatus('cvv', cardCVV, cvvMax)}
          </View>
        </View>

        <Text style={styles.inputLabel}>Card Holder Name</Text>
        <View
          style={[
            styles.inputField,
            touched.holder && fieldErrors.holder ? styles.inputFieldError : null,
            touched.holder && !fieldErrors.holder && cardHolder.length >= 2
              ? styles.inputFieldSuccess
              : null,
          ]}
        >
          <TextInput
            placeholder="Name printed on card"
            autoCapitalize="characters"
            value={cardHolder}
            onChangeText={handleHolderChange}
            onBlur={() => setTouched((p) => ({ ...p, holder: true }))}
            style={styles.textInput}
            placeholderTextColor="#94A3B8"
          />
        </View>
        {renderFieldStatus('holder', cardHolder, 2)}

        <View style={styles.secureNote}>
          <MaterialCommunityIcons name="shield-check-outline" size={14} color="#64748B" />
          <Text style={styles.secureNoteText}>
            Your CVV and full card number are never stored.
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
  cardPreviewWrapper: {
    height: 180,
    borderRadius: 20,
    marginBottom: 28,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  cardPreview: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardPreviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardPreviewBrand: { color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 1 },
  cardPreviewNumber: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 3,
    textAlign: 'center',
  },
  cardPreviewBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  cardPreviewVal: { color: '#fff', fontSize: 12, fontWeight: '700', opacity: 0.9 },
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
    marginBottom: 4,
  },
  inputFieldError: { borderColor: '#EF4444', backgroundColor: '#FFF5F5' },
  inputFieldSuccess: { borderColor: '#10B981', backgroundColor: '#F0FDF4' },
  textInput: { flex: 1, fontSize: 15, color: '#0F172A', fontWeight: '500' },
  fieldError: { fontSize: 11, color: '#EF4444', marginBottom: 10, marginLeft: 4 },
  fieldSuccess: { fontSize: 11, color: '#10B981', marginBottom: 10, marginLeft: 4 },
  rowFields: { flexDirection: 'row' },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
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