import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';


import { COLORS, TYPOGRAPHY } from '../../src/theme/theme';
import { showSuccess } from '../../src/store/toastStore';
import { RootState } from '../../src/store';
import { addToCart } from '../../src/store/slices/cartSlice';
import { PremiumBottomSheet } from '../../src/components/PremiumBottomSheet';
import { testService } from '../../src/services/testService';

export default function TestDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
const [isPrepSheetOpen, setPrepSheetOpen] = useState(false);
  const [isFaqSheetOpen, setFaqSheetOpen] = useState(false);

  const cartItem = useSelector((state: RootState) =>
    state.cart.items.find(i => i.id === (id as string) && i.itemType === 'test')
  );
  const cartQty = cartItem?.quantity ?? 0;

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const data = await testService.getTestById(id as string);
        setTest(data);
      } catch (error) {
        console.error("Failed to load test details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [id]);

if (loading) {
    return (
      <View style={[styles.container, styles.centerAll]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!test) {
    return (
      <View style={[styles.container, styles.centerAll]}>
        <Text style={TYPOGRAPHY.body}>Test not found.</Text>
      </View>
    );
  }
  const discountPercent = Math.round(((test.price - test.discountedPrice) / test.price) * 100);

const handleAddToCart = () => {
    dispatch(addToCart({
      id: test.id,
      itemType: 'test',
      name: test.name,
      price: test.price,
      discountedPrice: test.discountedPrice,
      homeCollection: test.homeCollection,
      quantity: 1
    }));
    showSuccess('Added to cart successfully');
  };
const handleBookNow = () => {
    dispatch(addToCart({
      id: test.id,
      itemType: 'test',
      name: test.name,
      price: test.price,
      discountedPrice: test.discountedPrice,
      homeCollection: test.homeCollection,
      quantity: 1
    }));
    router.push('/checkout/cart');
  };
 return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textLight} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Test Details</Text>
          <TouchableOpacity style={styles.cartButton} onPress={() => router.push('/checkout/cart')}>
            <MaterialCommunityIcons name="cart-outline" size={24} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScreenWrapper
        backgroundColor="#F8FAFC"
        contentContainerStyle={styles.scrollContent}
        bottomButton={
          <View style={styles.footerRow}>
         <TouchableOpacity style={styles.cartSecondaryButton} onPress={handleAddToCart}>
              <MaterialCommunityIcons name="cart-plus" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={styles.cartSecondaryButtonText}>
                {cartQty > 0 ? `Add to Cart (${cartQty})` : 'Add to Cart'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bookPrimaryButton} onPress={handleBookNow}>
              <Text style={styles.bookPrimaryButtonText}>Book Now</Text>
            </TouchableOpacity>
          </View>
        }
      >
        {/* Banner Card - Soft & Accessible Theme */}
        <View style={styles.mainCard}>
          <View style={styles.badgeRow}>
            {test.homeCollection && (
              <View style={styles.badge}>
                <MaterialCommunityIcons name="home-plus-outline" size={14} color={COLORS.success} />
                <Text style={styles.badgeText}> Home Collection Available</Text>
              </View>
            )}
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{typeof test.category === 'object' ? test.category.name : test.category}</Text>
            </View>
          </View>

          <Text style={styles.testName}>{test.name}</Text>
          
          <View style={styles.priceContainer}>
            <Text style={styles.offerPrice}>₹{test.discountedPrice}</Text>
            <Text style={styles.mrpPrice}>₹{test.price}</Text>
            <View style={styles.discountTag}>
              <Text style={styles.discountTagText}>{discountPercent}% OFF</Text>
            </View>
          </View>

          <Text style={styles.descriptionLabel}>Why is it required?</Text>
          <Text style={styles.description}>{test.whyRequired || test.description}</Text>

          <View style={styles.divider} />

          {/* Key Indicators Grid */}
          <View style={styles.indicatorsGrid}>
            <View style={styles.indicatorBox}>
              <MaterialCommunityIcons name="food-apple-outline" size={20} color={COLORS.primary} />
              <Text style={styles.indicatorLabel}>Fasting</Text>
              <Text style={styles.indicatorValue}>{test.fastingRequired ? 'Required' : 'No'}</Text>
            </View>
            <View style={styles.indicatorBox}>
              <MaterialCommunityIcons name="clock-fast" size={20} color={COLORS.primary} />
              <Text style={styles.indicatorLabel}>Report TAT</Text>
              <Text style={styles.indicatorValue}>{test.reportTime}</Text>
            </View>
            <View style={styles.indicatorBox}>
              <MaterialCommunityIcons name="test-tube" size={20} color={COLORS.primary} />
              <Text style={styles.indicatorLabel}>Sample</Text>
              <Text style={styles.indicatorValue}>Blood/Urine</Text>
            </View>
          </View>
        </View>

        {/* Parameters Section */}
        <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Parameters Included ({test.parameters?.length ?? 0})</Text>
          <Text style={styles.sectionSubtitle}>Names of the specific metrics tested</Text>
          
          <View style={styles.parametersList}>
             {/* We mock parameter names if not strictly available in the object for visual purposes */}
             {['Hemoglobin', 'RBC Count', 'WBC Count', 'Platelet Count', 'MCV', 'MCH'].map((param, index) => (
               <View key={index} style={styles.parameterItem}>
                 <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />
                 <Text style={styles.parameterText}>{param}</Text>
               </View>
             ))}
             {test.parameters > 6 && (
               <Text style={styles.andMoreText}>+ {test.parameters - 6} more parameters...</Text>
             )}
          </View>
        </View>

        {/* Action List Items */}
        <View style={styles.sectionCard}>
          <TouchableOpacity style={styles.actionListItem} onPress={() => setPrepSheetOpen(true)}>
            <View style={styles.actionListLeft}>
              <MaterialCommunityIcons name="information-outline" size={24} color={COLORS.primary} />
              <Text style={styles.actionListTitle}>Preparation Guidelines</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionListItem, { borderBottomWidth: 0, paddingBottom: 0 }]} onPress={() => setFaqSheetOpen(true)}>
            <View style={styles.actionListLeft}>
              <MaterialCommunityIcons name="frequently-asked-questions" size={24} color={COLORS.primary} />
              <Text style={styles.actionListTitle}>Frequently Asked Questions</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
</ScreenWrapper>

      {/* Preparation Bottom Sheet */}
      <PremiumBottomSheet visible={isPrepSheetOpen} onClose={() => setPrepSheetOpen(false)} height={400}>
        <Text style={styles.sheetTitle}>Preparation Instructions</Text>
        <View style={styles.prepContainer}>
          <MaterialCommunityIcons name={test.fastingRequired ? "food-off" : "food-apple"} size={48} color={COLORS.primary} />
          <Text style={styles.prepStatusText}>
            {test.fastingRequired ? 'Fasting Required' : 'No Special Preparation'}
          </Text>
          <Text style={styles.prepDetailsText}>
            {test.fastingRequired 
              ? 'Please do not consume any food or beverages (other than water) for 10-12 hours prior to the test for accurate results.' 
              : 'You can consume your normal diet. Ensure you stay hydrated before your sample collection.'}
          </Text>
        </View>
        <TouchableOpacity style={styles.gotItButton} onPress={() => setPrepSheetOpen(false)}>
          <Text style={styles.gotItText}>Understood</Text>
        </TouchableOpacity>
      </PremiumBottomSheet>

    
      <PremiumBottomSheet visible={isFaqSheetOpen} onClose={() => setFaqSheetOpen(false)} height={500}>
        <Text style={styles.sheetTitle}>Frequently Asked Questions</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Is home collection safe?</Text>
            <Text style={styles.faqAnswer}>Yes, our phlebotomists follow strict hygiene and WHO guidelines using sealed, single-use kits.</Text>
          </View>
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>When will I get my reports?</Text>
            <Text style={styles.faqAnswer}>Your digital reports will be available on the app within {test.reportTime} after sample collection.</Text>
          </View>
        </ScrollView>
      </PremiumBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
container: { flex: 1, backgroundColor: '#F8FAFC' },
  centerAll: { justifyContent: 'center', alignItems: 'center' },
  headerSafeArea: { backgroundColor: COLORS.primary },
  header: {
    paddingBottom: 20, paddingHorizontal: 20, paddingTop: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  backButton: { padding: 4 },
  headerTitle: { ...TYPOGRAPHY.h2, color: COLORS.textLight },
  cartButton: { padding: 4 },
scrollContent: { padding: 16 },
  
  // Soft & Accessible Cards
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.successLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  badgeText: { ...TYPOGRAPHY.caption, color: COLORS.success, fontWeight: 'bold' },
  categoryBadge: { backgroundColor: '#E0F2FE', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  categoryBadgeText: { ...TYPOGRAPHY.caption, color: COLORS.primary, fontWeight: 'bold', textTransform: 'uppercase' },
  
  testName: { ...TYPOGRAPHY.h1, color: COLORS.textDark, marginBottom: 12 },
  
  priceContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  offerPrice: { ...TYPOGRAPHY.h1, color: COLORS.textDark, marginRight: 12 },
  mrpPrice: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, textDecorationLine: 'line-through', marginRight: 12 },
  discountTag: { backgroundColor: COLORS.discountGreen, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  discountTagText: { fontSize: 12, color: '#fff', fontWeight: 'bold' },

  descriptionLabel: { ...TYPOGRAPHY.subtitle, color: COLORS.textDark, fontWeight: '600', marginBottom: 8 },
  description: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, lineHeight: 22 },

  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 20 },

  indicatorsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  indicatorBox: { flex: 1, alignItems: 'center', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, marginHorizontal: 4 },
  indicatorLabel: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 4 },
  indicatorValue: { ...TYPOGRAPHY.caption, color: COLORS.textDark, fontWeight: 'bold', marginTop: 2 },

  sectionTitle: { ...TYPOGRAPHY.h3, color: COLORS.textDark, marginBottom: 4 },
  sectionSubtitle: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginBottom: 16 },
  
  parametersList: { marginTop: 8 },
  parameterItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  parameterText: { ...TYPOGRAPHY.body, color: COLORS.textDark, marginLeft: 12 },
  andMoreText: { ...TYPOGRAPHY.caption, color: COLORS.primary, marginTop: 8, fontStyle: 'italic' },

  actionListItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  actionListLeft: { flexDirection: 'row', alignItems: 'center' },
  actionListTitle: { ...TYPOGRAPHY.body, color: COLORS.textDark, fontWeight: '600', marginLeft: 16 },

footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cartSecondaryButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: COLORS.primary,
    paddingVertical: 16, borderRadius: 12, marginRight: 8,
  },
  cartSecondaryButtonText: { ...TYPOGRAPHY.subtitle, color: COLORS.primary, fontWeight: 'bold' },
  bookPrimaryButton: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 12, marginLeft: 8,
  },
  bookPrimaryButtonText: { ...TYPOGRAPHY.subtitle, color: '#FFFFFF', fontWeight: 'bold' },

  // Sheets
  sheetTitle: { ...TYPOGRAPHY.h2, color: COLORS.textDark, marginBottom: 24 },
  prepContainer: { alignItems: 'center', paddingVertical: 20 },
  prepStatusText: { ...TYPOGRAPHY.h3, color: COLORS.textDark, marginTop: 16, marginBottom: 12 },
  prepDetailsText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24 },
  gotItButton: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 'auto', marginBottom: 40 },
  gotItText: { ...TYPOGRAPHY.subtitle, color: COLORS.textLight, fontWeight: 'bold' },
  faqItem: { marginBottom: 24 },
  faqQuestion: { ...TYPOGRAPHY.subtitle, color: COLORS.textDark, fontWeight: 'bold', marginBottom: 8 },
  faqAnswer: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, lineHeight: 22 }
});
