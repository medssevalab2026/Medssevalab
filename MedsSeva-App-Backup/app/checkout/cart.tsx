import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import { showSuccess, showError } from '../../src/store/toastStore';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { RootState } from '../../src/store';
import { removeFromCart } from '../../src/store/slices/cartSlice';
import { setCollectionMode, setAppliedCouponCode } from '../../src/store/slices/bookingSlice';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { PremiumBottomSheet } from '../../src/components/PremiumBottomSheet';
import { couponApiService, apiService } from '../../src/services/api';
import { formatCurrency } from '../../src/utils/currency';

interface BackendCoupon {
  id: string;
  code: string;
  name?: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
  isFirstOrderOnly: boolean;
  _count?: { redemptions: number };
}

export default function CartScreen() {
  const router = useRouter();
  const dispatch = useDispatch();

  const cart = useSelector((state: RootState) => state.cart);

  const [visitMode, setVisitMode] = useState<'home' | 'center'>('home');

  const [isCouponSheetOpen, setCouponSheetOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; val: number; couponId: string } | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const [availableCoupons, setAvailableCoupons] = useState<BackendCoupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);

  const [pricing, setPricing] = useState<any>(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  const inputRef = useRef<TextInput>(null);

const testIds = cart.items.filter(i => i.itemType === 'test').map(i => i.id);
  const packageIds = cart.items
    .filter(i => i.itemType === 'package' && !i.id.startsWith('custom_package_'))
    .map(i => i.id);
  const customPackageTotal = cart.items
    .filter(i => i.id.startsWith('custom_package_'))
    .reduce((sum, i) => sum + (Number(i.discountedPrice) || 0), 0);

const fetchPricing = useCallback(async (coupon?: string) => {
    if (cart.items.length === 0) return;
    const hasNonCustomItems = cart.items.some(i => !i.id.startsWith('custom_package_'));
    if (!hasNonCustomItems) {
      setPricing(null);
      setPricingLoading(false);
      return;
    }
    setPricingLoading(true);
    try {
      const result = await apiService.getPricingPreview({
        testIds,
        packageIds,
        collectionMode: visitMode === 'home' ? 'HOME' : 'LAB',
        couponCode: coupon,
      });
      setPricing(result.pricing);
    } catch {
      setPricing(null);
    } finally {
      setPricingLoading(false);
    }
  }, [testIds.join(','), packageIds.join(','), visitMode]);

  const fetchAvailableCoupons = useCallback(async () => {
    setCouponsLoading(true);
    try {
      const data = await couponApiService.getPublicCoupons();
      const now = new Date();
      const active = (data as BackendCoupon[]).filter(c => {
        if (!c.isActive) return false;
        if (c.expiresAt && new Date(c.expiresAt) < now) return false;
        return true;
      });
      setAvailableCoupons(active);
    } catch {
      setAvailableCoupons([]);
    } finally {
      setCouponsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPricing(appliedCoupon?.code);
    }, [fetchPricing])
  );

  const handleOpenCouponSheet = useCallback(() => {
    fetchAvailableCoupons();
    setCouponError('');
    setCouponSheetOpen(true);
  }, [fetchAvailableCoupons]);

  const handleApplyCoupon = useCallback(async (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    Keyboard.dismiss();
    setCouponLoading(true);
    setCouponError('');

    try {
      const subtotal = pricing?.subtotal ?? cart.items.reduce((sum, i) => sum + i.discountedPrice, 0);
      const result = await couponApiService.validate({
        code: trimmed,
        cartTotal: subtotal,
        testIds,
        packageIds,
        collectionMode: visitMode === 'home' ? 'HOME' : 'LAB',
      });

      if (!result.valid) {
        setCouponError(result.error || 'Invalid coupon');
        return;
      }

      setAppliedCoupon({ code: trimmed, val: result.discount, couponId: result.couponId });
      dispatch(setAppliedCouponCode(trimmed));
      setCouponInput('');
      setCouponSheetOpen(false);
      await fetchPricing(trimmed);
      showSuccess(`Coupon applied! You saved ₹${result.discount}`);
    } catch (err: any) {
      setCouponError(err.response?.data?.error || 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  }, [pricing, cart.items, testIds, packageIds, visitMode, fetchPricing, dispatch]);

  const handleRemoveCoupon = useCallback(() => {
    setAppliedCoupon(null);
    dispatch(setAppliedCouponCode(null));
    fetchPricing(undefined);
  }, [fetchPricing, dispatch]);

const calculatedFinalAmount = parseFloat(((pricing?.finalAmount ?? 0) + customPackageTotal).toFixed(2));

  const getBadgeLabel = (coupon: BackendCoupon): string => {
    const now = new Date();
    const created = new Date(coupon.id ? 0 : 0);
    const isNew = coupon.usedCount === 0;
    const isLimited = coupon.usageLimit && (coupon.usageLimit - coupon.usedCount) <= 10;

    if (isNew) return 'NEW';
    if (isLimited) return 'LIMITED';
    if (coupon.discountType === 'FIXED') return `FLAT ₹${coupon.discountValue} OFF`;
    return `${coupon.discountValue}% OFF`;
  };

  const getBadgeColor = (label: string): string => {
    if (label === 'NEW') return '#10B981';
    if (label === 'LIMITED') return '#F59E0B';
    return COLORS.primary;
  };

  const formatExpiry = (expiresAt?: string): string => {
    if (!expiresAt) return 'No Expiry';
    return `Expires ${new Date(expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const renderCouponCard = ({ item }: { item: BackendCoupon }) => {
    const isApplied = appliedCoupon?.code === item.code;
    const badge = getBadgeLabel(item);
    const badgeColor = getBadgeColor(badge);

    return (
      <View style={[styles.couponCard, isApplied && styles.couponCardSelected]}>
        <View style={styles.couponCardTop}>
          <View style={styles.couponCardLeft}>
            <View style={[styles.badge, { backgroundColor: badgeColor + '20', borderColor: badgeColor + '40' }]}>
              <Text style={[styles.badgeText, { color: badgeColor }]}>{badge}</Text>
            </View>
            <Text style={styles.couponCode}>{item.code}</Text>
            {item.name ? <Text style={styles.couponName}>{item.name}</Text> : null}
            {item.description ? <Text style={styles.couponDesc}>{item.description}</Text> : null}
          </View>
          <TouchableOpacity
            style={[styles.applyChip, isApplied && styles.applyChipApplied]}
            onPress={() => isApplied ? handleRemoveCoupon() : handleApplyCoupon(item.code)}
            disabled={couponLoading}
          >
            <Text style={[styles.applyChipText, isApplied && styles.applyChipTextApplied]}>
              {isApplied ? 'Applied' : 'Apply'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.couponDivider} />

        <View style={styles.couponCardMeta}>
          <View style={styles.couponMetaItem}>
            <MaterialCommunityIcons name="tag-outline" size={13} color="#64748B" />
            <Text style={styles.couponMetaText}>
              {item.discountType === 'FIXED'
                ? `Flat ₹${item.discountValue} off`
                : `${item.discountValue}% off${item.maxDiscount ? ` (upto ₹${item.maxDiscount})` : ''}`}
            </Text>
          </View>
          {item.minOrderAmount > 0 && (
            <View style={styles.couponMetaItem}>
              <MaterialCommunityIcons name="cart-outline" size={13} color="#64748B" />
              <Text style={styles.couponMetaText}>Min order ₹{item.minOrderAmount}</Text>
            </View>
          )}
          <View style={styles.couponMetaItem}>
            <MaterialCommunityIcons name="calendar-outline" size={13} color="#64748B" />
            <Text style={styles.couponMetaText}>{formatExpiry(item.expiresAt)}</Text>
          </View>
          {item.isFirstOrderOnly && (
            <View style={styles.couponMetaItem}>
              <MaterialCommunityIcons name="star-outline" size={13} color="#F59E0B" />
              <Text style={[styles.couponMetaText, { color: '#F59E0B' }]}>First order only</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (cart.items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textLight} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Cart</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContent}>
          <MaterialCommunityIcons name="cart-off" size={80} color={COLORS.border} />
          <Text style={styles.emptyTitle}>Cart is Empty</Text>
          <Text style={styles.emptyDesc}>Add some tests to your cart to proceed with booking.</Text>
          <TouchableOpacity style={styles.addTestBtn} onPress={() => router.push('/search')}>
            <Text style={styles.addTestBtnText}>Browse Tests</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Cart ({cart.items.length})</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScreenWrapper
        bottomButton={
          <View style={styles.footerInner}>
            <View style={styles.footerLeft}>
              <Text style={styles.footerTotalLabel}>Total Amount</Text>
           <Text style={styles.footerTotalAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{formatCurrency(calculatedFinalAmount)}</Text>
            </View>
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => {
                dispatch(setCollectionMode(visitMode === 'center' ? 'lab' : 'home'));
                router.push('/checkout/address');
              }}
            >
              <Text style={styles.continueBtnText}>Continue Booking</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.visitSelector}>
          <TouchableOpacity
            style={[styles.visitBtn, visitMode === 'home' && styles.visitBtnActive]}
            onPress={() => setVisitMode('home')}
          >
            <MaterialCommunityIcons name="home-circle-outline" size={20} color={visitMode === 'home' ? '#FFF' : COLORS.primary} />
            <Text style={[styles.visitBtnText, visitMode === 'home' && styles.visitBtnTextActive]}>Home Collection</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.visitBtn, visitMode === 'center' && styles.visitBtnActive]}
            onPress={() => setVisitMode('center')}
          >
            <MaterialCommunityIcons name="office-building" size={18} color={visitMode === 'center' ? '#FFF' : COLORS.primary} />
            <Text style={[styles.visitBtnText, visitMode === 'center' && styles.visitBtnTextActive]}>Lab Walk-in</Text>
          </TouchableOpacity>
        </View>

        {visitMode === 'center' && (
          <View style={styles.centersSection}>
            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information-outline" size={20} color={COLORS.primary} />
              <Text style={styles.infoBoxText}>
                You'll select your preferred lab branch on the next screen.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.cartItemsHeader}>
          <Text style={styles.sectionSubhead}>Tests Added ({cart.items.length})</Text>
        </View>

        {cart.items.map(item => (
          <View key={item.id} style={styles.cartCard}>
            <View style={styles.cartCardLeft}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDesc}>
                {item.homeCollection ? 'Home Collection Available' : 'Lab Visit Required'}
              </Text>
              <View style={styles.priceRow}>
                <Text style={styles.discountedPrice}>₹{item.discountedPrice}</Text>
                <Text style={styles.originalPrice}>₹{item.price}</Text>
              </View>
            </View>
            <View style={styles.cartCardRight}>
              <TouchableOpacity
                onPress={() => dispatch(removeFromCart({ id: item.id, itemType: item.itemType }))}
                style={styles.removeBtn}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={20} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addMoreBtn} onPress={() => router.push('/search')}>
          <MaterialCommunityIcons name="plus" size={20} color={COLORS.primary} />
          <Text style={styles.addMoreText}>Add More Tests</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.couponStrip}
          activeOpacity={0.7}
          onPress={handleOpenCouponSheet}
        >
          <MaterialCommunityIcons name="ticket-percent-outline" size={24} color={COLORS.primary} />
          <View style={styles.couponStripCenter}>
            <Text style={styles.couponTitle}>
              {appliedCoupon ? `Coupon: ${appliedCoupon.code}` : 'Apply Coupons & Offers'}
            </Text>
            <Text style={styles.couponSub}>
              {appliedCoupon ? `You saved ₹${appliedCoupon.val} on this order!` : 'View all available offers'}
            </Text>
          </View>
          {appliedCoupon ? (
            <TouchableOpacity onPress={handleRemoveCoupon} style={styles.couponRemoveBtn}>
              <Text style={styles.removeCouponText}>Remove</Text>
            </TouchableOpacity>
          ) : (
            <MaterialCommunityIcons name="chevron-right" size={24} color="#94A3B8" />
          )}
        </TouchableOpacity>

        <View style={styles.billContainer}>
          <Text style={styles.billTitle}>Bill Details</Text>
          {pricingLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 12 }} />
          ) : pricing ? (
            <>
       <View style={styles.billRow}>
                <Text style={styles.billLabel}>Item Total</Text>
                <Text style={styles.billValue}>{formatCurrency(pricing.subtotal)}</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Discount</Text>
                <Text style={[styles.billValue, { color: COLORS.success }]}>- {formatCurrency(pricing.testDiscount)}</Text>
              </View>
              {pricing.couponDiscount > 0 && (
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Coupon ({pricing.couponCode})</Text>
                  <Text style={[styles.billValue, { color: COLORS.success }]}>- {formatCurrency(pricing.couponDiscount)}</Text>
                </View>
              )}
              {pricing.collectionCharge > 0 && (
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Home Collection Charge</Text>
                  <Text style={styles.billValue}>{formatCurrency(pricing.collectionCharge)}</Text>
                </View>
              )}
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Taxes (18% GST)</Text>
                <Text style={styles.billValue}>{formatCurrency(pricing.gst)}</Text>
              </View>
            </>
          ) : null}
          <View style={styles.divider} />
        <View style={styles.billRow}>
            <Text style={styles.billTotalLabel}>To Pay</Text>
            <Text style={styles.billTotalValue}>{formatCurrency(calculatedFinalAmount)}</Text>
          </View>
        </View>
      </ScreenWrapper>

      <PremiumBottomSheet
        visible={isCouponSheetOpen}
        onClose={() => {
          Keyboard.dismiss();
          setCouponSheetOpen(false);
          setCouponError('');
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
          <View style={styles.sheetBody}>
            <Text style={styles.sheetTitle}>Coupons & Offers</Text>

            <View style={styles.inputRow}>
              <TextInput
                ref={inputRef}
                style={styles.couponTextInput}
                placeholder="Enter coupon code"
                placeholderTextColor="#94A3B8"
                value={couponInput}
                onChangeText={setCouponInput}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={() => handleApplyCoupon(couponInput)}
              />
              <TouchableOpacity
                style={[styles.applyBtn, !couponInput.trim() && styles.applyBtnDisabled]}
                onPress={() => handleApplyCoupon(couponInput)}
                disabled={couponLoading || !couponInput.trim()}
              >
                {couponLoading
                  ? <ActivityIndicator size="small" color="#FFF" />
                  : <Text style={styles.applyBtnText}>Apply</Text>
                }
              </TouchableOpacity>
            </View>

            {couponError ? (
              <View style={styles.errorRow}>
                <MaterialCommunityIcons name="alert-circle-outline" size={14} color="#EF4444" />
                <Text style={styles.errorText}>{couponError}</Text>
              </View>
            ) : null}

            {couponsLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 24 }} />
            ) : availableCoupons.length > 0 ? (
              <>
                <Text style={styles.availableLabel}>Available Offers</Text>
                <FlatList
                  data={availableCoupons}
                  keyExtractor={item => item.id}
                  renderItem={renderCouponCard}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                />
              </>
            ) : (
              <View style={styles.emptyOffers}>
                <MaterialCommunityIcons name="ticket-outline" size={40} color={COLORS.border} />
                <Text style={styles.emptyOffersText}>No offers available right now</Text>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </PremiumBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textLight,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textDark,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyDesc: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  addTestBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 30,
  },
  addTestBtnText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textLight,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  visitSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 5,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.soft,
  },
  visitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
  },
  visitBtnActive: {
    backgroundColor: COLORS.primary,
  },
  visitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 6,
  },
  visitBtnTextActive: {
    color: '#FFFFFF',
  },
  centersSection: {
    marginBottom: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight + '15',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.primaryLight + '40',
  },
  infoBoxText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    flex: 1,
    marginLeft: 10,
    lineHeight: 18,
  },
  cartItemsHeader: {
    marginTop: 4,
    marginBottom: 8,
  },
  sectionSubhead: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  cartCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  cartCardLeft: {
    flex: 1,
  },
  itemName: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textDark,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemDesc: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountedPrice: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textDark,
    marginRight: 8,
  },
  originalPrice: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  cartCardRight: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    width: 60,
  },
  removeBtn: {
    padding: 8,
    backgroundColor: COLORS.dangerLight,
    borderRadius: 8,
  },
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    marginBottom: 24,
  },
  addMoreText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  couponStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.soft,
  },
  couponStripCenter: {
    flex: 1,
    marginLeft: 12,
  },
  couponTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  couponSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  couponRemoveBtn: {
    padding: 6,
  },
  removeCouponText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.danger,
  },
  billContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  billTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textDark,
    marginBottom: 16,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  billLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  billValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  billTotalLabel: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textDark,
    fontWeight: 'bold',
  },
  billTotalValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textDark,
  },
footerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerLeft: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  footerTotalLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  footerTotalAmount: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textDark,
    flexShrink: 1,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 30,
    flexShrink: 0,
  },
  continueBtnText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textLight,
    fontWeight: 'bold',
    marginRight: 8,
  },
  sheetBody: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  couponTextInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    letterSpacing: 1,
  },
  applyBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 76,
  },
  applyBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    flex: 1,
  },
  availableLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 20,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  couponCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  couponCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '04',
  },
  couponCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
  },
  couponCardLeft: {
    flex: 1,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  couponCode: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  couponName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
    marginTop: 3,
  },
  couponDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  applyChip: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    alignSelf: 'center',
  },
  applyChipApplied: {
    backgroundColor: COLORS.primary,
  },
  applyChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  applyChipTextApplied: {
    color: '#FFF',
  },
  couponDivider: {
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 14,
  },
  couponCardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    paddingTop: 10,
    gap: 10,
  },
  couponMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  couponMetaText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyOffers: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyOffersText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});