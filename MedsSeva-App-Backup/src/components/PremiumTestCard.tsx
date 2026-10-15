import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { useRouter } from 'expo-router';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../theme/theme';
import { addToCart } from '../store/slices/cartSlice';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface PremiumTestCardProps {
  test: any;
  onPress: () => void;
  horizontal?: boolean;
}

export const PremiumTestCard: React.FC<PremiumTestCardProps> = ({ test, onPress, horizontal = false }) => {
  const dispatch = useDispatch();
  const router = useRouter();

  const discountPercent = Math.round(((test.price - test.discountedPrice) / test.price) * 100);

  const handleBookNow = () => {
    dispatch(addToCart({
      id: test.id,
      itemType: 'test',
      name: test.name,
      price: test.price,
      discountedPrice: test.discountedPrice,
      homeCollection: test.homeCollection ?? true,
      quantity: 1,
    }));
    router.push('/checkout/cart');
  };

  return (
    <View style={[styles.card, horizontal && styles.horizontalCard]}>
      <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.topSection}>
        {/* Tag Header: Category & Report Duration */}
        <View style={styles.tagHeader}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {typeof test.category === 'object' ? test.category.name : test.category}
            </Text>
          </View>
          {test.reportTime && (
            <View style={styles.reportBadge}>
              <MaterialCommunityIcons name="clock-outline" size={12} color="#64748B" style={{ marginRight: 3 }} />
              <Text style={styles.reportTime}>{test.reportTime}</Text>
            </View>
          )}
        </View>

        {/* Test Identity Info */}
        <Text style={styles.testName} numberOfLines={1}>{test.name}</Text>
        <Text style={styles.description} numberOfLines={1}>{test.description}</Text>
      </TouchableOpacity>

      {/* Soft Professional Spacer Divider */}
      <View style={styles.divider} />

      {/* Integrated Bottom Row: Price block (left) + CTA block (right) */}
      <View style={styles.actionsRow}>
        <View style={styles.priceBlock}>
          <View style={styles.amountRow}>
            <Text style={styles.price}>₹{test.discountedPrice}</Text>
            <View style={styles.discountBadge}>
              <Text style={styles.discountPercent}>{discountPercent}% OFF</Text>
            </View>
          </View>
          <Text style={styles.oldPrice}>MRP: ₹{test.price}</Text>
        </View>

        <TouchableOpacity activeOpacity={0.9} onPress={handleBookNow}>
          <LinearGradient 
            colors={[COLORS.primary, '#14B8A6']} 
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bookBtn}
          >
            <Text style={styles.bookBtnText}>Book</Text>
            <MaterialCommunityIcons name="arrow-right" size={14} color="#FFF" style={{ marginLeft: 4 }} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    padding: 14,
    marginBottom: 14,
    ...SHADOWS.soft,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.06,
    elevation: 3,
  },
  horizontalCard: {
    width: width * 0.80,
    marginRight: 16,
    marginBottom: 10,
  },
  topSection: {
    flex: 1,
  },
  tagHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: 'rgba(0, 109, 111, 0.07)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  reportTime: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  testName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  description: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceBlock: {
    flex: 1,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textDark,
    marginRight: 6,
  },
  discountBadge: {
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountPercent: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.warning,
  },
  oldPrice: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    marginTop: 1,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    ...SHADOWS.soft,
    shadowColor: '#14B8A6',
    shadowOpacity: 0.25,
    elevation: 2,
  },
  bookBtnText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '800',
  },
});

