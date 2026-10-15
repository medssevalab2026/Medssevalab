import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, StatusBar, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../src/theme/theme';
import { apiService } from '../../src/services/api';
import ScreenWrapper from '../../src/components/ScreenWrapper';
export default function RatingScreen() {
  const { bookingId, bookingCode, partnerName } = useLocalSearchParams<{
    bookingId: string;
    bookingCode: string;
    partnerName: string;
  }>();
  const router = useRouter();

  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [existingRating, setExistingRating] = useState<any>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);

  useEffect(() => {
    if (!bookingId) return;
   apiService.getBookingRating(bookingId)
      .then((r: any) => {
        if (r) {
          setExistingRating(r);
          setSelected(r.rating);
          setReview(r.review || '');
        }
      })
      .catch(() => {})
      .finally(() => setCheckingExisting(false));
  }, [bookingId]);

  const handleSubmit = async () => {
    if (selected === 0) {
      Alert.alert('Select a rating', 'Please select a star rating before submitting.');
      return;
    }
    setSubmitting(true);
    try {
    await apiService.submitRating({
        bookingId,
        rating: selected,
        review: review.trim() || undefined,
      });
      router.back();
    } catch (err: any) {
      Alert.alert('Failed', err?.response?.data?.error || 'Could not submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingExisting) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const displayStar = hovered || selected;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Your Experience</Text>
        <View style={{ width: 38 }} />
      </View>

<ScreenWrapper disableKeyboardDismiss contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <MaterialCommunityIcons name="account-tie-outline" size={48} color={COLORS.primary} style={{ marginBottom: 8 }} />
          {partnerName ? (
            <Text style={styles.partnerName}>{partnerName}</Text>
          ) : null}
          <Text style={styles.bookingRef}>Booking #{bookingCode}</Text>

          {existingRating ? (
            <View style={styles.alreadyRatedBox}>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(i => (
                  <MaterialCommunityIcons
                    key={i}
                    name={i <= existingRating.rating ? 'star' : 'star-outline'}
                    size={32}
                    color="#F59E0B"
                  />
                ))}
              </View>
              <Text style={styles.alreadyRatedText}>You rated this partner</Text>
              {existingRating.review ? (
                <Text style={styles.alreadyReviewText}>{existingRating.review}</Text>
              ) : null}
            </View>
          ) : (
            <>
              <Text style={styles.prompt}>How was your sample collection experience?</Text>

              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(i => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setSelected(i)}
                    onPressIn={() => setHovered(i)}
                    onPressOut={() => setHovered(0)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={i <= displayStar ? 'star' : 'star-outline'}
                      size={40}
                      color={i <= displayStar ? '#F59E0B' : '#CBD5E1'}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {selected > 0 && (
                <Text style={styles.ratingLabel}>
                  {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][selected]}
                </Text>
              )}

              <TextInput
                style={styles.reviewInput}
                placeholder="Write a review (optional, max 300 characters)"
                placeholderTextColor="#94A3B8"
                multiline
                maxLength={300}
                value={review}
                onChangeText={setReview}
              />
              <Text style={styles.charCount}>{review.length}/300</Text>

              <TouchableOpacity
                style={[styles.submitBtn, (submitting || selected === 0) && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={submitting || selected === 0}
              >
                {submitting
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.submitBtnText}>Submit Rating</Text>
                }
              </TouchableOpacity>
            </>
          )}
</View>
      </ScreenWrapper>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#F8FAFC',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
content: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 24, padding: 28, alignItems: 'center',
    borderWidth: 1, borderColor: '#E2E8F0', ...SHADOWS.soft,
  },
  partnerName: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 4 },
  bookingRef: { fontSize: 13, color: '#94A3B8', marginBottom: 20 },
  prompt: { fontSize: 15, fontWeight: '600', color: '#334155', marginBottom: 20, textAlign: 'center' },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  ratingLabel: { fontSize: 16, fontWeight: '700', color: '#F59E0B', marginBottom: 20 },
  reviewInput: {
    width: '100%', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14,
    padding: 14, fontSize: 14, color: '#0F172A', minHeight: 90,
    textAlignVertical: 'top', marginBottom: 4, backgroundColor: '#F8FAFC',
  },
  charCount: { fontSize: 11, color: '#94A3B8', alignSelf: 'flex-end', marginBottom: 20 },
  submitBtn: {
    width: '100%', backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  alreadyRatedBox: { alignItems: 'center', gap: 8, marginTop: 8 },
  alreadyRatedText: { fontSize: 14, fontWeight: '700', color: '#059669' },
  alreadyReviewText: { fontSize: 13, color: '#64748B', textAlign: 'center', fontStyle: 'italic', marginTop: 4 },
});