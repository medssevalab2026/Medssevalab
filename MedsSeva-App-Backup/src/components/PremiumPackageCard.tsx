import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../theme/theme';
interface HealthPackage {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  categoryId: string;
  price: number;
  oldPrice: number;
  discount: string;
  parametersCount: number;
  badge: string;
  homeCollection: boolean;
  testsIncluded: { test: { name: string } }[];
}
import { addToCart } from '../store/slices/cartSlice';

const { width } = Dimensions.get('window');

interface Props {
  packageData: HealthPackage;
  horizontal?: boolean;
  onPress?: () => void;
}

export function PremiumPackageCard({ packageData, horizontal = false, onPress }: Props) {
  const router = useRouter();
  const dispatch = useDispatch();

  const handleBookNow = () => {
    dispatch(addToCart({
      id: packageData.id,
      itemType: 'package',
      name: packageData.name,
      price: packageData.oldPrice,
      discountedPrice: packageData.price,
      homeCollection: packageData.homeCollection,
      quantity: 1,
    }));
    router.push('/checkout/cart');
  };

  return (
    <View style={[styles.card, horizontal && styles.horizontalCard]}>
      
      {/* Header Row: Category & Badge */}
      <View style={styles.headerRow}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>
            {typeof packageData.category === 'object' ? (packageData.category as any).name : packageData.category}
          </Text>
        </View>
        {packageData.badge && (
          <LinearGradient 
            colors={['#F59E0B', '#D97706']} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 1 }}
            style={styles.accentBadge}
          >
            <Text style={styles.accentBadgeText}>{packageData.badge}</Text>
          </LinearGradient>
        )}
      </View>

      {/* Package Title and Subtitle */}
      <View style={styles.infoContainer}>
        <Text style={styles.packageName} numberOfLines={1}>{packageData.name}</Text>
        <Text style={styles.packageSubtitle}>{packageData.subtitle}</Text>
      </View>

      {/* Parameters Count and Collection Status */}
      <View style={styles.statsRow}>
        <View style={styles.statTag}>
          <MaterialCommunityIcons name="flask-empty-outline" size={14} color={COLORS.primary} />
        <Text style={styles.statTagText}>{packageData.parametersCount} Parameters</Text>
        </View>
        {packageData.homeCollection && (
          <View style={[styles.statTag, { backgroundColor: '#ECFDF5' }]}>
            <MaterialCommunityIcons name="home-plus-outline" size={14} color="#10B981" />
            <Text style={[styles.statTagText, { color: '#059669' }]}>Home Sample</Text>
          </View>
        )}
      </View>

      {/* Included Tests Scrolling Tray */}
      <View style={styles.trayContainer}>
        <Text style={styles.trayLabel}>Includes:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.testTray} nestedScrollEnabled>
          {packageData.testsIncluded?.map((t: any, index: number) => {
            const testName = typeof t === 'string' ? t : t?.test?.name || 'Test';
            return (
              <View key={index} style={styles.testChip}>
                <Text style={styles.testChipText} numberOfLines={1}>{testName}</Text>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Horizontal Divider */}
      <View style={styles.divider} />

      {/* Footer Segment: Pricing and CTAs */}
      <View style={styles.footer}>
        <View style={styles.priceBlock}>
          <View style={styles.row}>
            <Text style={styles.priceLabel}>₹{packageData.price}</Text>
            <View style={styles.discountPill}>
              <Text style={styles.discountPillText}>{packageData.discount}</Text>
            </View>
          </View>
          <Text style={styles.oldPriceLabel}>₹{packageData.oldPrice}</Text>
        </View>

        <View style={styles.ctaGroup}>
          <TouchableOpacity 
            style={styles.detailButton} 
            onPress={onPress || (() => router.push(`/package/${packageData.id}`))}
          >
            <Text style={styles.detailBtnText}>Details</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.9} onPress={handleBookNow}>
            <LinearGradient 
              colors={[COLORS.primary, '#14B8A6']} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 1 }}
              style={styles.bookButton}
            >
              <Text style={styles.bookBtnText}>Book</Text>
              <MaterialCommunityIcons name="arrow-right" size={14} color="#FFF" style={{ marginLeft: 4 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    padding: 18,
    marginBottom: 16,
    ...SHADOWS.soft,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.08,
    elevation: 3,
  },
  horizontalCard: {
    width: width * 0.86,
    marginRight: 16,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: 'rgba(0, 109, 111, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  accentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  accentBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  infoContainer: {
    marginBottom: 12,
  },
  packageName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textDark,
    fontWeight: 'bold',
    fontSize: 17,
  },
  packageSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  statTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 8,
  },
  statTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 4,
  },
  trayContainer: {
    marginBottom: 16,
  },
  trayLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  testTray: {
    flexDirection: 'row',
  },
  testChip: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    justifyContent: 'center',
  },
  testChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceBlock: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  discountPill: {
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  discountPillText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.warning,
  },
  oldPriceLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
    marginTop: 1,
  },
  ctaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
  },
  detailBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    ...SHADOWS.soft,
    shadowColor: '#14B8A6',
    shadowOpacity: 0.3,
    elevation: 3,
  },
  bookBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
